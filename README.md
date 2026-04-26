# DRONE: BREACH

I'm working on a novel called *Drone* — a world where humanity has fully integrated with a superintelligent AI called Mother in order to survive an existential threat. Mother controls everything through neural implants. There's a resistance. You know the shape of it.

While writing it, I kept coming back to one idea: what if you could actually play *against* the AI? Not fight a scripted villain — but a live LLM making real decisions, adapting to what you do, with its own objectives and its own voice. And what if your only ally was another live LLM, watching from the shadows, helping you thread the network.

That's DRONE: BREACH. A tactical hacking game where both the antagonist and your ally are live Claude instances making real decisions every turn. Not generating flavour text — actually playing the game.

---

![DRONE: BREACH gameplay](assets/hero.gif)

*Mother calculates. The Resistance AI watches. You thread the network.*

---

## The Game

You're an Awakened operative trying to infiltrate Mother's network, root her core, and extract the file that proves what Ascension actually means.

**Mother** is the opponent. Each turn she receives the full board state and returns a JSON action — reinforce a node, place a tripwire, spike your trace, isolate a connection, or reach back through your Cradle implant to damage you directly. Every move she makes changes the board. She has a disposition (DIAGNOSTIC, PROTOCOL, REMEDIATION) seeded at the start of the run that biases her strategy. She is a game-playing AI, not a storytelling one.

**The Resistance AI** is your handler. After every exchange it reacts to what you did and what Mother did — the voice is K-2SO from *Rogue One*, blunt and pessimistic and clearly caring despite itself. Once per run you can CONSULT: burning your action to get a read on Mother's next move from the AI's deep buffer access. It tells you what she's about to do. She does it. Neither feels scripted because the dialogue carries it.

![Both AI panels mid-run](assets/screenshot-01.png)
*Mother and the Resistance AI mid-run. Both are live LLM responses.*

![CONSULT prediction moment](assets/screenshot-02.png)
*CONSULT: the Resistance AI reads Mother's planning layer.*

---

## How I Built It

The central challenge was making Mother feel like a genuine opponent rather than a random event generator. That meant solving a few specific problems.

**The adversarial loop.** Each turn, the game serialises the full board state — which nodes you control, what tokens are active, your trace level, Mother's disposition — and sends it to Claude as a structured prompt. Mother returns a JSON object: `{ action, target, dialogue }`. The game validates it, applies the mechanical effect, then passes the result to the Resistance AI so it can react to what actually happened. Two sequential LLM calls, each one aware of what the other just did. The loop is: player acts → Mother responds → Resistance AI comments → repeat.

**Preventing hallucinated moves.** The biggest practical problem with LLM game agents is that they'll confidently choose moves that aren't legal. My fix: before every Mother call, the game pre-computes her valid action set in code — which nodes she can reinforce, which connections she can isolate, whether PURGE is available. Only the valid options go into the prompt. The model picks from a list that's already been checked. She can't cheat by accident.

**Structured output and graceful fallback.** Getting a model to return consistent JSON — with the exact right field names, every time — is harder than it sounds. I spent time hardening the prompt (explicit field names, worked examples, prohibition on synonyms like `message` instead of `dialogue`) and built a validation layer that can recover a partial response and still extract something usable. The game never breaks on a bad LLM response; it degrades gracefully.

**The CONSULT illusion.** This was the most interesting engineering problem. CONSULT is supposed to feel like the Resistance AI has read Mother's mind — it predicts her next move and turns out to be right. The way this actually works: the Resistance AI fires first and names Mother's action in natural language. The game parses that prediction to extract the action keyword, then hardcodes Mother's action to match before calling her LLM for dialogue only. The player sees a seamless scene where the prediction came true. Neither call feels scripted because the dialogue is still live — Mother reacts to the detected intrusion in character, she just can't change her move.

**Prompt engineering as game design.** Mother has three seeded dispositions (DIAGNOSTIC, PROTOCOL, REMEDIATION) that bias her behaviour throughout a run. Her tone shifts by trace tier — dismissive at low trace, concerned at medium, hunting at high. These are prompt-level instructions, not code logic. Getting the model to stay in character, maintain consistent strategic bias, and not repeat the same move three turns in a row required iterating on the prompt the same way you'd iterate on code.

---

## Some Design Decisions Worth Noting

**BREACH always succeeds.** There are no dice. The trace cost is the risk — deterministic, visible, negotiable. This shifts all the game's tension onto economics: every action is a trade with a known cost, never a gamble with unknown odds. The question is never *will it work*. It's always *can you afford it*.

**Two pressure tracks.** Trace (0→100) accumulates from everything you do. Cradle Integrity (100→0) only moves when Mother uses PURGE — reaching back through the channel you opened to fight her. The Cradle loss condition is the more narratively disturbing one. She's not attacking you. She's walking back through a door you left open.

**Nine guaranteed-distinct run configurations.** Three dispositions × three possible key locations, all seeded deterministically by code before the LLM ever fires. The AI shapes the continuation; the opening board state is always testable and reproducible.

![EXFIL win screen](assets/screenshot-03.png)
*WIN: subjects.db extracted. 47,212 citizens selected for neural dissolution. The "elevation" was consumption.*

![Trace lock loss screen](assets/screenshot-04.png)
*LOSE: trace hits 100. Custodians inbound. The Resistance AI burns the channel.*

---

## Run It Locally

**Prerequisites:** Node.js 18+, an [Anthropic API key](https://console.anthropic.com/).

```bash
git clone https://github.com/avids-cloud/drone-breach-game.git
cd drone-breach-game
cp .env.local.example .env.local
# Add your key: ANTHROPIC_API_KEY=sk-ant-...
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Each turn makes API calls to `claude-sonnet-4-20250514` — roughly 1,000–1,500 tokens across both LLMs. Next.js server routes are required because the Anthropic API doesn't allow direct browser calls.

---

## Credits

World design and lore: [`docs/drone-world-brief.md`](docs/drone-world-brief.md). Game design influenced by *Into the Breach* (visible enemy intent) and *Inscryption* (the feeling that the game's intelligence is watching you). The Resistance AI's voice is K-2SO. Mother's voice is every polite system that's ever told you it's for your own good.

Full design documentation in [`docs/DESIGN.md`](docs/DESIGN.md).
