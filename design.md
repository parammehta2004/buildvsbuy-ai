# Slice C UI Design Specification (BuildVsBuy.ai)

This document is the strict blueprint for implementing Slice C (UI + Themes). It defines the layout, state mapping, and styling constraints for the WebMCP Decision Lab.

## 1. Scope & Boundaries

**Allowed Files (IN):**
- `index.html` (Structure, theme toggle, root elements)
- `src/ui.js` (DOM rendering, event binding, state subscription)
- `src/style.css` (CSS variables, layout, Ink/Paper themes)

**Forbidden Files (OUT - DO NOT EDIT):**
- `src/decision.js` (Engine is locked. Read via `getSnapshot`, mutate via exported actions)
- `src/webmcp.js` (WebMCP tools are locked)
- `src/main.js` (Keep `bindApp(root, getWebmcp)` signature intact)
- `src/polyfill.js`

**Anti-Patterns (NEVER DO THESE):**
- Do not use `localStorage` (theme and state reset on refresh). Persistence is via JSON export/import only — see `exportDecisionState` / `importDecisionState` in `src/decision.js` and the header Export/Import buttons.
- Do not invent scores, ranks, or metrics to match the mockup PNGs. Use real data from `getSnapshot()`.
- Do not add "eyebrow" marketing pills or generic AI UI gradients/neon.
- Do not leave property-lab leftovers (`price`, `commute`, `space`).

---

## 2. Visual Source of Truth

1. **Layout & Structure:** `docs/mockups/front3-ink-signal-green-mockup.png`
   - 2x2 desktop grid for cards.
   - Header, Context Strip, Sliders on the left/center.
   - Right-rail for Agent Tool Log and Liability Ledger.
2. **Color Tokens (Paper Theme):** `docs/mockups/front3-paper-studio-mockup.png`
   - Use this *only* for extracting the warm stone/copper color palette. Ignore its layout.

---

## 3. Theme System (CSS Variables)

Implement a dual-theme system using `data-theme` on the `<html>` element. Default is `ink`. Toggle lives in the header.

**Token Mapping:**
| Role | Ink Theme (Default) | Paper Theme |
| :--- | :--- | :--- |
| **Canvas Background** | Near-black ink | Warm stone / off-white |
| **Panel Background** | Charcoal-green | Soft stone |
| **Text** | Off-white | Charcoal |
| **Accent / CTA** | Signal green | Copper (or deep ink-blue) |
| **Status OK** | Signal green | Copper / Green |
| **Status Bad** | Muted red / warning | Muted red |

*Implementation Note:* Use CSS variables (`--bg`, `--panel`, `--text`, `--accent`) and redefine them under `html[data-theme="paper"]`.

---

## 4. State Mapping & Reactivity

The UI must subscribe to the `decision.js` store and re-render on `notify()`.

**Imports allowed from `decision.js`:**
- **Read:** `getSnapshot`, `subscribe`, `CRITERION_KEYS`, `CRITERION_LABELS`
- **Write:** `loadAuthPreset`, `setPriorityWeight`, `rerankDecisionOptions`, `setDecisionContext`

### 4.1 Empty State (`options.length === 0`)
- **Cards Area:** Show "Waiting for decision..."
- **Tool Log:** Show "No tool calls yet."
- **Ledger:** Show "Empty until human override."
- Provide a "Load Auth Preset" button for manual testing.

### 4.2 Active State (`options.length > 0`)
- **Cards:** Render from `options`.
  - Map `type: "open_source"` to the label **ADOPT**.
  - Show `displayScore` (1 decimal).
  - Show 3 metrics: Time to prototype, Cash TCO (5yr), Monthly maintenance.
  - Show `estimate` badge if `option.estimate === true`.
- **Ranks:**
  - If `rankingCurrent === true`, show actual ranks (1, 2, 3, 4). Show "WINNER" chrome on rank 1.
  - If `rankingCurrent === false`, show ranks as "—", display a "Stale" banner, and highlight the **Rerank** button.

### 4.3 Override State (`override.active === true`)
- **Cards:** The pinned card gets an "Override" badge. The math leader keeps an "Objective #1" badge.
- **Ledger:** Populate with `liabilities[]` from the snapshot.
- **Banner:** Show "Pinned: [Name] · Math leader: [Name] · Gap: [scoreGap] pts · Reason: [reason]".

### 4.4 Human quick-actions
- **Solve for Build**, **Pin Build**, Act 2 stress, and Compare top 2 all call `runDecisionTool(..., { source: "human" })` — same execute path as the agent (no parallel store API).

---

## 5. UI Regions & Controls

### Header
- Brand: `BuildVsBuy.ai`
- WebMCP Status: Read from `webmcp.source` (`native` | `polyfill` | `unavailable`). Verify the 9 expected tools are registered.
- Theme Toggle: Button to swap `data-theme` between `ink` and `paper`.

### Context Strip
- **Display Only:** Org context, Skill level, Timeline.
- **Toggles:** Scale band, Compliance tier, Core IP. Clicking these calls `setDecisionContext({...})`.

### Weights / Sliders
- 7 sliders for the criteria.
- Use `CRITERION_LABELS` for English names (never raw codes like `TTP` in the UI).
- `input type="range"`, min 0, max 10, step 0.1.
- `onChange` or `onInput` calls `setPriorityWeight({ criterion, weight })`.

### Agent Tool Log (Right Rail)
- Always visible.
- Append-only list rendering `toolLog` from the snapshot.
- Shows timestamp, tool name, and summary.

### Liability Ledger (Right Rail)
- Below the tool log.
- Empty state: "Empty until human override."
- Active state: Renders the `liabilities` array (title, description, severity).

---

## 6. Execution Checklist for Agent

1. [ ] Rewrite `index.html` to include `data-theme="ink"`.
2. [ ] Rewrite `src/style.css` with Ink/Paper CSS variables and 2x2 grid layout.
3. [ ] Rewrite `src/ui.js` to render the 6 regions (Header, Context, Cards, Weights, Log, Ledger).
4. [ ] Wire up `loadAuthPreset` button.
5. [ ] Wire up 7 sliders to `setPriorityWeight`.
6. [ ] Wire up Rerank button to `rerankDecisionOptions`.
7. [ ] Ensure `npm run lint` and `npm run build` exit 0 without touching engine files.