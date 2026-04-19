"use client";
import { useRef } from "react";

// Renders a tokenized verse as tappable word spans.
// Tagged words (with Strong's number `s`) get a dotted underline and fire `onWordClick`.
// Untagged words render as plain text. Punctuation is already attached to words by the data pipeline.
export default function StudyVerse({ verseId, tokens, onWordClick, activeStrong }) {
  if (!tokens || tokens.length === 0) return null;

  return (
    <span data-verse-id={verseId} style={styles.wrap}>
      {tokens.map((tok, i) => {
        const tagged = !!tok.s;
        const active = tagged && activeStrong && tok.s === activeStrong;
        const sep = i > 0 ? " " : "";

        if (!tagged) {
          return (
            <span key={`${verseId}-${i}`} style={styles.plain}>
              {sep}{tok.w}
            </span>
          );
        }

        return (
          <WordSpan
            key={`${verseId}-${i}`}
            sep={sep}
            token={tok}
            active={active}
            onWordClick={onWordClick}
          />
        );
      })}
    </span>
  );
}

function WordSpan({ sep, token, active, onWordClick }) {
  const ref = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = ref.current ? ref.current.getBoundingClientRect() : null;
    if (typeof onWordClick === "function") onWordClick(token, rect);
  };

  const style = {
    ...styles.tagged,
    ...(active ? styles.taggedActive : {}),
  };

  return (
    <>
      {sep && <span style={styles.plain}>{sep}</span>}
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick(e);
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.borderBottomColor = "#4a6a82";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.borderBottomColor = "#8ab";
        }}
        data-strong={token.s}
        style={style}
      >
        {token.w}
      </span>
    </>
  );
}

const styles = {
  wrap: {
    display: "inline",
    lineHeight: 1.9,
    color: "inherit",
  },
  plain: {
    color: "inherit",
    whiteSpace: "pre-wrap",
  },
  tagged: {
    display: "inline",
    color: "inherit",
    cursor: "pointer",
    borderBottom: "1px dotted #8ab",
    transition: "border-bottom-color .15s",
    WebkitTapHighlightColor: "transparent",
  },
  taggedActive: {
    borderBottom: "1px solid #d97706",
    color: "inherit",
  },
};
