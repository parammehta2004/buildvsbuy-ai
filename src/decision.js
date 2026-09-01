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

  if (input.preset === "auth") {
    if (!title) {
      title = "Authentication & Multi-Tenant Permissions";
    }
    if (!problemStatement) {
      problemStatement = "How should we implement authentication and tenant isolation?";
    }
    options = AUTH_PRESET_OPTIONS.map((option) => ({ ...option }));
  } else if (input.preset === "scraping") {
    throw new Error('Preset "scraping" is deferred until Auth slice ships.');
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
 * @param {DecisionOption} option
 * @param {{ scale_band?: ScaleBand, compliance_tier?: ComplianceTier, timeline_days_available?: number }} stress
 */
function projectOption(option, stress) {
  const projected = { ...option };
  const applied = [];

  if (stress.compliance_tier === "soc2" || stress.compliance_tier === "hipaa") {
    if (projected.type === "build") {
      projected.security_risk_score = Math.min(10, projected.security_risk_score + 2);
      projected.monthly_maintenance_hours += 1;
      applied.push(`Increased ${projected.id} security risk and maintenance for ${stress.compliance_tier}.`);
    }
    if (projected.type === "buy") {
      projected.security_risk_score = Math.max(1, projected.security_risk_score - 1);
      projected.monthly_cash_cost += stress.compliance_tier === "hipaa" ? 15 : 10;
      applied.push(`Vendor absorbs compliance burden; ${projected.id} cash cost rises for ${stress.compliance_tier} tier.`);
    }
    if (projected.type === "hybrid") {
      projected.security_risk_score = Math.max(1, projected.security_risk_score - 0.5);
      projected.monthly_cash_cost += 5;
      applied.push(`Hybrid ${projected.id} gains managed compliance with modest cost bump.`);
    }
  }

  if (stress.scale_band === "50k+") {
    if (projected.type === "buy") {
      projected.monthly_cash_cost += 75;
      applied.push(`Clerk Business / MRU overage pushes ${projected.id} monthly cash higher at 50k+ scale.`);
    }
    if (projected.type === "hybrid") {
      projected.monthly_cash_cost += 20;
      applied.push(`Supabase scale tier increases ${projected.id} monthly cash at 50k+.`);
    }
    if (projected.type === "build") {
      projected.monthly_maintenance_hours += 0.5;
      applied.push(`Operational load rises for ${projected.id} at 50k+ scale.`);
    }
  }

  if (stress.timeline_days_available !== undefined && stress.timeline_days_available <= 14) {
    if (projected.type === "build") {
      projected.prototype_time_hours += 20;
      applied.push(`Timeline crunch penalizes ${projected.id} prototype hours.`);
    }
    if (projected.type === "buy" || projected.type === "hybrid") {
      projected.prototype_time_hours = Math.max(1, projected.prototype_time_hours - 1);
      applied.push(`Fast vendor path keeps ${projected.id} prototype hours low under deadline pressure.`);
    }
  }

  return { projected, applied };
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
  };

  const stressNotes = [];
  const projectedOptions = options.map((option) => {
    const { projected, applied } = projectOption(option, stress);
    stressNotes.push(...applied);
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

  return {
    scenario_name: input.scenario_name.trim(),
    stress,
    stress_applied: [...new Set(stressNotes)],
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
  /** @type {string[]} */
  const levers = [];

  if (target.type === "build") {
    levers.push("Set is_core_ip=true and pin Build in Act 3 to justify strategic override.");
    levers.push("Raise strategic_learning weight above 6 to reward moat-building.");
    levers.push("Raise customization weight above 8 when bespoke tenant logic is non-negotiable.");
    levers.push("If compliance is mandatory, custom control can beat thin SaaS wrappers — but liabilities rise.");
  }
  if (target.type === "buy") {
    levers.push("Keep time_to_prototype weight high while team skill_level stays vibe.");
    levers.push("Stress compliance_tier to soc2/hipaa to shift risk toward managed vendors.");
    levers.push("Move scale_band to 50k+ only if vendor overage is still cheaper than build maintenance.");
  }
  if (target.type === "open_source") {
    levers.push("Lower cash_tco weight when Better-Auth monthly hosting stays lean.");
    levers.push("Raise customization weight when in-app TS control beats Clerk constraints.");
    levers.push("Avoid treating Adopt like heavy self-host — vibe penalties should not apply.");
  }
  if (target.type === "hybrid") {
    levers.push("Balance customization and security_risk weights for Supabase RLS control.");
    levers.push("Use soc2 stress to reward managed auth core with custom middleware.");
    levers.push("Reduce vendor_lockin weight if exit path via Postgres remains acceptable.");
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
    suggested_context_shifts: [
      complianceTier !== "soc2" ? "Try compliance_tier=soc2 to stress vendor vs custom security." : null,
      scaleBand !== "50k+" ? "Try scale_band=50k+ to surface Clerk overage pressure." : null,
      !isCoreIp && target.type === "build" ? "Set is_core_ip=true for Act 3 pin narrative." : null,
    ].filter(Boolean),
  };
}

/**
 * @param {DecisionOption} option
 * @returns {LiabilityEntry[]}
 */
function buildLiabilitiesForOption(option) {
  if (option.type === "build") {
    return [
      {
        id: "auth-patch-burden",
        title: "Security patch burden",
        description: "JWT libraries, session stores, and dependency CVEs become your on-call problem.",
        severity: "high",
      },
      {
        id: "redis-ops",
        title: "Session store operations",
        description: "Redis failover, persistence, and multi-region replication are production liabilities.",
        severity: "medium",
      },
      {
        id: "compliance-evidence",
        title: "Compliance evidence collection",
        description: "SOC2/HIPAA audits require you to prove controls on custom auth flows.",
        severity: "high",
      },
      {
        id: "auth-staffing",
        title: "Senior auth expertise",
        description: "Edge cases (SSO, SCIM, breach response) often need senior engineer time.",
        severity: "medium",
      },
      {
        id: "key-rotation",
        title: "Key rotation & token lifecycle",
        description: "Signing keys, refresh rotation, and tenant isolation bugs are easy to get wrong.",
        severity: "medium",
      },
    ];
  }

  if (option.type === "buy") {
    return [
      {
        id: "vendor-lock",
        title: "Vendor coupling",
        description: "Auth UX and webhooks become tightly coupled to Clerk APIs.",
        severity: "medium",
      },
      {
        id: "mru-overage",
        title: "MRU overage risk",
        description: "50k+ MAU pricing can spike without architectural escape hatches.",
        severity: "high",
      },
    ];
  }

  return [
    {
      id: "maintenance",
      title: "Ongoing maintenance",
      description: `${option.name} still needs active ownership as requirements evolve.`,
      severity: "medium",
    },
  ];
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

  let pinnedOptionId = mathLeader.id;
  if (input.pin_recommendation) {
    if (isCoreIp) {
      const buildOption = options.find((item) => item.type === "build");
      pinnedOptionId = buildOption?.id ?? mathLeader.id;
    } else {
      pinnedOptionId = mathLeader.id;
    }
  }

  const pinnedRanked = currentRanking.find((item) => item.id === pinnedOptionId) ?? mathLeader;
  const scoreGap =
    pinnedOptionId === mathLeader.id
      ? 0
      : Math.round((mathLeader.score - pinnedRanked.score) * 10) / 10;

  const pinnedOption = findOption(pinnedOptionId);
  liabilities = buildLiabilitiesForOption(pinnedOption).slice(0, 5);

  override = {
    active: true,
    reason: input.override_reason.trim(),
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
