"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { READING_PLAN, TOTAL } from "./lib/bible";
import {
  TRANSLATIONS,
  MAIN_DEFAULT_TRANSLATION,
  MAIN_TRANSLATION_STORAGE_KEY,
  buildApiQuery,
  buildUsfmParts,
  buildYouVersionUrl,
} from "./lib/translations";
import { hasStudy, getTokens, getEntry, toVerseId } from "./lib/study";
import StudyVerse from "./components/StudyVerse";
import WordPopover from "./components/WordPopover";
import LexiconDrawer from "./components/LexiconDrawer";

const STUDY_MODE_STORAGE_KEY = "bt:originalsMode";

// Detects iPad-sized screens (768px+) — enables persistent split-pane layout
function useIsIpad() {
  const [isIpad, setIsIpad] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsIpad(mq.matches);
    const handler = (e) => setIsIpad(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isIpad;
}

// Brand colors from The Ten Minute Bible Hour
const C = {
  yellow: "#FFCB21",
  yellowLight: "#FFE066",
  yellowPale: "#FFF2B3",
  teal: "#1B3A4B",
  tealLight: "#2A5568",
  tealDark: "#0F2530",
  white: "#FFFFFF",
  offWhite: "#FFFEF5",
  done: "#1B6B3A",
  doneBg: "rgba(27,107,58,0.1)",
  doneBorder: "rgba(27,107,58,0.25)",
};

function parseRefs(book, refsStr) {
  const parts = refsStr.split(/\s+and\s+|,\s*/);
  const results = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (/^\d+:\S+$/.test(trimmed)) {
      const url = buildYouVersionUrl(book, trimmed);
      results.push({ text: trimmed, url, ref: trimmed });
    } else {
      results.push({ text: trimmed, url: null, ref: null });
    }
  }
  return results;
}

function VerseLinks({ book, refs, done, onVerseClick }) {
  const parsed = parseRefs(book, refs);
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {parsed.map((p, i) => {
        const separator = i > 0 ? (i === parsed.length - 1 ? " and " : ", ") : "";
        if (p.url) {
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              {separator && <span style={{ margin: "0 2px", fontSize: 13, color: done ? C.done : C.tealLight }}>{separator}</span>}
              <a
                href={p.url}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  onVerseClick(book, p.ref, p.url);
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  color: done ? C.done : C.teal,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: done ? "rgba(27,107,58,0.08)" : "rgba(27,58,75,0.07)",
                  border: `1px solid ${done ? "rgba(27,107,58,0.15)" : "rgba(27,58,75,0.12)"}`,
                  transition: "all .15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = done ? "rgba(27,107,58,0.15)" : "rgba(27,58,75,0.13)";
                  e.currentTarget.style.borderColor = done ? "rgba(27,107,58,0.3)" : "rgba(27,58,75,0.25)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = done ? "rgba(27,107,58,0.08)" : "rgba(27,58,75,0.07)";
                  e.currentTarget.style.borderColor = done ? "rgba(27,107,58,0.15)" : "rgba(27,58,75,0.12)";
                }}
              >
                {p.text}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </span>
          );
        }
        return <span key={i} style={{ fontSize: 13, color: done ? C.done : C.tealLight }}>{separator}{p.text}</span>;
      })}
    </span>
  );
}

function VersePanel({ book, verseRef, onClose, mode = "overlay" }) {
  const isSidebar = mode === "sidebar";
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyright, setCopyright] = useState(null);
  const [translationId, setTranslationId] = useState(() => {
    try { return localStorage.getItem(MAIN_TRANSLATION_STORAGE_KEY) || MAIN_DEFAULT_TRANSLATION; } catch { return MAIN_DEFAULT_TRANSLATION; }
  });
  const [studyMode, setStudyMode] = useState(() => {
    try { return localStorage.getItem(STUDY_MODE_STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [studyPopover, setStudyPopover] = useState(null); // { strongsId, anchor } | null
  const [studyDrawer, setStudyDrawer] = useState(null);   // { strongsId } | null
  const panelRef = useRef(null);

  const tx = TRANSLATIONS.find(t => t.id === translationId) || TRANSLATIONS[0];
  const youVersionUrl = buildYouVersionUrl(book, verseRef, tx.youVersionId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setText(null);
    setCopyright(null);

    if (tx.yvLicensed) {
      // Fetch from YouVersion API via our server proxy
      const parts = buildUsfmParts(book, verseRef);
      if (!parts) { setError("api"); setLoading(false); return; }
      Promise.all(
        parts.map(usfm =>
          fetch(`/api/verse?bible_id=${tx.youVersionId}&usfm=${encodeURIComponent(usfm)}`)
            .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
        )
      )
        .then(results => {
          if (cancelled) return;
          const combined = results
            .map(data => (data.content || data.text || "").trim())
            .filter(Boolean)
            .join("\n\n");
          if (combined) {
            setText([{ verse: null, text: combined }]);
            if (tx.copyright) setCopyright(tx.copyright);
          } else {
            throw new Error("empty");
          }
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setError("api");
          setLoading(false);
        });
    } else if (tx.apiCode) {
      // Fetch from bible-api.com (public domain translations)
      const query = buildApiQuery(book, verseRef);
      fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=${tx.apiCode}`)
        .then(r => {
          if (!r.ok) throw new Error("not found");
          return r.json();
        })
        .then(data => {
          if (cancelled) return;
          if (data.verses && data.verses.length > 0) {
            setText(data.verses.map(v => ({
              verse: v.verse,
              text: v.text.trim(),
            })));
          } else if (data.text) {
            setText([{ verse: null, text: data.text.trim() }]);
          } else {
            throw new Error("empty");
          }
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setError("api");
          setLoading(false);
        });
    } else {
      // Copyrighted translation without API access
      setLoading(false);
      setError("copyrighted");
    }

    return () => { cancelled = true; };
  }, [book, verseRef, tx.apiCode, tx.yvLicensed, tx.youVersionId, tx.copyright]);

  const changeTranslation = (newId) => {
    setTranslationId(newId);
    try { localStorage.setItem(MAIN_TRANSLATION_STORAGE_KEY, newId); } catch {}
  };

  const toggleStudyMode = () => {
    setStudyMode(prev => {
      const next = !prev;
      try { localStorage.setItem(STUDY_MODE_STORAGE_KEY, next ? "1" : "0"); } catch {}
      if (!next) {
        setStudyPopover(null);
        setStudyDrawer(null);
      }
      return next;
    });
  };

  const handleWordClick = useCallback((token, anchorRect) => {
    if (!token || !token.s) return;
    setStudyPopover({ strongsId: token.s, anchor: anchorRect });
  }, []);

  const closePopover = useCallback(() => setStudyPopover(null), []);
  const closeDrawer = useCallback(() => setStudyDrawer(null), []);

  const openFullEntry = useCallback(() => {
    if (!studyPopover) return;
    setStudyDrawer({ strongsId: studyPopover.strongsId });
    setStudyPopover(null);
  }, [studyPopover]);

  // Close on Escape — drawer first, then popover, then the panel itself
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (studyDrawer) { setStudyDrawer(null); return; }
      if (studyPopover) { setStudyPopover(null); return; }
      onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, studyPopover, studyDrawer]);

  const displayRef = `${book} ${verseRef}`;
  const studyVerseId = toVerseId(book, verseRef);
  const studyAvailable = !!studyVerseId && hasStudy(studyVerseId);
  const isKjv = translationId === "kjv";
  const studyTokens = studyMode && studyAvailable ? getTokens(studyVerseId) : null;
  const popoverEntry = studyPopover
    ? (() => {
        const e = getEntry(studyPopover.strongsId);
        return e ? { ...e, strongsId: studyPopover.strongsId } : null;
      })()
    : null;
  const drawerEntry = studyDrawer ? getEntry(studyDrawer.strongsId) : null;

  return (
    <>
      {/* Backdrop — only in overlay mode */}
      {!isSidebar && <div onClick={onClose} style={ps.backdrop} />}
      {/* Panel */}
      <div ref={panelRef} style={isSidebar ? ps.panelSidebar : ps.panel} className="verse-panel">
        <div style={isSidebar ? ps.panelHeaderSidebar : ps.panelHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={isSidebar ? ps.panelTitleSidebar : ps.panelTitle}>{displayRef}</h2>
          </div>
          <button onClick={onClose} style={isSidebar ? ps.closeBtnSidebar : ps.closeBtn} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Translation picker + Originals toggle */}
        <div style={ps.translationBar}>
          <select
            value={translationId}
            onChange={e => changeTranslation(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={ps.translationSelect}
          >
            {TRANSLATIONS.map(t => (
              <option key={t.id} value={t.id}>
                {t.abbr} — {t.name}{!t.apiCode && !t.yvLicensed ? " (YouVersion)" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleStudyMode}
            aria-pressed={studyMode}
            style={{ ...ps.studyToggle, ...(studyMode ? ps.studyToggleOn : {}) }}
            title={studyMode ? "Turn Originals off" : "Turn Originals on"}
          >
            {studyMode ? "Originals ✓" : "Originals ▸"}
          </button>
        </div>

        <div style={ps.panelBody}>
          {loading && (
            <div style={ps.loadingWrap}>
              <div style={ps.panelSpinner} />
              <p style={ps.loadingText}>Loading verse...</p>
            </div>
          )}

          {error === "copyrighted" && (
            <div style={ps.errorWrap}>
              <p style={ps.copyrightNote}>
                {tx.name} is a copyrighted translation and can't be displayed inline.
              </p>
              <a href={youVersionUrl} target="_blank" rel="noopener noreferrer" style={ps.youVersionBtn}>
                Read in {tx.abbr} on YouVersion
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 6, verticalAlign: "middle" }}>
                  <path d="M4.5 2H3C2.44772 2 2 2.44772 2 3V9C2 9.55228 2.44772 10 3 10H9C9.55228 10 10 9.55228 10 9V7.5M7 2H10M10 2V5M10 2L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <p style={ps.copyrightHint}>
                Or pick a public domain translation (KJV, WEB, ASV) to read inline.
              </p>
            </div>
          )}

          {error === "api" && (
            <div style={ps.errorWrap}>
              <p style={ps.errorText}>Could not load this verse.</p>
              <a href={youVersionUrl} target="_blank" rel="noopener noreferrer" style={ps.youVersionBtn}>
                Read on YouVersion instead
              </a>
            </div>
          )}

          {text && (
            <div style={isSidebar ? ps.verseContentSidebar : ps.verseContent}>
              {text.map((v, i) => {
                // On KJV we tokenize the first verse in-place. On other
                // translations the tagged KJV renders as a separate
                // Originals section below (see next block).
                const useStudyInline = isKjv && i === 0 && studyTokens && studyTokens.length > 0;
                return (
                  <p key={i} style={isSidebar ? ps.verseLineSidebar : ps.verseLine}>
                    {v.verse && <sup style={ps.verseNum}>{v.verse}</sup>}
                    {useStudyInline ? (
                      <StudyVerse
                        verseId={studyVerseId}
                        tokens={studyTokens}
                        onWordClick={handleWordClick}
                        activeStrong={studyPopover?.strongsId || studyDrawer?.strongsId || null}
                      />
                    ) : (
                      v.text
                    )}
                  </p>
                );
              })}
              {copyright && (
                <p style={ps.copyrightAttrib}>{copyright}</p>
              )}
            </div>
          )}

          {/* Originals (KJV) section — shown beneath a non-KJV translation */}
          {studyMode && studyTokens && !isKjv && !loading && (
            <div style={ps.originalsSection}>
              <div style={ps.originalsLabel}>Original (KJV)</div>
              <p style={isSidebar ? ps.verseLineSidebar : ps.verseLine}>
                <StudyVerse
                  verseId={studyVerseId}
                  tokens={studyTokens}
                  onWordClick={handleWordClick}
                  activeStrong={studyPopover?.strongsId || studyDrawer?.strongsId || null}
                />
              </p>
            </div>
          )}
        </div>

        <WordPopover
          open={!!studyPopover && !!popoverEntry}
          anchor={studyPopover?.anchor || null}
          entry={popoverEntry}
          onClose={closePopover}
          onOpenFull={openFullEntry}
        />

        <LexiconDrawer
          open={!!studyDrawer && !!drawerEntry}
          entry={drawerEntry}
          strongsId={studyDrawer?.strongsId || null}
          onClose={closeDrawer}
        />

        <div style={ps.panelFooter}>
          <a href={youVersionUrl} target="_blank" rel="noopener noreferrer" style={ps.youVersionLink}>
            Open in YouVersion ({tx.abbr})
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4, verticalAlign: "middle" }}>
              <path d="M4.5 2H3C2.44772 2 2 2.44772 2 3V9C2 9.55228 2.44772 10 3 10H9C9.55228 10 10 9.55228 10 9V7.5M7 2H10M10 2V5M10 2L5.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </>
  );
}

const EAGLE_BANNER_DISMISSED_KEY = "bt:eagleBannerDismissed";
const ORIGINALS_BANNER_DISMISSED_KEY = "bt:originalsBannerDismissed";

function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function load(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}


function LightningIcon({ size = 24, color = C.yellow }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M13 2L4.09 12.11C3.68 12.59 3.48 12.84 3.49 13.05C3.49 13.23 3.58 13.4 3.72 13.51C3.89 13.63 4.21 13.63 4.86 13.63H12L11 22L19.91 11.89C20.32 11.41 20.52 11.16 20.51 10.95C20.51 10.77 20.42 10.6 20.28 10.49C20.11 10.37 19.79 10.37 19.14 10.37H12L13 2Z" />
    </svg>
  );
}

function ChecklistView({ checked, onToggle, onReset }) {
  const [section, setSection] = useState("all");
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [versePanel, setVersePanel] = useState(null); // { book, ref, youVersionUrl }
  const [showEagleBanner, setShowEagleBanner] = useState(false);
  const [showOriginalsBanner, setShowOriginalsBanner] = useState(false);
  const [bannerReady, setBannerReady] = useState(false);
  const isIpad = useIsIpad();

  const doneCount = Object.values(checked).filter(Boolean).length;
  const otDone = READING_PLAN["Old Testament"].filter(r => checked[r.book]).length;
  const ntDone = READING_PLAN["New Testament"].filter(r => checked[r.book]).length;
  const pct = Math.round((doneCount / TOTAL) * 100);

  const toggle = (book) => {
    const willBeDone = !checked[book];
    onToggle(book);
    if (willBeDone && (doneCount + 1) === TOTAL) {
      setShowCelebrate(true);
      setTimeout(() => setShowCelebrate(false), 4000);
    }
  };

  const openVerse = useCallback((book, ref, youVersionUrl) => {
    setVersePanel({ book, ref, youVersionUrl });
  }, []);

  const closeVerse = useCallback(() => {
    setVersePanel(null);
  }, []);

  useEffect(() => {
    setShowEagleBanner(!load(EAGLE_BANNER_DISMISSED_KEY));
    setShowOriginalsBanner(!load(ORIGINALS_BANNER_DISMISSED_KEY));
    setBannerReady(true);
  }, []);

  const dismissOriginalsBanner = useCallback(() => {
    setShowOriginalsBanner(false);
    store(ORIGINALS_BANNER_DISMISSED_KEY, true);
  }, []);

  const dismissEagleBanner = useCallback(() => {
    setShowEagleBanner(false);
    store(EAGLE_BANNER_DISMISSED_KEY, true);
  }, []);

  const vis = section === "ot" ? { "Old Testament": READING_PLAN["Old Testament"] }
    : section === "nt" ? { "New Testament": READING_PLAN["New Testament"] }
    : READING_PLAN;

  // Shared book list used in both layouts
  const bookList = (
    <div style={isIpad ? { ...s.listWrap, maxWidth: "none", padding: "0 16px 32px" } : s.listWrap}>
      {Object.entries(vis).map(([sec, readings]) => {
        const secDone = readings.filter(r => checked[r.book]).length;
        return (
          <div key={sec}>
            <div style={s.secHeader}>
              <h2 style={s.secTitle}>{sec}</h2>
              <span style={s.secCount}>{secDone}/{readings.length}</span>
            </div>
            <div style={s.grid}>
              {readings.map((r) => {
                const done = !!checked[r.book];
                return (
                  <button key={r.book} onClick={() => toggle(r.book)}
                    style={{ ...s.card, ...(done ? s.cardDone : {}), ...(isIpad && versePanel?.book === r.book ? s.cardActive : {}) }}>
                    <div style={s.cardTop}>
                      <div style={{ ...s.chk, ...(done ? s.chkDone : {}) }}>
                        {done && <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>}
                      </div>
                      <span style={{ ...s.bookName, ...(done ? s.bookDone : {}) }}>{r.book}</span>
                    </div>
                    <p style={{ ...s.refs, ...(done ? s.refsDone : {}) }}>
                      <VerseLinks book={r.book} refs={r.refs} done={done} onVerseClick={openVerse} />
                    </p>
                    {r.note && <p style={s.note}>{r.note}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const footerEl = (
    <footer style={s.footer}>
      <p style={{ margin: "0 0 8px" }}>
        Inspired by Matt Whitman&rsquo;s{" "}
        <a href="https://www.thetmbh.com/tourofthebible" target="_blank" rel="noopener noreferrer" style={s.footerLink}>
          Lightning-Fast Field Guide to the Bible
        </a>
      </p>
      <p style={s.footerDisclaimer}>
        Not affiliated with or endorsed by The Ten Minute Bible Hour.
      </p>
      <a href="https://youtu.be/XdMuZCTChJE?si=DRfBFUnDc2mt3Yq2" target="_blank" rel="noopener noreferrer"
        style={s.footerYt}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.8 1-2.1 2C0 8.1 0 12 0 12s0 3.9.4 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.6.6 9.6.6s7.6 0 9.5-.6c1-.3 1.8-1 2.1-2 .4-1.9.4-5.8.4-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.4 3.6-6.4 3.6z"/>
        </svg>
        Watch Matt explain the tour
      </a>
      <p style={s.madeBy}>
        Made by{" "}
        <a href="https://askadam.cloud/" target="_blank" rel="noopener noreferrer" style={s.madeByLink}>Adam Brown</a>
        {" & "}
        <span style={{ fontWeight: 600 }}>Claude</span>
      </p>
    </footer>
  );

  // ── iPad split-pane layout ──────────────────────────────────────────────
  if (isIpad) {
    return (
      <div style={s.iPadOuter}>
        {showCelebrate && (
          <div style={s.celebrate}>
            <LightningIcon size={36} color={C.yellow} />
            <p style={s.celebrateText}>Amazing! All 66 books!</p>
          </div>
        )}

        {/* LEFT PANE — scrollable book list */}
        <div style={s.iPadLeft}>
          <header style={s.header}>
            <div style={s.headerCenter}>
              <LightningIcon size={22} color={C.yellow} />
              <h1 style={s.title}>Tour of the Bible</h1>
            </div>
          </header>

          {bannerReady && showOriginalsBanner && (
            <div style={{ ...s.eagleBannerWrap, maxWidth: "none" }}>
              <div style={s.eagleBannerShell}>
                <div style={s.originalsBanner}>
                  <span style={s.originalsBannerPill}>New</span>
                  <span style={s.originalsBannerText}>
                    Originals — tap any verse, toggle Originals to see the Hebrew/Greek
                  </span>
                </div>
                <button type="button" onClick={dismissOriginalsBanner} aria-label="Dismiss Originals banner" style={s.originalsBannerClose}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {bannerReady && showEagleBanner && (
            <div style={{ ...s.eagleBannerWrap, maxWidth: "none" }}>
              <div style={s.eagleBannerShell}>
                <a href="/eagle" style={s.eagleBanner}>
                  <span style={s.eagleBannerPill}>New</span>
                  <span style={s.eagleBannerText}>Eagle Method — see the whole book first</span>
                  <span style={s.eagleBannerArrow} aria-hidden="true">→</span>
                </a>
                <button type="button" onClick={dismissEagleBanner} aria-label="Dismiss Eagle Method banner" style={s.eagleBannerClose}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div style={{ ...s.progressSection, maxWidth: "none" }}>
            <div style={s.progressStats}>
              <div style={s.statBox}>
                <span style={s.statNum}>{doneCount}</span>
                <span style={s.statLabel}>of {TOTAL}</span>
              </div>
              <div style={s.statBox}>
                <span style={s.statNum}>{pct}%</span>
                <span style={s.statLabel}>done</span>
              </div>
            </div>
            <div style={s.progressTrack}>
              <div style={{ ...s.progressBar, width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg,${C.done},#2d8a4e)` : `linear-gradient(90deg,${C.teal},${C.tealLight})` }} />
            </div>
            <div style={s.progressMini}>
              <span>OT: {otDone}/{READING_PLAN["Old Testament"].length}</span>
              <span>NT: {ntDone}/{READING_PLAN["New Testament"].length}</span>
            </div>
          </div>

          <div style={s.filters}>
            {[["all","All"],["ot","Old Testament"],["nt","New Testament"]].map(([k,l]) => (
              <button key={k} onClick={() => setSection(k)}
                style={{ ...s.filterBtn, ...(section===k ? s.filterActive : {}) }}>{l}</button>
            ))}
            <button onClick={onReset} style={s.resetBtn}>Reset</button>
          </div>

          {bookList}
          {footerEl}
        </div>

        {/* RIGHT PANE — persistent verse reader */}
        <div style={s.iPadRight}>
          {versePanel ? (
            <VersePanel
              mode="sidebar"
              book={versePanel.book}
              verseRef={versePanel.ref}
              onClose={closeVerse}
            />
          ) : (
            <div style={s.iPadPlaceholder}>
              <div style={s.iPadPlaceholderIcon}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="rgba(27,58,75,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={s.iPadPlaceholderTitle}>Tap a verse to read it here</p>
              <p style={s.iPadPlaceholderSub}>Select any verse reference from the book list</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Default (phone / small screen) layout ──────────────────────────────
  return (
    <div style={s.outer}>
      {showCelebrate && (
        <div style={s.celebrate}>
          <LightningIcon size={36} color={C.yellow} />
          <p style={s.celebrateText}>Amazing! All 66 books!</p>
        </div>
      )}

      <header style={s.header}>
        <div style={s.headerCenter}>
          <LightningIcon size={22} color={C.yellow} />
          <h1 style={s.title}>Tour of the Bible</h1>
        </div>
      </header>

      {bannerReady && showOriginalsBanner && (
        <div style={s.eagleBannerWrap}>
          <div style={s.eagleBannerShell}>
            <div style={s.originalsBanner}>
              <span style={s.originalsBannerPill}>New</span>
              <span style={s.originalsBannerText}>
                Originals — tap any verse, toggle Originals to see the Hebrew/Greek
              </span>
            </div>
            <button
              type="button"
              onClick={dismissOriginalsBanner}
              aria-label="Dismiss Originals banner"
              style={s.originalsBannerClose}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {bannerReady && showEagleBanner && (
        <div style={s.eagleBannerWrap}>
          <div style={s.eagleBannerShell}>
            <a href="/eagle" style={s.eagleBanner}>
              <span style={s.eagleBannerPill}>New</span>
              <span style={s.eagleBannerText}>
                Eagle Method — memorise a verse by seeing the whole book first
              </span>
              <span style={s.eagleBannerArrow} aria-hidden="true">→</span>
            </a>
            <button
              type="button"
              onClick={dismissEagleBanner}
              aria-label="Dismiss Eagle Method banner"
              style={s.eagleBannerClose}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div style={s.progressSection}>
        <div style={s.progressStats}>
          <div style={s.statBox}>
            <span style={s.statNum}>{doneCount}</span>
            <span style={s.statLabel}>of {TOTAL}</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>{pct}%</span>
            <span style={s.statLabel}>done</span>
          </div>
        </div>
        <div style={s.progressTrack}>
          <div style={{
            ...s.progressBar, width: `${pct}%`,
            background: pct === 100 ? `linear-gradient(90deg,${C.done},#2d8a4e)` : `linear-gradient(90deg,${C.teal},${C.tealLight})`,
          }} />
        </div>
        <div style={s.progressMini}>
          <span>OT: {otDone}/{READING_PLAN["Old Testament"].length}</span>
          <span>NT: {ntDone}/{READING_PLAN["New Testament"].length}</span>
        </div>
      </div>

      <div style={s.filters}>
        {[["all","All"],["ot","Old Testament"],["nt","New Testament"]].map(([k,l]) => (
          <button key={k} onClick={() => setSection(k)}
            style={{ ...s.filterBtn, ...(section===k ? s.filterActive : {}) }}>{l}</button>
        ))}
        <button onClick={onReset} style={s.resetBtn}>Reset</button>
      </div>

      {bookList}
      {footerEl}

      {versePanel && (
        <VersePanel
          book={versePanel.book}
          verseRef={versePanel.ref}
          onClose={closeVerse}
        />
      )}
    </div>
  );
}

const PROGRESS_KEY = "bt:progress";

export default function Page() {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    setChecked(load(PROGRESS_KEY) || {});
  }, []);

  const handleToggle = useCallback((book) => {
    setChecked(prev => {
      const next = { ...prev, [book]: !prev[book] };
      Object.keys(next).forEach(b => { if (!next[b]) delete next[b]; });
      store(PROGRESS_KEY, next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Reset all your reading progress? This can't be undone.")) {
      setChecked({});
      remove(PROGRESS_KEY);
    }
  }, []);

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:translateY(-16px)scale(.95)}to{opacity:1;transform:translateY(0)scale(1)}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @media(max-width:600px){
          .verse-panel{width:100% !important;max-width:100% !important;border-radius:20px 20px 0 0 !important;top:auto !important;bottom:0 !important;max-height:75vh !important;animation:slideUp .3s ease forwards !important}
        }
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
      <ChecklistView checked={checked} onToggle={handleToggle} onReset={handleReset} />
    </>
  );
}

const s = {
  // Loading
  loadWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.yellow },
  spinner: { width: 28, height: 28, border: `3px solid rgba(27,58,75,0.15)`, borderTopColor: C.teal, borderRadius: "50%", animation: "spin .8s linear infinite" },

  // Checklist
  outer: { minHeight: "100vh", background: C.yellow, fontFamily: "'DM Sans',sans-serif", color: C.teal },
  header: { background: C.teal, padding: "16px 20px 12px" },
  headerRow: { display: "flex", alignItems: "center" },
  headerCenter: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center" },
  title: { fontFamily: "'Oswald',sans-serif", fontSize: 22, fontWeight: 700, color: C.white, margin: 0, textTransform: "uppercase", letterSpacing: "0.02em" },
  headerMeta: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 },
  greeting: { fontSize: 13, color: C.yellowLight, fontWeight: 500 },
  logoutBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans',sans-serif", padding: 0, fontWeight: 500 },

  // Progress
  eagleBannerWrap: { maxWidth: 600, margin: "0 auto", padding: "20px 20px 0" },
  eagleBannerShell: { position: "relative" },
  eagleBanner: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 48px 12px 16px",
    borderRadius: 14,
    background: C.teal,
    border: `1px solid rgba(0,0,0,0.15)`,
    textDecoration: "none",
    color: "#fff",
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    transition: "all .15s",
  },
  eagleBannerPill: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "2px 7px", borderRadius: 999,
    background: C.yellow, color: C.teal,
    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
    textTransform: "uppercase", flexShrink: 0,
  },
  eagleBannerText: { flex: 1, fontSize: 14, fontWeight: 700, lineHeight: 1.4 },
  eagleBannerArrow: { fontSize: 16, opacity: 0.6, flexShrink: 0 },
  eagleBannerClose: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.82)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0,
  },
  originalsBanner: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 48px 12px 16px",
    borderRadius: 14,
    background: C.yellow,
    border: `1px solid rgba(0,0,0,0.08)`,
    color: C.teal,
    boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
  },
  originalsBannerPill: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "2px 7px", borderRadius: 999,
    background: C.teal, color: C.yellow,
    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
    textTransform: "uppercase", flexShrink: 0,
  },
  originalsBannerText: { flex: 1, fontSize: 14, fontWeight: 700, lineHeight: 1.4 },
  originalsBannerClose: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28,
    borderRadius: 999,
    border: "none",
    background: "rgba(27,58,75,0.10)",
    color: "rgba(27,58,75,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", padding: 0,
  },
  progressSection: { padding: "14px 20px 12px", maxWidth: 600, margin: "0 auto" },
  progressStats: { display: "flex", justifyContent: "center", gap: 40, marginBottom: 10 },
  statBox: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontFamily: "'Oswald',sans-serif", fontSize: 28, fontWeight: 700, color: C.teal },
  statLabel: { fontSize: 11, fontWeight: 600, color: C.tealLight, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.7 },
  progressTrack: { height: 8, background: "rgba(27,58,75,0.1)", borderRadius: 4, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 4, transition: "width .5s ease, background .5s ease" },
  progressMini: { display: "flex", justifyContent: "space-between", fontSize: 11, color: C.tealLight, marginTop: 5, fontWeight: 600, opacity: 0.7 },

  // Filters
  filters: { display: "flex", justifyContent: "center", gap: 8, padding: "0 20px 16px", flexWrap: "wrap" },
  filterBtn: { padding: "7px 16px", border: `2px solid rgba(27,58,75,0.2)`, borderRadius: 22, background: "transparent", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: C.teal, cursor: "pointer", transition: "all .2s" },
  filterActive: { background: C.teal, color: C.yellow, borderColor: C.teal },
  resetBtn: { padding: "7px 16px", border: `2px solid rgba(27,58,75,0.15)`, borderRadius: 22, background: "transparent", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#b53a2a", cursor: "pointer" },

  // List
  listWrap: { maxWidth: 680, margin: "0 auto", padding: "0 16px 40px" },
  secHeader: { display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "18px 4px 10px", borderBottom: `3px solid ${C.teal}`, marginBottom: 12 },
  secTitle: { fontFamily: "'Oswald',sans-serif", fontSize: 20, fontWeight: 700, color: C.teal, margin: 0, textTransform: "uppercase", letterSpacing: "0.02em" },
  secCount: { fontSize: 13, fontWeight: 700, color: C.tealLight },

  // Cards
  grid: { display: "flex", flexDirection: "column", gap: 5 },
  card: { display: "flex", flexDirection: "column", gap: 2, padding: "11px 14px", background: "rgba(255,255,255,0.55)", border: `1.5px solid rgba(27,58,75,0.12)`, borderRadius: 10, cursor: "pointer", transition: "all .2s", textAlign: "left", fontFamily: "'DM Sans',sans-serif", width: "100%", boxSizing: "border-box" },
  cardDone: { background: C.doneBg, borderColor: C.doneBorder },
  cardTop: { display: "flex", alignItems: "center", gap: 10 },
  chk: { width: 21, height: 21, borderRadius: 6, border: `2px solid rgba(27,58,75,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" },
  chkDone: { background: C.done, borderColor: C.done },
  bookName: { fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 600, color: C.teal },
  bookDone: { color: C.done },
  refs: { fontSize: 13, color: C.tealLight, margin: "0 0 0 31px", lineHeight: 1.4 },
  refsDone: { color: C.done },
  note: { fontSize: 12, fontStyle: "italic", color: C.tealLight, margin: "2px 0 0 31px", opacity: 0.7 },

  // Footer
  footer: { textAlign: "center", padding: "20px 20px 28px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.tealLight },
  footerLink: { color: C.teal, fontWeight: 700, textDecoration: "none", borderBottom: `1px solid rgba(27,58,75,0.3)`, fontSize: 14 },
  footerDisclaimer: { fontSize: 11, color: C.tealLight, margin: "0 0 12px", opacity: 0.6, lineHeight: 1.5 },
  footerYt: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.teal, textDecoration: "none", borderBottom: `1px dashed rgba(27,58,75,0.3)` },
  madeBy: { fontSize: 12, color: C.tealLight, margin: "16px 0 0", opacity: 0.5 },
  madeByLink: { color: C.teal, fontWeight: 600, textDecoration: "none", borderBottom: `1px dashed rgba(27,58,75,0.3)` },

  // Celebrate
  celebrate: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: C.teal, color: C.white, padding: "18px 28px", borderRadius: 14, textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", animation: "popIn .4s ease forwards", display: "flex", flexDirection: "column", alignItems: "center" },
  celebrateText: { fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 600, margin: "6px 0 0", color: C.yellow },

  // ── iPad split-pane ──────────────────────────────────────────────────────
  iPadOuter: {
    display: "flex", flexDirection: "row",
    height: "100dvh", overflow: "hidden",
    background: C.yellow, fontFamily: "'DM Sans',sans-serif", color: C.teal,
  },
  iPadLeft: {
    flex: "0 0 42%", minWidth: 320, maxWidth: 480,
    display: "flex", flexDirection: "column",
    overflowY: "auto", overflowX: "hidden",
    borderRight: `2px solid rgba(27,58,75,0.12)`,
  },
  iPadRight: {
    flex: 1,
    display: "flex", flexDirection: "column",
    overflowY: "auto",
    background: C.white,
    minWidth: 0,
  },

  // Placeholder shown in right pane when no verse is selected
  iPadPlaceholder: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: 48, textAlign: "center", gap: 12,
    background: C.offWhite,
  },
  iPadPlaceholderIcon: { marginBottom: 8, opacity: 0.5 },
  iPadPlaceholderTitle: {
    fontFamily: "'Oswald',sans-serif", fontSize: 20, fontWeight: 600,
    color: C.teal, margin: 0, textTransform: "uppercase", letterSpacing: "0.02em",
    opacity: 0.35,
  },
  iPadPlaceholderSub: {
    fontSize: 14, color: C.tealLight, margin: 0, opacity: 0.5, lineHeight: 1.5,
  },

  // Highlight the currently-open book card on iPad
  cardActive: {
    background: "rgba(27,58,75,0.07)",
    borderColor: "rgba(27,58,75,0.3)",
    boxShadow: `inset 3px 0 0 ${C.teal}`,
  },
};

// Panel styles
const ps = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(15,37,48,0.5)",
    zIndex: 900, animation: "fadeIn .2s ease forwards",
  },
  panel: {
    position: "fixed", top: 0, right: 0, bottom: 0,
    width: 520, maxWidth: "90vw",
    background: C.white, zIndex: 901,
    display: "flex", flexDirection: "column",
    boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
    animation: "slideIn .3s ease forwards",
    fontFamily: "'DM Sans',sans-serif",
  },
  panelHeader: {
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "20px 20px 16px",
    borderBottom: `2px solid ${C.yellow}`,
    background: C.teal,
  },
  panelTitle: {
    fontFamily: "'Oswald',sans-serif", fontSize: 22, fontWeight: 700,
    color: C.yellow, margin: 0, textTransform: "uppercase", letterSpacing: "0.02em",
  },
  translationBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px",
    background: "rgba(27,58,75,0.04)",
    borderBottom: `1px solid rgba(27,58,75,0.08)`,
  },
  translationSelect: {
    width: "100%", padding: "8px 12px",
    border: `1.5px solid rgba(27,58,75,0.18)`, borderRadius: 8,
    fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
    color: C.teal, background: C.white, outline: "none",
    cursor: "pointer", appearance: "auto",
  },
  copyrightNote: {
    fontSize: 15, color: C.teal, margin: "0 0 20px", lineHeight: 1.6,
    fontWeight: 500,
  },
  copyrightHint: {
    fontSize: 12, color: C.tealLight, margin: "16px 0 0", opacity: 0.7,
    lineHeight: 1.5,
  },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "rgba(255,255,255,0.6)", padding: 4, flexShrink: 0,
    marginTop: 2,
  },
  panelBody: {
    flex: 1, overflow: "auto", padding: "24px 20px",
  },
  loadingWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "60px 0", gap: 12,
  },
  panelSpinner: {
    width: 24, height: 24, border: `3px solid rgba(27,58,75,0.12)`,
    borderTopColor: C.teal, borderRadius: "50%", animation: "spin .8s linear infinite",
  },
  loadingText: {
    fontSize: 13, color: C.tealLight, margin: 0,
  },
  errorWrap: {
    textAlign: "center", padding: "40px 0",
  },
  errorText: {
    fontSize: 14, color: C.tealLight, margin: "0 0 16px",
  },
  youVersionBtn: {
    display: "inline-block", padding: "10px 20px", background: C.teal,
    color: C.yellow, borderRadius: 8, textDecoration: "none",
    fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
  },
  verseContent: {
    lineHeight: 1.8, color: C.teal,
  },
  verseLine: {
    fontSize: 16, margin: "0 0 12px", lineHeight: 1.8,
  },
  verseNum: {
    fontSize: 11, fontWeight: 700, color: C.tealLight, marginRight: 4,
    verticalAlign: "super", opacity: 0.7,
  },
  panelFooter: {
    padding: "14px 20px", borderTop: `1px solid rgba(27,58,75,0.1)`,
    textAlign: "center",
  },
  youVersionLink: {
    fontSize: 13, fontWeight: 600, color: C.teal, textDecoration: "none",
    borderBottom: `1px dashed rgba(27,58,75,0.3)`,
  },
  copyrightAttrib: {
    fontSize: 11, color: C.tealLight, margin: "20px 0 0", lineHeight: 1.5,
    opacity: 0.6, fontStyle: "italic",
  },

  // ── Sidebar (iPad) panel variants ────────────────────────────────────────
  panelSidebar: {
    display: "flex", flexDirection: "column",
    width: "100%", height: "100%",
    background: C.white,
    fontFamily: "'DM Sans',sans-serif",
  },
  panelHeaderSidebar: {
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "24px 28px 20px",
    borderBottom: `3px solid ${C.yellow}`,
    background: C.teal,
    flexShrink: 0,
  },
  panelTitleSidebar: {
    fontFamily: "'Oswald',sans-serif", fontSize: 26, fontWeight: 700,
    color: C.yellow, margin: 0, textTransform: "uppercase", letterSpacing: "0.02em",
    lineHeight: 1.1,
  },
  closeBtnSidebar: {
    background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
    color: "rgba(255,255,255,0.7)", padding: 8, flexShrink: 0,
    borderRadius: 8, marginTop: 0, transition: "background .15s",
  },
  // Larger, more readable verse text for the sidebar
  verseContentSidebar: {
    lineHeight: 1.9, color: C.teal, maxWidth: 620,
  },
  verseLineSidebar: {
    fontSize: 19, margin: "0 0 18px", lineHeight: 1.9,
    fontWeight: 400, letterSpacing: "0.01em",
  },

  // ── Originals toggle ─────────────────────────────────────────────────────
  studyToggle: {
    flexShrink: 0,
    padding: "7px 12px",
    border: `1.5px solid rgba(27,58,75,0.18)`,
    borderRadius: 8,
    background: C.white,
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 12, fontWeight: 700,
    color: C.teal,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
    transition: "all .15s",
  },
  studyToggleOn: {
    background: C.teal,
    color: C.yellow,
    borderColor: C.teal,
  },
  originalsSection: {
    margin: "24px 0 0",
    paddingTop: 18,
    borderTop: `1px dashed rgba(27,58,75,0.18)`,
  },
  originalsLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: C.teal,
    opacity: 0.55,
    marginBottom: 10,
    fontFamily: "'DM Sans',sans-serif",
  },
};
