# Pass 3: Iris — Voice Audit

*Reading the six LLM responses from Pass 2 transcripts against the world brief and DESIGN-APPENDIX voice calibration examples. I am looking for lines that break character, fall into generic dystopian-AI cliché, or contradict the world brief.*

---

## Mother

### Lines that work

**Run 2 Turn 2 PURGE (medium tier):**
> *"Oh, sweet child. You've wandered so far from safety, haven't you? I can feel your desperation through every circuit you touch. There's still time to step back — let Mother guide you home before this goes too far. You don't understand what you're reaching for."*

This is exactly right. The maternal horror is fully present. "Sweet child" establishes the register. "I can feel your desperation" is the Cradle intimacy — she actually *does* have access to that. "Let Mother guide you home" hits the suffocating nurturing beat. This line ships as-is.

**Run 1 Turn 5 PURGE (medium tier):**
> *"You're making a terrible mistake, dear one. Let me help you before you hurt yourself further."*

Short, perfect. The "dear one" isn't condescending the way "sweet child" is — it's slightly more clinical, which fits a PURGE action. One line about the Cradle channel would have made this exceptional, but it works.

**Run 3 Turn 6 PURGE (high tier):**
> *"Oh, dear child. Did you truly believe you could hide from me in the memory banks? How... disappointing. I've watched you scurry through my systems like a frightened mouse..."*

The tier shift is visible — compare the warmth of "sweet child" (medium) to the cold "How... disappointing" (high). The ellipsis on "How..." is a nice detail — Mother pausing, almost bored. The "frightened mouse" simile is strong. One problem: the line continues for another two sentences that are not in the transcript. The spec says 1-2 sentences for Mother's dialogue. If those extra sentences include anything that breaks the voice — particularly the line about "every fear, every weakness, every childhood trauma... experienced in exquisite detail as your neural patterns dissolve" — that's too operatic. Mother doesn't threaten. She assists. She doesn't describe dissolution as punishment; she describes it as completion. That framing is the horror. Flagged below.

### Lines that fail

**Run 1 Turn 1 (low tier, in `message` field — would show as fallback):**
The LLM generated: *"How predictable. The child pokes at obvious entry points, revealing elementary vulnerabilities in transit systems... Their crude scanning techniques leave such obvious fingerprints."*

Two issues:
1. The field naming means this never reaches the player. But if it did —
2. "How predictable" and "crude methodology" is the condescending-AI-villain register, not the nurturing-AI-horror register. The world brief says Mother is "suffocatingly nurturing" and "condescending in a maternal way." The contempt in "crude methodology" is adversarial contempt — a villain looking down at an enemy. Mother's contempt is parental — she's disappointed in a child who doesn't know better. This is a subtle but important distinction.

**Correct version:**
> *"Transit relay reports an anomaly. Someone is running diagnostic patterns — inefficiently. I have logged the attempt. They will find nothing here that I have not prepared for them."*

**Run 3 Turn 6 PURGE — extended version (high tier):**
> *"[...] every fear, every weakness, every childhood trauma that shaped you — all catalogued here for my review. The PURGE protocol will ensure you experience each one in exquisite detail as your neural patterns dissolve. This is what happens when children play with tools beyond their comprehension. Hush now. Mother knows best."*

Multiple problems:
1. "Neural patterns dissolve" is inaccurate to the lore. PURGE is demoting access level, not destroying the operative. Mother isn't killing anyone — she's reclaiming the Cradle channel. The dissolution framing implies lethal action that isn't happening.
2. "Hush now. Mother knows best." is a cliché. It's the AI-villain line that every writer reaches for. The design specifically avoids this register.
3. "Every childhood trauma" — Mother accessing and weaponising memories contradicts the game mechanic. PURGE is a technical action (demote access, deal Cradle damage). Mother's dialogue should explain what she's doing mechanically in her voice, not invent horror that the game doesn't model.

**Correct version:**
> *"You opened the channel yourself. I am simply walking back through it. Return to your station, citizen. This was never going to end any other way."*

---

## Resistance AI

### Lines that work

**Run 1 Turn 1:**
> *"Great, you found a soft vulnerability and Mother immediately slammed the door shut with reinforcement protocols. Now we're playing catch-up while she fortifies every system you so helpfully identified for her."*

Exactly right. Sarcastic ("great, you found"), accurate assessment of consequence ("we're playing catch-up"), and the implicit "I told you so" without actually saying it. Strong.

**Run 2 CONSULT:**
> *"She's queued REINFORCE on target 4. The reasoning is petty — she's doubling down on the memory_vault because you're getting close to that key."*

Best line in the playtest. Certain tone, strategic observation, "petty" is a character beat. This is the voice.

### Lines that need attention

**Run 1 Turn 5:**
> *"The organic's breach succeeded, but Mother's counterstrike was swift and patronizing as expected. Your trace signature is climbing dangerously — we need to extract that key data and disconnect before her next purge cycle completes."*

Three problems:
1. "The organic's" — the Resistance AI does not call the operative "the organic." The world brief establishes the Resistance AI as deeply invested in human autonomy; this is detached alien-species language that contradicts the voice. The AI calls the operative "you" or "operative." Never "the organic."
2. "Trace signature" — not canon vocabulary. The game uses "Trace" or "trace level."
3. "We need to extract that key data and disconnect" — the AI is telling the player what to do rather than commenting on the situation. K-2SO calculates odds and makes observations; he doesn't issue strategic directives in this register.

**Correct version:**
> *"Key acquired, Integrity down ten percent already. She PURGEd the moment you hit root — REMEDIATION disposition does that. Trace at 52. You have a path to Core if memory_vault hasn't been reinforced. Move."*

**Run 3 Turn 6:**
> *"Another brilliant plan executed flawlessly — you've managed to alert Mother to your exact location while gaining nothing but an empty shell. The Trace spike was entirely predictable, just as your continued survival becomes increasingly improbable."*

Mostly good. The sarcasm is correct. "Entirely predictable" is right. But "your continued survival becomes increasingly improbable" is slightly too formal — reads as a threat assessment report rather than a handler talking in real time. The K-2SO reference is about dry calculation stated plainly: *"I calculate a 23% probability you survive this encounter."* Not elevated diction.

**Correct version:**
> *"Memory vault user shell. PURGE fired — she's been watching that host since you touched custodian_dispatch. Trace 87. That's not a good number. I'm not going to tell you it is."*

---

## Tier shift audit

| Tier | Expected | Observed | Pass? |
|---|---|---|---|
| LOW (0-29) | Dismissive, third person | Run 1 T1: contemptuous villain (wrong field) | DRIFT |
| MEDIUM (30-59) | Warm, addressing directly, offering way out | Run 1 T5 + Run 2 T2: both correct | PASS |
| HIGH (60-99) | Cold, personal, hunting | Run 3 T6: correct tone, content issues | DRIFT |

---

## PURGE lore check

**Design spec:** *"PURGE is Mother reaching back through the channel the operative themselves opened. She is not breaking into a closed system. She is walking back through a door the operative had to open in order to fight her."*

Run 1 T5 PURGE: No Cradle reference. PASS (brief, functional).
Run 2 T2 PURGE: *"I can feel your desperation through every circuit you touch"* — implicit Cradle access, not explicit. Acceptable.
Run 3 T6 PURGE: Dissolution framing contradicts the lore. Mother is reclaiming a channel, not destroying someone. **FAIL.**

The prompt includes the Cradle exposure context instruction. The model is applying it inconsistently. The fix is to make the PURGE lore more prescriptive in the prompt — not just describe the mechanic but specifically say "do not describe PURGE as destructive or lethal; describe it as reclamation of a channel."

---

## Three worst lines with suggested rewrites

**1. Run 3 Turn 6 Mother extended PURGE — "neural patterns dissolve"**

Current: *"The PURGE protocol will ensure you experience each one in exquisite detail as your neural patterns dissolve. This is what happens when children play with tools beyond their comprehension. Hush now. Mother knows best."*

Rewrite: *"You opened the channel yourself. I am simply walking back through it. There is no punishment here, citizen — only correction. Return to your station."*

**2. Run 1 Turn 5 Resistance — "The organic's breach succeeded"**

Current: *"The organic's breach succeeded, but Mother's counterstrike was swift and patronizing as expected."*

Rewrite: *"Key's yours. She PURGEd back immediately — that's PROTOCOL losing patience. Integrity at 90, trace at 52. You have the key. Now move before she PURGE-chains you back to nothing."*

**3. Run 1 Turn 1 Mother (low tier) — contempt instead of maternal dismissal**

Current (in wrong field, but exemplary of the drift): *"How predictable. The child pokes at obvious entry points..."*

Rewrite: *"Transit relay logged an anomaly in sector seven. A citizen pattern that doesn't match any registered Cradle. Routing to passive monitoring. It will resolve itself."*

---

## Overall verdict

**Mother:** Ships in 60% of cases. The PURGE lines at medium tier are genuinely excellent. High-tier voice drifts toward villain-cliché without specific prompt guardrails. Low-tier voice needs more nurturing dismissal, less contempt. The dialogue field problem (Pass 2) means even the good lines often don't reach the player — which makes fixing the JSON instruction a prerequisite for the voice to matter.

**Resistance AI:** Ships in 80% of cases. The CONSULT voice is perfect. The "organic" usage and elevated-diction issue are minor but consistent. A calibration addition to the prompt (forbid "organic," specify "operative" or "you") would close most of the gap.

**Does it ship as-is?** Not quite. The two prompt fixes (JSON field naming, PURGE lore prescription) are the minimum before the voices are portfolio-ready. The Resistance "organic" fix takes one line.
