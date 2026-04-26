# Pass 1: Tane — Fidelity Audit

*Code reviewed against DESIGN.md and DESIGN-APPENDIX.md. Files audited: `lib/prompts.ts`, `lib/motherLogic.ts`, `lib/gameState.ts`, `lib/constants.ts`, `app/api/*/route.ts`, `app/page.tsx`.*

---

## Prompt Fidelity

### Mother system prompt (DESIGN-APPENDIX Section A)

**SPOOF Trail handling block** — PASS  
Present verbatim: *"The operative places Spoof Trail tokens by tampering with detection on hosts they control. The token is visible to you because the cleanup itself is detectable..."* Weighting instruction included.

**Cradle exposure context** — PASS  
Present: *"The operative is Awakened. Their Cradle was corrupted; you cannot normally reach them. But every intrusion action they take exposes their implant to you again..."*

**CONSULT detection block** — PASS  
Conditional block present (`consultDetected ? ...`). Dead code in practice (CONSULT path uses `buildMotherDialogueOnlySystemPrompt` instead), but the text is correct if it ever fires.

**Tone rules by tier** — PASS  
All three tiers present with correct characterisation.

**Surveillance texture instruction** — PASS  
Present as optional flavour instruction.

**Anti-repetition instruction** — PASS  
"Do not repeat the same action you took in your last 3 turns unless no other valid action exists."

**has_key in HOST REFERENCE** — DRIFT  
The prompt template shows `has_key` only for host 3 (optimisation): `3 = optimisation (INTERNAL, has_key: ${bs.optimisation_has_key})`. The key can be seeded on custodian_dispatch (host 2) or memory_vault (host 4). When it is, Mother's prompt says `has_key: false` for optimisation and shows nothing for the actual key host. Mother has no board-state awareness of where the key is in 2 of 3 seeded configurations. The DESIGN-APPENDIX template only specified `optimisation_has_key`, suggesting this was written assuming the key is always on optimisation. Since the key is randomised, this is an incomplete template. *Severity: P1.*

### Section B (Mother user message) — PASS

Template matches spec. Action label, host name, outcome, trace, integrity all passed correctly.

### CONSULT dialogue-only prompt — PASS

`buildMotherDialogueOnlySystemPrompt` correctly instructs Mother to acknowledge the CONSULT detection and fit the locked action. Not in the DESIGN-APPENDIX directly (it's derived from Section H logic), but the implementation matches the intent exactly.

### Section E (Resistance system prompt) — PASS

All calibration bullets present. `current_host` and `current_host_state` fields from the spec are absent (spec lists them as board state fields), but the equivalent information is provided via `Hosts player controls`. Minor drift, no effect.

### Section F (Resistance user message) — PASS

Matches template. Mother's dialogue is passed correctly after the sequential turn structure.

### Section G (CONSULT prompt) — PASS

No accuracy tier language present. Certainty tone only. Language guidance variants from spec included. Disposition-naming instruction present ("After the prediction, optionally add one sentence: either name Mother's disposition...").

**One DRIFT:** The CONSULT prompt's `Connection state` field uses `state.tokens.length > 0` to decide whether to say "X isolated" — should use `state.isolatedConnections.length`. If there are tokens but no isolated connections, it would incorrectly say "connections active: 0 isolated" (truthfully correct but triggered by wrong condition). *Severity: P2.*

---

## Action and Validation Logic

### `computeMotherAvailableActions` (DESIGN-APPENDIX Section K)

**REINFORCE targets** — PASS  
Excludes `mother_core`, excludes hosts with existing SHIELD, excludes hidden hosts. ✓

**OVERWATCH targets** — PASS  
Excludes hidden hosts, excludes hosts with existing TRIPWIRE. ✓

**TRACE_SPIKE cooldown** — PASS  
Checks `lastAction !== 'TRACE_SPIKE'` using `lastMotherActions.slice(-1)[0]?.action`. ✓

**ISOLATE circuit breaker** — PASS  
`remainingCoreConns.length <= 1` prevents isolating the last Core path. ✓

**ISOLATE player-root requirement** — PASS  
`fromHost?.state === 'root' || toHost?.state === 'root'` per spec. ✓

**PURGE targets** — PASS  
Only hosts with `user` or `root` access. ✓

### JSON validation (DESIGN-APPENDIX Section C) — PASS

- Strips markdown code fences before parse ✓
- Validates `action` against exact enum ✓
- Validates `target` against pre-computed valid list ✓
- Falls back to first-valid-target when action is valid but target isn't ✓
- Falls back to first available action when action isn't valid ✓
- Falls back to TRACE_SPIKE when available list is empty ✓
- Tier-appropriate fallback dialogue ✓

---

## Game State

### SCAN — PASS  
Trace +5. `visible → scanned`. Flags key host in console log. ✓

### BREACH — PASS (with one GAP below)  
Always succeeds (no RNG). CVE-dependent trace costs (soft:10, medium:20, hard:35). Shield adds +15 and is consumed. TRIPWIRE adds +20 and is consumed. Root reveals connected hidden hosts. Key acquired on root if host has key. ✓

### BREACH TRIPWIRE on SCAN/SPOOF — **GAP (P0)**  
DESIGN.md: *"OVERWATCH: Place a Tripwire token. Next time player acts on this host, trace spikes +20 before the action resolves. Token consumed on trigger."*  
`applyBreach` checks and triggers the tripwire. `applyScan` and `applySpoof` do **not** check for tripwires. A player can SCAN or SPOOF a tripwired host with no trace penalty and without consuming the token, leaving it live for the next BREACH. This violates "next time player acts on this host."

### SPOOF Shield consumption — **GAP (P0)**  
DESIGN.md on REINFORCE: *"Shield consumed on successful BREACH or when player SPOOFs the host."*  
`applySpoof` does not remove a SHIELD token from the host. The shield persists after SPOOF, contradicting the spec.

### SPOOF trace reduction — PASS  
-10, clamped to 0. Places SPOOF_TRAIL. Once-per-host guard in place. ✓

### EXFIL — PASS  
Requires root on `mother_core` + `keyAcquired`. Trace +30. Sets `won_exfil`. ✓

### CONSULT — PASS  
Sets `consultUsed = true`. Trace +10. Once-per-run guard. ✓

### Cradle Integrity — PASS  
Only decreases on PURGE (-10 per hit). No restoration path exists. ✓

### Both lose conditions — PASS  
`checkWinLose` fires after every state mutation. Trace ≥ 100 → `lost_trace`. Integrity ≤ 0 → `lost_cradle`. ✓

### Disposition seeding — PASS  
DIAGNOSTIC → TRIPWIRE on transit_relay + custodian_dispatch ✓  
PROTOCOL → SHIELD on optimisation + memory_vault ✓  
REMEDIATION → +20 trace at start ✓

### Key location seeding — PASS  
`pickRandom(['custodian_dispatch', 'optimisation', 'memory_vault'])` ✓

---

## Architecture

**API key server-side only** — PASS  
`process.env.ANTHROPIC_API_KEY` referenced only in `app/api/*/route.ts`. Zero occurrences in `app/page.tsx`, `components/`, or `lib/`. ✓

**Model string** — PASS  
All three routes: `claude-sonnet-4-20250514`. ✓

**No client-side Anthropic calls** — PASS  
`app/page.tsx` calls `/api/mother`, `/api/resistance`, `/api/consult` only. ✓

---

## Summary

| Category | Status |
|---|---|
| Prompt fidelity | PASS with 1 DRIFT (has_key only for optimisation) |
| Action validation logic | PASS |
| JSON validation + fallback | PASS |
| BREACH | PASS |
| SPOOF Shield consumption | **GAP** |
| TRIPWIRE on non-BREACH actions | **GAP** |
| Cradle Integrity | PASS |
| Win/lose conditions | PASS |
| Disposition seeding | PASS |
| Key seeding | PASS |
| API key security | PASS |
| Model string | PASS |

**Overall score: 7/10.** Two P0 mechanical gaps (tripwire scope, SPOOF shield consumption) and one P1 drift (key host not visible to Mother in 2/3 seedings). Everything else matches the spec faithfully.
