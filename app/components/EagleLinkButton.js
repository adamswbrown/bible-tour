"use client";
import { useState } from "react";

export default function EagleLinkButton({ visible }) {
  const [hover, setHover] = useState(false);

  if (!visible) return null;

  return (
    <a
      href="/eagle"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Go to Eagle Method"
      style={{ ...styles.btn, ...(hover ? styles.btnHover : null) }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
      </svg>
      <span style={styles.label}>Eagle</span>
    </a>
  );
}

const styles = {
  btn: {
    position: "fixed",
    bottom: 72,
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
  label: {
    lineHeight: 1,
  },
};
