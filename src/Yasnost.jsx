import React, { useState, useEffect, useRef } from "react";

const TODAY = new Date().toISOString().slice(0, 10);

const COLUMNS = [
  { id: "todo",        title: "Нужно сделать", accent: "#6B7280" },
  { id: "in_progress", title: "В работе",       accent: "#1B4F8A" },
  { id: "done",        title: "Готово",          accent: "#2E7D5B" },
];

const SEED = [
  { id: 1, title: "Согласовать архитектуру «Ясности»", desc: "Стек: React + Node + PostgreSQL на VPS", status: "in_progress", due: "2026-06-05", docs: 2, priority: "urgent",    notes: "", checklist: [] },
  { id: 2, title: "Поднять PostgreSQL на сервере",       desc: "Та же машина, где ProxyShield",         status: "todo",        due: "2026-06-06", docs: 0, priority: "important", notes: "", checklist: [] },
  { id: 3, title: "Собрать playbook других компаний",    desc: "Notion, Affinity, DealCloud — что у кого", status: "todo",    due: "2026-06-10", docs: 1, priority: "normal",    notes: "", checklist: [] },
  { id: 4, title: "Прототип канбана",                    desc: "Дизайн + drag-and-drop",                status: "done",        due: "2026-06-01", docs: 0, priority: "normal",    notes: "", checklist: [] },
  { id: 5, title: "Выбрать способ хранения данных",      desc: "PostgreSQL — решено",                   status: "done",        due: "2026-06-01", docs: 0, priority: "normal",    notes: "", checklist: [] },
];

// ─────────────────────────────────────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────────────────────────────────────

const THEMES = {

  // ── Cosmos ────────────────────────────────────────────────────────────────
  cosmos: {
    priorities: {
      urgent:    { label: "Срочно",  emoji: "🔴", color: "#FF4444", bg: "rgba(255,68,68,0.12)" },
      important: { label: "Важно",   emoji: "🟡", color: "#FFB800", bg: "rgba(255,184,0,0.12)" },
      normal:    { label: "Обычно",  emoji: "⚪", color: "#9a9a9a", bg: "rgba(255,255,255,0.05)" },
    },
    st: {
      app:          { display: "flex", height: "100vh", fontFamily: "'Manrope', system-ui, sans-serif", background: "#080808", color: "#e0e0e0", overflow: "hidden", position: "relative" },
      sidebar:      { width: 244, background: "#0d0d0d", color: "#c2c6cc", display: "flex", flexDirection: "column", padding: "22px 14px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,.06)" },
      brand:        { display: "flex", alignItems: "center", gap: 12, marginBottom: 30, padding: "0 6px" },
      logo:         { width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19, color: "#fff", boxShadow: "0 0 24px rgba(77,124,255,.5)", flexShrink: 0 },
      brandName:    { fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: "#ffffff" },
      brandSub:     { fontSize: 10.5, color: "#5a5a5a", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3, fontWeight: 600 },
      nav:          { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
      navItem:      { display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: "#8a8a8a", cursor: "pointer", transition: "all .16s" },
      navActive:    { background: "rgba(77,124,255,.08)", color: "#ffffff", boxShadow: "inset 2px 0 0 #4D7CFF" },
      navDivider:   { height: 1, background: "rgba(255,255,255,.06)", margin: "12px 8px" },
      navBadge:     { marginLeft: "auto", background: "#4D7CFF", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 8px", lineHeight: 1.6, boxShadow: "0 0 10px rgba(77,124,255,.6)" },
      sidebarFoot:  { fontSize: 10.5, color: "#4a4a4a", paddingLeft: 8, lineHeight: 1.8 },
      sidebarFootLine: {},
      resetBtn:     { marginTop: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#7a7a7a", borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", width: "100%" },
      main:         { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", backgroundColor: "#080808", backgroundImage: "radial-gradient(500px at var(--mx,50%) var(--my,50%), rgba(77,124,255,.04), transparent 70%), radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "auto, 28px 28px" },
      header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "#0a0a0a", flexShrink: 0, position: "relative", zIndex: 2 },
      h1:           { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "#ffffff" },
      sub:          { fontSize: 13, color: "#5a5a5a", margin: "5px 0 0" },
      headerRight:  { display: "flex", alignItems: "center", gap: 14 },
      searchWrap:   { display: "flex", alignItems: "center", gap: 8, background: "#141414", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "9px 14px", width: 230, cursor: "text", color: "#5a5a5a" },
      searchInput:  { border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#e0e0e0", fontFamily: "inherit", width: "100%" },
      avatar:       { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: "0 0 16px rgba(77,124,255,.45)" },
      board:        { display: "grid", gridTemplateColumns: "repeat(3, minmax(310px, 1fr))", gap: 18, padding: 26, overflowX: "auto", overflowY: "auto", flex: 1, alignItems: "stretch", position: "relative", zIndex: 1 },
      column:       { background: "#0d0d0d", borderRadius: 16, padding: 14, minHeight: 200, transition: "background .15s, box-shadow .15s", border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column" },
      columnOver:   { background: "#101010", border: "1px solid rgba(77,124,255,.5)", boxShadow: "inset 0 0 0 1px rgba(77,124,255,.2), 0 0 28px rgba(77,124,255,.14)" },
      colHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "2px 4px" },
      colTitleWrap: { display: "flex", alignItems: "center", gap: 9 },
      colDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
      colTitle:     { fontWeight: 600, fontSize: 11, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase" },
      colCount:     { fontSize: 11.5, fontWeight: 600, color: "#7a7a7a", background: "rgba(255,255,255,.05)", borderRadius: 999, padding: "1px 8px" },
      colAdd:       { width: 25, height: 25, borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "#4D7CFF", fontSize: 17, fontWeight: 600, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" },
      cardList:     { display: "flex", flexDirection: "column", gap: 10, flex: 1 },
      card:         { background: "#141414", borderRadius: 14, padding: "14px 15px 13px", cursor: "pointer", border: "1px solid rgba(255,255,255,.08)", position: "relative", transformStyle: "preserve-3d", willChange: "transform" },
      cardTop:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
      cardStripe:   { width: 26, height: 3, borderRadius: 3, margin: "13px 0 0 15px" },
      cardDel:      { border: "none", background: "transparent", color: "#3a3a3a", fontSize: 18, cursor: "pointer", padding: "6px 10px", lineHeight: 1 },
      cardTitle:    { fontWeight: 600, fontSize: 15, color: "#e0e0e0", marginTop: 11, lineHeight: 1.38, cursor: "pointer", position: "relative", zIndex: 1 },
      cardDesc:     { fontSize: 13, color: "#6a6a6a", marginTop: 5, lineHeight: 1.45, position: "relative", zIndex: 1 },
      cardMeta:     { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", position: "relative", zIndex: 1 },
      metaChip:     { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#8a8a8a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, padding: "3px 9px", background: "rgba(255,255,255,.03)" },
      composer:     { background: "#141414", borderRadius: 14, padding: 13, boxShadow: "0 8px 28px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", gap: 8, border: "1px solid rgba(77,124,255,.3)" },
      input:        { border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#e0e0e0", width: "100%", boxSizing: "border-box", background: "#0d0d0d" },
      priorityPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
      prBtn:        { border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .12s" },
      composerRow:  { display: "flex", gap: 8, marginTop: 2 },
      btnPrimary:   { flex: 1, background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 18px rgba(77,124,255,.3)" },
      btnGhost:     { background: "transparent", color: "#8a8a8a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
      empty:        { textAlign: "center", color: "#3a3a3a", fontSize: 12, padding: "26px 0", border: "1.5px dashed rgba(255,255,255,.08)", borderRadius: 12 },
      todayView:    { flex: 1, overflowY: "auto", padding: 26, position: "relative", zIndex: 1 },
      todayList:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 13 },
      todayEmpty:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: 380, margin: "48px auto", padding: "44px 32px", background: "#0d0d0d", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, color: "#8a8a8a" },
      overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px)" },
      modal:        { background: "#0f0f0f", borderRadius: 20, width: "min(640px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,.7)", overflow: "hidden", border: "1px solid rgba(255,255,255,.1)" },
      modalHeader:  { display: "flex", alignItems: "center", gap: 12, padding: "20px 22px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 },
      modalTitle:   { flex: 1, border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "#ffffff", fontFamily: "inherit", letterSpacing: "-0.01em", background: "transparent" },
      modalClose:   { border: "none", background: "transparent", color: "#5a5a5a", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 2px" },
      modalBody:    { overflowY: "auto", padding: "16px 22px 24px", display: "flex", flexDirection: "column", gap: 4 },
      modalSection: { paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 4 },
      modalLabel:   { fontSize: 11, fontWeight: 700, color: "#5a5a5a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 },
      textarea:     { border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#e0e0e0", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 64, lineHeight: 1.5, background: "#0d0d0d" },
      checkItem:    { display: "flex", alignItems: "center", gap: 10, padding: "5px 0" },
      checkText:    { flex: 1, fontSize: 13, lineHeight: 1.4 },
      checkDel:     { border: "none", background: "transparent", color: "#3a3a3a", fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 },
      checkAdd:     { display: "flex", gap: 8, alignItems: "center" },
      texture:      { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 998, opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` },
      cursorDot:    { position: "fixed", top: 0, left: 0, width: 12, height: 12, borderRadius: "50%", background: "#ffffff", boxShadow: "0 0 6px rgba(255,255,255,.9)", pointerEvents: "none", zIndex: 1000, transform: "translate(-50%, -50%)" },
      cursorHalo:   { position: "fixed", top: 0, left: 0, width: 40, height: 40, borderRadius: "50%", border: "1.5px solid rgba(77,124,255,.8)", background: "rgba(77,124,255,.12)", pointerEvents: "none", zIndex: 1000, transform: "translate(-50%, -50%)", transition: "width .25s ease, height .25s ease, background .25s ease, border-color .25s ease" },
      blob1:        { position: "absolute", width: 500, height: 500, top: "-8%", left: "-6%", borderRadius: "50%", background: "rgba(77,124,255,.07)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 },
      blob2:        { position: "absolute", width: 420, height: 420, top: "26%", right: "-5%", borderRadius: "50%", background: "rgba(124,58,255,.05)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 },
      blob3:        { position: "absolute", width: 360, height: 360, bottom: "4%", left: "42%", borderRadius: "50%", background: "rgba(77,124,255,.04)", filter: "blur(100px)", pointerEvents: "none", zIndex: 0 },
      aiBtn:        { width: "100%", background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(77,124,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
      aiPanel:      { marginTop: 12, background: "#0d0d0d", border: "1px solid rgba(77,124,255,.25)", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, color: "#c0c0c0", whiteSpace: "pre-wrap" },
      docChip:      { display: "inline-flex", alignItems: "center", gap: 6, background: "#141414", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#c0c0c0" },
      docZone:      { border: "1.5px dashed rgba(255,255,255,.12)", borderRadius: 12, padding: "14px", textAlign: "center", color: "#5a5a5a", fontSize: 12.5, cursor: "pointer", transition: "border-color .15s, color .15s" },
      checkboxAccent: "#4D7CFF",
      checkTextActive: "#e0e0e0",
      checkTextDone:   "#5a5a5a",
    },
    css: `
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; }
      @media (prefers-reduced-motion: no-preference) {
        .ys-blob1 { animation: ys-b1 22s ease-in-out infinite alternate; }
        .ys-blob2 { animation: ys-b2 30s ease-in-out infinite alternate-reverse; }
        .ys-blob3 { animation: ys-b3 18s ease-in-out infinite alternate; }
        @keyframes ys-b1 { from { transform: translate(0,0) scale(1); } to { transform: translate(46px,34px) scale(1.18); } }
        @keyframes ys-b2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-54px,-22px) scale(1.22); } }
        @keyframes ys-b3 { from { transform: translate(0,0) scale(1); } to { transform: translate(24px,-34px) scale(1.12); } }
      }
      .ys-card::before {
        content: ""; position: absolute; inset: 0; border-radius: 14px; z-index: 0; pointer-events: none;
        background: radial-gradient(120px at var(--bx, 50%) var(--by, 50%), rgba(77,124,255,.16), transparent 70%);
        opacity: 0; transition: opacity .25s ease;
      }
      .ys-card:hover::before { opacity: 1; }
      .ys-card:hover { border-color: rgba(77,124,255,.4); }
      .ys-pr-urgent { box-shadow: 0 0 10px rgba(255,68,68,.35); }
      .ys-nav-item:hover { background: rgba(255,255,255,.04); color: #ffffff; }
      .ys-search:focus-within { border-color: rgba(77,124,255,.55) !important; box-shadow: 0 0 0 3px rgba(77,124,255,.12); }
      .ys-doc-zone:hover { border-color: rgba(77,124,255,.5); color: #4D7CFF; }
      .ys-ai-btn:hover { box-shadow: 0 6px 28px rgba(77,124,255,.55); }
      .ys-add:hover { background: rgba(77,124,255,.1); }
      ::-webkit-scrollbar { width: 9px; height: 9px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(77,124,255,.5); }
      ::-webkit-scrollbar-track { background: transparent; }
      input::placeholder, textarea::placeholder { color: #4a4a4a; }
      input[type="date"] { color-scheme: dark; }
      @media (hover: hover) and (pointer: fine) { .ys-app, .ys-app * { cursor: none !important; } }
      @media (pointer: coarse) { .ys-cursor-dot, .ys-cursor-halo { display: none !important; } }
      .ys-halo-lg { width: 56px !important; height: 56px !important; background: rgba(77,124,255,.22) !important; border-color: rgba(77,124,255,1) !important; }
      @media (max-width: 768px) {
        .ys-app    { flex-direction: column !important; height: auto !important; min-height: 100dvh; overflow: auto !important; }
        .ys-sidebar { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; padding: 12px 16px !important; gap: 0; flex-shrink: 0 !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.06) !important; }
        .ys-brand  { margin-bottom: 0 !important; flex: 1; }
        .ys-nav    { flex-direction: row !important; flex: none; gap: 4px !important; align-items: center; }
        .ys-nav-item { padding: 8px 11px !important; font-size: 12px !important; gap: 6px !important; }
        .ys-sidebar-foot { display: none !important; }
        .ys-main   { overflow: visible !important; flex: none !important; }
        .ys-header { padding: 16px !important; flex-wrap: wrap; gap: 10px; position: static !important; }
        .ys-h1     { font-size: 21px !important; }
        .ys-search { width: 100% !important; }
        .ys-board  { grid-template-columns: 1fr !important; padding: 12px !important; gap: 12px !important; overflow: visible !important; flex: none !important; }
        .ys-column { min-height: 80px !important; }
        .ys-card   { transform: none !important; }
        .ys-modal  { border-radius: 20px 20px 0 0 !important; width: 100vw !important; max-height: 92dvh !important; position: fixed !important; bottom: 0 !important; left: 0 !important; }
        .ys-overlay { align-items: flex-end !important; }
      }
    `,
  },

  // ── Signal ────────────────────────────────────────────────────────────────
  signal: {
    priorities: {
      urgent:    { label: "Срочно",  emoji: "🔴", color: "#FF4D4D", bg: "rgba(255,77,77,0.12)" },
      important: { label: "Важно",   emoji: "🟡", color: "#FFB800", bg: "rgba(255,184,0,0.10)" },
      normal:    { label: "Обычно",  emoji: "⚪", color: "#8A9099", bg: "rgba(255,255,255,0.04)" },
    },
    st: {
      app:          { display: "flex", height: "100vh", fontFamily: "'Geist', 'Inter', system-ui, sans-serif", background: "radial-gradient(120% 90% at 18% -10%, #16181F 0%, #0A0B0D 58%)", color: "#EDEEF0", overflow: "hidden" },
      sidebar:      { width: 244, background: "#0C0D10", color: "#C2C6CC", display: "flex", flexDirection: "column", padding: "22px 14px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,.06)" },
      brand:        { display: "flex", alignItems: "center", gap: 12, marginBottom: 30, padding: "0 6px" },
      logo:         { width: 38, height: 38, borderRadius: 12, background: "linear-gradient(150deg, #D4FF5E, #A6E22E)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19, color: "#0A0B0D", boxShadow: "0 6px 20px rgba(198,242,77,.32)", flexShrink: 0 },
      brandName:    { fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#FFFFFF" },
      brandSub:     { fontSize: 10.5, color: "#7C8290", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 3, fontWeight: 600, fontFamily: "'Geist Mono', monospace" },
      nav:          { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
      navItem:      { display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 11, fontSize: 13.5, fontWeight: 500, color: "#8A9099", cursor: "pointer", transition: "all .16s cubic-bezier(.2,.7,.3,1)" },
      navActive:    { background: "rgba(198,242,77,.13)", color: "#D9FF73", boxShadow: "inset 0 0 0 1px rgba(198,242,77,.22)", textShadow: "0 0 14px rgba(198,242,77,.55)" },
      navDivider:   { height: 1, background: "rgba(255,255,255,.07)", margin: "12px 8px" },
      navBadge:     { marginLeft: "auto", background: "#FF4D4D", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 8px", lineHeight: 1.6, fontFamily: "'Geist Mono', monospace" },
      sidebarFoot:  { fontSize: 10.5, color: "#5B616D", paddingLeft: 8, lineHeight: 1.8, fontFamily: "'Geist Mono', monospace" },
      sidebarFootLine: {},
      resetBtn:     { marginTop: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", color: "#8A9099", borderRadius: 9, padding: "7px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", width: "100%" },
      main:         { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
      header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 30px", borderBottom: "1px solid rgba(255,255,255,.07)", background: "#0C0D10", flexShrink: 0, position: "sticky", top: 0, zIndex: 5 },
      h1:           { fontSize: 24, fontWeight: 700, letterSpacing: "-0.035em", margin: 0, color: "#FFFFFF" },
      sub:          { fontSize: 12.5, color: "#7C8290", margin: "5px 0 0", fontFamily: "'Geist Mono', monospace", letterSpacing: "0.01em" },
      headerRight:  { display: "flex", alignItems: "center", gap: 14 },
      searchWrap:   { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "9px 16px", width: 230, cursor: "text", color: "#7C8290", transition: "border-color .15s, box-shadow .15s" },
      searchInput:  { border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#EDEEF0", fontFamily: "inherit", width: "100%" },
      avatar:       { width: 36, height: 36, borderRadius: "50%", background: "#141518", color: "#D9FF73", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, border: "1.5px solid rgba(198,242,77,.45)" },
      board:        { display: "grid", gridTemplateColumns: "repeat(3, minmax(310px, 1fr))", gap: 18, padding: 26, overflowX: "auto", overflowY: "auto", flex: 1, alignItems: "stretch", position: "relative", zIndex: 1 },
      column:       { background: "rgba(255,255,255,.025)", borderRadius: 18, padding: 14, minHeight: 200, transition: "background .15s, box-shadow .15s", border: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column" },
      columnOver:   { background: "rgba(198,242,77,.05)", border: "1px dashed rgba(198,242,77,.5)", boxShadow: "inset 0 0 0 1px rgba(198,242,77,.12)" },
      colHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "2px 4px" },
      colTitleWrap: { display: "flex", alignItems: "center", gap: 9 },
      colDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
      colTitle:     { fontWeight: 600, fontSize: 11.5, color: "#A6ACB6", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', monospace" },
      colCount:     { fontSize: 11.5, fontWeight: 600, color: "#8A9099", background: "rgba(255,255,255,.06)", borderRadius: 999, padding: "1px 8px", fontFamily: "'Geist Mono', monospace" },
      colAdd:       { width: 26, height: 26, borderRadius: 9, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#D9FF73", fontSize: 17, fontWeight: 600, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .14s" },
      cardList:     { display: "flex", flexDirection: "column", gap: 10, flex: 1 },
      card:         { background: "rgba(20,21,25,.82)", borderRadius: 16, padding: "14px 15px 13px", boxShadow: "0 1px 2px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)", cursor: "pointer", border: "1px solid rgba(255,255,255,.08)", transition: "box-shadow .18s cubic-bezier(.2,.7,.3,1), transform .18s cubic-bezier(.2,.7,.3,1), border-color .18s", position: "relative" },
      cardTop:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "absolute", top: 0, left: 0, right: 0 },
      cardStripe:   { width: 26, height: 3, borderRadius: 3, margin: "13px 0 0 15px" },
      cardDel:      { border: "none", background: "transparent", color: "#5B616D", fontSize: 18, cursor: "pointer", padding: "6px 10px", lineHeight: 1 },
      cardTitle:    { fontWeight: 600, fontSize: 14.5, color: "#F4F5F6", marginTop: 11, lineHeight: 1.38, cursor: "pointer", letterSpacing: "-0.01em" },
      cardDesc:     { fontSize: 12.5, color: "#8A9099", marginTop: 5, lineHeight: 1.45 },
      cardMeta:     { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" },
      metaChip:     { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#A6ACB6", border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "3px 9px", background: "rgba(255,255,255,.03)", fontFamily: "'Geist Mono', monospace" },
      composer:     { background: "#141518", borderRadius: 16, padding: 13, boxShadow: "0 8px 28px rgba(0,0,0,.55)", display: "flex", flexDirection: "column", gap: 8, border: "1px solid rgba(198,242,77,.28)" },
      input:        { border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#EDEEF0", width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.04)" },
      priorityPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
      prBtn:        { border: "1px solid rgba(255,255,255,.12)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .12s" },
      composerRow:  { display: "flex", gap: 8, marginTop: 2 },
      btnPrimary:   { flex: 1, background: "linear-gradient(150deg, #D4FF5E, #B6EE3C)", color: "#0A0B0D", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 18px rgba(198,242,77,.28)" },
      btnGhost:     { background: "transparent", color: "#8A9099", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
      empty:        { textAlign: "center", color: "#5B616D", fontSize: 12, padding: "26px 0", border: "1.5px dashed rgba(255,255,255,.1)", borderRadius: 14 },
      todayView:    { flex: 1, overflowY: "auto", padding: 26 },
      todayList:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 13 },
      todayEmpty:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: 380, margin: "48px auto", padding: "44px 32px", background: "#141518", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, color: "#8A9099" },
      overlay:      { position: "fixed", inset: 0, background: "rgba(4,5,7,.74)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px)" },
      modal:        { background: "rgba(18,19,23,.78)", backdropFilter: "blur(22px) saturate(1.3)", WebkitBackdropFilter: "blur(22px) saturate(1.3)", borderRadius: 22, width: "min(620px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.1)", overflow: "hidden", border: "1px solid rgba(255,255,255,.12)" },
      modalHeader:  { display: "flex", alignItems: "center", gap: 12, padding: "20px 22px 16px", borderBottom: "1px solid rgba(255,255,255,.08)", flexShrink: 0 },
      modalTitle:   { flex: 1, border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "#FFFFFF", fontFamily: "inherit", letterSpacing: "-0.02em", background: "transparent" },
      modalClose:   { border: "none", background: "transparent", color: "#7C8290", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 2px" },
      modalBody:    { overflowY: "auto", padding: "16px 22px 24px", display: "flex", flexDirection: "column", gap: 4 },
      modalSection: { paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 4 },
      modalLabel:   { fontSize: 11, fontWeight: 600, color: "#7C8290", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9, fontFamily: "'Geist Mono', monospace" },
      textarea:     { border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#EDEEF0", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 64, lineHeight: 1.5, background: "rgba(255,255,255,.04)" },
      checkItem:    { display: "flex", alignItems: "center", gap: 10, padding: "5px 0" },
      checkText:    { flex: 1, fontSize: 13, lineHeight: 1.4 },
      checkDel:     { border: "none", background: "transparent", color: "#5B616D", fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 },
      checkAdd:     { display: "flex", gap: 8, alignItems: "center" },
      texture:      { display: "none" },
      cursorDot:    { display: "none" },
      cursorHalo:   { display: "none" },
      blob1:        { display: "none" },
      blob2:        { display: "none" },
      blob3:        { display: "none" },
      aiBtn:        { width: "100%", background: "linear-gradient(150deg, #D4FF5E, #B6EE3C)", color: "#0A0B0D", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(198,242,77,.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
      aiPanel:      { marginTop: 12, background: "#0C0D10", border: "1px solid rgba(198,242,77,.25)", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, color: "#A6ACB6", whiteSpace: "pre-wrap" },
      docChip:      { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#A6ACB6" },
      docZone:      { border: "1.5px dashed rgba(255,255,255,.15)", borderRadius: 12, padding: "14px", textAlign: "center", color: "#7C8290", fontSize: 12.5, cursor: "pointer", transition: "border-color .15s, color .15s" },
      checkboxAccent:  "#D4FF5E",
      checkTextActive: "#E7E9EC",
      checkTextDone:   "#6B7280",
    },
    css: `
      @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      .ys-card:hover { box-shadow: 0 12px 30px rgba(0,0,0,.55), 0 0 0 1px rgba(198,242,77,.18) !important; transform: translateY(-2px); border-color: rgba(198,242,77,.32) !important; }
      .ys-card:active { transform: scale(0.985); }
      .ys-nav-item:hover { background: rgba(255,255,255,.05); color: #EDEEF0; }
      .ys-search:focus-within { border-color: rgba(198,242,77,.55) !important; box-shadow: 0 0 0 3px rgba(198,242,77,.12); }
      ::-webkit-scrollbar { width: 9px; height: 9px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(198,242,77,.45); }
      ::-webkit-scrollbar-track { background: transparent; }
      input::placeholder, textarea::placeholder { color: #5B616D; }
      input[type="date"] { color-scheme: dark; }
      .ys-board { isolation: isolate; }
      @media (prefers-reduced-motion: no-preference) {
        .ys-main::before {
          content: ""; position: absolute; left: -8%; right: -8%; top: -18%; height: 72%;
          z-index: 0; pointer-events: none;
          background: radial-gradient(38% 48% at 26% 30%, rgba(198,242,77,.17), transparent 68%), radial-gradient(42% 52% at 76% 16%, rgba(96,128,255,.16), transparent 70%), radial-gradient(36% 46% at 58% 64%, rgba(140,90,255,.11), transparent 72%);
          animation: ys-aurora 24s ease-in-out infinite alternate;
        }
        @keyframes ys-aurora { 0% { transform: translate3d(-3%,0,0) scale(1); } 50% { transform: translate3d(5%,3%,0) scale(1.15); } 100% { transform: translate3d(-1%,-2%,0) scale(1.07); } }
        .ys-main::after {
          content: ""; position: absolute; left: -10%; right: -6%; top: -10%; height: 82%;
          z-index: 0; pointer-events: none; mix-blend-mode: screen;
          background: radial-gradient(34% 44% at 62% 24%, rgba(64,224,208,.13), transparent 70%), radial-gradient(40% 50% at 16% 58%, rgba(0,196,255,.11), transparent 72%), radial-gradient(30% 40% at 88% 72%, rgba(198,242,77,.10), transparent 72%);
          animation: ys-aurora2 34s ease-in-out infinite alternate;
        }
        @keyframes ys-aurora2 { 0% { transform: translate3d(4%,2%,0) scale(1.05); } 50% { transform: translate3d(-5%,-3%,0) scale(1.20); } 100% { transform: translate3d(2%,1%,0) scale(1.08); } }
        .ys-card { animation: ys-rise .5s cubic-bezier(.2,.7,.3,1) both; }
        .ys-card:nth-child(2){ animation-delay: .05s; }
        .ys-card:nth-child(3){ animation-delay: .10s; }
        .ys-card:nth-child(4){ animation-delay: .15s; }
        .ys-card:nth-child(5){ animation-delay: .20s; }
        .ys-card:nth-child(n+6){ animation-delay: .24s; }
        @keyframes ys-rise { from { transform: translateY(10px); } to { transform: none; } }
        .ys-brand > div:first-child { animation: ys-logo-glow 3.6s ease-in-out infinite; }
        @keyframes ys-logo-glow { 0%,100% { box-shadow: 0 6px 20px rgba(198,242,77,.30); } 50% { box-shadow: 0 8px 30px rgba(198,242,77,.6); } }
        .ys-h1 { animation: ys-title-glow 5s ease-in-out infinite; }
        @keyframes ys-title-glow { 0%,100% { text-shadow: 0 0 18px rgba(198,242,77,.10); } 50% { text-shadow: 0 0 26px rgba(198,242,77,.30), 0 0 9px rgba(150,195,255,.18); } }
      }
      .ys-modal input[type="checkbox"] + span { color: #E7E9EC !important; }
      .ys-modal input[type="checkbox"]:checked + span { color: #6B7280 !important; }
      @media (max-width: 768px) {
        .ys-app    { flex-direction: column !important; height: auto !important; min-height: 100dvh; overflow: auto !important; }
        .ys-sidebar { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; padding: 12px 16px !important; gap: 0; flex-shrink: 0 !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }
        .ys-brand  { margin-bottom: 0 !important; flex: 1; }
        .ys-nav    { flex-direction: row !important; flex: none; gap: 4px !important; align-items: center; }
        .ys-nav-item { padding: 8px 11px !important; font-size: 12px !important; gap: 6px !important; }
        .ys-sidebar-foot { display: none !important; }
        .ys-main   { overflow: visible !important; flex: none !important; }
        .ys-header { padding: 16px !important; flex-wrap: wrap; gap: 10px; position: static !important; }
        .ys-h1     { font-size: 19px !important; }
        .ys-search { width: 100% !important; }
        .ys-board  { grid-template-columns: 1fr !important; padding: 12px !important; gap: 12px !important; overflow: visible !important; flex: none !important; }
        .ys-column { min-height: 80px !important; }
        .ys-modal  { border-radius: 22px 22px 0 0 !important; width: 100vw !important; max-height: 92dvh !important; position: fixed !important; bottom: 0 !important; left: 0 !important; }
        .ys-overlay { align-items: flex-end !important; }
      }
    `,
  },

  // ── Light (Notion) ────────────────────────────────────────────────────────
  light: {
    priorities: {
      urgent:    { label: "Срочно",  emoji: "🔴", color: "#C0392B", bg: "#FDEDEC" },
      important: { label: "Важно",   emoji: "🟡", color: "#B8860B", bg: "#FEF9E7" },
      normal:    { label: "Обычно",  emoji: "⚪", color: "#9B948A", bg: "#F4F3F0" },
    },
    st: {
      app:          { display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#FBFBFA", color: "#37352F", overflow: "hidden" },
      sidebar:      { width: 248, background: "#F7F6F3", color: "#37352F", display: "flex", flexDirection: "column", padding: "20px 12px", flexShrink: 0, borderRight: "1px solid #ECEAE4" },
      brand:        { display: "flex", alignItems: "center", gap: 11, marginBottom: 26, padding: "0 6px" },
      logo:         { width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg, #1B4F8A, #0D2240)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff", boxShadow: "0 2px 8px rgba(13,34,64,.2)", flexShrink: 0 },
      brandName:    { fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.01em", color: "#37352F" },
      brandSub:     { fontSize: 10.5, color: "#9B948A", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2, fontWeight: 600 },
      nav:          { display: "flex", flexDirection: "column", gap: 1, flex: 1 },
      navItem:      { display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 6, fontSize: 14, fontWeight: 500, color: "#6F6A60", cursor: "pointer", transition: "all .12s" },
      navActive:    { background: "#ECEAE4", color: "#37352F" },
      navDivider:   { height: 1, background: "#ECEAE4", margin: "10px 8px" },
      navBadge:     { marginLeft: "auto", background: "#E03E3E", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "1px 7px", lineHeight: 1.6 },
      sidebarFoot:  { fontSize: 11, color: "#9B948A", paddingLeft: 8, lineHeight: 1.7 },
      sidebarFootLine: {},
      resetBtn:     { marginTop: 8, background: "#fff", border: "1px solid #E5E2DB", color: "#787066", borderRadius: 7, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", width: "100%" },
      main:         { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
      header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid #ECEAE4", background: "#fff", flexShrink: 0 },
      h1:           { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "#1F1B16" },
      sub:          { fontSize: 13, color: "#9B948A", margin: "4px 0 0" },
      headerRight:  { display: "flex", alignItems: "center", gap: 14 },
      searchWrap:   { display: "flex", alignItems: "center", gap: 8, background: "#F4F3F0", border: "1px solid #E5E2DB", borderRadius: 8, padding: "8px 13px", width: 220, cursor: "text", color: "#9B948A" },
      searchInput:  { border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#37352F", fontFamily: "inherit", width: "100%" },
      avatar:       { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1B4F8A, #0D2240)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
      board:        { display: "grid", gridTemplateColumns: "repeat(3, minmax(300px, 1fr))", gap: 18, padding: 26, overflowX: "auto", overflowY: "auto", flex: 1, alignItems: "stretch" },
      column:       { background: "#F4F3F1", borderRadius: 12, padding: 13, minHeight: 200, transition: "background .15s, box-shadow .15s", border: "1px solid transparent", display: "flex", flexDirection: "column" },
      columnOver:   { background: "#EAF1FA", border: "1px dashed #1B4F8A", boxShadow: "inset 0 0 0 1px rgba(27,79,138,.08)" },
      colHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "2px 4px" },
      colTitleWrap: { display: "flex", alignItems: "center", gap: 9 },
      colDot:       { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
      colTitle:     { fontWeight: 600, fontSize: 13.5, color: "#57534C", letterSpacing: "-0.01em" },
      colCount:     { fontSize: 12, fontWeight: 600, color: "#9B948A", background: "rgba(0,0,0,.05)", borderRadius: 20, padding: "1px 8px" },
      colAdd:       { width: 26, height: 26, borderRadius: 7, border: "1px solid #E5E2DB", background: "#fff", color: "#1B4F8A", fontSize: 18, fontWeight: 600, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" },
      cardList:     { display: "flex", flexDirection: "column", gap: 9, flex: 1 },
      card:         { background: "#fff", borderRadius: 9, padding: "13px 14px 12px", boxShadow: "0 1px 2px rgba(15,15,15,.04)", cursor: "pointer", border: "1px solid #ECEAE4", transition: "box-shadow .15s, transform .15s, border-color .15s", position: "relative" },
      cardTop:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "absolute", top: 0, left: 0, right: 0 },
      cardStripe:   { width: 28, height: 3, borderRadius: 3, margin: "12px 0 0 14px" },
      cardDel:      { border: "none", background: "transparent", color: "#C4C0B6", fontSize: 18, cursor: "pointer", padding: "6px 10px", lineHeight: 1 },
      cardTitle:    { fontWeight: 600, fontSize: 14, color: "#37352F", marginTop: 10, lineHeight: 1.35, cursor: "pointer" },
      cardDesc:     { fontSize: 12.5, color: "#787066", marginTop: 5, lineHeight: 1.45 },
      cardMeta:     { display: "flex", gap: 6, marginTop: 11, flexWrap: "wrap" },
      metaChip:     { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#787066", border: "1px solid #E5E2DB", borderRadius: 6, padding: "3px 8px", background: "#FBFBFA" },
      composer:     { background: "#fff", borderRadius: 9, padding: 12, boxShadow: "0 6px 20px rgba(15,15,15,.1)", display: "flex", flexDirection: "column", gap: 8, border: "1px solid #D9E2EF" },
      input:        { border: "1px solid #E5E2DB", borderRadius: 7, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#37352F", width: "100%", boxSizing: "border-box", background: "#fff" },
      priorityPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
      prBtn:        { border: "1px solid #E5E2DB", borderRadius: 7, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .12s" },
      composerRow:  { display: "flex", gap: 8, marginTop: 2 },
      btnPrimary:   { flex: 1, background: "#1B4F8A", color: "#fff", border: "none", borderRadius: 7, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
      btnGhost:     { background: "transparent", color: "#787066", border: "1px solid #E5E2DB", borderRadius: 7, padding: "9px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
      empty:        { textAlign: "center", color: "#B0A99D", fontSize: 12.5, padding: "24px 0", border: "1.5px dashed #E0DCD3", borderRadius: 9 },
      todayView:    { flex: 1, overflowY: "auto", padding: 26 },
      todayList:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 },
      todayEmpty:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", color: "#787066" },
      overlay:      { position: "fixed", inset: 0, background: "rgba(15,15,15,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" },
      modal:        { background: "#fff", borderRadius: 14, width: "min(620px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(15,15,15,.22)", overflow: "hidden", border: "1px solid #ECEAE4" },
      modalHeader:  { display: "flex", alignItems: "center", gap: 12, padding: "18px 20px 16px", borderBottom: "1px solid #F0EEE9", flexShrink: 0 },
      modalTitle:   { flex: 1, border: "none", outline: "none", fontSize: 17, fontWeight: 700, color: "#1F1B16", fontFamily: "inherit", letterSpacing: "-0.01em", background: "transparent" },
      modalClose:   { border: "none", background: "transparent", color: "#9B948A", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 2px" },
      modalBody:    { overflowY: "auto", padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 4 },
      modalSection: { paddingBottom: 16, borderBottom: "1px solid #F4F3F0", marginBottom: 4 },
      modalLabel:   { fontSize: 11, fontWeight: 700, color: "#9B948A", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 },
      textarea:     { border: "1px solid #E5E2DB", borderRadius: 7, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#37352F", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 64, lineHeight: 1.5, background: "#fff" },
      checkItem:    { display: "flex", alignItems: "center", gap: 10, padding: "5px 0" },
      checkText:    { flex: 1, fontSize: 13, lineHeight: 1.4 },
      checkDel:     { border: "none", background: "transparent", color: "#C4C0B6", fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 },
      checkAdd:     { display: "flex", gap: 8, alignItems: "center" },
      texture:      { display: "none" },
      cursorDot:    { display: "none" },
      cursorHalo:   { display: "none" },
      blob1:        { display: "none" },
      blob2:        { display: "none" },
      blob3:        { display: "none" },
      aiBtn:        { width: "100%", background: "#1B4F8A", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
      aiPanel:      { marginTop: 12, background: "#F4F3F0", border: "1px solid #E5E2DB", borderRadius: 10, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, color: "#57534C", whiteSpace: "pre-wrap" },
      docChip:      { display: "inline-flex", alignItems: "center", gap: 6, background: "#F4F3F0", border: "1px solid #E5E2DB", borderRadius: 7, padding: "6px 10px", fontSize: 12, color: "#57534C" },
      docZone:      { border: "1.5px dashed #DAD7CF", borderRadius: 9, padding: "14px", textAlign: "center", color: "#9B948A", fontSize: 12.5, cursor: "pointer", transition: "border-color .15s, color .15s" },
      checkboxAccent:  "#1B4F8A",
      checkTextActive: "#37352F",
      checkTextDone:   "#9B948A",
    },
    css: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; }
      .ys-card:hover { box-shadow: 0 4px 14px rgba(15,15,15,.1) !important; transform: translateY(-1px); border-color: #DAD7CF !important; }
      .ys-card:active { transform: scale(0.98); }
      .ys-nav-item:hover { background: #EFEDE8; color: #37352F; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: #DAD7CF; border-radius: 5px; }
      ::-webkit-scrollbar-thumb:hover { background: #C4C0B6; }
      ::-webkit-scrollbar-track { background: transparent; }
      input::placeholder, textarea::placeholder { color: #B0A99D; }
      @media (max-width: 768px) {
        .ys-app    { flex-direction: column !important; height: auto !important; min-height: 100dvh; overflow: auto !important; }
        .ys-sidebar { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; padding: 12px 16px !important; gap: 0; flex-shrink: 0 !important; border-right: none !important; border-bottom: 1px solid #ECEAE4 !important; }
        .ys-brand  { margin-bottom: 0 !important; flex: 1; }
        .ys-nav    { flex-direction: row !important; flex: none; gap: 4px !important; align-items: center; }
        .ys-nav-item { padding: 8px 10px !important; font-size: 12px !important; gap: 6px !important; }
        .ys-sidebar-foot { display: none !important; }
        .ys-main   { overflow: visible !important; flex: none !important; }
        .ys-header { padding: 16px !important; flex-wrap: wrap; gap: 10px; }
        .ys-h1     { font-size: 18px !important; }
        .ys-search { width: 100% !important; }
        .ys-board  { grid-template-columns: 1fr !important; padding: 12px !important; gap: 12px !important; overflow: visible !important; flex: none !important; }
        .ys-column { min-height: 80px !important; }
        .ys-modal  { border-radius: 14px 14px 0 0 !important; width: 100vw !important; max-height: 92dvh !important; position: fixed !important; bottom: 0 !important; left: 0 !important; }
        .ys-overlay { align-items: flex-end !important; }
      }
    `,
  },
};

const THEME_DOTS = [
  { key: "cosmos", color: "#4D7CFF", label: "Космос" },
  { key: "signal", color: "#D4FF5E", label: "Сигнал" },
  { key: "light",  color: "#C4C0B6", label: "Notion" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Yasnost() {
  const [themeName, setThemeName] = useState(() => localStorage.getItem("ys-theme") || "cosmos");
  const { st, css, priorities } = THEMES[themeName];

  const [cards,          setCards]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saveStatus,     setSaveStatus]     = useState("idle");
  const [dragId,         setDragId]         = useState(null);
  const [overCol,        setOverCol]        = useState(null);
  const [adding,         setAdding]         = useState(null);
  const [draft,          setDraft]          = useState({ title: "", desc: "", due: "", priority: "normal" });
  const [searchQuery,    setSearchQuery]    = useState("");
  const [view,           setView]           = useState("board");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [newCheckItem,   setNewCheckItem]   = useState("");
  const [aiLoading,      setAiLoading]      = useState(null);
  const wasDragging   = useRef(false);
  const saveTimer     = useRef(null);
  const isInitialLoad = useRef(true);
  const touchState    = useRef({ id: null, moved: false, ghost: null, el: null, offset: { x: 0, y: 0 }, startX: 0, startY: 0, rect: null });
  const mainRef       = useRef(null);
  const cursorDot     = useRef(null);
  const cursorHalo    = useRef(null);

  const switchTheme = (key) => {
    setThemeName(key);
    localStorage.setItem("ys-theme", key);
  };

  // Загрузка
  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => { setCards(Array.isArray(data) && data.length > 0 ? data : SEED); setLoading(false); })
      .catch(() => { setCards(SEED); setLoading(false); });
  }, []);

  // Автосохранение
  useEffect(() => {
    if (loading) return;
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    const snapshot = cards;
    saveTimer.current = setTimeout(() => {
      fetch("/api/cards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot) })
        .then((r) => setSaveStatus(r.ok ? "saved" : "error"))
        .catch(() => setSaveStatus("error"));
    }, 150);
  }, [cards, loading]);

  useEffect(() => {
    const onUnload = () => {
      if (!loading && !isInitialLoad.current) {
        const blob = new Blob([JSON.stringify(cards)], { type: "application/json" });
        navigator.sendBeacon("/api/cards", blob);
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [cards, loading]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setSelectedCardId(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { setNewCheckItem(""); }, [selectedCardId]);

  // Touch drag — move
  useEffect(() => {
    const onMove = (e) => {
      const ts = touchState.current;
      if (!ts.id) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - ts.startX);
      const dy = Math.abs(touch.clientY - ts.startY);
      if (!ts.moved && dx < 8 && dy < 8) return;
      if (!ts.moved) {
        ts.moved = true; wasDragging.current = true; setDragId(ts.id);
        const ghost = ts.el.cloneNode(true);
        Object.assign(ghost.style, { position: "fixed", width: ts.rect.width + "px", opacity: "0.88", pointerEvents: "none", zIndex: "999", margin: "0", transition: "none", transform: "rotate(2deg) scale(1.04)", boxShadow: "0 14px 36px rgba(13,34,64,.28)", left: (touch.clientX - ts.offset.x) + "px", top: (touch.clientY - ts.offset.y) + "px" });
        document.body.appendChild(ghost); ts.ghost = ghost;
      }
      if (ts.ghost) {
        ts.ghost.style.left = (touch.clientX - ts.offset.x) + "px";
        ts.ghost.style.top  = (touch.clientY - ts.offset.y) + "px";
        ts.ghost.style.visibility = "hidden";
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        ts.ghost.style.visibility = "visible";
        const colEl = el?.closest("[data-colid]");
        setOverCol(colEl ? colEl.dataset.colid : null);
      }
    };
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => document.removeEventListener("touchmove", onMove);
  }, []);

  // Touch drag — end
  useEffect(() => {
    const onEnd = (e) => {
      const ts = touchState.current;
      if (!ts.id) return;
      if (ts.ghost) { ts.ghost.remove(); ts.ghost = null; }
      if (ts.moved) {
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const colEl = el?.closest("[data-colid]");
        if (colEl) { const targetStatus = colEl.dataset.colid; const cardId = ts.id; setCards((cs) => cs.map((c) => c.id === cardId ? { ...c, status: targetStatus } : c)); }
        setDragId(null); setOverCol(null); e.preventDefault();
        setTimeout(() => { wasDragging.current = false; }, 100);
      } else { wasDragging.current = false; }
      touchState.current = { id: null, moved: false, ghost: null, el: null, offset: { x: 0, y: 0 }, startX: 0, startY: 0, rect: null };
    };
    document.addEventListener("touchend", onEnd);
    return () => document.removeEventListener("touchend", onEnd);
  }, []);

  // Кастомный курсор — только Cosmos
  useEffect(() => {
    if (themeName !== "cosmos") return;
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = cursorDot.current, halo = cursorHalo.current;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, hx = mx, hy = my, raf;
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const main = mainRef.current;
      if (main) { const r = main.getBoundingClientRect(); main.style.setProperty("--mx", (e.clientX - r.left) + "px"); main.style.setProperty("--my", (e.clientY - r.top) + "px"); }
    };
    const loop = () => { hx += (mx - hx) * 0.22; hy += (my - hy) * 0.22; if (halo) halo.style.transform = `translate(${hx}px, ${hy}px) translate(-50%, -50%)`; raf = requestAnimationFrame(loop); };
    const onOver = (e) => { if (halo && e.target.closest && e.target.closest(".ys-card")) halo.classList.add("ys-halo-lg"); };
    const onOut  = (e) => { if (halo && e.target.closest && e.target.closest(".ys-card")) halo.classList.remove("ys-halo-lg"); };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseover", onOver); document.removeEventListener("mouseout", onOut); cancelAnimationFrame(raf); };
  }, [themeName]);

  // 3D-наклон — только Cosmos
  const onCardTilt = themeName === "cosmos" ? (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform .08s ease-out";
    el.style.transform = `perspective(600px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg) translateZ(4px)`;
    el.style.setProperty("--bx", ((e.clientX - r.left) / r.width * 100) + "%");
    el.style.setProperty("--by", ((e.clientY - r.top) / r.height * 100) + "%");
  } : undefined;

  const onCardLeave = themeName === "cosmos" ? (e) => {
    const el = e.currentTarget; el.style.transition = "transform .4s ease"; el.style.transform = "none";
  } : undefined;

  const buildAnalysis = (c) => {
    const pr = (priorities[c.priority] || priorities.normal).label;
    const d = c.due ? new Date(c.due + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : "не задан";
    const cl = c.checklist || [];
    const done = cl.filter((i) => i.done).length;
    return `✦ Разбор задачи\n«${c.title}»\n\nСуть: ${c.desc || "описание не указано"}.\nПриоритет: ${pr}. Дедлайн: ${d}.\nДокументов: ${c.docs || 0}. Чеклист: ${done}/${cl.length}.\n\nРекомендации\n1. Назначить ответственного и контрольную дату.\n2. ${c.docs ? ("Свериться с вложениями (" + c.docs + ") перед стартом.") : "Приложить исходные документы для контекста."}\n3. ${cl.length ? ("Закрыть оставшиеся пункты чеклиста (" + (cl.length - done) + ").") : "Разбить задачу на 3–5 проверяемых шагов."}`;
  };
  const runAnalysis = (card) => { setAiLoading(card.id); setTimeout(() => { updateCard(card.id, { ai: buildAnalysis(card) }); setAiLoading(null); }, 1600); };

  const updateCard = (id, changes) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  const onDrop = (status) => { if (dragId != null) updateCard(dragId, { status }); setDragId(null); setOverCol(null); };

  const addCard = (status) => {
    if (!draft.title.trim()) return;
    const newId = Math.max(0, ...cards.map((c) => c.id)) + 1;
    setCards((cs) => [...cs, { id: newId, title: draft.title, desc: draft.desc, status, due: draft.due, docs: 0, priority: draft.priority, notes: "", checklist: [] }]);
    setDraft({ title: "", desc: "", due: "", priority: "normal" });
    setAdding(null);
  };

  const removeCard = (id) => { if (selectedCardId === id) setSelectedCardId(null); setCards((cs) => cs.filter((c) => c.id !== id)); };
  const resetCards = () => setCards(SEED.map((c) => ({ ...c })));

  const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d + "T00:00:00");
    const tod = new Date(TODAY + "T00:00:00");
    const diff = Math.round((dt - tod) / 86400000);
    const s = dt.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    if (diff < 0)   return { tone: "#C0392B", label: s };
    if (diff === 0) return { tone: "#C0392B", label: "Сегодня" };
    if (diff <= 2)  return { tone: "#B8860B", label: s };
    return { tone: "#6B7280", label: s };
  };

  const q            = searchQuery.toLowerCase();
  const visibleCards = q ? cards.filter((c) => c.title.toLowerCase().includes(q)) : cards;
  const todayCards   = cards.filter((c) => c.due && c.due <= TODAY).sort((a, b) => a.due.localeCompare(b.due));
  const visibleToday = q ? todayCards.filter((c) => c.title.toLowerCase().includes(q)) : todayCards;
  const countBy      = (status) => visibleCards.filter((c) => c.status === status).length;
  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  const onCardTouchStart = (e, cardId) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchState.current = { id: cardId, moved: false, ghost: null, el: e.currentTarget, offset: { x: touch.clientX - rect.left, y: touch.clientY - rect.top }, startX: touch.clientX, startY: touch.clientY, rect };
  };

  const addCheckItem = (cardId, checklist) => {
    if (!newCheckItem.trim()) return;
    updateCard(cardId, { checklist: [...checklist, { id: Date.now(), text: newCheckItem.trim(), done: false }] });
    setNewCheckItem("");
  };

  const renderCard = (c, accent) => {
    const colAccent = accent ?? COLUMNS.find((col) => col.id === c.status)?.accent ?? "#6B7280";
    const d  = fmtDate(c.due);
    const pr = priorities[c.priority] || priorities.normal;
    const cl = c.checklist || [];
    return (
      <article
        key={c.id}
        draggable
        onDragStart={(e) => { e.currentTarget.style.transform = "none"; setDragId(c.id); wasDragging.current = true; }}
        onDragEnd={() => { setDragId(null); setOverCol(null); setTimeout(() => { wasDragging.current = false; }, 0); }}
        onClick={() => { if (!wasDragging.current) setSelectedCardId(c.id); }}
        onMouseMove={onCardTilt}
        onMouseLeave={onCardLeave}
        onTouchStart={(e) => onCardTouchStart(e, c.id)}
        style={{ ...st.card, opacity: dragId === c.id ? 0.4 : 1 }}
        className="ys-card"
      >
        <div style={st.cardTop}>
          <span style={{ ...st.cardStripe, background: colAccent }} />
          <button style={st.cardDel} onClick={(e) => { e.stopPropagation(); removeCard(c.id); }}>×</button>
        </div>
        <div style={st.cardTitle}>{c.title}</div>
        {c.desc && <div style={st.cardDesc}>{c.desc}</div>}
        <div style={st.cardMeta}>
          <span style={{ ...st.metaChip, color: pr.color, borderColor: pr.color + "33", background: pr.bg }} className={"ys-pr ys-pr-" + c.priority}>
            {pr.emoji} {pr.label}
          </span>
          {d && (
            <span style={{ ...st.metaChip, color: d.tone, borderColor: d.tone + "33" }}>
              <Icon name="clock" color={d.tone} /> {d.label}
            </span>
          )}
          {cl.length > 0 && <span style={st.metaChip}>✓ {cl.filter((i) => i.done).length}/{cl.length}</span>}
        </div>
      </article>
    );
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: st.app.fontFamily, background: st.app.background, gap: 14, color: "#6a6a6a" }}>
      <div style={{ ...st.logo }}>Я</div>
      <div style={{ fontSize: 14 }}>Загрузка…</div>
    </div>
  );

  return (
    <div style={st.app} className="ys-app">
      <style>{css}</style>
      <div ref={cursorDot}  style={st.cursorDot}  className="ys-cursor-dot"  aria-hidden="true" />
      <div ref={cursorHalo} style={st.cursorHalo} className="ys-cursor-halo" aria-hidden="true" />
      {themeName === "cosmos" && <div style={st.texture} aria-hidden="true" />}

      {/* ── Sidebar ── */}
      <aside style={st.sidebar} className="ys-sidebar">
        <div style={st.brand} className="ys-brand">
          <div style={st.logo}>Я</div>
          <div>
            <div style={st.brandName}>Ясность</div>
            <div style={st.brandSub}>М.К ИНВЕСТ</div>
          </div>
        </div>

        <nav style={st.nav} className="ys-nav">
          <div className="ys-nav-item" style={{ ...st.navItem, ...(view === "board" ? st.navActive : {}) }} onClick={() => setView("board")}>
            <Icon name="board" /> Доска задач
          </div>
          <div className="ys-nav-item" style={{ ...st.navItem, ...(view === "today" ? st.navActive : {}) }} onClick={() => setView("today")}>
            <Icon name="today" /> Сегодня
            {todayCards.length > 0 && <span style={st.navBadge}>{todayCards.length}</span>}
          </div>
          <div style={st.navItem}><Icon name="doc" /> Документы</div>
          <div style={st.navItem}><Icon name="bell" /> Напоминания</div>
          <div style={st.navDivider} />
          <div style={st.navItem}><Icon name="plus" /> Новый раздел</div>
        </nav>

        <div style={st.sidebarFoot} className="ys-sidebar-foot">
          <div style={st.sidebarFootLine}>v1.2 · прототип</div>
          <div style={{ ...st.sidebarFootLine, color: saveStatus === "error" ? "#E57373" : saveStatus === "saving" ? "#7E93B5" : "#4CAF82" }}>
            {saveStatus === "saving" ? "⏳ Сохраняется…" : saveStatus === "error" ? "✗ Ошибка сохранения" : "✓ Данные на сервере"}
          </div>
          <button style={st.resetBtn} onClick={resetCards}>↺ Сбросить данные</button>
          {/* Theme switcher */}
          <div style={{ display: "flex", gap: 8, paddingLeft: 0, marginTop: 12, alignItems: "center" }}>
            {THEME_DOTS.map(({ key, color, label }) => (
              <button
                key={key}
                title={label}
                onClick={() => switchTheme(key)}
                style={{
                  width: 14, height: 14, borderRadius: "50%", border: "2px solid",
                  background: themeName === key ? color : "transparent",
                  borderColor: color,
                  cursor: "pointer", padding: 0, transition: "all .15s", opacity: themeName === key ? 1 : 0.45,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={st.main} className="ys-main" ref={mainRef}>
        <div style={st.blob1} className="ys-blob ys-blob1" aria-hidden="true" />
        <div style={st.blob2} className="ys-blob ys-blob2" aria-hidden="true" />
        <div style={st.blob3} className="ys-blob ys-blob3" aria-hidden="true" />

        <header style={st.header} className="ys-header">
          <div>
            <h1 style={st.h1} className="ys-h1">{view === "board" ? "Доска задач" : "Сегодня"}</h1>
            <p style={st.sub}>
              {view === "board" ? `${cards.length} задач · ${countBy("in_progress")} в работе` : `${todayCards.length} задач требуют внимания`}
            </p>
          </div>
          <div style={st.headerRight}>
            <label style={st.searchWrap} className="ys-search">
              <Icon name="search" />
              <input style={st.searchInput} placeholder="Поиск…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </label>
            <div style={st.avatar}>И</div>
          </div>
        </header>

        {/* Board */}
        {view === "board" && (
          <div style={st.board} className="ys-board">
            {COLUMNS.map((col) => (
              <section
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
                onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                onDrop={() => onDrop(col.id)}
                className="ys-column"
                data-colid={col.id}
                style={{ ...st.column, ...(overCol === col.id ? st.columnOver : {}) }}
              >
                <div style={st.colHead}>
                  <div style={st.colTitleWrap}>
                    <span style={{ ...st.colDot, background: col.accent }} />
                    <span style={st.colTitle}>{col.title}</span>
                    <span style={st.colCount}>{countBy(col.id)}</span>
                  </div>
                  <button style={st.colAdd} className="ys-add"
                    onClick={() => { setAdding(col.id); setDraft({ title: "", desc: "", due: "", priority: "normal" }); }}>+</button>
                </div>

                <div style={st.cardList}>
                  {visibleCards.filter((c) => c.status === col.id).map((c) => renderCard(c, col.accent))}

                  {adding === col.id && (
                    <div style={st.composer}>
                      <input autoFocus placeholder="Название задачи" value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addCard(col.id)} style={st.input} />
                      <input placeholder="Описание (необязательно)" value={draft.desc}
                        onChange={(e) => setDraft({ ...draft, desc: e.target.value })} style={st.input} />
                      <input type="date" value={draft.due}
                        onChange={(e) => setDraft({ ...draft, due: e.target.value })} style={st.input} />
                      <div style={st.priorityPicker}>
                        {Object.entries(priorities).map(([key, pr]) => (
                          <button key={key} onClick={() => setDraft({ ...draft, priority: key })}
                            style={{ ...st.prBtn, background: draft.priority === key ? pr.bg : "transparent", borderColor: draft.priority === key ? pr.color : undefined, color: draft.priority === key ? pr.color : undefined }}>
                            {pr.emoji} {pr.label}
                          </button>
                        ))}
                      </div>
                      <div style={st.composerRow}>
                        <button style={st.btnPrimary} onClick={() => addCard(col.id)}>Добавить</button>
                        <button style={st.btnGhost}   onClick={() => setAdding(null)}>Отмена</button>
                      </div>
                    </div>
                  )}

                  {countBy(col.id) === 0 && adding !== col.id && <div style={st.empty}>Перетащите задачу сюда</div>}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Today */}
        {view === "today" && (
          <div style={st.todayView}>
            {visibleToday.length === 0 ? (
              <div style={st.todayEmpty}>
                <div style={{ fontSize: 40 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginTop: 14 }}>{q ? "Ничего не найдено" : "Всё под контролем"}</div>
                <div style={{ fontSize: 13, marginTop: 5 }}>{q ? "Попробуй другой запрос" : "Нет задач с дедлайном сегодня или раньше"}</div>
              </div>
            ) : (
              <div style={st.todayList}>{visibleToday.map((c) => renderCard(c))}</div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      {selectedCard && (
        <div style={st.overlay} className="ys-overlay" onClick={() => setSelectedCardId(null)}>
          <div style={st.modal} className="ys-modal" onClick={(e) => e.stopPropagation()}>
            <div style={st.modalHeader}>
              <span style={{ ...st.colDot, width: 11, height: 11, flexShrink: 0, background: COLUMNS.find((c) => c.id === selectedCard.status)?.accent ?? "#6B7280" }} />
              <input style={st.modalTitle} value={selectedCard.title} onChange={(e) => updateCard(selectedCard.id, { title: e.target.value })} />
              <button style={st.modalClose} onClick={() => setSelectedCardId(null)}>×</button>
            </div>

            <div style={st.modalBody}>
              <div style={st.modalSection}>
                <div style={st.modalLabel}>Приоритет</div>
                <div style={st.priorityPicker}>
                  {Object.entries(priorities).map(([key, pr]) => (
                    <button key={key} onClick={() => updateCard(selectedCard.id, { priority: key })}
                      style={{ ...st.prBtn, background: selectedCard.priority === key ? pr.bg : "transparent", borderColor: selectedCard.priority === key ? pr.color : undefined, color: selectedCard.priority === key ? pr.color : undefined }}>
                      {pr.emoji} {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>Статус</div>
                <div style={st.priorityPicker}>
                  {COLUMNS.map((col) => (
                    <button key={col.id} onClick={() => updateCard(selectedCard.id, { status: col.id })}
                      style={{ ...st.prBtn, background: selectedCard.status === col.id ? col.accent + "18" : "transparent", borderColor: selectedCard.status === col.id ? col.accent : undefined, color: selectedCard.status === col.id ? col.accent : undefined }}>
                      {col.title}
                    </button>
                  ))}
                </div>
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>Дедлайн</div>
                <input type="date" style={{ ...st.input, width: "auto", display: "inline-block" }}
                  value={selectedCard.due || ""} onChange={(e) => updateCard(selectedCard.id, { due: e.target.value })} />
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>Описание</div>
                <textarea style={st.textarea} placeholder="Краткое описание…"
                  value={selectedCard.desc || ""} onChange={(e) => updateCard(selectedCard.id, { desc: e.target.value })} />
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>Заметки</div>
                <textarea style={{ ...st.textarea, minHeight: 96 }} placeholder="Свободные заметки, ссылки, детали…"
                  value={selectedCard.notes || ""} onChange={(e) => updateCard(selectedCard.id, { notes: e.target.value })} />
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>
                  Чеклист
                  {(selectedCard.checklist || []).length > 0 && (
                    <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                      {(selectedCard.checklist || []).filter((i) => i.done).length} / {(selectedCard.checklist || []).length}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {(selectedCard.checklist || []).map((item) => (
                    <div key={item.id} style={st.checkItem}>
                      <input type="checkbox" checked={item.done} style={{ cursor: "pointer", accentColor: st.checkboxAccent, flexShrink: 0 }}
                        onChange={() => updateCard(selectedCard.id, { checklist: selectedCard.checklist.map((i) => i.id === item.id ? { ...i, done: !i.done } : i) })} />
                      <span style={{ ...st.checkText, textDecoration: item.done ? "line-through" : "none", color: item.done ? st.checkTextDone : st.checkTextActive }}>
                        {item.text}
                      </span>
                      <button style={st.checkDel}
                        onClick={() => updateCard(selectedCard.id, { checklist: selectedCard.checklist.filter((i) => i.id !== item.id) })}>×</button>
                    </div>
                  ))}
                </div>
                <div style={st.checkAdd}>
                  <input style={{ ...st.input, flex: 1, marginBottom: 0 }} placeholder="Новый пункт… (Enter)"
                    value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCheckItem(selectedCard.id, selectedCard.checklist || []); }} />
                  <button style={{ ...st.btnPrimary, padding: "9px 16px", flexShrink: 0 }}
                    onClick={() => addCheckItem(selectedCard.id, selectedCard.checklist || [])}>+</button>
                </div>
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>
                  Документы
                  {(selectedCard.docs || 0) > 0 && <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 12 }}>{selectedCard.docs}</span>}
                </div>
                {(selectedCard.docs || 0) > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {Array.from({ length: selectedCard.docs }).map((_, i) => (
                      <span key={i} style={st.docChip}><Icon name="doc" color={st.checkboxAccent} /> Документ {i + 1}.pdf</span>
                    ))}
                  </div>
                )}
                <div style={st.docZone} className="ys-doc-zone"
                  onClick={() => updateCard(selectedCard.id, { docs: (selectedCard.docs || 0) + 1 })}>
                  + Прикрепить документ
                </div>
              </div>

              <div style={{ ...st.modalSection, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                <button style={st.aiBtn} className="ys-ai-btn" disabled={aiLoading === selectedCard.id}
                  onClick={() => runAnalysis(selectedCard)}>
                  {aiLoading === selectedCard.id ? "Анализирую…" : "✦ Анализ через AI"}
                </button>
                {selectedCard.ai && aiLoading !== selectedCard.id && (
                  <div style={st.aiPanel}>{selectedCard.ai}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Icon({ name, color = "currentColor" }) {
  const p = { width: 14, height: 14, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    board:  <><rect x="3" y="3" width="6" height="18" rx="1" /><rect x="11" y="3" width="6" height="11" rx="1" /></>,
    doc:    <><path d="M6 2h7l5 5v15H6z" /><path d="M13 2v5h5" /></>,
    bell:   <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    plus:   <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    clock:  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    today:  <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  };
  return <svg viewBox="0 0 24 24" style={p}>{paths[name]}</svg>;
}
