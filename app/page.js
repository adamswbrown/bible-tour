"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const READING_PLAN = {
  "Old Testament": [
    { book: "Genesis", refs: "12:2-3 and 50:20" },
    { book: "Exodus", refs: "3:7-8 and 20:1-17" },
    { book: "Leviticus", refs: "19:1-2" },
    { book: "Numbers", refs: "14:33-34" },
    { book: "Deuteronomy", refs: "6:4-5" },
    { book: "Joshua", refs: "1:6 and 24:15" },
    { book: "Judges", refs: "21:25" },
    { book: "Ruth", refs: "1:16" },
    { book: "I Samuel", refs: "8:5, 15:22 and 16:7" },
    { book: "II Samuel", refs: "7:16" },
    { book: "I Kings", refs: "9:1-9 and 18:21" },
    { book: "II Kings", refs: "17:13-14" },
    { book: "I Chronicles", refs: "29:10-11" },
    { book: "II Chronicles", refs: "7:14" },
    { book: "Ezra", refs: "1:3 and 7:10" },
    { book: "Nehemiah", refs: "1:4-11 and 2:18" },
    { book: "Esther", refs: "4:14-16" },
    { book: "Job", refs: "1:21" },
    { book: "Psalms", refs: "23:1 and 46:1" },
    { book: "Proverbs", refs: "1:7, 9:10 and any five random proverbs from chapters 10-29" },
    { book: "Ecclesiastes", refs: "1:2 and 12:13" },
    { book: "Song of Songs", refs: "8:6-7" },
    { book: "Isaiah", refs: "1:18 and 52:13-53:12" },
    { book: "Jeremiah", refs: "3:12-13 and 31:33" },
    { book: "Lamentations", refs: "3:22-23" },
    { book: "Ezekiel", refs: "36:26" },
    { book: "Daniel", refs: "2:44 and 7:13-14" },
    { book: "Hosea", refs: "6:6" },
    { book: "Joel", refs: "2:13-14" },
    { book: "Amos", refs: "5:24 and 7:7-8" },
    { book: "Obadiah", refs: "1:13-15 and 1:21" },
    { book: "Jonah", refs: "4:2" },
    { book: "Micah", refs: "6:8" },
    { book: "Nahum", refs: "1:7-8" },
    { book: "Habakkuk", refs: "2:4" },
    { book: "Zephaniah", refs: "3:17" },
    { book: "Haggai", refs: "1:8" },
    { book: "Zechariah", refs: "9:9-10" },
    { book: "Malachi", refs: "3:1 and 4:2" },
  ],
  "New Testament": [
    { book: "Matthew", refs: "5:17, 16:6 and 28:18-20", note: "If you have extra time, also read 5:1-29" },
    { book: "Mark", refs: "1:1 and 10:45" },
    { book: "Luke", refs: "19:10 and 24:1-12" },
    { book: "John", refs: "1:1-3, 3:16, 14:6 and 20:31" },
    { book: "Acts", refs: "1:8 and 2:38" },
    { book: "Romans", refs: "1:16-17, 3:23, 6:23 and 10:9" },
    { book: "I Corinthians", refs: "1:10 and 15:3-4" },
    { book: "II Corinthians", refs: "5:17 and 5:20" },
    { book: "Galatians", refs: "2:16, 5:1 and 5:22-26" },
    { book: "Ephesians", refs: "2:8-10 and 6:10-17" },
    { book: "Philippians", refs: "2:5-11" },
    { book: "Colossians", refs: "1:15-18" },
    { book: "I Thessalonians", refs: "4:16-18" },
    { book: "II Thessalonians", refs: "2:15 and 3:13" },
    { book: "I Timothy", refs: "1:15, 2:5-6 and 3:15" },
    { book: "II Timothy", refs: "4:7-8" },
    { book: "Titus", refs: "2:11-15" },
    { book: "Philemon", refs: "1:15-16" },
    { book: "Hebrews", refs: "4:4 and 12:1" },
    { book: "James", refs: "1:22" },
    { book: "I Peter", refs: "1:3-5 and 2:9-12" },
    { book: "II Peter", refs: "1:3-7 and 3:9" },
    { book: "I John", refs: "1:5-7" },
    { book: "II John", refs: "1:6" },
    { book: "III John", refs: "1:8" },
    { book: "Jude", refs: "1:3 and 1:23-24" },
    { book: "Revelation", refs: "1:7-8, 21:5 and 22:20-21" },
  ],
};

const TOTAL = READING_PLAN["Old Testament"].length + READING_PLAN["New Testament"].length;

const BOOK_ABBREV = {
  "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM",
  "Deuteronomy": "DEU", "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT",
  "I Samuel": "1SA", "II Samuel": "2SA", "I Kings": "1KI", "II Kings": "2KI",
  "I Chronicles": "1CH", "II Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH",
  "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
  "Ecclesiastes": "ECC", "Song of Songs": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
  "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS",
  "Joel": "JOL", "Amos": "AMO", "Obadiah": "OBA", "Jonah": "JON",
  "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP",
  "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
  "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
  "Acts": "ACT", "Romans": "ROM", "I Corinthians": "1CO", "II Corinthians": "2CO",
  "Galatians": "GAL", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL",
  "I Thessalonians": "1TH", "II Thessalonians": "2TH", "I Timothy": "1TI",
  "II Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB",
  "James": "JAS", "I Peter": "1PE", "II Peter": "2PE", "I John": "1JN",
  "II John": "2JN", "III John": "3JN", "Jude": "JUD", "Revelation": "REV",
};

// bible-api.com uses slightly different book names
const API_BOOK_NAMES = {
  "I Samuel": "1 Samuel", "II Samuel": "2 Samuel",
  "I Kings": "1 Kings", "II Kings": "2 Kings",
  "I Chronicles": "1 Chronicles", "II Chronicles": "2 Chronicles",
  "Song of Songs": "Song of Solomon",
  "I Corinthians": "1 Corinthians", "II Corinthians": "2 Corinthians",
  "I Thessalonians": "1 Thessalonians", "II Thessalonians": "2 Thessalonians",
  "I Timothy": "1 Timothy", "II Timothy": "2 Timothy",
  "I Peter": "1 Peter", "II Peter": "2 Peter",
  "I John": "1 John", "II John": "2 John", "III John": "3 John",
};

const TRANSLATIONS = [
  { id: "kjv", name: "King James Version", abbr: "KJV", apiCode: "kjv", youVersionId: 1, yvLicensed: false },
  { id: "niv", name: "New International Version", abbr: "NIV", apiCode: null, youVersionId: 111, yvLicensed: true,
    copyright: "Holy Bible, New International Version\u00ae, NIV\u00ae Copyright \u00a91973, 1978, 1984, 2011 by Biblica, Inc.\u00ae Used by permission. All rights reserved worldwide." },
  { id: "nirv", name: "New International Reader\u2019s Version", abbr: "NIrV", apiCode: null, youVersionId: 110, yvLicensed: true,
    copyright: "Copyright \u00a91995, 1996, 1998, 2014 by Biblica, Inc.\u00ae Used by permission. All rights reserved worldwide." },
  { id: "nivuk", name: "NIV (Anglicised)", abbr: "NIVUK", apiCode: null, youVersionId: 113, yvLicensed: true,
    copyright: "Holy Bible, New International Version\u00ae Anglicised, NIV\u00ae Copyright \u00a91979, 1984, 2011 by Biblica, Inc.\u00ae Used by permission. All rights reserved worldwide." },
  { id: "nkjv", name: "New King James Version", abbr: "NKJV", apiCode: null, youVersionId: 114, yvLicensed: false },
  { id: "nlt", name: "New Living Translation", abbr: "NLT", apiCode: null, youVersionId: 116, yvLicensed: false },
  { id: "csb", name: "Christian Standard Bible", abbr: "CSB", apiCode: null, youVersionId: 1713, yvLicensed: false },
  { id: "msg", name: "The Message", abbr: "MSG", apiCode: null, youVersionId: 97, yvLicensed: false },
  { id: "web", name: "World English Bible", abbr: "WEB", apiCode: "web", youVersionId: 206, yvLicensed: false },
  { id: "asv", name: "American Standard Version", abbr: "ASV", apiCode: "asv", youVersionId: 12, yvLicensed: false },
];

const DEFAULT_TRANSLATION = "kjv";

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

function buildYouVersionUrl(book, ref, translationId) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev) return null;
  const match = ref.match(/^(\d+):(.+)$/);
  if (!match) return null;
  const chapter = match[1];
  const verses = match[2];
  const bibleId = translationId || 111;
  return `https://www.bible.com/bible/${bibleId}/${abbrev}.${chapter}.${verses}`;
}

function buildApiQuery(book, ref) {
  const apiName = API_BOOK_NAMES[book] || book;
  return `${apiName} ${ref}`;
}

// Returns an array of USFM strings (multiple for cross-chapter ranges)
function buildUsfmParts(book, ref) {
  const abbrev = BOOK_ABBREV[book];
  if (!abbrev) return null;
  // ref like "3:16", "12:2-3", or "52:13-53:12"
  const dashMatch = ref.match(/^(\d+:\d+)-(\d+(?::\d+)?)$/);
  if (!dashMatch) {
    // Single verse: "3:16" → "GEN.3.16"
    return [abbrev + "." + ref.replace(":", ".")];
  }
  const start = dashMatch[1];
  const end = dashMatch[2];
  if (end.includes(":")) {
    // Cross-chapter range: "52:13-53:12" → two fetches
    const [startCh, startV] = start.split(":");
    const [endCh, endV] = end.split(":");
    const parts = [];
    // First partial chapter: e.g. ISA.52.13-15 (use 200 as generous end)
    parts.push(abbrev + "." + startCh + "." + startV + "-200");
    // Middle full chapters
    for (let ch = parseInt(startCh) + 1; ch < parseInt(endCh); ch++) {
      parts.push(abbrev + "." + ch);
    }
    // Last partial chapter: e.g. ISA.53.1-12
    parts.push(abbrev + "." + endCh + ".1-" + endV);
    return parts;
  }
  // Same-chapter range: "12:2-3" → "GEN.12.2-3"
  return [abbrev + "." + start.replace(":", ".") + "-" + end];
}

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

function VersePanel({ book, verseRef, onClose }) {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyright, setCopyright] = useState(null);
  const [translationId, setTranslationId] = useState(() => {
    try { return localStorage.getItem("bt:translation") || DEFAULT_TRANSLATION; } catch { return DEFAULT_TRANSLATION; }
  });
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
    try { localStorage.setItem("bt:translation", newId); } catch {}
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const displayRef = `${book} ${verseRef}`;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={ps.backdrop} />
      {/* Panel */}
      <div ref={panelRef} style={ps.panel}>
        <div style={ps.panelHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={ps.panelTitle}>{displayRef}</h2>
          </div>
          <button onClick={onClose} style={ps.closeBtn} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Translation picker */}
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
            <div style={ps.verseContent}>
              {text.map((v, i) => (
                <p key={i} style={ps.verseLine}>
                  {v.verse && <sup style={ps.verseNum}>{v.verse}</sup>}
                  {v.text}
                </p>
              ))}
              {copyright && (
                <p style={ps.copyrightAttrib}>{copyright}</p>
              )}
            </div>
          )}
        </div>

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

function userKey(name, pin) {
  const raw = `${name.toLowerCase().trim()}:${pin}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `bt:${Math.abs(hash).toString(36)}`;
}

function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function load(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

function Avatar({ name, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: C.yellow,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: C.teal, fontFamily: "'DM Sans',sans-serif",
      fontSize: size * 0.48, fontWeight: 800, flexShrink: 0,
      border: `2px solid ${C.teal}`,
    }}>{(name || "?")[0].toUpperCase()}</div>
  );
}

function LightningIcon({ size = 24, color = C.yellow }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M13 2L4.09 12.11C3.68 12.59 3.48 12.84 3.49 13.05C3.49 13.23 3.58 13.4 3.72 13.51C3.89 13.63 4.21 13.63 4.86 13.63H12L11 22L19.91 11.89C20.32 11.41 20.52 11.16 20.51 10.95C20.51 10.77 20.42 10.6 20.28 10.49C20.11 10.37 19.79 10.37 19.14 10.37H12L13 2Z" />
    </svg>
  );
}

function LoginScreen({ onLogin, error }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const canSubmit = name.trim().length > 0 && /^\d{4}$/.test(pin);
  const go = () => { if (canSubmit) onLogin(name.trim(), pin); };

  return (
    <div style={s.loginOuter}>
      <div style={s.loginCard}>
        <LightningIcon size={48} color={C.yellow} />
        <h1 style={s.loginTitle}>Tour of the Bible</h1>
        <p style={s.loginSub}>Taste every book in 90 minutes</p>
        <p style={s.loginDisclaimer}>
          Inspired by Matt Whitman&rsquo;s{" "}
          <a href="https://www.thetmbh.com/tourofthebible" target="_blank" rel="noopener noreferrer" style={s.loginCreditLink}>
            Lightning-Fast Field Guide to the Bible
          </a>
          .{" "}Not affiliated with or endorsed by The Ten Minute Bible Hour.
        </p>
        <a href="https://youtu.be/XdMuZCTChJE?si=DRfBFUnDc2mt3Yq2" target="_blank" rel="noopener noreferrer"
          style={s.ytLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={C.teal} style={{ flexShrink: 0 }}>
            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.8 1-2.1 2C0 8.1 0 12 0 12s0 3.9.4 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.6.6 9.6.6s7.6 0 9.5-.6c1-.3 1.8-1 2.1-2 .4-1.9.4-5.8.4-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.4 3.6-6.4 3.6z"/>
          </svg>
          Watch Matt explain the tour
        </a>

        <div style={s.fieldGroup}>
          <label style={s.label}>Your name</label>
          <input autoFocus type="text" placeholder="e.g. Adam" value={name}
            onChange={e => setName(e.target.value)} style={s.input} maxLength={20}
            onKeyDown={e => e.key === "Enter" && document.getElementById("pin-input")?.focus()} />
        </div>

        <div style={s.fieldGroup}>
          <label style={s.label}>4-digit PIN</label>
          <div style={s.pinRow}>
            <input id="pin-input" type={showPin ? "text" : "password"}
              inputMode="numeric" pattern="[0-9]*" placeholder="----"
              value={pin} onChange={e => { const v = e.target.value.replace(/\D/g,""); if(v.length<=4) setPin(v); }}
              style={{ ...s.input, letterSpacing: showPin ? "0.1em" : "0.3em", flex: 1 }}
              onKeyDown={e => e.key === "Enter" && go()} />
            <button onClick={() => setShowPin(!showPin)} style={s.eyeBtn}
              title={showPin ? "Hide PIN" : "Show PIN"}>
              {showPin ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <p style={s.errorMsg}>{error}</p>}

        <button onClick={go} disabled={!canSubmit}
          style={{ ...s.goBtn, opacity: canSubmit ? 1 : 0.35 }}>
          Sign In
        </button>

        <p style={s.hint}>First time? Just pick any name and PIN to get started.</p>
      </div>
    </div>
  );
}

function ChecklistView({ user, checked, onToggle, onReset, onLogout }) {
  const [section, setSection] = useState("all");
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [versePanel, setVersePanel] = useState(null); // { book, ref, youVersionUrl }

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

  const vis = section === "ot" ? { "Old Testament": READING_PLAN["Old Testament"] }
    : section === "nt" ? { "New Testament": READING_PLAN["New Testament"] }
    : READING_PLAN;

  return (
    <div style={s.outer}>
      {showCelebrate && (
        <div style={s.celebrate}>
          <LightningIcon size={36} color={C.yellow} />
          <p style={s.celebrateText}>Amazing, {user}! All 66 books!</p>
        </div>
      )}

      <header style={s.header}>
        <div style={s.headerRow}>
          <div style={{ flex: 1 }} />
          <div style={s.headerCenter}>
            <LightningIcon size={22} color={C.yellow} />
            <h1 style={s.title}>Tour of the Bible</h1>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Avatar name={user} size={30} />
          </div>
        </div>
        <div style={s.headerMeta}>
          <span style={s.greeting}>Hi, {user}</span>
          <button onClick={onLogout} style={s.logoutBtn}>Sign out</button>
        </div>
      </header>

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

      <div style={s.listWrap}>
        {Object.entries(vis).map(([sec, readings]) => {
          const secDone = readings.filter(r => checked[r.book]).length;
          return (
            <div key={sec}>
              <div style={s.secHeader}>
                <h2 style={s.secTitle}>{sec}</h2>
                <span style={s.secCount}>{secDone}/{readings.length}</span>
              </div>
              <div style={s.grid}>
                {readings.map((r, i) => {
                  const done = !!checked[r.book];
                  return (
                    <button key={r.book} onClick={() => toggle(r.book)}
                      style={{ ...s.card, ...(done ? s.cardDone : {}) }}>
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
      </footer>

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

export default function Page() {
  const [phase, setPhase] = useState("loading");
  const [user, setUser] = useState(null);
  const [storageKey, setStorageKey] = useState(null);
  const [checked, setChecked] = useState({});
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const sess = load("bt:_session");
    if (sess?.name && sess?.key) {
      const data = load(sess.key);
      setUser(sess.name);
      setStorageKey(sess.key);
      setChecked(data?.progress || {});
      setPhase("checklist");
    } else {
      setPhase("login");
    }
  }, []);

  const handleLogin = useCallback((name, pin) => {
    const k = userKey(name, pin);
    setLoginError("");
    const existing = load(k);
    if (existing && existing._name && existing._name.toLowerCase() !== name.toLowerCase()) {
      setLoginError("Incorrect name or PIN. Please try again.");
      return;
    }
    const data = existing || { _name: name, progress: {} };
    if (!data._name) data._name = name;
    if (!data.progress) data.progress = {};
    store(k, data);
    store("bt:_session", { name, key: k });
    setUser(name);
    setStorageKey(k);
    setChecked(data.progress);
    setPhase("checklist");
  }, []);

  const handleToggle = useCallback((book) => {
    setChecked(prev => {
      const next = { ...prev, [book]: !prev[book] };
      Object.keys(next).forEach(b => { if (!next[b]) delete next[b]; });
      const data = load(storageKey) || { _name: user };
      data.progress = next;
      store(storageKey, data);
      return next;
    });
  }, [storageKey, user]);

  const handleReset = useCallback(() => {
    if (window.confirm("Reset all your reading progress? This can't be undone.")) {
      setChecked({});
      const data = load(storageKey) || { _name: user };
      data.progress = {};
      store(storageKey, data);
    }
  }, [storageKey, user]);

  const handleLogout = useCallback(() => {
    remove("bt:_session");
    setUser(null);
    setStorageKey(null);
    setChecked({});
    setLoginError("");
    setPhase("login");
  }, []);

  if (phase === "loading") {
    return (
      <div style={s.loadWrap}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={s.spinner} />
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:translateY(-16px)scale(.95)}to{opacity:1;transform:translateY(0)scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        input::placeholder{color:rgba(27,58,75,0.3)}
        input:focus{border-color:${C.teal} !important;box-shadow:0 0 0 3px rgba(27,58,75,0.1)}
        @media(max-width:600px){
          .verse-panel{width:100% !important;max-width:100% !important;border-radius:20px 20px 0 0 !important;top:auto !important;bottom:0 !important;max-height:75vh !important;animation:slideUp .3s ease forwards !important}
        }
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
      {phase === "login" && <LoginScreen onLogin={handleLogin} error={loginError} />}
      {phase === "checklist" && (
        <ChecklistView user={user} checked={checked}
          onToggle={handleToggle} onReset={handleReset} onLogout={handleLogout} />
      )}
    </>
  );
}

const s = {
  // Loading
  loadWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.yellow },
  spinner: { width: 28, height: 28, border: `3px solid rgba(27,58,75,0.15)`, borderTopColor: C.teal, borderRadius: "50%", animation: "spin .8s linear infinite" },

  // Login
  loginOuter: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.teal, padding: 20 },
  loginCard: { background: C.yellow, borderRadius: 16, padding: "40px 32px 32px", textAlign: "center", maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", alignItems: "center" },
  loginTitle: { fontFamily: "'Oswald',sans-serif", fontSize: 30, fontWeight: 700, color: C.teal, margin: "8px 0 4px", textTransform: "uppercase", letterSpacing: "0.02em" },
  loginSub: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.tealLight, margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 },
  loginDisclaimer: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.tealLight, margin: "8px 0 6px", lineHeight: 1.6, maxWidth: 300 },
  loginCreditLink: { color: C.teal, fontWeight: 600, textDecoration: "none", borderBottom: `1px dashed rgba(27,58,75,0.3)` },
  ytLink: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: C.teal, textDecoration: "none", margin: "4px 0 28px", padding: "6px 12px", borderRadius: 6, background: "rgba(27,58,75,0.08)", border: `1px solid rgba(27,58,75,0.12)` },
  fieldGroup: { textAlign: "left", marginBottom: 16, width: "100%" },
  label: { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 },
  input: { width: "100%", padding: "11px 14px", border: `2px solid rgba(27,58,75,0.2)`, borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.teal, background: C.white, outline: "none", boxSizing: "border-box", fontWeight: 500 },
  pinRow: { display: "flex", gap: 8, alignItems: "center" },
  eyeBtn: { background: "none", border: `1.5px solid rgba(27,58,75,0.2)`, borderRadius: 8, fontSize: 12, cursor: "pointer", padding: "10px 12px", lineHeight: 1, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: C.teal },
  errorMsg: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#c0392b", margin: "0 0 12px", animation: "shake 0.4s ease", fontWeight: 600 },
  goBtn: { width: "100%", padding: "13px 24px", border: "none", borderRadius: 8, background: C.teal, color: C.yellow, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "opacity .2s", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" },
  hint: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.tealLight, lineHeight: 1.5, margin: 0, opacity: 0.7 },

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
  progressSection: { padding: "20px 20px 12px", maxWidth: 600, margin: "0 auto" },
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

  // Celebrate
  celebrate: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: C.teal, color: C.white, padding: "18px 28px", borderRadius: 14, textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", animation: "popIn .4s ease forwards", display: "flex", flexDirection: "column", alignItems: "center" },
  celebrateText: { fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 600, margin: "6px 0 0", color: C.yellow },
};

// Panel styles
const ps = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(15,37,48,0.5)",
    zIndex: 900, animation: "fadeIn .2s ease forwards",
  },
  panel: {
    position: "fixed", top: 0, right: 0, bottom: 0,
    width: 420, maxWidth: "90vw",
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
};
