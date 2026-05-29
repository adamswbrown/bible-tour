"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import { READING_PLAN, parsePlanRefs } from "../lib/bible";
import { getTranslation } from "../lib/translations";
import {
  loadMemory,
  memoryList,
  isSaved,
  addVerse,
  removeVerse,
  fadeWord,
  tokenizeVerse,
} from "../lib/memory";
import TourLinkButton from "../components/TourLinkButton";

const C = {
  sand: "#f6f1e5",
  paper: "#fffdf7",
  ink: "#162636",
  muted: "#597083",
  line: "rgba(22, 38, 54, 0.14)",
  teal: "#1b3a4b",
  tealLight: "#2A5568",
  gold: "#f3bf21",
  goldBg: "rgba(243,191,33,0.12)",
  goldBorder: "rgba(243,191,33,0.35)",
  green: "#1B6B3A",
  shadow: "0 18px 60px rgba(22, 38, 54, 0.12)",
};

const ESV_COPYRIGHT = getTranslation("esv").copyright;

// All the curated key verses, expanded into individual discrete references
// for the "browse by book" on-ramp. We skip the few fuzzy entries (e.g.
// "any five random proverbs from chapters 10-29") that aren't a single
// addressable passage.
const PICKER = Object.entries(READING_PLAN).map(([section, readings]) => ({
  section,
  books: readings.map(({ book, refs }) => ({
    book,
    refs: parsePlanRefs(refs)
      .filter((p) => p.isStructured && p.kind !== "chapter-span")
      .map((p) => p.text),
  })),
}));

const FADE_MODES = [
  { id: "full", label: "Full" },
  { id: "initials", label: "Initials" },
  { id: "blanks", label: "Blanks" },
];

// ── Practice surface ─────────────────────────────────────────────────────────
function PracticeCard({ entry, onClose, onPrev, onNext, hasPrev, hasNext, position }) {
  const { book, verseRef, ref } = entry;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState("full");
  const [peeked, setPeeked] = useState(() => new Set());

  // Reset the fade ladder and reveals whenever we move to a different verse.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setText(null);
    setMode("full");
    setPeeked(new Set());

    fetch(`/api/verse-esv?book=${encodeURIComponent(book)}&ref=${encodeURIComponent(verseRef)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.text) setText(data.text);
        else setError(true);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book, verseRef]);

  // Escape closes the practice overlay.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const togglePeek = useCallback((index) => {
    setPeeked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const lines = text ? tokenizeVerse(text) : [];

  return (
    <div className="mem-overlay" onClick={onClose}>
      <div className="mem-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Practice ${ref}`}>
        <div className="mem-card-head">
          <div>
            <div className="mem-card-kicker">Practice · {position}</div>
            <h2 className="mem-card-ref">{ref}</h2>
          </div>
          <button className="mem-card-close" onClick={onClose} aria-label="Close practice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mem-card-body">
          {loading && <p className="mem-status">Loading verse…</p>}

          {error && (
            <div className="mem-status">
              <p>Couldn’t load this verse right now.</p>
              <Link href="/" className="mem-inline-link">Read it on the Tour instead →</Link>
            </div>
          )}

          {text && (
            <>
              <div className="mem-verse" aria-live="polite">
                {lines.map((line, li) => (
                  <p key={li} className="mem-verse-line">
                    {line.map(({ word, index }) => {
                      const revealed = mode === "full" || peeked.has(index);
                      const display = revealed ? word : fadeWord(word, mode);
                      const tappable = mode !== "full";
                      return (
                        <span key={index}>
                          <span
                            className={`mem-word${tappable ? " mem-word-tappable" : ""}${
                              tappable && peeked.has(index) ? " mem-word-peeked" : ""
                            }`}
                            onClick={tappable ? () => togglePeek(index) : undefined}
                            role={tappable ? "button" : undefined}
                            tabIndex={tappable ? 0 : undefined}
                            onKeyDown={
                              tappable
                                ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      togglePeek(index);
                                    }
                                  }
                                : undefined
                            }
                          >
                            {display}
                          </span>{" "}
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>

              {mode !== "full" && (
                <p className="mem-hint">Tap any word to peek at it.</p>
              )}

              <div className="mem-fade-row" role="group" aria-label="Fade level">
                <span className="mem-fade-label">Fade</span>
                {FADE_MODES.map((m) => (
                  <button
                    key={m.id}
                    className={`mem-fade-btn${mode === m.id ? " mem-fade-active" : ""}`}
                    onClick={() => {
                      setMode(m.id);
                      setPeeked(new Set());
                    }}
                    aria-pressed={mode === m.id}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="mem-audio">
                <div className="mem-audio-row">
                  <span className="mem-audio-badge">ESV Audio</span>
                  <audio
                    key={`${book}-${verseRef}`}
                    controls
                    preload="none"
                    className="mem-audio-player"
                    src={`/api/verse-audio?book=${encodeURIComponent(book)}&ref=${encodeURIComponent(verseRef)}`}
                  >
                    Your browser doesn’t support audio playback.
                  </audio>
                </div>
              </div>

              <p className="mem-copyright">{ESV_COPYRIGHT}</p>
            </>
          )}
        </div>

        <div className="mem-card-nav">
          <button className="mem-nav-btn" onClick={onPrev} disabled={!hasPrev}>
            ‹ Prev
          </button>
          <button className="mem-nav-btn" onClick={onNext} disabled={!hasNext}>
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const [map, setMap] = useState({});
  const [mounted, setMounted] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setMap(loadMemory());
    setMounted(true);
  }, []);

  const list = memoryList(map);

  const remove = useCallback((book, verseRef) => {
    setMap(removeVerse(book, verseRef));
  }, []);

  const togglePick = useCallback((book, verseRef) => {
    setMap((prev) => {
      // prev is React state; consult localStorage for the source of truth
      return isSaved(prev, book, verseRef)
        ? removeVerse(book, verseRef)
        : addVerse(book, verseRef);
    });
  }, []);

  const closePractice = useCallback(() => setPracticeIndex(null), []);
  const goPrev = useCallback(() => setPracticeIndex((i) => (i > 0 ? i - 1 : i)), []);
  const goNext = useCallback(
    () => setPracticeIndex((i) => (i < list.length - 1 ? i + 1 : i)),
    [list.length]
  );

  // If the deck shrinks (a verse removed) while practising, keep the index valid.
  const safeIndex =
    practiceIndex != null && practiceIndex < list.length ? practiceIndex : null;
  const practiceEntry = safeIndex != null ? list[safeIndex] : null;

  return (
    <main className="mem-index">
      <style>{styles}</style>

      <div className="mem-wrap">
        <div className="mem-top">
          <div>
            <Link href="/">Tour of the Bible</Link>
            {" / "}Memory
          </div>
          {mounted && list.length > 0 && (
            <div style={{ color: C.muted }}>{list.length} saved</div>
          )}
        </div>

        <section className="mem-hero">
          <div className="mem-kicker">Memory</div>
          <h1 className="mem-title">Learn It By Heart</h1>
          <p className="mem-copy">
            A quiet place to memorise verses — no schedule, no streaks, no pressure.
            Fade the words down from full text to first letters to blanks, peek at any
            word you’re stuck on, and let the ESV audio settle it in your ear.
          </p>
        </section>

        {/* Deck */}
        <section className="mem-section">
          <div className="mem-section-head">
            <h2 className="mem-section-title">Your verses</h2>
            <button
              className="mem-add-toggle"
              onClick={() => setShowPicker((v) => !v)}
              aria-expanded={showPicker}
            >
              {showPicker ? "Done adding" : "+ Add verses"}
            </button>
          </div>

          {!mounted ? null : list.length === 0 ? (
            <div className="mem-empty">
              <p className="mem-empty-title">Your deck is empty.</p>
              <p className="mem-empty-sub">
                Open any verse in the Tour and tap <strong>☆ Memorize</strong> to save it
                here — or add some of the curated key verses below.
              </p>
              <button className="mem-empty-cta" onClick={() => setShowPicker(true)}>
                Browse key verses by book
              </button>
            </div>
          ) : (
            <ul className="mem-list">
              {list.map((entry, i) => (
                <li key={entry.ref} className="mem-list-item">
                  <span className="mem-list-ref">{entry.ref}</span>
                  <span className="mem-list-actions">
                    <button className="mem-practice-btn" onClick={() => setPracticeIndex(i)}>
                      ▶ Practice
                    </button>
                    <button
                      className="mem-remove-btn"
                      onClick={() => remove(entry.book, entry.verseRef)}
                      aria-label={`Remove ${entry.ref} from Memory`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Picker — browse the curated key verses by book */}
        {mounted && showPicker && (
          <section className="mem-section">
            <h2 className="mem-section-title" style={{ marginBottom: 6 }}>Key verses</h2>
            <p className="mem-picker-intro">
              The curated key verse for each book. Tap to add or remove from your deck.
            </p>
            {PICKER.map(({ section, books }) => (
              <div key={section} className="mem-picker-section">
                <h3 className="mem-picker-section-title">{section}</h3>
                <div className="mem-picker-books">
                  {books.map(({ book, refs }) => (
                    <div key={book} className="mem-picker-book">
                      <span className="mem-picker-book-name">{book}</span>
                      <span className="mem-picker-chips">
                        {refs.map((vr) => {
                          const on = isSaved(map, book, vr);
                          return (
                            <button
                              key={vr}
                              className={`mem-chip${on ? " mem-chip-on" : ""}`}
                              onClick={() => togglePick(book, vr)}
                              aria-pressed={on}
                            >
                              {on ? "✓ " : "+ "}{vr}
                            </button>
                          );
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {practiceEntry && (
        <PracticeCard
          entry={practiceEntry}
          position={`${safeIndex + 1} of ${list.length}`}
          onClose={closePractice}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={safeIndex > 0}
          hasNext={safeIndex < list.length - 1}
        />
      )}

      <TourLinkButton />
    </main>
  );
}

const styles = `
  .mem-index {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(243, 191, 33, 0.28), transparent 24rem),
      linear-gradient(180deg, ${C.paper} 0%, ${C.sand} 100%);
    color: ${C.ink};
    font-family: "DM Sans", system-ui, sans-serif;
  }
  .mem-index a { color: ${C.teal}; text-decoration: none; }
  .mem-index a:hover { color: ${C.ink}; }
  .mem-wrap { max-width: 820px; margin: 0 auto; padding: 28px 20px 96px; }

  .mem-top {
    display: flex; justify-content: space-between; gap: 12px;
    flex-wrap: wrap; color: ${C.muted}; font-size: 14px; margin-bottom: 24px;
  }

  /* Hero */
  .mem-hero {
    background: rgba(255,255,255,0.8); border: 1px solid ${C.line};
    border-radius: 28px; padding: 28px; box-shadow: ${C.shadow}; margin-bottom: 16px;
  }
  .mem-kicker {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: ${C.muted}; margin-bottom: 10px;
  }
  .mem-kicker::before {
    content: ""; width: 38px; height: 2px;
    background: ${C.gold}; border-radius: 999px;
  }
  .mem-title {
    margin: 0 0 12px;
    font-family: "Oswald", "Arial Narrow", sans-serif;
    font-size: clamp(38px, 7vw, 60px); line-height: 0.95;
    text-transform: uppercase; letter-spacing: 0.02em;
  }
  .mem-copy { max-width: 60ch; margin: 0; font-size: 17px; line-height: 1.6; color: ${C.muted}; }

  /* Section card */
  .mem-section {
    margin-bottom: 16px; background: rgba(255,255,255,0.8);
    border: 1px solid ${C.line}; border-radius: 24px;
    padding: 24px; box-shadow: ${C.shadow};
  }
  .mem-section-head {
    display: flex; justify-content: space-between; gap: 12px;
    flex-wrap: wrap; align-items: center; margin-bottom: 16px;
  }
  .mem-section-title {
    margin: 0;
    font-family: "Oswald", "Arial Narrow", sans-serif;
    font-size: 26px; text-transform: uppercase; letter-spacing: 0.02em;
  }
  .mem-add-toggle {
    padding: 8px 16px; border-radius: 999px; border: 1px solid ${C.goldBorder};
    background: ${C.goldBg}; color: ${C.ink};
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: all .15s;
  }
  .mem-add-toggle:hover { background: rgba(243,191,33,0.22); }

  /* Empty state */
  .mem-empty { text-align: center; padding: 12px 0 4px; }
  .mem-empty-title {
    font-family: "Oswald", sans-serif; font-size: 22px; text-transform: uppercase;
    color: ${C.ink}; margin: 0 0 8px;
  }
  .mem-empty-sub { color: ${C.muted}; font-size: 15px; line-height: 1.6; max-width: 48ch; margin: 0 auto 18px; }
  .mem-empty-cta {
    padding: 10px 20px; border-radius: 999px; border: 1px solid ${C.teal};
    background: ${C.teal}; color: #fff;
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: all .15s;
  }
  .mem-empty-cta:hover { background: ${C.tealLight}; }

  /* Deck list */
  .mem-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .mem-list-item {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 14px; border-radius: 14px;
    background: ${C.paper}; border: 1px solid rgba(27,58,75,0.1);
  }
  .mem-list-ref {
    font-family: "Oswald", "Arial Narrow", sans-serif;
    font-size: 19px; text-transform: uppercase; letter-spacing: 0.02em; color: ${C.ink};
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mem-list-actions { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .mem-practice-btn {
    padding: 8px 14px; border-radius: 999px; border: none;
    background: ${C.teal}; color: ${C.gold};
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s;
  }
  .mem-practice-btn:hover { background: ${C.tealLight}; }
  .mem-remove-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 999px;
    border: 1px solid rgba(180,40,40,0.2); background: rgba(220,60,60,0.06);
    color: rgba(180,40,40,0.8); cursor: pointer; transition: all .15s;
  }
  .mem-remove-btn:hover { background: rgba(220,60,60,0.14); border-color: rgba(220,60,60,0.4); }

  /* Picker */
  .mem-picker-intro { color: ${C.muted}; font-size: 14px; margin: 0 0 16px; }
  .mem-picker-section { margin-bottom: 18px; }
  .mem-picker-section-title {
    font-family: "Oswald", sans-serif; font-size: 14px; letter-spacing: 0.1em;
    text-transform: uppercase; color: ${C.muted}; margin: 0 0 10px;
  }
  .mem-picker-books { display: flex; flex-direction: column; gap: 8px; }
  .mem-picker-book {
    display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
    padding-bottom: 8px; border-bottom: 1px dashed ${C.line};
  }
  .mem-picker-book-name {
    font-weight: 700; font-size: 14px; color: ${C.ink}; min-width: 120px;
  }
  .mem-picker-chips { display: inline-flex; gap: 6px; flex-wrap: wrap; }
  .mem-chip {
    padding: 5px 11px; border-radius: 999px;
    border: 1px solid rgba(27,58,75,0.2); background: rgba(255,255,255,0.7);
    color: ${C.teal}; font-family: "DM Sans", system-ui, sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s;
  }
  .mem-chip:hover { border-color: rgba(27,58,75,0.4); background: #fff; }
  .mem-chip-on {
    background: ${C.green}; border-color: ${C.green}; color: #fff;
  }
  .mem-chip-on:hover { background: ${C.green}; border-color: ${C.green}; }

  /* Practice overlay */
  .mem-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(15,37,48,0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: mem-fade .2s ease forwards;
  }
  @keyframes mem-fade { from { opacity: 0; } to { opacity: 1; } }
  .mem-card {
    width: 100%; max-width: 600px; max-height: 90vh; overflow: auto;
    background: ${C.paper}; border-radius: 24px;
    box-shadow: 0 24px 70px rgba(0,0,0,0.4);
    display: flex; flex-direction: column;
  }
  .mem-card-head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    padding: 22px 24px 16px; border-bottom: 2px solid ${C.gold};
    background: ${C.teal}; border-radius: 24px 24px 0 0;
  }
  .mem-card-kicker {
    font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${C.gold}; margin-bottom: 4px;
  }
  .mem-card-ref {
    margin: 0; font-family: "Oswald", "Arial Narrow", sans-serif;
    font-size: 26px; text-transform: uppercase; letter-spacing: 0.02em; color: #fff;
  }
  .mem-card-close {
    background: rgba(255,255,255,0.12); border: none; cursor: pointer;
    color: rgba(255,255,255,0.8); padding: 8px; border-radius: 8px; flex-shrink: 0;
    transition: background .15s;
  }
  .mem-card-close:hover { background: rgba(255,255,255,0.22); }
  .mem-card-body { padding: 24px; }
  .mem-status { color: ${C.muted}; font-size: 15px; text-align: center; padding: 30px 0; }
  .mem-inline-link { font-weight: 700; }

  .mem-verse { color: ${C.ink}; }
  .mem-verse-line { font-size: 20px; line-height: 1.9; margin: 0 0 12px; }
  .mem-word { border-radius: 4px; padding: 0 1px; }
  .mem-word-tappable {
    cursor: pointer; color: ${C.tealLight};
    border-bottom: 1px dotted rgba(27,58,75,0.4);
  }
  .mem-word-tappable:hover { background: ${C.goldBg}; }
  .mem-word-peeked { color: ${C.ink}; border-bottom-color: transparent; }
  .mem-hint { font-size: 12px; color: ${C.muted}; margin: 4px 0 18px; font-style: italic; }

  .mem-fade-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .mem-fade-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: ${C.muted}; margin-right: 2px;
  }
  .mem-fade-btn {
    padding: 7px 16px; border-radius: 999px; border: 1px solid rgba(27,58,75,0.2);
    background: rgba(255,255,255,0.8); color: ${C.muted};
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s;
  }
  .mem-fade-btn:hover { color: ${C.ink}; border-color: rgba(27,58,75,0.4); }
  .mem-fade-active { background: ${C.teal}; color: #fff; border-color: ${C.teal}; }
  .mem-fade-active:hover { color: #fff; }

  .mem-audio {
    background: rgba(27,58,75,0.03); border: 1px solid rgba(27,58,75,0.08);
    border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;
  }
  .mem-audio-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .mem-audio-badge {
    display: inline-block; padding: 3px 8px; border-radius: 4px;
    background: ${C.teal}; color: ${C.gold};
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    flex-shrink: 0;
  }
  .mem-audio-player { flex: 1 1 200px; min-width: 0; height: 36px; }
  .mem-copyright { font-size: 11px; color: ${C.muted}; opacity: 0.7; line-height: 1.5; margin: 0; font-style: italic; }

  .mem-card-nav {
    display: flex; justify-content: space-between; gap: 10px;
    padding: 14px 24px 20px; border-top: 1px solid ${C.line};
  }
  .mem-nav-btn {
    padding: 9px 18px; border-radius: 999px; border: 1px solid rgba(27,58,75,0.2);
    background: rgba(255,255,255,0.8); color: ${C.teal};
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: all .15s;
  }
  .mem-nav-btn:hover:not(:disabled) { background: #fff; border-color: rgba(27,58,75,0.4); }
  .mem-nav-btn:disabled { opacity: 0.4; cursor: default; }

  @media (max-width: 600px) {
    .mem-wrap { padding: 18px 14px 88px; }
    .mem-hero, .mem-section { padding: 20px; }
    .mem-picker-book-name { min-width: 0; }
    .mem-card-body { padding: 20px; }
    .mem-verse-line { font-size: 18px; }
  }
`;
