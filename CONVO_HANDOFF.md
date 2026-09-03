# WebMCP Hackathon — Session Handoff & Context Bridge
**Document:** `CONVO_HANDOFF.md`  
**Updated At:** 04-09-2026 00:42 IST  
**Calendar note:** Deadline = **04-09-2026 13:30 IST** (Devpost: `Sep 4, 2026 @ 1:30pm GMT+5:30`).  
**Status:** Fronts 1–4 LOCKED · video **https://youtu.be/rsHmFBJ4VMk** in README + DEVPOST · live https://buildvsbuy-ai.vercel.app · **next = paste video URL on Devpost form + Submit**

---

## 0. NEXT CHAT — READ THIS FIRST (04-09-2026 00:42)

### Immediate mission
1. **Devpost Submit** — paste **https://youtu.be/rsHmFBJ4VMk** into Video field. README + `docs/DEVPOST.md` already have it. Optional: `docs/screenshots/act3-override.png`.
2. Deadline from **the Devpost page**, not PT conversion: **04-09-2026 13:30 IST**.
3. **Do NOT** re-open Fronts 1–3. Do **not** recut the 1:40 video.

### Recording state (as of handoff)
| Clip | Status | Notes |
|------|--------|--------|
| 1–5 | **LIVE** | https://youtu.be/rsHmFBJ4VMk |

### Live URL / deploy quirks
* Public: https://buildvsbuy-ai.vercel.app/?blank=1  
* After every prod deploy: `vercel alias set <deployment> buildvsbuy-ai.vercel.app --scope parammehta2004-5299s-projects`.  
* Latest JS at handoff: `index-Bo1DXwiq.js` (RC1 remainder deploy). Confirm asset hash after any new push.  
* Hard-refresh / reload tab so WebMCP re-registers tool descriptions after each deploy.

### Already shipped (do not redo)
* UI: tool log / ledger ~55/45 flex; `?blank=1` hides Try this prompt; ledger restored (do not hide again).
* Auth preset infer (`inferDemoPreset`) — `b78a9d5`.
* Act 2: agent `set_decision_context` hipaa/soc2+50k+ on scraping **REFUSED** → simulate — `207b161`.
* **RC1 (complete):**
  * Agent `create_decision` cannot wipe seeded auth/scraping to blank/custom (domain switch auth↔scraping OK) — `590ca85`.
  * `add_option` **REFUSED** on auth/scraping.
  * Real `set_priority_weight` **auto-reranks** + logs both lines — `444cb72`.
  * Agent `solve_winning_conditions` on auth **REFUSED** until a real weight write this session — `afa8eda`.
  * **Redundant TTP write still auto-reranks** (“already at N — re-emitting ranking”) — live `index-Bo1DXwiq.js` (03-09-2026 23:45).
* Smokes: `scripts/smoke-decision.mjs`, `scripts/smoke-webmcp.mjs` cover refuse/auto-rerank + redundant-weight paths.

---

## 0b. QUEUED ROOT-CAUSE FIXES (next chat)

One fix at a time. Smoke + deploy + alias.

### RC1 — Clip 2 idempotent money shot — **DONE**
Redundant `set_priority_weight` no longer silent-skips; always logs + auto-reranks. Smoke 3b covers polluted take.

**Pass criteria (Navigator verify on camera):** hard-refresh `?blank=1` → Prompt 1 → Prompt 2 → log shows weight path + ranking with **Build last** + **4 auth cards**. Even if TTP already 9/10 from a prior take, cards + rerank log must still update.

### RC2 — Act 2 continuous chat
Refuse shipped. Still verify live agent: Prompt 3 → `simulate_future_scenario` + banner ≠ Buy.

### RC3 — Vercel alias hygiene
Always alias after prod with `--scope parammehta2004-5299s-projects`. Document or script.

### RC4 — Slice F wrap
Video live: **https://youtu.be/rsHmFBJ4VMk**. Remaining: paste on Devpost + Submit. Deadline **04-09-2026 13:30 IST** (site clock).

---

## 1. Quick Ingestion Instructions for Next Chat Assistant
1. Read this file — **§0 / §0b** first.
2. Read `docs/VIDEO_SCRIPT.md`.
3. Communication: 🤖; caveman unless told normal; verification-before-completion; blunt accuracy.
4. Do not re-litigate Fronts 1–3. Paste YouTube on Devpost. Trust Devpost displayed deadline.

---

## 2. Project Identity
* **Title:** BuildVsBuy.ai / DecisionLab WebMCP
* **Tagline:** *"When AI makes prototypes free, the scarce resource isn't building — it's knowing what's worth owning."*
* **Stack:** Browser-only Vite + vanilla JS. Zero backend. WebMCP via `document.modelContext.registerTool`.
* **Host:** **Vercel** (Hobby/free).
* **Repo:** https://github.com/parammehta2004/buildvsbuy-ai · Live: https://buildvsbuy-ai.vercel.app

---

## 3. LOCKED Front 1 v2 — Scenario & Presets
| Type | Product |
|---|---|
| **BUILD** | Custom JWT + PostgreSQL + Redis session store |
| **BUY** | Clerk Pro only |
| **ADOPT** | Better-Auth only |
| **HYBRID** | Supabase Auth + Postgres RLS |

* Auth preset = demo default. Scraping via switcher or `create_decision({ preset: "scraping" })`.
* **3-act demo:** Act1 (a) neutral Adopt>Hybrid>Build>Buy · (b) TTP=9/10 → **Build last** · Act2 simulate HIPAA/50k+ on scraping · Act3 pin + gap + Liability Ledger.

---

## 4. LOCKED Front 2 v2 — Math & 9 Tools
* Soft persona = prompt/tool text only. Hard state via tools + poka-yoke refuses.
* Defaults: `TTP:8, CashTCO:3, MDO:3, CTL:6, SCR:4, LSM:4, VLR:4`
* Every `execute` → Tool Log (`source: human|agent`).

---

## 5. LOCKED Front 3 — UI
* Ink default + Paper theme. `?blank=1` hides Try this prompt.
* Right rail: tool-log ~55% / ledger ~45% flex.

---

## 6. LOCKED Front 4 — Execution
* Slices A–G + Tier 2 SHIPPED. **Slice F** video live: https://youtu.be/rsHmFBJ4VMk. Remaining: Devpost form Video field + Submit.

---

## 7. Ordered tasks NOW
1. Paste https://youtu.be/rsHmFBJ4VMk on Devpost. Submit before **04-09-2026 13:30 IST**.
2. Optional Act 3 still: `docs/screenshots/act3-override.png`.

---

## 8. Next chat opening prompt (suggested)
> Read `CONVO_HANDOFF.md` §0. Video https://youtu.be/rsHmFBJ4VMk is in README/DEVPOST. Next: Devpost Submit. Deadline = Devpost page clock. Do not invent scope.

---

## 9. Docs sync note
Handoff updated 04-09-2026 00:42: YouTube URL shipped in docs. Deadline = Devpost 13:30 IST 04-09-2026. Product locks unchanged.
