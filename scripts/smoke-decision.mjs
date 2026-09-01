import {
  loadAuthPreset,
  loadScrapingDemo,
  rerankDecisionOptions,
  setDecisionContext,
  simulateFutureScenario,
  applyHumanPreferenceOverride,
  setPriorityWeight,
  appendToolLog,
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
console.log("Score gap vs math leader:", overrideResult.override.scoreGap);

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

console.log("PASS: Slice A decision engine smoke tests");
