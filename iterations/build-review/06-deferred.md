# Pass 6 Deferred — P2 Items

*Items flagged during review that do not block the portfolio piece. Developer should consider these after gameplay assets are captured and the repo is published.*

---

### D-1: CONSULT prompt `remainingConns` logic uses wrong condition

**Flagged by:** Tane  
**File:** `lib/prompts.ts` → `buildConsultSystemPrompt` (line: `const remainingConns = state.tokens.length > 0 ...`)  
**Problem:** The "connection state" line in the CONSULT prompt uses `state.tokens.length > 0` to decide the display string. If there are tokens but no isolated connections, it shows "connections active: 0 isolated" — triggered by the wrong condition. Should use `state.isolatedConnections.length > 0`.  
**Suggested fix:** `const remainingConns = state.isolatedConnections.length > 0 ? \`${state.isolatedConnections.length} connection(s) isolated\` : 'all connections active';`

---

### D-2: CONSULT path has no follow-up Resistance reactive

**Flagged by:** Renno  
**File:** `app/page.tsx` → CONSULT path  
**Problem:** On CONSULT turns, the player sees the Resistance prediction and Mother's locked action + dialogue, but no Resistance commentary on what Mother actually did (placed a token, demoted a host, etc.). Every other turn ends with two AI voices. CONSULT turns end with one.  
**Suggested fix:** After applying Mother's locked action, fire a brief Resistance reactive call with Mother's actual result. This adds ~1.5s latency to CONSULT turns but closes the voice gap.  
**Note:** v1 design spec doesn't explicitly require this; it's a polish enhancement.

---

### D-3: Resistance AI "deny you care while clearly caring" underdeveloped

**Flagged by:** Iris  
**File:** `lib/prompts.ts` → `buildResistanceSystemPrompt`  
**Problem:** The Resistance AI is consistently sarcastic and accurate but rarely reveals the "clearly caring" half of the K-2SO dynamic. The lines read as sardonic-observer rather than sardonic-handler. The world brief says: *"Cares about the humans it helps while insisting it doesn't. Monitors favourites' vital signs while denying it has favourites."*  
**Suggested fix:** Add a calibration bullet: "Occasionally let the care slip through as a grudging practical concern — not sentiment, but noticing things that matter. 'Integrity at 30. I'm noting that because it's relevant, not because I'm tracking it.'"

---

### D-4: Anti-repetition instruction not reliably enforced

**Flagged by:** Renno  
**File:** `lib/prompts.ts` → `buildMotherSystemPrompt`  
**Problem:** Mother REINFORCEd on consecutive turns in Run 1 despite the anti-repetition instruction. The instruction says "do not repeat the same action you took in your last 3 turns" but the model occasionally ignores it when the disposition strongly biases toward one action type (PROTOCOL → REINFORCE).  
**Suggested fix:** Move anti-repetition from a single instruction sentence to a more prominent constraint block. Or enforce it in code: before calling Mother's LLM, remove the last action from her available actions list if she's used it in both of the last 2 turns. This is a code change but low complexity.  
**Note:** This would make the anti-repetition deterministic rather than probabilistic. Could argue either way — leaving for developer judgment.

---

### D-5: README BREACH paragraph undersells the design decision

**Flagged by:** Sam  
**File:** `build/README.md`  
**Problem:** The BREACH paragraph says "This keeps the tension on resource management rather than random failure." Correct but dry. The interesting claim is that making success deterministic shifts *all* the game's risk onto economics — every action is a trade, never a gamble.  
**Suggested rewrite:** *"BREACH always succeeds. There are no dice. The trace cost is the risk — deterministic, negotiable, legible. This shifts all of the game's tension onto economics: every action is a trade with a known cost, never a gamble with unknown odds. The question is never 'will it work?' It's always 'can you afford it?'"*

---

### D-6: Credits section lacks personality

**Flagged by:** Sam  
**File:** `build/README.md`  
**Problem:** The credits paragraph is functional but reads as a checklist. For a portfolio piece, this is a missed opportunity to say something about *why* this combination of influences points at something coherent.  
**Suggested addition:** *"Into the Breach for the elegance of visible enemy intent — the player knows where the threat is, not what it will choose. Inscryption for the feeling that the game's own intelligence is watching you. K-2SO for a voice that calculates your odds of survival and helps you anyway. These three things fit together."*

---

### D-7: `build/` subdirectory vs git root (code-side cleanup)

**Flagged by:** Sam  
**Not a code change** — developer workflow decision.  
**Recommendation:** Before first GitHub push, decide whether to push `build/` as the repo root or the entire `/Drone/` directory. If pushing `/Drone/`, add to root `.gitignore`: `game.js`, `index.html`, `breach-minigame.js`, `minigames.js`, `styles.css`, `drone-breach.jsx`, `AI_INTEGRATION.md`, `BALANCE_CHANGES.md`, `README.md` (outer). If pushing `build/` as root, copy `iterations/build-review/` into `build/` so the review history is preserved.

---

### D-8: v2 design items (from DESIGN.md Out of Scope)

These are in the design document as future work. Noting here to avoid them being re-raised as bugs:

- **Cradle Integrity UI distortion layer** — at 50%, Resistance channel interference; at 25%, false host data. Documented v2 feature.
- **CVE strength variance per run** — seed could vary CVE tiers. Cut as marginal.
- **Host passive traits** — Custodian Dispatch patrol delay, Transit Relay trail cleaning. Cut as v2.
- **CONSULT accuracy degradation** — v1 ships guaranteed accuracy via hardcoded action. Degradation (genuine Resistance misses) is a v2 mechanic.
