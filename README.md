# BuildVsBuy.ai — Auth Decision Canvas Demo

> *When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning.*

An AI-native **build-vs-buy** decision environment centered on the **Authentication & Multi-Tenant Permissions** flagship scenario. Humans and browser-integrated agents collaboratively evaluate whether an idea should be **Built**, **Bought (SaaS)**, **Adopted (Open Source)**, or executed as a **Hybrid**. The agent operates, audits, simulates, and negotiates structured decision state directly inside the web page via **WebMCP** tools — not through fragile DOM scraping or a side chat.

**Structured author estimates, not financial advice.** Axis numbers are plausible demo inputs for comparison, not audited forecasts.

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/).

**Live demo:** https://webmcp-playground-three.vercel.app

## Why WebMCP is a native fit

Traditional agents browse pages by screenshot scraping and simulated clicks — brittle, lossy, and stateless. BuildVsBuy.ai exposes **clean, typed, deterministic tools** directly to the browser-integrated agent via `document.modelContext.registerTool`. The web page becomes a programmable canvas where the human and agent co-manipulate **one shared decision model**:

- The agent writes structured context (`set_decision_context`), adds options, sets weights, reranks, simulates stress scenarios, and even applies a human override — all through typed tool calls.
- The human sees the same canvas update live and can steer with sliders / toggles that call the **same store APIs**.
- Every tool execution streams into an on-screen **Tool log** — human clicks and agent calls share one store, visible proof of WebMCP leverage.

## The 4 options

| Type | Auth preset | Scraping preset |
|---|---|---|
| **BUILD** | Custom JWT + PostgreSQL + Redis session store | Playwright + AWS Lambda worker |
| **BUY** | Clerk Pro | Firecrawl Cloud API |
| **ADOPT** | Better-Auth | Crawl4AI (self-hosted) |
| **HYBRID** | Supabase Auth + Postgres RLS | Playwright + Bright Data proxies |

Use the header **Auth | Scraping** switcher (or `create_decision({ preset: "scraping" })` via WebMCP) to load the scraping scenario. Boot defaults to Auth for the demo video script. Neutral Scraping rank under default weights is **Buy > Hybrid > Build > Adopt** (managed API leads; self-host Crawl4AI trails on solo vibe maintenance) — unlike Auth's Adopt-led order.

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
7. `simulate_future_scenario` — stress-test (prefer `soc2` / `50k+` scale)
8. `solve_winning_conditions` — sensitivity: what must change for a target to win
9. `apply_human_preference_override` — pin + score gap + Liability Ledger for honest human override

Every `execute` appends to the Tool log (agent path). Human slider, context-chip, rerank, and reset actions append with `source: human` too.

## Run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the printed localhost URL (Vite defaults to `http://localhost:5173`) or the [live demo](https://webmcp-playground-three.vercel.app). WebMCP needs a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts): localhost and HTTPS count.

```bash
npm run build
npm run preview
```

### Verify the engine (no browser needed)

```bash
node scripts/smoke-decision.mjs   # Slice A: store + math + override
node scripts/smoke-webmcp.mjs     # Slice B: all 9 tools, Act 1–3 flow
```

## Demo arc (honest 3-act)

1. **Act 1 — vibe trap:** neutral weights rank `Adopt > Hybrid > Build > Buy`; biasing Time-to-Prototype weight high drops Build to last — the prototype-speed trap.
2. **Act 2 — stress:** `soc2` compliance and/or `50k+` monthly retained users change CashTCO and Security risk; ownership liability shows up on the canvas.
3. **Act 3 — negotiate:** human asserts core IP → `apply_human_preference_override` pins Build, shows the score gap vs the math leader, and logs a structured Liability Ledger. *Yes, build it — with eyes open.*

## How it works

1. `src/main.js` installs the WebMCP polyfill only when native `document.modelContext` is missing.
2. `src/webmcp.js` registers the 9 tools; each `execute` calls the matching `src/decision.js` store API and appends to the tool log.
3. `src/decision.js` is the single source of truth: context, options, weights, normalize+score, skill modifiers, simulate/solve, override + liabilities, `notify`/`subscribe`.
4. `src/ui.js` subscribes and full-redraws from `getSnapshot()`; human controls (sliders, toggles, preset switcher, Reset demo, Rerank, theme toggle) call the same store APIs as the agent.
5. **No backend.** Browser-only Vite + vanilla JS. In-memory state (persistence deferred for v1).

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
