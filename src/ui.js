import {
  CRITERION_KEYS,
  CRITERION_LABELS,
  exportDecisionState,
  getSnapshot,
  importDecisionState,
  subscribe,
} from "./decision.js";
import { runDecisionTool } from "./webmcp.js";

const EXPECTED_TOOLS = Object.freeze([
  "create_decision",
  "set_decision_context",
  "add_option",
  "set_priority_weight",
  "rerank_decision_options",
  "compare_decision_options",
  "simulate_future_scenario",
  "solve_winning_conditions",
  "apply_human_preference_override",
]);

const SCALE_BANDS = Object.freeze(["<1k", "1k-10k", "10k-50k", "50k+"]);
const COMPLIANCE_TIERS = Object.freeze(["none", "soc2", "hipaa"]);

const TRY_PROMPTS = Object.freeze([
  {
    act: "Act 1",
    text: "Set time-to-prototype weight to 9 and rerank. Why did Build drop?",
  },
  {
    act: "Act 2",
    text: "Load scraping preset. Simulate HIPAA at 50k+ MRU and explain the projected leader change.",
  },
  {
    act: "Act 3",
    text: "Set core IP to true and pin Build with override reason. Show score gap and liabilities.",
  },
]);

const TYPE_LABELS = Object.freeze({
  build: "BUILD",
  buy: "BUY",
  open_source: "ADOPT",
  hybrid: "HYBRID",
});

/** @type {"ink" | "paper"} */
let currentTheme = "ink";

/** @type {"auth" | "scraping" | null} */
let currentPreset = null;

/** @type {string | null} */
let expandedLogTimestamp = null;

/** @type {{ regionId: string, source: string, at: number } | null} */
let activePulse = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let pulseTimer = null;

/** Guards overlapping preset loads (3 sequential tool calls). */
let presetLoadPending = false;

/** @type {number} */
let lastLogLen = 0;

/** @type {HTMLElement | null} */
let appRoot = null;

/** @type {(() => { source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }) | null} */
let appGetWebmcp = null;

/** @type {number | null} */
let themeTransitionTimer = null;

/**
 * @param {"ink" | "paper"} theme
 */
function applyTheme(theme) {
  currentTheme = theme;
  const rootEl = document.documentElement;
  rootEl.dataset.theme = theme;

  if (themeTransitionTimer != null) {
    window.clearTimeout(themeTransitionTimer);
  }
  rootEl.classList.add("theme-transition");
  themeTransitionTimer = window.setTimeout(() => {
    rootEl.classList.remove("theme-transition");
    themeTransitionTimer = null;
  }, 320);
}

/**
 * @param {HTMLElement} root
 * @param {{ source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} webmcp
 */
export function renderApp(root, webmcp) {
  const snapshot = getSnapshot();
  const focusState = captureFocusState(root);
  document.documentElement.dataset.theme = currentTheme;

  // Sync preset tracker from store (agent create_decision) or clear when empty.
  if (snapshot.options.length > 0 && (snapshot.preset === "auth" || snapshot.preset === "scraping")) {
    currentPreset = snapshot.preset;
  } else if (snapshot.options.length === 0) {
    currentPreset = null;
  }

  const pulseClass = (regionId) => (activePulse?.regionId === regionId ? " is-pulsed" : "");
  const pulseBadge = (regionId) => {
    if (activePulse?.regionId !== regionId) {
      return "";
    }
    const source = activePulse.source;
    return `<span class="pulse-source-chip source-${escapeHtml(source)}" title="Last change: ${escapeHtml(source)}">${escapeHtml(source)}</span>`;
  };

  root.innerHTML = `
    <div class="app">
      ${renderHeader(snapshot, webmcp, pulseClass, pulseBadge)}
      <div class="main-grid">
      <div class="main-column">
        ${renderContextStrip(snapshot, pulseClass, pulseBadge)}
        ${renderQuickActions(snapshot)}
        ${renderSimulationBanner(snapshot)}
        ${snapshot.override.active ? renderOverrideBanner(snapshot) : ""}
        ${renderCardsSection(snapshot, pulseClass, pulseBadge)}
        ${renderWeightsSection(snapshot, pulseClass, pulseBadge)}
      </div>
        <aside class="right-rail">
          ${renderPromptsPanel(snapshot)}
          ${renderToolLog(snapshot)}
          ${renderAgentInsight(snapshot)}
          ${renderLedger(snapshot)}
        </aside>
      </div>
    </div>
  `;

  bindEvents(root, snapshot);
  restoreFocusState(root, focusState);
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 * @param {{ source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} webmcp
 */
function renderHeader(snapshot, webmcp, pulseClass, pulseBadge) {
  const hasDecision = snapshot.options.length > 0;
  const title = hasDecision ? snapshot.title : "BuildVsBuy.ai";
  const problem = hasDecision
    ? snapshot.problemStatement
    : "When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning.";
  const resetTitle = `Reset ${currentPreset === "scraping" ? "Scraping" : "Auth"} demo to Solo · 1k–10k · 14d`;

  return `
    <header class="header">
      <div class="header-brand">
        <p class="brand">BuildVsBuy.ai</p>
        ${renderPresetSwitcher(hasDecision, pulseClass, pulseBadge)}
        ${hasDecision ? `<h1 class="decision-title">${escapeHtml(title)}</h1>` : ""}
        ${hasDecision ? `<p class="header-tagline">Demo scenario — structured estimates</p>` : ""}
        <p class="problem-statement">${escapeHtml(problem)}</p>
      </div>
      <div class="header-actions">
        ${renderWebmcpChip(webmcp)}
        <button type="button" class="btn btn-ghost" id="theme-toggle" aria-label="Toggle theme">
          ${currentTheme === "ink" ? "Paper theme" : "Ink theme"}
        </button>
        ${hasDecision ? `
        <button
          type="button"
          class="btn btn-ghost"
          id="export-state"
          title="Download the decision state + tool log as JSON"
        >
          Export
        </button>` : ""}
        <button
          type="button"
          class="btn btn-ghost"
          id="import-state"
          title="Restore a previously exported decision state from JSON"
        >
          Import
        </button>
        <input type="file" id="import-state-file" accept="application/json,.json" hidden />
        ${hasDecision ? `
        <button
          type="button"
          class="btn btn-ghost"
          id="load-auth-preset"
          title="${escapeHtml(resetTitle)}"
        >
          Reset demo
        </button>` : ""}
      </div>
    </header>
  `;
}

/**
 * Segmented preset switcher — Auth | Scraping. Neither highlighted until a preset loads.
 * @param {boolean} hasDecision
 */
function renderPresetSwitcher(hasDecision, pulseClass, pulseBadge) {
  return `
    <div class="preset-switcher${pulseClass("preset-switcher")}" id="preset-switcher" role="group" aria-label="Demo preset">
      ${pulseBadge("preset-switcher")}
      <button
        type="button"
        class="preset-segment${hasDecision && currentPreset === "auth" ? " is-active" : ""}"
        data-preset-switch="auth"
        aria-pressed="${hasDecision && currentPreset === "auth"}"
      >Auth</button>
      <button
        type="button"
        class="preset-segment${hasDecision && currentPreset === "scraping" ? " is-active" : ""}"
        data-preset-switch="scraping"
        aria-pressed="${hasDecision && currentPreset === "scraping"}"
      >Scraping</button>
    </div>
  `;
}

/**
 * @param {{ source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} webmcp
 */
function renderWebmcpChip(webmcp) {
  const names = webmcp.tools.map((tool) => tool.name);
  const allRegistered = EXPECTED_TOOLS.every((name) => names.includes(name));
  const hasError = Boolean(webmcp.error);

  if (webmcp.source === "unavailable") {
    return `
      <span class="webmcp-chip is-bad" title="${escapeHtml(webmcp.error || "WebMCP unavailable")}">
        <span class="webmcp-dot" aria-hidden="true"></span>
        WebMCP off
      </span>
      ${hasError ? `<p class="webmcp-error">WebMCP unavailable: ${escapeHtml(webmcp.error || "unknown error")}. Human controls still work.</p>` : ""}
    `;
  }

  const label = webmcp.source === "native" ? "WebMCP native" : "Human mode";
  const status = hasError
    ? "registration error"
    : allRegistered
      ? (webmcp.source === "native" ? "connected" : "agent tools available in ChatGPT Desktop / Chrome WebMCP")
      : "missing tools";
  const chipClass = hasError || !allRegistered ? "is-bad" : "is-ok";

  return `
    <span class="webmcp-chip ${chipClass}">
      <span class="webmcp-dot" aria-hidden="true"></span>
      ${label} · ${escapeHtml(status)}
    </span>
    ${hasError ? `<p class="webmcp-error">Tool registration failed: ${escapeHtml(webmcp.error || "unknown error")}. Human controls still work.</p>` : ""}
  `;
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderContextStrip(snapshot, pulseClass, pulseBadge) {
  const orgLabel = formatOrgContext(snapshot.orgContext);
  const skillLabel = formatSkillLevel(snapshot.skillLevel);
  const timelineLabel =
    snapshot.timelineDays != null ? `Timeline ${snapshot.timelineDays}d` : "Timeline —";

  return `
    <div class="context-strip${pulseClass("context-strip")}" id="context-strip" role="group" aria-label="Decision context">
      ${pulseBadge("context-strip")}
      <span class="context-chip is-display">${escapeHtml(orgLabel)}</span>
      <span class="context-chip is-display">${escapeHtml(skillLabel)}</span>
      <button
        type="button"
        class="context-chip is-toggle"
        data-context="scale_band"
        aria-pressed="false"
        aria-label="Scale band — click to cycle through user tiers"
        title="Click to cycle scale band"
      >
        <span class="context-chip-label">Scale</span>
        <span class="context-chip-value">${escapeHtml(snapshot.scaleBand)}</span>
        <span class="context-chip-cycle" aria-hidden="true">↻</span>
      </button>
      <button
        type="button"
        class="context-chip is-toggle"
        data-context="compliance_tier"
        aria-pressed="false"
        aria-label="Compliance tier — click to cycle"
        title="Click to cycle compliance tier"
      >
        <span class="context-chip-label">Compliance</span>
        <span class="context-chip-value">${escapeHtml(snapshot.complianceTier)}</span>
        <span class="context-chip-cycle" aria-hidden="true">↻</span>
      </button>
      <button
        type="button"
        class="context-chip is-toggle ${snapshot.isCoreIp ? "is-active" : ""}"
        data-context="is_core_ip"
        aria-pressed="${snapshot.isCoreIp}"
        aria-label="Core IP flag — click to toggle"
        title="Click to toggle core IP"
      >
        <span class="context-chip-label">Core IP</span>
        <span class="context-chip-value">${snapshot.isCoreIp ? "Yes" : "No"}</span>
        <span class="context-chip-cycle" aria-hidden="true">↻</span>
      </button>
      <span class="context-chip is-display">${escapeHtml(timelineLabel)}</span>
    </div>
  `;
}

/**
 * Human triggers for tools a judge may lack an agent for: Act 2 (simulate),
 * Act 3 (override), Solve for Build, and Compare top 2.
 * All route through runDecisionTool with source: human.
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderQuickActions(snapshot) {
  if (snapshot.options.length === 0) {
    return "";
  }
  const isScraping = snapshot.preset === "scraping";
  const buildOption = snapshot.options.find((item) => item.type === "build");
  const buildId = buildOption?.id ?? "";
  const canSolve = Boolean(buildId);
  const topTwo = snapshot.ranking.length >= 2
    ? snapshot.ranking.slice(0, 2)
    : snapshot.options.slice(0, 2);
  const canCompare = topTwo.length === 2 && topTwo[0].id !== topTwo[1].id;
  const firstId = topTwo[0]?.id ?? "";
  const secondId = topTwo[1]?.id ?? "";
  return `
    <div class="quick-actions" id="quick-actions" role="group" aria-label="Quick actions (human)">
      <button
        type="button"
        class="btn btn-ghost quick-action"
        data-action="simulate-stress"
        ${isScraping ? "" : "disabled"}
        title="${isScraping ? "Run simulate_future_scenario with HIPAA + 50k+ (Act 2 stress)" : "Load Scraping preset first — Act 2 leader-flip is HIPAA + 50k+ on Scraping"}"
      >
        Run Act 2 stress (HIPAA + 50k+)
      </button>
      <button
        type="button"
        class="btn btn-ghost quick-action"
        data-action="pin-build"
        title="Pin Build against the math leader with a human override reason (Act 3)"
      >
        Pin Build (Act 3)
      </button>
      <button
        type="button"
        class="btn btn-ghost quick-action"
        data-action="solve-build"
        data-build-id="${escapeHtml(buildId)}"
        ${canSolve ? "" : "disabled"}
        title="${canSolve ? "Ask what must change for Build to win (solve_winning_conditions)" : "No Build option in this decision"}"
      >
        Solve for Build
      </button>
      <button
        type="button"
        class="btn btn-ghost quick-action"
        data-action="compare-top2"
        data-first="${escapeHtml(firstId)}"
        data-second="${escapeHtml(secondId)}"
        ${canCompare ? "" : "disabled"}
        title="Compare the top two ranked options across all axes"
      >
        Compare top 2
      </button>
    </div>
  `;
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderOverrideBanner(snapshot) {
  const pinned = snapshot.options.find((o) => o.id === snapshot.override.pinnedOptionId);
  const leader = snapshot.options.find((o) => o.id === snapshot.override.mathLeaderId);
  const pinnedName = pinned?.name ?? snapshot.override.pinnedOptionId ?? "—";
  const leaderName = leader?.name ?? snapshot.override.mathLeaderId ?? "—";
  const gap = snapshot.override.scoreGap ?? 0;
  const reason = snapshot.override.reason ?? "";

  return `
    <div class="override-banner" role="status">
      <strong>Pinned:</strong> ${escapeHtml(pinnedName)}
      · <strong>Math leader:</strong> ${escapeHtml(leaderName)}
      · <strong>Gap:</strong> ${escapeHtml(String(gap))} pts
      · <strong>Reason:</strong> ${escapeHtml(reason)}
    </div>
  `;
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderCardsSection(snapshot, pulseClass, pulseBadge) {
  if (snapshot.options.length === 0) {
    const params = new URLSearchParams(window.location.search);
    const blankBoot = params.get("blank") === "1" || params.get("agent") === "1";
    const emptyHint = blankBoot
      ? "Empty canvas for agent recording. Human: load a demo with the buttons above."
      : "Recording agent video? Open <code>?blank=1</code>.";
    return `
      <section class="cards-section${pulseClass("cards-section")}" id="cards-section" aria-label="Decision options">
        ${pulseBadge("cards-section")}
        <div class="cards-grid cards-empty-state">
          <p class="cards-empty">Waiting for decision…</p>
          <div class="cards-empty-actions">
            <button type="button" class="btn btn-primary" data-action="load-auth-demo">Load Auth Demo</button>
            <button type="button" class="btn btn-ghost" data-action="load-scraping-demo">Load Scraping Demo</button>
          </div>
          <p class="cards-empty-hint">${emptyHint}</p>
        </div>
      </section>
    `;
  }

  const rankedById = new Map(snapshot.ranking.map((item) => [item.id, item]));
  // Keep cards in last-known rank order when stale — only rank/score go to "—".
  // Falls back to seed order only before the first rerank (no ranking yet).
  const orderedOptions = snapshot.ranking.length > 0
    ? [...snapshot.ranking]
        .sort((a, b) => a.rank - b.rank)
        .map((ranked) => snapshot.options.find((o) => o.id === ranked.id))
        .filter(Boolean)
    : snapshot.options;

  return `
    <section class="cards-section${pulseClass("cards-section")}" id="cards-section" aria-label="Decision options">
      ${pulseBadge("cards-section")}
      <div class="cards-grid">
        ${orderedOptions.map((option) => renderOptionCard(option, snapshot, rankedById.get(option.id))).join("")}
      </div>
    </section>
  `;
}

/**
 * @param {import("./decision.js").DecisionOption} option
 * @param {ReturnType<typeof getSnapshot>} snapshot
 * @param {import("./decision.js").RankedOption | undefined} ranked
 */
function renderOptionCard(option, snapshot, ranked) {
  const typeLabel = TYPE_LABELS[option.type] ?? option.type.toUpperCase();
  const typeClass = option.type === "open_source" ? "type-adopt" : `type-${option.type}`;

  let rankDisplay = "—";
  let scoreDisplay = "—";
  let isWinner = false;

  if (snapshot.rankingCurrent && ranked) {
    rankDisplay = String(ranked.rank);
    scoreDisplay = formatCardScore(snapshot, ranked);
    isWinner = ranked.rank === 1;
  }

  const isPinned = snapshot.override.active && snapshot.override.pinnedOptionId === option.id;
  const isMathLeader = snapshot.override.active && snapshot.override.mathLeaderId === option.id;

  const metrics = ranked?.metrics ?? deriveMetrics(option);
  const cardClasses = [
    "option-card",
    isWinner && !isPinned ? "is-winner" : "",
    isPinned ? "is-pinned" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <article class="${cardClasses}">
      <div class="card-header">
        <span class="type-chip ${typeClass}">${escapeHtml(typeLabel)}</span>
        <div class="card-badges">
          ${isWinner && snapshot.rankingCurrent ? '<span class="badge badge-winner">Winner</span>' : ""}
          ${isPinned ? '<span class="badge badge-override">Override</span>' : ""}
          ${isMathLeader ? '<span class="badge badge-objective">Objective #1</span>' : ""}
          ${option.estimate ? '<span class="badge badge-estimate">Estimate</span>' : ""}
        </div>
      </div>
      <h3 class="card-name">${escapeHtml(option.name)}</h3>
      <div class="card-rank-score">
        <span class="rank-label">Rank <strong>#${escapeHtml(rankDisplay)}</strong></span>
        <span class="score-label">${escapeHtml(scoreDisplay)}</span>
      </div>
      <dl class="card-metrics">
        <div class="metric-row">
          <dt>Time to prototype</dt>
          <dd>${escapeHtml(formatHours(metrics.prototype_time_hours))}</dd>
        </div>
        <div class="metric-row">
          <dt>Cash TCO (5yr)</dt>
          <dd>${escapeHtml(formatMoney(metrics.cash_tco ?? option.monthly_cash_cost * 60))}</dd>
        </div>
        <div class="metric-row">
          <dt>Monthly maintenance</dt>
          <dd>${escapeHtml(formatMaintenance(metrics.monthly_maintenance_hours ?? option.monthly_maintenance_hours))}</dd>
        </div>
        <div class="metric-row metric-row-secondary">
          <dt>Labor est. (display only)</dt>
          <dd>${escapeHtml(formatMoney(metrics.labor_estimate_display ?? (option.prototype_time_hours + option.monthly_maintenance_hours * 60) * 75))}</dd>
        </div>
      </dl>
      <p class="card-disclaimer">Author estimates for demo — not vendor quotes or audited TCO.</p>
      ${
        Array.isArray(option.sources) && option.sources.length > 0
          ? `<details class="card-sources"><summary>Assumptions (${option.sources.length})</summary><ul>${option.sources
              .map((src) => `<li>${escapeHtml(src)}</li>`)
              .join("")}</ul></details>`
          : ""
      }
    </article>
  `;
}

/**
 * @param {import("./decision.js").DecisionOption} option
 */
function deriveMetrics(option) {
  return {
    prototype_time_hours: option.prototype_time_hours,
    cash_tco: option.monthly_cash_cost * 60,
    monthly_maintenance_hours: option.monthly_maintenance_hours,
  };
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderWeightsSection(snapshot, pulseClass, pulseBadge) {
  const stale = snapshot.options.length > 0 && !snapshot.rankingCurrent;

  return `
    <section class="weights-section${pulseClass("weights-section")}" id="weights-section" aria-labelledby="weights-heading">
      ${pulseBadge("weights-section")}
      <div class="weights-header">
        <h2 id="weights-heading">Priority weights</h2>
        <div class="weights-actions">
          ${stale ? '<div class="stale-banner">Weights are stale — re-rank to get updated scores.</div>' : ""}
          <button type="button" class="btn btn-primary ${stale ? "is-highlight" : ""}" id="rerank-button">
            Rerank
          </button>
        </div>
      </div>
      <div class="sliders-grid">
        ${CRITERION_KEYS.map((key) => renderSlider(key, snapshot.weights[key])).join("")}
      </div>
    </section>
  `;
}

/**
 * @param {import("./decision.js").CriterionKey} criterion
 * @param {number} weight
 */
function renderSlider(criterion, weight) {
  const label = CRITERION_LABELS[criterion];
  const fillPct = (weight / 10) * 100;
  return `
    <label class="slider-field" for="weight-${escapeHtml(criterion)}">
      <span class="slider-label">${escapeHtml(label)}</span>
      <span class="slider-value" id="weight-value-${escapeHtml(criterion)}">${escapeHtml(weight.toFixed(1))}</span>
      <input
        type="range"
        id="weight-${escapeHtml(criterion)}"
        name="${escapeHtml(criterion)}"
        min="0"
        max="10"
        step="0.1"
        value="${escapeHtml(String(weight))}"
        data-criterion="${escapeHtml(criterion)}"
        style="--slider-fill: ${fillPct}%"
      />
    </label>
  `;
}

/**
 * @returns {string}
 */
function renderPromptRows() {
  return `
    <ul class="prompts-list">
      ${TRY_PROMPTS.map(
        (item, index) => `
          <li class="prompt-row">
            <span class="prompt-act">${escapeHtml(item.act)}</span>
            <p class="prompt-text">${escapeHtml(item.text)}</p>
            <button
              type="button"
              class="btn btn-ghost prompt-copy-btn"
              data-prompt-index="${index}"
              aria-label="Copy ${escapeHtml(item.act)} prompt"
            >Copy</button>
          </li>
        `,
      ).join("")}
    </ul>
  `;
}

/**
 * Copy-paste prompts for judges testing the agent path.
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderPromptsPanel(snapshot) {
  const hasDecision = snapshot.options.length > 0;
  const params = new URLSearchParams(window.location.search);
  const blankBoot = params.get("blank") === "1" || params.get("agent") === "1";

  let subtitle;
  if (hasDecision) {
    subtitle = "Copy into ChatGPT to drive the demo.";
  } else if (blankBoot) {
    subtitle = "Blank canvas for agent recording — copy a prompt below into ChatGPT.";
  } else {
    subtitle = "Copy a prompt into ChatGPT, or load a demo from the main canvas.";
  }

  const blankHint =
    !hasDecision && !blankBoot
      ? `<p class="prompts-empty-hint">Recording agent video? Open <code>?blank=1</code> for an empty canvas.</p>`
      : "";

  return `
    <details class="prompts-panel rail-panel" open>
      <summary class="prompts-panel-summary">Try this prompt</summary>
      <p class="prompts-subtitle">${escapeHtml(subtitle)}</p>
      ${renderPromptRows()}
      ${blankHint}
    </details>
  `;
}

/**
 * Honest audit-trail copy: Chaos 5 happens mid-session with a populated log.
 * The tell is no new matching entry, not an empty log.
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function auditTrailCopy(snapshot) {
  const base =
    "Every ranking claim must have a matching rerank_decision_options entry here. A claim with no new matching entry is ungrounded — including when this log is already full.";
  if (snapshot.toolLog.length === 0) {
    return `<p class="tool-log-trail">${base}</p>`;
  }
  const last = snapshot.toolLog[snapshot.toolLog.length - 1];
  return `<p class="tool-log-trail">${base} Last call: <code>${escapeHtml(last.tool)}</code> at ${escapeHtml(formatTimestamp(last.timestamp))}.</p>`;
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderToolLog(snapshot) {
  if (snapshot.toolLog.length === 0) {
    return `
      <section class="rail-panel" aria-labelledby="tool-log-heading">
        <h2 id="tool-log-heading">Tool log</h2>
        <p class="tool-log-subtitle">Human and agent actions share one store.</p>
        <p class="rail-empty">No tool calls yet.</p>
        ${auditTrailCopy(snapshot)}
      </section>
    `;
  }

  return `
    <section class="rail-panel" aria-labelledby="tool-log-heading">
      <h2 id="tool-log-heading">Tool log</h2>
      <p class="tool-log-subtitle">Human and agent actions share one store.</p>
      ${auditTrailCopy(snapshot)}
      <ul class="tool-log-list">
        ${snapshot.toolLog
          .slice()
          .reverse()
          .map(
            (entry) => `
              <li>
                <details class="tool-log-entry" data-log-timestamp="${escapeHtml(entry.timestamp)}"${entry.timestamp === expandedLogTimestamp ? " open" : ""}>
                  <summary class="tool-log-summary-row">
                    <div class="tool-log-meta">
                      <time class="tool-log-time" datetime="${escapeHtml(entry.timestamp)}">${escapeHtml(formatTimestamp(entry.timestamp))}</time>
                      <span class="tool-log-source source-${escapeHtml(entry.source ?? "agent")}">${escapeHtml(entry.source ?? "agent")}</span>
                    </div>
                    <code class="tool-log-name">${escapeHtml(entry.tool)}</code>
                    <span class="tool-log-summary">${escapeHtml(entry.summary)}</span>
                  </summary>
                  <div class="tool-log-detail">
                    <p class="tool-log-detail-label">Input</p>
                    <pre>${escapeHtml(JSON.stringify(entry.input, null, 2))}</pre>
                    ${formatLogRanking(entry)}
                  </div>
                </details>
              </li>
            `,
          )
          .join("")}
      </ul>
    </section>
  `;
}

/**
 * @param {import("./decision.js").ToolLogEntry} entry
 */
function formatLogRanking(entry) {
  if (!entry.ranking?.length) {
    return "";
  }
  const top = entry.ranking.slice(0, 4);
  const more = entry.ranking.length > 4 ? `<li class="tool-log-ranking-more">… +${entry.ranking.length - 4} more</li>` : "";
  const badgeClass = entry.rankingCurrent ? "is-current" : "is-stale";
  const badgeLabel = entry.rankingCurrent ? "current" : "stale";
  return `
    <p class="tool-log-detail-label">
      Ranking snapshot
      <span class="tool-log-ranking-badge ${badgeClass}">${badgeLabel}</span>
    </p>
    <ul class="tool-log-ranking-list">
      ${top
        .map(
          (item) =>
            `<li><code>${escapeHtml(item.id)}</code> #${item.rank} @${escapeHtml(String(item.displayScore))}</li>`,
        )
        .join("")}
      ${more}
    </ul>
  `;
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderAgentInsight(snapshot) {
  if (!snapshot.lastInsight) {
    return "";
  }

  const { tool, summary, payload } = snapshot.lastInsight;
  let body = "";

  if (tool === "compare_decision_options" && payload && typeof payload === "object") {
    const result = /** @type {ReturnType<import("./decision.js").compareDecisionOptions>} */ (payload);
    const winnerLine =
      result.winner === "tie"
        ? "Overall: tie"
        : `Overall winner: ${result.winner} (${result.first.displayScore} vs ${result.second.displayScore})`;
    const tradeoffs = CRITERION_KEYS.filter((key) => result.tradeoffs[key]?.winner !== "tie")
      .slice(0, 3)
      .map((key) => {
        const t = result.tradeoffs[key];
        return `${t.label}: ${t.winner} leads`;
      });
    body = `
      <p class="insight-headline">${escapeHtml(result.first.id)} vs ${escapeHtml(result.second.id)}</p>
      <p class="insight-line">${escapeHtml(winnerLine)}</p>
      ${tradeoffs.length ? `<ul class="insight-list">${tradeoffs.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
    `;
  } else if (tool === "solve_winning_conditions" && payload && typeof payload === "object") {
    const result = /** @type {ReturnType<import("./decision.js").solveWinningConditions>} */ (payload);
    const levers = (result.levers ?? []).slice(0, 4);
    const shifts = (result.suggested_context_shifts ?? []).slice(0, 2);
    body = `
      <p class="insight-headline">Gap: ${escapeHtml(String(result.score_gap ?? 0))} pts vs ${escapeHtml(result.leader_name ?? "leader")}</p>
      <ul class="insight-list">${levers.map((lever) => `<li>${escapeHtml(lever)}</li>`).join("")}</ul>
      ${shifts.length ? `<p class="insight-shifts">${shifts.map((s) => escapeHtml(String(s))).join(" · ")}</p>` : ""}
    `;
  } else if (tool === "simulate_future_scenario" && payload && typeof payload === "object") {
    const result = /** @type {ReturnType<import("./decision.js").simulateFutureScenario>} */ (payload);
    const leader = result.leader
      ? `${result.leader.name} · ${result.leader.displayScore}`
      : "—";
    body = `
      <p class="insight-headline">${escapeHtml(result.scenario_name)}</p>
      <p class="insight-line">Projected leader: ${escapeHtml(leader)}</p>
      <p class="insight-note">Baseline unchanged — see banner for full projection.</p>
    `;
  } else {
    body = `<p class="insight-line">${escapeHtml(summary)}</p>`;
  }

  return `
    <details class="insight-rail rail-panel" open>
      <summary class="insight-rail-summary">Last agent insight</summary>
      <p class="insight-tool"><code>${escapeHtml(tool)}</code></p>
      ${body}
    </details>
  `;
}

/**
 * Act 2 visibility: render the last simulate_future_scenario projection as a slim banner.
 * Does not mutate the baseline ranking — projection is display-only.
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderSimulationBanner(snapshot) {
  if (!snapshot.lastSimulation) {
    return "";
  }
  const sim = snapshot.lastSimulation;
  const leader = sim.leader ? `${escapeHtml(sim.leader.name)} · ${escapeHtml(String(sim.leader.displayScore.toFixed(1)))}` : "—";
  const assumptionLines = Array.isArray(sim.assumptions) ? sim.assumptions.slice(0, 4) : [];
  return `
    <section class="sim-banner" aria-live="polite">
      <p class="sim-banner-title">Projected stress: <strong>${escapeHtml(sim.scenario_name)}</strong></p>
      <p class="sim-banner-leader">Projected leader: ${leader}</p>
      ${
        assumptionLines.length
          ? `<ul class="sim-banner-assumptions">${assumptionLines
              .map((line) => `<li>${escapeHtml(line)}</li>`)
              .join("")}</ul>`
          : ""
      }
      <p class="sim-banner-note">Projection only — baseline cards and scores are unchanged. Rerank does not apply stress; use simulate_future_scenario.</p>
    </section>
  `;
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function renderLedger(snapshot) {
  if (!snapshot.override.active || snapshot.liabilities.length === 0) {
    return `
      <section class="rail-panel" aria-labelledby="ledger-heading">
        <h2 id="ledger-heading">Liability ledger</h2>
        <p class="rail-empty">Empty until human override.</p>
      </section>
    `;
  }

  return `
    <section class="rail-panel" aria-labelledby="ledger-heading">
      <h2 id="ledger-heading">Liability ledger</h2>
      <ul class="ledger-list">
        ${snapshot.liabilities
          .map(
            (item) => `
              <li class="ledger-entry severity-${escapeHtml(item.severity)}">
                <p class="ledger-title">${escapeHtml(item.title)}</p>
                <p class="ledger-desc">${escapeHtml(item.description)}</p>
                <span class="ledger-severity">${escapeHtml(item.severity)}</span>
              </li>
            `,
          )
          .join("")}
      </ul>
    </section>
  `;
}

/**
 * Load a preset through the same WebMCP execute path as the agent.
 * @param {"auth" | "scraping"} preset
 */
export async function loadPresetViaTools(preset) {
  if (presetLoadPending) {
    return;
  }
  presetLoadPending = true;
  currentPreset = preset;
  try {
    await runDecisionTool("create_decision", { preset, org_context: "solo" }, { source: "human" });
    await runDecisionTool(
      "set_decision_context",
      { scale_band: "1k-10k", timeline_days: 14 },
      { source: "human" },
    );
    await runDecisionTool("rerank_decision_options", {}, { source: "human" });
  } finally {
    presetLoadPending = false;
  }
}

/**
 * @param {HTMLElement} root
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function bindEvents(root, snapshot) {
  for (const details of root.querySelectorAll("details.tool-log-entry")) {
    details.addEventListener("toggle", () => {
      const ts = details.getAttribute("data-log-timestamp");
      expandedLogTimestamp = details.open && ts ? ts : null;
    });
  }

  root.querySelector("#theme-toggle")?.addEventListener("click", () => {
    applyTheme(currentTheme === "ink" ? "paper" : "ink");
    const toggle = root.querySelector("#theme-toggle");
    if (toggle) {
      toggle.textContent = currentTheme === "ink" ? "Paper theme" : "Ink theme";
    }
  });

  root.querySelector("#load-auth-preset")?.addEventListener("click", async () => {
    try {
      const preset = currentPreset === "scraping" ? "scraping" : "auth";
      await loadPresetViaTools(preset);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  });

  root.querySelector("#export-state")?.addEventListener("click", () => {
    try {
      const payload = exportDecisionState();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `buildvsbuy-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  });

  const importInput = root.querySelector("#import-state-file");
  root.querySelector("#import-state")?.addEventListener("click", () => {
    importInput?.click();
  });
  importInput?.addEventListener("change", async (event) => {
    const target = /** @type {HTMLInputElement} */ (event.currentTarget);
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      importDecisionState(payload);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    } finally {
      target.value = "";
    }
  });

  for (const button of root.querySelectorAll(".prompt-copy-btn")) {
    button.addEventListener("click", async () => {
      const index = Number(button.getAttribute("data-prompt-index"));
      const prompt = TRY_PROMPTS[index];
      if (!prompt) {
        return;
      }
      try {
        await navigator.clipboard.writeText(prompt.text);
        const prev = button.textContent;
        button.textContent = "Copied!";
        window.setTimeout(() => {
          button.textContent = prev;
        }, 1500);
      } catch {
        window.alert("Could not copy to clipboard.");
      }
    });
  }

  for (const button of root.querySelectorAll(".cards-empty-actions [data-action]")) {
    button.addEventListener("click", async () => {
      const action = button.getAttribute("data-action");
      try {
        if (action === "load-auth-demo") {
          await loadPresetViaTools("auth");
        } else if (action === "load-scraping-demo") {
          await loadPresetViaTools("scraping");
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    });
  }

  for (const button of root.querySelectorAll("[data-preset-switch]")) {
    button.addEventListener("click", async () => {
      const preset = button.getAttribute("data-preset-switch");
      if (preset !== "auth" && preset !== "scraping") {
        return;
      }
      if (preset === currentPreset && snapshot.options.length > 0) {
        return;
      }
      try {
        await loadPresetViaTools(preset);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    });
  }

  root.querySelector("#rerank-button")?.addEventListener("click", async () => {
    try {
      await runDecisionTool("rerank_decision_options", {}, { source: "human" });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  });

  for (const button of root.querySelectorAll(".quick-action[data-action]")) {
    button.addEventListener("click", async () => {
      const action = button.getAttribute("data-action");
      try {
        if (action === "simulate-stress") {
          const snap = getSnapshot();
          if (snap.preset !== "scraping") {
            window.alert("Load the Scraping preset first — Act 2 is the HIPAA + 50k+ leader-flip on Scraping.");
            return;
          }
          await runDecisionTool(
            "simulate_future_scenario",
            { scenario_name: "HIPAA at 50k+ (human)", scale_band: "50k+", compliance_tier: "hipaa" },
            { source: "human" },
          );
        } else if (action === "pin-build") {
          const reason = window.prompt(
            "Override reason (required) — why pin Build against the math leader?",
            "Auth is core IP — we must own tenant isolation.",
          );
          if (!reason || !reason.trim()) {
            return;
          }
          // Engine only pins Build when is_core_ip is true. Set it, rerank,
          // then override so the button matches its label.
          const snap = getSnapshot();
          if (!snap.isCoreIp) {
            await runDecisionTool("set_decision_context", { is_core_ip: true }, { source: "human" });
          }
          await runDecisionTool("rerank_decision_options", {}, { source: "human" });
          await runDecisionTool(
            "apply_human_preference_override",
            { pin_recommendation: true, override_reason: reason.trim() },
            { source: "human" },
          );
        } else if (action === "solve-build") {
          const buildId = button.getAttribute("data-build-id") ?? "";
          if (!buildId) {
            return;
          }
          // Engine refuses solve on stale ranks. Rerank first so a slider
          // change cannot turn this button into an alert.
          const snap = getSnapshot();
          if (!snap.rankingCurrent) {
            await runDecisionTool("rerank_decision_options", {}, { source: "human" });
          }
          await runDecisionTool(
            "solve_winning_conditions",
            { target_option_id: buildId },
            { source: "human" },
          );
        } else if (action === "compare-top2") {
          const firstId = button.getAttribute("data-first") ?? "";
          const secondId = button.getAttribute("data-second") ?? "";
          if (!firstId || !secondId || firstId === secondId) {
            return;
          }
          await runDecisionTool(
            "compare_decision_options",
            { first_option_id: firstId, second_option_id: secondId },
            { source: "human" },
          );
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    });
  }

  for (const button of root.querySelectorAll("[data-context]")) {
    button.addEventListener("click", async () => {
      const key = button.getAttribute("data-context");
      try {
        if (key === "scale_band") {
          const next = cycleValue(SCALE_BANDS, snapshot.scaleBand);
          await runDecisionTool("set_decision_context", { scale_band: next }, { source: "human" });
        } else if (key === "compliance_tier") {
          const next = cycleValue(COMPLIANCE_TIERS, snapshot.complianceTier);
          await runDecisionTool("set_decision_context", { compliance_tier: next }, { source: "human" });
        } else if (key === "is_core_ip") {
          const next = !snapshot.isCoreIp;
          await runDecisionTool("set_decision_context", { is_core_ip: next }, { source: "human" });
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    });
  }

  for (const input of root.querySelectorAll('input[type="range"][data-criterion]')) {
    input.addEventListener("input", (event) => {
      const target = /** @type {HTMLInputElement} */ (event.currentTarget);
      const criterion = target.dataset.criterion;
      const weight = Number(target.value);
      const valueEl = root.querySelector(`#weight-value-${criterion}`);
      if (valueEl) {
        valueEl.textContent = weight.toFixed(1);
      }
      target.style.setProperty("--slider-fill", `${(weight / 10) * 100}%`);
    });

    input.addEventListener("change", async (event) => {
      const target = /** @type {HTMLInputElement} */ (event.currentTarget);
      const criterion = target.dataset.criterion;
      const weight = Number(target.value);
      try {
        await runDecisionTool("set_priority_weight", { criterion, weight }, { source: "human" });
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    });
  }
}

/**
 * Re-render whenever the shared decision store changes.
 * @param {HTMLElement} root
 * @param {() => { source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} getWebmcp
 */
export function bindApp(root, getWebmcp) {
  appRoot = root;
  appGetWebmcp = getWebmcp;
  const redraw = () => {
    const snap = getSnapshot();
    if (snap.options.length === 0) {
      lastLogLen = 0;
    } else if (snap.toolLog.length > lastLogLen) {
      const entry = snap.toolLog[snap.toolLog.length - 1];
      const regionId = mapToolToRegion(entry.tool);
      if (regionId) {
        triggerPulse(regionId, entry.source ?? "agent");
      }
    }
    lastLogLen = snap.toolLog.length;
    renderApp(root, getWebmcp());
  };
  subscribe(redraw);
  redraw();
}

/**
 * Set the active preset tracker from outside the module (e.g. boot via ?preset=scraping).
 * Does not load the preset — caller must invoke the matching loader.
 * @param {"auth" | "scraping"} next
 */
export function setCurrentPreset(next) {
  if (next === "auth" || next === "scraping") {
    currentPreset = next;
  }
}

/**
 * @template {string} T
 * @param {readonly T[]} values
 * @param {T} current
 * @returns {T}
 */
function cycleValue(values, current) {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length];
}

/**
 * @param {string} tool
 * @returns {string | null}
 */
function mapToolToRegion(tool) {
  switch (tool) {
    case "set_decision_context":
      return "context-strip";
    case "set_priority_weight":
      return "weights-section";
    case "rerank_decision_options":
    case "apply_human_preference_override":
    case "add_option":
    case "compare_decision_options":
    case "solve_winning_conditions":
    case "simulate_future_scenario":
      return "cards-section";
    case "create_decision":
      return "preset-switcher";
    default:
      return null;
  }
}

/**
 * @param {string} regionId
 * @param {string} source
 */
function triggerPulse(regionId, source) {
  activePulse = { regionId, source, at: Date.now() };
  if (pulseTimer != null) {
    window.clearTimeout(pulseTimer);
  }
  pulseTimer = window.setTimeout(() => {
    activePulse = null;
    pulseTimer = null;
    if (appRoot && appGetWebmcp) {
      renderApp(appRoot, appGetWebmcp());
    }
  }, 2000);
}

/**
 * @param {HTMLElement} root
 * @returns {{ id: string, type: string, rangeValue?: string, criterion?: string | null } | null}
 */
function captureFocusState(root) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) {
    return null;
  }
  /** @type {{ id: string, type: string, rangeValue?: string, criterion?: string | null }} */
  const state = { id: active.id, type: active.tagName };
  if (active instanceof HTMLInputElement && active.type === "range") {
    state.rangeValue = active.value;
    state.criterion = active.dataset.criterion ?? null;
  }
  return state.id ? state : null;
}

/**
 * @param {HTMLElement} root
 * @param {{ id: string, type: string, rangeValue?: string, criterion?: string | null } | null} focusState
 */
function restoreFocusState(root, focusState) {
  if (!focusState?.id) {
    return;
  }
  const el = root.querySelector(`#${CSS.escape(focusState.id)}`);
  if (!(el instanceof HTMLElement)) {
    return;
  }
  el.focus({ preventScroll: true });
  if (el instanceof HTMLInputElement && el.type === "range" && focusState.rangeValue != null) {
    el.value = focusState.rangeValue;
    el.style.setProperty("--slider-fill", `${(Number(el.value) / 10) * 100}%`);
    const valueEl = root.querySelector(`#weight-value-${focusState.criterion}`);
    if (valueEl) {
      valueEl.textContent = Number(el.value).toFixed(1);
    }
  }
}

/** @param {ReturnType<typeof getSnapshot>} snapshot
 * @param {import("./decision.js").RankedOption} ranked
 */
function formatCardScore(snapshot, ranked) {
  const oneDpValues = snapshot.ranking.map((item) => item.displayScore.toFixed(1));
  const allSameAtOneDp = new Set(oneDpValues).size === 1 && snapshot.ranking.length > 1;
  if (allSameAtOneDp) {
    return ranked.score.toFixed(2);
  }
  return ranked.displayScore.toFixed(1);
}

/** @param {string | undefined} value */
function formatOrgContext(value) {
  const labels = { solo: "Solo", startup: "Startup", enterprise: "Enterprise" };
  return labels[value] ?? value ?? "—";
}

/** @param {string | undefined} value */
function formatSkillLevel(value) {
  const labels = { vibe: "Vibe", mid: "Mid", senior: "Senior" };
  return labels[value] ?? value ?? "—";
}

/** @param {number} hours */
function formatHours(hours) {
  return `${hours}h`;
}

/** @param {number} hours */
function formatMaintenance(hours) {
  return `${hours}h/mo`;
}

/** @param {number} value */
function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** @param {string} iso */
function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

/** @param {unknown} value */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
