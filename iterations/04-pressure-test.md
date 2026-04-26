# 04 — Pressure Test · Renno + Tane Joint

*Renno and Tane attempt to break v2. They do not coordinate on topics ahead of writing — they bring their different attack vectors and compare notes at the end.*

---

## Preamble

The v2 design is substantially better than v1. The ISOLATE circuit breaker, the BREACH-always-succeeds move, the numeric enum targets, the CONSULT redesign — these are all correct. We're not going to relitigate those wins. We're here to find what v2 didn't fix and what new problems v2 introduced.

---

## Dominant Strategies

### DS-1: "The Custodian Dispatch Bypass"

**The strategy:** SCAN custodian_dispatch immediately on turn 1. BREACH it. Root it on turn 3. Its connections (per the prototype) include memory_vault. Now BREACH memory_vault through this path. The Custodian Dispatch host, in the original world lore, is described as reducing Custodian response — but the v2 design doesn't give it a special mechanical property. It's just another host with a connection.

**The problem this creates:** Custodian Dispatch is functionally identical to every other DMZ host. If there's no mechanical distinction between hosts beyond their CVE tier and connections, the "optimal route" is just whichever path has the softest CVEs. Players will find this in run one and never deviate.

**The fix:** Give each non-Core host a *passive trait* that activates when the player holds root on it. Custodian Dispatch: holding root reduces trace cost of all actions by 3 (Custodians are confused by schedule injection). Transit Relay: holding root means Spoof Trail tokens are consumed before Mother can see them (the relay cleans your trail). Memory Vault: holding root gives the player a one-time peek at one hidden host's CVE tier (the memory protocol has a side-channel). These aren't large mechanical additions — they're bonuses that make route choice a real strategic question rather than "shortest path to key."

**Accepted as a design gap.** Not a fatal flaw in v2 — the game works without host traits — but this is the difference between runs that feel samey and runs that feel like choices.

---

### DS-2: "SPOOF Cadence Abuse"

**The strategy:** Player reaches root on Transit Relay turn 3. Trace is at 35. Player SPOOFs Transit Relay (−10 trace, Spoof Trail placed). Trace is now 25. Player BREACHes Optimisation Server (soft CVE: +10 trace). Trace is 35. Player SPOOFs a different host — wait, they're not on that host. SPOOF requires "any accessed host" — meaning the player must be *selecting* an accessed host to SPOOF it.

**Actually, is this a problem?** Let me re-read the action spec. "Any accessed host" — does that mean the currently selected host, or any host the player has root on? If it's any accessed host regardless of current selection, the player can SPOOF any of their controlled hosts each turn, making the −10 apply freely across their whole network as they accumulate owned hosts. With 3 rooted hosts, the player can SPOOF 3 different nodes before the Spoof Trail tokens accumulate on any single host.

**The genuine problem:** Once the player owns 3 hosts (Transit Relay, Custodian Dispatch, Optimisation), they can alternate SPOOF calls across those three hosts on a two-turn cycle (SPOOF node A on turn 4, act on turn 5, SPOOF node B on turn 6, act on turn 7, SPOOF node C on turn 8, etc.) since SPOOF is once-per-host and hosts accumulate. The trail tokens pile up but the player has already left those nodes — Mother keeps ReinForcing and OWatching the abandoned nodes while the player pushes toward Core.

**The fix:** SPOOF is once per host *per run*, not once per host *and then resets*. If you SPOOF transit_relay, you can never SPOOF transit_relay again. Additionally, SPOOF should only work on the *currently selected host* (not any accessed host) — this prevents cross-network SPOOF management and forces the player to be present where they're cleaning up.

**Accepted as a genuine abuse vector.** The "once per run per host" constraint is clean and addressable in one line of code.

---

### DS-3: "CONSULT Hoarding — The Perfect Run Gamble"

**The strategy:** Don't CONSULT until the final push. Save the guaranteed read for the moment you're breaching Mother's Core. "I'll just CONSULT right before EXFIL to make sure she doesn't PURGE me off the Core." This is correct play, but it reduces CONSULT to a safety check rather than a strategic tool used under uncertainty.

**Is this a problem?** Maybe not. A player who identifies the optimal CONSULT window and holds it for the final push is making a real skill expression. The game rewards strategic patience. But there's a second consequence: if the optimal CONSULT window is always "right before EXFIL," then CONSULT stops being interesting and becomes a mandatory pre-win ritual. The drama disappears.

**The fix (tentative):** Introduce *uncertainty about whether CONSULT will work*. Not about the accuracy of the prediction — that's guaranteed. But about *whether the channel is still open*. Each turn, there's a small random chance the channel is closed by Mother's interference. At high trace tiers, this probability increases. Now the player faces a real gamble: use CONSULT early when the channel is definitely open, or hold it for the critical moment knowing it might be closed.

**Disagreement between Renno and Tane on this fix:**

- *Renno*: Don't add RNG to a strategic tool. Players will feel cheated when the CONSULT window closes at trace 72 right before they need it. The hoarding-as-correct-play problem is real but the cure is worse than the disease. If CONSULT hoarding is boring, fix it by making earlier CONSULT windows more valuable (i.e., improve the other parts of the game so that earlier information is more leverageable), not by adding arbitrary closure.

- *Tane*: Agree with Renno on the RNG fix — too punishing. Alternate approach: CONSULT becomes *less accurate* as the run progresses. Turn 1–4: 100% accurate. Turn 5–8: 85% accurate (AI says "I think" instead of "I'm certain"). Turn 9+: 70% accurate. Now early CONSULT is more valuable than late CONSULT. Players who use it at the right moment get perfect information; players who hoard get probabilistic information. The degradation mirrors lore: Mother gets better at securing her planning layer as she suspects intrusion.

**Tane's fix is accepted as the better solution.** Accuracy degradation over turns is both mechanically interesting and lore-coherent. Implement with three accuracy tiers (exact match guaranteed, likely match, coin-flip match). The AI dialogue signals which tier it's in.

---

## Degenerate States

### DG-1: "The 99 Trap — Stuck One Action From Win"

**State:** Player has root on Mother's Core, has the key, trace is 95. EXFIL costs +30 trace. Pressing EXFIL triggers loss via trace. The player has no SPOOF available (all accessed nodes already spoofed). No CONSULT left. Every action from here adds trace. The player is mathematically locked out with no moves.

**Is this possible?** Yes. With 4 accessed nodes, each SPOOF'd once, and EXFIL costing 30, any trace value above 70 means EXFIL = loss. Getting to Mother's Core with trace above 70 is achievable by a player making suboptimal early decisions.

**Is this fun?** No. Watching the game be over two turns before it actually ends is demoralising rather than tense. The player knows they've lost but the UI makes them take the final EXFIL action to confirm it.

**Fix:** EXFIL, when it triggers loss, should produce a different end screen than the Trace Lockout screen. The player *almost made it* — they had everything except enough quiet. The Resistance AI should have specific dialogue for this state: "You're 30 trace from the win. I know. Custodians are 30 trace away. I know that too." 

Additionally, a mechanical relief valve: if the player has root on Custodian Dispatch (the host canonically associated with patrol scheduling), they get a one-time option to "delay custodian dispatch" — spend their action on Custodian Dispatch to push the effective trace threshold for EXFIL up by 20 (treat EXFIL as safe up to trace 120 for this one run). This is the host trait from DS-1's fix applied here.

**Accepted.** Both the narrative fix (distinct end screen) and the mechanical fix (Custodian Dispatch trait) address the problem. The trait fix is preferred because it gives the player agency.

---

### DG-2: "Mother Loops on REINFORCE — Fully Fortified Static Board"

**State:** Mother's PROTOCOL disposition means she starts with REINFORCE tokens on optimisation and memory_vault. Her LLM bias continues to prefer REINFORCE. Over turns 4–8, she ReinForces custodian_dispatch and mother_core. Every host that matters now has a Shield token. Every BREACH costs an extra 15 trace. The effective BREACH cost for a hard host is 35+15=50 trace. With a starting trace of 20 (PROTOCOL disposition) or even 0, three hard BREACHes cost 150 trace. That's loss on trace before the player reaches the Core.

**Is this a design flaw or correct behaviour?** If Mother keeps ReinForcing and the player doesn't have a way to remove shields, this is a death spiral. SPOOF removes shields — "SPOOF on that host removes it" per Maya's spec. So the counter is: BREACH a host, immediately SPOOF it to remove the shield before Mother can layer another. But SPOFing the host you just BREACHed means you've used both your action (BREACH) and your Spoof for that host — effectively spending two turns per host.

**The genuine problem:** In a fully-REINFORCEd board, BREACH + SPOOF as a pair means every host costs two turns to clear: one BREACH turn and one SPOOF turn to remove the shield. With 4 hosts between the player and victory, that's 8 turns minimum plus any Mother interference. With trace starting at 20 (PROTOCOL), gaining 20+10 per two-turn pair = 40 per host pair, four hosts = 160 trace. That's a guaranteed loss.

**Fix:** SPOOF removes the Shield token AND reduces trace by 10, in the same action. This is already in the spec. But it also needs to be clarified: *BREACH removes a Shield token upon succeeding* — the act of breaking in burns through the hardening. A Shield doesn't prevent the breach; it makes it noisier. After a successful BREACH, the Shield is consumed. SPOOF then becomes irrelevant to shield management (you don't need to SPOOF to remove shields post-BREACH) and returns to its primary role as a trace-reduction tool.

**Revised shield mechanic:** Shield token means +15 trace on the BREACH action against that host. Shield is consumed when the BREACH succeeds. Player pays the extra trace, but the shield doesn't persist. SPOOF's role on a shielded host: -10 trace and remove the Shield token *before* the BREACH, spending your SPOOF to pre-clear the host at lower cost than paying the 15 trace.

This makes SPOOF more interesting: "Do I SPOOF this shielded host first (cheaper BREACH but costs my SPOOF) or BREACH through the shield (noisier but saves the SPOOF for later)?" Real decisions.

**Accepted. Critical fix.** The current spec is ambiguous about shield persistence. This must be resolved before build.

---

### DG-3: "High Integrity / High Trace Stalemate"

**State:** Player is mid-network, trace 58, Integrity 75. A DIAGNOSTIC disposition Mother has placed OVERWATCH tokens on every host the player hasn't reached yet (3 hosts). Any advance triggers +20 trace burst from the tripwire. Player cannot advance without hitting 78+ trace. But player can't SPOOF (the OVERWATCHed hosts aren't accessed). Player can't CONSULT (used it turn 3). Every action adds trace and the tripwires are on unaccessed hosts, which SPOOF can't reach.

**Is this a stalemate?** Yes. There is a board state where the player has no beneficial moves. They're past the middle of the game with Integrity intact but trace too high to survive the tripwires, and all the tools for trace management (SPOOF) require access to the tripwired hosts.

**Fix:** Two options:
1. Tripwires (OVERWATCH) are consumed on trigger even if they push the player into loss — you don't die silently, you die doing something.
2. OVERWATCH tokens should not be placeable on the same host twice, and a new OVERWATCH can't be placed if one already exists. This limits how many tripwires Mother can layer simultaneously. Given 5 hosts and one OVERWATCH per host max, the board can have at most 5 tripwires — but Mother only acts once per turn and the player is advancing, so the tripwire-on-every-path scenario requires Mother to have exclusively spammed OVERWATCH for 4+ turns.

The real fix is design: Mother's DIAGNOSTIC disposition should bias toward OVERWATCH, not exclusively choose it. "Prefer" is different from "always." The LLM prompt bias should be a leaning, and the diversity of Mother's actions should be enforced by including action history in her prompt so she doesn't repeat herself more than twice in a row. 

**Fix accepted:** Add action history (Mother's last 3 actions) to her prompt. "You have used OVERWATCH on turns 4, 5, and 6. Consider whether another approach is warranted." This is a prompt engineering note for the appendix.

---

## LLM Failure Modes

### LF-1: "Mother Picks an Action Against a Non-Applicable Target"

**Scenario:** Mother's LLM returns `{ "action": "PURGE", "target": 3 }` (optimisation_server) on a turn when the player has no access to optimisation_server. The action is invalid. The fallback fires: TRACE_SPIKE.

**Problem with the fallback:** TRACE_SPIKE is Mother's most boring action. A game where invalid JSON causes the most boring possible outcome will, over many runs, feel like Mother frequently just spikes trace for no reason. Players will notice the LLM is doing nothing interesting approximately 20% of the time.

**Better fallback:** Parse what Mother was *trying* to do and apply the closest valid version. If PURGE is invalid (no player access), apply REINFORCE to the most advanced host in the player's network instead. If ISOLATE is invalid (player doesn't have root on an endpoint), apply OVERWATCH to the nearest reachable host. The fallback should be intentional, not default.

**Alternative:** Validate Mother's available options *before* the LLM call. Give Mother only the valid actions for the current board state in her prompt. If PURGE has no valid targets, remove PURGE from her available actions list in that prompt. She can't pick what she can't see. This is cleaner than post-hoc fallback logic.

**Accepted: pre-validation is better.** Only include valid actions/targets in Mother's prompt per turn. This requires the board state parser to compute valid options before the LLM call. Small build cost, large reliability win.

---

### LF-2: "The Resistance AI Gives a CONSULT Prediction That Doesn't Match Mother's Actual Next Move"

**Scenario:** The v2 design says CONSULT is "guaranteed accurate" by coordinating the two LLM calls — the CONSULT prediction and Mother's seeded action are intended to match. But this relies on prompt engineering, not hard constraint. If the prompts drift, or if Mother's LLM ignores the seeded preference (LLMs are not perfectly controllable), the prediction can be wrong.

**When this fails:** The player uses their once-per-run CONSULT, gets told "PURGE on memory_vault," plays accordingly — and Mother does REINFORCE on transit_relay instead. The CONSULT is now a broken promise. This is worse than the prediction being probabilistic, because the game explicitly told the player it was guaranteed.

**Fix options:**
1. Don't make CONSULT "guaranteed." Make it "95% accurate." The Resistance AI says "I'm in her buffer" — but LLMs can't guarantee this, and pretending they can sets up a player experience breaking moment. Change the language to "I'm almost certain" and accept that very occasionally the prediction is wrong. This is honest and lore-coherent (the AI is fighting Mother in a live system — perfect information isn't realistic).

2. Guarantee accuracy by bypassing Mother's LLM on CONSULT turns. When CONSULT is used: the CONSULT prediction fires (LLM generates it based on board state), then Mother's action is hardcoded to whatever the CONSULT predicted (the LLM call is skipped that turn). Mother's dialogue is still LLM-generated ("What did you just access?"), but her *action* is the one the CONSULT predicted. This guarantees the match at the cost of Mother not reasoning freely that turn.

**Tane's preference:** Option 2, hard-guaranteed with LLM skip on CONSULT turn. The trade is worth it — the CONSULT moment is too important to risk an LLM disagreement ruining it.

**Renno's preference:** Option 1, honest almost-certain. "The game said 95% accurate and it was wrong 5% of the time" is more honest than "the game was rigged to guarantee it." But 5% is tolerable — if the AI was wrong, the player still got useful information and can re-assess.

**Resolution:** Use Option 2 in v1 (simpler to implement, guaranteed result for the demo). Document Option 1 as the v2 approach when confidence is better. The design doc should explicitly state which is in scope.

---

### LF-3: "Mother Repeats Herself — Same Action Five Turns in a Row"

**Scenario:** Mother's REMEDIATION disposition biases her toward TRACE_SPIKE and PURGE. Her LLM, given a high-trace situation with limited player access, keeps returning TRACE_SPIKE because it's always valid and the situation always looks like "trace is high, spike more." Five consecutive TRACE_SPIKEs is 75 trace added in five turns. It's also deadly boring — the game feels like a timer ticking down rather than an opponent reacting to you.

**Why this happens:** LLMs default to the locally optimal response. Given a prompt that says "prefer TRACE_SPIKE and PURGE" and a board state where PURGE has no valid targets (player hasn't accessed anything yet), TRACE_SPIKE is the only valid action in the bias. Without diversity pressure, it repeats.

**Fix:** Mother's prompt includes her last 3 actions explicitly. The prompt instructs her: "Do not repeat the same action three turns in a row unless no other valid action exists." This is a simple diversity constraint that the LLM can follow reliably — it's pattern-matching on recent history, which LLMs handle well.

**Additional fix:** TRACE_SPIKE should have a cooldown enforced in code. After a TRACE_SPIKE, remove it from Mother's available actions for 1 turn. This is a hard constraint, not a soft instruction. The player will never see two consecutive TRACE_SPIKEs. Maximum TRACE_SPIKE frequency: every other turn.

**Both fixes accepted.** Prompt diversity constraint plus code-enforced cooldown on TRACE_SPIKE. Belt and suspenders.

---

## Summary: What's a Risk vs. What's a Fix

| Issue | Status | Resolution |
|-------|--------|------------|
| DS-1: Custodian Dispatch identical to other hosts | Open risk, v2 feature | Add host passive traits (start with Custodian Dispatch trait as MVP) |
| DS-2: SPOOF cadence abuse | **Fix required** | SPOOF is once per run per host; SPOOF only works on currently selected host |
| DS-3: CONSULT hoarding | Open risk, acceptable | Add accuracy degradation over turns (Tane's fix) |
| DG-1: 99 Trap pre-EXFIL | **Fix required** | Custodian Dispatch host trait + distinct end screen for "almost won" state |
| DG-2: Mother REINFORCE loop | **Fix required** | Shield consumed on successful BREACH; SPOOF pre-clears shield at lower trace cost |
| DG-3: OVERWATCH stalemate | **Fix required** | Add last-3-action history to Mother's prompt; she cannot repeat same action 3× in a row |
| LF-1: Invalid target fallback | **Fix required** | Pre-validate available actions before LLM call; give Mother only valid options |
| LF-2: CONSULT prediction drift | **Fix required** (v1) | Hard-guarantee via LLM skip on CONSULT turn for v1; honest probability for v2 |
| LF-3: Mother repeats same action | **Fix required** | Prompt diversity constraint + code cooldown on TRACE_SPIKE |

---

## Net Assessment

**v2 is playable and portfolio-worthy with the fixes applied.** None of the above issues are design-level failures — they're implementation details that need to be locked before build. The core loop (player acts → Mother counters → Resistance AI reacts → two bars track urgency) is sound. The CONSULT as once-per-run lifeline is a great mechanic. Mother as a real opponent is working.

The four required fixes (SPOOF constraint, Shield persistence, OVERWATCH stalemate, LLM reliability) are all addressable in a weekend build if they're in the design spec before the first line of code. The two open risks (host traits, CONSULT accuracy degradation) are v2 features.

**Recommend proceeding to final design.**
