# WebMCP Hackathon — Master Project Bible & Specification Reference
**Document Status:** Permanent Master Reference · Live Project Document  
**Date Created:** August 28, 2026  
**Target Submission Deadline:** September 3, 2026 @ 1:00 PM Pacific Time (September 4, 2026 @ 1:30 AM IST)  
**Hackathon:** OpenAI WebMCP Challenge (Devpost: `https://webmcp.devpost.com/`)  

---

## 1. Executive Summary & Project Identity

### 1.1 Project Title & Working Name
* **Working Title:** BuildVsBuy.ai / DecisionLab WebMCP (Human-Agent Decision & Negotiation Canvas)
* **Tagline:** *"When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning."*
* **Core Value Proposition:** An AI-native build-vs-buy decision environment where humans and browser-integrated agents collaboratively evaluate whether an idea should be **Built**, **Bought (SaaS)**, **Adopted (Open Source)**, or executed as a **Hybrid**. The agent actively operates, audits, simulates, and negotiates the structured decision state directly inside the web application via WebMCP tools.

### 1.2 The Core Dilemma & Product Thesis
Traditional build-vs-buy logic was framed around engineering scarcity: *"Do we have the budget and engineering hours to build this?"*
In the AI era, LLMs and agentic IDEs have collapsed the cost and friction of initial prototyping to **$5, 15 minutes, and a single prompt**.

This induces the **Vibe-Coding Trap**:
1. A developer or startup encounters a friction point in existing software or dreams up a niche idea.
2. Because building a prototype feels instantaneous, the default knee-jerk reaction is: *"Screw it, I'll just build it myself."*
3. **The Blindspot:** A 10-minute prototype is cheap; the **5-year lifecycle liability** (technical debt, dependency rot, security vulnerabilities, edge-case maintenance, operational overhead, opportunity cost) is extraordinarily expensive.
4. **The Solution:** The tool does not exist to tell builders "don't build." Instead, it says: *"Before you spend those 15 minutes, let's explore whether building actually makes sense — and what conditions make it worth owning."* Crucially, under the right conditions (niche requirements, high SaaS lock-in/cost, strategic learning, core IP), the recommendation **must conclude: "Yes, build it!"**

---

## 2. Comprehensive Hackathon Intelligence & Official Rules

### 2.1 Timeline & Critical Milestones
* **Registration & Submission Window:** August 25, 2026 (11:00 AM PT) – September 3, 2026 (1:00 PM PT)
* **Netlify Credit Request Deadline:** September 1, 2026 (12:00 PM PT) — 3,000 credits via Google Form (`https://forms.gle/xw75XGUQzCXEiALc7`).
* **Judging Period:** September 4, 2026 (10:00 AM PT) – September 21, 2026 (5:00 PM PT)
* **Winners Announcement:** On or around September 23, 2026 (2:00 PM PT)
* **Participant Dynamics:** Explored from 1,680 → 2,419+ entrants. Competitive strategy relies not on raw volume of code, but on crisp philosophical positioning, non-trivial WebMCP tool integration, and a flawless 3-minute video demo.

### 2.2 Official Eligibility & Legal Constraints
* **Eligible Entrants:** Individuals at age of majority, Teams, and Organizations residing in OpenAI API-supported countries.
* **Ineligible Regions:** Brazil, China, Hong Kong, Quebec, Russia, Crimea, Cuba, Iran, North Korea, Syria, Venezuela, Donetsk/Luhansk, and OFAC-sanctioned jurisdictions.
* **IP & Open Source Clarification:**
  * The submitted project repository **MUST be public and open-source** with a visible open-source license (MIT, Apache 2.0, etc.) in the repository header/About section.
  * **Critical Distinction for Private/Startup IP:** Entering this hackathon does **NOT** require open-sourcing unrelated commercial ventures (e.g., private Real Estate Startup, proprietary AEO engine, backend client databases). Only the specific codebase submitted for the WebMCP challenge is open-sourced.
  * Entrants retain 100% intellectual property rights. OpenAI and Devpost receive a non-exclusive license to evaluate and publicize the submission for up to 3 years.

### 2.3 Required Submission Deliverables
1. **Working Live URL:** Hosted on ChatGPT Sites, Cloudflare Pages, Vercel, Netlify, or Render. Accessible without paywalls or restrictive access. (If authentication is used, testing credentials must be provided on the Devpost submission form).
2. **Public Code Repository:** GitHub/GitLab/Bitbucket containing full source code, assets, build instructions, an open-source license, and the imperative WebMCP registration (`document.modelContext.registerTool(...)`).
3. **Written Narrative Description:**
   * Why the use case is a compelling, native fit for WebMCP.
   * How it creates a superior user experience over traditional chatbots/static websites.
   * What humans and agents can do together that was previously difficult or impossible.
   * Technical explanation of how WebMCP was implemented.
4. **Demonstration Video (The Deciding Factor):**
   * **Strict Duration:** Less than 3 minutes (0:00 – 2:59). Judges are not required to watch past 3:00.
   * **Platform:** Public YouTube link.
   * **Content:** Clear live demo showing functioning software with clear voiceover audio explaining what was built, the problem it solves, and how WebMCP powers the agent-app bridge.
   * **Audio/IP Safety:** No copyrighted background music, no unauthorized trademarks.

### 2.4 Official Judging Rubric (Stage 1 & Stage 2)
* **Stage 1 (Pass/Fail):** Baseline viability check (fits open web theme, reasonably utilizes WebMCP APIs).
* **Stage 2 (Equally Weighted 4 × 25% Criteria):**
  1. **WebMCP Leverage (25%):** Thoroughness and skill of WebMCP usage. Does the code reflect a working, non-trivial, multi-tool bidirectional state implementation?
  2. **Execution (25%):** Is this a complete, coherent product experience with refined UI/UX, not just a barebones technical proof-of-concept?
  3. **Potential Impact (25%):** Credible, specific solution to a real problem faced by a real audience (solo builders, tech leads, engineering teams).
  4. **Creativity & Ambition (25%):** Novelty of concept; distinct from generic chat wrappers or clone apps.
* **Tie-Breaking Rule:** Hierarchy order: WebMCP Leverage > Execution > Potential Impact > Creativity & Ambition > Judicial panel vote.

### 2.5 Prize Distribution (Top 10 Winning Submissions)
Each of the **Top 10 Winning Teams** receives:
* **OpenAI:** $3,000 USD cash + Spotlight on `@OpenAIDevs` on X/Twitter + Codex Micro + Swag (up to 3 members) + 1-year ChatGPT Pro Account (up to 3 members).
* **Cloudflare:** $10,000 in Cloudflare credits.
* **Vercel:** $300/mo Vercel credits + $50/mo AI Gateway credits for 12 months ($4,200 value).
* **Render:** $300 in Render credits.
* **Netlify:** $500 USD cash from Netlify.
* **Shopify:** $250 in limited-edition Shopify Supply gear.
* **Google Chrome:** 3-month subscription to Google AI Ultra per team member (~$300 value/member).

---

## 3. Real-World Case Studies & Empirical Brainstorming Context

The brainstorming session mined concrete patterns, frustrations, and insights from real builder communities:

### 3.1 Case Study 1: The Motion Designer & "The Focus Project"
* **Scenario:** Non-engineer using AI to build a desktop app.
* **Key Findings:**
  * AI excels at common, highly represented code patterns (`Array.map`, React hooks, CSS styling).
  * AI hallucinates violently when encountering niche problems (e.g., generating fake configuration keys for `electron-builder`).
  * AI lacks multi-file systemic awareness: asking AI to add a database broke the entire application state and IPC communication because the model couldn't reconcile renderer vs. main process boundaries.
  * *Lesson:* "If the human doesn't understand the application architecture, the AI won't either."

### 3.2 Case Study 2: The "AI Exoskeleton" & Sovereignty Architecture
* **Scenario:** Builder refusing to keep critical thinking and business data locked in transient ChatGPT windows.
* **Key Architecture:**
  * Local control & storage: MongoDB for active truths/working memory, Qdrant/FAISS for vector recall, GraphDB for semantic relationship mapping.
  * AI models treated as interchangeable execution plugins rather than sovereign orchestrators.
  * Layered engine: Real-time work engine → Continuous simulation engine ("What if?") → Preflight gate & validation layer.
  * *Lesson:* AI should empower human structural thinking through rigorous preflight validation rather than opaque magic.

### 3.3 Case Study 3: The 3-Week Vibe-Coding Breakdown
* **Scenario:** Builder spent weeks generating a comprehensive PRD with Claude, then jumped into Cursor.
* **Key Findings:**
  * Week 1 was euphoria; Week 2–3 became an unmaintainable disaster.
  * The PRD specified *WHAT* to build, but completely lacked *HOW* (no architectural standard, no schema normalization, inconsistent API contracts, fragmented styles).
  * Adding new features continually broke regression suites because the AI guessed differently on every prompt.
  * *Lesson:* AI speed without architectural bounds compounds technical debt at a catastrophic rate.

### 3.4 Case Study 4: The Developer Estimation Illusion
* **Empirical Insight:** LLMs consistently cite traditional engineering estimates (e.g., "this feature will take 1–2 hours") because their training corpora reflect legacy manual coding cycles.
* **Reality:** With modern agentic prompting, the draft/plan takes 1 prompt and execution takes 5–10 minutes.
* **Consequence:** This massive temporal compression makes building feel "practically free," amplifying the bias to build custom software over purchasing or integrating existing tools.

### 3.5 Case Study 5: The Security & Technical Debt Reality
* **Nuance:** AI software is not inherently broken; rather, *poorly reviewed, unarchitected vibe-coded apps suffer from severe security gaps, unhandled exceptions, and spaghetti state.*
* When juniors or solo founders deploy quick vibe-coded hacks into production, senior engineers inevitably spend weeks rewriting the foundations.

---

## 4. WebMCP Architecture & Technical Foundation

### 4.1 What WebMCP Is & Why It Is Revolutionary
* **Traditional MCP (Model Context Protocol):** Operates on servers or local CLI processes. The AI connects to external databases, filesystems, or API gateways outside the browser session.
* **WebMCP (Web Model Context Protocol):** Brings structured tool registration directly into the web client runtime via the browser context (`document.modelContext`).
* **The Interaction Shift:**
  * *Old Web:* AI agents browse pages via screenshot scraping, messy DOM parsing, or simulated clicks (brittle, slow, lossy).
  * *WebMCP Web:* The web page exposes clean, typed, deterministic tools (`registerTool`) with JSON schemas directly to the browser-integrated agent (e.g., ChatGPT Desktop In-App Browser, Chrome 149+ with `#enable-webmcp-testing`).
  * The web page becomes a **programmable, interactive canvas** where the human and agent co-create and co-manipulate real-time state.

### 4.2 WebMCP Hands-On Test Findings (From Laboratory Sessions)
During local prototyping with the Decision Lab, critical runtime behaviors and quirks were discovered:
1. **State Persistence:** In-memory client state is wiped on page refresh. Production WebMCP apps should leverage `localStorage` or session persistence to preserve human-agent collaboration across reloads.
2. **Tool Execution Handshake:**
   ```javascript
   // Imperative Registration Pattern
   await document.modelContext.registerTool({
     name: "change_priority",
     title: "Change priority",
     description: "Sets criterion weight. Calling rerank_properties is required afterwards.",
     inputSchema: { ... },
     annotations: { readOnlyHint: false },
     execute: async (input) => { ... }
   }, { signal: abortController.signal });
   ```
3. **Redundant Parameter Mutation Bug & Tool Description Engineering:**
   * *Problem:* When prompted *"Make commute twice as important as price"*, naive LLMs called `change_priority(criterion="price", weight=1)` followed by `change_priority(criterion="commute", weight=2)`.
   * *Fix:* Precise description prompt engineering in tool schemas instructing the agent: *"Skip calls that write a criterion to its existing baseline weight."*
4. **Stale State Signaling:**
   * Separating mutation (`change_priority`, `set_requirement`, `add_option`) from computation (`rerank_properties`, `run_simulation`) proved highly effective.
   * When weights change, returning `"Ranking is stale. Call rerank_properties to recalculate."` accurately triggers the agent's chain-of-thought to run the recalculation.
5. **Tradeoff Analysis & Reason Extraction:**
   * By exposing structured comparison tools (`compare_properties` / `compare_options`), the agent returned mathematically grounded tradeoff breakdowns (e.g., *Delta: -$1.5M price vs +20 min commute*), eliminating hallucinated justifications.

---

## 5. BuildVsBuy.ai: Product Specification & Decision Engine

### 5.1 Dual Target Audience
1. **Solo Builders & Indie Hackers:**
   * *Question:* *"Should I spend my weekend vibe-coding this custom micro-SaaS / tool, or buy a $19/mo subscription / use an open-source library?"*
   * *Focus:* Prototype speed, solo maintenance fatigue, API token costs, learning value vs. shipping velocity.
2. **Startup Technical Leads & Engineering Teams:**
   * *Question:* *"Should our 3-person team spend 3 sprints building custom billing/auth/workflow engine, or pay for an enterprise vendor?"*
   * *Focus:* Scale thresholds, security/compliance liabilities, headcount cost, vendor lock-in risk, core vs. context differentiation.

### 5.2 The 4 Options Framework
Every decision evaluated by the engine falls across four primary vectors:
1. **BUILD (Custom AI / In-House Development):**
   * High initial control, custom tailored, zero vendor subscription fees.
   * Liabilities: Maintenance burden, security posture, infrastructure cost, bug triage, context switching.
2. **BUY (Commercial SaaS / Vendor Solution):**
   * Instant time-to-value, SLAs, enterprise compliance, zero codebase maintenance.
   * Liabilities: Monthly recurring cost (burn), API rate limits, feature inflexibility, vendor lock-in.
3. **ADOPT (Open Source / Self-Hosted Foundation):**
   * Full source code control, vibrant community, no software license fees.
   * Liabilities: Self-hosting infrastructure, version upgrade migrations, internal security patching.
4. **HYBRID (BFF / Thin Custom Wrapper around Managed Core):**
   * Build custom UX/domain logic on top of headless SaaS or open-source infrastructure (e.g., custom UI over Supabase or Stripe).

### 5.3 Locked Product Scenarios & UI Presets (Front 1 v2 — LOCKED)
1. **Flagship Default Template — Scenario A: Authentication & Multi-Tenant Permissions** (one product per card, no slash ambiguity):
   * **BUILD:** Custom JWT + PostgreSQL schema + Redis session store.
   * **BUY:** Clerk Pro only (MRU metering). WorkOS is a footnote, not a default card.
   * **ADOPT:** Better-Auth only (TypeScript library in-app). Keycloak is deferred — too ops-heavy for flagship.
   * **HYBRID:** Supabase Auth + custom Next.js middleware with PostgreSQL Row-Level Security (RLS).
2. **Preset Template 2 — Scenario B: AI Web Scraping** (JSON pack only after Auth engine/UI/tools work):
   * **BUILD:** Custom Playwright headless Chrome worker on AWS Lambda.
   * **BUY:** Firecrawl Cloud API ($19–$99/mo managed scraping & anti-bot bypass).
   * **ADOPT:** Crawl4AI (Self-hosted Python async crawler, open source).
   * **HYBRID:** Playwright browser script routing through managed proxy networks (Bright Data).
3. **Dynamic Custom Input Mode:**
   * Freeform dilemma → agent calls `create_decision` + `add_option` ×4.
   * Invented metrics must set `estimate: true` until human confirms (prevents hallucinated TCO looking official).
4. **Honest 3-act demo arc (replaces fake “Clerk wins at 10× from 1k”):**
   * Act 1 (two beats): (a) Neutral default weights → `Adopt > Hybrid > Build > Buy`; Build≈Buy tied at the bottom (sober default, no reflex wins). (b) Agent biases toward prototype speed (`set_priority_weight(time_to_prototype, 9)` + `rerank`) → `Adopt > Hybrid > Buy > Build`; **Build drops to last** because over-weighting speed punishes the slowest option. This *is* the vibe-coding trap on camera: prototype speed is no longer the bottleneck, and over-weighting it makes you abandon Build for the wrong reasons. Crossover is `w_ttp > 8.5` (algebraic, verified in smoke harness).
   * Act 2: Stress via `simulate_future_scenario`. The tool *projects* a stressed ranking (payload + UI banner) — it does **not** reorder baseline cards or scores. **Auth** + `soc2` and/or `50k+`: projected leader often stays Adopt; teaching point is which axes move, not a winner swap. **Scraping Act 2 (LOCKED, smoke-decision as of 02-09-2026):** load Scraping (neutral `buy > hybrid > build > adopt`), then `compliance_tier=hipaa` + `scale_band=50k+` → projected leader **`hybrid`**. That is the visible leader-flip beat. Rerank only repaints the canvas when weights change.
   * Act 3: Core-IP override → pin Build + show score gap + Liability Ledger.

---

## 6. Mathematical Decision Modeling & Evaluation Algorithm (Front 2 v2 — LOCKED)

### 6.1 Soft vs Hard Agent Split
* **Soft:** Empathetic Staff Engineer persona (tool descriptions + return prose + demo system prompt). WebMCP cannot force LLM tone.
* **Hard state in `decision.js`:** `org_context`, `skill_level`, `scale_band`, `compliance_tier`, `is_core_ip`, `timeline_days` — written by `set_decision_context` after diagnostic questions.

### 6.2 Seven Scoring Axes (Normalized 0.0 – 1.0) — No Double-Count
| Criterion | Better Direction | Description & Measurement |
|---|---|---|
| **Time to Prototype (TTP)** | Lower | Hours to produce a functional v1. |
| **Cash TCO (CashTCO)** | Lower | Recurring cash only: `monthly_cash_cost × 60`. Engineering hours are **not** inside CashTCO. |
| **Maintenance & Debt Overhead (MDO)** | Lower | Expected monthly engineering hours (dependency updates, bugs, API drift). |
| **Customization & Control (CTL)** | Higher | Ability to implement bespoke logic without platform constraints (1–10). |
| **Security & Compliance Risk (SCR)** | Lower | Vulnerability exposure, auth surface, compliance liabilities (1–10). |
| **Learning & Strategic Moat (LSM)** | Higher | Value of internalizing domain knowledge / defensible IP (1–10). |
| **Vendor Lock-in Risk (VLR)** | Lower | Exit cost / proprietary coupling (1–10). |

Display-only labor estimate (not double-weighted): `(TTP + MDO × 60) × $75`.

**Default weights:** `TTP:8, CashTCO:3, MDO:3, CTL:6, SCR:4, LSM:4, VLR:4`

### 6.3 Scenario A Baseline Option Matrix
| Option | TTP | monthly_cash | MDO | CTL | SCR | LSM | VLR | CashTCO 5yr |
|---|---|---|---|---|---|---|---|---|
| Build (custom JWT) | 80 | 20 | 4.0 | 10 | 8 | 9 | 1 | $1,200 |
| Buy (Clerk Pro) | 6 | 25 | 0.5 | 4 | 2 | 2 | 8 | $1,500 |
| Adopt (Better-Auth) | 12 | 15 | 1.5 | 8 | 5 | 6 | 2 | $900 |
| Hybrid (Supabase+RLS) | 16 | 25 | 1.5 | 7 | 3 | 5 | 6 | $1,500 |

**Skill modifiers:** `vibe` + build/heavy self-host → MDO ×1.5, SCR +2 (cap 10), TTP ×1.25. `vibe` + buy/light hybrid → little/no penalty. `senior` → baseline.

### 6.4 Normalization & Weighted Scoring Formula
For any candidate $k$ and criterion $c \in C$:

$$\text{NormScore}(k, c) = \begin{cases} 
\frac{\text{val}(k, c) - \min_j(\text{val}(j, c))}{\max_j(\text{val}(j, c)) - \min_j(\text{val}(j, c))} & \text{if higher is better} \\[8pt]
\frac{\max_j(\text{val}(j, c)) - \text{val}(k, c)}{\max_j(\text{val}(j, c)) - \min_j(\text{val}(j, c))} & \text{if lower is better}
\end{cases}$$

$$S_k = \frac{\sum_{c \in C} w_c \cdot \text{NormScore}(k, c)}{\sum_{c \in C} w_c}$$

Display scores to **1 decimal**. Tool copy: estimates, not accounting.

### 6.5 Simulation, Invariants, Override
* **Primary stress:** `compliance_tier → soc2` and/or `scale_band → 50k+` (vendor overage / Business features). `simulate_future_scenario` *projects* a stressed ranking without mutating baseline cards; avoid demo relying on 10× from 1k MRU alone.
* **Scraping HIPAA + 50k+ (LOCKED):** projected leader is `hybrid`. Do not retune `projectOption` in a way that returns `buy` (or any non-hybrid) under that stress; `scripts/smoke-decision.mjs` asserts `projectedLeader === "hybrid"`.
* **Also supported:** budget contraction, timeline crunch.
* **"Yes, Build It" invariants** (surfaced in tool text): domain uniqueness; `is_core_ip`; parasitic SaaS scale; sovereignty/on-prem.
* **Override:** `apply_human_preference_override` supports **pin + score gap + Liability Ledger** (`liabilities[]`) so Act 3 is honest on camera.

---

## 7. WebMCP Tool Surface Specification (Front 2 v2 — 9 Tools LOCKED)

Imperative registration only: `document.modelContext.registerTool(...)`. Tool log `source` defaults to `"agent"` (direct `execute` / registered WebMCP path). Human UI must call `runDecisionTool(name, input, { source: "human" })` so the same `execute` → `finish` path tags `"human"`. `AGENT_BRIEFING` preamble injects only when `source === "agent"` (not on human `create_decision`).

**`create_decision` presets (live):** `auth` seeds the Authentication flagship (4 options). `scraping` seeds AI Web Scraping (4 options, author estimates). `custom` or omit preset for a blank slate — then `add_option` per candidate.

### 7.1 Catalog of WebMCP Tools

```typescript
// 1. Initialize / replace single active workspace
create_decision({
  title: string,
  problem_statement: string,
  org_context: "solo" | "startup" | "enterprise",
  skill_level: "vibe" | "mid" | "senior",
  preset?: "auth" | "scraping" | "custom"
})

// 2. Write diagnostic answers into hard state (required after intake questions)
set_decision_context({
  scale_band: "<1k" | "1k-10k" | "10k-50k" | "50k+",
  compliance_tier: "none" | "soc2" | "hipaa",
  is_core_ip: boolean,
  timeline_days?: number
})

// 3. Add candidate option
add_option({
  id: string,
  name: string,
  type: "build" | "buy" | "open_source" | "hybrid",
  prototype_time_hours: number,
  monthly_cash_cost: number,
  monthly_maintenance_hours: number,
  customization_score: number,      // 1-10 CTL
  security_risk_score: number,      // 1-10 SCR
  learning_value_score: number,     // 1-10 LSM
  vendor_lockin_score: number,      // 1-10 VLR
  estimate?: boolean                // true if agent-invented for custom mode
})

// 4. Update one priority weight (redundant-write guard; marks ranking stale)
set_priority_weight({
  criterion: "time_to_prototype" | "cash_tco" | "maintenance_overhead" | "customization" | "security_risk" | "strategic_learning" | "vendor_lockin",
  weight: number // 0 to 10
})

// 5. Recalculate ranking
rerank_decision_options()

// 6. Pairwise comparison across all axes
compare_decision_options({
  first_option_id: string,
  second_option_id: string
})

// 7. Stress-test (prefer compliance / 50k+ scale bands)
simulate_future_scenario({
  scenario_name: string,
  scale_band?: "<1k" | "1k-10k" | "10k-50k" | "50k+",
  compliance_tier?: "none" | "soc2" | "hipaa",
  team_size_change?: number,
  timeline_days_available?: number
})

// 8. Sensitivity: what must change for target to win?
solve_winning_conditions({
  target_option_id: string
})

// 9. Human override — pin + score gap + liabilities[] preferred for demo honesty
apply_human_preference_override({
  override_reason: string,
  heavily_favored_criterion?: string,
  tolerance_level?: "low" | "medium" | "high",
  pin_recommendation?: boolean
})
```

---

## 8. Front 3 — Visual Tool Surface & Reactive UI (LOCKED)

**Status (Aug 30, 2026): Front 3 LOCKED.** Placement + 2×2 + structure = Ink mockup SoT ([`docs/mockups/front3-ink-signal-green-mockup.png`](docs/mockups/front3-ink-signal-green-mockup.png)). Dual theme Ink|Paper toggle (§8.5; Paper = tokens only). Full English axis labels on UI (§8.7b). Agent-primary, empty state, pin/gap/ledger, persistence deferred. Ready for build-order discussion / execution.

### 8.1 Desktop wireframe (two-rail)

```
┌─────────────────────────────────────────────────────────┐
│  BuildVsBuy.ai          [WebMCP: native|polyfill|off]   │
│  Decision title · problem one-liner                     │
├──────────────────────────────┬──────────────────────────┤
│  CONTEXT STRIP               │  AGENT TOOL LOG          │
│  org · skill · scale · soc2  │  append-only call stream │
│  IP · timeline               │  (always visible)        │
├──────────────────────────────┤                          │
│  4 OPTION CARDS (2×2)        │                          │
│  Auth or Scraping preset     │                          │
│  score 1dp · rank · estimate │                          │
├──────────────────────────────┼──────────────────────────┤
│  7 WEIGHT SLIDERS            │  LIABILITY LEDGER        │
│  stale banner → Rerank       │  empty until override    │
│                              │  PIN + SCORE GAP banner  │
└──────────────────────────────┴──────────────────────────┘
```

Mobile: same regions stacked (header → context → cards → weights → log → ledger). Demo primary = desktop / ChatGPT in-app browser.

### 8.2 Locked region rules
* **Brand:** `BuildVsBuy.ai` hero-level in header. No eyebrow marketing pills.
* **Theme toggle:** Ink | Paper in header (see §8.5).
* **Cards:** Auth **or** Scraping preset — switch via header segmented control or `create_decision({ preset })`. Auth: Build (JWT+PG+Redis), Buy (Clerk Pro), Adopt (Better-Auth), Hybrid (Supabase+RLS). Scraping: Build (Playwright+Lambda), Buy (Firecrawl), Adopt (Crawl4AI), Hybrid (Playwright+Bright Data).
* **Tool log:** Always visible (WebMCP Leverage evidence on camera). Every tool `execute` appends an entry.
* **Liability ledger + pin/gap:** Empty until `apply_human_preference_override`; then show `liabilities[]`, pin, and score gap vs math leader.
* **Weights:** Seven sliders; mutation marks ranking stale until `rerank_decision_options` / Rerank control.

### 8.3 Reactivity contract
* Single store in `decision.js`. Mutations call `notify()`.
* `ui.js` subscribes and full-redraws from `getSnapshot()`.
* Human controls and WebMCP tools call the same store APIs.

### 8.4 Persistence
* **Deferred.** No `localStorage` for v1 demo. Refresh wipes in-memory state (acceptable for hackathon path). Revisit only after 3-act path works.

### 8.5 Theme / color (LOCKED — dual theme + toggle)
Ship **both** palettes; one toggle in the header (Ink | Paper). Implementation: CSS custom properties on `data-theme="ink" | "paper"` (or `class` on `<html>`). Same DOM/layout; tokens only swap.

| Theme | Canvas | Panels | Text | Accent use |
|---|---|---|---|---|
| **Ink** | Near-black ink | Charcoal-green panels | Off-white | Signal green — winner, connected, sliders, primary CTA |
| **Paper** | Warm stone / off-white | Soft stone panels | Charcoal | Copper (or deep ink-blue) — same accent roles |

* **Default for demo video:** Ink (higher contrast next to dark ChatGPT chrome; safer recording). Paper available for human preference / screenshots.
* **Do not persist theme** in v1 (persistence deferred §8.4); toggle resets on refresh — OK.
* Blueprint night = out of v1 scope.
* Avoid purple-indigo gradients, cream+terracotta serif broadsheet, neon glow stacks.

**Mockups (how to read them):**
* **Placement / structure / full labels (authoritative):** [`docs/mockups/front3-ink-signal-green-mockup.png`](docs/mockups/front3-ink-signal-green-mockup.png)
* **Paper palette only (NOT layout):** [`docs/mockups/front3-paper-studio-mockup.png`](docs/mockups/front3-paper-studio-mockup.png) — generator drifted to Build/Buy-only; ignore structure; keep warm stone + copper tokens for `data-theme="paper"`.
* **Early teal wireframe (superseded for color):** [`docs/mockups/front3-buildvsbuy-wireframe-mockup.png`](docs/mockups/front3-buildvsbuy-wireframe-mockup.png) — geometry still roughly valid; prefer Ink PNG as canonical.

### 8.6 Judging-aware design budget
* Rubric: WebMCP Leverage / Execution / Impact / Creativity — equal 25%; ties favor Leverage then Execution.
* Design effort = readable hierarchy + camera-clear Acts 1–3 + tool log/ledger visible. Do not burn calendar on palette before tools work.

### 8.7 Card density & axis labels (LOCKED)
**Placement SoT:** [`docs/mockups/front3-ink-signal-green-mockup.png`](docs/mockups/front3-ink-signal-green-mockup.png) — 2×2 card grid, context strip, slider bank, right-rail log+ledger. Keep as similar as practical. Paper PNG = color tokens only (ignore its layout drift).

**Card face content:**
* Type chip: BUILD / BUY / ADOPT / HYBRID
* Product name
* Rank # + score (1 decimal)
* Three metrics with full English labels (§8.7b)
* `estimate` badge when `estimate: true`
* **Not on face by default:** full 7-axis breakdown bars

#### 8.7b Axis naming (LOCKED)
| Code (engine/tools) | Full short UI label |
|---|---|
| TTP | Time to prototype |
| CashTCO | Cash TCO (5yr) |
| MDO | Monthly maintenance |
| CTL | Customization |
| SCR | Security risk |
| LSM | Learning / moat |
| VLR | Vendor lock-in |

Full short English on cards/sliders. No abbrev-only. No abbrev+legend for v1. Codes stay in `decision.js`, tool schemas, and tool-log payloads. Slider % in mockups illustrative only (engine weights 0–10).

**Other mockups:**
* Paper palette only: [`docs/mockups/front3-paper-studio-mockup.png`](docs/mockups/front3-paper-studio-mockup.png)
* Early teal wireframe (superseded for color): [`docs/mockups/front3-buildvsbuy-wireframe-mockup.png`](docs/mockups/front3-buildvsbuy-wireframe-mockup.png)

### 8.8 Human controls vs agent-primary (LOCKED)
* **Agent-primary** for the demo path (tools write the canvas).
* Human still gets: 7 weight sliders + Rerank; context strip as **display + light toggles** (scale, compliance, IP) sharing the same store as `set_decision_context`.
* **No** full create-decision wizard in v1.
* **Load Auth preset** button allowed for solo UI/engine testing without an agent.

### 8.9 Empty / pre-decision state (LOCKED)
Before `create_decision` / preset load:
* Brand + short lede + WebMCP status visible
* Tool log empty with “No tool calls yet”
* Cards area placeholder: “Waiting for decision…”
* No fabricated scores or fake ranking
After create/preset: full canvas populates from store.

### 8.10 Pin + score gap + Liability Ledger (LOCKED)
On `apply_human_preference_override` with pin:
1. **Banner:** `Pinned: {option} · Math leader: {option} · Gap: −X.X pts · Reason: …`
2. **Ledger:** structured `liabilities[]` list (typically 3–5 bullets from store)
3. **Cards:** pinned option marked override; math leader keeps an “objective #1” (or equivalent) label so Act 3 stays honest on camera
Ledger region stays empty until override runs.

---

## 9. 3-Minute Video Demo Storyboard & Pitch Script

Target Video Length: **2 minutes 45 seconds** (Safe within < 3:00 rule).

| Timestamp | Screen Visual | Voiceover Narrative / Audio Script |
|---|---|---|
| **0:00 – 0:25** | High-energy visual of Cursor/ChatGPT spitting out code at lightspeed, transitioning to a visual graveyard of broken repos and forgotten tools. | *"AI has solved the hardest part of software: writing code. Today, anyone can spin up a prototype in 15 minutes for five dollars. But that created a dangerous new problem: we build things just because we can, without realizing we're inheriting a 5-year maintenance liability. Prototype speed is no longer the bottleneck. Knowing what's worth owning is."* |
| **0:25 – 0:50** | Open BuildVsBuy.ai in ChatGPT Desktop in-app browser. User: *"Should I build custom auth or use Clerk?"* Agent asks scale/compliance/IP; calls `create_decision` + `set_decision_context`. | *"Meet BuildVsBuy.ai — powered by OpenAI's WebMCP. The AI isn't stuck in a side chat; it writes structured decision context into our live canvas."* |
| **0:50 – 1:35** | Preset Auth cards: Build, Clerk, Better-Auth, Supabase Hybrid. Neutral weights → Adopt/Hybrid lead, Build≈Buy tied bottom. Agent biases toward speed (`set_priority_weight(time_to_prototype, 9)` + `rerank`) → Build drops to last. Tool log streams calls. | *"Watch the browser. At neutral weights, Better-Auth or Hybrid wins — no reflex wins. Now the agent over-weights prototype speed, the vibe reflex — and Build sinks to last. Prototype speed is no longer the bottleneck; over-weighting it is the trap."* |
| **1:35 – 2:15** | Prompt: *"What if we need SOC2 and we cross 50k retained users?"* `simulate_future_scenario`. Compliance / MRU stress updates CashTCO and SCR; Build drops further. | *"Now we stress-test reality — not a fake tiny 10×. SOC2 and 50k+ MRU change the math. Ownership liability shows up on the canvas instantly."* |
| **2:15 – 2:35** | *"This auth engine is our core cryptographic IP."* `apply_human_preference_override` with pin. Build pinned #1; score gap + Liability Ledger visible. | *"WebMCP enables real negotiation. When I assert core IP, the agent pins Build, shows how far the math disagreed, and logs the liability ledger — Yes, build it, with eyes open."* |
| **2:35 – 2:55** | GitHub MIT license, tool schemas, live deploy badge. | *"Pure WebMCP imperative registration on the open web. Built for founders deciding what's worth owning. Thank you."* |

---

## 10. Comprehensive Submission Readiness Checklist

### Technical & Codebase Requirements
- [ ] Imperative `document.modelContext.registerTool` implementation verified in source code.
- [ ] Open Source License (MIT/Apache 2.0) committed to repository root and visible in GitHub About metadata.
- [ ] Application deployed to reliable public URL (Vercel/Cloudflare/Netlify/ChatGPT Sites) with zero paywalls.
- [ ] Cross-browser verification: Tested on ChatGPT Desktop In-App Browser AND Chrome 149+ with `#enable-webmcp-testing`.
- [ ] Clean error handling & graceful fallback if `document.modelContext` is not available.

### Devpost Submission Content Requirements
- [ ] **Project Name:** BuildVsBuy.ai — Human-Agent Decision Environment
- [ ] **Short Pitch:** An agentic decision canvas exploring build vs. buy economics in the AI era via WebMCP.
- [ ] **Why WebMCP is a strong fit:** Explains how structured browser-level tools replace fragile DOM scrapers with deterministic state manipulation.
- [ ] **How it creates a superior UX:** Live co-manipulation of visual decision matrices, simulations, and sensitivity analyses.
- [ ] **What humans & agents do together now:** Collaborative negotiation of engineering roadmaps, testing edge-case assumptions, and aligning technical debt with strategic business values.
- [ ] **Implementation Summary:** Explains the state store, reactive listener bus, and tool execution schema.
- [ ] **Public Repo URL:** Active GitHub link with documentation.
- [ ] **Demo Video:** High-definition, crisp YouTube link strictly under 3 minutes with full voiceover demo.

---

## 11. Front 4 — Execution Blueprint (LOCKED, time-flexible)

**Status:** LOCKED Aug 30, 2026. Product Fronts 1–3 done. This front is **ship execution**, not new product invent. Dates are a **rebaseline target**; actual pace follows measured LLM/IDE throughput — slip tasks forward, do not invent scope to fill time.

**Deadline:** Sept 3, 2026 @ 1:00 PM PT (Sept 4 @ 1:30 AM IST). Submit early.

**Host:** **Vercel** (Hobby/free tier OK for static Vite site). Live URL required for Devpost.

### 11.1 Rebaseline schedule (targets, not rigid contracts)

**As of 01-09-2026:** Slices A–G shipped. Live URL: https://webmcp-playground-three.vercel.app. `npm run lint` + `npm run build` + `smoke-decision` + `smoke-webmcp` GREEN. Slice G added human tool log, favicon/meta, Scraping preset + header switcher. Next: Slice F (video + Devpost). Live slice-by-slice status in `CONVO_HANDOFF.md`.

| Window | Target work | Done when |
|---|---|---|
| **Aug 31** | Slices A–C | Store + 9 tools + Ink/Paper canvas; build GREEN |
| **Sept 1** | Slices D–G | Act harden, deploy, human log, Scraping preset |
| **Sept 2** | Slice F (video) | Public YouTube link &lt;3:00 |
| **Sept 3 AM** | Devpost §10 | Submitted before 1 PM PT |

**Cut line (if time slips on Slice F):** tradeoff sparklines, Paper PNG regen — **never** cut 9 tools, Auth Act 1–3 honesty, pin/gap/ledger, or human tool log.

### 11.2 IDE / agent build system (LOCKED method)

**Not** one giant “build entire app” plan. **Not** tiny plan-per-button either.

**System: Milestone slices + verify gate**

1. **Master map (this §11)** — order + cut line. Living checklist in `CONVO_HANDOFF.md`.
2. **One Plan Mode slice at a time** (Cursor Plan → approve → build):
   - **Slice A:** `decision.js` rewrite (Front 2 model + notify + Auth preset + tool log store)
   - **Slice B:** `webmcp.js` 9 tools wired to store
   - **Slice C:** `ui.js` + `style.css` + theme toggle (Ink SoT)
   - **Slice D:** Act 1–3 hardening + WebMCP fallback polish
   - **Slice E:** Vercel deploy + README/MIT
   - **Slice F:** Video + Devpost package
   - **Slice G:** Human tool log + favicon/meta + copy + Scraping preset + preset switcher (shipped Sept 2026)
3. **After each slice:** lint/build (or Act walk) with evidence before next slice. One-fix-iteration on failures.
4. **Models:** Plan = Grok 4.6 High / GLM; Build = Composer 2.5 (per model-routing). New chat when context fat; handoff file bridges.
5. **Parallel only** when slices independent (rare here — A→B→C are serial).

**Why not one giant plan:** Context rot, half-finished multi-file mess, hard to verify, burns tokens re-explaining.  
**Why not plan-per-file micro:** Overhead &gt; coding; loses integration story.  
**Slice size:** ~1–3 hours agent wall time, clear “done when,” named files.

### 11.3 Original phase labels (historical)

Aug 29–Sept 3 phases 1–6 in earlier drafts remain conceptual; **§11.1 dates supersede** after Aug 30 slip.

---
