# 01 — Maya v1 · Lead Designer First Draft

*Voice: Maya, Lead Designer. References: Invisible Inc., Into the Breach, Slay the Spire, Hacknet.*

---

## The Problem I'm Solving

The current prototype has Mother *reacting* to you with words. That's not a game. Into the Breach taught us that the best feeling in strategy is seeing your opponent announce their next move and *still* struggling to counter it. I want Mother to announce her moves. I want players to groan when she cuts the path they were clearly walking, and I want them to tell their friends about the turn Mother Isolated the only route to the Core the exact same turn the Resistance AI had warned them she would.

This redesign is built around one question: **what does it feel like to have Mother as a real opponent?**

---

## Core Loop (one paragraph)

The player is an Awakened operative running a live intrusion against Mother's network. Each turn the player picks an action against a host — scanning, breaching, relaying through a node, or spoofing a false trail. After the player acts, **Mother's LLM selects one mechanical counter-move** from a fixed menu (reinforce a node, cut a connection, spike trace, or hit back through the player's Cradle), states it in character, and the game applies it. The Resistance AI reacts to the whole exchange — reactive every turn, but spendable as a CONSULT action that predicts what Mother is likely to do next. The player is threading through Mother's defences, managing two pressure bars simultaneously, targeting subjects.db at Mother's Core. The win is extraction. The losses are: trace at 100 (Custodians breach), Cradle Integrity at 0 (Mother disconnects you through your own implant), or all paths to the Core severed by Mother's Isolate actions before you get there.

---

## Win / Lose Conditions

**WIN**: EXFIL action succeeds — player has root access on Mother's Core and the decryption key. subjects.db pulled. The Awakened learn what Ascension actually means.

**LOSE — TRACE**: Global trace hits 100. Custodians converge. The Resistance AI burns the channel.

**LOSE — CRADLE**: Cradle Integrity drops to 0. Mother has used the player's own implant as a weapon. Forced disconnect. Everything they built burns behind them.

**LOSE — ISOLATION**: Mother uses ISOLATE to cut every connection path to the Core before the player reaches it. With no remaining pivot routes, the network is a dead end. (Note: this loss is rare and always visible — the player sees connections being severed in real time. It's a slow defeat the player watches coming and can sometimes escape via alternate routes.)

---

## Resources

### Trace (0–100)
The classic. Represents Mother's awareness of the intrusion — how close the Custodians are to a physical location. Every player action generates noise. Some Mother actions spike it directly. Hit 100: game over.

Visible as a bar, with three tiers:
- **0–29 · System Noise**: Mother is barely reacting. Her dialogue is dismissive.
- **30–59 · Acknowledged**: Mother is tracking the intrusion. Her tone shifts. She addresses the player directly.
- **60–99 · Hunting**: Mother has vectored in. Custodians are incoming. Every action feels like it might be the last.

### Cradle Integrity (100→0)
New resource. Represents Mother's ability to reach back through the player's own Cradle implant. The player is Awakened — their Cradle is corrupted, but not gone. When Mother performs a PURGE action on a host the player controls, she deals Cradle Integrity damage alongside demoting access. The player watches their own body become a liability.

Visible as a second bar, orange-amber. At 0: forced disconnect. Can be partially restored by the SPOOF action (you're not healing — you're confusing Mother's signal read on you).

*Why this second resource?* Because with one dial (trace), every turn is the same calculation. Two dials give the player a priority problem: sometimes you must sacrifice trace to protect integrity, or vice versa. Crucially, Mother can target either one, creating genuine strategic tension.

---

## Operator Action Set

Six actions. Five are active moves; one is an intel tool. All visible from turn one. No hidden rules.

| Action | Noise | Effect | Requires |
|--------|-------|--------|----------|
| **SCAN** | +5 trace | Reveals services, CVE summary, and host tier on the selected host. Changes state: visible → scanned. | Visible host |
| **BREACH** | +15 trace (success) / +25 trace (fail) | Attempts intrusion. On scanned host: user shell. On user-shell host: escalates to root. Fail chance based on CVE strength (soft: 10%, medium: 25%, hard: 40%). | Scanned host (user or root attempt) |
| **RELAY** | +5 trace | From a rooted host, sends a passive signal along its connection graph — reveals all directly-connected hidden hosts. | Root access on source host |
| **SPOOF** | 0 trace | Plants a false signal trail. Reduces trace by 15. Restores 5 Cradle Integrity. Costs your action. | Any accessed host |
| **CONSULT** | +5 trace | Queries the Resistance AI for a strategic read on Mother's likely next action. Does NOT cost your action — see AI section below. | Any |
| **EXFIL** | +30 trace | Extracts subjects.db. Game over (win). | Root on Mother's Core + decryption key |

**Design note on BREACH fail:** Failure is not death. It's noise. The player stays on the host, stays scanned, and the operation continues — but trace jumps 25 instead of 15. This keeps the game moving while making high-strength CVEs genuinely scary.

**Design note on CONSULT:** CONSULT adds +5 trace AND draws Mother's attention — her LLM is told the player consulted the Resistance channel. This makes her more likely to target the player's current host on her next move. It's not free. You're lighting up the encrypted channel.

---

## Mother's Action Set and Selection Logic

Mother acts after every player action. Her LLM receives the current board state in a structured prompt and returns a JSON object: `{ "action": "...", "target": "...", "dialogue": "..." }`. The game validates the JSON and applies the mechanical effect. If the JSON is invalid, a fallback fires (TRACE_SPIKE with flavour: "Anomaly logged. Calibrating.").

Mother picks from five mechanical actions:

| Action | Target | Effect |
|--------|--------|--------|
| **REINFORCE** | Any host | Place a Shield token. Player actions on this host cost +15 extra trace until the shield is purged or the player uses SPOOF from that host. Max 1 shield per host. |
| **OVERWATCH** | Any host | Place a Tripwire token. Next time the player acts on this host, trace spikes +20 immediately before the action resolves. Token consumed on trigger. |
| **TRACE_SPIKE** | Global | Add +15 trace directly. No target. Mother detected something real. |
| **ISOLATE** | A connection | Permanently cuts a pivot connection between two hosts. The player can no longer relay or pivot along this path. List of cuttable connections given in prompt. |
| **PURGE** | Accessed host | Downgrades player access on a host they control (root → user shell, user shell → no access). Deals 5 Cradle Integrity damage. Only valid if player has access to that host. |

**Selection logic (in Mother's prompt):**

Mother is given:
- Current turn number
- Trace level and tier
- Which hosts the player has accessed (and at what level)
- Which tokens are already placed
- Whether the player used CONSULT this turn
- Her current "disposition" (one of three biases seeded per run — see Progression)

She is NOT asked to count, add, or calculate. She is asked to *choose* from the above set given the strategic situation. "The intruder has root on the Optimisation Server and the decryption key. They are one pivot and two breaches from the Core. Choose your action." An LLM is excellent at this kind of situational strategic judgment from a finite option set.

**Why Mother is a real opponent now:** Her actions mutate state. A REINFORCE before the player reaches a critical host means they spend more trace getting in — trade-off happens. An ISOLATE cuts off a path they've been building toward — plan changes. A PURGE wakes up a host they thought they owned — they have to re-breach, losing turns. She's not narrating. She's playing.

---

## Resistance AI: Role, Cost, Prompt Sketch

### The reactive voice (every turn, free)
After every player action and Mother's response, the Resistance AI fires automatically — reacting to what just happened. This is the K-2SO voice from the prototype. Pessimistic, specific, occasionally betraying that it cares. This costs nothing. It's the soundtrack of the run.

### CONSULT (spendable intel)
When the player uses CONSULT, the Resistance AI produces a *forward-looking* assessment: what is Mother most likely to do next? Given the board state (Mother's last 2 actions, what the player controls, the trace tier), the AI picks the most probable Mother action and states a probability. "I estimate a 67% chance she Reinforces Memory Vault before you get there. I would not take the optimistic interpretation of that number."

The AI can be *wrong*. It's calculating from partial information. Sometimes it warns about an ISOLATE and Mother does a TRACE_SPIKE instead. This is intentional — the AI's imperfect read makes consulting it interesting rather than just "get the right answer."

**What the AI is never asked to do:** count tokens, track exact trace history, perform arithmetic. It's given the board state in the prompt; it reasons about tendency and situation.

**What CONSULT costs (full cost model):**
- +5 trace (the channel lit up)
- Mother's LLM is told this turn was a CONSULT — she becomes more likely to target the player's current host
- The player did NOT lose their action (CONSULT takes no action turn)

The cost is subtle but real: you're nudging Mother toward you in exchange for a prediction.

### Prompt sketch (detailed in DESIGN-APPENDIX.md)
The AI receives: turn count, trace/integrity bars, current host, Mother's last two actions, remaining path to Core. It reasons from this toward a probability read. It never has to count. It never has to remember what happened five turns ago without being told.

---

## Round Structure

```
1. Player selects action + target
2. Action resolves immediately:
   - State changes apply (host tier, tokens revealed, etc.)
   - Trace/integrity updates
   - Console log entry fires
3. [Parallel] Mother's LLM call fires + Resistance AI reactive call fires
4. Mother's JSON validates → effect applies → Mother dialogue shown
5. Resistance AI dialogue shown
6. Check win/lose conditions
7. Player's next turn
```

Turn is NOT broken into sequential sub-phases for the player. They act, both AIs respond, they act again. Fast rhythm. The player feels momentum.

**On busy states:** While LLM calls are in flight, actions are locked. This is honest — the player waits a beat for Mother and the Resistance AI to respond. The loading state should feel like comms delay, not technical limitation.

---

## Information Model

| | Player sees | Player does NOT see |
|---|---|---|
| Hosts | All visible hosts, their states, all tokens on them | Hidden hosts (until relayed to) |
| Resources | Both bars (trace + integrity) | — |
| Mother | Her dialogue, her completed action | Her upcoming action (hidden until it resolves) |
| Resistance AI | Its dialogue, CONSULT predictions | — |
| Connections | Remaining connections between visible hosts | Connections involving hidden hosts |

**Asymmetry that matters:** The player can see all of Mother's placed tokens. They know where she's fortified. Mother cannot see the player's planned action — she's reacting to completed moves. This creates cat-and-mouse where the player tries to move faster than Mother can react, and Mother tries to lock down paths before the player reaches them.

---

## Failure Modes This Design Avoids

1. **Conveyor belt**: Operator now has real decisions (scan vs breach vs spoof vs consult vs wait) because the network state is actively changing under them.
2. **Single dial**: Two resources mean different turn priorities, different loss conditions.
3. **Decorative LLMs**: Mother mutates game state. Resistance AI gives actionable intel when consulted.
4. **Tutorial confusion**: Six actions, all labelled. Two bars. One selected host. What each action does is described in the UI. Intuitive in 30 seconds because the verbs are self-describing and the hosts are clearly tiered.
5. **Mother as pushover**: She can win. Three different loss conditions mean she has three attack vectors.

---

## Progression and Run Variance

Each run seeds:

1. **Key location**: The decryption key for subjects.db is placed on one of three hosts (Custodian Dispatch, Optimisation Server, or Memory Vault). The player must find it before or during the final push. Randomised per run.

2. **Mother's Disposition**: One of three "character biases" given to Mother in her system prompt at run start:
   - **PATROL** — biases toward OVERWATCH actions, tripwires everywhere
   - **DEFENDER** — biases toward REINFORCE, builds a fortress
   - **HUNTER** — biases toward TRACE_SPIKE and PURGE, comes for the player directly
   
   The player discovers this disposition organically through Mother's first three actions. The Resistance AI will name it on a CONSULT after turn 3: "She's hunting. Not defending. Adjust accordingly."

3. **CVE strength variance**: Each run, one host's CVE is upgraded or downgraded (e.g., Memory Vault might be soft this run, or Custodian Dispatch might be hard). This changes the optimal breach path.

Three seeded variables. Modest surface area. Multiple run identities.

---

## The Tell-Your-Friends Moment

Turn 7. Player has root on Custodian Dispatch and Optimisation Server. They have the key. They're one BREACH away from Memory Vault and a clear path to the Core. They decide to CONSULT before the big push.

Resistance AI: "She's been quiet. Three turns of REINFORCE. She's not hunting you — she's building a wall somewhere you haven't looked yet. I estimate a 71% chance her next action is ISOLATE on memory_vault→mother_core. I'm not saying don't go. I'm saying go now."

Player goes. Player BREACHes Memory Vault. Mother's action resolves: **ISOLATE — memory_vault → mother_core**. The connection blinks out in the UI.

Except the player is already on Memory Vault with root access. The connection to Core is severed *behind them*, cutting off retreat. They're committed. They're one BREACH away from the Core with 71 trace and no way out except forward or burned.

They breach. They exfil. They win.

That's the story they tell.

---

## Design Confidence Notes

- This is a rethink, not a polish. The five-host network is preserved because it works — three network zones creates natural pacing. The five actions are rethought.
- The BREACH fail mechanic (noise instead of restart) is borrowed from Invisible Inc.'s philosophy: failure is setback, not rewind.
- Mother's disposition bias is influenced by Slay the Spire's boss mechanic variants — the same opponent with a different stress axis.
- The CONSULT-invites-attention mechanic is inspired by Cultist Simulator's "talking costs something" economy. Information is never free in this world.

---

*Maya v1 — complete. Ready for critique pass.*
