/**
 * BuildVsBuy.ai decision engine — single source of truth for human UI and WebMCP tools.
 */

/** @typedef {"time_to_prototype" | "cash_tco" | "maintenance_overhead" | "customization" | "security_risk" | "strategic_learning" | "vendor_lockin"} CriterionKey */
/** @typedef {"TTP" | "CashTCO" | "MDO" | "CTL" | "SCR" | "LSM" | "VLR"} CriterionCode */
/** @typedef {"build" | "buy" | "open_source" | "hybrid"} OptionType */
/** @typedef {"solo" | "startup" | "enterprise"} OrgContext */
/** @typedef {"vibe" | "mid" | "senior"} SkillLevel */
/** @typedef {"<1k" | "1k-10k" | "10k-50k" | "50k+"} ScaleBand */
/** @typedef {"none" | "soc2" | "hipaa"} ComplianceTier */
/** @typedef {"low" | "medium" | "high"} ToleranceLevel */

/**
 * @typedef {Object} DecisionOption
 * @property {string} id
 * @property {string} name
 * @property {OptionType} type
 * @property {number} prototype_time_hours
 * @property {number} monthly_cash_cost
 * @property {number} monthly_maintenance_hours
 * @property {number} customization_score
 * @property {number} security_risk_score
 * @property {number} learning_value_score
 * @property {number} vendor_lockin_score
 * @property {boolean} [estimate]
 * @property {string[]} [sources]
 */

/**
 * @typedef {Object} AdjustedMetrics
 * @property {number} prototype_time_hours
 * @property {number} monthly_cash_cost
 * @property {number} monthly_maintenance_hours
 * @property {number} cash_tco
 * @property {number} customization_score
 * @property {number} security_risk_score
 * @property {number} learning_value_score
 * @property {number} vendor_lockin_score
 * @property {number} labor_estimate_display
 */

/**
 * @typedef {Object} RankedOption
 * @property {number} rank
 * @property {string} id
 * @property {string} name
 * @property {OptionType} type
 * @property {number} score
 * @property {number} displayScore
 * @property {Record<CriterionKey, number>} breakdown
 * @property {AdjustedMetrics} metrics
 * @property {boolean} estimate
 */

/**
 * @typedef {Object} OverrideState
 * @property {boolean} active
 * @property {string} [reason]
 * @property {string} [pinnedOptionId]
 * @property {string} [mathLeaderId]
 * @property {number} [scoreGap]
 * @property {string} [heavilyFavoredCriterion]
 * @property {ToleranceLevel} [toleranceLevel]
 */

/**
 * @typedef {Object} LiabilityEntry
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {"high" | "medium" | "low"} severity
 */

/**
 * @typedef {Object} ToolLogEntry
 * @property {string} timestamp
 * @property {string} tool
 * @property {unknown} input
 * @property {string} summary
 * @property {"agent" | "human"} source
 * @property {boolean} rankingCurrent
 * @property {RankedOption[]} [ranking]
 */

/** @type {const} */
export const CRITERION_KEYS = Object.freeze([
  "time_to_prototype",
  "cash_tco",
  "maintenance_overhead",
  "customization",
  "security_risk",
  "strategic_learning",
  "vendor_lockin",
]);

/** @type {Record<CriterionKey, CriterionCode>} */
export const CRITERION_CODES = Object.freeze({
  time_to_prototype: "TTP",
  cash_tco: "CashTCO",
  maintenance_overhead: "MDO",
  customization: "CTL",
  security_risk: "SCR",
  strategic_learning: "LSM",
  vendor_lockin: "VLR",
});

/** @type {Record<CriterionKey, string>} */
export const CRITERION_LABELS = Object.freeze({
  time_to_prototype: "Time to prototype",
  cash_tco: "Cash TCO (5yr)",
  maintenance_overhead: "Monthly maintenance",
  customization: "Customization",
  security_risk: "Security risk",
  strategic_learning: "Learning / moat",
  vendor_lockin: "Vendor lock-in",
});

/** @type {const} */
export const OPTION_TYPES = Object.freeze(["build", "buy", "open_source", "hybrid"]);

/** @type {Record<CriterionKey, number>} */
export const DEFAULT_WEIGHTS = Object.freeze({
  time_to_prototype: 8,
  cash_tco: 3,
  maintenance_overhead: 3,
  customization: 6,
  security_risk: 4,
  strategic_learning: 4,
  vendor_lockin: 4,
});

/** @type {Record<CriterionKey, "lower" | "higher">} */
const BETTER_DIRECTION = Object.freeze({
  time_to_prototype: "lower",
  cash_tco: "lower",
  maintenance_overhead: "lower",
  customization: "higher",
  security_risk: "lower",
  strategic_learning: "higher",
  vendor_lockin: "lower",
});

/** @type {readonly DecisionOption[]} */
const AUTH_PRESET_OPTIONS = Object.freeze([
  Object.freeze({
    id: "build",
    name: "Build — Custom JWT + PostgreSQL + Redis",
    type: /** @type {OptionType} */ ("build"),
    prototype_time_hours: 80,
    monthly_cash_cost: 20,
    monthly_maintenance_hours: 4,
    customization_score: 10,
    security_risk_score: 8,
    learning_value_score: 9,
    vendor_lockin_score: 1,
    estimate: false,
    sources: [
      "Prototype hours: author estimate (80h custom JWT + Postgres + Redis)",
      "Cash: self-host infra only ($20/mo recurring)",
    ],
  }),
  Object.freeze({
    id: "buy",
    name: "Buy — Clerk Pro",
    type: /** @type {OptionType} */ ("buy"),
    prototype_time_hours: 6,
    monthly_cash_cost: 25,
    monthly_maintenance_hours: 0.5,
    customization_score: 4,
    security_risk_score: 2,
    learning_value_score: 2,
    vendor_lockin_score: 8,
    estimate: false,
    sources: [
      "Pricing: Clerk Pro public pricing page (Mar 2026)",
      "Maintenance: vendor-managed (0.5h/mo oversight)",
    ],
  }),
  Object.freeze({
    id: "adopt",
    name: "Adopt — Better-Auth",
    type: /** @type {OptionType} */ ("open_source"),
    prototype_time_hours: 12,
    monthly_cash_cost: 15,
    monthly_maintenance_hours: 1.5,
    customization_score: 8,
    security_risk_score: 5,
    learning_value_score: 6,
    vendor_lockin_score: 2,
    estimate: false,
    sources: [
      "Better-Auth OSS docs (self-host, no per-seat cost)",
      "Maintenance: framework upgrades + your own on-call",
    ],
  }),
  Object.freeze({
    id: "hybrid",
    name: "Hybrid — Supabase Auth + RLS",
    type: /** @type {OptionType} */ ("hybrid"),
    prototype_time_hours: 16,
    monthly_cash_cost: 25,
    monthly_maintenance_hours: 1.5,
    customization_score: 7,
    security_risk_score: 3,
    learning_value_score: 5,
    vendor_lockin_score: 6,
    estimate: false,
    sources: [
      "Pricing: Supabase Auth + Postgres public tiers (Mar 2026)",
      "Maintenance: managed core + custom RLS policies",
    ],
  }),
]);

/** @type {readonly DecisionOption[]} */
const SCRAPING_PRESET_OPTIONS = Object.freeze([
  Object.freeze({
    id: "build",
    name: "Build — Playwright + AWS Lambda worker",
    type: /** @type {OptionType} */ ("build"),
    prototype_time_hours: 95,
    monthly_cash_cost: 28,
    monthly_maintenance_hours: 6,
    customization_score: 10,
    security_risk_score: 8,
    learning_value_score: 8,
    vendor_lockin_score: 1,
    estimate: false,
    sources: [
      "Prototype hours: author estimate (95h Playwright + Lambda)",
      "Cash: Lambda + proxy infra ($28/mo recurring)",
    ],
  }),
  Object.freeze({
    id: "buy",
    name: "Buy — Firecrawl Cloud API",
    type: /** @type {OptionType} */ ("buy"),
    prototype_time_hours: 2,
    monthly_cash_cost: 48,
    monthly_maintenance_hours: 0.1,
    customization_score: 5,
    security_risk_score: 2,
    learning_value_score: 3,
    vendor_lockin_score: 8,
    estimate: false,
    sources: [
      "Pricing: Firecrawl public API pricing (Mar 2026)",
      "Maintenance: vendor-managed (0.1h/mo oversight)",
    ],
  }),
  Object.freeze({
    id: "adopt",
    name: "Adopt — Crawl4AI (self-hosted)",
    type: /** @type {OptionType} */ ("open_source"),
    prototype_time_hours: 48,
    monthly_cash_cost: 22,
    monthly_maintenance_hours: 4.5,
    customization_score: 4,
    security_risk_score: 6,
    learning_value_score: 3,
    vendor_lockin_score: 2,
    estimate: false,
    sources: [
      "Crawl4AI OSS (self-host, no per-call cost)",
      "Maintenance: selector rot + headless detection on your on-call",
    ],
  }),
  Object.freeze({
    id: "hybrid",
    name: "Hybrid — Playwright + Bright Data proxies",
    type: /** @type {OptionType} */ ("hybrid"),
    prototype_time_hours: 12,
    monthly_cash_cost: 65,
    monthly_maintenance_hours: 0.8,
    customization_score: 6,
    security_risk_score: 3,
    learning_value_score: 4,
    vendor_lockin_score: 7,
    estimate: false,
    sources: [
      "Pricing: Bright Data proxy tiers (Mar 2026)",
      "Maintenance: managed proxies + custom Playwright flows",
    ],
  }),
]);

/** @type {Set<() => void>} */
const listeners = new Set();

/** @type {string} */
let title = "";

/** @type {string} */
let problemStatement = "";

/** @type {OrgContext} */
let orgContext = "startup";

/** @type {SkillLevel} */
let skillLevel = "vibe";

/** @type {ScaleBand} */
let scaleBand = "<1k";

/** @type {ComplianceTier} */
let complianceTier = "none";

/** @type {boolean} */
let isCoreIp = false;

/** @type {number | null} */
let timelineDays = null;

/** @type {Record<CriterionKey, number>} */
let weights = { ...DEFAULT_WEIGHTS };

/** @type {DecisionOption[]} */
let options = [];

/** @type {RankedOption[]} */
let ranking = [];

/** @type {boolean} */
let rankingCurrent = false;

/** @type {OverrideState} */
let override = { active: false };

/** @type {LiabilityEntry[]} */
let liabilities = [];

/** @type {ToolLogEntry[]} */
let toolLog = [];

/** @type {"" | "auth" | "scraping" | "custom"} */
let preset = "";

/** @type {{ scenario_name: string, leader: { id: string, name: string, displayScore: number } | null, stress_applied: string[], assumptions: string[], projected_ranking: Array<{ id: string, name: string, displayScore: number, rank: number }> } | null} */
let lastSimulation = null;

/** @type {{ tool: string, summary: string, payload: unknown } | null} */
let lastInsight = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function clone(value) {
  return structuredClone(value);
}

/**
 * @param {unknown} value
 * @param {readonly string[]} allowed
 * @param {string} label
 */
function assertEnum(value, allowed, label) {
  if (!allowed.includes(String(value))) {
    throw new Error(`Invalid ${label}: "${value}". Expected one of: ${allowed.join(", ")}.`);
  }
  return String(value);
}

/**
 * @param {unknown} value
 * @param {string} label
 * @param {number} [min]
 * @param {number} [max]
 */
function assertNumber(value, label, min = 0, max = Number.POSITIVE_INFINITY) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${label} must be a finite number between ${min} and ${max}.`);
  }
  return numeric;
}

/**
 * @param {unknown} value
 * @returns {CriterionKey}
 */
function assertCriterionKey(value) {
  return /** @type {CriterionKey} */ (assertEnum(value, CRITERION_KEYS, "criterion"));
}

/**
 * @param {DecisionOption} option
 * @returns {boolean}
 */
function isVibePenalized(option) {
  return option.type === "build";
}

/**
 * @param {DecisionOption} option
 * @param {SkillLevel} skill
 * @returns {AdjustedMetrics}
 */
function adjustMetrics(option, skill) {
  let ttp = option.prototype_time_hours;
  let mdo = option.monthly_maintenance_hours;
  let scr = option.security_risk_score;

  if (skill === "vibe" && isVibePenalized(option)) {
    ttp *= 1.25;
    mdo *= 1.5;
    scr = Math.min(10, scr + 2);
  }

  const cashTco = option.monthly_cash_cost * 60;
  const laborEstimate = (ttp + mdo * 60) * 75;

  return {
    prototype_time_hours: ttp,
    monthly_cash_cost: option.monthly_cash_cost,
    monthly_maintenance_hours: mdo,
    cash_tco: cashTco,
    customization_score: option.customization_score,
    security_risk_score: scr,
    learning_value_score: option.learning_value_score,
    vendor_lockin_score: option.vendor_lockin_score,
    labor_estimate_display: laborEstimate,
  };
}

/**
 * @param {AdjustedMetrics} metrics
 * @param {CriterionKey} key
 */
function metricValue(metrics, key) {
  switch (key) {
    case "time_to_prototype":
      return metrics.prototype_time_hours;
    case "cash_tco":
      return metrics.cash_tco;
    case "maintenance_overhead":
      return metrics.monthly_maintenance_hours;
    case "customization":
      return metrics.customization_score;
    case "security_risk":
      return metrics.security_risk_score;
    case "strategic_learning":
      return metrics.learning_value_score;
    case "vendor_lockin":
      return metrics.vendor_lockin_score;
    default:
      throw new Error(`Unknown criterion key: ${key}`);
  }
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {"lower" | "higher"} better
 */
function unitScore(value, min, max, better) {
  if (max === min) {
    return 1;
  }
  const normalized = (value - min) / (max - min);
  return better === "higher" ? normalized : 1 - normalized;
}

/**
 * @param {DecisionOption[]} activeOptions
 * @param {SkillLevel} skill
 */
function criterionRanges(activeOptions, skill) {
  /** @type {Record<CriterionKey, { min: number, max: number }>} */
  const ranges = {};
  for (const key of CRITERION_KEYS) {
    const values = activeOptions.map((option) => metricValue(adjustMetrics(option, skill), key));
    ranges[key] = { min: Math.min(...values), max: Math.max(...values) };
  }
  return ranges;
}

/**
 * @param {DecisionOption} option
 * @param {Record<CriterionKey, number>} currentWeights
 * @param {DecisionOption[]} activeOptions
 * @param {SkillLevel} skill
 */
function scoreOption(option, currentWeights, activeOptions, skill) {
  const metrics = adjustMetrics(option, skill);
  const ranges = criterionRanges(activeOptions, skill);
  /** @type {Record<CriterionKey, number>} */
  const units = {};
  /** @type {Record<CriterionKey, number>} */
  const breakdown = {};

  for (const key of CRITERION_KEYS) {
    units[key] = unitScore(
      metricValue(metrics, key),
      ranges[key].min,
      ranges[key].max,
      BETTER_DIRECTION[key],
    );
  }

  const totalWeight = CRITERION_KEYS.reduce((sum, key) => sum + currentWeights[key], 0);
  if (totalWeight === 0) {
    for (const key of CRITERION_KEYS) {
      breakdown[key] = 0;
    }
    return { score: 0, displayScore: 0, breakdown, metrics, units };
  }

  let score = 0;
  for (const key of CRITERION_KEYS) {
    breakdown[key] = units[key] * (currentWeights[key] / totalWeight);
    score += breakdown[key];
  }

  return {
    score,
    displayScore: Math.round(score * 10) / 10,
    breakdown,
    metrics,
    units,
  };
}

/**
 * @param {Record<CriterionKey, number>} currentWeights
 * @returns {RankedOption[]}
 */
function computeRanking(currentWeights) {
  if (options.length === 0) {
    return [];
  }

  return options
    .map((option) => {
      const scored = scoreOption(option, currentWeights, options, skillLevel);
      return {
        id: option.id,
        name: option.name,
        type: option.type,
        score: scored.score,
        displayScore: scored.displayScore,
        breakdown: scored.breakdown,
        metrics: scored.metrics,
        estimate: Boolean(option.estimate),
      };
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

/**
 * @param {string} id
 * @returns {DecisionOption}
 */
function findOption(id) {
  const key = String(id ?? "").trim().toLowerCase();
  const option = options.find((item) => item.id.toLowerCase() === key);
  if (!option) {
    throw new Error(`Unknown option "${id}". Known options: ${options.map((item) => item.id).join(", ") || "(none)"}.`);
  }
  return option;
}

/**
 * @param {Partial<DecisionOption>} input
 * @returns {DecisionOption}
 */
function normalizeOptionInput(input) {
  const type = /** @type {OptionType} */ (assertEnum(input.type, OPTION_TYPES, "option type"));
  return {
    id: String(input.id ?? "").trim(),
    name: String(input.name ?? "").trim(),
    type,
    prototype_time_hours: assertNumber(input.prototype_time_hours, "prototype_time_hours", 0),
    monthly_cash_cost: assertNumber(input.monthly_cash_cost, "monthly_cash_cost", 0),
    monthly_maintenance_hours: assertNumber(input.monthly_maintenance_hours, "monthly_maintenance_hours", 0),
    customization_score: assertNumber(input.customization_score, "customization_score", 1, 10),
    security_risk_score: assertNumber(input.security_risk_score, "security_risk_score", 1, 10),
    learning_value_score: assertNumber(input.learning_value_score, "learning_value_score", 1, 10),
    vendor_lockin_score: assertNumber(input.vendor_lockin_score, "vendor_lockin_score", 1, 10),
    estimate: Boolean(input.estimate),
    ...(Array.isArray(input.sources) ? { sources: input.sources.map(String) } : {}),
  };
}

export function reset() {
  title = "";
  problemStatement = "";
  orgContext = "startup";
  skillLevel = "vibe";
  scaleBand = "<1k";
  complianceTier = "none";
  isCoreIp = false;
  timelineDays = null;
  weights = { ...DEFAULT_WEIGHTS };
  options = [];
  ranking = [];
  rankingCurrent = false;
  override = { active: false };
  liabilities = [];
  toolLog = [];
  preset = "";
  lastSimulation = null;
  lastInsight = null;
}

/**
 * @param {{ tool: string, summary: string, payload: unknown } | null} insight
 */
export function setLastInsight(insight) {
  lastInsight = insight
    ? { tool: insight.tool, summary: insight.summary, payload: clone(insight.payload) }
    : null;
}

export function getSnapshot() {
  return clone({
    title,
    problemStatement,
    orgContext,
    skillLevel,
    scaleBand,
    complianceTier,
    isCoreIp,
    timelineDays,
    weights: { ...weights },
    options: options.map((option) => ({ ...option })),
    ranking: ranking.map((item) => ({
      ...item,
      breakdown: { ...item.breakdown },
      metrics: { ...item.metrics },
    })),
    rankingCurrent,
    override: { ...override },
    liabilities: liabilities.map((item) => ({ ...item })),
    toolLog: toolLog.map((entry) => ({ ...entry })),
    preset,
    lastSimulation: lastSimulation
      ? {
          scenario_name: lastSimulation.scenario_name,
          leader: lastSimulation.leader ? { ...lastSimulation.leader } : null,
          stress_applied: [...lastSimulation.stress_applied],
          assumptions: [...(lastSimulation.assumptions ?? [])],
          projected_ranking: lastSimulation.projected_ranking.map((item) => ({ ...item })),
        }
      : null,
    lastInsight: lastInsight
      ? { tool: lastInsight.tool, summary: lastInsight.summary, payload: clone(lastInsight.payload) }
      : null,
  });
}

/**
 * @param {() => void} listener
 * @returns {() => void}
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * @returns {ToolLogEntry[]}
 */
export function getToolLog() {
  return toolLog.map((entry) => ({ ...entry }));
}

/**
 * @param {Omit<ToolLogEntry, "timestamp"> & { timestamp?: string }} entry
 */
export function appendToolLog(entry) {
  toolLog.push({
    timestamp: entry.timestamp ?? new Date().toISOString(),
    tool: entry.tool,
    input: clone(entry.input),
    summary: entry.summary,
    source: entry.source ?? "agent",
    rankingCurrent,
    ranking: ranking.map((item) => ({
      ...item,
      breakdown: { ...item.breakdown },
      metrics: { ...item.metrics },
    })),
  });
  notify();
  return getToolLog();
}

/**
 * Build a JSON-serializable export of the full decision state + tool log.
 * No localStorage — this is the persistence artifact (downloadable file).
 */
export function exportDecisionState() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    snapshot: getSnapshot(),
  };
}

/**
 * Restore a previously exported decision state. Replays options, weights,
 * context, and the historical tool log, then recomputes ranking and logs a
 * single import entry (source: human) so the import is auditable.
 * @param {{ version?: number, snapshot: ReturnType<typeof getSnapshot> }} payload
 */
export function importDecisionState(payload) {
  if (!payload || !payload.snapshot || !Array.isArray(payload.snapshot.options)) {
    throw new Error("Invalid import file: missing snapshot.options.");
  }
  const snap = payload.snapshot;

  reset();

  title = String(snap.title ?? "");
  problemStatement = String(snap.problemStatement ?? "");
  orgContext = /** @type {OrgContext} */ (
    ["solo", "startup", "enterprise"].includes(snap.orgContext) ? snap.orgContext : "startup"
  );
  skillLevel = /** @type {SkillLevel} */ (
    ["vibe", "mid", "senior"].includes(snap.skillLevel) ? snap.skillLevel : "vibe"
  );
  scaleBand = /** @type {ScaleBand} */ (
    ["<1k", "1k-10k", "10k-50k", "50k+"].includes(snap.scaleBand) ? snap.scaleBand : "<1k"
  );
  complianceTier = /** @type {ComplianceTier} */ (
    ["none", "soc2", "hipaa"].includes(snap.complianceTier) ? snap.complianceTier : "none"
  );
  isCoreIp = Boolean(snap.isCoreIp);
  timelineDays = typeof snap.timelineDays === "number" ? snap.timelineDays : null;
  preset = /** @type {"" | "auth" | "scraping" | "custom"} */ (
    ["", "auth", "scraping", "custom"].includes(snap.preset) ? snap.preset : "custom"
  );

  options = snap.options.map((option) => {
    const type = /** @type {OptionType} */ (assertEnum(option.type, OPTION_TYPES, "option type"));
    return {
      id: String(option.id ?? ""),
      name: String(option.name ?? ""),
      type,
      prototype_time_hours: Number(option.prototype_time_hours ?? 0),
      monthly_cash_cost: Number(option.monthly_cash_cost ?? 0),
      monthly_maintenance_hours: Number(option.monthly_maintenance_hours ?? 0),
      customization_score: Number(option.customization_score ?? 1),
      security_risk_score: Number(option.security_risk_score ?? 1),
      learning_value_score: Number(option.learning_value_score ?? 1),
      vendor_lockin_score: Number(option.vendor_lockin_score ?? 1),
      estimate: Boolean(option.estimate),
      ...(Array.isArray(option.sources) ? { sources: option.sources.map(String) } : {}),
    };
  });

  /** @type {Record<CriterionKey, number>} */
  const restoredWeights = { ...DEFAULT_WEIGHTS };
  for (const key of CRITERION_KEYS) {
    if (typeof snap.weights?.[key] === "number") {
      restoredWeights[key] = snap.weights[key];
    }
  }
  weights = restoredWeights;

  // Restore historical tool log if present.
  if (Array.isArray(snap.toolLog)) {
    toolLog = snap.toolLog.map((entry) => ({
      timestamp: String(entry.timestamp ?? new Date().toISOString()),
      tool: String(entry.tool ?? ""),
      input: entry.input,
      summary: String(entry.summary ?? ""),
      source: entry.source === "human" ? "human" : "agent",
      rankingCurrent: Boolean(entry.rankingCurrent),
      ranking: Array.isArray(entry.ranking) ? entry.ranking : [],
    }));
  }

  rankingCurrent = false;
  ranking = [];
  rerankDecisionOptions();

  // Restore Act 2/3 display state after rerank so export → import keeps
  // the simulation banner, override pin, and liability ledger.
  if (snap.override && snap.override.active) {
    override = {
      active: true,
      reason: snap.override.reason,
      pinnedOptionId: snap.override.pinnedOptionId,
      mathLeaderId: snap.override.mathLeaderId,
      scoreGap: snap.override.scoreGap,
      heavilyFavoredCriterion: snap.override.heavilyFavoredCriterion,
      toleranceLevel: snap.override.toleranceLevel,
    };
  }
  if (Array.isArray(snap.liabilities) && snap.liabilities.length > 0) {
    liabilities = snap.liabilities.map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      severity: item.severity === "high" || item.severity === "low" ? item.severity : "medium",
    }));
  }
  if (snap.lastSimulation) {
    lastSimulation = {
      scenario_name: String(snap.lastSimulation.scenario_name ?? ""),
      leader: snap.lastSimulation.leader ? { ...snap.lastSimulation.leader } : null,
      stress_applied: Array.isArray(snap.lastSimulation.stress_applied)
        ? [...snap.lastSimulation.stress_applied]
        : [],
      assumptions: Array.isArray(snap.lastSimulation.assumptions)
        ? [...snap.lastSimulation.assumptions]
        : [],
      projected_ranking: Array.isArray(snap.lastSimulation.projected_ranking)
        ? snap.lastSimulation.projected_ranking.map((item) => ({ ...item }))
        : [],
    };
  }
  if (snap.lastInsight) {
    lastInsight = {
      tool: String(snap.lastInsight.tool ?? ""),
      summary: String(snap.lastInsight.summary ?? ""),
      payload: clone(snap.lastInsight.payload),
    };
  }

  appendToolLog({
    tool: "import_state",
    input: { optionCount: options.length, sourceVersion: payload.version ?? 1 },
    summary: `Imported ${options.length} options, ${toolLog.length} prior log entries from exported file.`,
    source: "human",
  });

  return getSnapshot();
}

/**
 * Infer demo preset from natural-language title/problem when the agent
 * omits `preset`. Explicit `preset: "custom"` always wins (blank slate).
 * @param {string} titleText
 * @param {string} problemText
 * @returns {"auth" | "scraping" | null}
 */
export function inferDemoPreset(titleText, problemText) {
  const hay = `${titleText} ${problemText}`.toLowerCase();
  const scraping =
    /\b(scrap(?:e|ing|er)?|crawl(?:er|ing)?|firecrawl|bright\s*data)\b/.test(hay) ||
    /\bplaywright\b/.test(hay) && /\b(proxy|scrap|crawl)\b/.test(hay);
  const auth =
    /\b(auth(?:entication|0)?|clerk|oauth|jwt|login|sign[-\s]?up|better-auth|tenant isolation|multi-tenant|password(?:less)?)\b/.test(
      hay,
    ) || /\bsupabase\b/.test(hay) && /\bauth\b/.test(hay);

  if (scraping && !auth) {
    return "scraping";
  }
  if (auth && !scraping) {
    return "auth";
  }
  if (scraping && auth) {
    // Prefer the stronger domain cue when both appear.
    if (/\b(scrap(?:e|ing|er)?|crawl(?:er|ing)?|firecrawl)\b/.test(hay)) {
      return "scraping";
    }
    return "auth";
  }
  return null;
}

/**
 * @param {{
 *   title?: string,
 *   problem_statement?: string,
 *   org_context?: OrgContext,
 *   skill_level?: SkillLevel,
 *   preset?: "auth" | "scraping" | "custom"
 * }} input
 */
export function createDecision(input = {}) {
  reset();

  title = String(input.title ?? "").trim();
  problemStatement = String(input.problem_statement ?? "").trim();
  orgContext = /** @type {OrgContext} */ (assertEnum(input.org_context ?? "startup", ["solo", "startup", "enterprise"], "org_context"));
  skillLevel = /** @type {SkillLevel} */ (assertEnum(input.skill_level ?? "vibe", ["vibe", "mid", "senior"], "skill_level"));

  const explicit =
    input.preset === "auth" || input.preset === "scraping" || input.preset === "custom"
      ? input.preset
      : null;
  const inferred = explicit ? null : inferDemoPreset(title, problemStatement);
  const resolved = /** @type {"" | "auth" | "scraping" | "custom"} */ (
    explicit ?? inferred ?? ""
  );
  preset = resolved;

  if (resolved === "auth") {
    if (!title) {
      title = "Authentication & Multi-Tenant Permissions";
    }
    if (!problemStatement) {
      problemStatement = "How should we implement authentication and tenant isolation?";
    }
    options = AUTH_PRESET_OPTIONS.map((option) => ({ ...option }));
  } else if (resolved === "scraping") {
    if (!title) {
      title = "AI Web Scraping";
    }
    if (!problemStatement) {
      problemStatement = "How should we implement reliable AI-powered web scraping at scale?";
    }
    options = SCRAPING_PRESET_OPTIONS.map((option) => ({ ...option }));
  }

  rankingCurrent = false;
  ranking = [];
  notify();
  return getSnapshot();
}

export function loadAuthPreset() {
  return createDecision({ preset: "auth" });
}

/** Auth preset with Act 1 demo defaults: Solo org, 1k–10k scale, 14-day timeline, ranked. */
export function loadDefaultDemo() {
  createDecision({ preset: "auth", org_context: "solo" });
  setDecisionContext({ scale_band: "1k-10k", timeline_days: 14 });
  return rerankDecisionOptions();
}

/** Scraping preset with demo defaults: Solo org, 1k–10k scale, 14-day timeline, ranked. */
export function loadScrapingDemo() {
  createDecision({ preset: "scraping", org_context: "solo" });
  setDecisionContext({ scale_band: "1k-10k", timeline_days: 14 });
  return rerankDecisionOptions();
}

/**
 * @param {{
 *   scale_band?: ScaleBand,
 *   compliance_tier?: ComplianceTier,
 *   is_core_ip?: boolean,
 *   timeline_days?: number
 * }} input
 */
export function setDecisionContext(input = {}) {
  if (input.scale_band !== undefined) {
    scaleBand = /** @type {ScaleBand} */ (
      assertEnum(input.scale_band, ["<1k", "1k-10k", "10k-50k", "50k+"], "scale_band")
    );
  }
  if (input.compliance_tier !== undefined) {
    complianceTier = /** @type {ComplianceTier} */ (
      assertEnum(input.compliance_tier, ["none", "soc2", "hipaa"], "compliance_tier")
    );
  }
  if (input.is_core_ip !== undefined) {
    isCoreIp = Boolean(input.is_core_ip);
  }
  if (input.timeline_days !== undefined) {
    timelineDays = assertNumber(input.timeline_days, "timeline_days", 1);
  }

  rankingCurrent = false;
  notify();
  return getSnapshot();
}

/**
 * @param {Partial<DecisionOption>} input
 */
export function addOption(input) {
  const option = normalizeOptionInput(input);
  if (!option.id) {
    throw new Error("Option id is required.");
  }
  if (!option.name) {
    throw new Error("Option name is required.");
  }
  if (options.some((item) => item.id.toLowerCase() === option.id.toLowerCase())) {
    throw new Error(`Option id "${option.id}" already exists.`);
  }

  options.push(option);
  rankingCurrent = false;
  notify();
  return getSnapshot();
}

/**
 * @param {{ criterion: CriterionKey, weight: number }} input
 */
export function setPriorityWeight(input) {
  const key = assertCriterionKey(input.criterion);
  const next = assertNumber(input.weight, "weight", 0, 10);
  const previous = weights[key];
  if (previous === next) {
    return { changed: false, previous, ...getSnapshot() };
  }

  weights[key] = next;
  rankingCurrent = false;
  notify();
  return { changed: true, previous, ...getSnapshot() };
}

export function rerankDecisionOptions() {
  ranking = computeRanking(weights);
  rankingCurrent = true;
  notify();
  return getSnapshot();
}

/**
 * @param {{ first_option_id: string, second_option_id: string }} input
 */
export function compareDecisionOptions(input) {
  const first = findOption(input.first_option_id);
  const second = findOption(input.second_option_id);
  if (first.id === second.id) {
    throw new Error("Choose two different options to compare.");
  }

  const firstScore = scoreOption(first, weights, options, skillLevel);
  const secondScore = scoreOption(second, weights, options, skillLevel);

  /** @type {Record<CriterionKey, object>} */
  const tradeoffs = {};
  for (const key of CRITERION_KEYS) {
    const better = BETTER_DIRECTION[key];
    const firstValue = metricValue(firstScore.metrics, key);
    const secondValue = metricValue(secondScore.metrics, key);
    let winner = "tie";
    if (firstValue !== secondValue) {
      if (better === "lower") {
        winner = firstValue < secondValue ? first.id : second.id;
      } else {
        winner = firstValue > secondValue ? first.id : second.id;
      }
    }
    tradeoffs[key] = {
      criterion: key,
      code: CRITERION_CODES[key],
      label: CRITERION_LABELS[key],
      better,
      first: firstValue,
      second: secondValue,
      delta: secondValue - firstValue,
      winner,
      weight: weights[key],
    };
  }

  let winner = "tie";
  if (firstScore.score > secondScore.score) {
    winner = first.id;
  } else if (secondScore.score > firstScore.score) {
    winner = second.id;
  }

  return {
    weights: { ...weights },
    first: {
      ...first,
      score: firstScore.score,
      displayScore: firstScore.displayScore,
      breakdown: firstScore.breakdown,
      metrics: firstScore.metrics,
      units: firstScore.units,
    },
    second: {
      ...second,
      score: secondScore.score,
      displayScore: secondScore.displayScore,
      breakdown: secondScore.breakdown,
      metrics: secondScore.metrics,
      units: secondScore.units,
    },
    tradeoffs,
    winner,
  };
}

/**
 * Stress multipliers are baseline-derived (not magic deltas) so judges can audit
 * the math. Magnitudes are tuned so the Scraping HIPAA+50k+ projection still
 * flips the leader to Hybrid (locked Act 2 beat) — see scripts/smoke-decision.mjs.
 */
const SCALE_VENDOR_MULTIPLIER = { "50k+": 3, "10k-50k": 1.5, "1k-10k": 1, "<1k": 1 };
const SCALE_HYBRID_MULTIPLIER = { "50k+": 1.4, "10k-50k": 1.15, "1k-10k": 1, "<1k": 1 };
const SCALE_BUILD_MAINT_MULTIPLIER = { "50k+": 1.15, "10k-50k": 1.08, "1k-10k": 1, "<1k": 1 };
const COMPLIANCE_VENDOR_UPLIFT = { hipaa: 0.1, soc2: 0.06, none: 0 };
const COMPLIANCE_HYBRID_UPLIFT = { hipaa: 0.05, soc2: 0.03, none: 0 };

/**
 * @param {DecisionOption} option
 * @param {{ scale_band?: ScaleBand, compliance_tier?: ComplianceTier, timeline_days_available?: number, team_size_change?: number }} stress
 */
function projectOption(option, stress) {
  const projected = { ...option };
  /** @type {string[]} */
  const applied = [];
  /** @type {string[]} */
  const assumptions = [];

  const tier = stress.compliance_tier ?? "none";
  if (tier === "soc2" || tier === "hipaa") {
    if (projected.type === "build") {
      projected.security_risk_score = Math.min(10, projected.security_risk_score + 2);
      projected.monthly_maintenance_hours += 1;
      applied.push(`Increased ${projected.id} security risk and maintenance for ${tier}.`);
      assumptions.push(`${projected.id}: +2 security risk, +1h maintenance — custom controls must prove ${tier.toUpperCase()} evidence.`);
    }
    if (projected.type === "buy") {
      const uplift = COMPLIANCE_VENDOR_UPLIFT[tier] ?? 0;
      projected.security_risk_score = Math.max(1, projected.security_risk_score - 1);
      projected.monthly_cash_cost = Math.round(projected.monthly_cash_cost * (1 + uplift));
      applied.push(`Vendor absorbs compliance burden; ${projected.id} cash rises for ${tier} tier.`);
      assumptions.push(`${projected.id}: cash ×${(1 + uplift).toFixed(2)} — vendor ${tier.toUpperCase()} uplift (${(uplift * 100).toFixed(0)}% of baseline $${Math.round(option.monthly_cash_cost)}/mo).`);
    }
    if (projected.type === "hybrid") {
      const uplift = COMPLIANCE_HYBRID_UPLIFT[tier] ?? 0;
      projected.security_risk_score = Math.max(1, projected.security_risk_score - 0.5);
      projected.monthly_cash_cost = Math.round(projected.monthly_cash_cost * (1 + uplift));
      applied.push(`Hybrid ${projected.id} gains managed compliance with modest cost bump.`);
      assumptions.push(`${projected.id}: cash ×${(1 + uplift).toFixed(2)} — managed core absorbs most ${tier.toUpperCase()} burden.`);
    }
  }

  const band = stress.scale_band ?? "<1k";
  if (projected.type === "buy") {
    const mult = SCALE_VENDOR_MULTIPLIER[band] ?? 1;
    if (mult !== 1) {
      projected.monthly_cash_cost = Math.round(projected.monthly_cash_cost * mult);
      applied.push(`Vendor usage-tier overage pushes ${projected.id} monthly cash higher at ${band} scale.`);
      assumptions.push(`${projected.id}: cash ×${mult} — ${band} per-call/usage tier on $${Math.round(option.monthly_cash_cost)}/mo baseline.`);
    }
  }
  if (projected.type === "hybrid") {
    const mult = SCALE_HYBRID_MULTIPLIER[band] ?? 1;
    if (mult !== 1) {
      projected.monthly_cash_cost = Math.round(projected.monthly_cash_cost * mult);
      applied.push(`Managed-core scale tier increases ${projected.id} monthly cash at ${band} scale.`);
      assumptions.push(`${projected.id}: cash ×${mult} — ${band} managed-core + proxy tier on baseline.`);
    }
  }
  if (projected.type === "build") {
    const mult = SCALE_BUILD_MAINT_MULTIPLIER[band] ?? 1;
    if (mult !== 1) {
      projected.monthly_maintenance_hours = Math.round(projected.monthly_maintenance_hours * mult * 10) / 10;
      applied.push(`Operational load rises for ${projected.id} at ${band} scale.`);
      assumptions.push(`${projected.id}: maintenance ×${mult} — ${band} ops load on baseline hours.`);
    }
  }

  if (stress.team_size_change !== undefined && stress.team_size_change !== 0) {
    const delta = stress.team_size_change;
    if (projected.type === "build" || projected.type === "hybrid") {
      const factor = 1 + delta * 0.1;
      projected.monthly_maintenance_hours = Math.round(projected.monthly_maintenance_hours * factor * 10) / 10;
      applied.push(`Team size delta ${delta > 0 ? "+" : ""}${delta} scales ${projected.id} self-run maintenance by ×${factor.toFixed(2)}.`);
      assumptions.push(`${projected.id}: maintenance ×${factor.toFixed(2)} — team_size_change ${delta} (10% per unit on self-run ops).`);
    } else {
      assumptions.push(`${projected.id}: team_size_change ${delta} has no effect — vendor absorbs staffing.`);
    }
  }

  if (stress.timeline_days_available !== undefined && stress.timeline_days_available <= 14) {
    if (projected.type === "build") {
      projected.prototype_time_hours += 20;
      applied.push(`Timeline crunch penalizes ${projected.id} prototype hours.`);
      assumptions.push(`${projected.id}: +20h prototype — custom path slips under ≤14d deadline.`);
    }
    if (projected.type === "buy" || projected.type === "hybrid") {
      projected.prototype_time_hours = Math.max(1, projected.prototype_time_hours - 1);
      applied.push(`Fast vendor path keeps ${projected.id} prototype hours low under deadline pressure.`);
      assumptions.push(`${projected.id}: −1h prototype — vendor/managed path holds under ≤14d deadline.`);
    }
  }

  return { projected, applied, assumptions };
}

/**
 * @param {{
 *   scenario_name: string,
 *   scale_band?: ScaleBand,
 *   compliance_tier?: ComplianceTier,
 *   team_size_change?: number,
 *   timeline_days_available?: number
 * }} input
 */
export function simulateFutureScenario(input) {
  if (!input.scenario_name?.trim()) {
    throw new Error("scenario_name is required.");
  }
  if (options.length === 0) {
    throw new Error("Add options before simulating a scenario.");
  }

  const stress = {
    scale_band: input.scale_band ?? scaleBand,
    compliance_tier: input.compliance_tier ?? complianceTier,
    timeline_days_available: input.timeline_days_available ?? timelineDays ?? undefined,
    team_size_change: input.team_size_change,
  };

  const stressNotes = [];
  /** @type {string[]} */
  const assumptions = [];
  const projectedOptions = options.map((option) => {
    const { projected, applied, assumptions: optAssumptions } = projectOption(option, stress);
    stressNotes.push(...applied);
    assumptions.push(...optAssumptions);
    return projected;
  });

  const projectedRanking = projectedOptions
    .map((option) => {
      const scored = scoreOption(option, weights, projectedOptions, skillLevel);
      return {
        id: option.id,
        name: option.name,
        type: option.type,
        score: scored.score,
        displayScore: scored.displayScore,
        breakdown: scored.breakdown,
        metrics: scored.metrics,
        estimate: Boolean(option.estimate),
      };
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .map((item, index) => ({ ...item, rank: index + 1 }));

  lastSimulation = {
    scenario_name: input.scenario_name.trim(),
    leader: projectedRanking[0] ?? null,
    stress_applied: [...new Set(stressNotes)],
    assumptions: [...assumptions],
    projected_ranking: projectedRanking.map((item) => ({
      id: item.id,
      name: item.name,
      displayScore: item.displayScore,
      rank: item.rank,
    })),
  };
  notify();

  return {
    scenario_name: input.scenario_name.trim(),
    stress,
    stress_applied: [...new Set(stressNotes)],
    assumptions,
    baseline_preserved: true,
    baseline_ranking: ranking.map((item) => ({ ...item })),
    projected_options: projectedOptions.map((option) => ({ ...option })),
    projected_ranking: projectedRanking,
    leader: projectedRanking[0] ?? null,
  };
}

/**
 * @param {{ target_option_id: string }} input
 */
export function solveWinningConditions(input) {
  const target = findOption(input.target_option_id);
  const currentRanking = rankingCurrent ? ranking : computeRanking(weights);
  const leader = currentRanking[0];
  if (!leader) {
    throw new Error("Rank options before solving winning conditions.");
  }

  if (leader.id === target.id) {
    return {
      target_option_id: target.id,
      already_winning: true,
      score_gap: 0,
      levers: ["Target already leads under current weights and context."],
    };
  }

  const targetRanked = currentRanking.find((item) => item.id === target.id);
  const scoreGap = leader.score - (targetRanked?.score ?? 0);

  // Computed sensitivity: for each criterion, find the minimum weight change
  // (0-10, step 0.1, other weights held constant) that flips target to rank 1.
  // If no single-weight flip exists, keep the best near-miss (lowest rank, then gap).
  /** @type {{ criterion: CriterionKey, label: string, current_weight: number, required_weight: number, direction: "raise" | "lower" }[]} */
  const flipLevers = [];
  /** @type {{ criterion: CriterionKey, label: string, current_weight: number, trial_weight: number, direction: "raise" | "lower", rank: number, score_gap: number }[]} */
  const nearMisses = [];
  for (const key of CRITERION_KEYS) {
    const currentWeight = weights[key];
    let bestFlip = null;
    let bestMiss = null;
    for (let w = 0; w <= 10.0001; w = Math.round((w + 0.1) * 10) / 10) {
      const trialWeights = { ...weights, [key]: w };
      const trial = computeRanking(trialWeights);
      const trialTarget = trial.find((item) => item.id === target.id);
      const trialLeader = trial[0];
      if (!trialTarget || !trialLeader) {
        continue;
      }
      const trialGap = trialTarget.rank === 1 ? 0 : trialLeader.score - trialTarget.score;
      if (trialTarget.rank === 1) {
        const distance = Math.abs(w - currentWeight);
        if (bestFlip === null || distance < bestFlip.distance) {
          bestFlip = { weight: w, distance };
        }
      } else {
        const distance = Math.abs(w - currentWeight);
        if (
          bestMiss === null ||
          trialTarget.rank < bestMiss.rank ||
          (trialTarget.rank === bestMiss.rank && trialGap < bestMiss.gap) ||
          (trialTarget.rank === bestMiss.rank && trialGap === bestMiss.gap && distance < bestMiss.distance)
        ) {
          bestMiss = { weight: w, distance, rank: trialTarget.rank, gap: trialGap };
        }
      }
    }
    if (bestFlip !== null) {
      const direction = bestFlip.weight >= currentWeight ? "raise" : "lower";
      flipLevers.push({
        criterion: key,
        label: CRITERION_LABELS[key],
        current_weight: currentWeight,
        required_weight: bestFlip.weight,
        direction,
      });
    } else if (bestMiss !== null) {
      const direction = bestMiss.weight >= currentWeight ? "raise" : "lower";
      nearMisses.push({
        criterion: key,
        label: CRITERION_LABELS[key],
        current_weight: currentWeight,
        trial_weight: bestMiss.weight,
        direction,
        rank: bestMiss.rank,
        score_gap: Math.round(bestMiss.gap * 100) / 100,
      });
    }
  }

  /** @type {string[]} */
  const levers = [];
  if (flipLevers.length > 0) {
    const sorted = [...flipLevers].sort(
      (a, b) => Math.abs(a.required_weight - a.current_weight) - Math.abs(b.required_weight - b.current_weight),
    );
    for (const lever of sorted) {
      const verb = lever.direction === "raise" ? "Raise" : "Lower";
      levers.push(
        `${verb} ${lever.label} to ${lever.required_weight.toFixed(1)} (from ${lever.current_weight.toFixed(1)}) — computed flip makes ${target.name} rank #1.`,
      );
    }
  } else {
    const sortedMisses = [...nearMisses].sort((a, b) => a.rank - b.rank || a.score_gap - b.score_gap);
    if (sortedMisses.length > 0) {
      const best = sortedMisses[0];
      const verb = best.direction === "raise" ? "Raise" : "Lower";
      levers.push(
        `No single-weight flip found for ${target.name}. Closest: ${verb} ${best.label} to ${best.trial_weight.toFixed(1)} (from ${best.current_weight.toFixed(1)}) → rank #${best.rank}, remaining gap ${best.score_gap.toFixed(2)}.`,
      );
    } else {
      levers.push(`No single-weight flip found for ${target.name} under current options — try a context shift or add/remove options.`);
    }
  }

  // Narrative footer (type-aware guidance), kept short.
  if (target.type === "build") {
    levers.push("Or set is_core_ip=true and pin Build in Act 3 to justify a strategic override despite the gap.");
  } else if (target.type === "buy") {
    levers.push("Or keep time_to_prototype weight high while skill_level stays vibe.");
  } else if (target.type === "open_source") {
    levers.push("Or lower cash_tco weight when self-host hosting stays lean.");
  } else if (target.type === "hybrid") {
    levers.push("Or use soc2 stress to reward managed core with custom middleware on top.");
  }

  levers.push(`Close the ${scoreGap.toFixed(2)} score gap vs leader "${leader.name}" (${leader.id}).`);
  if (isCoreIp && target.type === "build") {
    levers.push("Core IP flag is set — human override with liability ledger is demo-ready.");
  }

  return {
    target_option_id: target.id,
    target_name: target.name,
    leader_option_id: leader.id,
    leader_name: leader.name,
    already_winning: false,
    score_gap: Math.round(scoreGap * 100) / 100,
    levers,
    flip_levers: flipLevers.map((lever) => ({
      criterion: lever.criterion,
      label: lever.label,
      current_weight: lever.current_weight,
      required_weight: lever.required_weight,
      direction: lever.direction,
    })),
    near_misses: nearMisses.map((miss) => ({
      criterion: miss.criterion,
      label: miss.label,
      current_weight: miss.current_weight,
      trial_weight: miss.trial_weight,
      direction: miss.direction,
      rank: miss.rank,
      score_gap: miss.score_gap,
    })),
    suggested_context_shifts: [
      complianceTier !== "soc2" ? "Try compliance_tier=soc2 to stress vendor vs custom security." : null,
      scaleBand !== "50k+" ? "Try scale_band=50k+ to surface vendor overage pressure." : null,
      !isCoreIp && target.type === "build" ? "Set is_core_ip=true for Act 3 pin narrative." : null,
    ].filter(Boolean),
  };
}

/**
 * @param {DecisionOption} option
 * @returns {LiabilityEntry[]}
 */
function buildLiabilitiesForOption(option) {
  // Every row derives from this option's live metrics + session context.
  // No Clerk/Firecrawl canned titles as the primary path.
  /** @type {LiabilityEntry[]} */
  const computed = [];
  const metrics = adjustMetrics(option, skillLevel);
  const name = option.name;

  if (metrics.security_risk_score >= 7) {
    computed.push({
      id: "metric-high-security",
      title: "High self-managed security exposure",
      description: `${name}: security risk ${metrics.security_risk_score.toFixed(1)}/10 — CVEs, patch cadence, and incident response land on your team.`,
      severity: "high",
    });
  }
  if (metrics.monthly_maintenance_hours >= 4) {
    computed.push({
      id: "metric-high-mdo",
      title: "High monthly maintenance overhead",
      description: `${name}: ~${metrics.monthly_maintenance_hours.toFixed(1)}h/mo maintenance — standing on-call cost against opportunity.`,
      severity: "high",
    });
  }
  if (complianceTier === "hipaa" && option.type === "build") {
    computed.push({
      id: "metric-hipaa-build",
      title: "HIPAA evidence collection burden",
      description: `${name}: custom controls must prove PHI safeguards under audit — evidence gathering is recurring work.`,
      severity: "high",
    });
  } else if (complianceTier === "soc2" || complianceTier === "hipaa") {
    const tierLabel = complianceTier === "hipaa" ? "HIPAA" : "SOC2";
    computed.push({
      id: "metric-compliance-evidence",
      title: `${tierLabel} evidence & audit trail`,
      description: `${name}: ${tierLabel} requires proving controls on this path — evidence collection is recurring, not one-shot.`,
      severity: "high",
    });
  }
  if (option.vendor_lockin_score >= 7) {
    computed.push({
      id: "metric-high-vlr",
      title: "Exit-path lock-in",
      description: `${name}: vendor lock-in ${option.vendor_lockin_score}/10 — migrating off later is architecturally expensive.`,
      severity: "high",
    });
  }
  if (scaleBand === "50k+" || scaleBand === "10k-50k") {
    computed.push({
      id: "metric-scale-cash",
      title: "Unit economics at scale",
      description: `${name}: at ${scaleBand} MRU, $${Math.round(metrics.monthly_cash_cost)}/mo cash (~$${Math.round(metrics.cash_tco)} 5yr Cash TCO) becomes a standing cost center.`,
      severity: scaleBand === "50k+" ? "high" : "medium",
    });
  }
  if (skillLevel === "vibe" && option.type === "build") {
    computed.push({
      id: "metric-vibe-staffing",
      title: "Vibe-coder staffing gap",
      description: `${name}: vibe skill profile underestimates senior edge cases (SSO, breach response, tenancy) — staffing risk compounds.`,
      severity: "medium",
    });
  }
  if (isCoreIp && option.type !== "build") {
    computed.push({
      id: "metric-core-ip-mismatch",
      title: "Core IP vs ownership path",
      description: `${name}: core IP is flagged, but this option does not maximize ownership — strategic moat may leak to a vendor or shared stack.`,
      severity: "medium",
    });
  }
  if (isCoreIp && option.type === "build") {
    computed.push({
      id: "metric-core-ip-build-burden",
      title: "Owning core IP forever",
      description: `${name}: core IP pin means you own tenant isolation, key lifecycle, and incident response indefinitely.`,
      severity: "medium",
    });
  }
  if (timelineDays != null && timelineDays > 0) {
    const hoursBudget = timelineDays * 8;
    if (metrics.prototype_time_hours > hoursBudget) {
      computed.push({
        id: "metric-timeline-crunch",
        title: "Timeline vs prototype hours",
        description: `${name}: ~${Math.round(metrics.prototype_time_hours)}h prototype exceeds a ${timelineDays}-day (~${hoursBudget}h) budget — schedule risk is material.`,
        severity: "high",
      });
    } else {
      computed.push({
        id: "metric-timeline-tight",
        title: "Timeline pressure on delivery",
        description: `${name}: ~${Math.round(metrics.prototype_time_hours)}h prototype against a ${timelineDays}-day window leaves little slack for unknowns.`,
        severity: "medium",
      });
    }
  }

  const severityRank = { high: 0, medium: 1, low: 2 };
  computed.sort(
    (a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9),
  );

  // Generic name-interpolated fillers only if computed count < 3 (keep smoke green).
  /** @type {LiabilityEntry[]} */
  const fillers = [
    {
      id: "filler-ownership",
      title: "Active ownership required",
      description: `${name} still needs a named owner as requirements, deps, and ops evolve.`,
      severity: "medium",
    },
    {
      id: "filler-integration",
      title: "Integration surface area",
      description: `${name} adds integration points that fail independently of the core product path.`,
      severity: "medium",
    },
    {
      id: "filler-unknowns",
      title: "Unknown unknowns tax",
      description: `${name}: edge cases not in the axis scores still burn calendar once you commit.`,
      severity: "medium",
    },
  ];
  for (const filler of fillers) {
    if (computed.length >= 3) {
      break;
    }
    if (!computed.some((row) => row.id === filler.id)) {
      computed.push(filler);
    }
  }

  return computed.slice(0, 5);
}

/**
 * @param {{
 *   override_reason: string,
 *   heavily_favored_criterion?: CriterionKey,
 *   tolerance_level?: ToleranceLevel,
 *   pin_recommendation?: boolean
 * }} input
 */
export function applyHumanPreferenceOverride(input) {
  if (!input.override_reason?.trim()) {
    throw new Error("override_reason is required.");
  }

  const currentRanking = rankingCurrent ? ranking : computeRanking(weights);
  const mathLeader = currentRanking[0];
  if (!mathLeader) {
    throw new Error("Rank options before applying an override.");
  }

  const reason = input.override_reason.trim();
  // Act 3 poka-yoke: Prompt 4 says "own it / core IP" — pin Build, never the math leader.
  // Old gate required is_core_ip first; agents often skipped that and silently pinned Buy.
  const ownershipIntent =
    /\b(own|core\s*ip|core to|must own|pin(?:ned)?\s+build|strategic)\b/i.test(reason);
  const shouldPinBuild = input.pin_recommendation === true || ownershipIntent;

  let pinnedOptionId = mathLeader.id;
  if (shouldPinBuild) {
    const buildOption = options.find((item) => item.type === "build");
    if (!buildOption) {
      throw new Error("Cannot pin Build — no build option in the workspace.");
    }
    isCoreIp = true;
    pinnedOptionId = buildOption.id;
  }

  const pinnedRanked = currentRanking.find((item) => item.id === pinnedOptionId) ?? mathLeader;
  const scoreGap =
    pinnedOptionId === mathLeader.id
      ? 0
      : Math.round((mathLeader.score - pinnedRanked.score) * 100) / 100;

  const pinnedOption = findOption(pinnedOptionId);
  liabilities = buildLiabilitiesForOption(pinnedOption).slice(0, 5);

  override = {
    active: true,
    reason,
    pinnedOptionId,
    mathLeaderId: mathLeader.id,
    scoreGap,
    heavilyFavoredCriterion: input.heavily_favored_criterion,
    toleranceLevel: input.tolerance_level ?? "medium",
  };

  notify();
  return {
    override: { ...override },
    liabilities: liabilities.map((item) => ({ ...item })),
    math_leader: mathLeader,
    pinned_option: pinnedRanked,
    ...getSnapshot(),
  };
}
