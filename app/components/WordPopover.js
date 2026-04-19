"use client";
import { useEffect, useState, useRef } from "react";

// Small fixed-position popover showing a Strong's entry summary.
// - Positions below anchor if there's room, otherwise above. Clamps to viewport (12px margin).
// - On narrow viewports (<480px): renders as a bottom sheet instead of anchored popover.
// - Closes on outside click, Escape, route change (route change = parent unmounts / sets open=false).
export default function WordPopover({ open, anchor, entry, onClose, onOpenFull }) {
  const [isNarrow, setIsNarrow] = useState(false);
  const [pos, setPos] = useState(null);
  const popRef = useRef(null);

  // Track viewport width for bottom-sheet vs anchored popover
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 479px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Compute anchored position (desktop / tablet)
  useEffect(() => {
    if (!open || !anchor || isNarrow) { setPos(null); return; }
    const MARGIN = 12;
    const width = 280;
    // Start with an estimated height; refine after mount below
    const estHeight = 180;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - anchor.bottom;
    const spaceAbove = anchor.top;
    const placeBelow = spaceBelow >= estHeight + MARGIN || spaceBelow >= spaceAbove;

    let top = placeBelow ? anchor.bottom + 8 : anchor.top - estHeight - 8;
    let left = anchor.left + (anchor.width / 2) - (width / 2);

    // Clamp horizontally
    if (left < MARGIN) left = MARGIN;
    if (left + width > vw - MARGIN) left = vw - width - MARGIN;
    // Clamp vertically
    if (top < MARGIN) top = MARGIN;
    if (top + estHeight > vh - MARGIN) top = vh - estHeight - MARGIN;

    setPos({ top, left, width, placeBelow });
  }, [open, anchor, isNarrow, entry]);

  // Refine position once real height is known
  useEffect(() => {
    if (!open || !anchor || isNarrow || !popRef.current || !pos) return;
    const real = popRef.current.getBoundingClientRect();
    const MARGIN = 12;
    const vh = window.innerHeight;
    let top = pos.top;
    if (pos.placeBelow) {
      // already below; clamp bottom
      if (top + real.height > vh - MARGIN) top = Math.max(MARGIN, vh - real.height - MARGIN);
    } else {
      // place above: recompute using real height
      top = anchor.top - real.height - 8;
      if (top < MARGIN) top = MARGIN;
    }
    if (top !== pos.top) setPos({ ...pos, top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anchor, isNarrow, entry, popRef.current]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !entry) return null;

  const popStyle = isNarrow
    ? styles.bottomSheet
    : {
        ...styles.popover,
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        width: pos ? pos.width : 280,
        visibility: pos ? "visible" : "hidden",
      };

  const strongsId = entry.strongsId || entry.id || "";

  return (
    <>
      {/* Transparent backdrop — intercepts outside clicks */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
        }}
        style={styles.backdrop}
      />
      <div
        ref={popRef}
        role="dialog"
        aria-label="Word summary"
        onMouseDown={(e) => e.stopPropagation()}
        style={popStyle}
      >
        <div style={styles.header}>
          <span style={styles.lemma}>{entry.lemma}</span>
          {entry.translit && <span style={styles.translit}>{entry.translit}</span>}
        </div>

        <div style={styles.meta}>
          {strongsId && <span style={styles.strongsId}>{strongsId}</span>}
          {strongsId && entry.pos && <span style={styles.metaDot}> · </span>}
          {entry.pos && <span style={styles.pos}>{entry.pos}</span>}
        </div>

        {entry.gloss && (
          <p style={styles.gloss}>&ldquo;{entry.gloss}&rdquo;</p>
        )}

        <div style={styles.actions}>
          <button type="button" onClick={onOpenFull} style={styles.fullBtn}>
            Full entry
            <span aria-hidden="true" style={styles.arrow}>▸</span>
          </button>
        </div>
      </div>
    </>
  );
}

const TEAL = "#1B3A4B";
const TEAL_LIGHT = "#2A5568";
const YELLOW = "#FFCB21";

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "transparent",
    zIndex: 800,
  },
  popover: {
    position: "fixed",
    background: "#fff",
    border: "1px solid rgba(27,58,75,0.18)",
    borderRadius: 12,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
    padding: "14px 16px 12px",
    fontFamily: "'DM Sans',sans-serif",
    color: TEAL,
    zIndex: 801,
    boxSizing: "border-box",
  },
  bottomSheet: {
    position: "fixed",
    left: 16, right: 16, bottom: 16,
    width: "calc(100vw - 32px)",
    background: "#fff",
    border: "1px solid rgba(27,58,75,0.18)",
    borderRadius: 14,
    boxShadow: "0 -8px 28px rgba(0,0,0,0.22)",
    padding: "16px 18px 14px",
    fontFamily: "'DM Sans',sans-serif",
    color: TEAL,
    zIndex: 801,
    boxSizing: "border-box",
    animation: "fadeIn .15s ease forwards",
  },
  header: {
    display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
  },
  lemma: {
    fontSize: 22, fontWeight: 700, color: TEAL,
    fontFamily: "'Oswald',sans-serif",
    letterSpacing: "0.01em",
  },
  translit: {
    fontSize: 16, fontStyle: "italic", color: TEAL_LIGHT,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: TEAL_LIGHT,
    opacity: 0.8,
  },
  strongsId: {
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  metaDot: { opacity: 0.6 },
  pos: { fontStyle: "normal" },
  gloss: {
    margin: "12px 0 4px",
    fontSize: 14,
    fontStyle: "italic",
    color: TEAL,
    lineHeight: 1.5,
  },
  actions: {
    marginTop: 12,
    display: "flex",
    justifyContent: "flex-end",
  },
  fullBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "none",
    border: "none",
    padding: "4px 2px",
    color: TEAL,
    fontSize: 13, fontWeight: 700,
    fontFamily: "'DM Sans',sans-serif",
    cursor: "pointer",
    borderBottom: "1px dashed rgba(27,58,75,0.3)",
  },
  arrow: { fontSize: 12 },
};
