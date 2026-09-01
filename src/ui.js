import {
  CRITERION_KEYS,
  CRITERION_LABELS,
  appendToolLog,
  getSnapshot,
  loadDefaultDemo,
  loadScrapingDemo,
  rerankDecisionOptions,
  setDecisionContext,
  setPriorityWeight,
  subscribe,
} from "./decision.js";

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
  document.documentElement.dataset.theme = currentTheme;

  // Sync preset tracker from store (agent create_decision) or clear when empty.
  if (snapshot.options.length > 0 && (snapshot.preset === "auth" || snapshot.preset === "scraping")) {
    currentPreset = snapshot.preset;
  } else if (snapshot.options.length === 0) {
    currentPreset = null;
  }

  root.innerHTML = `
    <div class="app">
      ${renderHeader(snapshot, webmcp)}
      <div class="main-grid">
      <div class="main-column">
        ${renderContextStrip(snapshot)}
        ${renderSimulationBanner(snapshot)}
        ${snapshot.override.active ? renderOverrideBanner(snapshot) : ""}
        ${renderCardsSection(snapshot)}
        ${renderWeightsSection(snapshot)}
      </div>
        <aside class="right-rail">
          ${renderToolLog(snapshot)}
          ${renderLedger(snapshot)}
        </aside>
      </div>
    </div>
  `;

  bindEvents(root, snapshot);
}

/**
 * @param {ReturnType<typeof getSnapshot>} snapshot
 * @param {{ source: "native" | "polyfill" | "unavailable", error: string | null, tools: Array<{ name: string, description?: string }> }} webmcp
 */
function renderHeader(snapshot, webmcp) {
  const hasDecision = snapshot.options.length > 0;
  const title = hasDecision ? snapshot.title : "BuildVsBuy.ai";
  const problem = hasDecision
    ? snapshot.problemStatement
    : "When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning.";
  const resetTitle = hasDecision
    ? `Reset ${currentPreset === "scraping" ? "Scraping" : "Auth"} demo to Solo · 1k–10k · 14d`
    : "Load a preset with Auth or Scraping above";

  return `
    <header class="header">
      <div class="header-brand">
        <p class="brand">BuildVsBuy.ai</p>
        ${renderPresetSwitcher(hasDecision)}
        ${hasDecision ? `<h1 class="decision-title">${escapeHtml(title)}</h1>` : ""}
        ${hasDecision ? `<p class="header-tagline">Demo scenario — structured estimates</p>` : ""}
        <p class="problem-statement">${escapeHtml(problem)}</p>
      </div>
      <div class="header-actions">
        ${renderWebmcpChip(webmcp)}
        <button type="button" class="btn btn-ghost" id="theme-toggle" aria-label="Toggle theme">
          ${currentTheme === "ink" ? "Paper theme" : "Ink theme"}
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          id="load-auth-preset"
          title="${escapeHtml(resetTitle)}"
          ${hasDecision ? "" : "disabled"}
        >
          Reset demo
        </button>
      </div>
    </header>
  `;
}

/**
 * Segmented preset switcher — Auth | Scraping. Neither highlighted until a preset loads.
 * @param {boolean} hasDecision
 */
function renderPresetSwitcher(hasDecision) {
  return `
    <div class="preset-switcher" role="group" aria-label="Demo preset">
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

  const label = webmcp.source === "native" ? "WebMCP native" : "WebMCP polyfill";
  const status = hasError
    ? "registration error"
    : allRegistered
      ? (webmcp.source === "native" ? "connected" : "no agent (open in ChatGPT Desktop / Chrome WebMCP)")
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
function renderContextStrip(snapshot) {
  const orgLabel = formatOrgContext(snapshot.orgContext);
  const skillLabel = formatSkillLevel(snapshot.skillLevel);
  const timelineLabel =
    snapshot.timelineDays != null ? `Timeline ${snapshot.timelineDays}d` : "Timeline —";

  return `
    <div class="context-strip" role="group" aria-label="Decision context">
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
function renderCardsSection(snapshot) {
  if (snapshot.options.length === 0) {
    return `
      <section class="cards-section" aria-label="Decision options">
        <div class="cards-grid cards-empty-state">
          <p class="cards-empty">Waiting for decision…</p>
          <p class="cards-empty-hint">Agent: call <code>create_decision</code> with preset <code>auth</code> or <code>scraping</code>. Human: pick a preset above.</p>
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
    <section class="cards-section" aria-label="Decision options">
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
function renderWeightsSection(snapshot) {
  const stale = snapshot.options.length > 0 && !snapshot.rankingCurrent;

  return `
    <section class="weights-section" aria-labelledby="weights-heading">
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
              <li class="tool-log-entry">
                <div class="tool-log-meta">
                  <time class="tool-log-time" datetime="${escapeHtml(entry.timestamp)}">${escapeHtml(formatTimestamp(entry.timestamp))}</time>
                  <span class="tool-log-source source-${escapeHtml(entry.source ?? "agent")}">${escapeHtml(entry.source ?? "agent")}</span>
                </div>
                <code class="tool-log-name">${escapeHtml(entry.tool)}</code>
                <span class="tool-log-summary">${escapeHtml(entry.summary)}</span>
              </li>
            `,
          )
          .join("")}
      </ul>
    </section>
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
  return `
    <section class="sim-banner" aria-live="polite">
      <p class="sim-banner-title">Projected stress: <strong>${escapeHtml(sim.scenario_name)}</strong></p>
      <p class="sim-banner-leader">Projected leader: ${leader}</p>
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
 * @param {HTMLElement} root
 * @param {ReturnType<typeof getSnapshot>} snapshot
 */
function bindEvents(root, snapshot) {
  root.querySelector("#theme-toggle")?.addEventListener("click", () => {
    applyTheme(currentTheme === "ink" ? "paper" : "ink");
    const toggle = root.querySelector("#theme-toggle");
    if (toggle) {
      toggle.textContent = currentTheme === "ink" ? "Paper theme" : "Ink theme";
    }
  });

  root.querySelector("#load-auth-preset")?.addEventListener("click", () => {
    if (snapshot.options.length === 0) {
      return;
    }
    try {
      if (currentPreset === "scraping") {
        loadScrapingDemo();
        appendToolLog({
          tool: "create_decision",
          input: { preset: "scraping", action: "reset" },
          summary: "Human: reset Scraping demo",
          source: "human",
        });
      } else {
        loadDefaultDemo();
        appendToolLog({
          tool: "create_decision",
          input: { preset: "auth", action: "reset" },
          summary: "Human: reset Auth demo",
          source: "human",
        });
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  });

  for (const button of root.querySelectorAll("[data-preset-switch]")) {
    button.addEventListener("click", () => {
      const preset = button.getAttribute("data-preset-switch");
      if (preset !== "auth" && preset !== "scraping") {
        return;
      }
      if (preset === currentPreset && snapshot.options.length > 0) {
        return;
      }
      try {
        currentPreset = preset;
        if (preset === "scraping") {
          loadScrapingDemo();
          appendToolLog({
            tool: "create_decision",
            input: { preset: "scraping", action: snapshot.options.length > 0 ? "switch" : "load" },
            summary: snapshot.options.length > 0 ? "Human: switched to Scraping preset" : "Human: loaded Scraping preset",
            source: "human",
          });
        } else {
          loadDefaultDemo();
          appendToolLog({
            tool: "create_decision",
            input: { preset: "auth", action: snapshot.options.length > 0 ? "switch" : "load" },
            summary: snapshot.options.length > 0 ? "Human: switched to Auth preset" : "Human: loaded Auth preset",
            source: "human",
          });
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      }
    });
  }

  root.querySelector("#rerank-button")?.addEventListener("click", () => {
    try {
      rerankDecisionOptions();
      appendToolLog({
        tool: "rerank_decision_options",
        input: {},
        summary: "Human: reranked",
        source: "human",
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  });

  for (const button of root.querySelectorAll("[data-context]")) {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-context");
      try {
        if (key === "scale_band") {
          const next = cycleValue(SCALE_BANDS, snapshot.scaleBand);
          setDecisionContext({ scale_band: next });
          appendToolLog({
            tool: "set_decision_context",
            input: { scale_band: next },
            summary: `Human: scale_band → ${next}`,
            source: "human",
          });
        } else if (key === "compliance_tier") {
          const next = cycleValue(COMPLIANCE_TIERS, snapshot.complianceTier);
          setDecisionContext({ compliance_tier: next });
          appendToolLog({
            tool: "set_decision_context",
            input: { compliance_tier: next },
            summary: `Human: compliance_tier → ${next}`,
            source: "human",
          });
        } else if (key === "is_core_ip") {
          const next = !snapshot.isCoreIp;
          setDecisionContext({ is_core_ip: next });
          appendToolLog({
            tool: "set_decision_context",
            input: { is_core_ip: next },
            summary: `Human: is_core_ip → ${next}`,
            source: "human",
          });
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

    input.addEventListener("change", (event) => {
      const target = /** @type {HTMLInputElement} */ (event.currentTarget);
      const criterion = target.dataset.criterion;
      const weight = Number(target.value);
      try {
        const result = setPriorityWeight({ criterion, weight });
        if (result.changed) {
          appendToolLog({
            tool: "set_priority_weight",
            input: { criterion, weight },
            summary: `Human: ${criterion} → ${weight.toFixed(1)}`,
            source: "human",
          });
        }
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
  const redraw = () => renderApp(root, getWebmcp());
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
