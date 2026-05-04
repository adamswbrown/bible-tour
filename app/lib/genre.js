// Genre classification for the 66 Protestant canonical books.
//
// This file lives in code (not in app/data/book-info.json) so that the
// taxonomy used by the Eagle Method's Stage 1 framing questions stays
// alongside the questions themselves and is easy to evolve.
//
// The book name keys here MUST match the canonical `BOOKS[i].book`
// strings exported from `app/lib/bible.js` (e.g. "I Samuel", "Song of
// Songs", "III John").

export const GENRES = Object.freeze([
  "law",
  "narrative",
  "wisdom",
  "psalm",
  "prophecy",
  "gospel",
  "acts",
  "epistle",
  "apocalyptic",
]);

export const DEFAULT_GENRE = "epistle";

export const GENRE_LABEL = Object.freeze({
  law: "Law",
  narrative: "Narrative",
  wisdom: "Wisdom",
  psalm: "Psalm",
  prophecy: "Prophecy",
  gospel: "Gospel",
  acts: "Acts",
  epistle: "Epistle",
  apocalyptic: "Apocalyptic",
});

export const BOOK_GENRES = Object.freeze({
  // Pentateuch / Torah — treated as "law" for the whole Pentateuch,
  // even though Genesis is largely narrative.
  Genesis: "law",
  Exodus: "law",
  Leviticus: "law",
  Numbers: "law",
  Deuteronomy: "law",

  // Old Testament narrative / historical books. Jonah lives here
  // (rather than under "prophecy") because the book itself is a story.
  Joshua: "narrative",
  Judges: "narrative",
  Ruth: "narrative",
  "I Samuel": "narrative",
  "II Samuel": "narrative",
  "I Kings": "narrative",
  "II Kings": "narrative",
  "I Chronicles": "narrative",
  "II Chronicles": "narrative",
  Ezra: "narrative",
  Nehemiah: "narrative",
  Esther: "narrative",
  Jonah: "narrative",

  // Wisdom literature.
  Job: "wisdom",
  Proverbs: "wisdom",
  Ecclesiastes: "wisdom",
  "Song of Songs": "wisdom",

  // Psalter — its own bucket so the framing questions can address
  // poetry / prayer directly.
  Psalms: "psalm",

  // Prophets. Lamentations is grouped here because its lament is
  // tied to the prophetic indictment of Judah.
  Isaiah: "prophecy",
  Jeremiah: "prophecy",
  Lamentations: "prophecy",
  Ezekiel: "prophecy",
  Hosea: "prophecy",
  Joel: "prophecy",
  Amos: "prophecy",
  Obadiah: "prophecy",
  Micah: "prophecy",
  Nahum: "prophecy",
  Habakkuk: "prophecy",
  Zephaniah: "prophecy",
  Haggai: "prophecy",
  Zechariah: "prophecy",
  Malachi: "prophecy",

  // Apocalyptic. Daniel is here (not "narrative") because the
  // second half of Daniel is the structural anchor of the book.
  Daniel: "apocalyptic",
  Revelation: "apocalyptic",

  // Gospels.
  Matthew: "gospel",
  Mark: "gospel",
  Luke: "gospel",
  John: "gospel",

  // Acts — its own bucket so the questions can foreground the
  // movement of the gospel + the Spirit.
  Acts: "acts",

  // New Testament epistles. Hebrews is treated as an epistle here
  // since its argument-flow shape matches the epistle questions
  // better than any other genre.
  Romans: "epistle",
  "I Corinthians": "epistle",
  "II Corinthians": "epistle",
  Galatians: "epistle",
  Ephesians: "epistle",
  Philippians: "epistle",
  Colossians: "epistle",
  "I Thessalonians": "epistle",
  "II Thessalonians": "epistle",
  "I Timothy": "epistle",
  "II Timothy": "epistle",
  Titus: "epistle",
  Philemon: "epistle",
  Hebrews: "epistle",
  James: "epistle",
  "I Peter": "epistle",
  "II Peter": "epistle",
  "I John": "epistle",
  "II John": "epistle",
  "III John": "epistle",
  Jude: "epistle",
});

export function getBookGenre(bookName) {
  return BOOK_GENRES[bookName] || DEFAULT_GENRE;
}

export function getGenreLabel(genre) {
  return GENRE_LABEL[genre] || GENRE_LABEL[DEFAULT_GENRE];
}

// The three framing questions per genre. Each genre keeps the
// Eagle Method's "three questions" shape and the existing UI
// labels ("Question 1", "Question 2", "Question 3"). Each prompt
// is intentionally short (under ~110 chars) and tries to push the
// reader to do something native to that genre.
export const SURVEY_QUESTIONS = Object.freeze({
  law: [
    { label: "Question 1", prompt: "Whose covenant is being made, and on what terms?" },
    { label: "Question 2", prompt: "What does this command teach about God's character?" },
    { label: "Question 3", prompt: "How does this people-shaping law foreshadow Christ?" },
  ],
  narrative: [
    { label: "Question 1", prompt: "Where are we in the bigger story of Israel right now?" },
    { label: "Question 2", prompt: "Who are the key characters, and what are they doing right or wrong?" },
    { label: "Question 3", prompt: "What is the narrator pointing us to about God?" },
  ],
  wisdom: [
    { label: "Question 1", prompt: "Who is being addressed — the simple, the wise, or the suffering?" },
    { label: "Question 2", prompt: "What does this section say about the fear of the Lord?" },
    { label: "Question 3", prompt: "How does this challenge the way I currently live?" },
  ],
  psalm: [
    { label: "Question 1", prompt: "What kind of psalm is this — lament, praise, thanksgiving, or royal?" },
    { label: "Question 2", prompt: "What is the speaker's emotional movement from start to finish?" },
    { label: "Question 3", prompt: "How would I pray this back to God today?" },
  ],
  prophecy: [
    { label: "Question 1", prompt: "What sin is being indicted, and against which covenant?" },
    { label: "Question 2", prompt: "What judgment and what promise are tied together here?" },
    { label: "Question 3", prompt: "How does the messianic horizon reach into this oracle?" },
  ],
  apocalyptic: [
    { label: "Question 1", prompt: "Who is the audience, and what crisis are they in?" },
    { label: "Question 2", prompt: "How is the imagery encoding heavenly reality, not predicting headlines?" },
    { label: "Question 3", prompt: "What hope is being given to people who feel powerless?" },
  ],
  gospel: [
    { label: "Question 1", prompt: "What is this Gospel writer's distinct angle on Jesus?" },
    { label: "Question 2", prompt: "What is Jesus saying or doing — and how do witnesses react?" },
    { label: "Question 3", prompt: "What does this scene show me about the Kingdom?" },
  ],
  acts: [
    { label: "Question 1", prompt: "Where is the gospel moving geographically and ethnically?" },
    { label: "Question 2", prompt: "How is the Spirit driving the action?" },
    { label: "Question 3", prompt: "What pattern of suffering plus witness keeps repeating?" },
  ],
  epistle: [
    { label: "Question 1", prompt: "Who wrote it, to whom, and what problem are they fixing?" },
    { label: "Question 2", prompt: "What is the argument's logic — what claim, what reason, what therefore?" },
    { label: "Question 3", prompt: "What does this letter call this church (and me) to do?" },
  ],
});

// Fallback used when a book is not in BOOK_GENRES at all. Mirrors the
// pre-genre Eagle Method default so behavior degrades gracefully.
export const FALLBACK_SURVEY_QUESTIONS = Object.freeze([
  { label: "Question 1", prompt: "Who wrote it, and when?" },
  { label: "Question 2", prompt: "Who were the original audience?" },
  { label: "Question 3", prompt: "What is the purpose of the book?" },
]);

export function getSurveyQuestions(bookName) {
  const genre = BOOK_GENRES[bookName];
  if (!genre) return FALLBACK_SURVEY_QUESTIONS;
  return SURVEY_QUESTIONS[genre] || FALLBACK_SURVEY_QUESTIONS;
}
