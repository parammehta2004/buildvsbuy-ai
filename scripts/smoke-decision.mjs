import {
  loadAuthPreset,
  loadScrapingDemo,
  createDecision,
  inferDemoPreset,
  rerankDecisionOptions,
  setDecisionContext,
  simulateFutureScenario,
  applyHumanPreferenceOverride,
  setPriorityWeight,
  solveWinningConditions,
  appendToolLog,
  addOption,
  exportDecisionState,
  importDecisionState,
  getSnapshot,
} from "../src/decision.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function rankIds(snapshot) {
  return snapshot.ranking.map((item) => item.id);
}

console.log("Smoke: load Auth preset");
const initial = loadAuthPreset();
assert(initial.options.length === 4, "Auth preset should seed 4 options");
assert(initial.rankingCurrent === false, "Ranking should start stale");

console.log("Smoke: rerank with vibe skill");
const ranked = rerankDecisionOptions();
assert(ranked.rankingCurrent === true, "Ranking should be current after rerank");
const ids = rankIds(ranked);
console.log("Ranking order:", ids.join(" > "));
assert(ids[0] === "adopt", `Adopt should lead on vibe profile per locked §6.2/§6.3, got leader: ${ids[0]}`);
assert(ids[2] === "build", `Build should rank 3rd on vibe profile, got: ${ids.join(", ")}`);
assert(ids[3] === "buy", `Buy should rank last on vibe profile, got: ${ids.join(", ")}`);
assert(
  ["hybrid"].includes(ids[1]),
  `Hybrid should rank 2nd on vibe profile, got: ${ids.join(", ")}`,
);

console.log("Smoke: redundant weight write should not flip stale");
const beforeStale = setPriorityWeight({ criterion: "time_to_prototype", weight: 8 });
assert(beforeStale.changed === false, "Redundant weight write should no-op");
assert(beforeStale.rankingCurrent === true, "Redundant weight write should not mark stale");

console.log("Smoke: real weight change marks stale");
const changed = setPriorityWeight({ criterion: "time_to_prototype", weight: 9 });
assert(changed.changed === true, "Weight change should report changed=true");
assert(changed.rankingCurrent === false, "Weight change should mark ranking stale");
const speedBiased = rerankDecisionOptions();
const speedIds = rankIds(speedBiased);
console.log("Speed-biased ranking (TTP=9):", speedIds.join(" > "));
assert(
  speedIds.at(-1) === "build",
  `Speed-biased Act 1 (TTP=9) should drop Build to last, got: ${speedIds.join(", ")}`,
);

console.log("Smoke: setDecisionContext soc2 + 50k+");
setDecisionContext({ scale_band: "50k+", compliance_tier: "soc2", is_core_ip: true });
assert(getSnapshot().rankingCurrent === false, "Context change should mark ranking stale");
rerankDecisionOptions();

const simulation = simulateFutureScenario({
  scenario_name: "SOC2 at 50k+ MRU",
  scale_band: "50k+",
  compliance_tier: "soc2",
});
assert(simulation.baseline_preserved === true, "Simulation should not mutate baseline options");
assert(simulation.projected_ranking.length === 4, "Simulation should project all options");
console.log("Projected leader:", simulation.leader?.id);

console.log("Smoke: apply override with pin + liabilities");
const overrideResult = applyHumanPreferenceOverride({
  override_reason: "Auth is core IP — we must own tenant isolation.",
  pin_recommendation: true,
  heavily_favored_criterion: "strategic_learning",
  tolerance_level: "high",
});
assert(overrideResult.override.active === true, "Override should be active");
assert(overrideResult.override.pinnedOptionId === "build", "Core IP pin should favor build");
assert(overrideResult.liabilities.length >= 3, "Override should populate at least 3 liabilities");
assert(overrideResult.liabilities.length <= 5, "Override should cap liabilities at 5");
const cannedTitle = /Clerk|Firecrawl|Selector & layout rot|Anti-bot arms race|Session store operations|Security patch burden|MRU overage|Lambda worker/i;
for (const row of overrideResult.liabilities) {
  assert(
    /^(metric|filler)-/.test(row.id),
    `Liability id should be metric-/filler-, got ${row.id}`,
  );
  assert(
    !cannedTitle.test(row.title),
    `Liability title should not be vendor canned copy, got ${row.title}`,
  );
  assert(
    row.description.includes(overrideResult.pinned_option.name),
    `Liability description should interpolate option name, got ${row.description}`,
  );
}
const authLiabilityIds = overrideResult.liabilities.map((row) => row.id);
assert(
  authLiabilityIds.includes("metric-high-security"),
  `Auth Build pin should include high SCR, got ${authLiabilityIds.join(", ")}`,
);
assert(
  authLiabilityIds.includes("metric-high-mdo"),
  `Auth Build pin should include high MDO, got ${authLiabilityIds.join(", ")}`,
);
assert(
  authLiabilityIds.includes("metric-compliance-evidence"),
  `Auth Build pin at SOC2 should include compliance evidence, got ${authLiabilityIds.join(", ")}`,
);
console.log("Score gap vs math leader:", overrideResult.override.scoreGap);

console.log("Smoke: HIPAA+build ledger must not duplicate compliance rows");
setDecisionContext({ compliance_tier: "hipaa", is_core_ip: true });
rerankDecisionOptions();
const hipaaPin = applyHumanPreferenceOverride({
  override_reason: "HIPAA build ownership.",
  pin_recommendation: true,
});
const hipaaIds = hipaaPin.liabilities.map((row) => row.id);
assert(
  hipaaIds.includes("metric-hipaa-build"),
  `HIPAA+build should include hipaa-build row, got ${hipaaIds.join(", ")}`,
);
assert(
  !hipaaIds.includes("metric-compliance-evidence"),
  `HIPAA+build must not also emit generic compliance-evidence, got ${hipaaIds.join(", ")}`,
);

appendToolLog({
  tool: "smoke_test",
  input: { action: "validate_slice_a" },
  summary: "Slice A smoke harness passed",
});
assert(getSnapshot().toolLog.length === 1, "Tool log should accept appendToolLog entries");

console.log("Smoke: load Scraping preset");
const scraping = loadScrapingDemo();
assert(scraping.options.length === 4, "Scraping preset should seed 4 options");
assert(scraping.rankingCurrent === true, "loadScrapingDemo should rerank");
assert(
  scraping.options.every((option) => option.estimate === false),
  "Scraping preset options should have estimate: false",
);
const scrapingIds = rankIds(scraping);
console.log("Scraping neutral ranking:", scrapingIds.join(" > "));
// Locked neutral order (vibe skill, default weights, Solo · 1k–10k) — distinct from Auth (adopt-led).
// Scraping story: managed API wins on speed + low ops; self-host Crawl4AI trails on solo vibe maintenance.
assert(
  scrapingIds[0] === "buy",
  `Scraping neutral leader should be buy, got: ${scrapingIds.join(", ")}`,
);
assert(
  scrapingIds[1] === "hybrid",
  `Scraping neutral 2nd should be hybrid, got: ${scrapingIds.join(", ")}`,
);
assert(
  scrapingIds[2] === "build",
  `Scraping neutral 3rd should be build, got: ${scrapingIds.join(", ")}`,
);
assert(
  scrapingIds[3] === "adopt",
  `Scraping neutral last should be adopt, got: ${scrapingIds.join(", ")}`,
);

console.log("Smoke: Act 2 Scraping HIPAA+50k+ leader flip");
loadScrapingDemo();
const sim = simulateFutureScenario({
  scenario_name: "HIPAA at 50k+ MRU",
  scale_band: "50k+",
  compliance_tier: "hipaa",
});
assert(sim.projected_ranking.length === 4, "Projected ranking should have 4 options");
const projectedLeader = sim.projected_ranking[0].id;
console.log("Scraping projected leader under HIPAA+50k+:", projectedLeader);
// Locked Act 2 drama beat: HIPAA + 50k+ must project Hybrid (Playwright+Bright Data), not Firecrawl.
assert(
  projectedLeader === "hybrid",
  `Act 2 Scraping HIPAA+50k+ projected leader must be hybrid, got ${projectedLeader}`,
);

console.log("Smoke: simulate returns formula assumptions");
assert(Array.isArray(sim.assumptions) && sim.assumptions.length > 0, "simulate should return assumptions[]");
assert(
  sim.assumptions.some((line) => /50k\+|HIPAA|usage tier/i.test(line)),
  "assumptions should document the 50k+ / HIPAA stress math",
);

console.log("Smoke: simulate team_size_change scales self-run maintenance");
loadScrapingDemo();
const teamSim = simulateFutureScenario({
  scenario_name: "Team growth +2",
  team_size_change: 2,
});
assert(
  teamSim.assumptions.some((line) => /team_size_change 2/.test(line)),
  "team_size_change=2 should be reflected in assumptions for build/hybrid",
);
assert(
  teamSim.assumptions.some((line) => /vendor absorbs staffing/.test(line)),
  "vendor options should report team_size_change has no effect",
);

console.log("Smoke: solve_winning_conditions returns computed flip_levers");
loadAuthPreset();
rerankDecisionOptions();
const solve = solveWinningConditions({ target_option_id: "buy" });
assert(Array.isArray(solve.levers) && solve.levers.length > 0, "solve should return levers");
assert(typeof solve.score_gap === "number" && solve.score_gap >= 0, "score_gap should be >= 0");
assert(Array.isArray(solve.flip_levers), "solve should return flip_levers array");
for (const lever of solve.flip_levers) {
  assert(
    typeof lever.required_weight === "number" && lever.required_weight >= 0 && lever.required_weight <= 10,
    `flip_lever required_weight must be 0-10, got ${lever.required_weight}`,
  );
  assert(lever.direction === "raise" || lever.direction === "lower", "flip_lever direction must be raise|lower");
}
console.log("Solve flip_levers count:", solve.flip_levers.length);
assert(Array.isArray(solve.near_misses), "solve should return near_misses");
if (solve.flip_levers.length === 0) {
  assert(solve.near_misses.length > 0, "when no flip exists, near_misses must be non-empty");
  assert(
    solve.levers.some((line) => /Closest:/.test(line)),
    "empty flip should surface a Closest: near-miss lever",
  );
  const miss = solve.near_misses[0];
  assert(typeof miss.rank === "number" && miss.rank >= 2, "near-miss rank should be >= 2");
  assert(typeof miss.score_gap === "number" && miss.score_gap >= 0, "near-miss score_gap should be >= 0");
}

console.log("Smoke: add_option preserves sources");
createDecision({
  title: "Custom fixture",
  problem_statement: "Neither auth nor scraping — blank slate for add_option.",
  preset: "custom",
  org_context: "solo",
  skill_level: "mid",
});
addOption({
  id: "custom-src",
  name: "Custom with sources",
  type: "hybrid",
  prototype_time_hours: 20,
  monthly_cash_cost: 10,
  monthly_maintenance_hours: 1,
  customization_score: 6,
  security_risk_score: 5,
  learning_value_score: 4,
  vendor_lockin_score: 4,
  estimate: true,
  sources: ["Author estimate for custom fixture"],
});
const added = getSnapshot().options.find((item) => item.id === "custom-src");
assert(added?.sources?.[0] === "Author estimate for custom fixture", "add_option should keep sources");

console.log("Smoke: export → import preserves Act 3 + simulation");
loadScrapingDemo();
setDecisionContext({ is_core_ip: true });
rerankDecisionOptions();
simulateFutureScenario({
  scenario_name: "HIPAA at 50k+ MRU",
  scale_band: "50k+",
  compliance_tier: "hipaa",
});
applyHumanPreferenceOverride({
  override_reason: "Scraping pipeline is core IP.",
  pin_recommendation: true,
});
const before = getSnapshot();
assert(before.override.active === true, "pre-export override should be active");
assert(before.override.pinnedOptionId === "build", "pre-export pin should be build");
assert(before.lastSimulation?.scenario_name === "HIPAA at 50k+ MRU", "pre-export simulation should exist");
const exported = exportDecisionState();
importDecisionState(exported);
const after = getSnapshot();
assert(after.override.active === true, "import should restore override");
assert(after.override.pinnedOptionId === "build", "import should restore pinned Build");
assert(after.liabilities.length === before.liabilities.length, "import should restore liabilities");
assert(after.lastSimulation?.scenario_name === "HIPAA at 50k+ MRU", "import should restore lastSimulation");
assert(
  Array.isArray(after.lastSimulation?.assumptions) && after.lastSimulation.assumptions.length > 0,
  "import should restore simulation assumptions",
);
assert(rankIds(after).join(">") === rankIds(before).join(">"), "import should preserve ranking order");

console.log("Smoke: omit preset + auth language infers Auth seed (Prompt 1 path)");
assert(
  inferDemoPreset(
    "Authentication Strategy: Build vs Buy",
    "Solo founder shipping auth in 2 weeks for 10k users. Build vs Buy. Clerk?",
  ) === "auth",
  "inferDemoPreset should detect auth from Prompt-1-like text",
);
const inferred = createDecision({
  title: "Authentication Strategy: Build vs Buy",
  problem_statement: "Solo founder shipping auth in 2 weeks for 10k users. Build vs Buy.",
  org_context: "solo",
  skill_level: "mid",
});
assert(inferred.preset === "auth", "create_decision without preset should infer auth");
assert(inferred.options.length === 4, "inferred auth should seed 4 options");
assert(
  inferred.options.some((item) => item.id === "hybrid") &&
    inferred.options.some((item) => item.id === "adopt"),
  "inferred auth must include Adopt + Hybrid seeds",
);
const blankCustom = createDecision({
  title: "Authentication Strategy: Build vs Buy",
  problem_statement: "Solo founder shipping auth — Clerk?",
  preset: "custom",
});
assert(blankCustom.preset === "custom", "explicit custom must not infer");
assert(blankCustom.options.length === 0, "explicit custom stays blank");

console.log("PASS: Slice A decision engine smoke tests");
