"use client";
import { useState } from "react";

export default function TourLinkButton() {
  const [hover, setHover] = useState(false);

  return (
    <a
      href="/"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Back to Tour of the Bible"
      style={{ ...styles.btn, ...(hover ? styles.btnHover : null) }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13 2L4.09 12.11C3.68 12.59 3.48 12.84 3.49 13.05C3.49 13.23 3.58 13.4 3.72 13.51C3.89 13.63 4.21 13.63 4.86 13.63H12L11 22L19.91 11.89C20.32 11.41 20.52 11.16 20.51 10.95C20.51 10.77 20.42 10.6 20.28 10.49C20.11 10.37 19.79 10.37 19.14 10.37H12L13 2Z" />
      </svg>
      <span style={styles.label}>Tour</span>
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
