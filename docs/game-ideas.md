# Game Task Ideas & Mechanisms

Ideas for new mini-games, missions, and learning tasks for pixel-learn. Each idea includes the core mechanic, how it teaches spelling/reading, and how it fits the existing architecture.

---

## Mini-Games (New Interactive Zones)

### 1. Fishing Pond
**Location:** Second pond on the map (currently unused)
**NPC:** Finn the Fish (blue-tinted sprite near pond edge)
**Mechanic:** Cast a fishing line by pressing a button. A letter floats toward the hook — the child must decide whether to reel it in (correct next letter) or let it pass (wrong letter). Letters drift left-to-right at varying speeds. Reeling in the wrong letter tangles the line (short cooldown penalty).
**Learning:** Letter recognition under time pressure + sequential spelling. Different from pond (reactive decision vs. spatial collection) and tree cutting (filtering vs. whack-a-mole).
**Difficulty scaling:** Beginner: letters drift slowly, 3s to decide. Advanced: faster drift, shorter window, more decoy letters in the stream.

### 2. Garden Planting
**Location:** Near Garden House building
**NPC:** Sprout the Seedling (green-tinted sprite)
**Mechanic:** A row of flower pots sits in a garden bed, one per letter. Seeds drop from above with letters on them. The child must catch the correct seed and plant it in the correct pot (left-to-right order). Wrong seeds wilt with a puff animation. Correct seeds bloom into flowers.
**Learning:** Letter-to-position mapping. The child must track both which letter AND which position, adding spatial reasoning to spelling.
**Difficulty scaling:** Beginner: seeds fall slowly, one at a time. Advanced: multiple seeds fall simultaneously, faster speed.

### 3. Bakery Oven
**Location:** Near Bakery building
**NPC:** Biscuit (already exists — could trigger this instead of/alongside word tasks)
**Mechanic:** A conveyor belt carries letter-shaped cookies toward an oven. The child must tap cookies in the correct spelling order before they reach the end of the belt. Tapping out of order burns the cookie (smoke puff). Successfully spelling the word bakes a complete cookie that pops out.
**Learning:** Speed + order recognition. The conveyor adds urgency without the memory component — the word is visible but letters arrive in random order.
**Difficulty scaling:** Belt speed increases. Advanced: some cookies are upside-down (rotated letters).

### 4. Art Studio Painting
**Location:** Near existing buildings
**NPC:** Doodle (already exists)
**Mechanic:** A blank canvas shows a dotted outline of each letter. The child traces each letter by walking their character along the dot path in the correct stroke order. Completing a letter fills it in with color. The full word creates a painting.
**Learning:** Letter formation and writing — the only task that teaches HOW to write letters, not just recognition. Strongest educational value for younger kids.
**Difficulty scaling:** Beginner: dots are close together, forgiving path detection. Advanced: fewer dots, tighter path tolerance.

### 5. Music Stage
**Location:** Center of village (new performance area)
**NPC:** Melody the Bird (new, musical note tint)
**Mechanic:** Musical notes float across the screen, each carrying a letter. The notes play different tones. The child must tap notes in spelling order — correctly spelled words play a melody. Wrong taps play a discordant note.
**Learning:** Multi-sensory spelling — combines auditory and visual letter recognition. Each letter gets associated with a musical tone, creating auditory memory hooks.
**Difficulty scaling:** Beginner: notes move slowly, correct notes glow. Advanced: all notes look the same, faster movement.

---

## Mission Types (NPC-Triggered Quests)

### 6. Scavenger Hunt
**Trigger:** 15% chance on NPC interaction
**Mechanic:** An NPC gives the child a list of 3 words. Hidden word tokens are scattered around the village map (small glowing dots). The child must walk around and find them, spelling each word when they reach a token. Completing all 3 returns to the NPC for a bonus reward.
**Learning:** Extended engagement + spatial memory. Encourages exploration while reinforcing multiple words in one session.
**Reward:** 5 hearts for completing all 3.

### 7. Relay Race
**Trigger:** 10% chance on Coach Roar interaction (after unlock)
**Mechanic:** A timed challenge — the child must visit 3 NPCs in sequence, spelling a word at each stop. A visible timer counts up (not down — no stress, just tracking). Completing the relay earns bonus hearts based on time.
**Learning:** Spelling under mild time awareness. The timer motivates speed without the stress of a countdown.
**Reward:** Under 60s = 5 hearts, under 90s = 3 hearts, any completion = 2 hearts.

### 8. Message Delivery
**Trigger:** 10% chance on any NPC interaction
**Mechanic:** An NPC gives the child a "letter" (message) with a word on it. The child must deliver it to a specific NPC by walking across the map. On arrival, they must spell the word from memory (the message closes when they start walking). Correct delivery earns hearts.
**Learning:** Long-term memory recall — the gap between seeing the word and spelling it is much longer than the flash mechanic (walking time vs. 2-3 seconds).
**Reward:** 3 hearts (correct first try), 2 hearts (with hint shown).

### 9. Word Chain
**Trigger:** 10% chance on Professor Hoot interaction
**Mechanic:** Professor Hoot starts a word chain. The child sees a word, then must choose from 3 options which word starts with the LAST letter of the previous word. Chain 5 words successfully to win. Example: cat → tree → egg → go → orange.
**Learning:** Beginning and ending letter recognition. Builds phonemic awareness beyond just spelling.
**Reward:** 2 hearts per chain of 5.

---

## Passive / Ambient Tasks

### 10. Daily Word Wall
**Mechanic:** A bulletin board in the village center shows 3 "words of the day." The child can walk up and tap each word to hear it spoken and see it used in a sentence. No hearts — purely educational exposure. Words rotate daily.
**Learning:** Vocabulary building through contextual exposure, no pressure.

### 11. NPC Chat Bubbles
**Mechanic:** NPCs occasionally show floating speech bubbles with short sentences using words from the word banks. Tapping the bubble highlights the target word. No task — just ambient reading practice.
**Learning:** Reading in context. Moves beyond isolated word recognition toward reading comprehension.

### 12. Collectible Word Journal
**Mechanic:** Every word the child successfully spells gets added to a personal journal (accessible from settings or a bookshelf). The journal shows the word, its emoji, how many times spelled, and a "mastery" star rating (1-3 stars based on first-try success rate).
**Learning:** Meta-cognition — the child can see their own progress and which words they find difficult. Encourages revisiting challenging words.

---

## Seasonal / Event Tasks

### 13. Holiday Spelling Bee
**Mechanic:** Special event where Mayor Hop hosts a village spelling bee. NPCs take turns asking words, and the child must spell them in advanced-style (arrange letters). Getting 5 in a row triggers a celebration with fireworks particles. Available on weekends or configurable dates.
**Learning:** Review/assessment format — tests accumulated knowledge across all word banks.

### 14. Weather Words
**Mechanic:** When the game detects a new day, a random weather effect plays (rain, sun, snow, wind — purely visual particles). A special weather NPC appears offering weather-themed words to spell. Each season has its own word set.
**Learning:** Contextual vocabulary tied to real-world concepts.

---

## Implementation Priority (Recommended Order)

| Priority | Idea | Effort | Educational Value | Fun Factor |
|----------|------|--------|------------------|------------|
| 1 | Collectible Word Journal (#12) | Low | High | Medium |
| 2 | Garden Planting (#2) | Medium | High | High |
| 3 | Scavenger Hunt (#6) | Medium | High | High |
| 4 | Message Delivery (#8) | Low | High | Medium |
| 5 | Daily Word Wall (#10) | Low | Medium | Low |
| 6 | Fishing Pond (#1) | Medium | Medium | High |
| 7 | Art Studio Painting (#4) | High | Very High | High |
| 8 | Word Chain (#9) | Low | High | Medium |
| 9 | Bakery Oven (#3) | Medium | Medium | High |
| 10 | Music Stage (#5) | High | High | Very High |

**Rationale:** Start with low-effort, high-value additions (journal, delivery missions) that enrich the existing game without new zones. Then add new interactive zones that bring genuinely different mechanics (garden = spatial, fishing = filtering, art = writing).
