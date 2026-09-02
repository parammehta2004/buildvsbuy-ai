# BuildVsBuy.ai — Devpost written narrative

Copy-ready text for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/) submission form.

---

## Devpost form — paste this (your voice)

Use the **elevator pitch** below as tagline / short description. Paste the **long description** into the main Devpost field. Edit anything that doesn’t sound like you.

### Tagline / short description

BuildVsBuy.ai helps founders decide build vs buy on a live canvas — not in a chat wall of text. WebMCP tools update a shared decision model while a tool log shows every call the agent made.

### Long description (answers the four judge questions)

**The problem I kept seeing**

AI made it stupidly easy to turn an idea into a prototype. Scroll Reddit for ten minutes and you’ll find people shipping small tools for fun — and a steady stream of founders who got halfway through something bigger, hit build-vs-buy friction, and walked away. Auth, scraping, billing, infra: the prototype was free, but the *decision* wasn’t.

A normal ChatGPT thread doesn’t fix that. You ask “should we build or buy auth?” and you get a confident paragraph that *sounds* right — especially because LLMs are tuned to agree with you. Ask it to explain more and you get *more* text. You’re still doing the mental math in your head, across a dozen factors you might not even remember to mention.

I built BuildVsBuy.ai because that decision needs **structured state and real calculation**, not another essay. WebMCP was the fit: the agent asks questions, writes context, changes weights, reranks, stress-tests the future — and every step is visible on the page.

---

**1. Why this use case fits WebMCP**

Build-vs-buy is not one answer. It’s context (team size, compliance, timeline), priorities (speed vs control vs cost), multiple options, and rankings that **change** when any of those move. That’s a state machine, not a single prompt.

WebMCP lets the agent manipulate that state through **nine typed tools** — `create_decision`, `set_decision_context`, `set_priority_weight`, `rerank_decision_options`, `simulate_future_scenario`, and others — instead of guessing from a screenshot or paraphrasing what it thinks the UI says. The engine in `decision.js` owns the math; the agent’s job is to drive the model honestly and explain what changed.

That matters because the failure mode I care about is sycophancy: the model telling you what you wanted to hear. Here, if the agent says “Build dropped to last,” there has to be a `rerank_decision_options` line in the tool log right above it. No log entry, no claim.

---

**2. How this creates a better experience**

Founders get **one visual** for everything that matters: four option cards, live ranks, context chips (scale, compliance, core IP), and weight sliders. Change what you care about — e.g. “we’re vibe-coding, speed matters most” — and you *see* Build slide down the board when the agent reranks. You’re not parsing three screens of GPT output.

When a priority changes, ranks go **stale** (grayed out) until the agent or human explicitly reranks. That’s intentional: changing what you value shouldn’t silently rewrite scores. The UI forces a recalculation step so nobody — human or model — pretends the old numbers still apply.

For scale, the demo also stress-tests the future (HIPAA, 50k+ users on the scraping preset) and shows a **projection banner** with assumptions listed — so “cheap at launch” doesn’t get mistaken for “cheap at growth.”

---

**3. What humans and agents can do together now**

The human brings intent and honesty (“we need to ship in two weeks,” “this is core IP even if the spreadsheet disagrees”). The agent brings memory for the full factor set — it can ask and set context you might forget, then run the engine.

They share **one store**. Human slider clicks and agent tool calls both go through `runDecisionTool` with the same `execute` bodies (`source: human` vs `source: agent`). Same protocol, two actors — not a chatbot in a sidebar pretending it saw what you clicked.

The moment that’s hard in plain chat: **disagreeing with the math on purpose**. In Act 3 you can pin Build while the engine’s leader is something else. The app shows the **score gap** and a **liability ledger** — what you’re signing up for if you override — instead of the model quietly flipping to your side. You and the agent can reach a mutual conclusion: here’s what the model says, here’s what you chose, here’s the delta.

The **tool log** is the transparency layer: founders (and judges) can watch exactly which tool ran after each prompt. I built it primarily so humans can see *how* the agent reached a decision, not just the conclusion.

---

**4. How we implemented WebMCP**

- **Registration:** nine tools in `src/webmcp.js` via `document.modelContext.registerTool`, each with JSON Schema inputs.
- **Single source of truth:** all scoring, simulation, solve, and override logic in `src/decision.js`; UI in `src/ui.js` redraws from `getSnapshot()`.
- **Tool split:** lifecycle-shaped — setup (`create_decision`, `add_option`), context (`set_decision_context`), preferences (`set_priority_weight`), authoritative ranking (`rerank_decision_options`), analysis (`compare_decision_options`, `solve_winning_conditions`, `simulate_future_scenario`), and human judgment (`apply_human_preference_override`). Mutations mark ranking stale; rerank is the only way to publish fresh scores.
- **Human/agent parity:** UI controls call the same execute path as the agent so there’s no hidden second implementation.
- **Polyfill:** `src/polyfill.js` only when native WebMCP isn’t available (local dev / smoke tests).
- **Stack:** Vite + vanilla JS, no backend — in-memory state for hackathon scope.
- **Smoke tests:** `scripts/smoke-decision.mjs` and `scripts/smoke-webmcp.mjs` exercise the full nine-tool flow without a browser.

**Honesty:** axis numbers and preset options are **structured author estimates** for side-by-side comparison in the demo — not live vendor quotes, audited TCO, or financial advice.

**Cut for v1:** saved sessions / accounts, live vendor API pricing, and a third industry preset — wanted the core WebMCP loop (ask → tool → visible state → honest override) solid first.

---

This started as a rough idea about a topic I didn’t know well and turned into something I’m genuinely proud of — and it convinced me how much room WebMCP has beyond “chat with a webpage.”

**Try it:** https://buildvsbuy-ai.vercel.app/  
**Agent recording canvas:** https://buildvsbuy-ai.vercel.app/?blank=1  
**Repo:** https://github.com/parammehta2004/buildvsbuy-ai

---

## Elevator pitch

**BuildVsBuy.ai** is a browser-native build-vs-buy decision canvas where humans and WebMCP agents co-manipulate one structured decision model — weights, stress scenarios, and honest human overrides — with every action logged on screen.

**Live demo:** https://buildvsbuy-ai.vercel.app/  
**Agent recording URL:** https://buildvsbuy-ai.vercel.app/?blank=1  
**Repo:** https://github.com/parammehta2004/buildvsbuy-ai  

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
| Act 2 | Switch to Scraping, click **Run Act 2 stress** | `simulate_future_scenario` HIPAA + 50k+ — projected leader flips off Buy |
| Act 3 | Click **Pin Build (Act 3)** (sets Core IP, then pins) | `apply_human_preference_override` — pin Build, score gap, liabilities |

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
