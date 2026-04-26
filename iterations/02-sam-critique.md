# 02 — Sam's Critique · Producer

*Voice: Sam, scope hawk. Has shipped prototypes on weekends and knows exactly where the overruns hide.*

---

## Can This Ship in a Weekend?

Mostly yes, with cuts. Maya has done something rare for a first design pass — the vertical slice is mostly tractable. But there are three scope landmines buried in the spec that will each eat a day if they survive into the build pass, and one of them will kill the demo if it ships unresolved.

---

## Top Three Concerns

### 1. Three lose conditions means three separate game-over states to build and test

Win: 1 state. Trace loss: 1 state. Cradle Integrity loss: 1 state. Isolation loss: 1 state. That's four end-screen variants. Each one needs its own dialogue for Mother, its own Resistance AI line, its own UI state, its own reset path. In a weekend build, that's probably 8–12 hours just on end-state handling.

More importantly: two of those lose conditions (Cradle Integrity, Isolation) are low-frequency events that players may never encounter in a demo playthrough. You're paying build cost for experiences that won't appear in the demo reel. The Isolation loss in particular requires specific Mother behaviour (repeated ISOLATE actions) that the LLM won't reliably produce in a short session.

**Build budget recommendation:** Two lose conditions maximum for v1. Trace (always) and Cradle Integrity (the interesting second bar). If ISOLATE is dangerous, handle it mechanically (connection cut = trace penalty for detours) rather than as a third loss condition.

### 2. Cradle Integrity degradation-as-perception-change is a weekend scope killer

Iris will probably suggest this in her critique too (I'm guessing based on the brief) — the idea that as Cradle Integrity drops, the UI changes, false readings appear, the Resistance AI gets corrupted. That's an incredible design idea and it belongs in v2. It requires conditional rendering based on integrity tier, fake state objects, corrupted text effects, timing issues with the LLM pipeline. A weekend build does not have room for this.

For v1: Cradle Integrity is a bar. It goes down when Mother PURGEs. It hits 0, you lose. Clean, simple, buildable in an afternoon. The flavour is Mother using your implant against you — the Resistance AI and Mother's dialogue can carry that weight without the UI changing. Design the mechanic, document the v2 vision, ship the bar.

### 3. CVE strength variance per run means six different numerical constants per host per run variant

Maya specifies that each run, one host's CVE is upgraded or downgraded. That means the game needs a seeding system, a CVE-strength table, and logic to apply variance at run start. Not complicated, but it's a day of work that only adds marginal run variance. Combined with key placement randomisation and Mother disposition, you already have good run variance from two simpler seeds.

**Cut the CVE variance for v1.** Fixed CVE strengths, randomise key location and Mother disposition only. Those two seeds are sufficient to make each run feel different. CVE variance is a v2 feature.

---

## One Thing I Would Cut

**SPOOF as a player action.** Not because it's bad design — it's actually interesting — but because it adds a trace-management-only action that has no narrative hook and adds 20% to the action panel surface area. In a weekend build, six buttons is more than four buttons and the playtesters need to evaluate all six in the time available. Trace management is already handled by the player's action *choices* (slower, lower-noise paths vs. faster, higher-noise ones). A dedicated SPOOF action is a compression valve that reduces strategic tension. Cut it for v1, consider it as a one-time consumable (an "exploit tool" the player carries into the run) in v2.

---

## One Thing I Would Change

**Disposition starting tokens (seed at run start, not LLM-chosen)** — I'll echo what Tane will probably say: disposition as a prompt bias is a runtime risk. If disposition starts with guaranteed tokens placed by code, the variant is deterministic and testable. A PATROL run always starts with two Overwatches. A PROTOCOL run always starts with two Reinforces. A REMEDIATION run starts with +20 trace. Test it in code, document the visual result, ship it. Don't trust the LLM to reliably express a disposition that code can express in five lines.

---

## Score: 7/10

*Higher than you'd expect from a first design pass — the LLM architecture is actually tractable. The action count is manageable. The network is the right size. Loses three points for scope-bloat in the loss conditions, and one more for CVE variance which is a nice-to-have that will eat build time. The core — Mother acts, player responds, Resistance AI observes — is a weekend build if you cut the right things.*

---

## Build Risk Register (for the build pass)

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Mother JSON hallucination (invalid target ID) | High | Constrain to enum IDs, validate on receive, fallback to TRACE_SPIKE |
| LLM latency blocks player action | Medium | Optimistic UI: show player action result immediately, stream AI responses |
| ISOLATE degenerate state (all paths cut) | Medium | Cap: Mother cannot ISOLATE if only 1 path to Core remains |
| Three end states shipping incomplete | Medium | Scope to two for v1 |
| CVE variance logic errors | Low (if cut) | Cut for v1 |
