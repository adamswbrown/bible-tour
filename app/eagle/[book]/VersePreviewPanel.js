"use client";

import { useEffect, useMemo, useState } from "react";

import {
  EAGLE_DEFAULT_TRANSLATION,
  EAGLE_TRANSLATION_STORAGE_KEY,
  TRANSLATIONS,
  buildApiQuery,
  buildUsfmParts,
  buildYouVersionUrl,
  getTranslation,
} from "../../lib/translations";

const C = {
  ink: "#162636",
  muted: "#597083",
  teal: "#1b3a4b",
  tealLight: "#2a5568",
  gold: "#f3bf21",
  paper: "#fffdf7",
  line: "rgba(22, 38, 54, 0.14)",
  soft: "rgba(27, 58, 75, 0.05)",
};

const EAGLE_AUDIO_STORAGE_KEY = "bt:eagleAudioEnabled";

function loadTranslation() {
  try {
    return localStorage.getItem(EAGLE_TRANSLATION_STORAGE_KEY) || EAGLE_DEFAULT_TRANSLATION;
  } catch {
    return EAGLE_DEFAULT_TRANSLATION;
  }
}

function storeTranslation(value) {
  try {
    localStorage.setItem(EAGLE_TRANSLATION_STORAGE_KEY, value);
  } catch {}
}

function loadAudioEnabled() {
  try {
    return localStorage.getItem(EAGLE_AUDIO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function storeAudioEnabled(value) {
  try {
    localStorage.setItem(EAGLE_AUDIO_STORAGE_KEY, value ? "1" : "0");
  } catch {}
}

async function fetchRefText(book, refText, translation) {
  const youVersionUrl = buildYouVersionUrl(book, refText, translation.youVersionId);

  if (translation.yvLicensed) {
    const parts = buildUsfmParts(book, refText);
    if (!parts) {
      return { state: "error", youVersionUrl };
    }

    try {
      const results = await Promise.all(
        parts.map((usfm) =>
          fetch(`/api/verse?bible_id=${translation.youVersionId}&usfm=${encodeURIComponent(usfm)}`).then((response) => {
            if (!response.ok) throw new Error("not-found");
            return response.json();
          })
        )
      );

      const combined = results
        .map((data) => (data.content || data.text || "").trim())
        .filter(Boolean)
        .join("\n\n");

      if (!combined) {
        return { state: "error", youVersionUrl };
      }

      return {
        state: "ready",
        text: combined,
        copyright: translation.copyright || null,
        youVersionUrl,
      };
    } catch {
      return { state: "error", youVersionUrl };
    }
  }

  if (translation.esvLicensed) {
    try {
      const response = await fetch(
        `/api/verse-esv?book=${encodeURIComponent(book)}&ref=${encodeURIComponent(refText)}`
      );
      if (!response.ok) throw new Error("not-found");
      const data = await response.json();
      const text = (data.text || "").trim();
      if (!text) {
        return { state: "error", youVersionUrl };
      }
      return {
        state: "ready",
        text,
        copyright: translation.copyright || null,
        youVersionUrl,
      };
    } catch {
      return { state: "error", youVersionUrl };
    }
  }

  if (translation.apiCode) {
    try {
      const query = buildApiQuery(book, refText);
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=${translation.apiCode}`);
      if (!response.ok) throw new Error("not-found");
      const data = await response.json();

      const text = data.verses?.length
        ? data.verses.map((verse) => verse.text.trim()).join("\n\n")
        : (data.text || "").trim();

      if (!text) {
        return { state: "error", youVersionUrl };
      }

      return {
        state: "ready",
        text,
        copyright: null,
        youVersionUrl,
      };
    } catch {
      return { state: "error", youVersionUrl };
    }
  }

  return { state: "copyrighted", youVersionUrl };
}

export default function VersePreviewPanel({ book, refs }) {
  const [translationId, setTranslationId] = useState(EAGLE_DEFAULT_TRANSLATION);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [results, setResults] = useState({});

  const previewRefs = useMemo(
    () =>
      refs.filter(
        (ref) =>
          ref.isStructured &&
          ref.kind !== "chapter-span" &&
          /:\d/.test(ref.text)
      ),
    [refs]
  );

  const manualRefs = useMemo(
    () => refs.filter((ref) => !previewRefs.some((candidate) => candidate.text === ref.text)),
    [previewRefs, refs]
  );

  useEffect(() => {
    setTranslationId(loadTranslation());
    setAudioEnabled(loadAudioEnabled());
  }, []);

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      storeAudioEnabled(next);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const translation = getTranslation(translationId);

    if (!previewRefs.length) {
      setResults({});
      return () => {
        cancelled = true;
      };
    }

    setResults(
      Object.fromEntries(
        previewRefs.map((ref) => [
          ref.text,
          { state: "loading", youVersionUrl: buildYouVersionUrl(book, ref.text, translation.youVersionId) },
        ])
      )
    );

    Promise.all(
      previewRefs.map(async (ref) => [ref.text, await fetchRefText(book, ref.text, translation)])
    ).then((entries) => {
      if (cancelled) return;
      setResults(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [book, previewRefs, translationId]);

  const translation = getTranslation(translationId);
  const hasCopyright = Object.values(results).some((result) => result?.copyright);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Target Verses</p>
          <h3 style={styles.title}>Read These In {translation.abbr}</h3>
          <p style={styles.copy}>
            The Eagle page defaults to NIV, but you can switch to any version supported by the main app.
          </p>
        </div>

        <div style={styles.controls}>
          <div style={styles.badge}>Showing {translation.abbr}</div>
          <select
            aria-label="Choose verse translation"
            value={translationId}
            onChange={(event) => {
              setTranslationId(event.target.value);
              storeTranslation(event.target.value);
            }}
            style={styles.select}
          >
            {TRANSLATIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.abbr} — {option.name}
                {!option.apiCode && !option.yvLicensed && !option.esvLicensed && !option.original ? " (YouVersion)" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleAudio}
            aria-pressed={audioEnabled}
            style={{ ...styles.audioToggle, ...(audioEnabled ? styles.audioToggleOn : {}) }}
            title={audioEnabled ? "Hide ESV audio players" : "Show ESV audio players on every verse"}
          >
            {audioEnabled ? "🎧 Audio On" : "🎧 Audio"}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {previewRefs.map((ref) => {
          const result = results[ref.text];

          return (
            <article key={ref.text} style={styles.card}>
              <div style={styles.cardHead}>
                <h4 style={styles.ref}>{ref.text}</h4>
                <span style={styles.refVersion}>{translation.abbr}</span>
              </div>

              {result?.state === "loading" && <p style={styles.meta}>Loading verse text…</p>}

              {result?.state === "ready" && (
                <>
                  <p style={styles.text}>{result.text}</p>
                  {result.copyright ? <p style={styles.copyright}>{result.copyright}</p> : null}
                </>
              )}

              {audioEnabled && (
                <div style={styles.audioRow}>
                  <span style={styles.audioPill}>ESV Audio</span>
                  <audio
                    controls
                    preload="none"
                    style={styles.audioPlayer}
                    src={`/api/verse-audio?book=${encodeURIComponent(book)}&ref=${encodeURIComponent(ref.text)}`}
                  >
                    Your browser doesn’t support audio playback.
                  </audio>
                </div>
              )}

              {result?.state === "copyrighted" && (
                <div style={styles.noticeBox}>
                  <p style={styles.meta}>
                    {translation.name} can’t be shown inline here.
                  </p>
                  <a href={result.youVersionUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
                    Read {ref.text} on YouVersion
                  </a>
                </div>
              )}

              {result?.state === "error" && (
                <div style={styles.noticeBox}>
                  <p style={styles.meta}>Could not load this verse right now.</p>
                  {result.youVersionUrl ? (
                    <a href={result.youVersionUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>
                      Open {ref.text} in {translation.abbr}
                    </a>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}

        {manualRefs.map((ref) => (
          <article key={ref.text} style={styles.card}>
            <div style={styles.cardHead}>
              <h4 style={styles.ref}>{ref.text}</h4>
              <span style={styles.refVersion}>Manual</span>
            </div>
            <p style={styles.meta}>
              This reading-plan item is qualitative or spans too broadly for inline verse text.
              Use the selected version in your own Bible while following the map below.
            </p>
          </article>
        ))}
      </div>

      {hasCopyright ? (
        <p style={styles.footerNote}>
          Licensed translation text is shown with attribution when available. Some copyrighted versions open on YouVersion instead.
        </p>
      ) : null}

      {audioEnabled ? (
        <p style={styles.footerNote}>
          Scripture audio from the ESV® Bible (The Holy Bible, English Standard Version®) © 2001 by{" "}
          <a href="https://www.crossway.org/" target="_blank" rel="noreferrer" style={styles.audioFootLink}>Crossway</a>
          , a publishing ministry of Good News Publishers. Used by permission. All rights reserved.
        </p>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    marginBottom: 18,
    padding: 18,
    borderRadius: 20,
    background: C.paper,
    border: `1px solid ${C.line}`,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  kicker: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.tealLight,
  },
  title: {
    margin: "0 0 6px",
    fontFamily: "\"Oswald\", \"Arial Narrow\", sans-serif",
    fontSize: 28,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: C.ink,
  },
  copy: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: C.muted,
    maxWidth: "54ch",
  },
  controls: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: C.soft,
    border: `1px solid ${C.line}`,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: C.teal,
  },
  select: {
    minWidth: 220,
    padding: "10px 12px",
    borderRadius: 10,
    border: `1.5px solid ${C.line}`,
    background: "white",
    color: C.teal,
    fontSize: 13,
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
  },
  audioToggle: {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1.5px solid ${C.line}`,
    background: "white",
    color: C.teal,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "pointer",
    outline: "none",
    transition: "all .15s",
  },
  audioToggleOn: {
    background: C.teal,
    color: C.gold,
    borderColor: C.teal,
  },
  audioRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${C.line}`,
  },
  audioPill: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 4,
    background: C.teal,
    color: C.gold,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  audioPlayer: {
    flex: "1 1 200px",
    minWidth: 0,
    height: 36,
  },
  audioFootLink: {
    color: C.muted,
    textDecoration: "underline",
  },
  grid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  card: {
    padding: 16,
    borderRadius: 18,
    border: `1px solid ${C.line}`,
    background: "white",
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "baseline",
    marginBottom: 10,
  },
  ref: {
    margin: 0,
    fontFamily: "\"Oswald\", \"Arial Narrow\", sans-serif",
    fontSize: 22,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: C.ink,
  },
  refVersion: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: C.tealLight,
  },
  text: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.75,
    color: C.ink,
    whiteSpace: "pre-wrap",
  },
  meta: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: C.muted,
  },
  noticeBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  linkBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    padding: "9px 12px",
    borderRadius: 10,
    background: C.teal,
    color: "white",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
  },
  copyright: {
    margin: "12px 0 0",
    fontSize: 11,
    lineHeight: 1.5,
    color: C.muted,
    opacity: 0.8,
  },
  footerNote: {
    margin: "14px 0 0",
    fontSize: 12,
    lineHeight: 1.5,
    color: C.muted,
  },
};
