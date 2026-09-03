# BuildVsBuy.ai

When prototypes are cheap, the painful part is deciding what you should own.

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

<!-- ![Act 3 override with liability ledger](docs/screenshots/act3-override.png) -->

---

Page for build vs buy (auth or scraping). You and a browser agent share one model through 9 WebMCP tools. Cards update. The tool log shows every call.

Axis numbers are my estimates for the demo. Not vendor quotes. Not financial advice.

## Judge quick-start

Open the [live demo](https://buildvsbuy-ai.vercel.app/). Auth loads by default. Copy a prompt from the right rail, or paste into ChatGPT Desktop / Chrome 149+ with WebMCP on. No agent? Use **Run Act 2 stress**, **Pin Build (Act 3)**, **Solve for Build**, **Compare top 2**.

| Act | Prompt |
|-----|--------|
| **1 vibe trap** | Set time-to-prototype weight to 9 and rerank. Why did Build drop? |
| **2 stress** | Load scraping preset. Simulate HIPAA at 50k+ MRU and explain the projected leader change. |
| **3 negotiate** | Set core IP to true and pin Build with override reason. Show score gap and liabilities. |

**Act 2 alternate wording:** Switch to scraping preset, then stress-test for HIPAA compliance at 50k+ users.

Empty canvas for recording: [`?blank=1`](https://buildvsbuy-ai.vercel.app/?blank=1). Prompts still copy from the right rail.

## Why WebMCP

Agents that scrape the DOM guess. Here they call typed tools on `document.modelContext.registerTool`. One store for you and the agent.

- Agent: `set_decision_context`, weights, rerank, simulate, override.
- You: sliders and buttons go through the same `runDecisionTool` path (`source: human`).
- Tool log: every execute shows up. If the rank changed, there should be a matching line.

## The 4 options

| Type | Auth preset | Scraping preset |
|---|---|---|
| **BUILD** | Custom JWT + PostgreSQL + Redis session store | Playwright + AWS Lambda worker |
| **BUY** | Clerk Pro | Firecrawl Cloud API |
| **ADOPT** | Better-Auth | Crawl4AI (self-hosted) |
| **HYBRID** | Supabase Auth + Postgres RLS | Playwright + Bright Data proxies |

Use the header **Auth | Scraping** switcher (or `create_decision({ preset: "scraping" })`) to load scraping. `/` boots Auth. Neutral Scraping rank with default weights is **Buy > Hybrid > Build > Adopt**. Auth usually leads with Adopt.

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

1. `create_decision`: start or replace the workspace
2. `set_decision_context`: scale, compliance, core IP, timeline
3. `add_option`: add a candidate (`estimate: true` if the numbers are made up)
4. `set_priority_weight`: one criterion. Same value still reranks (Prompt 2).
5. `rerank_decision_options`: recompute ranks
6. `compare_decision_options`: pairwise across axes
7. `simulate_future_scenario`: HIPAA + `50k+` on Scraping usually moves the projected leader off Buy
8. `solve_winning_conditions`: what would have to change for a target to win
9. `apply_human_preference_override`: pin, score gap, liability list

Every `execute` appends to the Tool log. Human slider, context-chip, rerank, preset load, reset, **Act 2 / Pin Build / Compare**, Export, and Import use `runDecisionTool` or the shared store with `source: human`.

**No agent:** after Auth or Scraping loads, **Run Act 2 stress** (Scraping, HIPAA + 50k+), **Pin Build (Act 3)** (sets core IP, reranks, pins Build), **Compare top 2**. Export / Import is JSON. Nothing in localStorage.

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

1. **Act 1:** default Auth order is `Adopt > Hybrid > Build > Buy`. Crank Time-to-Prototype and Build usually lands last.
2. **Act 2:** Scraping + `simulate_future_scenario` (HIPAA, `50k+`). Banner shows a projection. Baseline cards stay until a real rerank.
3. **Act 3:** pin Build anyway. Gap vs the math leader plus the liability list. You can disagree with the score.

## Agent demo video script

Public video: https://youtu.be/rsHmFBJ4VMk (1:40). Shoot notes in `docs/VIDEO_SCRIPT.md`.

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

MIT. See [LICENSE](LICENSE).
