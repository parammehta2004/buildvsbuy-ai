# BuildVsBuy.ai — Devpost written narrative

Copy-ready text for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/) submission form.

---

## Elevator pitch

**BuildVsBuy.ai** is a browser-native build-vs-buy decision canvas where humans and WebMCP agents co-manipulate one structured decision model — weights, stress scenarios, and honest human overrides — with every action logged on screen.

**Live demo:** https://webmcp-playground-three.vercel.app/  
**Agent recording URL:** https://webmcp-playground-three.vercel.app/?blank=1  
**Repo:** *(your public GitHub URL)*  
**Video:** *(YouTube link after recording)*

---

## Why WebMCP is a native fit

Chatbots guess from screenshots. BuildVsBuy.ai exposes **nine typed tools** via `document.modelContext.registerTool` so the agent reads and writes **deterministic state** — not DOM text.

- **Typed tools** — JSON-schema inputs for context, weights, rerank, simulate, override.
- **Shared canvas** — agent tool calls and human slider clicks update the same in-memory store; the UI redraws from one snapshot.
- **Tool log as proof** — every `execute` appends a timestamped entry (`source: agent` or `source: human`). Judges can verify that ranking claims match `rerank_decision_options` log lines.

This is the difference between "the agent said Buy wins" and "the agent called `rerank_decision_options` and the log proves it."

---

## UX vs chatbot

A side-panel chatbot hides state. Here, the **page is the product**:

- Four option cards with live ranks and scores.
- Context chips (scale, compliance, core IP) that agents and humans both set through tools.
- Stale-state UX: change a weight → ranks gray out until rerank — teaching agents not to invent fresh numbers.
- Act 3 **Liability ledger** when a human pins an option against the math leader — structured honesty, not vibes.

Humans and agents see identical state. No second source of truth.

---

## Human + agent together

The demo is designed for **collaboration**, not replacement:

| Moment | Human | Agent |
|--------|-------|-------|
| Act 1 | Drag TTP slider, click Rerank | Same via `set_priority_weight` + `rerank_decision_options` |
| Act 2 | Switch to Scraping preset | `simulate_future_scenario` HIPAA + 50k+ — projected leader flips off Buy |
| Act 3 | Toggle core IP, or agent sets it | `apply_human_preference_override` — pin Build, score gap, liabilities |

Human UI actions route through `runDecisionTool(..., { source: "human" })` — the **same execute bodies** as the agent path. One protocol, two actors.

---

## Implementation notes

- **9 tools** registered in `src/webmcp.js`; logic in `src/decision.js` (single source of truth).
- **Stale-state pattern** — weight changes mark ranking stale; `rerank_decision_options` required before scores are "current" again.
- **Polyfill** — `src/polyfill.js` only when native `document.modelContext` is missing (dev / smoke tests).
- **No backend** — Vite + vanilla JS; in-memory state for hackathon scope.
- **Boot** — `/` loads Auth demo by default; `?blank=1` empty canvas for agent video with copy-paste prompts in the right rail.

### Smoke tests (no browser)

```bash
node scripts/smoke-decision.mjs
node scripts/smoke-webmcp.mjs
```

---

## What we built (feature list)

- Auth and Scraping presets (4 options each: Build, Buy, Adopt, Hybrid)
- Seven scoring axes with normalization and skill modifiers
- Future scenario projection (`simulate_future_scenario`) without mutating baseline until rerank
- Pairwise compare and winning-conditions solver tools
- Human preference override with liability ledger
- Ink / Paper themes
- Try-this-prompt panel for judge copy-paste

---

## Try it (judge prompts)

1. **Act 1:** Set time-to-prototype weight to 9 and rerank. Why did Build drop?
2. **Act 2:** Load scraping preset. Simulate HIPAA at 50k+ MRU and explain the projected leader change.
3. **Act 3:** Set core IP to true and pin Build with override reason. Show score gap and liabilities.

---

## License

MIT — free and unrestricted through the judging period (ends 21-09-2026).
