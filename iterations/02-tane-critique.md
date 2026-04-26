# 02 — Tane's Critique · Systems Designer

*Voice: Tane, numbers person. Asks what the LLM can actually do reliably. Pushes back on anything that requires counting, arithmetic, or long-range memory.*

---

## The Math and the LLM Reality Check

Good instincts, two structural problems, three LLM reliability landmines that will blow up in production. Let me go through them.

---

## Top Three Concerns

### 1. Mother's ISOLATE action creates a game-ending degenerate state with no circuit breaker

ISOLATE permanently cuts a pivot connection. That's a powerful action. The design says there are five hosts with specific connections (from the prototype: transit_relay→optimisation, transit_relay→memory_vault, custodian_dispatch→memory_vault, optimisation→mother_core, memory_vault→mother_core). Mother has two paths to the Core to cut: optimisation→mother_core and memory_vault→mother_core.

If Mother's disposition biases her toward ISOLATE and she cuts both of those connections before the player reaches them — and the player has no host with a direct route to Core — the game is over in a new way Maya didn't design for. The player isn't at zero on any bar. They're just stranded. The topology makes ISOLATE potentially game-ending in 2 uses, not 4 as Maya assumes.

The fix: either (a) Mother cannot ISOLATE a connection unless the player has root on one of the endpoints — she's cutting off a path the player has already established, which is reactive rather than preemptive, or (b) the Core always has at least one unIsolatable connection (a "hardwired channel" the player can always use, at higher trace cost). Either way, the current spec has a game-ending combo that no player can see coming and no player action prevents.

### 2. The BREACH fail probability mechanic is asking the LLM to resolve it, or it's a hidden dice roll — which is it?

Maya specifies fail chances: soft 10%, medium 25%, hard 40%. That's fine as a random dice roll in code. But the Resistance AI is supposed to give probability estimates on CONSULT. If the AI is estimating breach success probability, it needs to know the CVE strength tiers. If those are in the prompt, the AI will try to do arithmetic with them — and LLMs doing probability arithmetic in constrained prompts produces confident nonsense. "Soft CVE, 10% fail, so 90% success" is the easy case. But the AI will start combining factors ("trace is 60, which degrades your signal, adjusting for that I estimate 73% success") that it is making up.

Resolution: The Resistance AI on CONSULT should never calculate breach probability numerically. It should assess *situational risk* in qualitative terms ("Memory Vault's CVE looks ugly. I've seen worse. I wouldn't call it a coin flip.") and predict Mother's next action, which is what the design actually wants it to do. Remove numeric breach probability from the CONSULT output spec. The dice roll happens in code, not in the LLM.

### 3. Mother's JSON target field will hallucinate host IDs

The spec says Mother returns `{ "action": "ISOLATE", "target": "memory_vault→mother_core" }`. That connection ID format ("memory_vault→mother_core") is not something an LLM will reliably reproduce from a system prompt list. LLMs will:
- Reverse the direction: "mother_core→memory_vault"
- Use underscores inconsistently: "memoryvault→mothercore"
- Paraphrase: "the link between memory vault and the core"
- Pick a connection that doesn't exist: "transit_relay→mother_core"

This is a production failure that corrupts game state. The fix: use numeric or short enum IDs in both the prompt and the expected output. Don't ask the LLM to reproduce long compound strings. Give Mother a numbered list:

```
Available ISOLATE targets:
[1] transit → optimisation
[2] transit → memory_vault  
[3] custodian → memory_vault
[4] optimisation → core
[5] memory_vault → core
```

And have her return `{ "action": "ISOLATE", "target": 4 }`. Then the game maps 4 back to the connection. This is a build-pass note but it needs to be designed in now so the spec doesn't promise something unreliable.

---

## One Thing I Would Cut

**The BREACH fail chance altogether, for v1.** Maya introduced probabilistic failure to add tension, but it adds a dice-roll that the player has no agency over and which just taxes trace. It's slot-machine risk, not strategic risk. Remove fail chance in v1 — BREACH always succeeds, but the trace cost scales with CVE strength (soft: +10, medium: +20, hard: +35). Now the player has a real decision: do I spend 35 trace to breach a hard host or find a softer path? That's strategic. The coin flip is not.

If we want some failure texture, add it back in v2 after we understand the trace economy better.

---

## One Thing I Would Change

**Mother's disposition system needs a mechanical expression, not just a prompt bias.** Right now, disposition is "give the LLM a preference." That's fine for flavour but unreliable for balance. An LLM with HUNTER disposition will sometimes REINFORCE anyway because the situation looks like REINFORCE-territory. You can't count on prompt-biased LLM choices to produce reliable strategic personas.

Fix: each disposition adds one *guaranteed* starting token to the board:
- **PATROL/DIAGNOSTIC**: Starts with OVERWATCH tokens on the two outermost visible hosts
- **DEFENDER/PROTOCOL**: Starts with REINFORCE tokens on both internal-zone hosts  
- **HUNTER/REMEDIATION**: Starts with 20 trace already on the clock (Custodians were already probing)

The starting tokens are placed deterministically by code, not by the LLM. The LLM's disposition bias then flavours how Mother *continues* — but the starting state is hard and consistent. Now each run has a different opening puzzle, guaranteed, without relying on LLM consistency to deliver it.

---

## Score: 6/10

*The resource system is correct and the LLM-action-set approach is the right architecture. Loses four points for three LLM reliability landmines (JSON target hallucination, numeric probability, and disposition-as-prompt-only), one of which will break the game in production on the first run. The ISOLATE degenerate state is a genuine design flaw, not a build risk. Both need to be in v2.*
