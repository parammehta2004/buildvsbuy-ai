# BuildVsBuy.ai — Auth Decision Canvas Demo

> *When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning.*

**Demo video:** [https://youtu.be/rsHmFBJ4VMk](https://youtu.be/rsHmFBJ4VMk) (1:40)

[![BuildVsBuy.ai demo](https://img.youtube.com/vi/rsHmFBJ4VMk/maxresdefault.jpg)](https://youtu.be/rsHmFBJ4VMk)

| | |
|---|---|
| **Live demo** | https://buildvsbuy-ai.vercel.app/ |
| **Agent recording URL** | https://buildvsbuy-ai.vercel.app/?blank=1 |
| **GitHub repo** | https://github.com/parammehta2004/buildvsbuy-ai |
| **Challenge** | [OpenAI WebMCP Challenge](https://webmcp.devpost.com/) on Devpost |
| **Written narrative** | [docs/DEVPOST.md](docs/DEVPOST.md) |
| **Submission checklist** | [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) |

### Screenshot (Act 3)

After you run Act 3 in the browser, capture the override banner (pinned Build vs math leader, score gap) plus the populated **Liability ledger** in the right rail. Save as `docs/screenshots/act3-override.png` and uncomment the line below.

<!-- ![Act 3 — human override with liability ledger](docs/screenshots/act3-override.png) -->

---

An AI-native **build-vs-buy** decision environment centered on the **Authentication & Multi-Tenant Permissions** flagship scenario. Humans and browser-integrated agents collaboratively evaluate whether an idea should be **Built**, **Bought (SaaS)**, **Adopted (Open Source)**, or executed as a **Hybrid**. The agent operates, audits, simulates, and negotiates structured decision state directly inside the web page via **WebMCP** tools — not through fragile DOM scraping or a side chat.

**Structured author estimates, not financial advice.** Axis numbers are plausible demo inputs for comparison, not audited forecasts.

## Judge quick-start

Open the [live demo](https://buildvsbuy-ai.vercel.app/) — Auth loads by default. Use the **Try this prompt** panel in the right rail (copy buttons) or paste these into ChatGPT Desktop / Chrome 149+ with WebMCP enabled. Without an agent, use the human quick-actions: **Run Act 2 stress**, **Pin Build (Act 3)**, **Solve for Build**, **Compare top 2**.

| Act | Prompt |
|-----|--------|
| **1 — vibe trap** | Set time-to-prototype weight to 9 and rerank. Why did Build drop? |
| **2 — stress** | Load scraping preset. Simulate HIPAA at 50k+ MRU and explain the projected leader change. |
| **3 — negotiate** | Set core IP to true and pin Build with override reason. Show score gap and liabilities. |

**Act 2 alternate wording:** Switch to scraping preset, then stress-test for HIPAA compliance at 50k+ users.

For a clean agent recording canvas, open [`?blank=1`](https://buildvsbuy-ai.vercel.app/?blank=1) — prompts remain copyable in the right rail.

## Why WebMCP is a native fit

Traditional agents browse pages by screenshot scraping and simulated clicks — brittle, lossy, and stateless. BuildVsBuy.ai exposes **clean, typed, deterministic tools** directly to the browser-integrated agent via `document.modelContext.registerTool`. The web page becomes a programmable canvas where the human and agent co-manipulate **one shared decision model**:

- The agent writes structured context (`set_decision_context`), adds options, sets weights, reranks, simulates stress scenarios, and even applies a human override — all through typed tool calls.
- The human sees the same canvas update live and can steer with sliders / toggles that traverse the **same `execute` path** as the agent (`runDecisionTool`, `source: human`).
- Every tool execution streams into an on-screen **Tool log** — human clicks and agent calls share one store, visible proof of WebMCP leverage.

## The 4 options

| Type | Auth preset | Scraping preset |
|---|---|---|
| **BUILD** | Custom JWT + PostgreSQL + Redis session store | Playwright + AWS Lambda worker |
| **BUY** | Clerk Pro | Firecrawl Cloud API |
| **ADOPT** | Better-Auth | Crawl4AI (self-hosted) |
| **HYBRID** | Supabase Auth + Postgres RLS | Playwright + Bright Data proxies |

Use the header **Auth | Scraping** switcher (or `create_decision({ preset: "scraping" })` via WebMCP) to load the scraping scenario. Boot defaults to Auth on `/`. Neutral Scraping rank under default weights is **Buy > Hybrid > Build > Adopt** — unlike Auth's Adopt-led order.

## Seven scoring axes (no double-count)

| Code | UI label | Better |
|---|---|---|
| TTP | Time to prototype | lower |
| CashTCO | Cash TCO (5yr) | lower |
| MDO | Monthly maintenance | lower |
| CTL | Customization | higher |
| SCR | Security risk | lower |
| LSM | Learning / moat | higher |
| VLR | Vendor lock-in | lower |

Cash TCO is recurring cash only (`monthly_cash_cost × 60`); engineering hours are **not** double-counted into the score. A display-only labor estimate `(TTP + MDO×60) × $75` is shown separately.

## The 9 WebMCP tools

All registered imperatively via `document.modelContext.registerTool`:

1. `create_decision` — initialize / replace the active workspace
2. `set_decision_context` — write diagnostic answers (scale, compliance, core IP, timeline) into hard state
3. `add_option` — add a candidate option (`estimate: true` for agent-invented metrics)
4. `set_priority_weight` — update one criterion weight (redundant-write guard; marks ranking stale)
5. `rerank_decision_options` — recalculate ranking (required after weight changes)
6. `compare_decision_options` — pairwise tradeoff breakdown across all axes
7. `simulate_future_scenario` — stress-test (HIPAA + `50k+` on Scraping flips projected leader away from Buy)
8. `solve_winning_conditions` — sensitivity: what must change for a target to win
9. `apply_human_preference_override` — pin + score gap + Liability Ledger for honest human override

Every `execute` appends to the Tool log. Human slider, context-chip, rerank, preset load, reset, **Act 2 / Pin Build / Compare**, Export, and Import use `runDecisionTool` or the shared store with `source: human`.

**Human-only (no agent):** after Auth or Scraping loads, use **Run Act 2 stress** (Scraping only — HIPAA + 50k+), **Pin Build (Act 3)** (sets Core IP, reranks, then pins Build), and **Compare top 2**. Cards show author-estimate disclaimers. **Export / Import** persist the canvas as JSON (no localStorage).

## Run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the printed localhost URL (Vite defaults to `http://localhost:5173`) or the [live demo](https://buildvsbuy-ai.vercel.app/). WebMCP needs a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts): localhost and HTTPS count.

```bash
npm run build
npm run preview
```

### Verify the engine (no browser needed)

```bash
node scripts/smoke-decision.mjs   # store + math + Scraping Act 2 leader flip
node scripts/smoke-webmcp.mjs     # all 9 tools, Act 1–3 flow + human-source tagging
npm run lint
```

## Demo arc (honest 3-act)

1. **Act 1 — vibe trap:** neutral Auth weights rank `Adopt > Hybrid > Build > Buy`; biasing Time-to-Prototype weight high drops Build to last — the prototype-speed trap.
2. **Act 2 — stress:** on **Scraping**, `simulate_future_scenario` with HIPAA compliance and `50k+` scale *projects* a stressed ranking where the leader flips **away from Buy** (banner + tool payload). Baseline cards stay unchanged until you rerank after a weight change.
3. **Act 3 — negotiate:** human asserts core IP → `apply_human_preference_override` pins Build, shows the score gap vs the math leader, and logs a structured Liability Ledger. *Yes, build it — with eyes open.*

## Agent demo video script

Record **after** Slices 1–6 are deployed. **Final cut locked at 1:40.** Public video: https://youtu.be/rsHmFBJ4VMk — paste that URL on Devpost. Full timeline: `docs/VIDEO_SCRIPT.md`.

| Step | Detail |
|------|--------|
| **Environment** | ChatGPT Desktop in-app browser **or** Chrome 149+ with `#enable-webmcp-testing` |
| **URL** | https://buildvsbuy-ai.vercel.app/?blank=1 |
| **Act 1** | Agent `create_decision` (auth) → `set_priority_weight` TTP=9 → `rerank_decision_options` (Build drops) |
| **Act 2** | `create_decision` (scraping) → `simulate_future_scenario` HIPAA + 50k+ (projected leader flips off Buy) |
| **Act 3** | `set_decision_context` core_ip=true → `apply_human_preference_override` (pin Build, score gap, liabilities) |
| **Proof** | Tool log fills entry-by-entry; agent must not invent ranks without a matching log entry |

## How it works

1. `src/main.js` boots Auth by default on `/`; `?blank=1` or `?agent=1` leaves an empty canvas for recording.
2. `src/main.js` installs the WebMCP polyfill only when native `document.modelContext` is missing.
3. `src/webmcp.js` registers the 9 tools; each `execute` calls the matching `src/decision.js` store API and appends to the tool log. `runDecisionTool` threads `source: human | agent`.
4. `src/decision.js` is the single source of truth: context, options, weights, normalize+score, skill modifiers, simulate/solve, override + liabilities, `notify`/`subscribe`.
5. `src/ui.js` subscribes and full-redraws from `getSnapshot()`; human controls call `runDecisionTool` so they share the agent execute path.
6. **No backend.** Browser-only Vite + vanilla JS. In-memory state (persistence deferred for v1).

### Discover the registered tools from the page console

```js
const tools = await document.modelContext.getTools();
console.log(tools.map((t) => t.name));
// ["create_decision","set_decision_context","add_option","set_priority_weight",
//  "rerank_decision_options","compare_decision_options","simulate_future_scenario",
//  "solve_winning_conditions","apply_human_preference_override"]
```

## Themes

Dual theme via a header toggle: **Ink** (near-black + signal green, demo default) and **Paper** (warm stone + copper). Implemented as CSS custom properties on `data-theme="ink" | "paper"`. No theme persistence in v1.

## Cross-browser

Tested paths: ChatGPT Desktop in-app browser and Chrome 149+ with `#enable-webmcp-testing`. If `document.modelContext` is unavailable, the UI still renders with a clear "WebMCP unavailable" status.

## License

MIT — see [LICENSE](LICENSE).
