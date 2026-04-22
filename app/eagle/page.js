"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { BOOKS, READING_PLAN } from "../lib/bible";
import { getChapterSummaries } from "../lib/book-data";
import TourLinkButton from "../components/TourLinkButton";

const STORAGE_KEY = "bt:eagle";
const MILESTONE_KEY = "bt:eagleMilestones";

const C = {
  sand: "#f6f1e5",
  paper: "#fffdf7",
  ink: "#162636",
  muted: "#597083",
  line: "rgba(22, 38, 54, 0.14)",
  teal: "#1b3a4b",
  tealLight: "#2A5568",
  gold: "#f3bf21",
  goldBg: "rgba(243,191,33,0.12)",
  goldBorder: "rgba(243,191,33,0.35)",
  green: "#1B6B3A",
  greenBg: "rgba(27,107,58,0.08)",
  greenBorder: "rgba(27,107,58,0.2)",
  shadow: "0 18px 60px rgba(22, 38, 54, 0.12)",
};

const STAGES = [
  { num: "1", label: "Survey", desc: "Get the big picture — who wrote it, when, why, and what it's about." },
  { num: "2", label: "Map", desc: "Find your target verse on the chapter map to see where it sits in the book." },
  { num: "3", label: "Current", desc: "Read the chapter summaries around your verse to feel the flow of context." },
];

const ALL_BOOKS_FLAT = Object.values(READING_PLAN).flat();

const OT_TOTAL = READING_PLAN["Old Testament"].length;
const NT_TOTAL = READING_PLAN["New Testament"].length;

const MILESTONES = [
  {
    id: "fledgling",
    name: "Fledgling",
    desc: "Studied your first book of the Bible",
    check: (c) => c.studiedCount >= 1,
  },
  {
    id: "taking-flight",
    name: "Taking Flight",
    desc: "Studied a quarter of all 66 books",
    check: (c) => c.studiedCount >= 16,
  },
  {
    id: "gospels-and-acts",
    name: "Spreading Wings",
    desc: "Studied the four Gospels and Acts",
    check: (c) => ["Matthew", "Mark", "Luke", "John", "Acts"].every(b => c.studied[b]),
  },
  {
    id: "ancient-skies",
    name: "Ancient Skies",
    desc: "Completed the entire Old Testament",
    check: (c) => c.otDone >= OT_TOTAL,
  },
  {
    id: "new-horizons",
    name: "New Horizons",
    desc: "Completed the entire New Testament",
    check: (c) => c.ntDone >= NT_TOTAL,
  },
  {
    id: "eagle-master",
    name: "Eagle Master",
    desc: "Studied all 66 books of the Bible",
    check: (c) => c.studiedCount >= BOOKS.length,
  },
];

function MilestoneIcon({ id, earned, size = 26 }) {
  const color = earned ? C.gold : C.muted;
  switch (id) {
    case "fledgling":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="13.5" rx="6.5" ry="8" stroke={color} strokeWidth="1.8"/>
          <path d="M11 7.5 L12.5 9.5 L11.5 11.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "taking-flight":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 13 C9.5 11 6 10 2 11.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 13 C14.5 11 18 10 22 11.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 13 C9.5 15 7 15.5 4 15" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M12 13 C14.5 15 17 15.5 20 15" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
          <ellipse cx="12" cy="12" rx="2" ry="2.5" fill={color}/>
        </svg>
      );
    case "gospels-and-acts":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3 L13.8 8.5 H19.5 L14.9 11.8 L16.7 17.3 L12 14 L7.3 17.3 L9.1 11.8 L4.5 8.5 H10.2 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="12" cy="11" r="2.5" fill={color} opacity="0.25"/>
        </svg>
      );
    case "ancient-skies":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth="1.8"/>
          <path d="M8 9 H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 12 H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 15 H12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "new-horizons":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 16 H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M8 16 A6 6 0 0 1 16 16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 4 V6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M5.5 6.5 L7.2 8.2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M18.5 6.5 L16.8 8.2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M3.5 11 L5.5 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M20.5 11 L18.5 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case "eagle-master":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 18 L4 10 L8.5 14.5 L12 5 L15.5 14.5 L20 10 L20 18 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M4 18 H20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="5" r="1.5" fill={color}/>
          <circle cx="4" cy="10" r="1.5" fill={color}/>
          <circle cx="20" cy="10" r="1.5" fill={color}/>
        </svg>
      );
    default:
      return null;
  }
}

export default function EagleIndexPage() {
  const [section, setSection] = useState("all");
  const [studied, setStudied] = useState({});
  const [mounted, setMounted] = useState(false);
  const [earnedIds, setEarnedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const earnedIdsRef = useRef([]);

  function getCtx(s) {
    return {
      studiedCount: Object.values(s).filter(Boolean).length,
      otDone: READING_PLAN["Old Testament"].filter(r => s[r.book]).length,
      ntDone: READING_PLAN["New Testament"].filter(r => s[r.book]).length,
      studied: s,
    };
  }

  function checkMilestones(studiedState, silent) {
    const ctx = getCtx(studiedState);
    const newlyEarned = MILESTONES.filter(
      m => !earnedIdsRef.current.includes(m.id) && m.check(ctx)
    );
    if (newlyEarned.length === 0) return;
    const nextIds = [...earnedIdsRef.current, ...newlyEarned.map(m => m.id)];
    earnedIdsRef.current = nextIds;
    setEarnedIds([...nextIds]);
    try { localStorage.setItem(MILESTONE_KEY, JSON.stringify(nextIds)); } catch {}
    if (!silent) setToast(newlyEarned[newlyEarned.length - 1]);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const studiedData = raw ? JSON.parse(raw) : {};
      if (raw) setStudied(studiedData);

      const rawEarned = localStorage.getItem(MILESTONE_KEY);
      const initialEarned = rawEarned ? JSON.parse(rawEarned) : [];
      earnedIdsRef.current = initialEarned;
      setEarnedIds(initialEarned);

      checkMilestones(studiedData, true);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function markStudied(book) {
    setStudied(prev => {
      const next = { ...prev, [book]: !prev[book] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      checkMilestones(next, false);
      return next;
    });
  }

  function handleReset() {
    setStudied({});
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const studiedCount = Object.values(studied).filter(Boolean).length;
  const otDone = READING_PLAN["Old Testament"].filter(r => studied[r.book]).length;
  const ntDone = READING_PLAN["New Testament"].filter(r => studied[r.book]).length;

  const vis =
    section === "ot" ? { "Old Testament": READING_PLAN["Old Testament"] }
    : section === "nt" ? { "New Testament": READING_PLAN["New Testament"] }
    : READING_PLAN;

  return (
    <main className="eagle-index">
      <style>{`
        .eagle-index {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(243, 191, 33, 0.28), transparent 24rem),
            linear-gradient(180deg, ${C.paper} 0%, ${C.sand} 100%);
          color: ${C.ink};
          font-family: "DM Sans", system-ui, sans-serif;
        }
        .eagle-index a { color: ${C.teal}; text-decoration: none; }
        .eagle-index a:hover { color: ${C.ink}; }
        .eagle-index-wrap { max-width: 1120px; margin: 0 auto; padding: 28px 20px 64px; }

        .eagle-index-top {
          display: flex; justify-content: space-between; gap: 12px;
          flex-wrap: wrap; color: ${C.muted}; font-size: 14px; margin-bottom: 24px;
        }

        /* Hero */
        .eagle-hero {
          background: rgba(255,255,255,0.8); border: 1px solid ${C.line};
          border-radius: 28px; padding: 28px; box-shadow: ${C.shadow}; margin-bottom: 16px;
        }
        .eagle-kicker {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: ${C.muted}; margin-bottom: 10px;
        }
        .eagle-kicker::before {
          content: ""; width: 38px; height: 2px;
          background: ${C.gold}; border-radius: 999px;
        }
        .eagle-title {
          margin: 0 0 12px;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: clamp(40px, 8vw, 68px); line-height: 0.95;
          text-transform: uppercase; letter-spacing: 0.02em;
        }
        .eagle-copy {
          max-width: 62ch; margin: 0 0 20px;
          font-size: 17px; line-height: 1.6; color: ${C.muted};
        }

        /* Stage steps */
        .eagle-stages { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
        .eagle-stage {
          flex: 1; min-width: 200px;
          background: rgba(255,255,255,0.6); border: 1px solid ${C.line};
          border-radius: 16px; padding: 14px 16px;
        }
        .eagle-stage-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 50%;
          background: ${C.gold}; color: ${C.ink};
          font-family: "Oswald", sans-serif; font-size: 15px; font-weight: 700;
          margin-bottom: 8px;
        }
        .eagle-stage-label {
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 15px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: ${C.ink}; margin-bottom: 4px;
        }
        .eagle-stage-desc { font-size: 13px; line-height: 1.5; color: ${C.muted}; margin: 0; }

        /* Hero layout */
        .eagle-hero-inner {
          display: flex;
          align-items: flex-start;
          gap: 24px;
        }
        .eagle-hero-text { flex: 1; min-width: 0; }
        .eagle-hero-bird {
          flex-shrink: 0;
          opacity: 0.13;
          margin-top: -8px;
          margin-right: -8px;
          pointer-events: none;
          user-select: none;
        }
        @media (max-width: 560px) {
          .eagle-hero-bird { display: none; }
        }

        /* YouTube link */
        .eagle-yt-link {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 600; color: ${C.teal};
          background: rgba(27,58,75,0.07); border: 1px solid rgba(27,58,75,0.12);
          border-radius: 8px; padding: 8px 14px; text-decoration: none;
          transition: all .15s;
        }
        .eagle-yt-link:hover {
          background: rgba(27,58,75,0.13); border-color: rgba(27,58,75,0.22); color: ${C.ink};
        }

        /* Progress bar */
        .eagle-progress {
          background: rgba(255,255,255,0.8); border: 1px solid ${C.line};
          border-radius: 20px; padding: 16px 20px; box-shadow: ${C.shadow};
          margin-bottom: 16px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .eagle-progress-bar-wrap { flex: 1; min-width: 140px; }
        .eagle-progress-bar-track {
          height: 6px; border-radius: 999px;
          background: rgba(22,38,54,0.1); overflow: hidden;
        }
        .eagle-progress-bar-fill {
          height: 100%; border-radius: 999px;
          background: ${C.gold}; transition: width .3s ease;
        }
        .eagle-progress-counts { font-size: 13px; color: ${C.muted}; margin-top: 4px; }

        /* Milestones */
        .eagle-milestones {
          background: rgba(255,255,255,0.8); border: 1px solid ${C.line};
          border-radius: 20px; padding: 16px 20px; box-shadow: ${C.shadow};
          margin-bottom: 16px;
        }
        .eagle-milestones-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: ${C.muted}; margin-bottom: 12px;
        }
        .eagle-milestones-row {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .eagle-milestone {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px 8px 10px;
          border-radius: 999px; border: 1.5px solid ${C.line};
          background: rgba(255,255,255,0.5);
          opacity: 0.4;
          transition: opacity .2s, border-color .2s, background .2s;
        }
        .eagle-milestone-earned {
          opacity: 1;
          border-color: ${C.goldBorder};
          background: ${C.goldBg};
        }
        .eagle-milestone-name {
          font-size: 13px; font-weight: 700;
          color: ${C.muted};
          font-family: "Oswald", "Arial Narrow", sans-serif;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .eagle-milestone-earned .eagle-milestone-name {
          color: ${C.ink};
        }

        /* Filters */
        .eagle-filters {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; align-items: center;
        }
        .eagle-filter-btn {
          padding: 7px 16px; border-radius: 99px; border: 1px solid ${C.line};
          background: rgba(255,255,255,0.7); color: ${C.muted};
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s;
        }
        .eagle-filter-btn:hover { background: rgba(255,255,255,1); color: ${C.ink}; }
        .eagle-filter-active {
          background: ${C.teal}; color: #fff; border-color: ${C.teal};
        }
        .eagle-filter-active:hover { background: ${C.teal}; color: #fff; }
        .eagle-reset-btn {
          margin-left: auto;
          padding: 7px 16px; border-radius: 99px;
          border: 1px solid rgba(220,60,60,0.25);
          background: rgba(220,60,60,0.07); color: rgba(180,40,40,0.8);
          font-family: "DM Sans", system-ui, sans-serif;
          font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s;
        }
        .eagle-reset-btn:hover { background: rgba(220,60,60,0.14); border-color: rgba(220,60,60,0.4); }

        /* Sections */
        .eagle-section {
          margin-bottom: 24px; background: rgba(255,255,255,0.8);
          border: 1px solid ${C.line}; border-radius: 24px;
          padding: 24px; box-shadow: ${C.shadow};
        }
        .eagle-section-head {
          display: flex; justify-content: space-between; gap: 12px;
          flex-wrap: wrap; align-items: baseline; margin-bottom: 16px;
        }
        .eagle-section-title {
          margin: 0;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 30px; text-transform: uppercase; letter-spacing: 0.02em;
        }
        .eagle-section-count { color: ${C.muted}; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

        /* Grid + cards */
        .eagle-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
        .eagle-card {
          display: block; padding: 18px; border-radius: 20px;
          background: ${C.paper}; border: 1px solid rgba(27,58,75,0.1);
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          text-decoration: none; position: relative;
        }
        .eagle-card:hover {
          transform: translateY(-2px);
          border-color: rgba(243,191,33,0.34);
          box-shadow: 0 12px 30px rgba(22,38,54,0.08);
        }
        .eagle-card-done {
          background: ${C.greenBg}; border-color: ${C.greenBorder};
        }
        .eagle-card-done:hover { border-color: rgba(27,107,58,0.35); }
        .eagle-card-top { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
        .eagle-card-check {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .eagle-card-check-done { background: ${C.green}; border-color: ${C.green}; }
        .eagle-card-check-done:hover { background: ${C.green}; border-color: ${C.green}; }
        .eagle-card-title {
          margin: 0;
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 22px; text-transform: uppercase; color: ${C.ink};
          flex: 1;
        }
        .eagle-card-title-done { color: ${C.green}; }
        .eagle-card-copy { margin: 0 0 10px; color: ${C.muted}; font-size: 13px; line-height: 1.5; }
        .eagle-card-meta {
          display: flex; justify-content: space-between; gap: 10px;
          font-size: 12px; font-weight: 700; color: ${C.teal};
        }
        .eagle-card-meta-done { color: ${C.green}; }
        .eagle-card-check {
          cursor: pointer; background: transparent; border: 2px solid rgba(27,58,75,0.2);
          appearance: none; -webkit-appearance: none; padding: 0;
          flex-shrink: 0; margin-top: 3px;
        }
        .eagle-card-check:hover { border-color: rgba(27,58,75,0.5); background: rgba(27,58,75,0.06); }

        /* Toast */
        @keyframes eagle-toast-in {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .eagle-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          width: 300px;
          background: ${C.paper}; border: 1px solid ${C.line};
          border-left: 4px solid ${C.gold};
          border-radius: 16px; padding: 16px 18px;
          box-shadow: 0 20px 50px rgba(22,38,54,0.18);
          animation: eagle-toast-in .3s ease forwards;
        }
        .eagle-toast-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px;
        }
        .eagle-toast-kicker {
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: ${C.gold};
        }
        .eagle-toast-close {
          background: none; border: none; cursor: pointer;
          color: ${C.muted}; font-size: 18px; line-height: 1;
          padding: 0 0 0 8px;
        }
        .eagle-toast-close:hover { color: ${C.ink}; }
        .eagle-toast-name {
          font-family: "Oswald", "Arial Narrow", sans-serif;
          font-size: 22px; text-transform: uppercase; letter-spacing: 0.02em;
          color: ${C.ink}; margin-bottom: 2px;
        }
        .eagle-toast-desc {
          font-size: 13px; color: ${C.muted}; line-height: 1.4;
        }

        /* iPad — wider comfortable reading layout */
        @media (min-width: 768px) and (max-width: 1100px) {
          .eagle-index-wrap { padding: 24px 24px 56px; }
          .eagle-grid { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
          .eagle-hero { padding: 32px 36px; }
          .eagle-section { padding: 28px 36px; }
          .eagle-copy { font-size: 18px; }
          .eagle-stages { gap: 12px; }
          .eagle-stage { padding: 18px 20px; }
          .eagle-card { padding: 20px; }
          .eagle-card-title { font-size: 24px; }
        }

        @media (max-width: 720px) {
          .eagle-index-wrap { padding: 18px 14px 52px; }
          .eagle-hero, .eagle-section { padding: 20px; }
          .eagle-stages { flex-direction: column; }
          .eagle-toast { right: 12px; left: 12px; width: auto; bottom: 16px; }
        }
      `}</style>

      <div className="eagle-index-wrap">
        <div className="eagle-index-top">
          <div>
            <Link href="/">Tour of the Bible</Link>
            {" / "}Eagle Method
          </div>
          <div style={{ color: C.muted }}>{BOOKS.length} books</div>
        </div>

        {/* Hero */}
        <section className="eagle-hero">
          <div className="eagle-hero-inner">
          <div className="eagle-hero-text">
          <div className="eagle-kicker">Eagle Method</div>
          <h1 className="eagle-title">Study A Book</h1>
          <p className="eagle-copy">
            A three-stage method for locking a Bible verse in memory by seeing the
            whole book first, then zooming in to your chapter, then reading the river
            of context around it.
          </p>
          </div>
          {/* Stylised flying eagle silhouette */}
          <svg className="eagle-hero-bird" width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Left wing — sweeping upward */}
            <path d="M96 58 C80 50, 58 36, 36 18 C44 28, 46 40, 42 52 C30 40, 14 30, 2 26 C16 34, 28 44, 32 58 C18 50, 6 50, 0 54 C14 56, 28 60, 38 68 C24 66, 10 70, 4 78 C18 72, 36 68, 52 70 C38 76, 28 84, 26 94 C38 82, 54 72, 70 68 C60 74, 54 84, 56 96 C64 80, 76 68, 90 64 Z" fill={C.ink} />
            {/* Right wing — sweeping upward, mirrored */}
            <path d="M104 58 C120 50, 142 36, 164 18 C156 28, 154 40, 158 52 C170 40, 186 30, 198 26 C184 34, 172 44, 168 58 C182 50, 194 50, 200 54 C186 56, 172 60, 162 68 C176 66, 190 70, 196 78 C182 72, 164 68, 148 70 C162 76, 172 84, 174 94 C162 82, 146 72, 130 68 C140 74, 146 84, 144 96 C136 80, 124 68, 110 64 Z" fill={C.ink} />
            {/* Body */}
            <ellipse cx="100" cy="66" rx="12" ry="22" fill={C.ink} />
            {/* Head + beak pointing right */}
            <ellipse cx="108" cy="48" rx="10" ry="9" fill={C.ink} />
            <path d="M117 46 L130 50 L117 54 Z" fill={C.gold} />
            {/* Tail */}
            <path d="M91 84 C88 92, 84 100, 80 108 C88 100, 96 96, 100 96 C104 96, 112 100, 120 108 C116 100, 112 92, 109 84 Z" fill={C.ink} />
          </svg>
          </div>

          <div className="eagle-stages">
            {STAGES.map(s => (
              <div className="eagle-stage" key={s.num}>
                <div className="eagle-stage-num">{s.num}</div>
                <div className="eagle-stage-label">{s.label}</div>
                <p className="eagle-stage-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://www.youtube.com/watch?v=V6cLQVFQN7o"
              target="_blank"
              rel="noopener noreferrer"
              className="eagle-yt-link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.8 1-2.1 2C0 8.1 0 12 0 12s0 3.9.4 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.6.6 9.6.6s7.6 0 9.5-.6c1-.3 1.8-1 2.1-2 .4-1.9.4-5.8.4-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.4 3.6-6.4 3.6z"/>
              </svg>
              Watch the Eagle Method video
            </a>
            <span style={{ fontSize: 13, color: C.muted }}>
              Eagle Method by{" "}
              <a
                href="https://www.youtube.com/@bible.animations"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.muted, textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                Bible Animations
              </a>
            </span>
          </div>
        </section>

        {/* Progress */}
        {mounted && (
          <div className="eagle-progress">
            <div className="eagle-progress-bar-wrap">
              <div className="eagle-progress-bar-track">
                <div
                  className="eagle-progress-bar-fill"
                  style={{ width: `${Math.round((studiedCount / BOOKS.length) * 100)}%` }}
                />
              </div>
              <div className="eagle-progress-counts">
                OT: {otDone}/{OT_TOTAL} &nbsp;·&nbsp; NT: {ntDone}/{NT_TOTAL}
              </div>
            </div>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: C.ink }}>
              {studiedCount}<span style={{ fontSize: 14, color: C.muted, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/{BOOKS.length}</span>
            </span>
            <span style={{ fontSize: 13, color: C.muted }}>studied</span>
          </div>
        )}

        {/* Milestone badges */}
        {mounted && (
          <div className="eagle-milestones">
            <div className="eagle-milestones-label">Awards</div>
            <div className="eagle-milestones-row">
              {MILESTONES.map(m => {
                const earned = earnedIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`eagle-milestone${earned ? " eagle-milestone-earned" : ""}`}
                    title={m.desc}
                  >
                    <MilestoneIcon id={m.id} earned={earned} size={22} />
                    <span className="eagle-milestone-name">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="eagle-filters">
          {[["all", "All"], ["ot", "Old Testament"], ["nt", "New Testament"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className={`eagle-filter-btn${section === k ? " eagle-filter-active" : ""}`}
            >
              {l}
            </button>
          ))}
          {mounted && studiedCount > 0 && (
            <button className="eagle-reset-btn" onClick={handleReset}>Reset</button>
          )}
        </div>

        {/* Book sections */}
        {Object.entries(vis).map(([sec, readings]) => {
          const secDone = readings.filter(r => studied[r.book]).length;
          return (
            <section className="eagle-section" key={sec}>
              <div className="eagle-section-head">
                <h2 className="eagle-section-title">{sec}</h2>
                <span className="eagle-section-count">
                  {mounted ? `${secDone}/${readings.length}` : `${readings.length} books`}
                </span>
              </div>

              <div className="eagle-grid">
                {readings.map(({ book, refs, note }) => {
                  const entry = BOOKS.find(c => c.book === book);
                  const chapterCount = getChapterSummaries(book).length;
                  const done = mounted && !!studied[book];

                  return (
                    <Link
                      key={book}
                      href={`/eagle/${entry.slug}`}
                      className={`eagle-card${done ? " eagle-card-done" : ""}`}
                    >
                      <div className="eagle-card-top">
                        <button
                          className={`eagle-card-check${done ? " eagle-card-check-done" : ""}`}
                          onClick={e => { e.preventDefault(); e.stopPropagation(); markStudied(book); }}
                          aria-label={`Mark ${book} as ${done ? "not " : ""}studied`}
                        >
                          {done && (
                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <h3 className={`eagle-card-title${done ? " eagle-card-title-done" : ""}`}>{book}</h3>
                      </div>

                      <p className="eagle-card-copy">{refs}</p>
                      {note && <p className="eagle-card-copy">{note}</p>}

                      <div className={`eagle-card-meta${done ? " eagle-card-meta-done" : ""}`}>
                        <span>{chapterCount} chapters</span>
                        <span style={{ color: done ? C.green : C.teal }}>
                          {done ? "Review ↗" : "Study ↗"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Milestone toast */}
      {toast && (
        <div className="eagle-toast" role="status">
          <div className="eagle-toast-header">
            <span className="eagle-toast-kicker">Award Unlocked</span>
            <button className="eagle-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">×</button>
          </div>
          <div className="eagle-toast-name">{toast.name}</div>
          <div className="eagle-toast-desc">{toast.desc}</div>
        </div>
      )}
      <TourLinkButton />
    </main>
  );
}
