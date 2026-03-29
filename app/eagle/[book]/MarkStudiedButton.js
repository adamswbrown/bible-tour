"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "bt:eagle";

const C = {
  ink: "#162636",
  teal: "#1b3a4b",
  green: "#1f6b4b",
  greenSoft: "rgba(31, 107, 75, 0.11)",
  greenBorder: "rgba(27,107,58,0.2)",
  gold: "#f3bf21",
  line: "rgba(22, 38, 54, 0.14)",
};

export default function MarkStudiedButton({ book }) {
  const [studied, setStudied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const flashTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setStudied(!!data[book]);
      }
    } catch {}
    setMounted(true);
    return () => clearTimeout(flashTimer.current);
  }, [book]);

  function toggle() {
    setStudied((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : {};
        data[book] = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
      return next;
    });
    // Flash save confirmation on every toggle
    clearTimeout(flashTimer.current);
    setSaveFlash(true);
    flashTimer.current = setTimeout(() => setSaveFlash(false), 2200);
  }

  if (!mounted) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.inner}>
        <div style={styles.textGroup}>
          {studied ? (
            <>
              <p style={styles.heading}>All three stages complete</p>
              <p style={styles.sub}>
                This book is marked as studied in your progress tracker.{" "}
                <span style={styles.autoSaveNote}>Saves automatically to your browser.</span>
              </p>
            </>
          ) : (
            <>
              <p style={styles.heading}>Finished all three stages?</p>
              <p style={styles.sub}>
                Mark this book as studied to track your progress on the Eagle index.{" "}
                <span style={styles.autoSaveNote}>Saves automatically to your browser.</span>
              </p>
            </>
          )}
          {saveFlash && (
            <p style={styles.saveConfirm}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, display: "inline", verticalAlign: "middle", marginRight: 4 }}>
                <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Progress auto-saved
            </p>
          )}
        </div>
        <button onClick={toggle} style={studied ? styles.btnDone : styles.btn}>
          {studied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Studied
            </>
          ) : (
            "Mark as Studied"
          )}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    marginTop: 24,
    padding: "20px 24px",
    borderRadius: 20,
    border: `1px solid ${C.line}`,
    background: "rgba(255,255,255,0.8)",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },
  textGroup: {
    flex: 1,
    minWidth: 200,
  },
  heading: {
    margin: "0 0 4px",
    fontFamily: '"Oswald", "Arial Narrow", sans-serif',
    fontSize: 20,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    color: C.ink,
  },
  sub: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#597083",
  },
  autoSaveNote: {
    color: "#597083",
    fontStyle: "italic",
  },
  saveConfirm: {
    margin: "8px 0 0",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: C.green,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 22px",
    borderRadius: 999,
    border: `1.5px solid ${C.teal}`,
    background: C.teal,
    color: "white",
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnDone: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 22px",
    borderRadius: 999,
    border: `1.5px solid ${C.greenBorder}`,
    background: C.greenSoft,
    color: C.green,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
