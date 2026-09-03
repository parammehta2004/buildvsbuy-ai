# BuildVsBuy.ai — Final shoot sheet

**Final cut:** 1:45–2:15 (hard cap 3:00)  
**URL:** https://buildvsbuy-ai.vercel.app/?blank=1  
**Shell:** ChatGPT Desktop in-app browser *or* Chrome + WebMCP side panel (same prompts either way)  
**Audio:** Record **silent**. Voiceover + overlays in post.

**Rules:** Paste only. Never type on camera. One clip = one beat. Stop when the money shot hits. Redo a bad clip — don’t salvage it live.

---

## Setup once (before Clip 1)

1. Sign in. Open Notes with the 4 prompts below (ready to paste).
2. Load `?blank=1` — empty canvas; **Try this prompt** panel stays hidden (more room for tool log).
3. Frame: **option cards area + tool log (right rail)**. Side panel narrow enough that cards stay readable. Zoom ~67–80% if needed.
4. Dry-run Prompt 1 once off-camera. Confirm tools move the page.
5. Hit Record only when you’re ready to paste.

---

## CLIP 1 — Hook (~20–40 sec raw → ~12 sec in cut)

**Goal:** Working software in first 10–15 sec of the video.

| Do | Stop when |
|----|-----------|
| Hit Record → **immediately paste Prompt 1** | Cards appear + tool log has first entries (`create_decision` / `set_decision_context` / `rerank…`) |
| Hold 2–3 sec on cards + log | Don’t wait for the agent’s full chat essay |

**Paste:**

```
I'm a solo founder trying to ship auth in about two weeks — maybe ten thousand users at launch, no compliance requirements yet. Should we build our own stack or buy something like Clerk? Walk me through the options for our situation.
```

**Must see:** Auth options on canvas; log growing; Build not “winning on vibes alone.”

**On-screen later:** `WebMCP tools → live canvas → tool log`

**VO later (Beat 1):**  
> BuildVsBuy.ai is a decision canvas in the browser. I asked a normal founder question — build auth or buy Clerk — and the agent didn’t guess from the page. It used WebMCP tools on this tab. You can see each call in the tool log: create the workspace, set our context, rerank.

---

## CLIP 2 — Speed trap (~20–40 sec raw → ~20–25 sec in cut)

**Goal:** Build drops to last when prototype speed dominates. Money shot.

| Do | Stop when |
|----|-----------|
| Paste Prompt 2 (same session as Clip 1 if agent still good; else reload `?blank=1`, re-do Clip 1 fast, then Prompt 2) | Ranks update — **Build last** — and a new `rerank_decision_options` line in the log |
| Hold 2 sec on cards + that log line | Cut agent chatter |

**Paste:**

```
Real talk — we're vibe-coding. Getting a prototype in front of users matters more than perfect architecture right now. Does that actually change who you'd recommend?
```

**Must see:** Rank change on camera + matching rerank log entry.

**On-screen later:** `Prototype speed ↑ → Build drops`

**VO later (Beat 2):**  
> Then I admitted we’re optimizing for speed. The agent re-weighted what matters and reranked. Build fell to last — the vibe trap, on camera, with a log entry to prove it.

---

## CLIP 3 — Future stress (~25–45 sec raw → ~25–30 sec in cut)

**Goal:** Scraping + HIPAA / 50k+ projection. Banner moves; baseline cards stay.

| Do | Stop when |
|----|-----------|
| Paste Prompt 3 | Simulation banner shows projected leader **≠ Buy** (often Hybrid) + `simulate_future_scenario` (or equivalent) in log |
| Hold 2–3 sec on banner + log | Don’t narrate assumptions yourself |

**Paste:**

```
Okay different problem — we're adding AI web scraping. Same kind of team. If we end up HIPAA and fifty thousand monthly users, does the obvious cheap option still hold up?
```

**Must see:** Projection banner; assumptions visible; not a silent card swap pretending the future already happened.

**On-screen later:** `Future stress, not guesswork`

**VO later (Beat 3):**  
> New scenario: web scraping at HIPAA scale. The agent stress-tested the future. The banner shows a projection — assumptions included — without pretending the baseline cards already changed.

---

## CLIP 4 — Override (~25–45 sec raw → ~20–25 sec in cut)

**Goal:** Honest pin — math ≠ your call. Gap + liabilities.

| Do | Stop when |
|----|-----------|
| Paste Prompt 4 | Build pinned / override visible; score gap + liability ledger populated |
| Hold 2–3 sec on pin + ledger | Stop |

**Paste:**

```
I hear you on the math, but crawling is core to our product — we need to own it even if it's not the top score. Record that call and show me what we'd be taking on.
```

**Must see:** Override recorded; gap vs math leader; liabilities listed. No silent winner swap.

**On-screen later:** `Math leader ≠ your call`

**VO later (Beat 4):**  
> Last beat: I said crawling is core IP anyway. The agent recorded an override — pinned Build, showed the gap versus the math leader, and listed liabilities. No silent winner swap.

**Also grab:** Still frame → `docs/screenshots/act3-override.png` after this clip.

---

## CLIP 5 — Outro hold (~5–8 sec raw)

**Goal:** Proof wall + URL.

| Do | Stop when |
|----|-----------|
| Scroll/crop to **full tool log** (dense entries) | 5–8 seconds of hold — no new paste |
| Optional: flash URL bar or leave room for end card | Done recording |

**On-screen later:** `buildvsbuy-ai.vercel.app`

**VO later (outro):**  
> Nine typed tools, one shared store, humans and agents on the same execute path. Live at buildvsbuy-ai.vercel.app.

---

## Edit assembly (post — not while shooting)

| Final time | Clip | Overlay | VO |
|------------|------|---------|-----|
| 0:00–0:12 | 1 | WebMCP tools → live canvas → tool log | Beat 1 |
| 0:12–0:55 | 2 (+ trim of 1 if needed) | Prototype speed ↑ → Build drops | Beat 2 |
| 0:55–1:25 | 3 | Future stress, not guesswork | Beat 3 |
| 1:25–1:50 | 4 | Math leader ≠ your call | Beat 4 |
| 1:50–2:05 | 5 | buildvsbuy-ai.vercel.app | Outro |

**Edit rules:** Jump cuts between tool calls. Speed slow redraws ~1.15×. Kill dead air, login, URL typing, spinners, long chat text.

---

## If agent goes off-script (same clip — nudge once, then redo)

| Problem | Paste this nudge |
|---------|------------------|
| Talks, no tools | `Use the tools on this page — I need to see the canvas update.` |
| Invents ranks | `Show me the ranking from the engine, not your guess.` |
| Skips simulate/override | Repaste that clip’s prompt; if still dead, stop — redo clip |

**Last resort (weaker for judges):** Human quick-actions in the UI. VO: *“Same execute path — human or agent.”*

---

## Done checklist

- [ ] Clips 1–5 recorded (silent)
- [ ] Working UI in first 10–15 sec of cut
- [ ] Tool log grows on camera
- [ ] Visible **rerank** (Build drops)
- [ ] One **non-rerank** tool (simulate or override)
- [ ] No typing / no title slate / under 3:00
- [ ] VO + overlays laid in
- [ ] YouTube **public**
- [ ] Link in README + `docs/DEVPOST.md`
- [ ] Act 3 still → `docs/screenshots/act3-override.png`

**Deadline:** 03-09-2026
