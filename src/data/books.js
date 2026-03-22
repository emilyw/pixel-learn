export const BOOKS = [
  {
    id: 1, title: 'Animal Friends', spineColor: 0xef5350,
    story: 'The little ___ played in the garden. A ___ flew over the trees. They became best friends.',
    puzzleWords: ['cat', 'bird'],
  },
  {
    id: 2, title: 'Colors of the Rainbow', spineColor: 0x42a5f5,
    story: 'The sky turned ___ after the rain. A ___ flower grew by the path. Everything was so bright!',
    puzzleWords: ['blue', 'red'],
  },
  {
    id: 3, title: 'The Brave Knight', spineColor: 0x66bb6a,
    story: 'The knight had a shiny ___. He rode his horse to the ___. The dragon was actually friendly!',
    puzzleWords: ['star', 'hill'],
  },
  {
    id: 4, title: 'Under the Sea', spineColor: 0x26c6da,
    story: 'A ___ swam through the coral. It found a shiny ___. The ocean was full of wonders.',
    puzzleWords: ['fish', 'shell'],
  },
  {
    id: 5, title: 'The Magic Garden', spineColor: 0xab47bc,
    story: 'A tall ___ grew overnight. Its ___ were golden. The whole village came to see it.',
    puzzleWords: ['tree', 'leaf'],
  },
  {
    id: 6, title: 'Sunny Day Out', spineColor: 0xffa726,
    story: 'The ___ was warm and bright. Kids played with a ___ in the park. What a fun day!',
    puzzleWords: ['sun', 'ball'],
  },
  {
    id: 7, title: 'The Cozy Bakery', spineColor: 0xec407a,
    story: 'Fresh ___ cooled on the shelf. The baker made a big ___. It smelled delicious!',
    puzzleWords: ['bread', 'cake'],
  },
  {
    id: 8, title: 'Rainy Day', spineColor: 0x78909c,
    story: 'Drops of ___ fell on the roof. A ___ jumped in every puddle. Splash!',
    puzzleWords: ['rain', 'frog'],
  },
  {
    id: 9, title: 'The Flower Meadow', spineColor: 0xe91e63,
    story: 'A beautiful ___ bloomed in spring. A ___ buzzed from flower to flower. The meadow was alive!',
    puzzleWords: ['rose', 'bee'],
  },
  {
    id: 10, title: 'Sports Day', spineColor: 0xff5722,
    story: 'Everyone lined up to ___. They had to ___ over the hurdles. The crowd cheered loudly!',
    puzzleWords: ['run', 'jump'],
  },
  {
    id: 11, title: 'The Night Sky', spineColor: 0x311b92,
    story: 'A bright ___ shone in the sky. The ___ was big and round. Owls hooted softly.',
    puzzleWords: ['star', 'moon'],
  },
  {
    id: 12, title: 'The Friendly Dragon', spineColor: 0x4caf50,
    story: 'The dragon breathed warm ___. It shared its ___ with the village. Everyone was happy!',
    puzzleWords: ['fire', 'gold'],
  },
]

export const BOOK_UNLOCK_THRESHOLDS = [
  { bookId: 5,  hearts: 8 },
  { bookId: 6,  hearts: 15 },
  { bookId: 7,  hearts: 25 },
  { bookId: 8,  hearts: 35 },
  { bookId: 9,  hearts: 45 },
  { bookId: 10, hearts: 55 },
  { bookId: 11, hearts: 65 },
  { bookId: 12, hearts: 80 },
]
