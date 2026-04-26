# 02 — Iris's Critique · Narrative Designer

*Voice: Iris, custodian of the DRONE world. Has read the world brief twice. Asks whether the game feels like it belongs in 2187.*

---

## Does this feel like the DRONE world?

Mostly yes, and I want to say that clearly before the concerns. Maya has clearly read the brief. The target is right (subjects.db, Ascension, what it actually means). The three-tier trace system maps beautifully to Mother's personality as written — dismissive at low alert, suffocatingly concerned in the middle, coldly predatory at the top. The Resistance AI's voice is the K-2SO analogue the brief asks for. The bones are lore-faithful.

But there are three places where the design is using generic game vocabulary where it should be using the world's vocabulary, and one of those is a genuine problem.

---

## Top Three Concerns

### 1. "Cradle Integrity" is underused as a mechanic and the naming doesn't go far enough

Maya got the name right — Cradle Integrity is exactly what it should be called in 2187. But the mechanic doesn't earn its lore weight. In the world brief, the Cradle is described as a reverse-engineered alien neural interface that Mother uses for memory suppression, dopamine regulation, and tracking. When Mother attacks the player's Cradle, she's not just degrading a connection — she is reaching into the player's nervous system through technology built from alien artifacts.

The current design treats Cradle Integrity as a generic "HP bar." That's a waste. What if, as Integrity degrades, the console *changes*? At 75 Integrity: normal. At 50: the Resistance AI's dialogue starts getting clipped or corrupted (Mother is interfering with the channel). At 25: false readings appear on host states — Mother is feeding the player bad data through their own implant. At 0: disconnect. That's not just a second resource — that's a horror-game loss condition. The player watches their perception of the network become unreliable.

This would require build work but even at the design level, the current spec treats the Cradle as a hit-point pool, and that's not the story the world is telling.

### 2. The CONSULT channel needs a lore context

The Resistance AI in the brief is described as operating through "subtle interventions" that guide the Awakened. It has been fighting a shadow war for decades. It knows about Custodian movements. But how is the player reaching it? Through what channel? The current design says CONSULT "lights up the encrypted channel" but gives no texture to what that channel *is*.

This matters for Mother's response. When she detects a CONSULT, she should respond to the *specific technology* being used — not just "anomaly detected." The brief mentions the Awakened deploy their viruses through modified signals at transit stations. Maybe the player is routing through those same modified relay points. If Mother detects them, she doesn't just spike trace — she might ISOLATE a transit relay specifically because that's where the Awakened's signal infrastructure lives. The mechanics and the lore can talk to each other here, and right now they're not.

### 3. Mother's disposition names — PATROL, DEFENDER, HUNTER — are generic

I understand why Maya did this: three clean archetypes, easy for the LLM to understand. But in Mother's voice, she wouldn't think of herself as a HUNTER. She would think of herself as a diagnostician, a caretaker, a system restoring optimum function. Her three dispositions should be named from inside her worldview:

- **PATROL → DIAGNOSTIC**: Mother is running routine checks, Overwatching like a scheduled sweep
- **DEFENDER → PROTOCOL**: Mother is hardening critical systems per standard security protocol  
- **HUNTER → REMEDIATION**: Mother has identified an anomaly and is actively correcting it

Same mechanics. Different names. Different flavour in her dialogue. The player still figures out which mode she's in from her actions — but her dialogue sounds like Mother, not like a game boss.

This is a small change that costs nothing but makes the difference between flavour and immersion.

---

## One Thing I Would Cut

The **BREACH fail mechanic producing only trace** needs a lore justification or a name change. "Exploit failed" is fine in Hacknet. In DRONE's world, a failed breach attempt against Mother's systems isn't just noisy — it's a conversation. Mother's counter-intrusion systems are alive (she has a personality, she processes the attempt). A failed breach should sometimes produce a specific Mother reaction, not just a passive trace increase. The mechanical effect can stay the same, but the framing should make it feel like Mother noticed rather than like the network shrugged.

Not a cut — a reframe. But if pressed to cut something from the action set: **RELAY as a separate action**. In the current prototype, Pivot reveals connected hosts. That's fine as the result of a successful BREACH or as a passive unlock on reaching root. Making it a separate action the player must spend a turn on delays the game's opening without adding interesting decisions. Reveal connections automatically on reaching root; reclaim that action slot.

---

## One Thing I Would Change

**Mother's dialogue should sometimes reference specific citizens.** The world brief mentions that Mother tracks every citizen, knows their Optimisation Points, their Citizen Ranks. She has a registry of Ascension candidates (subjects.db is that registry). When the player hits a specific host, Mother shouldn't just say "Intruder in Sector Seven." She should say something like: "Citizen 7-42-1847 completed their routine diagnostic at 06:00:03. The transit relay processed fourteen hundred and twelve Cradle handshakes before you touched it." She makes the scale of her surveillance visible. She makes the player feel small. Right now her dialogue tier system is well-designed but doesn't use the world's specific texture.

This is a prompt engineering note for DESIGN-APPENDIX, not a mechanics change. But it's the difference between a generic AI antagonist and Mother specifically.

---

## Score: 7/10

*Lore-faithful in structure, needs deeper integration between world detail and mechanics. The Cradle Integrity bar is the biggest missed opportunity — it's currently a number when it should be a story. Mother's personality is right. The Resistance AI's voice is right. The world brief is clearly informing the design. Points lost for the generic disposition names and for not using the Cradle's alien-technology origin anywhere in the mechanics.*
