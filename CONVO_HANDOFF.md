# WebMCP Hackathon — Session Handoff & Context Bridge
**Document:** `CONVO_HANDOFF.md`  
**Generated At:** 01-09-2026  
**Calendar note:** Deadline = **03-09-2026 @ 1:00 PM PT**.  
**Status:** Fronts 1–4 LOCKED · **Slices A–G SHIPPED** · live URL https://webmcp-playground-three.vercel.app · GitHub↔Vercel connected · **next = Slice F** (video + Devpost)

---

## 1. Quick Ingestion Instructions for Next Chat Assistant
1. Read this file (`CONVO_HANDOFF.md`) immediately.
2. Read `WEBMCP_MASTER_PROJECT_BIBLE.md` — Front 1–2 §§5–7; Front 3 §8 (Ink SoT); Front 4 §11 (slices + Vercel).
3. Apply communication rules:
   - Start every response with 🤖.
   - **Navigator** (user) / **Architect** (agent): recommend; teach inline.
   - Inline ELI25 → ELI20 → Key Term Breakdown when concepts appear (no ELI5; no footer dump).
   - Verification before completion; blunt accuracy.
4. **Do not re-litigate Fronts 1–3.** Spec locked. Execute slices.
5. **Build system:** One Plan Mode slice → approve → Composer build → verify → next. Serial A→B→C.

---

## 2. Project Identity
* **Title:** BuildVsBuy.ai / DecisionLab WebMCP
* **Tagline:** *"When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning."*
* **Stack:** Browser-only Vite + vanilla JS. Zero backend. WebMCP via `document.modelContext.registerTool`.
* **Host:** **Vercel** (Hobby/free).
* **Repo reality:** `src/decision.js` (Slice A) + `src/webmcp.js` (Slice B) = BuildVsBuy engine + 9 WebMCP tools, spec-aligned. `src/ui.js` + `src/style.css` + `index.html` (Slice C) = Front 3 Ink/Paper canvas, subscribes to `getSnapshot`, human controls call the same store APIs as the 9 tools. `npm run build` GREEN.

---

## 3. LOCKED Front 1 v2 — Scenario & Presets
| Type | Product |
|---|---|
| **BUILD** | Custom JWT + PostgreSQL + Redis session store |
| **BUY** | Clerk Pro only |
| **ADOPT** | Better-Auth only |
| **HYBRID** | Supabase Auth + Postgres RLS |

* Auth preset = demo default (boot). Scraping preset = header switcher or `create_decision({ preset: "scraping" })`. Custom = `estimate: true` until confirmed.
* **Known edge:** `currentPreset` tracked in `ui.js` module scope — agent-driven `create_decision({ preset: "scraping" })` without UI switch won't update the tracker; Reset could reload Auth. Acceptable for demo.
* **3-act demo:** Act1 two beats — (a) neutral weights `Adopt > Hybrid > Build > Buy` (Build≈Buy tied bottom); (b) speed-bias `set_priority_weight(time_to_prototype, 9)` → Build drops to last (the vibe trap; crossover `w_ttp > 8.5`) · Act2 `soc2` and/or `50k+` MRU · Act3 core IP → pin + gap + Liability Ledger.

---

## 4. LOCKED Front 2 v2 — Math & 9 Tools
* Soft persona = prompt/tool text only. Hard state via `set_decision_context`.
* Context: `org_context`, `skill_level`, `scale_band`, `compliance_tier`, `is_core_ip`, `timeline_days`.
* Axes: TTP, CashTCO (`monthly×60`), MDO, CTL, SCR, LSM, VLR — no double-count labor in score.
* Defaults weights: `TTP:8, CashTCO:3, MDO:3, CTL:6, SCR:4, LSM:4, VLR:4`
* Auth baseline numbers + vibe skill modifiers + override pin/gap/`liabilities[]` — see Bible §6.
* **9 tools:** `create_decision`, `set_decision_context`, `add_option`, `set_priority_weight`, `rerank_decision_options`, `compare_decision_options`, `simulate_future_scenario`, `solve_winning_conditions`, `apply_human_preference_override` — Bible §7.
* Every `execute` → Agent Tool Execution Log.

---

## 5. LOCKED Front 3 — UI
* **Placement SoT:** `docs/mockups/front3-ink-signal-green-mockup.png` (2×2, full English labels, tool log, ledger).
* **Paper PNG** = color tokens only (`docs/mockups/front3-paper-studio-mockup.png` layout is WRONG — ignore structure).
* Dual theme: `data-theme="ink"|"paper"` header toggle. Demo default = Ink.
* Full UI labels: Time to prototype, Cash TCO (5yr), Monthly maintenance, Customization, Security risk, Learning / moat, Vendor lock-in. Codes stay in engine/tools.
* Agent-primary + Load Auth preset button; empty pre-decision state; pin/gap/ledger; **no localStorage v1**.

---

## 6. LOCKED Front 4 — Execution (time-flexible)
* Bible §11. Pace follows measured LLM speed; slip forward; don’t invent scope.
* Cut if slow: Scraping, sparklines, Paper PNG regen. **Never cut:** 9 tools, pin/gap/ledger, Act 1–3 honesty.
* **Slices:** A decision.js → B webmcp 9 tools → C UI+themes → D Act harden → E Vercel/README/MIT → F video/Devpost.

---

## 7. TODAY — Monday 31 Aug 2026 (primary mission)

**Goal:** Compress as much of Aug 30–31 window as LLM speed allows. Ideal = A+B+C started; **minimum bar = Slice A done + Slice B planned or started**.

### Slice A — SHIPPED (31 Aug ~6:20 PM IST)
* `src/decision.js` rewritten → BuildVsBuy engine: hard context, Auth preset (4 options), normalize+score, vibe skill mods (build only, NOT Adopt), simulate/solve/override+liabilities, tool-log store, `notify`/`subscribe`, clone-safe `getSnapshot`.
* 9 tool APIs exported for Slice B: `createDecision`, `setDecisionContext`, `addOption`, `setPriorityWeight`, `rerankDecisionOptions`, `compareDecisionOptions`, `simulateFutureScenario`, `solveWinningConditions`, `applyHumanPreferenceOverride`. Helpers: `loadAuthPreset`, `getSnapshot`, `subscribe`, `reset`, `appendToolLog`, `getToolLog`.
* Verified: `npm run lint` exit 0 · `node scripts/smoke-decision.mjs` PASS · `npm run build` exit 1 (expected — `webmcp.js`/`ui.js` stale imports until B/C).
* **Spec conflict resolved (Navigator):** locked §6.3 numbers + §6.2 weights under vibe produce `Adopt > Hybrid > Build > Buy`, not “Buy/Hybrid leads, Build last”. Act 1 narrative re-locked in Bible §5.3 + handoff §3 to match the math: Adopt/Hybrid lead, Buy last, Build near-bottom (3rd), Build≈Buy tied at bottom.

### Slice B — SHIPPED (31 Aug ~6:35 PM IST)
* `src/webmcp.js` rewritten → registers the 9 locked Bible §7.1 tools against `document.modelContext`. Each `execute` calls the matching `decision.js` store API, then `appendToolLog({tool, input, summary})` (captures post-mutation `rankingCurrent` + `ranking`), returns `toolResult([summary, staleNote, asText(result)])`.
* Split pure `buildDecisionTools()` (no `document` access) from `registerDecisionTools()` (browser-side, one HMR-safe `AbortController`) so a Node smoke harness can exercise all 9 tools without a browser.
* Prompt-engineered descriptions (Bible §4.2 findings): `set_priority_weight` redundant-write guard + stale signal; `rerank` "required after set_priority_weight"; `add_option` `estimate=true` for invented metrics; `simulate` prefer soc2/50k+; `apply_human_preference_override` pin + gap + Liability Ledger for honest Act 3.
* New `scripts/smoke-webmcp.mjs`: Act 1–3 flow through all 9 tools (rerank fires twice → 10 log entries). Asserts all 9 names present, `inputSchema` non-empty, log `rankingCurrent` flags correct (rerank=true, weight/context=false).
* Verified: `npm run lint` exit 0 · `node scripts/smoke-webmcp.mjs` PASS · `node scripts/smoke-decision.mjs` PASS (Slice A regression) · `npm run build` exit 1 (expected — failure now isolated to `src/ui.js` stale imports only; `webmcp.js` resolves clean).
* **Plan deviation (flagged):** smoke action item 3 in the plan said "build 3rd" after `add_option`, but step 2 adds a 5th option (custom-x) before step 3's rerank, so the 5-option ranking is `adopt > hybrid > custom-x > build > buy` (build 4th, buy last). Fixed the assertion to match actual engine math (custom-x's lower TTP/cash/MDO under default TTP=8 weight outranks build) rather than faking it to match the inconsistent plan text. 4-option baseline (§6.3) still `adopt > hybrid > build > buy` — unchanged.

### Slice C — SHIPPED (31 Aug ~6:55 PM IST)
* `index.html` → title `BuildVsBuy.ai`, `<html lang="en" data-theme="ink">`, keeps `<div id="app">` + `/src/main.js`.
* `src/style.css` rewritten → Ink (default) + Paper CSS-variable tokens, 2×2 card grid, right-rail tool log + ledger, responsive stack at ≤960px / ≤540px. Accent roles: signal green (Ink) / copper (Paper) for winner, connected, sliders, primary CTA. No purple-indigo gradients, no neon, no serif broadsheet.
* `src/ui.js` rewritten → subscribes to `getSnapshot`, full-redraws on `notify`. 6 regions: header (brand + decision title/problem + WebMCP chip checking the 9 real tool names + theme toggle + Load Auth Preset), context strip (org/skill/timeline display; scale/compliance/IP light toggles → `setDecisionContext`), 2×2 option cards (type chips with `open_source`→ADOPT, rank/score from store only, 3 metrics, winner/override/objective/estimate badges), 7 sliders (`CRITERION_LABELS`, range 0–10 → `setPriorityWeight`), agent tool log (append-only `toolLog`), liability ledger (empty until `override.active`, then `liabilities[]`).
* State rules honored: empty → "Waiting for decision…" / "No tool calls yet"; `rankingCurrent===false` → ranks/scores "—" + stale banner + highlighted Rerank; `override.active` → pin banner (`Pinned · Math leader · Gap · Reason`) + ledger + badges; theme `data-theme` on `<html>`, default ink, header toggle, **no `localStorage`** (persistence deferred §8.4).
* `bindApp(root, getWebmcp)` signature preserved → `src/main.js` untouched. Theme-toggle redraw bug fixed via module-level `appRoot`/`getWebmcpRef` refs (no `null` webmcp on re-render).
* **Model split executed:** Plan/contract = GLM 5.2 (this workspace); paint (`ui.js`/`style.css`/`index.html`) = Gemini 3.1 Pro following `design.md` + Ink PNG SoT; verify = fresh lint/build/smoke run independently (not Gemini's self-report). Engine files (`decision.js`, `webmcp.js`, `polyfill.js`, `main.js`) frozen — mtimes predate Slice C writes; smoke math unchanged.
* Verified: `npm run lint` exit 0 · `npm run build` exit 0 (`✓ built in 179ms`, 8 modules) · `node scripts/smoke-decision.mjs` PASS (neutral `adopt > hybrid > build > buy`; TTP=9 `adopt > hybrid > buy > build`; override gap 0.3) · `node scripts/smoke-webmcp.mjs` PASS (9 tools, 10 log entries).
* **Unverified from agent shell:** live-browser canvas walk (Load Auth → cards → Rerank → TTP=9 → theme toggle → pin/ledger). Needs `npm run dev` + browser; transcript claims pass but no fresh evidence.

### Slice E prep — DONE (31 Aug ~7:00 PM IST, file updates only)
* `README.md` rewritten (was stale property-lab copy) → BuildVsBuy.ai: 4 options, 7 axes, 9 tools, demo arc, run/verify, themes, WebMCP discovery snippet, MIT link.
* `LICENSE` added (MIT, Copyright 2026 BuildVsBuy.ai) — required for Devpost open-source.
* `.gitignore` already present (node_modules/dist).

### Re-verification (fresh, 31 Aug ~7:00 PM IST)
* `npm run lint` → exit 0 (eslint clean)
* `npm run build` → exit 0, `✓ built in 150ms`, 8 modules, `dist/index.html` 0.43 kB / css 8.42 kB / js 41.02 kB
* 9 tool names in `src/webmcp.js` match locked spec exactly (create_decision … apply_human_preference_override).
* Engine `CRITERION_KEYS` / `CRITERION_LABELS` / `DEFAULT_WEIGHTS` match Bible §6.2/§8.7b.

### BLOCKER for Slice E — RESOLVED (31 Aug ~7:05 PM IST)
* **Public repo created + pushed:** https://github.com/parammehta2004/buildvsbuy-ai (PUBLIC, MIT license auto-detected, `main` tracking `origin/main`).
* Commit `f9ec60b` = slices A–C + README + LICENSE + docs/mockups.
* Two raw brainstorming `.txt` files deliberately **not committed** (messy internal notes, not secrets) — left untracked. Add later only if wanted.
* **Still open:** Vercel deploy (live URL). Chaos 5 e2e re-run on localhost via ChatGPT Desktop (hardening shipped, proof not run).

### Slice G — SHIPPED (01-09-2026)
* **G1:** Human tool log (`source: human|agent`), favicon + OG meta, copy pass (Tool log rename, disclaimer).
* **G2:** `SCRAPING_PRESET_OPTIONS` + `loadScrapingDemo()`, header `[ Auth | Scraping ]` segmented switcher, `currentPreset` reset routing, WebMCP `create_decision` scraping enum live, smoke-decision scraping asserts (neutral `adopt > hybrid > buy > build`), README scraping row, Bible §8.2/§11.2 sync.
* **Live:** https://webmcp-playground-three.vercel.app (Vercel auto-deploy from `main`).

### Ordered tasks (updated)
1. ~~Slices A–G~~ ✅ done.
2. **NEXT:** Slice F — record &lt;3:00 video + Devpost package.

### Explicitly NOT blocking ship
* Video, Devpost (Slice F — parallel track).

---

## 8. Next chat opening prompt (suggested)
> Read `CONVO_HANDOFF.md` + Bible §6–8 + §11. Fronts 1–4 locked. Slices A–G SHIPPED. Live URL: https://webmcp-playground-three.vercel.app. Next: Slice F video + Devpost. Do not re-open product design or UI layout.

---

## 9. Docs sync note
Handoff updated 01-09-2026 after Slice G (Scraping preset + preset switcher). Product locks unchanged. **Public repo:** https://github.com/parammehta2004/buildvsbuy-ai. **Live:** https://webmcp-playground-three.vercel.app.
