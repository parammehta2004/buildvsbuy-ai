# BuildVsBuy.ai — Demo video script

**Format:** Short trailer, not a product tour  
**Target length:** 1:45–2:15 (hard cap 3:00)  
**Record from:** https://buildvsbuy-ai.vercel.app/?blank=1  
**Environment:** ChatGPT Desktop in-app browser (logged in before you hit Record)

Judges want working software in the **first 10–15 seconds**, the **agent using your tools**, and **no setup theater**. Paste prompts — do not type on camera. Cut dead air.

---

## Story arc (what the video sells)

A founder asks real build-vs-buy questions. The agent **reasons through the canvas** — loading scenarios, updating weights, stress-testing the future, and finally recording an honest override when gut and math disagree. Every answer is backed by a line in the **tool log**, not chat vibes.

---

## Before you record

- [ ] ChatGPT Desktop open, signed in
- [ ] Browser tab on `?blank=1` (empty canvas, prompts panel visible)
- [ ] Frame includes **option cards + tool log** (right rail)
- [ ] Prompts below copied into a Notes doc — **paste only**
- [ ] Dry run once: agent should call tools, not narrate fake ranks
- [ ] Record in **short clips** (one beat per clip) so you can redo a bad take

---

## Edit map

| Time | What’s on screen | Audio / text |
|------|------------------|--------------|
| 0:00–0:12 | Agent already running; cards appear; first log entries | On-screen: **“WebMCP tools → live canvas → tool log”** |
| 0:12–0:55 | Auth scenario; Build slips when speed dominates | VO beat 1 (below) |
| 0:55–1:25 | Scraping + future stress; projection banner | VO beat 2 + on-screen: **“Future stress, not guesswork”** |
| 1:25–1:50 | Core IP pin; gap + liability ledger | VO beat 3 + on-screen: **“Math leader ≠ your call”** |
| 1:50–2:05 | Hold on full tool log | VO outro + URL card |

**Edit rules:** Jump cuts between tool calls. Speed up slow redraws ~1.15×. Never show login, URL typing, or loading spinners.

---

## Human prompts (paste these — natural language)

These are written as a **founder talking to a copilot**, not as API instructions. The agent should infer presets, weights, and tools from context.

### Prompt 1 — Hook + Act 1 (auth, ~0:00)

Paste as soon as recording starts:

```
I'm a solo founder trying to ship auth in about two weeks — maybe ten thousand users at launch, no compliance requirements yet. Should we build our own stack or buy something like Clerk? Walk me through the options for our situation.
```

**What the agent should figure out (you don’t say this aloud):**  
Load the auth preset, set solo / 1k–10k / no compliance / not core IP / ~14-day timeline, rerank with default weights. Neutral order should look like Adopt and Hybrid ahead; Build not winning on vibes alone.

---

### Prompt 2 — Act 1 payoff (speed trap, ~0:25)

After the agent answers the first question, paste:

```
Real talk — we're vibe-coding. Getting a prototype in front of users matters more than perfect architecture right now. Does that actually change who you'd recommend?
```

**What the agent should figure out:**  
Raise priority on time-to-prototype, rerank. **Build should drop to last** — that’s the money shot. Point the viewer at the card ranks and the new `rerank_decision_options` log line.

---

### Prompt 3 — Act 2 (scraping stress, ~0:55)

```
Okay different problem — we're adding AI web scraping. Same kind of team. If we end up HIPAA and fifty thousand monthly users, does the obvious cheap option still hold up?
```

**What the agent should figure out:**  
Switch to the scraping preset, run a future stress scenario with HIPAA + 50k+ scale. The **simulation banner** should show a projected leader that’s **not Buy** (typically Hybrid). Baseline cards stay put — only the projection moves.

---

### Prompt 4 — Act 3 (honest override, ~1:25)

```
I hear you on the math, but crawling is core to our product — we need to own it even if it's not the top score. Record that call and show me what we'd be taking on.
```

**What the agent should figure out:**  
Mark core IP, pin Build with a human override reason, surface **score gap** vs the math leader and populate the **liability ledger**.

---

## Voiceover script (read yourself or AI-narrate in post)

Keep VO **specific**. Tie every claim to what’s on screen.

### Beat 1 — Auth (~20 sec)

> BuildVsBuy.ai is a decision canvas in the browser. I asked a normal founder question — build auth or buy Clerk — and the agent didn’t guess from the page. It used WebMCP tools on this tab. You can see each call in the tool log: create the workspace, set our context, rerank.

### Beat 2 — Speed trap (~15 sec)

> Then I admitted we’re optimizing for speed. The agent re-weighted what matters and reranked. Build fell to last — the vibe trap, on camera, with a log entry to prove it.

### Beat 3 — Stress (~15 sec)

> New scenario: web scraping at HIPAA scale. The agent stress-tested the future. The banner shows a projection — assumptions included — without pretending the baseline cards already changed.

### Beat 4 — Override (~15 sec)

> Last beat: I said crawling is core IP anyway. The agent recorded an override — pinned Build, showed the gap versus the math leader, and listed liabilities. No silent winner swap.

### Outro (~10 sec)

> Nine typed tools, one shared store, humans and agents on the same execute path. Live at buildvsbuy-ai.vercel.app.

---

## On-screen text cards (optional but recommended)

Use **short overlays** instead of explaining in VO:

1. `WebMCP tools → structured state → tool log proof`
2. `Prototype speed ↑ → Build drops`
3. `simulate_future_scenario — projection, not a guess`
4. `Override: pinned choice vs math leader`
5. `buildvsbuy-ai.vercel.app`

---

## If the agent goes off-script

| Problem | Human nudge (still natural) |
|---------|----------------------------|
| Answers without touching the page | “Use the tools on this page — I need to see the canvas update.” |
| Invents ranks | “Show me the ranking from the engine, not your guess.” |
| Skips stress/override | Repaste the prompt; cut to the next clip once tools fire |

**Fallback (last resort):** Human quick-actions in the header while VO says *“Same execute path — human or agent.”* Weaker for judging; prefer agent path.

---

## Clip checklist (end of edit)

- [ ] Working UI in first **10–15 seconds**
- [ ] Tool log visible and growing
- [ ] At least one **rerank** with visible rank change
- [ ] One **non-rerank** tool (simulate or override)
- [ ] No sign-up, no typing, no title slate
- [ ] Under **3:00**; best material in the **first minute**
- [ ] YouTube upload **public**

---

## After upload

1. Paste YouTube link in README hero and `docs/DEVPOST.md`
2. Capture Act 3 frame → `docs/screenshots/act3-override.png`
3. Submit Devpost using `docs/DEVPOST.md` for the **written** story (team, inspiration, implementation depth live there — not in the video)

**Submission deadline:** 03-09-2026
