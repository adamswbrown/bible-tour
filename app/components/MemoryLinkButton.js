"use client";
import { useState } from "react";

// Floating link to the Memory surface. Earn-the-UI: the parent only renders
// this once the deck has at least one saved verse, so it never nags people
// who haven't tried the feature. Sits above the Eagle button (bottom: 72).
export default function MemoryLinkButton({ visible }) {
  const [hover, setHover] = useState(false);

  if (!visible) return null;

  return (
    <a
      href="/memory"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Go to Memory"
      style={{ ...styles.btn, ...(hover ? styles.btnHover : null) }}
    >
      <span aria-hidden="true" style={styles.star}>★</span>
      <span style={styles.label}>Memory</span>
    </a>
  );
}

const styles = {
  btn: {
    position: "fixed",
    bottom: 124,
    right: 20,
    zIndex: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    border: "none",
    borderRadius: 999,
    background: "#1B3A4B",
    color: "#FFCB21",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(15, 37, 48, 0.25)",
    transition: "transform 120ms ease, box-shadow 120ms ease",
  },
  btnHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 6px 18px rgba(15, 37, 48, 0.32)",
  },
  star: { fontSize: 15, lineHeight: 1 },
  label: { lineHeight: 1 },
};
