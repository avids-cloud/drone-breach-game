# DRONE: BREACH

DRONE: BREACH is a tactical hacking game where the antagonist is a live LLM playing against you, and your ally is a live LLM playing with you. Both make real strategic decisions that mutate game state every turn. Built to demonstrate what becomes possible when LLMs do game work — not just dialogue.

---

![DRONE: BREACH gameplay](assets/hero.gif)

*Mother calculates. The Resistance AI watches. You thread the network.*

---

## How It Works

Two LLMs. One network. One run.

**Mother** receives a structured board state each turn and returns a JSON object: `{ action, target, dialogue }`. The game validates the JSON, applies the mechanical effect to the board, and renders her dialogue. She picks from five actions — reinforce a node, place a tripwire, spike trace, isolate a connection, or reach back through your Cradle implant. Every turn the board changes because of her decision. She is a game-playing LLM, not a storytelling LLM.

**The Resistance AI** reacts to every exchange: what you did, what Mother did, and where the run is heading. K-2SO voice — blunt, pessimistic about probabilities, denying it cares while clearly caring. Once per run you can CONSULT: burning your action to get a guaranteed read on Mother's next move from the AI's deep buffer access. That's the only turn where her action is hardcoded.

![Both AI panels mid-conversation](assets/screenshot-01.png)
*Mother and the Resistance AI mid-run. Both are live LLM responses.*

---

## Key Technical Decisions

**BREACH always succeeds.** The trace cost is the risk, not a dice roll. This keeps the tension on resource management rather than random failure — the player is always making decisions about cost/benefit, never waiting on RNG.

**Two-resource asymmetric design.** Trace (0→100) and Cradle Integrity (100→0) create orthogonal pressure. Trace accumulates from everything you do. Cradle Integrity only moves when Mother uses PURGE — reaching back through the channel you opened to fight her. The Cradle loss is the more narratively horrifying loss condition.

**Deterministic disposition seeding with LLM bias additive.** Each run, Mother is seeded as DIAGNOSTIC, PROTOCOL, or REMEDIATION. Starting tokens are placed by code (guaranteed, testable). The LLM prompt bias shapes how she continues — but the opening board state is deterministic. Three dispositions × three key locations = nine guaranteed-distinct run configurations.

**CONSULT seeds Mother's action.** When you CONSULT, the Resistance AI fires first and names Mother's next action in natural language. The game parses the keyword, locks Mother's action to match, then fires Mother's *dialogue* via LLM — she reacts to the detected relay access in character while her move is already decided. The player sees a seamless scene where the AI was right. Neither feels scripted because the dialogue carries it.

![CONSULT prediction moment](assets/screenshot-02.png)
*CONSULT in action: the Resistance AI reads Mother's planning layer.*

See [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/DESIGN-APPENDIX.md`](docs/DESIGN-APPENDIX.md) for full design rationale.

---

## Run It Locally

**Prerequisites:** Node.js 18+, an [Anthropic API key](https://console.anthropic.com/).

```bash
git clone <repo-url>
cd drone-breach
cp .env.local.example .env.local
# Add your key: ANTHROPIC_API_KEY=sk-ant-...
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Running the game makes API calls to `claude-sonnet-4-20250514` — each turn uses ~1,000–1,500 tokens across both LLMs.

Next.js is required (not just for React) because the Anthropic API disallows browser CORS calls. The server-side API routes in `app/api/` proxy all calls.

---

## Win and Loss States

![EXFIL win screen](assets/screenshot-03.png)
*WIN: Root on Mother's Core + decryption key → subjects.db extracted. 47,212 citizens selected for neural dissolution. The "elevation" was consumption.*

![Trace lock loss screen](assets/screenshot-04.png)
*LOSE — TRACE: Global trace hits 100. Custodians converge on the operative's physical location. The Resistance AI burns the channel.*

A third loss state exists: **Cradle Integrity reaches 0.** Mother has walked back through the door you opened. Not a connection failure. A betrayal from inside your own skull.

---

## Credits

World design and lore from [`docs/drone-world-brief.md`](docs/drone-world-brief.md). Game design inspired by *Inscryption* (asymmetric information) and *Into the Breach* (visible enemy intent). The Resistance AI's voice is K-2SO from *Rogue One*. Mother's voice is every polite system that's ever told you it's for your own good.
