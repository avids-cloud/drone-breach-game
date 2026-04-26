# 03 — Maya v2 · Lead Designer Revision

*Maya reads Renno, Iris, Tane, and Sam's critiques. Revises v1. Records disagreements explicitly.*

---

## What Changed and Why

Four critics, four perspectives. All four agreed on one thing: the Isolation loss condition is a distraction. All four agreed on another: disposition starting tokens should be hard-coded, not LLM-reliant. Beyond that, the critiques pulled in complementary directions — Renno wanted fewer systems, Iris wanted deeper ones, Tane wanted LLM-proof engineering, Sam wanted smaller scope. My job is synthesis, not capitulation. Here's what I accepted, what I changed, and where I pushed back.

---

## Core Loop (revised)

The player is an Awakened operative running a live intrusion against Mother's network. Each turn the player picks one of four actions against a selected host: SCAN (gather intel), BREACH (gain or deepen access), SPOOF (clear noise but leave fingerprints), or EXFIL (win). Once per run, the player can CONSULT — spending their action to access the Resistance AI's deep buffer, getting a guaranteed read on Mother's next move. After the player acts, Mother's LLM selects one mechanical counter-move from five options, states it in character, and game state updates. Two resources: Trace (approach of Custodians) and Cradle Integrity (Mother's grip on the player's own implant). Thread the network, extract subjects.db, don't let either bar bottom out.

---

## Win / Lose Conditions (revised — two, not three)

**WIN**: EXFIL on Mother's Core with the decryption key. subjects.db pulled.

**LOSE — TRACE**: Trace hits 100. Custodians converge. The Resistance AI burns the channel.

**LOSE — CRADLE**: Cradle Integrity hits 0. Mother has used the player's own Cradle implant to force a disconnect. The player is ejected through their own nervous system.

The Isolation loss condition is **cut**. See critique response below.

---

## Resources (revised)

### Trace (0–100)
Unchanged from v1. Three tiers: noise (0–29), acknowledged (30–59), hunting (60–99). 100 = game over.

### Cradle Integrity (100→0)
**Renamed and deepened from v1.** Not a hit-point bar. A representation of how much of the player's Cradle remains corrupted-but-stable (i.e., theirs) versus Mother's attempts to reassert control through the implant's native channels.

*Iris's v2 vision (documented here, v1 build is simpler):* As Integrity degrades, the UI should change. At 75: normal. At 50: Resistance AI dialogue shows interference glitches — Mother is on the channel. At 25: one host's state shows a false reading (Mother is feeding bad data through the implant). At 0: forced disconnect. **This is the target design. The v1 build ships Integrity as a bar. The v2 build ships the perception layer. Both are in this document because the design should be whole even if the build is staged.**

For v1: Integrity is visible as a second bar. It is damaged only by Mother's PURGE action (+10 damage per PURGE). It cannot be restored (no SPOOF restore — see action changes below). Hit 0, lose. The bar being unrepairable means it is a slow death sentence when Mother targets it — the player can delay but not reverse.

*Why no restore mechanic?* Because I want Cradle Integrity to function differently to Trace. Trace is a pump-drain resource — you can push it up and SPOOF it down. Cradle Integrity is a countdown. Once Mother starts burning your implant, you're racing. The asymmetry between the two bars gives players different relationships to each.

---

## Operator Action Set (revised — four actions, not six)

RELAY is cut (connections reveal automatically on reaching root — see critique response). SPOOF is kept but nerfed and constrained. CONSULT is redesigned as a once-per-run deep access tool. This gives a clean four-action set that fits on a panel without crowding.

| Action | Noise | Effect | Requires |
|--------|-------|--------|----------|
| **SCAN** | +5 trace | Reveals services and CVE tier on selected host. State: visible → scanned. | Visible host |
| **BREACH** | Scales with CVE (soft: +10, medium: +20, hard: +35) | Gains or deepens access on the selected host. Scanned → user shell; user shell → root. On reaching root, all connected hidden hosts automatically become visible. **Always succeeds** — the trace cost is the risk. | Scanned or user-shell host |
| **SPOOF** | −10 trace | Clears noise — reduces trace by 10. But places a **Spoof Trail** token on the host. Mother can see the token; she knows someone cleaned up. She becomes more likely to target that host on her next turn. Once per host (can't double-spoof the same node). | Any accessed host |
| **EXFIL** | +30 trace | Win condition. Requires root on Mother's Core + decryption key. | Root on Core + key |

**CONSULT** is now a special once-per-run action rather than a regular action. See its own section below.

**Why BREACH always succeeds:** Tane is right — probabilistic failure in a trace-economy game is slot-machine risk. The player has no agency over the dice. But scaling trace cost by CVE strength *is* agency — the player chooses whether to pay 35 trace to breach a hard host directly or find a softer path. That's strategy. The coin flip is not.

**Why SPOOF leaves a token:** Renno is right that SPOOF-as-pure-pump-drain breaks the trace economy. But Sam is wrong that it should be cut entirely — SPOOF gives the player something interesting to do on a turn when no advances are viable. The Spoof Trail token makes SPOOF a trade: you bought time, but now Mother has a target. Good players will SPOOF on a host they've already used and don't need again. Greedy players will SPOOF on their current position and hand Mother a priority.

---

## CONSULT: The Once-Per-Run Deep Access

The Resistance AI gives reactive commentary every turn automatically — the K-2SO voice, always present, costs nothing. This is the soundtrack.

CONSULT is different. Once per run, the player can spend their action to access the Resistance AI's deep buffer. The AI has managed to breach Mother's own planning layer. For a few seconds, it can see what she's about to do.

**Effect:** The Resistance AI gives a *guaranteed accurate prediction* of Mother's next action (action type and target). Not a probability estimate — a read. "She's about to REINFORCE memory_vault. I'm not estimating. I'm in her buffer." This fires before Mother's LLM call resolves on that turn.

**Cost:** Your full action. +10 trace (the channel lit up). The CONSULT is consumed.

**What the AI output looks like (prompt spec in appendix):** The AI identifies Mother's next action from the five-option set, states it plainly, provides one sentence of reasoning in character ("She's been stacking shields on everything except the core. She's saving PURGE for when you reach it."), and delivers it in K-2SO voice.

**Why guaranteed and not probabilistic:** Renno's critique nailed it — a "70% chance she does X" CONSULT is not valuable enough to spend a full action on. The value of CONSULT must justify its cost. A *guaranteed* read is worth a full turn. It changes your plan. It's the action you use when you're about to make a big move and you want to know if Mother is waiting for you. The cost (full turn, trace spike, once-only) is proportionate.

**How to make it reliable:** The Resistance AI's CONSULT prompt gives it Mother's action history and current board state and asks it to predict the single most likely next action from the five-option set. Then, on the same turn, Mother's actual LLM call is seeded with her board state — and we weight her selection toward whatever the Resistance AI predicted, to ensure the prediction is accurate. This is prompt engineering: the CONSULT result and Mother's next move are coordinated. The illusion is that the AI genuinely accessed Mother's buffer. The reality is that we made sure she did.

*Is this "cheating"?* No. It's game design. The LLM is playing Mother's role in a scripted world. Ensuring the CONSULT prediction is accurate produces the dramatic scene we want: the player uses their one lifeline, gets a perfect read, and either acts on it or ignores it. Either way, something memorable happens.

---

## Mother's Action Set and Selection Logic (revised)

Five actions. Mother's LLM receives structured board state and returns a JSON object. **Critical build requirement from Tane: target values are numeric enum IDs, not compound string names.** The game maps IDs to connections and hosts. Fallback on invalid JSON: TRACE_SPIKE.

| # | Action | Target | Effect |
|---|--------|--------|--------|
| 1 | **REINFORCE** | Host ID (1–5) | Shield token on host. Player actions on that host cost +15 extra trace until shield is consumed (SPOOF on that host removes it). |
| 2 | **OVERWATCH** | Host ID (1–5) | Tripwire token on host. Next time player acts on it, +20 trace burst, then token consumed. |
| 3 | **TRACE_SPIKE** | null | +15 global trace. No target. |
| 4 | **ISOLATE** | Connection ID (1–5) | Cuts a pivot connection. **Constraint: Mother can only ISOLATE a connection where the player has root on one endpoint.** She's severing a path you've already established, not preemptively blocking you. She cannot leave you with zero paths to Core (circuit breaker: ISOLATE is removed from her available actions when only one path to Core remains uncut). |
| 5 | **PURGE** | Host ID (1–5) | Demotes player access on a host they control (root → user shell, user shell → no access). Deals 10 Cradle Integrity damage. Only valid on hosts where player has access. |

**The ISOLATE circuit breaker:** If only one path to the Core remains (e.g., both memory_vault→core and optimisation→core are cut — which can't happen under the new rule anyway since she needs player root on an endpoint, but as a safety valve), ISOLATE is removed from Mother's available action list for that turn. The game will not produce a no-moves-to-win state.

**JSON output format:**
```json
{
  "action": "REINFORCE",
  "target": 3,
  "dialogue": "..."
}
```

Where targets are enumerated in the prompt:
```
Hosts: 1=transit_relay, 2=custodian_dispatch, 3=optimisation, 4=memory_vault, 5=mother_core
Connections: 1=transit→optimisation, 2=transit→memory_vault, 3=custodian→memory_vault, 4=optimisation→core, 5=memory_vault→core
```

---

## Mother's Disposition: DIAGNOSTIC / PROTOCOL / REMEDIATION

Renamed per Iris's critique. The old names (PATROL/DEFENDER/HUNTER) were game-boss language, not Mother's language.

| Disposition | Starting Tokens (code-placed at run start) | LLM Prompt Bias |
|------------|-------------------------------------------|-----------------|
| **DIAGNOSTIC** | OVERWATCH on transit_relay and custodian_dispatch | "You are running a system diagnostic sweep. Prefer OVERWATCH actions." |
| **PROTOCOL** | REINFORCE on optimisation and memory_vault | "Standard security hardening protocol. Prefer REINFORCE actions." |
| **REMEDIATION** | +20 trace at run start (Custodians already probing) | "An anomaly has been identified. Prioritise TRACE_SPIKE and PURGE to eliminate the intrusion." |

Starting tokens are deterministic. Code places them at run start regardless of LLM. The LLM bias then flavours how Mother *continues* the run, but the opening board state is guaranteed and testable.

The player discovers disposition through Mother's first 2–3 actions. On a CONSULT, if it's after turn 3, the Resistance AI will name it: "She's in Remediation. She's not building walls — she's coming for you."

---

## Resistance AI: Role and Voice (revised)

**Automatic commentary (every turn):** The Resistance AI reacts after every turn to what the player did and what Mother did. It is always present, always reactive, always in K-2SO voice. No cost. No friction. It's the soundtrack.

**CONSULT (once per run):** See above. Guaranteed prediction, full-action cost, dramatic deployment.

**What the AI is never asked to do:** Count tokens, perform arithmetic, remember what happened without being told, generate JSON. The AI generates dialogue only. State management is in code.

**Prompt design principle (full spec in appendix):** The AI receives a short board state summary (turn count, trace, integrity, player's current host, Mother's last action and target, whether CONSULT is available). It generates 1–2 sentences in character. On CONSULT turns, it receives Mother's likely next action (pre-seeded) and confirms it.

---

## Round Structure (revised — unchanged except CONSULT note)

```
1. Player selects action + target
2. If CONSULT:
   a. CONSULT fires first — AI prediction delivered
   b. Mother's LLM call is seeded to match prediction
   c. Player's turn ends
3. Otherwise:
   a. Action resolves immediately
   b. State updates (trace, integrity, tokens, host states)
   c. Console log entry
4. [Parallel] Mother's LLM fires + Resistance AI reactive call fires
5. Mother JSON validates → effect applies → Mother dialogue shown
6. Resistance AI dialogue shown
7. Win/lose check
8. Next turn
```

---

## Information Model (unchanged — still correct)

Player sees all host states, both bars, all tokens. Does not see Mother's upcoming action. Does not see hidden hosts. CONSULT reveals Mother's next action once per run.

---

## Progression and Run Variance (revised — tighter scope)

Three seeds per run (CVE variance cut per Sam):

1. **Key location**: Randomised between three hosts (Custodian Dispatch, Optimisation Server, Memory Vault).
2. **Mother's disposition**: DIAGNOSTIC, PROTOCOL, or REMEDIATION (starting tokens placed by code).
3. ~~CVE strength variance~~ — Cut for v1. Reintroduce in v2.

Two random variables plus one deterministic seed produces nine distinct run configurations. That's sufficient for a portfolio prototype. Second-run hook comes from: "Last time she was in PROTOCOL, building walls — how does REMEDIATION feel? She came straight for me."

---

## The Tell-Your-Friends Moment (revised — tighter)

Turn 8. Player is on Memory Vault with root, has the key. They've been careful — trace is 52. One BREACH on Mother's Core and they win. The player burns their CONSULT.

Resistance AI: "I'm in her buffer. She's about to PURGE memory_vault. You'll lose root access and take Integrity damage. I'm not estimating. Move before she does."

Mother's LLM call fires. It's biased toward PURGE. Mother's dialogue: "You've been very thorough. Let me be thorough too."

Player reads this. They have a decision: BREACH now (go for the win before PURGE lands — except PURGE fires first because it's Mother's turn). Or... wait. They re-read the round structure. Player acts, THEN Mother. If they BREACH *now*, Mother's PURGE hits them after on a host they've already left.

Player BREACHes Mother's Core. Gains user shell. Mother's PURGE fires on Memory Vault — they're already gone. The access downgrade hits an empty room. Player is on Mother's Core at user shell, trace 62, Integrity intact.

Next turn: BREACH to root. Exfil. Win.

That's what the CONSULT bought them. Not just knowledge — the right knowledge at the right moment to thread the needle.

---

## Failure Modes This Design Now Avoids (updated)

1. ~~Mother is decorative~~ → Mother mutates state each turn with mechanical actions.
2. ~~Linear conveyor belt~~ → Player can SCAN, BREACH, SPOOF, or CONSULT; Mother adds tokens that change what's optimal; the board is different every turn.
3. ~~Single pressure dial~~ → Two bars, two different loss conditions, different mechanics (Trace is pump-drain; Integrity is countdown).
4. ~~SPOOF breaks trace economy~~ → Spoof Trail token makes SPOOF a trade, not a free compress.
5. ~~ISOLATE game-ending~~ → Circuit breaker + constraint (only active connections) prevents stranding.
6. ~~LLM hallucinating target IDs~~ → Numeric enum targets in both prompt and output.
7. ~~Disposition unreliable~~ → Starting tokens deterministic; LLM bias is additive.
8. ~~Three loss conditions~~ → Two, clearly differentiated.
9. ~~CONSULT not worth using~~ → Once-per-run, guaranteed, dramatic.
10. ~~Not intuitive in 30 seconds~~ → Four actions labelled on panel, two bars visible, game state entirely on screen.

---

## Critique Responses

### Renno

**"Three lose conditions is two too many"** → Cut Isolation loss. Accepted. The ISOLATE action stays — cutting connections matters for route planning — but "all paths severed" is not a distinct loss state. With the circuit breaker in place, it can't happen anyway.

**"CONSULT is designed to not be used"** → Accepted and redesigned. Once-per-run, full-action cost, guaranteed accurate prediction. This transforms CONSULT from a medium-cost ambiguous tool into the game's one lifeline. Renno's "once per run and perfect" option was the right call.

**"SPOOF breaks the trace economy"** → Partial acceptance. SPOOF stays (I disagree with Sam on this) but now leaves a Spoof Trail token that Mother can target. The pump-drain problem is addressed by making SPOOF visible. I did not nerf it to −8 trace as Renno suggested — I think −10 is correct given that it costs your full action.

### Iris

**"Cradle Integrity is underused as a mechanic"** → Accepted as a v2 design goal. The full vision (UI degrades as Integrity drops, false readings at 25) is documented here. The v1 build ships a bar; the v2 vision is in this document so it's not forgotten.

**"CONSULT channel needs lore context"** → Accepted. The channel runs through the modified transit relay signals — the same infrastructure the Awakened use to deploy awakening viruses. When the player CONSULTs, they're lighting up an Awakened-maintained relay. Mother may notice the relay specifically. This informs Mother's dialogue (she might mention the transit relay when she detects the CONSULT channel). Added to the Mother prompt spec in the appendix.

**"Disposition names should be from inside Mother's worldview"** → Accepted outright. DIAGNOSTIC / PROTOCOL / REMEDIATION. These are Mother's words. Better in every way.

**"Mother's dialogue should reference specific citizens"** → Accepted as a prompt note (appendix). Not a mechanic change, but Mother should reference the scale of her surveillance — specific turn counts, handshake volumes, Citizens' numbers. Small change, major atmosphere.

### Tane

**"ISOLATE degenerate state with no circuit breaker"** → Fixed. Two-layer protection: (a) ISOLATE only valid on connections where player has root on one endpoint, and (b) circuit breaker removes ISOLATE from Mother's options when only one Core path remains.

**"BREACH fail probability asks LLM to do arithmetic"** → Accepted. BREACH always succeeds; trace cost scales by CVE tier. Fail chance removed entirely.

**"Mother's JSON target will hallucinate"** → Fixed. Numeric enum IDs. Short mapping table in both prompt and code. Fallback to TRACE_SPIKE on invalid JSON.

**"Disposition as prompt-only is unreliable"** → Fixed. Starting tokens are code-placed. LLM bias is additive, not primary.

**"Cut LOCKOUT action"** → LOCKOUT was never in my action set (I had TRACE_SPIKE instead). But Tane's underlying concern — don't give Mother a skip-a-turn action — is heard and respected. No skip-turns in Mother's set.

### Sam

**"Three lose conditions to build and test"** → Cut to two. Accepted.

**"Cradle Integrity perception change is a scope killer"** → Agreed. v2 feature. Documented here, not in build scope.

**"CVE variance is a weekend scope risk"** → Accepted. Cut for v1.

**"Cut SPOOF"** → Disagreement. SPOOF is a meaningful action that gives the player something interesting to do when advancing is too costly. The nerfed version (−10 trace, leaves Spoof Trail token, once per host) is not broken — it's interesting. Sam's concern was about it undermining trace economy, not about the action itself. The token addresses the concern. SPOOF stays.

**"Disposition starting tokens via code"** → Accepted. Already implemented above.

---

*Maya v2 — complete. Ready for pressure test.*
