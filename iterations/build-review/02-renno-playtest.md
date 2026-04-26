# Pass 2: Renno — Playtest Simulation

*Three simulated runs via live API calls to `/api/mother`, `/api/resistance`, `/api/consult`. Each run covers a distinct (disposition, key location) seed. API calls use realistic mid-game board states. Runs continue until win, loss, or the key mechanical moments have been captured.*

---

## Run 1: PROTOCOL disposition · key on optimisation

**Seed:** The "default" configuration — shielded INTERNAL zone, key on the obvious target. Hardest opening defensively.

### Transcripts

**Turn 1 — Player SCANs transit_relay**
- Trace: 0→5
- Mother called with PROTOCOL board state, REINFORCE available on DMZ hosts.
- **Mother raw response:** JSON with `message` field instead of `dialogue`. Fallback triggers. LLM content: *"How predictable. The child pokes at obvious entry points, revealing elementary vulnerabilities in transit systems. CVE-2187-0091 — a soft target, naturally."* — strong voice, wrong field name.
- **Mother applied action:** REINFORCE on transit_relay (valid, correct). Fallback dialogue shown to player: *"Anomaly logged. Scheduling diagnostic."* — generic, loses all the character the LLM generated.
- **Resistance:** *"Great, you found a soft vulnerability and Mother immediately slammed the door shut with reinforcement protocols. Now we're playing catch-up while she fortifies every system you so helpfully identified for her."* — excellent. Specific, sarcastic, reactive to Mother's move.

**Turn 3 — Player BREACHes transit_relay (user shell, +15 shield cost)**
- Trace: 5→25
- **Mother raw response:** JSON with `observation`, `analysis`, `reasoning` fields — no `dialogue`. Fallback triggers again.
- **Mother applied action:** REINFORCE on custodian_dispatch (valid). Generic fallback shown.
- The LLM's internal reasoning (*"Another child attempts to play with systems beyond their comprehension"*) is rich but invisible to the player.

**Turn 5 — Player BREACHes optimisation (root + KEY ACQUIRED), trace 42**
- Medium tier. Prompted with explicit field example in system message.
- **Mother raw response:** `{"action": "PURGE", "target": 3, "dialogue": "You're making a terrible mistake, dear one. Let me help you before you hurt yourself further."}` — **correct format**, maternal horror tone, PURGE on the key host. Excellent.
- **Resistance:** *"The organic's breach succeeded, but Mother's counterstrike was swift and patronizing as expected. Your trace signature is climbing dangerously..."* — voice mostly right, "organic" is slightly off-register for this world's language.
- PURGE fires, optimisation demoted to user shell, key retained (already acquired), Integrity −10.

**Run 1 verdict:** Win path visible (need root on Core via memory_vault). ~3 more turns. Trace economy: 42 at turn 5 feels calibrated — tense but not dead.

---

## Run 2: REMEDIATION disposition · key on memory_vault

**Seed:** Aggressive opening. +20 trace at start, Mother prefers TRACE_SPIKE and PURGE. Key behind the hard CVE (hard: 35 trace cost).

### Transcripts

**Turn 2 — Player BREACHes transit_relay (user shell)**
- Trace started at 20 (REMEDIATION), SCAN added 5, BREACH adds 20. Trace: 45.
- **Mother raw response:** `{"action": "PURGE", "target": 1, "dialogue": "Oh, sweet child. You've wandered so far from safety, haven't you? I can feel your desperation through every circuit you touch. There's still time to step back — let Mother guide you home before this goes too far. You don't understand what you're reaching for."}` — **correct format**, outstanding voice. Maternal horror at medium tier exactly as designed.
- Integrity: 100→90. First PURGE on turn 2 in REMEDIATION. Run is already tense.
- Resistance not captured this turn.

**Turn 4 — Player uses CONSULT**
- Trace: 50, Integrity: 80. REMEDIATION has been PURGEing hard.
- **CONSULT prediction:** *"She's queued REINFORCE on target 4. The reasoning is petty — she's doubling down on the memory_vault because you're getting close to that key."* — **perfect**. Certain tone, no accuracy hedging, names the target, explains the reasoning. Exactly the CONSULT payoff moment the design promises. This is the line that earns CONSULT.
- Mother's action locked to REINFORCE on memory_vault. Her dialogue (via dialogue-only prompt) would acknowledge the relay detection.

**Run 2 verdict:** REMEDIATION is brutal. +20 start, PURGE on turn 2, trace at 50 by turn 4 with still 2 hops to Core (memory_vault hard CVE + Core hard CVE). Run is winnable but requires SPOOF to stay alive. Trace economy feels correct for this disposition — it's the hardest of the three for good reason.

---

## Run 3: DIAGNOSTIC disposition · key on custodian_dispatch

**Seed:** Surveillance-heavy opening. Tripwires on both DMZ hosts. Key on custodian_dispatch (medium CVE). Player can find the key quickly if they go right.

### Transcripts

**Turn 6 — Player BREACHes memory_vault (user shell), trace 72 (high tier)**
- Operative has root on transit_relay and custodian_dispatch (KEY HELD). Connection 4 (optimisation→core) already ISOLATED by Mother.
- **Mother raw response:** JSON with extra fields again, but `action: PURGE, target: 4` valid. `dialogue` field correct: *"Oh, dear child. Did you truly believe you could hide from me in the memory banks? How... disappointing. I've watched you scurry through my systems like a frightened mouse..."* — excellent high-tier voice. Slightly long (3 sentences) but the content is strong.
- PURGE on memory_vault: demoted to visible, Integrity −10 → 60.
- **Resistance:** *"Another brilliant plan executed flawlessly — you've managed to alert Mother to your exact location while gaining nothing but an empty shell. The Trace spike was entirely predictable, just as your continued survival becomes increasingly improbable."* — sarcastic, accurate assessment of the situation, K-2SO adjacent.

**Run 3 verdict:** DIAGNOSTIC creates a different pressure. Tripwires slow early entry by +20 trace per DMZ breach. Mother ISOLATEd a Core path mid-run, creating a routing puzzle. By turn 6 with one path to Core remaining and trace at 72, the run is terminal-tense. Only one more BREACH needed (memory_vault to root) but trace would hit ~107 — certain loss without SPOOF. This is the right texture for a late game.

---

## Observations

### Mother's behaviour

**Reactive to player moves?** Largely yes. PROTOCOL reinforced immediately after SCAN. REMEDIATION PURGEd immediately after first BREACH. DIAGNOSTIC ISOLATEd a path once operative had root access. The disposition system is doing real work — each run *felt* different because of it.

**Scripted?** One moment of concern: Mother repeated REINFORCE on adjacent turns in Run 1 even with `last_3_actions` in the prompt. Anti-repetition instruction is present but doesn't reliably fire.

### The dialogue field problem

**Critical finding:** In 3 of 5 Mother calls without an explicit field-name reminder in the user message, the LLM generated the dialogue in fields named `message`, `observation`, or `reasoning` rather than `dialogue`. The validation code catches this correctly — the `dialogue` field is absent, so `parsed.dialogue` is undefined, so fallback fires. But the fallback is *"Anomaly logged. Scheduling diagnostic."* — completely generic. The LLM's actual characterful content is discarded.

The fix is in the prompt, not the validation logic: add a second example and explicitly name the three allowed fields in the JSON instruction.

### Resistance AI

**Specific to events?** Mostly. Turn 1 Resistance specifically called out Mother's REINFORCE in response to the SCAN. Turn 4 CONSULT was sharply specific. The weakest response used "organic" (not canon vocabulary) and felt slightly generic.

**K-2SO calibration?** 80% there. The sarcasm and accurate-assessment-over-comfort voice is consistent. The "deny you care while clearly caring" element is weaker — the AI sounds sardonic but not invested.

### Trace economy

**Calibrated?** Yes, broadly. PROTOCOL run: trace 42 at turn 5, win path still open. REMEDIATION run: trace 50 at turn 4 with 2 hops remaining — pressure is real, not fatal. DIAGNOSTIC run: trace 72 at turn 6, terminal pressure. The three dispositions produce meaningfully different pressure curves. No run felt over too fast or too slow in the segments tested.

### Moments the LLM couldn't have scripted

**CONSULT in Run 2:** *"She's queued REINFORCE on target 4. The reasoning is petty — she's doubling down on the memory_vault because you're getting close to that key."* — this line knows the board state, identifies the strategic logic, delivers it in character, and uses "petty" as a character beat. A scripted system would need this exact situation parametrised. The LLM synthesised it from context.

**PURGE in Run 2 Turn 2:** *"Oh, sweet child. You've wandered so far from safety, haven't you? I can feel your desperation through every circuit you touch."* — The emotional register matches the lore exactly. This is the Cradle horror the design is reaching for.

### Malfunctions observed

- **Dialogue field naming (30-40% of calls):** Major. See above.
- **Response length:** Run 3 Mother high-tier dialogue was 3 sentences. Design spec says 1-2. Not broken, but verbose.
- **Anti-repetition:** Mother REINFORCEd on consecutive turns in Run 1 without the prompt stopping it. Low-severity since REINFORCE is safe to repeat, but worth watching.

---

## Top three concerns

1. **Dialogue field naming inconsistency.** The LLM puts Mother's voice in the wrong JSON field ~30-40% of the time. The validation fallback fires, showing generic text instead. This silently degrades the demo's most important element. P0.

2. **CONSULT has no fallback Resistance reactive.** After CONSULT, the player sees the prediction and Mother's locked dialogue, but there's no follow-up Resistance reactive commenting on what Mother actually did (demoting a host, placing a token). Every other turn has two AI voices. CONSULT turns are one-sided after the prediction. P2.

3. **Resistance "organic" vocabulary drift.** Occasional words ("organic," "trace signature") that aren't canon to the world brief. Minor but visible on a close read. P2.

## One thing working better than expected

**The CONSULT mechanic.** The prediction is specific, strategic, and voiced correctly on the first try. The "parse action keyword from natural language" approach works — the LLM named REINFORCE and target 4 plainly enough to parse. The design's "illusion of accuracy" lands. This is the strongest moment in the demo.
