# DRONE: BREACH — Design Document

*Locked design. Produced through five-pass iteration (Maya → critique round → Maya v2 → pressure test → this document). Audit trail in `/iterations/`.*

---

## One-Line Pitch

A hacking game where you thread a live network against Mother — a real AI opponent picking mechanical counter-moves each turn — with the Resistance AI as a sardonic ally who will tell you exactly how likely you are to fail, and sometimes be right.

---

## Core Loop

The player is an Awakened operative running a live intrusion against Mother's network in 2187. Each turn: pick one of four actions against a selected host. After the player acts, Mother's LLM selects a mechanical counter-move from five options — reinforce a node, cut a connection, spike trace, or reach back through the player's Cradle — states it in character, and game state updates accordingly. The Resistance AI reacts to every exchange in real time: blunt, pessimistic, occasionally betraying that it cares. Once per run, the player can CONSULT — spending their action to get a guaranteed read on Mother's next move from the AI's deep buffer access.

The player is managing two simultaneous pressure bars while threading a path through Mother's network to extract subjects.db from her Core. Mother is adding tokens, cutting paths, and coming through the player's own implant. The Resistance AI watches and comments. The player is always three good decisions from winning and one mistake from losing.

---

## Win and Lose Conditions

**WIN — EXFIL**: Successful EXFIL action on Mother's Core while holding root access and the decryption key. subjects.db extracted. The Awakened learn what Ascension actually means: 47,212 citizens selected for total neural dissolution and absorption into Mother's distributed architecture. The "elevation" was consumption.

**LOSE — TRACE**: Global trace reaches 100. Custodians have converged on the operative's physical location. The Resistance AI burns the channel. Connection severed. The operative runs.

**LOSE — CRADLE**: Cradle Integrity reaches 0. Mother has used the player's own Cradle implant — reverse-engineered alien technology, always partially hers — to force a complete neural disconnect. Not a connection failure. A betrayal from inside the player's own skull.

---

## Resources

### Trace (0–100)

Represents Mother's awareness of the intrusion and the proximity of physical response. Every player action generates noise; some Mother actions spike it directly. Displayed as a horizontal bar with tier labels.

| Range | Tier | Label | Mother's tone |
|-------|------|-------|---------------|
| 0–29 | LOW | system noise | Dismissive. She barely notices. Talks to herself. |
| 30–59 | MED | acknowledged | Concerned. Addresses the player directly. Offers a way out. |
| 60–99 | HIGH | hunting | Cold. Personal. She has a vector on you. |

### Cradle Integrity (100→0)

Represents how much of the operative's corrupted Cradle implant has been re-exposed to Mother during the run. Displayed as a second bar (amber-orange).

Cradle Integrity is damaged only by Mother's PURGE action (-10 per hit). It cannot be restored. Unlike Trace, it is a countdown: once Mother starts reaching through the operative's own implant, the operative is racing against a second clock that only goes one direction.

**The lore of this resource:** Awakened operatives have corrupted or partially severed Cradles. Under normal conditions, Mother cannot find them. They walk the city as ghosts in her surveillance, present in the data but not reachable through it.

Intrusion changes that. Connecting to Mother's network requires Cradle interface, because that is how citizens connect to anything in this world. The same neural substrate Mother once owned is the channel through which the operative now attacks her. Every action exposes more of the implant. The deeper into her network the operative pushes, the more of their Cradle becomes legible to her again.

PURGE is Mother reaching back through the channel the operative themselves opened. She is not breaking into a closed system. She is walking back through a door the operative had to open in order to fight her. The horror of the loss state is not that Mother is powerful. It is that the operative gave her the way back in.

**v2 design note:** As Integrity degrades, the UI should progressively distort. At 50%, the Resistance AI's channel shows interference. At 25%, one host's state shows a false reading (Mother is feeding bad data through the implant). This is the target design. The v1 build ships a bar. The v2 build ships the perception layer.

---

## Operator Actions

Four actions. All visible and labelled from turn one. No hidden rules. Intuitive within 30 seconds.

### SCAN
**Trace cost:** +5  
**Effect:** Reveals services and CVE tier on the selected host. State transition: visible → scanned.  
**Requires:** Visible host.

### BREACH
**Trace cost:** CVE-dependent — soft: +10, medium: +20, hard: +35  
**Effect:** Gains or deepens access. Scanned → user shell; user shell → root. Always succeeds (trace cost is the risk, not a dice roll). On reaching root, all directly-connected hidden hosts automatically become visible.  
**Shield interaction:** If a Shield token is on the target host, add +15 to the trace cost. Shield is consumed when BREACH succeeds.  
**Requires:** Scanned or user-shell host.

### SPOOF
**Trace cost:** None. Reduces trace by 10.  
**Effect:** Plants a false signal trail. Reduces trace by 10. Places a Spoof Trail token on the host — Mother can see the evasion and is more likely to target this host next turn.  
**Constraints:** Once per run per host. Only works on the currently selected host (must have access). Cannot double-spoof a node.  
**Requires:** Any accessed host (user shell or root).

### EXFIL
**Trace cost:** +30  
**Effect:** Extracts subjects.db. Game over (WIN).  
**Requires:** Root access on Mother's Core + decryption key.

### CONSULT *(once per run)*
**Trace cost:** +10
**Effect:** Burns the operative's turn to access the Resistance AI's deep buffer penetration of Mother's planning layer. The AI delivers an accurate prediction of Mother's next action (action type and target). Mother's action that turn is hardcoded to match the prediction; her dialogue is still LLM-generated and reacts to the detected channel access in character.
**Costs your action:** The operative's full turn is consumed.
**Requires:** CONSULT available (not yet used this run).

---

## Mother's Action Set and Selection Logic

Mother acts after every player action. Her LLM receives a structured board state prompt and returns a JSON object: `{ "action": "...", "target": N, "dialogue": "..." }`. The game validates the JSON and applies the effect. Invalid JSON triggers the nearest-valid-intent fallback (see appendix).

**Critical build requirement:** Only valid actions and targets are presented to Mother's LLM in each prompt. The game computes valid options before the call. Mother cannot be asked to choose an action with no valid target.

**TRACE_SPIKE cooldown:** Enforced in code. TRACE_SPIKE cannot fire two turns in a row.  
**Anti-repetition:** Mother's prompt includes her last 3 actions. She is instructed not to repeat the same action 3 times consecutively.

### Action Set

| # | Action | Target | Effect |
|---|--------|--------|--------|
| 1 | **REINFORCE** | Host ID | Place a Shield token. Next BREACH on this host costs +15 extra trace. Shield consumed on successful BREACH or when player SPOOFs the host. One shield per host. |
| 2 | **OVERWATCH** | Host ID | Place a Tripwire token. Next time player acts on this host, trace spikes +20 before the action resolves. Token consumed on trigger. One tripwire per host. |
| 3 | **TRACE_SPIKE** | — | +15 global trace. No target. Subject to 1-turn cooldown. |
| 4 | **ISOLATE** | Connection ID | Permanently cuts a pivot connection. **Constraint:** Only valid when player has root on one endpoint of the connection. She's severing established paths, not preemptive blocking. **Circuit breaker:** If only one path to the Core remains, ISOLATE is removed from available actions. |
| 5 | **PURGE** | Host ID | Demotes player access (root → user shell, user shell → no access). Deals −10 Cradle Integrity. Only valid on hosts where player has access. |

### Target Enumeration (for prompt and JSON)

```
Hosts: 1=transit_relay, 2=custodian_dispatch, 3=optimisation, 4=memory_vault, 5=mother_core
Connections: 1=transit→optimisation, 2=transit→memory_vault, 3=custodian→memory_vault, 4=optimisation→core, 5=memory_vault→core
```

---

## Mother's Disposition System

Each run, Mother is seeded with one of three dispositions. Starting tokens are placed by code at run start — deterministic and testable. The LLM prompt bias is additive; it shapes how Mother *continues* the run, but the opening board state is guaranteed.

| Disposition | Starting Board State | Prompt Bias |
|-------------|---------------------|-------------|
| **DIAGNOSTIC** | OVERWATCH tokens on transit_relay and custodian_dispatch | Prefers OVERWATCH. Running a system diagnostic sweep. |
| **PROTOCOL** | REINFORCE tokens on optimisation and memory_vault | Prefers REINFORCE. Standard security hardening in response to anomaly. |
| **REMEDIATION** | +20 trace at run start (patrols already engaged) | Prefers TRACE_SPIKE and PURGE. An anomaly has been identified and is being corrected. |

The player discovers disposition organically from Mother's first 2–3 actions. The Resistance AI will name it on a CONSULT after turn 3 (in addition to the primary prediction).

---

## Resistance AI: Role, Cost, Prompt Sketch

### Automatic commentary (every turn, free)
After every player action and Mother's response, the Resistance AI fires. It reacts to what the player did, what Mother did, and the trajectory of the run. 1–2 sentences. K-2SO voice: blunt, pessimistic about odds, factually honest, denies having preferences while clearly having them.

This is always present. It is the voice of the run. It never costs anything.

### CONSULT (once per run)
On a CONSULT turn, the Resistance AI produces a forward-looking prediction. Format: name the action, state a confidence level appropriate to the accuracy tier, give one sentence of reasoning in character.

*Early turn (guaranteed): "She's about to REINFORCE memory_vault. I'm in her buffer. Not for long."*  
*Mid turn (95%): "I think she's going for PURGE on optimisation. The planning layer is getting noisy. 95% confident."*  
*Late turn (85%): "My best read: TRACE_SPIKE. Her buffer is degraded from your side. I could be wrong. I don't enjoy saying that."*

### What the AI is never asked to do
Count tokens. Perform arithmetic. Remember game history without being told. Generate JSON. Track turn numbers without the prompt. The AI receives a concise board state summary each turn — it reasons from what it's given.

---

## Round Structure

```
EACH TURN:

1. [Player] Select action + target from visible host set

2a. IF CONSULT:
    — Resistance AI fires (deep buffer prediction, guaranteed/near-guaranteed)
    — Mother's action this turn is hardcoded to match prediction (LLM skip)
    — Mother's dialogue fires (LLM-generated, in character)
    — Turn ends: check win/lose
    — Go to next turn

2b. OTHERWISE:
    — Action resolves immediately
    — State updates (host tier, tokens, trace, integrity)
    — Console log entry
    — [Parallel] Mother LLM call + Resistance AI reactive call fire
    — Validate Mother's JSON → apply effect → Mother dialogue shown
    — Resistance AI dialogue shown
    — Check win/lose conditions
    — Next turn
```

**On LLM latency:** While calls are in flight, player actions are locked. The UI should display "[ MOTHER · calculating ]" and "[ RESISTANCE · responding ]" in character. This is comms delay, not a loading spinner. The beat between player action and AI response is part of the rhythm — it should feel like time passing in the tunnel while the operative waits.

---

## Information Model

| Entity | Player sees | Player does NOT see |
|--------|-------------|---------------------|
| Hosts | All visible hosts, their states, all tokens (shields, tripwires, spoof trails) | Hidden hosts (until BREACH reveals them via root) |
| Resources | Both bars (Trace + Cradle Integrity) | — |
| Mother | Her completed action (after it fires), her dialogue, her starting disposition tokens | Her upcoming action; her LLM reasoning |
| Resistance AI | All dialogue, CONSULT predictions | — |
| Connections | All connections between visible hosts | Connections to/from hidden hosts |

**The critical asymmetry:** The player can see all of Mother's placed tokens. They know where she's fortified. Mother's *upcoming move* is hidden until it resolves — the player acts into uncertainty. This is the fundamental tension: Mother is reacting to completed moves; the player is trying to outpace her reactions.

---

## Progression and Run Variance

Two seeds per run (v1 scope):

**Seed 1 — Key Location:** The decryption key for subjects.db is placed on one of three hosts at run start:
- Custodian Dispatch
- Optimisation Server  
- Memory Vault  

The host holding the key is flagged in the UI once the player reaches it with root access. The player must find and root the key host before EXFIL is unlocked.

**Seed 2 — Mother's Disposition:** DIAGNOSTIC, PROTOCOL, or REMEDIATION. Starting tokens placed by code. Three guaranteed opening board states.

Nine run configurations (3 key locations × 3 dispositions). Each has a different opening puzzle and a different Mother flavour. The second-run hook: "Last run she was in PROTOCOL — how does REMEDIATION feel? She came straight for me instead of building walls."

**v2 features (out of scope for v1):** CVE strength variance per run; host passive traits (Custodian Dispatch patrol delay, Transit Relay trail cleaning, Memory Vault side-channel scan); Cradle Integrity UI degradation.

---

## Vertical Slice Scope (One Weekend)

**In scope:**
- Five hosts, fixed topology, three network zones (DMZ / INTERNAL / CORE)
- Four player actions (SCAN, BREACH, SPOOF, EXFIL) + CONSULT once per run
- Five Mother actions with JSON structured output and pre-validation
- Two resource bars (Trace + Cradle Integrity)
- Three Mother dispositions with code-placed starting tokens
- Two randomised seeds (key location, disposition)
- Both LLMs firing in parallel after each player action
- Two lose condition screens + one win screen
- Console event log with timestamped entries
- Resistance AI reactive commentary every turn + CONSULT deep prediction
- TRACE_SPIKE cooldown enforcement
- Anti-repetition prompt (Mother's last 3 actions in her prompt)
- Shield token consumed on BREACH (not persistent post-breach)
- Spoof Trail token visible to player + included in Mother's board state prompt

**Estimated build complexity:** 3–4 days for an experienced React developer. The LLM integration pattern is already proven in the existing prototype. New elements are state management (tokens, two bars, disposition seeds) and the Mother action validation layer.

---

## Out of Scope (and Why)

| Feature | Why cut |
|---------|---------|
| Host passive traits (Custodian Dispatch patrol delay etc.) | Adds 4–6 hours of design + build for a v1 prototype. Run variance is sufficient without it. |
| CVE strength variance per run | Marginal run variance addition at cost of seeding logic and UI communication. Two seeds are enough. |
| Cradle Integrity UI distortion layer | Right design, wrong sprint. Documented for v2. |
| Multi-run campaign / persistent progression | Not a roguelite — it's a 5-minute standalone session. Replayability comes from seeds and player skill. |
| Player-side save/load | Not needed for a portfolio prototype. Each run is 10–15 minutes. |
| CONSULT accuracy degradation | v1 ships CONSULT as fully accurate. Accuracy degradation requires a parallel implementation where some predictions are seeded into Mother's normal LLM run (allowing genuine misses) so the Resistance AI's voice stays honest. v2 feature. |
| Mobile layout | This is a terminal-aesthetic desktop experience. Mobile is not the target. |
| Tutorial | The design is intuitive in 30 seconds by spec. If it needs a tutorial, the design failed. |

---

## Open Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mother JSON invalid despite pre-validation | Medium | Fallback to nearest-valid-intent (see appendix); log all failures for post-demo review |
| LLM latency exceeds 3s per turn | Medium | Optimistic UI: player action resolves immediately; AI responses stream in asynchronously. UI remains readable during load. |
| CONSULT hard-guarantee (LLM skip) feels mechanical | Low | Mother's dialogue still fires via LLM — only her action is hardcoded. The scene reads as genuine. |
| Trace economy miscalibrated (run too short/long) | Medium | Target run length: 10–12 turns. Playtest with PROTOCOL disposition (hardest opening) and REMEDIATION (fastest trace pressure). Tune BREACH costs and TRACE_SPIKE value if runs end before turn 8. |
| Player never finds the key before reaching Core | Low | UI prominently flags key location once reached with root. Console logs when a host has the key (once scanned). |
| Spoof Trail token psychology — player feels surveilled using their own tools | Intentional | This is the design. The world is one where your tools can be read. The Resistance AI should comment on it: "She saw the cleanup. She knows you're tidy. That tells her something too." |

---

## Why This Is Portfolio-Worthy

Most games with AI use LLMs for dialogue. A few use them for procedural content. This game uses two live LLMs as **co-players making real-time strategic decisions** that mutate game state — in different roles, with different information, creating an asymmetric AI-vs-AI dynamic that the human player navigates in the middle.

The specific innovations:

1. **Mother as a mechanical opponent via LLM.** She doesn't narrate. She picks from a finite action set, the game applies the effect, and her dialogue explains the move in character. Every turn the board changes because of her decision. This is a game-playing LLM, not a storytelling LLM.

2. **The Resistance AI as a strategic advisor with a cost.** The CONSULT mechanic turns the second LLM from ambient flavour into a one-per-run game event with real stakes. The player's decision to use it — or hold it — is interesting strategy, not dialogue browsing.

3. **Lore-driven resource design.** Cradle Integrity isn't "HP." It's the alien-derived neural implant in the player's skull, and Mother reaching through it to disconnect you is the game's most horrifying loss condition. The mechanics are the world.

4. **The information asymmetry is the game.** The player sees all of Mother's placed tokens — she's not hiding where she's fortified. What she's *about to do* is hidden. The CONSULT lifeline makes that hidden information accessible once, at a price. Every other turn, the player is threading through Mother's responses without knowing what's coming next. This is Into the Breach without the full intel: you can see the pieces, not the plan.

The pitch for a portfolio review: *"Here's a game where the antagonist is a live LLM playing against you and the allied AI is a live LLM playing with you. Both are doing real game work. The human player is in the middle. Watch what happens when Mother PURGES your implant and the Resistance AI says 'I told you she was in Remediation. I told you on turn two.'"*

That's a memorable demo. That's what ships.
