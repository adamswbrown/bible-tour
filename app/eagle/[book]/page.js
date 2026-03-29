import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BOOKS, BOOKS_BY_SLUG, parsePlanRefs } from "../../lib/bible";
import {
  CHAPTER_SUMMARY_ATTRIBUTION,
  CHAPTER_SUMMARY_SOURCE,
  getChapterSummaries,
  getLocalBookInfo,
  hasMeaningfulBookInfo,
} from "../../lib/book-data";
import { getIqBookInfo, getIqVerseCount } from "../../lib/iq-bible";
import MarkStudiedButton from "./MarkStudiedButton";
import VersePreviewPanel from "./VersePreviewPanel";

const C = {
  sand: "#f6f1e5",
  paper: "#fffdf7",
  ink: "#162636",
  muted: "#597083",
  line: "rgba(22, 38, 54, 0.14)",
  teal: "#1b3a4b",
  tealLight: "#2a5568",
  gold: "#f3bf21",
  goldSoft: "#fde9a6",
  green: "#1f6b4b",
  greenSoft: "rgba(31, 107, 75, 0.11)",
  shadow: "0 18px 60px rgba(22, 38, 54, 0.12)",
};

export function generateStaticParams() {
  return BOOKS.map(({ slug }) => ({ book: slug }));
}

export async function generateMetadata({ params }) {
  const { book } = await params;
  const entry = BOOKS_BY_SLUG[book];
  if (!entry) {
    return {
      title: "Eagle Method",
    };
  }

  return {
    title: `${entry.book} | Eagle Method`,
    description: `Survey the river, map the reading-plan verses, and follow the current through ${entry.book}.`,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatWindowLabel(start, end) {
  return start === end ? `Chapter ${start}` : `Chapters ${start}-${end}`;
}

function getBookTrack(ref, chapterCount) {
  if (!chapterCount || !ref.isStructured) return null;

  const left = ((ref.startChapter - 1) / chapterCount) * 100;
  const width = ((ref.endChapter - ref.startChapter + 1) / chapterCount) * 100;

  return {
    left: `${clamp(left, 0, 100)}%`,
    width: `${Math.max(width, 100 / chapterCount)}%`,
  };
}

function getVerseTrack(ref, verseCounts) {
  if (!ref.isStructured || ref.kind === "chapter-span") return null;

  if (ref.startChapter !== ref.endChapter) {
    const startCount = verseCounts[ref.startChapter];
    const endCount = verseCounts[ref.endChapter];
    if (!startCount || !endCount) return null;

    return {
      kind: "split",
      startLabel: `Starts at verse ${ref.startVerse} of ${startCount} in chapter ${ref.startChapter}`,
      endLabel: `Ends at verse ${ref.endVerse} of ${endCount} in chapter ${ref.endChapter}`,
      startWidth: `${clamp(((startCount - ref.startVerse + 1) / startCount) * 100, 4, 100)}%`,
      endWidth: `${clamp((ref.endVerse / endCount) * 100, 4, 100)}%`,
    };
  }

  const verseCount = verseCounts[ref.startChapter];
  if (!verseCount) return null;

  const left = ((ref.startVerse - 1) / verseCount) * 100;
  const width = ((ref.endVerse - ref.startVerse + 1) / verseCount) * 100;
  const isSingleVerse = ref.startVerse === ref.endVerse;

  return {
    kind: "single",
    label: isSingleVerse
      ? `Verse ${ref.startVerse} of ${verseCount} in chapter ${ref.startChapter}`
      : `Verses ${ref.startVerse}-${ref.endVerse} of ${verseCount} in chapter ${ref.startChapter}`,
    left: `${clamp(left, 0, 100)}%`,
    width: `${Math.max(width, 100 / verseCount)}%`,
  };
}

function getReferenceLocation(ref, chapterCount, verseCounts) {
  if (!ref.isStructured) {
    return "This reading plan item is qualitative, so mark it manually in your Bible.";
  }

  if (ref.kind === "chapter-span") {
    return `Covers chapters ${ref.startChapter}-${ref.endChapter} of ${chapterCount}.`;
  }

  if (ref.startChapter !== ref.endChapter) {
    const startCount = verseCounts[ref.startChapter];
    const endCount = verseCounts[ref.endChapter];
    if (startCount && endCount) {
      return `Runs from verse ${ref.startVerse} of ${startCount} in chapter ${ref.startChapter} to verse ${ref.endVerse} of ${endCount} in chapter ${ref.endChapter}.`;
    }

    return `Runs from chapter ${ref.startChapter} into chapter ${ref.endChapter}.`;
  }

  const verseCount = verseCounts[ref.startChapter];
  if (!verseCount) {
    return `Falls in chapter ${ref.startChapter} of ${chapterCount}.`;
  }

  if (ref.startVerse === ref.endVerse) {
    return `Sits at verse ${ref.startVerse} of ${verseCount} in chapter ${ref.startChapter}.`;
  }

  return `Spans verses ${ref.startVerse}-${ref.endVerse} of ${verseCount} in chapter ${ref.startChapter}.`;
}

function buildContextWindows(refs, chapterCount) {
  const windows = refs
    .filter((ref) => ref.isStructured)
    .map((ref) => {
      if (ref.kind === "chapter-span") {
        return { start: ref.startChapter, end: ref.endChapter };
      }

      return {
        start: Math.max(1, ref.startChapter - 1),
        end: Math.min(chapterCount, ref.endChapter + 1),
      };
    })
    .sort((a, b) => a.start - b.start);

  return windows.reduce((acc, window) => {
    const last = acc[acc.length - 1];
    if (!last || window.start > last.end + 1) {
      acc.push({ ...window });
      return acc;
    }

    last.end = Math.max(last.end, window.end);
    return acc;
  }, []);
}

function buildChapterHits(refs) {
  return refs.reduce((acc, ref) => {
    if (!ref.isStructured) return acc;

    for (let chapter = ref.startChapter; chapter <= ref.endChapter; chapter += 1) {
      if (!acc[chapter]) acc[chapter] = [];
      acc[chapter].push(ref.text);
    }

    return acc;
  }, {});
}

function getBookInfoFields(bookInfo) {
  return [
    { label: "Author", value: bookInfo?.author },
    { label: "Date", value: bookInfo?.date },
    { label: "Audience", value: bookInfo?.audience },
    { label: "Purpose", value: bookInfo?.purpose },
    { label: "Genre", value: bookInfo?.genre },
  ].filter(({ value }) => value);
}

function getBookIntro(bookInfo) {
  return bookInfo?.introduction_long || bookInfo?.introduction || bookInfo?.summary || bookInfo?.intro || null;
}

// Trim Wikipedia prose to first 2–3 sentences, max ~420 chars
function trimIntro(text, maxChars = 420) {
  if (!text) return null;
  const firstPara = text.split("\n\n")[0];
  if (firstPara.length <= maxChars) return firstPara;
  const cut = firstPara.slice(0, maxChars).lastIndexOf(". ");
  return cut > 150 ? firstPara.slice(0, cut + 1) : firstPara.slice(0, maxChars) + "\u2026";
}

export default async function EagleBookPage({ params }) {
  const { book } = await params;
  const entry = BOOKS_BY_SLUG[book];
  if (!entry) notFound();

  const parsedRefs = parsePlanRefs(entry.refs);
  const chapterSummaries = getChapterSummaries(entry.book);
  const chapterCount = chapterSummaries.length;
  const localBookInfo = getLocalBookInfo(entry.book);
  const remoteBookInfo = hasMeaningfulBookInfo(localBookInfo) ? null : await getIqBookInfo(entry.id);
  const bookInfo = { ...(remoteBookInfo || {}), ...(localBookInfo || {}) };
  const infoFields = getBookInfoFields(bookInfo);
  const intro = getBookIntro(bookInfo);
  const chapterHits = buildChapterHits(parsedRefs);
  const contextWindows = buildContextWindows(parsedRefs, chapterCount);
  const verseCountChapters = [...new Set(
    parsedRefs
      .filter((ref) => ref.isStructured && ref.kind !== "chapter-span")
      .flatMap((ref) => [ref.startChapter, ref.endChapter])
  )];

  const verseCounts = Object.fromEntries(
    (
      await Promise.all(
        verseCountChapters.map(async (chapter) => [chapter, await getIqVerseCount(entry.id, chapter)])
      )
    ).filter(([, count]) => Number.isFinite(count))
  );

  const currentIndex = BOOKS.findIndex(({ book }) => book === entry.book);
  const previousBook = currentIndex > 0 ? BOOKS[currentIndex - 1] : null;
  const nextBook = currentIndex < BOOKS.length - 1 ? BOOKS[currentIndex + 1] : null;

  return (
    <main className="eagle-shell">
      <style>{`
        .eagle-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(243, 191, 33, 0.28), transparent 26rem),
            linear-gradient(180deg, ${C.paper} 0%, ${C.sand} 100%);
          color: ${C.ink};
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .eagle-link {
          color: ${C.teal};
          text-decoration: none;
        }
        .eagle-link:hover {
          color: ${C.tealLight};
        }
        .eagle-wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 20px 64px;
        }
        .eagle-topbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 14px;
          color: ${C.muted};
          margin-bottom: 24px;
        }
        .eagle-hero {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid ${C.line};
          border-radius: 28px;
          padding: 28px;
          box-shadow: ${C.shadow};
          margin-bottom: 28px;
        }
        .eagle-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${C.tealLight};
          margin-bottom: 12px;
        }
        .eagle-kicker::before {
          content: "";
          width: 38px;
          height: 2px;
          background: ${C.gold};
          border-radius: 999px;
        }
        .eagle-title {
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: clamp(42px, 8vw, 72px);
          line-height: 0.95;
          margin: 0 0 14px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .eagle-subtitle {
          max-width: 62ch;
          margin: 0;
          font-size: 18px;
          line-height: 1.6;
          color: ${C.muted};
        }
        .eagle-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }
        .eagle-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(27, 58, 75, 0.06);
          border: 1px solid rgba(27, 58, 75, 0.12);
          color: ${C.teal};
          font-size: 14px;
          font-weight: 600;
        }
        .eagle-section {
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid ${C.line};
          border-radius: 24px;
          padding: 24px;
          box-shadow: ${C.shadow};
        }
        .eagle-section-head {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .eagle-stage {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: ${C.teal};
          color: white;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 22px;
          flex-shrink: 0;
        }
        .eagle-head-copy {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          flex: 1;
          min-width: 280px;
        }
        .eagle-heading {
          margin: 0 0 6px;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 30px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .eagle-desc {
          margin: 0;
          max-width: 65ch;
          line-height: 1.65;
          color: ${C.muted};
        }
        .eagle-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .eagle-fact {
          padding: 16px;
          border-radius: 18px;
          background: ${C.paper};
          border: 1px solid rgba(27, 58, 75, 0.1);
        }
        .eagle-fact-label {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${C.tealLight};
        }
        .eagle-fact-value {
          margin: 0;
          line-height: 1.6;
        }
        .eagle-intro {
          margin-top: 20px;
          padding: 20px 22px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(243, 191, 33, 0.14), rgba(243, 191, 33, 0.04));
          border: 1px solid rgba(243, 191, 33, 0.34);
          border-left: 3px solid rgba(243, 191, 33, 0.7);
          font-size: 17px;
          line-height: 1.75;
          color: #162636;
          max-width: 202ch;
        }
        .eagle-intro-source {
          margin-top: 10px;
          font-size: 12px;
          color: #597083;
          font-family: system-ui, sans-serif;
        }
        .eagle-intro-source a {
          color: #597083;
        }
        .eagle-questions {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          margin-bottom: 4px;
        }
        .eagle-q {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(27, 58, 75, 0.04);
          border: 1px solid rgba(27, 58, 75, 0.09);
        }
        .eagle-q-label {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #597083;
          font-family: system-ui, sans-serif;
        }
        .eagle-q-prompt {
          margin: 0;
          font-size: 14px;
          line-height: 1.55;
          color: #162636;
          font-style: italic;
        }
        .eagle-empty {
          margin: 0;
          padding: 18px 20px;
          border-radius: 18px;
          background: rgba(27, 58, 75, 0.05);
          color: ${C.muted};
          line-height: 1.7;
        }
        .eagle-map-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          margin-bottom: 18px;
        }
        .eagle-map-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(27, 58, 75, 0.12);
          background: ${C.paper};
          font-size: 14px;
          font-weight: 700;
          color: ${C.muted};
        }
        .eagle-map-pill.is-hit {
          background: ${C.goldSoft};
          border-color: rgba(243, 191, 33, 0.45);
          color: ${C.teal};
        }
        .eagle-targets {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .eagle-target-card {
          padding: 18px;
          border-radius: 18px;
          background: ${C.paper};
          border: 1px solid rgba(27, 58, 75, 0.1);
        }
        .eagle-target-title {
          margin: 0 0 8px;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 26px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .eagle-target-copy {
          margin: 0 0 14px;
          line-height: 1.65;
          color: ${C.muted};
        }
        .eagle-track {
          position: relative;
          height: 14px;
          border-radius: 999px;
          background: rgba(27, 58, 75, 0.09);
          overflow: hidden;
          margin-bottom: 10px;
        }
        .eagle-track-fill {
          position: absolute;
          top: 0;
          bottom: 0;
          border-radius: 999px;
          background: linear-gradient(90deg, ${C.gold}, #ffda71);
        }
        .eagle-track-fill.is-current {
          background: linear-gradient(90deg, ${C.green}, #36a36f);
        }
        .eagle-track-row {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr 1fr;
          margin-bottom: 8px;
        }
        .eagle-track-note {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: ${C.muted};
        }
        .eagle-track-note strong {
          color: ${C.ink};
        }
        .eagle-current-stack {
          display: grid;
          gap: 18px;
        }
        .eagle-window {
          padding: 18px;
          border-radius: 20px;
          background: ${C.paper};
          border: 1px solid rgba(27, 58, 75, 0.1);
        }
        .eagle-window-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .eagle-window-title {
          margin: 0;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 24px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .eagle-window-label {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.tealLight};
        }
        .eagle-summary-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .eagle-summary-card {
          padding: 16px;
          border-radius: 18px;
          background: white;
          border: 1px solid rgba(27, 58, 75, 0.1);
        }
        .eagle-summary-card.is-hit {
          background: linear-gradient(135deg, rgba(243, 191, 33, 0.16), rgba(255, 255, 255, 1));
          border-color: rgba(243, 191, 33, 0.38);
          box-shadow: inset 0 0 0 1px rgba(243, 191, 33, 0.14);
        }
        .eagle-summary-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .eagle-summary-title {
          margin: 0;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 22px;
          text-transform: uppercase;
        }
        .eagle-summary-badge {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 999px;
          background: ${C.greenSoft};
          color: ${C.green};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .eagle-summary-text {
          margin: 0;
          line-height: 1.65;
        }
        .eagle-ref-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .eagle-ref {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(27, 58, 75, 0.06);
          border: 1px solid rgba(27, 58, 75, 0.12);
          font-size: 12px;
          font-weight: 700;
          color: ${C.teal};
        }
        /* Step strip */
        .eagle-steps {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.7);
          border: 1px solid ${C.line};
          border-radius: 18px;
          padding: 4px;
          box-shadow: 0 4px 16px rgba(22,38,54,0.06);
          overflow: hidden;
        }
        .eagle-step {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 6px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
          color: ${C.muted};
          text-decoration: none;
        }
        .eagle-step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(22,38,54,0.08);
          font-family: "Oswald", sans-serif;
          font-size: 14px;
          color: ${C.muted};
          flex-shrink: 0;
          transition: all .15s;
        }
        .eagle-step-label { letter-spacing: 0.06em; text-transform: uppercase; }
        .eagle-step-arrow {
          font-size: 14px;
          color: rgba(22,38,54,0.18);
          flex-shrink: 0;
          margin: 0 -2px;
        }
        @media (max-width: 480px) {
          .eagle-step-label { display: none; }
          .eagle-step { padding: 10px 2px; }
        }

        /* Next-step nudge */
        .eagle-next-nudge {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid ${C.line};
          font-size: 13px;
          font-weight: 700;
          color: ${C.tealLight};
          letter-spacing: 0.04em;
        }
        .eagle-next-nudge span {
          text-transform: uppercase;
        }
        .eagle-next-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${C.gold};
          color: ${C.ink};
          font-family: "Oswald", sans-serif;
          font-size: 13px;
          font-weight: 700;
        }

        .eagle-footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 24px;
          color: ${C.muted};
          font-size: 14px;
        }
        .eagle-nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .eagle-nav a {
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(27, 58, 75, 0.12);
          background: rgba(255, 255, 255, 0.78);
          color: ${C.teal};
          text-decoration: none;
          font-weight: 700;
        }
        .eagle-nav a:hover {
          background: ${C.goldSoft};
        }
        /* iPad — comfortable reading experience */
        @media (min-width: 768px) and (max-width: 1100px) {
          .eagle-wrap { padding: 24px 24px 56px; max-width: 900px; }
          .eagle-hero, .eagle-section { padding: 32px 36px; }
          .eagle-book-intro { font-size: 17px; line-height: 1.8; }
          .eagle-summary-text { font-size: 16px; line-height: 1.75; }
          .eagle-steps { margin-bottom: 24px; }
          .eagle-step { padding: 14px 10px; font-size: 15px; }
        }

        @media (max-width: 720px) {
          .eagle-wrap {
            padding: 18px 14px 52px;
          }
          .eagle-hero,
          .eagle-section {
            padding: 20px;
            border-radius: 22px;
          }
          .eagle-track-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="eagle-wrap">
        <div className="eagle-topbar">
          <div>
            <Link className="eagle-link" href="/">Tour of the Bible</Link>
            {" / "}
            <Link className="eagle-link" href="/eagle">Eagle Method</Link>
          </div>
          <div>{entry.testament}</div>
        </div>

        <section className="eagle-hero">
          <div className="eagle-kicker">Eagle Method</div>
          <h1 className="eagle-title">{entry.book}</h1>
          <p className="eagle-subtitle">
            Survey the river, map the reading-plan targets, and follow the current around the verses
            that anchor this book in the tour.
          </p>
          <div className="eagle-chip-row">
            <span className="eagle-chip">Reading plan: {entry.refs}</span>
            <span className="eagle-chip">{chapterCount} chapters in view</span>
            {entry.note ? <span className="eagle-chip">{entry.note}</span> : null}
          </div>
        </section>

        {/* Step strip */}
        <div className="eagle-steps">
          {[
            { num: "1", label: "Survey", anchor: "stage-1" },
            { num: "2", label: "Map", anchor: "stage-2" },
            { num: "3", label: "Current", anchor: "stage-3" },
          ].map((s, i) => (
            <Fragment key={s.num}>
              {i > 0 && <span className="eagle-step-arrow">›</span>}
              <a className="eagle-step" href={`#${s.anchor}`}>
                <span className="eagle-step-num">{s.num}</span>
                <span className="eagle-step-label">{s.label}</span>
              </a>
            </Fragment>
          ))}
        </div>

        <section className="eagle-section" id="stage-1">
          <div className="eagle-section-head">
            <div className="eagle-head-copy">
              <div className="eagle-stage">1</div>
              <div>
                <h2 className="eagle-heading">Survey The River</h2>
                <p className="eagle-desc">
                  Build the lens first: who wrote the book, when it was written, who heard it first,
                  and why it exists.
                </p>
              </div>
            </div>
          </div>

          <div className="eagle-questions">
            {[
              { label: "Question 1", prompt: "Who wrote it, and when?" },
              { label: "Question 2", prompt: "Who were the original audience?" },
              { label: "Question 3", prompt: "What is the purpose of the book?" },
            ].map((q) => (
              <div className="eagle-q" key={q.label}>
                <p className="eagle-q-label">{q.label}</p>
                <p className="eagle-q-prompt">{q.prompt}</p>
              </div>
            ))}
          </div>

          {infoFields.length ? (
            <div className="eagle-grid" style={{ marginTop: 14 }}>
              {infoFields.map((field) => (
                <article className="eagle-fact" key={field.label}>
                  <p className="eagle-fact-label">{field.label}</p>
                  <p className="eagle-fact-value">{field.value}</p>
                </article>
              ))}
            </div>
          ) : null}
          {intro ? (
            <>
              <p className="eagle-intro">{trimIntro(intro)}</p>
              <p className="eagle-intro-source">
                Source: <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(entry.book)}`} target="_blank" rel="noreferrer">Wikipedia</a> · CC BY-SA 4.0
              </p>
            </>
          ) : null}
          {!infoFields.length && !intro ? (
            <p className="eagle-empty">
              No overview data is available for this book yet. Populate
              <code> app/data/book-info.json </code>
              or configure <code>IQ_BIBLE_API_KEY</code> to fill in the author, audience, purpose,
              and introduction.
            </p>
          ) : null}
          <div className="eagle-next-nudge">
            <span>Next: Map the verse</span>
            <span className="eagle-next-badge">2</span>
            <a href="#stage-2" style={{ color: C.gold, fontSize: 18, lineHeight: 1 }}>↓</a>
          </div>
        </section>

        <section className="eagle-section" id="stage-2">
          <div className="eagle-section-head">
            <div className="eagle-head-copy">
              <div className="eagle-stage">2</div>
              <div>
                <h2 className="eagle-heading">Map The River</h2>
                <p className="eagle-desc">
                  Mark the chapters, find the target verse inside its chapter, and remember where that
                  moment lives in the book.
                </p>
              </div>
            </div>
          </div>

          <VersePreviewPanel book={entry.book} refs={parsedRefs} />

          <div className="eagle-map-grid">
            {Array.from({ length: chapterCount }, (_, index) => {
              const chapter = index + 1;
              const isHit = Boolean(chapterHits[chapter]?.length);
              return (
                <div className={`eagle-map-pill${isHit ? " is-hit" : ""}`} key={chapter}>
                  {chapter}
                </div>
              );
            })}
          </div>

          <div className="eagle-targets">
            {parsedRefs.map((ref) => {
              const bookTrack = getBookTrack(ref, chapterCount);
              const verseTrack = getVerseTrack(ref, verseCounts);

              return (
                <article className="eagle-target-card" key={ref.text}>
                  <h3 className="eagle-target-title">{ref.text}</h3>
                  <p className="eagle-target-copy">{getReferenceLocation(ref, chapterCount, verseCounts)}</p>

                  {bookTrack ? (
                    <>
                      <div className="eagle-track">
                        <div className="eagle-track-fill" style={bookTrack} />
                      </div>
                      <p className="eagle-track-note">
                        <strong>Book position:</strong>{" "}
                        {ref.kind === "chapter-span"
                          ? `chapters ${ref.startChapter}-${ref.endChapter} of ${chapterCount}`
                          : ref.startChapter === ref.endChapter
                            ? `chapter ${ref.startChapter} of ${chapterCount}`
                            : `chapters ${ref.startChapter}-${ref.endChapter} of ${chapterCount}`}
                      </p>
                    </>
                  ) : null}

                  {verseTrack ? (
                    verseTrack.kind === "single" ? (
                      <>
                        <div className="eagle-track">
                          <div className="eagle-track-fill is-current" style={verseTrack} />
                        </div>
                        <p className="eagle-track-note">
                          <strong>Chapter position:</strong> {verseTrack.label}
                        </p>
                      </>
                    ) : (
                      <div className="eagle-track-row">
                        <div>
                          <div className="eagle-track">
                            <div
                              className="eagle-track-fill is-current"
                              style={{ left: `${100 - Number.parseFloat(verseTrack.startWidth)}%`, width: verseTrack.startWidth }}
                            />
                          </div>
                          <p className="eagle-track-note">
                            <strong>Start:</strong> {verseTrack.startLabel}
                          </p>
                        </div>
                        <div>
                          <div className="eagle-track">
                            <div className="eagle-track-fill is-current" style={{ left: "0%", width: verseTrack.endWidth }} />
                          </div>
                          <p className="eagle-track-note">
                            <strong>Finish:</strong> {verseTrack.endLabel}
                          </p>
                        </div>
                      </div>
                    )
                  ) : ref.isStructured && ref.kind !== "chapter-span" ? (
                    <p className="eagle-track-note">
                      Verse-level placement will appear automatically once IQ Bible verse counts are
                      available.
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="eagle-next-nudge">
            <span>Next: Follow the current</span>
            <span className="eagle-next-badge">3</span>
            <a href="#stage-3" style={{ color: C.gold, fontSize: 18, lineHeight: 1 }}>↓</a>
          </div>
        </section>

        <section className="eagle-section" id="stage-3">
          <div className="eagle-section-head">
            <div className="eagle-head-copy">
              <div className="eagle-stage">3</div>
              <div>
                <h2 className="eagle-heading">Follow The Current</h2>
                <p className="eagle-desc">
                  Trace the flow around each target chapter so the verse lands inside its surrounding
                  argument, story, or theme instead of floating loose.
                </p>
              </div>
            </div>
          </div>

          {contextWindows.length ? (
            <div className="eagle-current-stack">
              {contextWindows.map((window) => (
                <section className="eagle-window" key={`${window.start}-${window.end}`}>
                  <div className="eagle-window-head">
                    <h3 className="eagle-window-title">{formatWindowLabel(window.start, window.end)}</h3>
                    <span className="eagle-window-label">Context window</span>
                  </div>

                  <div className="eagle-summary-grid">
                    {chapterSummaries
                      .filter(({ chapter }) => chapter >= window.start && chapter <= window.end)
                      .map(({ chapter, summary }) => {
                        const refs = chapterHits[chapter] || [];
                        return (
                          <article
                            className={`eagle-summary-card${refs.length ? " is-hit" : ""}`}
                            key={chapter}
                          >
                            <div className="eagle-summary-head">
                              <h4 className="eagle-summary-title">Chapter {chapter}</h4>
                              {refs.length ? <span className="eagle-summary-badge">Target zone</span> : null}
                            </div>
                            <p className="eagle-summary-text">{summary}</p>
                            {refs.length ? (
                              <div className="eagle-ref-list">
                                {refs.map((ref) => (
                                  <span className="eagle-ref" key={`${chapter}-${ref}`}>
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="eagle-empty">No chapter context could be derived from this reading plan entry.</p>
          )}
        </section>

        <MarkStudiedButton book={entry.book} />

        <footer className="eagle-footer">
          <div>
            {CHAPTER_SUMMARY_ATTRIBUTION ? <div>{CHAPTER_SUMMARY_ATTRIBUTION}</div> : null}
            {CHAPTER_SUMMARY_SOURCE ? (
              <div>
                Source:{" "}
                <a className="eagle-link" href={CHAPTER_SUMMARY_SOURCE} target="_blank" rel="noreferrer">
                  {CHAPTER_SUMMARY_SOURCE}
                </a>
              </div>
            ) : null}
          </div>

          <nav className="eagle-nav">
            {previousBook ? (
              <Link href={`/eagle/${previousBook.slug}`}>Previous: {previousBook.book}</Link>
            ) : null}
            <Link href="/eagle">All books</Link>
            {nextBook ? <Link href={`/eagle/${nextBook.slug}`}>Next: {nextBook.book}</Link> : null}
          </nav>
        </footer>
      </div>
    </main>
  );
}
