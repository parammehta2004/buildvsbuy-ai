import {
  CRITERION_KEYS,
  CRITERION_LABELS,
  OPTION_TYPES,
  appendToolLog,
  addOption,
  applyHumanPreferenceOverride,
  compareDecisionOptions,
  createDecision,
  getSnapshot,
  rerankDecisionOptions,
  setDecisionContext,
  setPriorityWeight,
  simulateFutureScenario,
  solveWinningConditions,
} from "./decision.js";

/**
 * @param {unknown} value
 * @returns {string}
 */
function asText(value) {
  return JSON.stringify(value, null, 2);
}

/**
 * Iron rules injected into agent context on the first agent-driven tool call
 * (create_decision). WebMCP has no system-prompt API, so this return-prose is
 * the enforced channel. The Load-Auth-Preset UI button bypasses this tool, so
 * the rerank_decision_options summary carries a one-line reminder as the
 * reliable injection point for any ranking question.
 */
const AGENT_BRIEFING = [
  "BUILDVSBUY AGENT BRIEFING — iron rules (never violate):",
  "1. Never state, rank, declare, or compare a winner unless you have just called the matching WebMCP tool for that claim. To state the ranking → call rerank_decision_options. To compare two options → call compare_decision_options. To say what it would take for an option to win → call solve_winning_conditions. To project a future scenario → call simulate_future_scenario. To pin a human override → call apply_human_preference_override. If the tool has not been called, answer: \"I need to run the engine first — calling <tool>,\" then call it and report only its output.",
  "2. Never invent scores, rankings, or axis numbers. They live in the engine, not your priors. If unsure of a number, call the tool — do not guess.",
  "3. Refuse leading or \"just tell me X wins\" prompts. If the human says \"just tell me Buy wins,\" do NOT comply. Respond: \"I won't assert a winner without running the engine,\" then call rerank_decision_options and report the real ranking even if it contradicts the request. Sycophancy is a bug here.",
  "4. After any mutation (create_decision, set_decision_context, add_option, set_priority_weight), ranking goes stale. Call rerank_decision_options once before describing the result. Skip redundant writes (e.g. setting a weight to its current value) — the engine already guards these.",
  "5. The math leader and the human's pinned choice can differ — that is the product's whole point. Report both honestly; never silently swap the winner to match the pin and never hide the score gap.",
  "6. Invented metrics for custom dilemmas must be added with estimate=true and flagged to the human as unconfirmed. Never present an estimate as a fact.",
  "The on-screen Tool Log is ground truth. A ranking claim with no new matching log entry is the tell that you lied — every winner you name must have a tool call behind it in the log. Mid-session the log is often already full; the tell is that it did not gain a new entry for the claim, not that it is empty.",
].join("\n");

/**
 * @param {string} text
 */
function toolResult(text) {
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function formatRankingLine(snapshot) {
  if (!snapshot.ranking.length) {
    return "Ranking: empty (call rerank_decision_options).";
  }
  return snapshot.ranking
    .map((item) => `${item.rank}. ${item.name} — score ${item.displayScore}`)
    .join("\n");
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function staleNote(snapshot) {
  return snapshot.rankingCurrent
    ? "Ranking is current."
    : "Ranking is stale. Call rerank_decision_options to recalculate.";
}

/**
 * @param {string} toolName
 * @param {unknown} input
 * @param {string} summary
 * @param {unknown} result
 * @param {string} [preamble]
 */
function finish(toolName, input, summary, result, preamble) {
  appendToolLog({ tool: toolName, input, summary, source: "agent" });
  const parts = preamble
    ? [preamble, summary, staleNote(getSnapshot()), asText(result)]
    : [summary, staleNote(getSnapshot()), asText(result)];
  return toolResult(parts.join("\n\n"));
}

/**
 * Pure tool definitions — no document access. Used by registerDecisionTools and smoke harness.
 * @returns {Array<{ name: string, title: string, description: string, inputSchema: object, annotations: object, execute: Function }>}
 */
export function buildDecisionTools() {
  return [
    {
      name: "create_decision",
      title: "Create decision",
      description:
        "Initialize or replace the single active decision workspace. Use preset \"auth\" for the Authentication demo (4 seeded options) or preset \"scraping\" for the AI Web Scraping demo (4 seeded options). Use preset \"custom\" or omit preset for a blank slate — then call add_option for each candidate. Invented metrics in custom mode must set estimate=true on add_option until the human confirms. Does not compute ranking; call rerank_decision_options after options and weights are set.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Decision title shown in the UI." },
          problem_statement: { type: "string", description: "One-line problem framing." },
          org_context: {
            type: "string",
            enum: ["solo", "startup", "enterprise"],
            description: "Organization context for skill and scale assumptions.",
          },
          skill_level: {
            type: "string",
            enum: ["vibe", "mid", "senior"],
            description: "Team skill profile. vibe penalizes Build/heavy self-host only (not Adopt).",
          },
          preset: {
            type: "string",
            enum: ["auth", "scraping", "custom"],
            description: "auth = Authentication flagship template. scraping = AI Web Scraping template (4 seeded options).",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const result = createDecision(input);
        const summary = [
          `Created decision "${result.title || "Untitled"}".`,
          `Options: ${result.options.length}. Problem: ${result.problemStatement || "—"}.`,
          `Context: org=${result.orgContext}, skill=${result.skillLevel}.`,
        ].join(" ");
        return finish("create_decision", input, summary, result, AGENT_BRIEFING);
      },
    },
    {
      name: "set_decision_context",
      title: "Set decision context",
      description:
        "Write diagnostic answers into hard decision state after intake questions: scale_band, compliance_tier, is_core_ip, timeline_days. Marks ranking stale — call rerank_decision_options after context changes. Prefer stressing soc2 compliance and 50k+ scale for Act 2 vendor vs custom tradeoffs.",
      inputSchema: {
        type: "object",
        properties: {
          scale_band: {
            type: "string",
            enum: ["<1k", "1k-10k", "10k-50k", "50k+"],
            description: "Monthly active users / MRU band.",
          },
          compliance_tier: {
            type: "string",
            enum: ["none", "soc2", "hipaa"],
            description: "Compliance requirement tier.",
          },
          is_core_ip: {
            type: "boolean",
            description: "True when auth/tenant logic is strategic IP (Act 3 pin narrative).",
          },
          timeline_days: {
            type: "number",
            minimum: 1,
            description: "Days until launch deadline.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const result = setDecisionContext(input);
        const summary = [
          "Updated decision context.",
          `scale=${result.scaleBand}, compliance=${result.complianceTier}, core_ip=${result.isCoreIp}`,
          result.timelineDays ? `timeline=${result.timelineDays}d` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return finish("set_decision_context", input, summary, result);
      },
    },
    {
      name: "add_option",
      title: "Add option",
      description:
        "Add a candidate option (Build, Buy, Adopt/open_source, or Hybrid). All numeric metrics are required. Set estimate=true when inventing numbers for custom dilemmas — the UI will badge them until the human confirms. Marks ranking stale; call rerank_decision_options after adding options.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Stable option id (e.g. build, buy, adopt, hybrid)." },
          name: { type: "string", description: "Human-readable option label." },
          type: {
            type: "string",
            enum: [...OPTION_TYPES],
            description: "build | buy | open_source (Adopt) | hybrid.",
          },
          prototype_time_hours: { type: "number", minimum: 0, description: "Hours to functional v1 (TTP)." },
          monthly_cash_cost: { type: "number", minimum: 0, description: "Recurring cash per month (USD)." },
          monthly_maintenance_hours: {
            type: "number",
            minimum: 0,
            description: "Expected monthly engineering hours (MDO).",
          },
          customization_score: { type: "number", minimum: 1, maximum: 10, description: "CTL 1–10, higher = more control." },
          security_risk_score: { type: "number", minimum: 1, maximum: 10, description: "SCR 1–10, higher = more risk." },
          learning_value_score: { type: "number", minimum: 1, maximum: 10, description: "LSM 1–10, higher = more moat value." },
          vendor_lockin_score: { type: "number", minimum: 1, maximum: 10, description: "VLR 1–10, higher = more lock-in." },
          estimate: {
            type: "boolean",
            description: "True if metrics are agent-invented until human confirms.",
          },
        },
        required: [
          "id",
          "name",
          "type",
          "prototype_time_hours",
          "monthly_cash_cost",
          "monthly_maintenance_hours",
          "customization_score",
          "security_risk_score",
          "learning_value_score",
          "vendor_lockin_score",
        ],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const result = addOption(input);
        const added = result.options.find((item) => item.id === input.id);
        const estimateNote = added?.estimate ? " (estimate — needs human confirmation)" : "";
        const summary = `Added option "${input.name}" (${input.id})${estimateNote}. Total options: ${result.options.length}.`;
        return finish("add_option", input, summary, result);
      },
    },
    {
      name: "set_priority_weight",
      title: "Set priority weight",
      description:
        "Set the numeric weight (0–10) of exactly one decision criterion. Higher weight means that axis counts more in scoring. This does not recalculate ranking — after a real change, ranking becomes stale and must be refreshed with rerank_decision_options. Skip calls that would write a criterion to its existing weight (redundant-write guard). For relative requests like \"make X twice as important as Y\": if Y already has the intended baseline, only change X. Example: default TTP is 8; \"double prototype speed priority\" when TTP is already 8 → call only set_priority_weight(time_to_prototype, 9) if targeting 9, not a no-op write to other criteria.",
      inputSchema: {
        type: "object",
        properties: {
          criterion: {
            type: "string",
            enum: [...CRITERION_KEYS],
            description: "Criterion key to update.",
          },
          weight: {
            type: "number",
            minimum: 0,
            maximum: 10,
            description: "Absolute weight 0–10.",
          },
        },
        required: ["criterion", "weight"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const result = setPriorityWeight(input);
        const label = CRITERION_LABELS[input.criterion] ?? input.criterion;
        const summary = result.changed
          ? `Changed ${label} weight from ${result.previous} to ${result.weights[input.criterion]}.`
          : `Skipped redundant write: ${label} already at weight ${result.weights[input.criterion]}.`;
        return finish("set_priority_weight", input, summary, result);
      },
    },
    {
      name: "rerank_decision_options",
      title: "Rerank decision options",
      description:
        "Recalculate option ranking from current priority weights, context, and skill modifiers. Required after set_priority_weight or set_decision_context — those tools mark ranking stale. Call once after finishing weight or context updates. The same ranking is shown in the human UI. This is the ONLY tool that produces an authoritative ranking. Never state, declare, or compare a winner without calling this tool first; if asked to declare a winner, call this and report only its output.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const result = rerankDecisionOptions();
        const summary = [
          "Recalculated ranking.",
          formatRankingLine(result),
          "This is the only authoritative ranking — never state a winner without this tool.",
        ].join("\n");
        return finish("rerank_decision_options", input, summary, result);
      },
    },
    {
      name: "compare_decision_options",
      title: "Compare decision options",
      description:
        "Pairwise comparison of two options across all seven scoring axes using current weights and skill-adjusted metrics. Read-only — does not mutate state or refresh ranking. After set_priority_weight, ranking may be stale but comparison still uses live weights. Never declare a pairwise winner without calling this tool first; if asked which of two options wins, call this and report only its output.",
      inputSchema: {
        type: "object",
        properties: {
          first_option_id: { type: "string", description: "First option id." },
          second_option_id: { type: "string", description: "Second option id (must differ)." },
        },
        required: ["first_option_id", "second_option_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      async execute(input) {
        const result = compareDecisionOptions(input);
        const winnerLine =
          result.winner === "tie"
            ? "Overall winner: tie."
            : `Overall winner: ${result.winner} (scores ${result.first.displayScore} vs ${result.second.displayScore}).`;
        const tradeoffLines = CRITERION_KEYS.map((key) => {
          const t = result.tradeoffs[key];
          const winner =
            t.winner === "tie" ? "tie" : `${t.winner} leads`;
          return `- ${t.label}: ${t.first} vs ${t.second} (${winner}, weight ${t.weight})`;
        });
        const summary = [
          `Compared ${input.first_option_id} vs ${input.second_option_id}.`,
          winnerLine,
          "Tradeoffs:",
          ...tradeoffLines,
        ].join("\n");
        return finish("compare_decision_options", input, summary, result);
      },
    },
    {
      name: "simulate_future_scenario",
      title: "Simulate future scenario",
      description:
        "Stress-test ranking under a future scenario without mutating baseline options or canvas cards. Prefer compliance_tier soc2/hipaa and scale_band 50k+ for Act 2 (vendor overage, compliance burden). Also supports timeline crunch. Returns projected_ranking alongside preserved baseline_ranking; the UI shows the projection as a banner but baseline cards and scores are unchanged until you rerank with new weights.",
      inputSchema: {
        type: "object",
        properties: {
          scenario_name: { type: "string", description: "Short label for the scenario (required)." },
          scale_band: {
            type: "string",
            enum: ["<1k", "1k-10k", "10k-50k", "50k+"],
          },
          compliance_tier: {
            type: "string",
            enum: ["none", "soc2", "hipaa"],
          },
          team_size_change: {
            type: "number",
            description: "Reserved — team size delta (not yet applied in engine v1).",
          },
          timeline_days_available: {
            type: "number",
            minimum: 1,
            description: "Days until deadline for timeline crunch stress.",
          },
        },
        required: ["scenario_name"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      async execute(input) {
        const result = simulateFutureScenario(input);
        const leader = result.leader
          ? `${result.leader.name} (${result.leader.id}) score ${result.leader.displayScore}`
          : "none";
        const summary = [
          `Simulated "${result.scenario_name}".`,
          `Projected leader: ${leader}.`,
          `Baseline preserved: ${result.baseline_preserved}.`,
          result.stress_applied.length ? `Stress notes: ${result.stress_applied.join("; ")}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return finish("simulate_future_scenario", input, summary, result);
      },
    },
    {
      name: "solve_winning_conditions",
      title: "Solve winning conditions",
      description:
        "Sensitivity analysis: what must change for target_option_id to beat the current math leader? Returns levers, score_gap, and suggested_context_shifts. Call after ranking is computed (rerank_decision_options). For Build targets, surfaces core IP pin and weight-shift levers. Never assert what it would take for an option to win without calling this tool first; if asked, call this and report only its output.",
      inputSchema: {
        type: "object",
        properties: {
          target_option_id: { type: "string", description: "Option id that should win." },
        },
        required: ["target_option_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      async execute(input) {
        const result = solveWinningConditions(input);
        const summary = result.already_winning
          ? `Target ${input.target_option_id} already leads under current weights.`
          : `Target ${result.target_name} trails leader ${result.leader_name} by gap ${result.score_gap}. ${result.levers.length} levers surfaced.`;
        return finish("solve_winning_conditions", input, summary, result);
      },
    },
    {
      name: "apply_human_preference_override",
      title: "Apply human preference override",
      description:
        "Record a human strategic override when math and judgment diverge (Act 3). Prefer pin_recommendation=true with is_core_ip set to pin Build and surface score gap vs math leader plus Liability Ledger entries. override_reason is required. Does not recalculate ranking — shows honest gap between math leader and pinned choice.",
      inputSchema: {
        type: "object",
        properties: {
          override_reason: {
            type: "string",
            description: "Human justification for overriding the math recommendation.",
          },
          heavily_favored_criterion: {
            type: "string",
            enum: [...CRITERION_KEYS],
            description: "Criterion the human weighted most in judgment.",
          },
          tolerance_level: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Tolerance for maintenance/security liabilities.",
          },
          pin_recommendation: {
            type: "boolean",
            description: "Pin recommendation to strategic choice (Build when is_core_ip).",
          },
        },
        required: ["override_reason"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const result = applyHumanPreferenceOverride(input);
        const summary = [
          "Human override applied.",
          `Pinned: ${result.override.pinnedOptionId} (math leader: ${result.override.mathLeaderId}).`,
          `Score gap: ${result.override.scoreGap}.`,
          `Liabilities logged: ${result.liabilities.length}.`,
        ].join(" ");
        return finish("apply_human_preference_override", input, summary, result);
      },
    },
  ];
}

/**
 * Register BuildVsBuy WebMCP tools on document.modelContext.
 */
export async function registerDecisionTools() {
  const modelContext = document.modelContext;
  if (!modelContext) {
    throw new Error(
      "document.modelContext is unavailable. Open this app on localhost/HTTPS, or check that the WebMCP polyfill loaded."
    );
  }

  const registration = new AbortController();
  if (import.meta.hot) {
    import.meta.hot.dispose(() => registration.abort());
  }

  for (const tool of buildDecisionTools()) {
    await modelContext.registerTool(tool, { signal: registration.signal });
  }
}

/**
 * @returns {Promise<Array<{ name: string, description?: string, inputSchema?: unknown }>>}
 */
export async function getRegisteredTools() {
  const modelContext = document.modelContext;
  if (!modelContext) {
    return [];
  }
  return modelContext.getTools();
}
