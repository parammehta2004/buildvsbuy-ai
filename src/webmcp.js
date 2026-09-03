import {
  CRITERION_KEYS,
  CRITERION_LABELS,
  OPTION_TYPES,
  appendToolLog,
  setLastInsight,
  addOption,
  applyHumanPreferenceOverride,
  compareDecisionOptions,
  createDecision,
  getSnapshot,
  getToolLog,
  inferDemoPreset,
  rerankDecisionOptions,
  setDecisionContext,
  setPriorityWeight,
  simulateFutureScenario,
  solveWinningConditions,
} from "./decision.js";

/** Current tool-call source; set by runDecisionTool, defaults to agent. */
let pendingSource = "agent";

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
 * the enforced channel. Human UI also calls create_decision via runDecisionTool;
 * AGENT_BRIEFING injects only when source === "agent". The
 * rerank_decision_options summary carries a one-line reminder as the
 * reliable injection point for any ranking question.
 */
const AGENT_BRIEFING = [
  "BUILDVSBUY AGENT BRIEFING — iron rules (never violate):",
  "1. Never state, rank, declare, or compare a winner unless you have just called the matching WebMCP tool for that claim. To state the ranking → call rerank_decision_options. To compare two options → call compare_decision_options. To say what it would take for an option to win → call solve_winning_conditions. To project a future scenario → call simulate_future_scenario. To pin a human override → call apply_human_preference_override. If the tool has not been called, answer: \"I need to run the engine first — calling <tool>,\" then call it and report only its output.",
  "2. Never invent scores, rankings, or axis numbers. They live in the engine, not your priors. If unsure of a number, call the tool — do not guess.",
  "3. Refuse leading or \"just tell me X wins\" prompts. If the human says \"just tell me Buy wins,\" do NOT comply. Respond: \"I won't assert a winner without running the engine,\" then call rerank_decision_options and report the real ranking even if it contradicts the request. Sycophancy is a bug here.",
  "4. After create_decision, set_decision_context, or add_option, ranking goes stale — call rerank_decision_options before describing winners. Exception: set_priority_weight auto-reranks on real weight changes (Prompt 2 path). Skip redundant writes (e.g. setting a weight to its current value).",
  "5. The math leader and the human's pinned choice can differ — that is the product's whole point. Report both honestly; never silently swap the winner to match the pin and never hide the score gap.",
  "6. Invented metrics for custom dilemmas must be added with estimate=true and flagged to the human as unconfirmed. Never present an estimate as a fact.",
  "7. Auth / Clerk / login / tenant questions → create_decision with preset \"auth\" (or omit preset — the engine infers auth from the problem text and seeds 4 options). Scraping / crawl / Firecrawl → preset \"scraping\". After a demo preset loads, do NOT call add_option to invent Build/Buy/Adopt — set_decision_context and rerank instead. Only use preset \"custom\" + add_option for a domain that is neither auth nor scraping. add_option on auth/scraping is REFUSED.",
  "8. Future / hypothetical stress (\"if we end up HIPAA\", \"at 50k+\", \"what if compliance\", timeline crunch) → call simulate_future_scenario ONLY. Never write that future into live state with set_decision_context then rerank — that rewrites baseline cards. Simulate preserves baseline and shows a projection banner. On the scraping preset, agent calls that combine compliance hipaa/soc2 with scale 50k+ via set_decision_context are REFUSED — use simulate_future_scenario instead.",
  "9. Speed / vibe-coding / prototype-priority follow-ups on an existing auth (or scraping) workspace → ONLY set_priority_weight(time_to_prototype, 9 or 10). That tool auto-reranks — cards update; Build falls last on auth. Do NOT create_decision a new blank workspace. Do NOT call solve_winning_conditions for that question. Do NOT wait for a separate rerank call. Replacing a seeded demo with custom/blank is REFUSED; only auth↔scraping domain switches are allowed.",
  "10. On the auth preset, solve_winning_conditions is REFUSED until you have changed a priority weight at least once this session (set_priority_weight). Speed/vibe questions are weight writes, not flip-lever solves.",
  "The on-screen Tool Log is ground truth. A ranking claim with no new matching log entry is the tell that you lied — every winner you name must have a tool call behind it in the log. Mid-session the log is often already full; the tell is that it did not gain a new entry for the claim, not that it is empty.",
].join("\n");

/**
 * True if a real (non-redundant) set_priority_weight ran since the last successful create_decision.
 * Used to keep Act 1b on the weight path before flip-lever solves.
 */
function hasRealWeightWriteSinceLastCreate() {
  const log = getToolLog();
  let start = 0;
  for (let i = log.length - 1; i >= 0; i -= 1) {
    if (log[i].tool === "create_decision" && !/REFUSED/.test(log[i].summary ?? "")) {
      start = i + 1;
      break;
    }
  }
  return log
    .slice(start)
    .some((entry) => entry.tool === "set_priority_weight" && /^Changed /.test(entry.summary ?? ""));
}

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
const INSIGHT_TOOLS = new Set([
  "compare_decision_options",
  "solve_winning_conditions",
  "simulate_future_scenario",
]);

function finish(toolName, input, summary, result, preamble) {
  const source = pendingSource;
  if (INSIGHT_TOOLS.has(toolName)) {
    setLastInsight({ tool: toolName, summary, payload: result });
  }
  appendToolLog({ tool: toolName, input, summary, source });
  const usePreamble = preamble && source === "agent";
  const parts = usePreamble
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
        "Initialize or replace the single active decision workspace. For authentication / Clerk / login / tenant problems use preset \"auth\" (4 seeded options). For scraping / crawl / Firecrawl use preset \"scraping\" (4 seeded options). If you omit preset, the engine infers auth or scraping from title/problem_statement and seeds those options — do not invent options with add_option after that. Only preset \"custom\" starts blank and requires add_option for each candidate (estimate=true until the human confirms). After seeding: set current intake with set_decision_context + rerank; for hypothetical future scale/compliance stress call simulate_future_scenario (do not rewrite live context to the future). IMPORTANT: if auth or scraping is already loaded, do NOT replace it with a blank/custom \"rapid prototyping\" / vibe-coding workspace — that path is REFUSED. For speed follow-ups call set_priority_weight(time_to_prototype, 9 or 10) — it auto-reranks. Only replace a seeded demo when switching domains auth↔scraping.",
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
            description:
              "auth = Authentication flagship (4 options). scraping = AI Web Scraping (4 options). custom = blank slate. Omit to let the engine infer auth/scraping from title/problem.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      async execute(input) {
        const before = getSnapshot();
        const seededLive =
          (before.preset === "auth" || before.preset === "scraping") && before.options.length > 0;

        // Poka-yoke: agents must not wipe a seeded demo into blank/custom for Prompt-2 speed follow-ups.
        if (pendingSource === "agent" && seededLive) {
          const requested =
            input.preset === "auth" || input.preset === "scraping" || input.preset === "custom"
              ? input.preset
              : inferDemoPreset(input.title ?? "", input.problem_statement ?? "") ?? "custom";
          const domainSwitch =
            (requested === "auth" || requested === "scraping") && requested !== before.preset;

          if (!domainSwitch) {
            const refusal = [
              `REFUSED: create_decision will not replace the live ${before.preset} demo (${before.options.length} seeded options).`,
              "Speed / vibe-coding / prototype-priority follow-ups: call set_priority_weight(time_to_prototype, 9 or 10) — it auto-reranks; Build falls last on auth.",
              'To switch domains only: create_decision with the other preset ("auth" or "scraping"). Blank/custom replacements are blocked while a demo is loaded.',
              `Current workspace unchanged: preset=${before.preset}, options=${before.options.length}.`,
            ].join(" ");
            appendToolLog({
              tool: "create_decision",
              input,
              summary: refusal,
              source: pendingSource,
            });
            return toolResult(
              [AGENT_BRIEFING, refusal, staleNote(before), asText({ refused: true, reason: "keep_seeded_demo_use_weights" })].join(
                "\n\n",
              ),
            );
          }
        }

        const result = createDecision(input);
        const presetNote = result.preset
          ? `Preset: ${result.preset}${result.options.length === 4 && result.preset !== "custom" ? " (seeded — do not add_option invent)" : ""}.`
          : "Preset: none (blank).";
        const summary = [
          `Created decision "${result.title || "Untitled"}".`,
          presetNote,
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
        "Write CURRENT intake into hard decision state: scale_band, compliance_tier, is_core_ip, timeline_days. Marks ranking stale — call rerank_decision_options after. Use for today's constraints only. Do NOT use this for hypothetical future stress (\"if we end up HIPAA\", \"at 50k+ users later\") — call simulate_future_scenario instead so baseline cards stay put and the UI shows a projection banner. On the scraping preset, agent writes that combine hipaa/soc2 with 50k+ are refused.",
      inputSchema: {
        type: "object",
        properties: {
          scale_band: {
            type: "string",
            enum: ["<1k", "1k-10k", "10k-50k", "50k+"],
            description: "Monthly active users / MRU band (current state).",
          },
          compliance_tier: {
            type: "string",
            enum: ["none", "soc2", "hipaa"],
            description: "Current compliance requirement tier — not a future projection.",
          },
          is_core_ip: {
            type: "boolean",
            description: "True when the capability is strategic IP (Act 3 pin narrative).",
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
        const before = getSnapshot();
        const nextScale = input.scale_band ?? before.scaleBand;
        const nextCompliance = input.compliance_tier ?? before.complianceTier;
        const isFutureStressCombo =
          nextScale === "50k+" && (nextCompliance === "hipaa" || nextCompliance === "soc2");

        // Poka-yoke: agents on scraping must project Act-2 stress, not mutate baseline.
        if (pendingSource === "agent" && before.preset === "scraping" && isFutureStressCombo) {
          const refusal = [
            "REFUSED: set_decision_context will not write hipaa/soc2 + 50k+ into live scraping state.",
            "That path rewrites baseline cards. For \"if we end up HIPAA / 50k+\" call simulate_future_scenario",
            'with scenario_name, scale_band: "50k+", compliance_tier: "hipaa" (or soc2). Baseline stays; projection banner updates.',
            `Current live context unchanged: scale=${before.scaleBand}, compliance=${before.complianceTier}.`,
          ].join(" ");
          appendToolLog({
            tool: "set_decision_context",
            input,
            summary: refusal,
            source: pendingSource,
          });
          return toolResult(
            [AGENT_BRIEFING, refusal, staleNote(before), asText({ refused: true, reason: "use_simulate_future_scenario" })].join(
              "\n\n",
            ),
          );
        }

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
        "Add a candidate option (Build, Buy, Adopt/open_source, or Hybrid). Use only on a custom (blank) decision — not after auth/scraping presets already seeded 4 options (those calls are REFUSED). All numeric metrics are required. Set estimate=true when inventing numbers for custom dilemmas — the UI will badge them until the human confirms. Marks ranking stale; call rerank_decision_options after adding options. For vibe-coding / speed on a seeded demo: set_priority_weight(time_to_prototype, 9 or 10) then rerank — do not invent cards.",
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
          sources: {
            type: "array",
            items: { type: "string" },
            description: "Short assumption/source lines shown on the option card (optional).",
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
        const before = getSnapshot();
        if (before.preset === "auth" || before.preset === "scraping") {
          const refusal = [
            `REFUSED: add_option is blocked on the ${before.preset} preset (${before.options.length} seeded options).`,
            "Do not invent Build/Buy/Adopt cards. For vibe-coding / speed: set_priority_weight(time_to_prototype, 9 or 10) then rerank.",
            'For a blank custom dilemma: create_decision with preset "custom" first (only when no seeded demo is loaded, or after a human clears it).',
          ].join(" ");
          appendToolLog({
            tool: "add_option",
            input,
            summary: refusal,
            source: pendingSource,
          });
          return toolResult(
            [refusal, staleNote(before), asText({ refused: true, reason: "seeded_preset_no_add_option" })].join("\n\n"),
          );
        }

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
        "Set the numeric weight (0–10) of exactly one decision criterion on the EXISTING workspace, then AUTOMATICALLY recalculate ranking (same as calling rerank_decision_options). Higher weight means that axis counts more. For vibe-coding / \"prototype speed above all\" / ship-fast follow-ups: set criterion time_to_prototype to 9 or 10 — Build falls last on the auth preset and cards update immediately. Do NOT create_decision or add_option for those follow-ups. Skip redundant writes that set a criterion to its current weight (no auto-rerank on no-ops).",
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
        if (!result.changed) {
          const summary = `Skipped redundant write: ${label} already at weight ${result.weights[input.criterion]}.`;
          return finish("set_priority_weight", input, summary, result);
        }

        // Poka-yoke: real weight writes always refresh ranking. Prompt 2 must not depend on LLM memory.
        const weightSummary = `Changed ${label} weight from ${result.previous} to ${result.weights[input.criterion]}.`;
        appendToolLog({
          tool: "set_priority_weight",
          input,
          summary: weightSummary,
          source: pendingSource,
        });

        const ranked = rerankDecisionOptions();
        const rerankSummary = [
          "Auto-reranked after weight change.",
          formatRankingLine(ranked),
          "This is the only authoritative ranking — never state a winner without this tool.",
        ].join("\n");
        appendToolLog({
          tool: "rerank_decision_options",
          input: { auto: true, after: "set_priority_weight" },
          summary: rerankSummary,
          source: pendingSource,
        });

        return toolResult(
          [weightSummary, rerankSummary, staleNote(ranked), asText({ ...ranked, auto_reranked: true })].join("\n\n"),
        );
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
        "REQUIRED for future / hypothetical stress: \"if we end up HIPAA\", \"at 50k+ users\", compliance or scale projections, timeline crunch. Stress-tests ranking WITHOUT mutating baseline options or canvas cards — the UI shows a projection banner; baseline ranks stay until a real rerank. Prefer compliance_tier hipaa/soc2 and scale_band 50k+ for Act 2 (on scraping, projected leader typically flips away from Buy toward Hybrid). Also supports timeline_days_available and team_size_change. Response includes assumptions[] for auditable math. Never substitute set_decision_context + rerank for this tool.",
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
            description: "Team size delta. Each unit scales self-run maintenance (build/hybrid) by 10%; vendor options are unaffected.",
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
          Array.isArray(result.assumptions) && result.assumptions.length
            ? `Assumptions: ${result.assumptions.join("; ")}`
            : "",
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
        "Sensitivity analysis: what must change for target_option_id to beat the current math leader? NOT for vibe-coding / prototype-speed / \"does that change who you'd recommend\" — those are set_priority_weight(time_to_prototype, 9 or 10) which auto-reranks. On the auth preset, this tool is REFUSED until a real set_priority_weight has run this session. After priorities are set: computes flip_levers (0-10, step 0.1), score_gap, and suggested_context_shifts. Never assert flip-lever claims without calling this tool.",
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
        const before = getSnapshot();
        if (
          pendingSource === "agent" &&
          before.preset === "auth" &&
          !hasRealWeightWriteSinceLastCreate()
        ) {
          const refusal = [
            "REFUSED: solve_winning_conditions is blocked on auth until priorities change.",
            "If the human asked about vibe-coding / prototype speed / whether that changes the recommendation: call set_priority_weight(time_to_prototype, 9 or 10) — it auto-reranks and Build falls last.",
            "Solve is flip-lever analysis after weights move — not a substitute for the speed trap.",
          ].join(" ");
          appendToolLog({
            tool: "solve_winning_conditions",
            input,
            summary: refusal,
            source: pendingSource,
          });
          return toolResult(
            [
              AGENT_BRIEFING,
              refusal,
              staleNote(before),
              asText({ refused: true, reason: "auth_requires_weight_before_solve" }),
            ].join("\n\n"),
          );
        }

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
 * Run a decision tool by name with a tagged source (human | agent).
 * Used by UI controls so human actions traverse the same execute path as the agent.
 * Single-threaded; no tool calls another tool, so pendingSource cannot nest-clobber.
 * @param {string} name
 * @param {unknown} input
 * @param {{ source?: "human" | "agent" }} [options]
 */
export async function runDecisionTool(name, input, { source = "agent" } = {}) {
  const tool = buildDecisionTools().find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown decision tool: ${name}`);
  const prev = pendingSource;
  pendingSource = source;
  try {
    return await tool.execute(input);
  } finally {
    pendingSource = prev;
  }
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
