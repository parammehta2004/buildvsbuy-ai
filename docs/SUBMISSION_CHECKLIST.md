# Submission checklist — OpenAI WebMCP Challenge

**Submission deadline:** 04-09-2026 13:30 IST (Devpost clock: `Sep 4, 2026 @ 1:30pm GMT+5:30`)  
**Judging period ends:** 21-09-2026  

Use this list before clicking Submit on Devpost.

---

## Live product

- [ ] **Live URL** loads in ChatGPT in-app browser: https://buildvsbuy-ai.vercel.app/
- [ ] **`/` (no params)** shows 4 Auth cards, ranked, Winner badge visible
- [ ] **`/?blank=1`** shows empty canvas + Load Auth/Scraping CTAs + copyable Try-this-prompt panel
- [ ] **`/?preset=scraping`** shows Scraping cards (Buy #1 under default weights)
- [ ] **Try-this-prompt** panel — all three Copy buttons work (paste text matches)
- [ ] **Human slider → Rerank** — stale banner, then updated ranks; tool log shows `source: human`
- [ ] **Human Act 2** (Scraping loaded) — **Run Act 2 stress** shows HIPAA+50k+ banner; projected leader not Buy; assumptions listed
- [ ] **Human Act 3** — **Pin Build** sets Core IP, pins Build (not the math leader), ledger populates
- [ ] **Solve for Build** — quick-action runs `solve_winning_conditions` for the Build option; insight rail updates
- [ ] **Export / Import** — download JSON, refresh, import; ranks + override survive
- [ ] **Act 3** — override banner + Liability ledger populate after pin

## Repository

- [ ] GitHub repo is **public**
- [ ] **MIT** license visible (repo About + `LICENSE` file)
- [ ] WebMCP `registerTool` usage is obvious in repo (`src/webmcp.js`)
- [ ] README hero has live URL, `?blank=1`, judge quick-start
- [x] `npm run lint` — exit 0
- [x] `npm run build` — exit 0
- [x] `node scripts/smoke-decision.mjs` — exit 0
- [x] `node scripts/smoke-webmcp.mjs` — exit 0

## Video (record last)

- [ ] Recorded from https://buildvsbuy-ai.vercel.app/?blank=1
- [ ] Environment: ChatGPT Desktop in-app browser **or** Chrome 149+ with `#enable-webmcp-testing`
- [ ] **Under 3 minutes**, all three acts visible
- [ ] Tool log fills entry-by-entry during recording (no invented ranks)
- [x] Uploaded to **YouTube**, public — https://youtu.be/rsHmFBJ4VMk
- [x] YouTube link added to README hero (embed or link)
- [ ] YouTube link pasted on Devpost form

## Screenshot (optional but recommended)

- [ ] Capture Act 3 state (override banner + Liability ledger)
- [ ] Save as `docs/screenshots/act3-override.png`
- [ ] Uncomment image line in README hero

## Devpost form

- [ ] **Project name:** BuildVsBuy.ai (or as entered)
- [ ] **Tagline / short description** — from [DEVPOST.md](DEVPOST.md) elevator pitch
- [ ] **Long description** — paste sections from [DEVPOST.md](DEVPOST.md)
- [ ] **Live demo URL**
- [ ] **GitHub repo URL**
- [ ] **Video URL** — https://youtu.be/rsHmFBJ4VMk
- [ ] **Built with:** WebMCP, JavaScript, Vite (adjust as needed)
- [ ] Confirm project stays **free and unrestricted** through 21-09-2026

## Post-submit

- [ ] Smoke-test live URL once more after final deploy
- [ ] Share repo link in Devpost gallery if optional fields allow
