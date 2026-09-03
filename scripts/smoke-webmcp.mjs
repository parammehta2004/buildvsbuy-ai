import { buildDecisionTools, runDecisionTool } from "../src/webmcp.js";
import { getSnapshot } from "../src/decision.js";

const EXPECTED_TOOLS = [
  "create_decision",
  "set_decision_context",
  "add_option",
  "set_priority_weight",
  "rerank_decision_options",
  "compare_decision_options",
  "simulate_future_scenario",
  "solve_winning_conditions",
  "apply_human_preference_override",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function rankIds(snapshot) {
  return snapshot.ranking.map((item) => item.id);
}

const tools = Object.fromEntries(buildDecisionTools().map((tool) => [tool.name, tool]));

console.log("Smoke: verify 9 tool definitions");
for (const name of EXPECTED_TOOLS) {
  assert(tools[name], `Missing tool definition: ${name}`);
  assert(
    tools[name].inputSchema && typeof tools[name].inputSchema === "object",
    `${name} must have a non-empty inputSchema object`,
  );
  assert(typeof tools[name].execute === "function", `${name} must have execute`);
}

async function runFlow() {
  // Engine-math assertions run on the clean 4-option Auth preset, where the
  // spec-locked ranking order and the TTP crossover are well-defined. The
  // custom fixture (custom-x) is added afterwards and only its wiring is
  // checked — never its rank — so perturbing its metrics cannot break this.
  console.log("Smoke: 1 create_decision");
  const createText = (await tools.create_decision.execute({ preset: "auth" })).content[0].text;
  assert(
    createText.includes("BUILDVSBUY AGENT BRIEFING"),
    "Agent create_decision must inject AGENT_BRIEFING preamble",
  );
  let snap = getSnapshot();
  assert(snap.options.length === 4, "Auth preset should seed 4 options");
  assert(snap.rankingCurrent === false, "Ranking should start stale");

  console.log("Smoke: 2 rerank_decision_options (clean preset, neutral weights)");
  await tools.rerank_decision_options.execute({});
  snap = getSnapshot();
  assert(snap.rankingCurrent === true, "Ranking should be current after rerank");
  const neutralIds = rankIds(snap);
  console.log("Neutral ranking:", neutralIds.join(" > "));
  assert(neutralIds.length === 4, `Clean preset should rank 4 options, got ${neutralIds.length}`);
  assert(
    neutralIds.indexOf("adopt") < neutralIds.indexOf("hybrid") &&
      neutralIds.indexOf("hybrid") < neutralIds.indexOf("build") &&
      neutralIds.indexOf("build") < neutralIds.indexOf("buy"),
    `Preset options must keep locked relative order adopt>hybrid>build>buy, got: ${neutralIds.join(", ")}`,
  );

  console.log("Smoke: 3 set_priority_weight TTP=9 (auto-reranks)");
  const weightResult = await tools.set_priority_weight.execute({
    criterion: "time_to_prototype",
    weight: 9,
  });
  assert(weightResult.content[0].text.includes("Changed"), "Weight change should report changed");
  assert(weightResult.content[0].text.includes("Auto-reranked"), "Weight change must auto-rerank");
  snap = getSnapshot();
  assert(snap.rankingCurrent === true, "Auto-rerank after weight must leave ranking current");
  const speedIds = rankIds(snap);
  console.log("Speed-biased ranking (auto):", speedIds.join(" > "));
  assert(
    speedIds.indexOf("build") > speedIds.indexOf("buy"),
    `Speed-bias (TTP=9) must drop build below buy — the vibe-trap crossover, got: ${speedIds.join(", ")}`,
  );
  assert(
    snap.toolLog.some(
      (entry) => entry.tool === "rerank_decision_options" && /Auto-reranked/.test(entry.summary),
    ),
    "Tool log must show auto-rerank after weight change",
  );

  console.log("Smoke: 4 explicit rerank still idempotent");
  await tools.rerank_decision_options.execute({});
  snap = getSnapshot();
  assert(rankIds(snap).join(">") === speedIds.join(">"), "Explicit rerank should keep speed-biased order");

  console.log("Smoke: 5 add_option REFUSED on seeded auth (Prompt 2 invent path)");
  const addRefuseText = (
    await tools.add_option.execute({
      id: "custom-x",
      name: "Custom — experimental",
      type: "hybrid",
      prototype_time_hours: 30,
      monthly_cash_cost: 10,
      monthly_maintenance_hours: 2,
      customization_score: 6,
      security_risk_score: 6,
      learning_value_score: 4,
      vendor_lockin_score: 4,
      estimate: true,
    })
  ).content[0].text;
  assert(addRefuseText.includes("REFUSED"), "add_option on auth must be refused");
  snap = getSnapshot();
  assert(snap.options.length === 4, "Refusal must not add a 5th option");
  assert(snap.preset === "auth", "Refusal must keep auth preset");

  console.log("Smoke: 5b create_decision blank/speed follow-up REFUSED while auth loaded");
  const wipeRefuseText = (
    await tools.create_decision.execute({
      title: "Rapid Prototyping Strategy",
      problem_statement:
        "Selecting an approach for rapid prototyping where speed is the primary constraint.",
      org_context: "startup",
      skill_level: "vibe",
    })
  ).content[0].text;
  assert(wipeRefuseText.includes("REFUSED"), "Prompt-2 wipe create_decision must be refused");
  assert(wipeRefuseText.includes("set_priority_weight"), "Refusal must point at set_priority_weight");
  snap = getSnapshot();
  assert(snap.preset === "auth", "Wipe refusal must keep auth");
  assert(snap.options.length === 4, "Wipe refusal must keep 4 seeded options");

  console.log("Smoke: 5c add_option works on custom via human create (agent cannot wipe seeded demo)");
  await runDecisionTool(
    "create_decision",
    {
      title: "Custom fixture",
      problem_statement: "Blank slate for estimate wiring",
      preset: "custom",
      org_context: "solo",
    },
    { source: "human" },
  );
  await tools.add_option.execute({
    id: "custom-x",
    name: "Custom — experimental",
    type: "hybrid",
    prototype_time_hours: 30,
    monthly_cash_cost: 10,
    monthly_maintenance_hours: 2,
    customization_score: 6,
    security_risk_score: 6,
    learning_value_score: 4,
    vendor_lockin_score: 4,
    estimate: true,
  });
  snap = getSnapshot();
  assert(snap.preset === "custom", "Human create custom should load blank slate");
  assert(snap.options.length === 1, "custom should have one added option");
  const custom = snap.options.find((item) => item.id === "custom-x");
  assert(custom?.estimate === true, "custom-x should have estimate=true");
  assert(snap.rankingCurrent === false, "add_option should mark ranking stale");

  // Restore auth for remaining Act tooling checks (compare/simulate/override need seeded ids).
  await runDecisionTool("create_decision", { preset: "auth", org_context: "solo" }, { source: "human" });
  await tools.rerank_decision_options.execute({});
  await tools.set_priority_weight.execute({ criterion: "time_to_prototype", weight: 9 });
  await tools.rerank_decision_options.execute({});

  console.log("Smoke: 6 compare_decision_options");
  const compareResult = await tools.compare_decision_options.execute({
    first_option_id: "build",
    second_option_id: "adopt",
  });
  assert(compareResult.content[0].text.includes("Tradeoffs"), "Compare should return tradeoffs");
  snap = getSnapshot();
  assert(snap.lastInsight?.tool === "compare_decision_options", "lastInsight should be set after compare");
  assert(
    snap.lastInsight?.payload && typeof snap.lastInsight.payload === "object" && "winner" in snap.lastInsight.payload,
    "lastInsight payload should include compare winner",
  );

  console.log("Smoke: 7 set_decision_context");
  await tools.set_decision_context.execute({
    scale_band: "50k+",
    compliance_tier: "soc2",
    is_core_ip: true,
  });
  snap = getSnapshot();
  assert(snap.rankingCurrent === false, "Context change should mark ranking stale");

  console.log("Smoke: 8 simulate_future_scenario");
  const simText = (
    await tools.simulate_future_scenario.execute({
      scenario_name: "SOC2 at 50k+ MRU",
      scale_band: "50k+",
      compliance_tier: "soc2",
    })
  ).content[0].text;
  assert(simText.includes("baseline_preserved"), "Simulation result should include baseline_preserved");
  const simParsed = JSON.parse(simText.split("\n\n").pop());
  assert(simParsed.baseline_preserved === true, "Simulation should preserve baseline");
  assert(simParsed.projected_ranking.length === 4, "Projected ranking should include 4 seeded options");
  assert(simParsed.leader !== null, "Projected leader should be non-null");
  snap = getSnapshot();
  assert(snap.lastInsight?.tool === "simulate_future_scenario", "lastInsight should be set after simulate");

  console.log("Smoke: 9 solve_winning_conditions");
  const solveText = (
    await tools.solve_winning_conditions.execute({ target_option_id: "build" })
  ).content[0].text;
  const solveParsed = JSON.parse(solveText.split("\n\n").pop());
  assert(Array.isArray(solveParsed.levers) && solveParsed.levers.length > 0, "Solve should return levers");
  assert(typeof solveParsed.score_gap === "number" && solveParsed.score_gap >= 0, "score_gap should be >= 0");
  snap = getSnapshot();
  assert(snap.lastInsight?.tool === "solve_winning_conditions", "lastInsight should be set after solve");
  assert(
    Array.isArray(snap.lastInsight?.payload?.levers) && snap.lastInsight.payload.levers.length > 0,
    "lastInsight payload should include solve levers",
  );

  console.log("Smoke: 10 apply_human_preference_override");
  const overrideText = (
    await tools.apply_human_preference_override.execute({
      override_reason: "Auth is core IP — we own tenant isolation.",
      pin_recommendation: true,
      heavily_favored_criterion: "strategic_learning",
      tolerance_level: "high",
    })
  ).content[0].text;
  const overrideParsed = JSON.parse(overrideText.split("\n\n").pop());
  assert(overrideParsed.override.active === true, "Override should be active");
  assert(overrideParsed.override.pinnedOptionId === "build", "Core IP pin should favor build");
  assert(
    overrideParsed.liabilities.length >= 3 && overrideParsed.liabilities.length <= 5,
    "Override should populate 3–5 liabilities",
  );
  assert(typeof overrideParsed.override.scoreGap === "number", "scoreGap should be a number");

  // create_decision clears the log — re-hit refused add_option so EXPECTED_TOOLS is present.
  const lateAddRefuse = (
    await tools.add_option.execute({
      id: "late-x",
      name: "Late invent",
      type: "buy",
      prototype_time_hours: 1,
      monthly_cash_cost: 1,
      monthly_maintenance_hours: 1,
      customization_score: 5,
      security_risk_score: 5,
      learning_value_score: 5,
      vendor_lockin_score: 5,
      estimate: true,
    })
  ).content[0].text;
  assert(lateAddRefuse.includes("REFUSED"), "Late add_option on restored auth must still refuse");

  const toolLog = getSnapshot().toolLog;
  assert(
    toolLog.every((entry) => entry.source === "agent" || entry.source === "human"),
    "Tool log sources must be agent or human",
  );
  const loggedTools = new Set(toolLog.map((entry) => entry.tool));
  for (const name of EXPECTED_TOOLS) {
    assert(loggedTools.has(name), `Tool log missing entry for ${name}`);
  }

  const rerankEntries = toolLog.filter((entry) => entry.tool === "rerank_decision_options");
  assert(rerankEntries.length >= 2, `rerank should appear at least twice in tool log, got ${rerankEntries.length}`);
  assert(
    toolLog.some((entry) => entry.tool === "rerank_decision_options" && /Auto-reranked/.test(entry.summary)),
    "Restored-auth weight write must leave an auto-rerank log entry",
  );
  assert(
    rerankEntries.every((entry) => entry.rankingCurrent === true),
    "rerank log entries should have rankingCurrent true",
  );

  const weightEntry = toolLog.find((entry) => entry.tool === "set_priority_weight");
  assert(weightEntry?.rankingCurrent === false, "set_priority_weight log should have rankingCurrent false");

  const contextEntry = toolLog.find((entry) => entry.tool === "set_decision_context");
  assert(contextEntry?.rankingCurrent === false, "set_decision_context log should have rankingCurrent false");

  console.log("Smoke: runDecisionTool human-source tagging");
  await runDecisionTool("set_priority_weight", { criterion: "customization", weight: 7 }, { source: "human" });
  const entry = getSnapshot().toolLog[getSnapshot().toolLog.length - 1];
  assert(entry?.source === "human", "runDecisionTool human call must log source: human");

  console.log("Smoke: human Solve path reranks when stale then solves");
  snap = getSnapshot();
  assert(snap.rankingCurrent === false, "Human weight write should leave ranking stale");
  const buildId = snap.options.find((item) => item.type === "build")?.id;
  assert(buildId, "Auth preset should have a build option");
  if (!snap.rankingCurrent) {
    await runDecisionTool("rerank_decision_options", {}, { source: "human" });
  }
  await runDecisionTool("solve_winning_conditions", { target_option_id: buildId }, { source: "human" });
  const solveEntry = getSnapshot().toolLog[getSnapshot().toolLog.length - 1];
  assert(solveEntry?.tool === "solve_winning_conditions", "Human Solve should log solve_winning_conditions");
  assert(solveEntry?.source === "human", "Human Solve should log source: human");
  assert(getSnapshot().lastInsight?.tool === "solve_winning_conditions", "Insight rail should pick up Solve");

  console.log("Smoke: agent future-stress via set_decision_context on scraping is refused");
  await tools.create_decision.execute({
    preset: "scraping",
    org_context: "solo",
    problem_statement: "AI web scraping at launch scale",
  });
  const scrapingBefore = getSnapshot();
  assert(scrapingBefore.preset === "scraping", "Should be on scraping preset");
  const refuseText = (
    await tools.set_decision_context.execute({
      scale_band: "50k+",
      compliance_tier: "hipaa",
      is_core_ip: true,
    })
  ).content[0].text;
  assert(refuseText.includes("REFUSED"), "Agent hipaa+50k on scraping must be refused");
  assert(refuseText.includes("simulate_future_scenario"), "Refusal must point at simulate_future_scenario");
  const afterRefuse = getSnapshot();
  assert(afterRefuse.scaleBand === scrapingBefore.scaleBand, "Refusal must not mutate scale");
  assert(afterRefuse.complianceTier === scrapingBefore.complianceTier, "Refusal must not mutate compliance");

  console.log("Smoke: human can still write hipaa+50k live (chips path)");
  await runDecisionTool(
    "set_decision_context",
    { scale_band: "50k+", compliance_tier: "hipaa" },
    { source: "human" },
  );
  assert(getSnapshot().scaleBand === "50k+", "Human path may set 50k+");
  assert(getSnapshot().complianceTier === "hipaa", "Human path may set hipaa");

  console.log("Smoke: simulate_future_scenario still projects Act 2");
  await tools.create_decision.execute({ preset: "scraping", org_context: "solo" });
  await tools.rerank_decision_options.execute({});
  const simAct2 = (
    await tools.simulate_future_scenario.execute({
      scenario_name: "HIPAA at 50k+ MRU",
      scale_band: "50k+",
      compliance_tier: "hipaa",
    })
  ).content[0].text;
  assert(simAct2.includes("Projected leader"), "Simulate must return projected leader");
  assert(simAct2.includes("Baseline preserved"), "Simulate must preserve baseline");
  const simSnap = getSnapshot();
  assert(simSnap.lastSimulation?.scenario_name === "HIPAA at 50k+ MRU", "lastSimulation should be set");
  assert(simSnap.rankingCurrent === true, "Simulate must not stale baseline ranking");

  console.log("PASS: Slice B WebMCP 9-tool smoke tests");
}

runFlow().catch((error) => {
  console.error("FAIL:", error.message);
  throw error;
});
