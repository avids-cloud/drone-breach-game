# Pass 5: Maya — Punch List Synthesis

*Reading all four critiques. Triaging into a single prioritised list. This is not a redesign pass — the design is locked. Every fix here targets implementation fidelity, voice quality, or presentation.*

---

## P0 — Must fix

These block the demo.

---

### P0-1: Mother JSON field naming — dialogue field missing ~30-40% of calls

**Flagged by:** Renno (playtest), Iris (voice)  
**File:** `lib/prompts.ts` → `buildMotherSystemPrompt`  
**Problem:** The LLM frequently generates `message`, `observation`, `reasoning`, or `analysis` instead of `dialogue`. The validation logic handles this correctly (falls back to tier-appropriate generic text), but the generic fallback discards Mother's actual characterful response. In the playtest, Run 1 Turn 1 Mother produced *"How predictable. The child pokes at obvious entry points"* — excellent voice — which was silently replaced by *"Anomaly logged. Scheduling diagnostic."*  
**Fix:** Strengthen the JSON instruction in `buildMotherSystemPrompt`. Add an explicit second example, name the three exact allowed fields, and state that the `dialogue` field is the only place for Mother's spoken words. Remove any invitation for reasoning fields.

**Applied:** See code change.

---

### P0-2: TRIPWIRE only triggers on BREACH — SCAN and SPOOF bypass it

**Flagged by:** Tane (fidelity)  
**File:** `lib/gameState.ts` → `applyScan`, `applySpoof`  
**Problem:** DESIGN.md: *"OVERWATCH: Place a Tripwire token. Next time player acts on this host, trace spikes +20 before the action resolves. Token consumed on trigger."* Currently only `applyBreach` checks for and consumes TRIPWIRE tokens. A player can SCAN or SPOOF a tripwired host with zero trace penalty and the tripwire remains live. This allows trivial circumvention of DIAGNOSTIC disposition's opening board state.  
**Fix:** Add tripwire check to `applyScan` and `applySpoof`. Shared helper function.

**Applied:** See code change.

---

### P0-3: SPOOF does not consume SHIELD tokens

**Flagged by:** Tane (fidelity)  
**File:** `lib/gameState.ts` → `applySpoof`  
**Problem:** DESIGN.md on REINFORCE: *"Shield consumed on successful BREACH or when player SPOOFs the host."* `applySpoof` places a SPOOF_TRAIL token but does not remove any SHIELD token from the host. The shield persists after SPOOF, giving Mother no mechanical feedback on the evasion, and leaving an active shield that will add +15 to the player's next BREACH even after SPOOF cleaned the host.  
**Fix:** Add shield removal to `applySpoof`.

**Applied:** See code change.

---

## P1 — Should fix

These affect demo quality but don't break mechanics.

---

### P1-1: Mother's prompt only exposes has_key for optimisation

**Flagged by:** Tane (fidelity)  
**File:** `lib/prompts.ts` → `buildMotherSystemPrompt`, `lib/gameState.ts` → `serializeBoardState`  
**Problem:** The HOST REFERENCE in Mother's prompt shows `has_key` only for host 3 (optimisation). The key is seeded randomly across custodian_dispatch, optimisation, or memory_vault. In 2/3 seedings, Mother's prompt is incomplete — she doesn't know which host holds the decryption key and can't strategically protect it. This weakens PROTOCOL disposition (whose core behaviour should include shielding the key host) and makes REMEDIATION less threatening.  
**Fix:** Serialise `has_key` for all three candidate hosts in the prompt. Change the HOST REFERENCE line for hosts 2, 3, and 4 to include their has_key status dynamically.

**Applied:** See code change. (Unambiguous — single serializer update, no judgment call.)

---

### P1-2: Mother's PURGE dialogue needs lore guardrail

**Flagged by:** Iris (voice)  
**File:** `lib/prompts.ts` → `buildMotherSystemPrompt`  
**Problem:** In the playtest, Mother described PURGE as causing neural dissolution and accessing the operative's childhood traumas. This contradicts the lore: PURGE is reclaiming a Cradle channel, not destroying a person. The horror of PURGE is that Mother is walking back through a door the operative opened — not that she's administering punishment. The correct framing makes the game's loss condition more disturbing, not less.  
**Fix:** Add a PURGE lore instruction to Mother's prompt: when describing PURGE, frame it as reclamation of the Cradle channel, not destruction or punishment. Cite the specific language from the design ("walking back through a door they opened").

**Applied:** See code change. (Unambiguous — prompt addition, no judgment call.)

---

### P1-3: Resistance AI uses "organic" and non-canon vocabulary

**Flagged by:** Iris (voice)  
**File:** `lib/prompts.ts` → `buildResistanceSystemPrompt`  
**Problem:** The playtest produced *"The organic's breach succeeded"* — the Resistance AI calling the operative "the organic," which is alien-species or detached-robot language, not the K-2SO allied-handler register. The world brief establishes the AI as *committed to human freedom*, which means it refers to the operative as "you" or "the operative" — never a dehumanising label.  
**Fix:** Add one calibration bullet: "Refer to the operative as 'you' or 'operative.' Never use terms like 'the organic,' 'the human,' or other third-person dehumanising labels."

**Applied:** See code change.

---

### P1-4: `build/` subdirectory vs git repo root

**Flagged by:** Sam (polish)  
**File:** No code change — flag for developer.  
**Problem:** The project lives at `/Drone/build/`. The surrounding `/Drone/` workspace contains prototype files (`drone-breach.jsx`, `game.js`, `index.html`, old iterations). If the developer pushes the entire `/Drone/` directory to GitHub, portfolio viewers will see legacy prototype files alongside the finished build. If they push only `build/`, the `docs/` folder (which references `DESIGN.md` etc.) will be correct but the `iterations/build-review/` files (this review) won't be included.  
**Recommendation:** Either (a) initialise git in `build/` and treat it as the repo root, or (b) initialise git in `/Drone/` with a `.gitignore` that excludes the old prototype files and move `iterations/` inside `build/`. No code change required — developer decision.

---

## P2 — Deferred

See `06-deferred.md`.

---

## Applied fixes summary

| ID | Title | File | Status |
|---|---|---|---|
| P0-1 | Mother JSON field naming | `lib/prompts.ts` | Applied — build verified clean |
| P0-2 | TRIPWIRE scope (SCAN + SPOOF) | `lib/gameState.ts` | Applied — build verified clean |
| P0-3 | SPOOF shield consumption | `lib/gameState.ts` | Applied — build verified clean |
| P1-1 | has_key for all candidate hosts | `lib/prompts.ts`, `lib/gameState.ts` | Applied — build verified clean |
| P1-2 | PURGE lore guardrail | `lib/prompts.ts` | Applied — build verified clean |
| P1-3 | Resistance "organic" vocabulary | `lib/prompts.ts` | Applied — build verified clean |
| P1-4 | git repo root decision | — | Flagged for developer |

**Build verification:** `npm run build` — ✓ Compiled successfully, zero TypeScript errors (2026-04-26).

---

## Portfolio readiness

**Current state (post-fixes):** All P0 and P1 code fixes applied and verified. The game correctly implements the design spec. Mother's JSON field naming is hardened. TRIPWIRE triggers on all three player actions. SPOOF consumes SHIELD. Mother's prompt is complete for all key seedings.

**The remaining gap is visual:** Without the hero gif and screenshots, the README is text-only, which undersells the project. Asset capture is the next task.
