"use client";
import { useEffect, useState, useRef } from "react";

// Bottom-sheet drawer (mobile) / right-side panel (desktop) showing full lexicon entry.
// z-index sits one above VersePanel (900/901) — uses 910 (backdrop) / 911 (panel).
export default function LexiconDrawer({ open, entry, strongsId, onClose }) {
  const [isWide, setIsWide] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 600px)");
    const sync = () => setIsWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !entry) return null;

  const blbUrl = strongsId
    ? `https://www.blueletterbible.org/lexicon/${strongsId}/kjv/wlc/0-1/`
    : null;

  const paragraphs = (entry.entry || "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <div onClick={onClose} style={styles.backdrop} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Lexicon entry"
        style={isWide ? styles.panelDesktop : styles.panelMobile}
        className="lexicon-drawer"
      >
        <div style={styles.header}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={styles.closeBtn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={styles.headerText}>
            <div style={styles.headerTop}>
              {strongsId && <span style={styles.strongsId}>{strongsId}</span>}
              {strongsId && <span style={styles.headerDot}> · </span>}
              <span style={styles.lemma}>{entry.lemma}</span>
            </div>
            {entry.translit && (
              <div style={styles.translit}>{entry.translit}</div>
            )}
          </div>
        </div>

        <div style={styles.body}>
          {entry.pos && (
            <div style={styles.fieldRow}>
              <span style={styles.fieldLabel}>Part of speech</span>
              <span style={styles.fieldValue}>{entry.pos}</span>
            </div>
          )}

          {entry.gloss && (
            <div style={styles.fieldRow}>
              <span style={styles.fieldLabel}>Gloss</span>
              <span style={{ ...styles.fieldValue, fontStyle: "italic" }}>
                &ldquo;{entry.gloss}&rdquo;
              </span>
            </div>
          )}

          {paragraphs.length > 0 && (
            <>
              <hr style={styles.divider} />
              <div style={styles.entryBlock}>
                {paragraphs.map((p, i) => (
                  <p key={i} style={styles.entryPara}>{p}</p>
                ))}
              </div>
            </>
          )}

          {blbUrl && (
            <>
              <hr style={styles.divider} />
              <div style={styles.studyFurther}>
                <div style={styles.studyFurtherTitle}>
                  Study further <span aria-hidden="true">↓</span>
                </div>
                <a
                  href={blbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.blbBtn}
                >
                  Open on Blue Letter Bible
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 8 }} aria-hidden="true">
                    <path d="M4.5 2H3C2.44772 2 2 2.44772 2 3V9C2 9.55228 2.44772 10 3 10H9C9.55228 10 10 9.55228 10 9V7.5M7 2H10M10 2V5M10 2L5.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </>
          )}

          <p style={styles.attribution}>
            Strong&rsquo;s dictionary from{" "}
            <a
              href="https://github.com/openscriptures/strongs"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.attributionLink}
            >
              Open Scriptures
            </a>{" "}
            (CC BY-SA 3.0)
          </p>
        </div>

        <style>{`
          @keyframes lexDrawerSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes lexDrawerSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
      </div>
    </>
  );
}

const TEAL = "#1B3A4B";
const TEAL_LIGHT = "#2A5568";
const YELLOW = "#FFCB21";
const WHITE = "#FFFFFF";

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(15,37,48,0.55)",
    zIndex: 910, animation: "fadeIn .2s ease forwards",
  },
  panelDesktop: {
    position: "fixed", top: 0, right: 0, bottom: 0,
    width: 520, maxWidth: "90vw",
    background: WHITE, zIndex: 911,
    display: "flex", flexDirection: "column",
    boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
    animation: "lexDrawerSlideIn .3s ease forwards",
    fontFamily: "'DM Sans',sans-serif",
  },
  panelMobile: {
    position: "fixed", left: 0, right: 0, bottom: 0,
    width: "100%",
    maxHeight: "85vh",
    background: WHITE, zIndex: 911,
    display: "flex", flexDirection: "column",
    borderRadius: "20px 20px 0 0",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
    animation: "lexDrawerSlideUp .3s ease forwards",
    fontFamily: "'DM Sans',sans-serif",
  },
  header: {
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "20px 20px 16px",
    borderBottom: `2px solid ${YELLOW}`,
    background: TEAL,
    flexShrink: 0,
  },
  closeBtn: {
    background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
    color: "rgba(255,255,255,0.85)", padding: 8, flexShrink: 0,
    borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTop: {
    display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap",
    color: YELLOW,
    fontFamily: "'Oswald',sans-serif",
  },
  strongsId: {
    fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
    color: YELLOW, opacity: 0.85,
  },
  headerDot: { color: YELLOW, opacity: 0.5 },
  lemma: {
    fontSize: 24, fontWeight: 700,
    color: YELLOW, textTransform: "uppercase", letterSpacing: "0.02em",
    lineHeight: 1.15,
  },
  translit: {
    marginTop: 4,
    fontSize: 15, fontStyle: "italic",
    color: "rgba(255,203,33,0.8)",
    fontFamily: "'DM Sans',sans-serif",
  },
  body: {
    flex: 1, overflow: "auto", padding: "20px 22px 28px",
    color: TEAL,
  },
  fieldRow: {
    display: "flex", flexDirection: "column", gap: 2,
    margin: "0 0 12px",
  },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.1em", color: TEAL_LIGHT, opacity: 0.7,
  },
  fieldValue: {
    fontSize: 15, color: TEAL, lineHeight: 1.5,
  },
  divider: {
    border: "none", borderTop: "1px solid rgba(27,58,75,0.12)",
    margin: "18px 0",
  },
  entryBlock: { lineHeight: 1.7 },
  entryPara: {
    fontSize: 15, color: TEAL, margin: "0 0 12px", lineHeight: 1.7,
  },
  studyFurther: {
    display: "flex", flexDirection: "column", gap: 10,
    alignItems: "flex-start",
  },
  studyFurtherTitle: {
    fontSize: 12, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.1em", color: TEAL_LIGHT, opacity: 0.8,
  },
  blbBtn: {
    display: "inline-flex", alignItems: "center",
    padding: "10px 18px", background: TEAL,
    color: YELLOW, borderRadius: 8, textDecoration: "none",
    fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
  },
  attribution: {
    margin: "22px 0 0",
    fontSize: 11,
    color: TEAL_LIGHT,
    opacity: 0.6,
    lineHeight: 1.5,
    fontStyle: "italic",
  },
  attributionLink: {
    color: "inherit",
    textDecoration: "underline",
  },
};
