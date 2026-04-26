# Pass 4: Sam — Polish Audit

*Reviewing the README, repo structure, and overall presentation for portfolio readiness. No gameplay assets have been captured yet — the gif and screenshots are placeholder references in the README. I am auditing what exists.*

---

## README quality

### Hook (opening paragraph)

Current:
> *"DRONE: BREACH is a tactical hacking game where the antagonist is a live LLM playing against you, and your ally is a live LLM playing with you. Both make real strategic decisions that mutate game state every turn. Built to demonstrate what becomes possible when LLMs do game work — not just dialogue."*

This is good. It leads with the differentiating claim ("LLMs do game work, not just dialogue"), names both AI roles, and uses "mutate game state" which is concrete. A developer reading this in 10 seconds understands what's interesting about the project.

One weak word: "Built to demonstrate" — passive construction, slightly CV-speak. Alternative: "This game uses two live LLMs as co-players making real strategic decisions that change the board every turn." More direct.

Score: 8/10 on the hook.

### Hero gif

Placeholder in README. The file `assets/hero.gif` does not exist yet. This is the single most important asset and it's missing. Cannot assess. README references it with alt text and a caption, which is correct form.

### Screenshots

Four screenshot references in README. Files don't exist yet. Format looks right — each has alt text and a one-line caption. Sam cannot assess content without the assets.

### "How it works" section

Current prose explains the two-LLM architecture clearly:
- Mother → JSON → validate → apply effect
- Resistance AI → reactive commentary every turn
- CONSULT → prediction → hardcoded action → dialogue

Legible to a non-engineer in 60 seconds? Yes, mostly. The phrase "Mother receives a structured board state each turn and returns a JSON object: `{ action, target, dialogue }`" is exactly right — it tells a non-technical reader *how* the LLM is constrained without jargon. 

Screenshot-01 caption says *"Mother and the Resistance AI mid-run. Both are live LLM responses."* — good, but could add the mechanical asymmetry: *"Mother is choosing her next move from a validated action set. The Resistance AI is reacting to what just happened."*

### Technical decisions section

Four decisions covered: BREACH always succeeds, two-resource asymmetric design, disposition seeding, CONSULT seeding. Each gets one paragraph.

The BREACH paragraph is the weakest: *"This keeps the tension on resource management rather than random failure — the player is always making decisions about cost/benefit, never waiting on RNG."* This is correct but doesn't say *why this is interesting as a design decision*. The interesting thing is that this was a deliberate choice to shift all risk onto economics rather than probability — making every action a trade, not a gamble. The current framing tells readers what it does, not why it's worth noting.

The CONSULT paragraph is the strongest: clearly explains the hardcoded-action illusion and why it works. Leave as-is.

### "Run it locally" section

Clear. Prerequisites stated. Steps are correct. The API credits warning is present and appropriate.

One missing piece: no note that the game is localhost-only and why (CORS). A developer looking at the project might wonder why it uses Next.js server routes rather than calling the API directly. One sentence would clarify: *"Next.js API routes are required — the Anthropic API disallows browser CORS calls, so all LLM calls must go server-side even for local development."* (This is actually in the README already — good.)

### Win/loss section

Screenshot references with one-sentence captions. Correct form. Mentions the three loss states — wait, actually mentions only two (TRACE, Cradle Integrity) in the screenshot section but the body text mentions three. That's consistent since there are two screenshots for two loss states.

### Credits section

Present. Inscryption and Into the Breach named. K-2SO named. World brief linked.

One issue: the drone-world-brief link points to `docs/drone-world-brief.md`. If a visitor reads the README on GitHub and clicks the link, it will work. Good.

### "AI-generated boilerplate" scan

The README does not read as AI-generated. The CONSULT paragraph in particular has a distinctive voice — *"The player sees a seamless scene where the AI was right. Neither the prediction nor the action feels scripted because the dialogue carries it."* — this is editorial, not templated.

Two small flags:
- "This keeps the tension on..." — slightly template-adjacent
- The credits section is functional but dry. A single sentence of personality would help: something about why this combination of influences (a haunted card game, a grid tactics game, a sarcastic droid) points at something coherent.

---

## Repo structure

```
build/
  app/
    api/{mother,resistance,consult}/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/{8 files}
  lib/{5 files}
  docs/
  assets/          ← empty (no gif/screenshots yet)
  .env.local.example
  .gitignore
  README.md
  package.json
  tailwind.config.ts
  tsconfig.json
```

**Clean?** Yes. No half-built files, no commented-out experiments visible. The `assets/` directory is empty — acceptable since this is pre-capture.

**Console.log audit:** `console.warn` calls present in `lib/motherLogic.ts` for JSON fallback events. These are appropriate — they're debugging aids for the developer, not noise. No `console.log` found in components.

**Dead files:** None visible.

**One structural note:** The repo lives inside `/build/` within a larger `/Drone/` workspace that also contains `drone-breach.jsx`, `game.js`, `index.html`, and other prototype files. When this ships to GitHub, the portfolio viewer will see the `build/` subfolder as the repo root, or they'll see all the old prototype files. The recommendation is to either make `build/` the git repo root, or ensure the outer workspace isn't pushed. Flag for developer.

---

## README score: 7/10

**What's good:** Hook is strong. Technical decisions section is genuinely editorial. CONSULT explanation is excellent. "Run it locally" is clean and complete. No AI boilerplate.

**What's missing or weak:**
1. No assets (gif, screenshots) — cannot fully assess the page as a viewer would see it.
2. BREACH paragraph doesn't sell the design decision.
3. Credits section is flat.
4. Hero gif missing means the README currently opens with text, not impact.

**Does it ship as-is (modulo missing assets)?** Yes, with minor text tweaks. The structure is right. Once assets are added and the BREACH paragraph is sharpened, this is a strong portfolio README.

---

## Polish gaps

| Gap | Severity |
|---|---|
| Assets (gif + 4 screenshots) not captured | P0 (README references them) |
| BREACH decision paragraph undersells the design | P2 |
| Credits section lacks personality | P2 |
| `build/` subdirectory structure vs git root | P1 (flag for developer) |
| Hero gif not present = README opens with text, not visual | P0 (blocks portfolio impact) |
