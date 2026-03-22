# Library Feature — Design Spec

## Overview
Make the Library building enterable. Players walk into it to transition to a full-screen interior scene with bookshelves, a librarian NPC, and book borrowing/delivery missions.

## Entry & Exit
- **Enter:** Player walks into the Library building on the world map (at x:800, y:250). A Phaser overlap zone (invisible rectangle at the building's door area, ~x:800, y:250, 32x16) detects the player. On overlap, `WorldScene` stores the player's return position in `this.scene` registry data and starts `LibraryScene`:
  ```js
  this.scene.start('LibraryScene')
  ```
- **Exit:** Player walks to the bottom edge of the library interior (y > 300). `LibraryScene` transitions back:
  ```js
  this.scene.start('WorldScene', { returnTo: { x: 800, y: 266 } })
  ```
  `WorldScene.create()` checks for `returnTo` data to position the player below the Library door instead of the default spawn point.
- **LibraryScene** must be registered in the Phaser game config alongside the existing scenes.

## Interior Layout (Classic Side Shelves)
- **Resolution:** 480x320 (same as world)
- **Rendering:** Procedural Phaser graphics (no tilemap). Walls, floor, shelves, desk all drawn with `this.add.rectangle()` and `this.add.graphics()`.
- **Back wall:** Warm brown wooden wall (`0x5d4037`)
- **Left wall:** Bookshelf (`0x4e342e`) with up to 6 colored book spine rectangles (each is a clickable Phaser sprite via `setInteractive()`)
- **Right wall:** Same as left, up to 6 books
- **Center-back:** Librarian sprite behind a desk rectangle
- **Floor:** Wooden plank color (`0x8d6e63`)
- **Player:** Same `Player` entity class reused. New instance created in `LibraryScene.create()`. Enters from bottom-center (240, 300). Physics bounds set to room dimensions.
- **Camera:** Fixed (no follow), since the room fits entirely on screen.
- **Left shelf** holds books 1–6, **right shelf** holds books 7–12. Books are positioned top-to-bottom on each shelf. Locked books render as gray with a padlock icon.

## Librarian
- **LibraryScene-only character** — NOT added to `npcs.js`. It's a standalone sprite within `LibraryScene` using the existing NPC spritesheet pattern (32x32, frame 8).
- **Clickable** via Phaser `setInteractive()`. On click, emits `EventBus.emit('librarian-interact')`.

## Books
- **Starting count:** 4 books available (IDs: 1–4)
- **Max count:** 12 books
- **Unlock thresholds** (by total hearts): Book 5 at 8 hearts, Book 6 at 15, Book 7 at 25, Book 8 at 35, Book 9 at 45, Book 10 at 55, Book 11 at 65, Book 12 at 80.
- **Content:** Each book has a themed short story (2-3 sentences) with embedded word puzzles:
  - Fill in the missing word (beginner)
  - Pick the right word to complete the sentence (intermediate)
  - Unscramble a word from the story (advanced)
- **Book data** defined in `src/data/books.js`:
  ```js
  { id, title, spineColor, story: string, puzzleWords: string[], difficulty }
  ```
- **Examples:** "Animal Friends", "Colors of the Rainbow", "The Brave Knight", "Under the Sea"

## EventBus Events

| Event | Emitted By | Payload | Listened By |
|-------|-----------|---------|-------------|
| `shelf-click` | LibraryScene | `{ side: 'left'|'right' }` | BookBrowser.jsx |
| `librarian-interact` | LibraryScene | — | LibrarianDialog (within BookBrowser.jsx) |
| `borrow-book` | BookBrowser.jsx | `{ bookId, title }` | LibraryScene (updates shelf visuals) |
| `return-book` | BookBrowser.jsx | `{ bookId }` | LibraryScene |
| `read-book` | BookBrowser.jsx | `{ bookId }` | BookReader.jsx |
| `book-read-done` | BookReader.jsx | — | BookBrowser.jsx |
| `mission-start` | missionSystem.js | `{ mission }` | DeliveryBanner.jsx, WorldScene |
| `mission-complete` | missionSystem.js | `{ mission, hearts }` | DeliveryBanner.jsx, WorldScene |
| `npc-book-request` | missionSystem.js | `{ npcId, npcName, bookTopic }` | TaskBubble.jsx (shows request instead of word task) |
| `enter-library` | WorldScene | — | App.jsx (to show/hide library-specific UI) |
| `exit-library` | LibraryScene | — | App.jsx |

## Interactions
- **Click a bookshelf:** Emits `shelf-click`. React `BookBrowser` component opens showing books on that shelf. Each book shows its cover with title and colored spine. Locked books appear grayed with a padlock.
- **Click the librarian:** Emits `librarian-interact`. `BookBrowser` component shows a dialogue menu:
  - "Borrow a book" — shows available books (disabled if already carrying one)
  - "Return a book" — returns the currently borrowed book (disabled if not carrying one)
  - "Any deliveries?" — librarian assigns a delivery mission (see Missions below)
- **Read a borrowed book:** A "Read" button appears in the HUD when the player has a borrowed book (visible in both WorldScene and LibraryScene). Clicking it emits `read-book` and opens `BookReader`. Completing the puzzles earns hearts (same 3/2/1 system based on attempts).

## Borrowing
- **Max 1 book** borrowed at a time
- **Tracked in save data:** `borrowedBook: null | { id, title }` added to `DEFAULT_SAVE` in `saveSystem.js`
- **No overdue system** — kids can keep a book as long as they want

## Delivery Missions

### Type 1: Librarian Assigns
- When the player clicks "Any deliveries?", `missionSystem.js` picks a random unlocked NPC (from `save.unlockedNpcs`) and a random unlocked book not currently borrowed.
- If `save.activeMission` is not null, the librarian says "You already have a delivery!"
- The book is automatically set as `borrowedBook` and the mission starts.
- Emits `mission-start`.

### Type 2: NPC Requests
- **Which NPCs:** Any unlocked NPC can request a book.
- **Trigger:** 20% chance on NPC click (checked before the word task in `TaskBubble.jsx`). If triggered, emits `npc-book-request` instead of opening a word task. Only triggers if `save.activeMission` is null and `save.borrowedBook` is null.
- **Flow:** NPC says "Can you bring me a book about [topic]?" → mission starts with type `fetch` → player goes to library → borrows the matching book → walks back to NPC → delivery completes.

### Delivery UX
- **HUD banner** (React `DeliveryBanner` component): "Deliver '[Book Title]' to [NPC Name]!" — positioned at top-center, below the mini map area.
- **Mini map indicator:** In `WorldScene._mmOverlay`, draw a blinking dot at the target NPC position in a distinct color (e.g., `0xff5722` orange).
- **Completion:** In `WorldScene`, when the player overlaps with the target NPC sprite while `activeMission` matches, `missionSystem.completeDelivery()` is called.
- **Reward:** Always 3 hearts per delivery (no attempt-based scaling — deliveries are effort-based, not accuracy-based). Plus a random praise message.

## Save Data Additions
All fields added to `DEFAULT_SAVE` in `saveSystem.js`:
```js
{
  borrowedBook: null,        // { id, title } or null
  activeMission: null,       // { type, bookId, targetNpcId, targetNpcName, bookTopic } or null
  unlockedBooks: [1,2,3,4],  // array of book IDs (starts with 4)
  completedDeliveries: 0,    // total deliveries completed
  booksRead: [],             // array of book IDs that have been read/completed
}
```

## New Files
- `src/game/scenes/LibraryScene.js` — Phaser scene for library interior (procedural graphics, player instance, shelf/librarian interactives, exit zone)
- `src/data/books.js` — Book definitions array: `{ id, title, spineColor, story, puzzleWords, difficulty }`
- `src/ui/components/BookBrowser/BookBrowser.jsx` — React overlay for browsing books + librarian dialogue
- `src/ui/components/BookBrowser/BookBrowser.module.css`
- `src/ui/components/BookReader/BookReader.jsx` — React overlay for reading a book (story + word puzzles)
- `src/ui/components/BookReader/BookReader.module.css`
- `src/ui/components/DeliveryBanner/DeliveryBanner.jsx` — HUD banner for active delivery missions
- `src/ui/components/DeliveryBanner/DeliveryBanner.module.css`
- `src/logic/missionSystem.js` — Exported functions:
  - `assignDelivery(save)` → `{ mission, book }` or null
  - `generateNpcRequest(save, npcId)` → `{ mission, bookTopic }` or null
  - `completeDelivery(save)` → updated save with hearts added, mission cleared, completedDeliveries incremented
  - `checkBookUnlocks(save)` → array of newly unlockable book IDs based on totalHearts

## Modified Files
- `src/game/PhaserGame.jsx` — Add `LibraryScene` to scene list
- `src/logic/saveSystem.js` — Add new fields to `DEFAULT_SAVE`
- `src/App.jsx` — Mount `BookBrowser`, `BookReader`, `DeliveryBanner` components
- `src/ui/components/TaskBubble/TaskBubble.jsx` — Add 20% branch for NPC book requests
- `src/game/scenes/WorldScene.js` — Add library door overlap zone, delivery completion overlap, mission mini map indicator

## Out of Scope
- Multiple simultaneous borrowed books
- Book ratings or reviews
- Writing/creating books
- Multiplayer book sharing
- Overdue/penalty system
- Library card system
