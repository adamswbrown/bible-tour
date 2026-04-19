"use client";
import { useState } from "react";

const FEEDBACK_EMAIL = "bibletour@askadam.cloud";

export default function FeedbackButton() {
  const [hover, setHover] = useState(false);

  const handleClick = () => {
    if (typeof window === "undefined") return;
    const pageUrl = window.location.href;
    const userAgent = navigator.userAgent;
    const body =
      `\n\n\n` +
      `— — — — — — — — — — — —\n` +
      `Please describe the bug or feature above this line.\n\n` +
      `Page: ${pageUrl}\n` +
      `Browser: ${userAgent}\n`;
    const href =
      `mailto:${FEEDBACK_EMAIL}` +
      `?subject=${encodeURIComponent("[Bible Tour] Feedback")}` +
      `&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Send feedback by email"
      style={{ ...styles.btn, ...(hover ? styles.btnHover : null) }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={styles.label}>Feedback</span>
    </button>
  );
}

const styles = {
  btn: {
    position: "fixed",
    bottom: 20,
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
