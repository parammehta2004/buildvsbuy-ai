import { buildDecisionTools } from "../src/webmcp.js";
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
  await tools.create_decision.execute({ preset: "auth" });
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

  console.log("Smoke: 3 set_priority_weight TTP=9");
  const weightResult = await tools.set_priority_weight.execute({
    criterion: "time_to_prototype",
    weight: 9,
  });
  assert(weightResult.content[0].text.includes("Changed"), "Weight change should report changed");
  snap = getSnapshot();
  assert(snap.rankingCurrent === false, "Weight change should mark ranking stale");

  console.log("Smoke: 4 rerank_decision_options (clean preset, speed-biased)");
  await tools.rerank_decision_options.execute({});
  snap = getSnapshot();
  const speedIds = rankIds(snap);
  console.log("Speed-biased ranking:", speedIds.join(" > "));
  assert(
    speedIds.indexOf("build") > speedIds.indexOf("buy"),
    `Speed-bias (TTP=9) must drop build below buy — the vibe-trap crossover, got: ${speedIds.join(", ")}`,
  );

  console.log("Smoke: 5 add_option (custom fixture, estimate=true)");
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
  assert(snap.options.length === 5, "Should have 5 options after add_option");
  const custom = snap.options.find((item) => item.id === "custom-x");
  assert(custom?.estimate === true, "custom-x should have estimate=true");
  assert(snap.rankingCurrent === false, "add_option should mark ranking stale");

  console.log("Smoke: 6 compare_decision_options");
  const compareResult = await tools.compare_decision_options.execute({
    first_option_id: "build",
    second_option_id: "adopt",
  });
  assert(compareResult.content[0].text.includes("Tradeoffs"), "Compare should return tradeoffs");

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
  assert(simParsed.projected_ranking.length === 5, "Projected ranking should include 5 options");
  assert(simParsed.leader !== null, "Projected leader should be non-null");

  console.log("Smoke: 9 solve_winning_conditions");
  const solveText = (
    await tools.solve_winning_conditions.execute({ target_option_id: "build" })
  ).content[0].text;
  const solveParsed = JSON.parse(solveText.split("\n\n").pop());
  assert(Array.isArray(solveParsed.levers) && solveParsed.levers.length > 0, "Solve should return levers");
  assert(typeof solveParsed.score_gap === "number" && solveParsed.score_gap >= 0, "score_gap should be >= 0");

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

  const toolLog = getSnapshot().toolLog;
  assert(toolLog.length === 10, `Expected 10 tool log entries, got ${toolLog.length}`);
  const loggedTools = new Set(toolLog.map((entry) => entry.tool));
  for (const name of EXPECTED_TOOLS) {
    assert(loggedTools.has(name), `Tool log missing entry for ${name}`);
  }

  const rerankEntries = toolLog.filter((entry) => entry.tool === "rerank_decision_options");
  assert(rerankEntries.length === 2, "rerank should appear twice in tool log");
  assert(
    rerankEntries.every((entry) => entry.rankingCurrent === true),
    "rerank log entries should have rankingCurrent true",
  );

  const weightEntry = toolLog.find((entry) => entry.tool === "set_priority_weight");
  assert(weightEntry?.rankingCurrent === false, "set_priority_weight log should have rankingCurrent false");

  const contextEntry = toolLog.find((entry) => entry.tool === "set_decision_context");
  assert(contextEntry?.rankingCurrent === false, "set_decision_context log should have rankingCurrent false");

  console.log("PASS: Slice B WebMCP 9-tool smoke tests");
}

runFlow().catch((error) => {
  console.error("FAIL:", error.message);
  throw error;
});
