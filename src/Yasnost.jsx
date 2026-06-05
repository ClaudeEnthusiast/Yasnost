import React, { useState, useEffect, useRef } from "react";

const TODAY = new Date().toISOString().slice(0, 10);
const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

const COLUMNS = [
  { id: "todo",        title: "Нужно сделать", accent: "#6B7280" },
  { id: "in_progress", title: "В работе",       accent: "#1B4F8A" },
  { id: "done",        title: "Готово",          accent: "#2E7D5B" },
];

const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const tagHue = (s) => { let h = 0; const str = String(s); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; };
const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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
      app:          { display: "flex", height: "100vh", fontFamily: "'Manrope', system-ui, sans-serif", background: "#03050A", color: "#e0e0e0", overflow: "hidden", position: "relative" },
      sidebar:      { width: 244, background: "rgba(6,8,14,.72)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", color: "#c2c6cc", display: "flex", flexDirection: "column", padding: "22px 14px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,.08)" },
      brand:        { display: "flex", alignItems: "center", gap: 12, marginBottom: 30, padding: "0 6px" },
      logo:         { width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19, color: "#fff", boxShadow: "0 0 24px rgba(77,124,255,.5)", flexShrink: 0 },
      brandName:    { fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: "#ffffff" },
      brandSub:     { fontSize: 10.5, color: "#8a93a6", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3, fontWeight: 600 },
      nav:          { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
      navItem:      { position: "relative", display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: "#9aa4b6", cursor: "pointer", transition: "color .2s cubic-bezier(.2,.7,.3,1), background .2s cubic-bezier(.2,.7,.3,1)" },
      navActive:    { background: "linear-gradient(90deg, rgba(77,124,255,.16), rgba(124,58,255,.06))", color: "#ffffff", boxShadow: "inset 0 0 0 1px rgba(77,124,255,.18)" },
      navDivider:   { height: 1, background: "rgba(255,255,255,.06)", margin: "12px 8px" },
      navBadge:     { marginLeft: "auto", background: "#4D7CFF", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 8px", lineHeight: 1.6, boxShadow: "0 0 10px rgba(77,124,255,.6)" },
      sidebarFoot:  { fontSize: 10.5, color: "#6b7488", paddingLeft: 8, lineHeight: 1.8 },
      sidebarFootLine: {},
      resetBtn:     { marginTop: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#9aa4b6", borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", width: "100%" },
      main:         { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", background: "transparent" },
      header:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 30px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(6,8,14,.88)", flexShrink: 0, position: "relative", zIndex: 2, backdropFilter: "blur(12px)" },
      h1:           { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "#ffffff" },
      sub:          { fontSize: 13, color: "#8a93a6", margin: "5px 0 0" },
      headerRight:  { display: "flex", alignItems: "center", gap: 14 },
      searchWrap:   { display: "flex", alignItems: "center", gap: 8, background: "#141414", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "9px 14px", width: 230, cursor: "text", color: "#8a93a6" },
      searchInput:  { border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#e0e0e0", fontFamily: "inherit", width: "100%" },
      avatar:       { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: "0 0 16px rgba(77,124,255,.45)" },
      board:        { display: "grid", gridTemplateColumns: "repeat(3, minmax(310px, 1fr))", gap: 18, padding: 26, overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0, alignItems: "stretch", position: "relative", zIndex: 1 },
      column:       { background: "rgba(255,255,255,.015)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 16, padding: 14, minHeight: 0, maxHeight: "100%", transition: "background .15s, box-shadow .15s", border: "1px solid rgba(255,255,255,.05)", display: "flex", flexDirection: "column" },
      columnOver:   { background: "#101010", border: "1px solid rgba(77,124,255,.5)", boxShadow: "inset 0 0 0 1px rgba(77,124,255,.2), 0 0 28px rgba(77,124,255,.14)" },
      colHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "2px 4px" },
      colTitleWrap: { display: "flex", alignItems: "center", gap: 9 },
      colDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
      colTitle:     { fontWeight: 600, fontSize: 11, color: "#8893a8", letterSpacing: "0.12em", textTransform: "uppercase" },
      colCount:     { fontSize: 11.5, fontWeight: 600, color: "#9aa4b6", background: "rgba(255,255,255,.05)", borderRadius: 999, padding: "1px 8px" },
      colAdd:       { width: 25, height: 25, borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "#4D7CFF", fontSize: 17, fontWeight: 600, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" },
      cardList:     { display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 2 },
      card:         { background: "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018))", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 14, padding: "14px 15px 13px", cursor: "pointer", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 10px 28px -12px rgba(0,0,0,.6)", position: "relative", transformStyle: "preserve-3d", willChange: "transform" },
      cardTop:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
      cardStripe:   { width: 26, height: 3, borderRadius: 3, margin: "13px 0 0 15px" },
      cardDel:      { border: "none", background: "transparent", color: "#5b6478", fontSize: 18, cursor: "pointer", padding: "6px 10px", lineHeight: 1 },
      cardTitle:    { fontWeight: 600, fontSize: 15, color: "#e0e0e0", marginTop: 11, lineHeight: 1.38, cursor: "pointer", position: "relative", zIndex: 1 },
      cardDesc:     { fontSize: 13, color: "#9aa4b6", marginTop: 5, lineHeight: 1.45, position: "relative", zIndex: 1 },
      cardMeta:     { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", position: "relative", zIndex: 1 },
      metaChip:     { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#9aa4b6", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, padding: "3px 9px", background: "rgba(255,255,255,.03)" },
      composer:     { background: "#141414", borderRadius: 14, padding: 13, boxShadow: "0 8px 28px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", gap: 8, border: "1px solid rgba(77,124,255,.3)" },
      input:        { border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#e0e0e0", width: "100%", boxSizing: "border-box", background: "#0d0d0d" },
      priorityPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
      prBtn:        { border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .12s" },
      composerRow:  { display: "flex", gap: 8, marginTop: 2 },
      btnPrimary:   { flex: 1, background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 18px rgba(77,124,255,.3)", transition: "transform .15s cubic-bezier(.2,.7,.3,1), box-shadow .2s, filter .2s" },
      btnGhost:     { background: "transparent", color: "#9aa4b6", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "transform .15s cubic-bezier(.2,.7,.3,1), border-color .2s, color .2s, background .2s" },
      empty:        { textAlign: "center", color: "#5b6478", fontSize: 12, padding: "26px 0", border: "1.5px dashed rgba(255,255,255,.08)", borderRadius: 12 },
      todayView:    { flex: 1, overflowY: "auto", padding: 26, position: "relative", zIndex: 1 },
      todayList:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 13 },
      todayEmpty:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: 380, margin: "48px auto", padding: "44px 32px", background: "#0d0d0d", border: "1px solid rgba(255,255,255,.08)", borderRadius: 18, color: "#9aa4b6" },
      overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(14px) saturate(1.1)", WebkitBackdropFilter: "blur(14px) saturate(1.1)" },
      modal:        { background: "linear-gradient(180deg, rgba(20,22,30,.86), rgba(13,14,20,.9))", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)", borderRadius: 20, width: "min(640px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 90px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08)", overflow: "hidden", border: "1px solid rgba(255,255,255,.12)" },
      modalHeader:  { display: "flex", alignItems: "center", gap: 12, padding: "20px 22px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", flexShrink: 0 },
      modalTitle:   { flex: 1, border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "#ffffff", fontFamily: "inherit", letterSpacing: "-0.01em", background: "transparent" },
      modalClose:   { border: "none", background: "transparent", color: "#8a93a6", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 2px" },
      modalBody:    { overflowY: "auto", padding: "16px 22px 24px", display: "flex", flexDirection: "column", gap: 4 },
      modalSection: { paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 4 },
      modalLabel:   { fontSize: 11, fontWeight: 700, color: "#8090a8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 },
      textarea:     { border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#e0e0e0", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 64, lineHeight: 1.5, background: "#0d0d0d" },
      checkItem:    { display: "flex", alignItems: "center", gap: 10, padding: "5px 0" },
      checkText:    { flex: 1, fontSize: 13, lineHeight: 1.4 },
      checkDel:     { border: "none", background: "transparent", color: "#5b6478", fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 },
      checkAdd:     { display: "flex", gap: 8, alignItems: "center" },      cursorDot:    { position: "fixed", top: 0, left: 0, fontSize: 13, lineHeight: 1, color: "#ffffff", textShadow: "0 0 6px rgba(220,235,255,1), 0 0 14px rgba(100,150,255,.9)", pointerEvents: "none", zIndex: 1001, transform: "translate(-50%, -50%)", userSelect: "none" },      blob1:        { position: "fixed", width: 700, height: 700, top: "-15%", left: "-10%", borderRadius: "50%", background: "radial-gradient(circle, rgba(40,80,200,.18) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 },
      blob2:        { position: "fixed", width: 600, height: 600, top: "30%", right: "-12%", borderRadius: "50%", background: "radial-gradient(circle, rgba(100,40,220,.14) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 },
      blob3:        { position: "fixed", width: 500, height: 500, bottom: "-5%", left: "35%", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,160,200,.10) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 },
      aiBtn:        { width: "100%", background: "linear-gradient(135deg, #4D7CFF, #7C3AFF)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(77,124,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
      aiPanel:      { marginTop: 12, background: "#0d0d0d", border: "1px solid rgba(77,124,255,.25)", borderRadius: 12, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, color: "#c0c0c0", whiteSpace: "pre-wrap" },
      docChip:      { display: "inline-flex", alignItems: "center", gap: 6, background: "#141414", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#c0c0c0" },
      docZone:      { border: "1.5px dashed rgba(255,255,255,.12)", borderRadius: 12, padding: "14px", textAlign: "center", color: "#8a93a6", fontSize: 12.5, cursor: "pointer", transition: "border-color .15s, color .15s" },
      checkboxAccent: "#4D7CFF",
      checkTextActive: "#e0e0e0",
      checkTextDone:   "#8a93a6",
    },
    css: `
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      button:focus-visible, [tabindex]:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid #6AA0FF; outline-offset: 2px; }
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
      .ys-card:hover { border-color: rgba(77,124,255,.4); box-shadow: 0 1px 2px rgba(0,0,0,.5), 0 18px 40px -16px rgba(40,80,220,.55); }
      .ys-pr-urgent { box-shadow: 0 0 10px rgba(255,68,68,.35); }
      .ys-nav-item { position: relative; }
      .ys-nav-item:hover { background: rgba(255,255,255,.05); color: #ffffff; }
      .ys-nav-item.ys-nav-active::before { content: ""; position: absolute; left: 4px; top: 50%; width: 3px; height: 0; border-radius: 3px; background: linear-gradient(#4D7CFF, #7C3AFF); box-shadow: 0 0 10px rgba(77,124,255,.7); transform: translateY(-50%); animation: ys-nav-ind .26s cubic-bezier(.2,.7,.3,1) forwards; }
      @keyframes ys-nav-ind { to { height: 58%; } }
      .ys-btn-primary:hover, .ys-ai-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
      .ys-btn-primary:active, .ys-ai-btn:active, .ys-btn-ghost:active { transform: scale(.97); }
      .ys-btn-ghost:hover { border-color: rgba(77,124,255,.4); color: #cdd6e6; background: rgba(77,124,255,.06); }
      .ys-btn-primary:focus-visible, .ys-btn-ghost:focus-visible, .ys-ai-btn:focus-visible, .ys-nav-item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(77,124,255,.45); }
      .ys-chip:hover { filter: brightness(1.12); }
      .ys-stat { position: relative; overflow: hidden; transition: transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .2s, border-color .2s; }
      .ys-stat::after { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--ys-accent, #4D7CFF), transparent); opacity: .8; }
      .ys-stat:hover { transform: translateY(-3px); box-shadow: 0 1px 2px rgba(0,0,0,.5), 0 16px 36px -14px rgba(40,80,220,.5); }
      .ys-num { font-variant-numeric: tabular-nums; }
      .ys-skel { position: relative; overflow: hidden; background: rgba(255,255,255,.05); border-radius: 10px; }
      .ys-skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.09), transparent); animation: ys-shimmer 1.3s infinite; }
      @keyframes ys-shimmer { 100% { transform: translateX(100%); } }
      .ys-toast { position: relative; overflow: hidden; }
      .ys-toast-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; transform-origin: left; pointer-events: none; border-radius: 0 0 11px 11px; animation: ys-toast-bar linear forwards; }
      @keyframes ys-toast-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      .ys-today-cell::after { content: ""; position: absolute; inset: -1px; border-radius: 11px; pointer-events: none; box-shadow: 0 0 0 1px var(--ys-accent, #4D7CFF), 0 0 16px -2px var(--ys-accent, #4D7CFF); opacity: .55; animation: ys-pulse 2.6s ease-in-out infinite; }
      @keyframes ys-pulse { 0%,100% { opacity: .35; } 50% { opacity: .8; } }
      .ys-modal { animation: ys-modal-in .26s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes ys-modal-in { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
      .ys-draw { stroke-dasharray: var(--len, 600); stroke-dashoffset: var(--len, 600); animation: ys-draw 1s cubic-bezier(.4,0,.2,1) forwards; }
      @keyframes ys-draw { to { stroke-dashoffset: 0; } }
      .ys-bar { animation: ys-bar-grow .5s cubic-bezier(.2,.7,.3,1) both; transform-origin: bottom; }
      @keyframes ys-bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes ys-donut-in { from { transform: scale(.86) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
      .ys-daybar:hover .ys-bar { filter: brightness(1.25); }
      @media (prefers-reduced-motion: reduce) {
        .ys-draw, .ys-bar, .ys-today-cell::after, .ys-nav-item.ys-nav-active::before, .ys-toast-bar, .ys-skel::after, .ys-modal, svg g { animation: none !important; }
        .ys-draw { stroke-dashoffset: 0 !important; }
        .ys-bar { transform: none !important; }
        .ys-nav-item.ys-nav-active::before { height: 56% !important; }
      }
      .ys-search:focus-within { border-color: rgba(77,124,255,.55) !important; box-shadow: 0 0 0 3px rgba(77,124,255,.12); }
      .ys-doc-zone:hover { border-color: rgba(77,124,255,.5); color: #4D7CFF; }
      .ys-ai-btn:hover { box-shadow: 0 6px 28px rgba(77,124,255,.55); }
      .ys-add:hover { background: rgba(77,124,255,.1); }
      ::-webkit-scrollbar { width: 9px; height: 9px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(77,124,255,.5); }
      ::-webkit-scrollbar-track { background: transparent; }
      .ys-calchip { transition: transform .12s, filter .12s; }
      .ys-calchip:hover { filter: brightness(1.15); transform: translateX(1px); }
      .ys-calcell:hover { background: rgba(128,128,128,.09) !important; }
      .ys-calcell:hover .ys-cal-add { opacity: 1 !important; }
      .ys-cal-add:hover { transform: scale(1.25); }
      .ys-fin-tab { transition: all .15s; }
      .ys-fin-row { transition: background .12s; border-radius: 8px; }
      .ys-fin-row:hover { background: rgba(128,128,128,.08); }
      .ys-fade-in { animation: ys-fade-in .28s ease both; }
      @keyframes ys-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .ys-toast { animation: ys-toast-in .22s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes ys-toast-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
      input::placeholder, textarea::placeholder { color: #6b7488; }
      input[type="date"] { color-scheme: dark; }
      select { color-scheme: dark; }
      @media (pointer: coarse) { .ys-cursor-dot { display: none !important; } }
      .ys-stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
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
        .ys-column { min-height: 80px !important; max-height: none !important; }
        .ys-cardlist { overflow: visible !important; }
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
      board:        { display: "grid", gridTemplateColumns: "repeat(3, minmax(310px, 1fr))", gap: 18, padding: 26, overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0, alignItems: "stretch", position: "relative", zIndex: 1 },
      column:       { background: "rgba(255,255,255,.025)", borderRadius: 18, padding: 14, minHeight: 0, maxHeight: "100%", transition: "background .15s, box-shadow .15s", border: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column" },
      columnOver:   { background: "rgba(198,242,77,.05)", border: "1px dashed rgba(198,242,77,.5)", boxShadow: "inset 0 0 0 1px rgba(198,242,77,.12)" },
      colHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "2px 4px" },
      colTitleWrap: { display: "flex", alignItems: "center", gap: 9 },
      colDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
      colTitle:     { fontWeight: 600, fontSize: 11.5, color: "#A6ACB6", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Geist Mono', monospace" },
      colCount:     { fontSize: 11.5, fontWeight: 600, color: "#8A9099", background: "rgba(255,255,255,.06)", borderRadius: 999, padding: "1px 8px", fontFamily: "'Geist Mono', monospace" },
      colAdd:       { width: 26, height: 26, borderRadius: 9, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#D9FF73", fontSize: 17, fontWeight: 600, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .14s" },
      cardList:     { display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 2 },
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
      btnPrimary:   { flex: 1, background: "linear-gradient(150deg, #D4FF5E, #B6EE3C)", color: "#0A0B0D", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 18px rgba(198,242,77,.28)", transition: "transform .15s cubic-bezier(.2,.7,.3,1), box-shadow .2s, filter .2s" },
      btnGhost:     { background: "transparent", color: "#8A9099", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "transform .15s cubic-bezier(.2,.7,.3,1), border-color .2s, color .2s, background .2s" },
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
      checkAdd:     { display: "flex", gap: 8, alignItems: "center" },      cursorDot:    { display: "none" },      blob1:        { display: "none" },
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
      * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      button:focus-visible, [tabindex]:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid #6AA0FF; outline-offset: 2px; }
      .ys-card:hover { box-shadow: 0 12px 30px rgba(0,0,0,.55), 0 0 0 1px rgba(198,242,77,.18) !important; transform: translateY(-2px); border-color: rgba(198,242,77,.32) !important; }
      .ys-card:active { transform: scale(0.985); }
      .ys-nav-item { position: relative; }
      .ys-nav-item:hover { background: rgba(255,255,255,.05); color: #EDEEF0; }
      .ys-nav-item.ys-nav-active::before { content: ""; position: absolute; left: 4px; top: 50%; width: 3px; height: 0; border-radius: 3px; background: #D4FF5E; box-shadow: 0 0 12px rgba(198,242,77,.8); transform: translateY(-50%); animation: ys-nav-ind .26s cubic-bezier(.2,.7,.3,1) forwards; }
      @keyframes ys-nav-ind { to { height: 56%; } }
      .ys-btn-primary:hover, .ys-ai-btn:hover { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 8px 26px rgba(198,242,77,.4); }
      .ys-btn-primary:active, .ys-ai-btn:active, .ys-btn-ghost:active { transform: scale(.97); }
      .ys-btn-ghost:hover { border-color: rgba(198,242,77,.4); color: #D9FF73; background: rgba(198,242,77,.06); }
      .ys-btn-primary:focus-visible, .ys-btn-ghost:focus-visible, .ys-ai-btn:focus-visible, .ys-nav-item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(198,242,77,.4); }
      .ys-chip:hover { filter: brightness(1.1); }
      .ys-stat { position: relative; overflow: hidden; transition: transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .2s, border-color .2s; }
      .ys-stat::after { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--ys-accent, #D4FF5E), transparent); opacity: .85; }
      .ys-stat:hover { transform: translateY(-3px); box-shadow: 0 14px 34px -14px rgba(198,242,77,.4); }
      .ys-num { font-variant-numeric: tabular-nums; }
      .ys-skel { position: relative; overflow: hidden; background: rgba(255,255,255,.05); border-radius: 12px; }
      .ys-skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.09), transparent); animation: ys-shimmer 1.3s infinite; }
      @keyframes ys-shimmer { 100% { transform: translateX(100%); } }
      .ys-toast { position: relative; overflow: hidden; }
      .ys-toast-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; transform-origin: left; pointer-events: none; border-radius: 0 0 11px 11px; animation: ys-toast-bar linear forwards; }
      @keyframes ys-toast-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      .ys-today-cell::after { content: ""; position: absolute; inset: -1px; border-radius: 11px; pointer-events: none; box-shadow: 0 0 0 1px var(--ys-accent, #D4FF5E), 0 0 16px -2px var(--ys-accent, #D4FF5E); opacity: .55; animation: ys-pulse 2.6s ease-in-out infinite; }
      @keyframes ys-pulse { 0%,100% { opacity: .35; } 50% { opacity: .8; } }
      .ys-modal { animation: ys-modal-in .26s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes ys-modal-in { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
      .ys-draw { stroke-dasharray: var(--len, 600); stroke-dashoffset: var(--len, 600); animation: ys-draw 1s cubic-bezier(.4,0,.2,1) forwards; }
      @keyframes ys-draw { to { stroke-dashoffset: 0; } }
      .ys-bar { animation: ys-bar-grow .5s cubic-bezier(.2,.7,.3,1) both; transform-origin: bottom; }
      @keyframes ys-bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes ys-donut-in { from { transform: scale(.86) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
      .ys-daybar:hover .ys-bar { filter: brightness(1.25); }
      @media (prefers-reduced-motion: reduce) {
        .ys-draw, .ys-bar, .ys-today-cell::after, .ys-nav-item.ys-nav-active::before, .ys-toast-bar, .ys-skel::after, .ys-modal, svg g { animation: none !important; }
        .ys-draw { stroke-dashoffset: 0 !important; }
        .ys-bar { transform: none !important; }
        .ys-nav-item.ys-nav-active::before { height: 56% !important; }
      }
      .ys-search:focus-within { border-color: rgba(198,242,77,.55) !important; box-shadow: 0 0 0 3px rgba(198,242,77,.12); }
      ::-webkit-scrollbar { width: 9px; height: 9px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(198,242,77,.45); }
      ::-webkit-scrollbar-track { background: transparent; }
      .ys-calchip { transition: transform .12s, filter .12s; }
      .ys-calchip:hover { filter: brightness(1.15); transform: translateX(1px); }
      .ys-calcell:hover { background: rgba(128,128,128,.09) !important; }
      .ys-calcell:hover .ys-cal-add { opacity: 1 !important; }
      .ys-cal-add:hover { transform: scale(1.25); }
      .ys-fin-tab { transition: all .15s; }
      .ys-fin-row { transition: background .12s; border-radius: 8px; }
      .ys-fin-row:hover { background: rgba(128,128,128,.08); }
      .ys-fade-in { animation: ys-fade-in .28s ease both; }
      @keyframes ys-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .ys-toast { animation: ys-toast-in .22s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes ys-toast-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
      input::placeholder, textarea::placeholder { color: #5B616D; }
      input[type="date"] { color-scheme: dark; }
      select { color-scheme: dark; }
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
        .ys-brand > div:first-child { box-shadow: 0 6px 22px rgba(198,242,77,.34); }
        .ys-h1 { text-shadow: 0 0 20px rgba(198,242,77,.12); }
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
        .ys-column { min-height: 80px !important; max-height: none !important; }
        .ys-cardlist { overflow: visible !important; }
        .ys-modal  { border-radius: 22px 22px 0 0 !important; width: 100vw !important; max-height: 92dvh !important; position: fixed !important; bottom: 0 !important; left: 0 !important; }
        .ys-overlay { align-items: flex-end !important; }
      }
    `,
  },

  // ── Light (Clarity) ───────────────────────────────────────────────────────
  light: {
    priorities: {
      urgent:    { label: "Срочно",  emoji: "🔴", color: "#C0392B", bg: "#FDEDEC" },
      important: { label: "Важно",   emoji: "🟡", color: "#B8860B", bg: "#FEF9E7" },
      normal:    { label: "Обычно",  emoji: "⚪", color: "#9B948A", bg: "#F4F3F0" },
    },
    st: {
      app:          { display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "radial-gradient(110% 80% at 12% -8%, #F4F6FB 0%, transparent 55%), radial-gradient(90% 70% at 95% 0%, #FAF5EF 0%, transparent 50%), radial-gradient(80% 90% at 80% 110%, #F1F4F9 0%, transparent 60%), #FBFBFA", color: "#37352F", overflow: "hidden" },
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
      board:        { display: "grid", gridTemplateColumns: "repeat(3, minmax(300px, 1fr))", gap: 18, padding: 26, overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0, alignItems: "stretch" },
      column:       { background: "#F4F3F1", borderRadius: 12, padding: 13, minHeight: 0, maxHeight: "100%", transition: "background .15s, box-shadow .15s", border: "1px solid transparent", display: "flex", flexDirection: "column" },
      columnOver:   { background: "#EAF1FA", border: "1px dashed #1B4F8A", boxShadow: "inset 0 0 0 1px rgba(27,79,138,.08)" },
      colHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "2px 4px" },
      colTitleWrap: { display: "flex", alignItems: "center", gap: 9 },
      colDot:       { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
      colTitle:     { fontWeight: 600, fontSize: 13.5, color: "#57534C", letterSpacing: "-0.01em" },
      colCount:     { fontSize: 12, fontWeight: 600, color: "#9B948A", background: "rgba(0,0,0,.05)", borderRadius: 20, padding: "1px 8px" },
      colAdd:       { width: 26, height: 26, borderRadius: 7, border: "1px solid #E5E2DB", background: "#fff", color: "#1B4F8A", fontSize: 18, fontWeight: 600, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" },
      cardList:     { display: "flex", flexDirection: "column", gap: 9, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingRight: 2 },
      card:         { background: "#fff", borderRadius: 10, padding: "13px 14px 12px", boxShadow: "0 1px 2px rgba(15,15,15,.05), 0 4px 12px -6px rgba(15,15,15,.08)", cursor: "pointer", border: "1px solid #ECEAE4", transition: "box-shadow .18s cubic-bezier(.2,.7,.3,1), transform .18s cubic-bezier(.2,.7,.3,1), border-color .18s", position: "relative" },
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
      btnPrimary:   { flex: 1, background: "linear-gradient(135deg, #2360A4, #1B4F8A)", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px -2px rgba(27,79,138,.4)", transition: "transform .15s cubic-bezier(.2,.7,.3,1), box-shadow .2s, filter .2s" },
      btnGhost:     { background: "#fff", color: "#787066", border: "1px solid #E5E2DB", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "transform .15s cubic-bezier(.2,.7,.3,1), border-color .2s, color .2s, background .2s" },
      empty:        { textAlign: "center", color: "#B0A99D", fontSize: 12.5, padding: "24px 0", border: "1.5px dashed #E0DCD3", borderRadius: 9 },
      todayView:    { flex: 1, overflowY: "auto", padding: 26 },
      todayList:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 },
      todayEmpty:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", color: "#787066" },
      overlay:      { position: "fixed", inset: 0, background: "rgba(40,42,48,.32)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(6px) saturate(1.05)", WebkitBackdropFilter: "blur(6px) saturate(1.05)" },
      modal:        { background: "#fff", borderRadius: 16, width: "min(620px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 70px rgba(15,15,15,.24), 0 2px 6px rgba(15,15,15,.06)", overflow: "hidden", border: "1px solid #ECEAE4" },
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
      checkAdd:     { display: "flex", gap: 8, alignItems: "center" },      cursorDot:    { display: "none" },      blob1:        { display: "none" },
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
      * { box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      button:focus-visible, [tabindex]:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid #6AA0FF; outline-offset: 2px; }
      .ys-card:hover { box-shadow: 0 1px 2px rgba(15,15,15,.05), 0 10px 24px -10px rgba(27,79,138,.22) !important; transform: translateY(-2px); border-color: #D2DCEA !important; }
      .ys-card:active { transform: scale(0.98); }
      .ys-nav-item { position: relative; }
      .ys-nav-item:hover { background: #EFEDE8; color: #37352F; }
      .ys-nav-item.ys-nav-active::before { content: ""; position: absolute; left: 3px; top: 50%; width: 3px; height: 0; border-radius: 3px; background: #1B4F8A; transform: translateY(-50%); animation: ys-nav-ind .26s cubic-bezier(.2,.7,.3,1) forwards; }
      @keyframes ys-nav-ind { to { height: 54%; } }
      .ys-btn-primary:hover, .ys-ai-btn:hover { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 6px 18px -6px rgba(27,79,138,.5); }
      .ys-btn-primary:active, .ys-ai-btn:active, .ys-btn-ghost:active { transform: scale(.97); }
      .ys-btn-ghost:hover { border-color: #C3D0E2; color: #1B4F8A; background: #F2F6FB; }
      .ys-btn-primary:focus-visible, .ys-btn-ghost:focus-visible, .ys-ai-btn:focus-visible, .ys-nav-item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(27,79,138,.28); }
      .ys-chip:hover { filter: brightness(.97); }
      .ys-stat { position: relative; overflow: hidden; transition: transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .2s, border-color .2s; }
      .ys-stat::after { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--ys-accent, #1B4F8A), transparent); opacity: .7; }
      .ys-stat:hover { transform: translateY(-3px); box-shadow: 0 1px 2px rgba(15,15,15,.05), 0 14px 30px -12px rgba(27,79,138,.28); }
      .ys-num { font-variant-numeric: tabular-nums; }
      .ys-skel { position: relative; overflow: hidden; background: #ECEAE4; border-radius: 9px; }
      .ys-skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent); animation: ys-shimmer 1.3s infinite; }
      @keyframes ys-shimmer { 100% { transform: translateX(100%); } }
      .ys-toast { position: relative; overflow: hidden; }
      .ys-toast-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; transform-origin: left; pointer-events: none; border-radius: 0 0 11px 11px; animation: ys-toast-bar linear forwards; }
      @keyframes ys-toast-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      .ys-today-cell::after { content: ""; position: absolute; inset: -1px; border-radius: 11px; pointer-events: none; box-shadow: 0 0 0 1px var(--ys-accent, #1B4F8A), 0 0 14px -4px var(--ys-accent, #1B4F8A); opacity: .4; animation: ys-pulse 2.8s ease-in-out infinite; }
      @keyframes ys-pulse { 0%,100% { opacity: .25; } 50% { opacity: .6; } }
      .ys-modal { animation: ys-modal-in .26s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes ys-modal-in { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
      .ys-draw { stroke-dasharray: var(--len, 600); stroke-dashoffset: var(--len, 600); animation: ys-draw 1s cubic-bezier(.4,0,.2,1) forwards; }
      @keyframes ys-draw { to { stroke-dashoffset: 0; } }
      .ys-bar { animation: ys-bar-grow .5s cubic-bezier(.2,.7,.3,1) both; transform-origin: bottom; }
      @keyframes ys-bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes ys-donut-in { from { transform: scale(.86) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
      .ys-daybar:hover .ys-bar { filter: brightness(1.25); }
      @media (prefers-reduced-motion: reduce) {
        .ys-draw, .ys-bar, .ys-today-cell::after, .ys-nav-item.ys-nav-active::before, .ys-toast-bar, .ys-skel::after, .ys-modal, svg g { animation: none !important; }
        .ys-draw { stroke-dashoffset: 0 !important; }
        .ys-bar { transform: none !important; }
        .ys-nav-item.ys-nav-active::before { height: 56% !important; }
      }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: #DAD7CF; border-radius: 5px; }
      ::-webkit-scrollbar-thumb:hover { background: #C4C0B6; }
      ::-webkit-scrollbar-track { background: transparent; }
      .ys-calchip { transition: transform .12s, filter .12s; }
      .ys-calchip:hover { filter: brightness(1.15); transform: translateX(1px); }
      .ys-calcell:hover { background: rgba(128,128,128,.09) !important; }
      .ys-calcell:hover .ys-cal-add { opacity: 1 !important; }
      .ys-cal-add:hover { transform: scale(1.25); }
      .ys-fin-tab { transition: all .15s; }
      .ys-fin-row { transition: background .12s; border-radius: 8px; }
      .ys-fin-row:hover { background: rgba(128,128,128,.08); }
      .ys-fade-in { animation: ys-fade-in .28s ease both; }
      @keyframes ys-fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .ys-toast { animation: ys-toast-in .22s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes ys-toast-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
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
        .ys-column { min-height: 80px !important; max-height: none !important; }
        .ys-cardlist { overflow: visible !important; }
        .ys-modal  { border-radius: 14px 14px 0 0 !important; width: 100vw !important; max-height: 92dvh !important; position: fixed !important; bottom: 0 !important; left: 0 !important; }
        .ys-overlay { align-items: flex-end !important; }
      }
    `,
  },
};

const THEME_DOTS = [
  { key: "cosmos", color: "#4D7CFF", label: "Космос" },
  { key: "signal", color: "#D4FF5E", label: "Сигнал" },
  { key: "light",  color: "#C4C0B6", label: "Clarity" },
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
  const [tagInput,       setTagInput]       = useState("");
  const [paletteOpen,    setPaletteOpen]    = useState(false);
  const [palQ,           setPalQ]           = useState("");
  const [palIdx,         setPalIdx]         = useState(0);
  const [newCheckItem,   setNewCheckItem]   = useState("");
  const [aiLoading,      setAiLoading]      = useState(null);
  const [budgetData,     setBudgetData]     = useState(null);
  const [budgetLoading,  setBudgetLoading]  = useState(false);
  const [finModal,       setFinModal]       = useState(null);   // 'expense' | 'piggybank' | {type:'pay',index,name,budgeted}
  const [finForm,        setFinForm]        = useState({});
  const [finBusy,        setFinBusy]        = useState(false);
  const [finError,       setFinError]       = useState("");
  const [finTab,         setFinTab]         = useState("personal");   // 'personal' | 'corporate'
  const [aiAnalysis,     setAiAnalysis]     = useState(null);
  const [aiBudgetLoading,setAiBudgetLoading]= useState(false);
  const [aiBudgetError,  setAiBudgetError]  = useState("");
  const [calMonth,       setCalMonth]       = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [priorityFilter, setPriorityFilter] = useState("all");   // all | urgent | important | normal
  const [calDragId,      setCalDragId]      = useState(null);     // task id being dragged over calendar
  const [calOverDay,     setCalOverDay]     = useState(null);     // ISO of day cell hovered during DnD
  const [finSearch,      setFinSearch]      = useState("");       // expense search query
  const [calMode,        setCalMode]        = useState(() => localStorage.getItem("ys-cal-mode") || "month"); // 'month' | 'week'
  const [calWeekStart,   setCalWeekStart]   = useState(() => { const n = new Date(); const off = (n.getDay() + 6) % 7; return iso(new Date(n.getFullYear(), n.getMonth(), n.getDate() - off)); });
  const [calBacklogOver, setCalBacklogOver] = useState(false);    // backlog drop-target highlight
  const [boardSort,      setBoardSort]      = useState(() => localStorage.getItem("ys-board-sort") || "manual"); // manual | priority | due
  const [doneCollapsed,  setDoneCollapsed]  = useState(() => localStorage.getItem("ys-done-collapsed") === "1");
  const [toasts,         setToasts]         = useState([]);       // {id,msg,type,action?}
  const toastTimers   = useRef({});
  const searchRef     = useRef(null);
  const wasDragging   = useRef(false);
  const saveTimer     = useRef(null);
  const isInitialLoad = useRef(true);
  const loadFailed    = useRef(false);
  const touchState    = useRef({ id: null, moved: false, ghost: null, el: null, offset: { x: 0, y: 0 }, startX: 0, startY: 0, rect: null });
  const mainRef       = useRef(null);
  const cursorDot     = useRef(null);  const starsCanvas      = useRef(null);
  const trailCanvas      = useRef(null);  const constellationRef = useRef(null);
  const draggingRef      = useRef(false);
  const portalBurstRef   = useRef(null);

  useEffect(() => { draggingRef.current = dragId !== null; }, [dragId]);

  const switchTheme = (key) => {
    setThemeName(key);
    localStorage.setItem("ys-theme", key);
  };

  // ── Persisted UI prefs ──
  useEffect(() => { localStorage.setItem("ys-cal-mode", calMode); }, [calMode]);
  useEffect(() => { localStorage.setItem("ys-board-sort", boardSort); }, [boardSort]);
  useEffect(() => { localStorage.setItem("ys-done-collapsed", doneCollapsed ? "1" : "0"); }, [doneCollapsed]);

  const PRIORITY_RANK = { urgent: 0, important: 1, normal: 2 };
  const sortCards = (list) => {
    if (boardSort === "manual") return list;
    const arr = list.slice();
    if (boardSort === "priority") {
      arr.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2));
    } else if (boardSort === "due") {
      arr.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return a.due.localeCompare(b.due);
      });
    }
    return arr;
  };

  // ── Тосты ──
  const dismissToast = (id) => {
    clearTimeout(toastTimers.current[id]); delete toastTimers.current[id];
    setToasts((ts) => ts.filter((t) => t.id !== id));
  };
  const toast = (msg, type = "info", opts = {}) => {
    const id = Date.now() + Math.random();
    const ttl = opts.ttl != null ? opts.ttl : 2500;
    setToasts((ts) => [...ts, { id, msg, type, action: opts.action, actionLabel: opts.actionLabel, ttl }]);
    toastTimers.current[id] = setTimeout(() => dismissToast(id), ttl);
    return id;
  };
  useEffect(() => () => { Object.values(toastTimers.current).forEach(clearTimeout); }, []);

  // Загрузка
  useEffect(() => {
    const onLoadFail = () => { loadFailed.current = true; setCards(SEED); setLoading(false); toast("Не удалось загрузить задачи — изменения не сохраняются. Обнови страницу.", "error", { ttl: 7000 }); };
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) { onLoadFail(); return; }   // 500/ошибка отдаёт объект — не затираем прод сидом
        setCards(data.length > 0 ? data : SEED); setLoading(false);
      })
      .catch(onLoadFail);
  }, []);

  // Автосохранение
  useEffect(() => {
    if (loading) return;
    if (loadFailed.current) return;   // загрузка провалилась — не перезаписываем серверные данные
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    const snapshot = cards;
    saveTimer.current = setTimeout(() => {
      fetch("/api/cards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot) })
        .then((r) => { setSaveStatus(r.ok ? "saved" : "error"); if (!r.ok) toast("Не удалось сохранить задачи", "error"); })
        .catch(() => { setSaveStatus("error"); toast("Не удалось сохранить задачи", "error"); });
    }, 150);
  }, [cards, loading]);

  const loadBudget = () => {
    setBudgetLoading(true);
    fetch("/api/budget")
      .then((r) => r.json())
      .then((d) => { setBudgetData(d); setBudgetLoading(false); })
      .catch(() => setBudgetLoading(false));
  };
  useEffect(() => { if (view === "finance" || view === "today") loadBudget(); }, [view]);

  const budgetAction = async (path, body, method = "POST") => {
    setFinBusy(true); setFinError("");
    try {
      const r = await fetch("/api/budget" + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await r.json();
      if (!r.ok) { const msg = d.error || "Ошибка"; setFinError(msg); setFinBusy(false); toast("Ошибка: " + finErrText(msg), "error"); if (msg === "stale") { loadBudget(); closeFin(); } return false; }
      setBudgetData(d); setFinBusy(false); return true;
    } catch {
      setFinError("Сеть недоступна"); setFinBusy(false); toast("Сеть недоступна", "error"); return false;
    }
  };
  const closeFin = () => { setFinModal(null); setFinForm({}); setFinError(""); };
  const parseMoney = (v) => parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(",", "."));
  const finErrText = (msg) => ({ insufficient: "В копилке недостаточно средств", bad_amount: "Неверная сумма", bad_name: "Введите название", duplicate_name: "Такой обязательный уже есть", already_paid: "Сначала откатите оплату", not_configured: "Бюджет не настроен", bad_index: "Запись не найдена — обнови страницу", stale: "Запись изменилась — обновляю…" }[msg] || msg);
  const fmtRu = (iso) => { if (!iso) return ""; const parts = String(iso).split("-"); if (parts.length < 3) return iso; const [y, m, d] = parts; return `${d}.${m}.${y.slice(2)}`; };
  // итоговая категория из формы (учитывает «Своя…»)
  const resolveCategory = () => {
    if (finForm.category === "__custom__") return (finForm.customCategory || "").trim();
    return (finForm.category || "").trim();
  };
  const submitExpense = async () => {
    const amount = parseMoney(finForm.amount);
    if (!amount || amount <= 0) { setFinError("Введите сумму"); return; }
    const category = resolveCategory();
    if (!category) { setFinError("Укажите категорию"); return; }
    const path = finForm.kind === "corp" ? "/corporate" : "/expense";
    if (await budgetAction(path, { amount, category, note: (finForm.note || "").trim() })) { toast("Расход добавлен", "success"); closeFin(); }
  };
  const submitEditExpense = async () => {
    const amount = parseMoney(finForm.amount);
    if (!amount || amount <= 0) { setFinError("Введите сумму"); return; }
    const category = resolveCategory();
    if (!category) { setFinError("Укажите категорию"); return; }
    const base = finForm.kind === "corp" ? "/corporate/" : "/expense/";
    if (await budgetAction(base + finForm.id, { date: finForm.date || undefined, amount, category, note: (finForm.note || "").trim() }, "PATCH")) { toast("Расход изменён", "success"); closeFin(); }
  };
  const deleteExpense = async () => {
    if (!window.confirm("Удалить этот расход?")) return;
    const base = finForm.kind === "corp" ? "/corporate/" : "/expense/";
    if (await budgetAction(base + finForm.id, null, "DELETE")) { toast("Расход удалён", "success"); closeFin(); }
  };
  const submitCompensate = async () => {
    const raw = finForm.amount;
    const amount = raw === "" || raw == null ? undefined : parseMoney(raw);
    if (raw !== "" && raw != null && (!amount || amount <= 0)) { setFinError("Введите сумму"); return; }
    if (await budgetAction("/corporate/compensate", { id: finForm.id, amount }, "POST")) { toast("Компенсация учтена", "success"); closeFin(); }
  };
  const unpayMandatory = (index) => budgetAction("/mandatory/unpay", { index });
  const submitMandatory = async () => {
    const name = (finForm.name || "").trim();
    if (!name) { setFinError("Введите название"); return; }
    const amount = parseMoney(finForm.amount);
    if (!(amount > 0)) { setFinError("Введите сумму"); return; }
    if (await budgetAction("/mandatory", { name, amount })) { toast("Обязательный добавлен", "success"); closeFin(); }
  };
  const deleteMandatory = async (index, name) => {
    if (!window.confirm(`Удалить обязательный «${name}»?`)) return;
    if (await budgetAction("/mandatory/" + index, null, "DELETE")) toast("Обязательный удалён", "success");
  };
  const runBudgetAnalysis = async () => {
    setAiBudgetLoading(true); setAiBudgetError(""); setAiAnalysis(null);
    try {
      const r = await fetch("/api/budget/analyze", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (r.status === 503) { setAiBudgetError("AI-анализ появится после добавления ключа ANTHROPIC_API_KEY на сервере"); setAiBudgetLoading(false); return; }
      if (!r.ok) { setAiBudgetError("Не удалось получить анализ"); setAiBudgetLoading(false); return; }
      const d = await r.json();
      setAiAnalysis(d.analysis || ""); setAiBudgetLoading(false);
    } catch {
      setAiBudgetError("Не удалось получить анализ"); setAiBudgetLoading(false);
    }
  };
  const submitPiggy = async () => {
    const amount = parseMoney(finForm.amount);
    if (!(amount >= 0)) { setFinError("Введите сумму"); return; }
    if (await budgetAction("/piggybank", { action: finForm.action || "add", amount })) { toast(finForm.action === "withdraw" ? "Снято из копилки" : "Копилка пополнена", "success"); closeFin(); }
  };
  const submitPay = async () => {
    const raw = finForm.actual;
    const actual = raw === "" || raw == null ? null : parseMoney(raw);
    if (await budgetAction("/mandatory/pay", { index: finModal.index, actual })) { toast("Обязательный платёж оплачен", "success"); closeFin(); }
  };
  const undoLastExpense = () => budgetAction("/expense/last", null, "DELETE");

  useEffect(() => {
    const onUnload = () => {
      if (!loading && !isInitialLoad.current && !loadFailed.current) {
        const blob = new Blob([JSON.stringify(cards)], { type: "application/json" });
        navigator.sendBeacon("/api/cards", blob);
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [cards, loading]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setPaletteOpen((o) => { if (!o) { setPalQ(""); setPalIdx(0); } return !o; }); return; }
      if (e.key === "Escape") { setPaletteOpen(false); setSelectedCardId(null); setFinModal(null); return; }
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current && searchRef.current.focus(); }
      else if (e.key === "n") { e.preventDefault(); setView("board"); setAdding(COLUMNS[0].id); setDraft({ title: "", desc: "", due: "", priority: "normal" }); }
      else if (e.key === "1") setView("board");
      else if (e.key === "2") setView("calendar");
      else if (e.key === "3") setView("finance");
      else if (e.key === "t") setView("today");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { setNewCheckItem(""); setTagInput(""); }, [selectedCardId]);

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

  // Кастомный курсор — только Cosmos (точка + glow-параллакс под мышью)
  useEffect(() => {
    if (themeName !== "cosmos") return;
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = cursorDot.current;
    const onMove = (e) => {
      if (dot) dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      const main = mainRef.current;
      if (main) { const r = main.getBoundingClientRect(); main.style.setProperty("--mx", (e.clientX - r.left) + "px"); main.style.setProperty("--my", (e.clientY - r.top) + "px"); }
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); };
  }, [themeName]);

  // Звёздное поле с параллаксом — только Cosmos
  useEffect(() => {
    if (themeName !== "cosmos") return;
    const canvas = starsCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 3 слоя глубины: дальние (0.15), средние (0.45), ближние (1.0)
    const stars = Array.from({ length: 240 }, () => {
      const depth = [0.12, 0.45, 1.0][Math.floor(Math.random() * 3)];
      return {
        x: Math.random(),
        y: Math.random(),
        r: depth < 0.2 ? Math.random() * 0.6 + 0.1 : depth < 0.5 ? Math.random() * 0.9 + 0.2 : Math.random() * 1.3 + 0.4,
        base: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.006 + 0.002,
        phase: Math.random() * Math.PI * 2,
        big: depth === 1.0 && Math.random() < 0.10,
        depth,
      };
    });

    const nebulae = [
      { x: 0.72, y: 0.18, rx: 0.28, ry: 0.22, r: 70,  g: 30, b: 180, a: 0.06 },
      { x: 0.18, y: 0.62, rx: 0.22, ry: 0.30, r: 30,  g: 60, b: 200, a: 0.05 },
      { x: 0.55, y: 0.75, rx: 0.20, ry: 0.18, r: 100, g: 20, b: 160, a: 0.04 },
    ];

    // плавное отслеживание мыши (lerp)
    let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    const onMove = (e) => { tx = e.clientX / window.innerWidth; ty = e.clientY / window.innerHeight; };
    window.addEventListener("mousemove", onMove);

    const meteors = [];
    let nextMeteor = 120 + Math.random() * 180;
    let raf, t = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    const draw = () => {
      t += 0.012;
      // плавный lerp к позиции мыши
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      const offX = (mx - 0.5) * 60; // макс смещение ближних ±30px
      const offY = (my - 0.5) * 40;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // туманности (без параллакса — они далеко)
      nebulae.forEach(n => {
        const grd = ctx.createRadialGradient(
          n.x * canvas.width, n.y * canvas.height, 0,
          n.x * canvas.width, n.y * canvas.height,
          Math.max(canvas.width * n.rx, canvas.height * n.ry)
        );
        grd.addColorStop(0, `rgba(${n.r},${n.g},${n.b},${n.a})`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // метеоры
      nextMeteor--;
      if (nextMeteor <= 0) {
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35;
        const speed = 9 + Math.random() * 8;
        meteors.push({
          x:       canvas.width * (0.3 + Math.random() * 0.8),
          y:       -10,
          vx:     -Math.cos(angle) * speed,
          vy:      Math.sin(angle) * speed,
          trail:   90 + Math.random() * 90,
          opacity: 0,
          maxOp:   0.6 + Math.random() * 0.35,
          speed,
        });
        nextMeteor = 200 + Math.random() * 260;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx; m.y += m.vy;
        m.opacity = Math.min(m.maxOp, m.opacity + 0.07);
        if (m.x < -150 || m.y > canvas.height + 50) { meteors.splice(i, 1); continue; }

        const tailX = m.x - m.vx / m.speed * m.trail;
        const tailY = m.y - m.vy / m.speed * m.trail;
        const grd = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grd.addColorStop(0,   "rgba(255,255,255,0)");
        grd.addColorStop(0.6, `rgba(210,230,255,${m.opacity * 0.4})`);
        grd.addColorStop(1,   `rgba(255,255,255,${m.opacity})`);
        ctx.save();
        ctx.strokeStyle = grd;
        ctx.lineWidth   = 1.4;
        ctx.shadowColor = "rgba(180,215,255,0.7)";
        ctx.shadowBlur  = 6;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(m.x, m.y); ctx.stroke();
        // голова-точка
        const hGrd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 3.5);
        hGrd.addColorStop(0, `rgba(255,255,255,${m.opacity})`);
        hGrd.addColorStop(1, "rgba(200,225,255,0)");
        ctx.fillStyle = hGrd;
        ctx.beginPath(); ctx.arc(m.x, m.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // созвездие при клике — плавно угасает
      const cp = constellationRef.current;
      if (cp) {
        cp.opacity -= 0.003; // ~5 секунд затухания
        if (cp.opacity <= 0) constellationRef.current = null;
      }

      // звёзды с параллаксом по слоям
      stars.forEach(s => {
        const twinkle = s.base + 0.3 * Math.sin(t * s.speed * 60 + s.phase);
        const radius  = s.big ? s.r * 2.2 : s.r;
        const sx = s.x * canvas.width  + offX * s.depth;
        const sy = s.y * canvas.height + offY * s.depth;

        // линии созвездия к точке клика
        if (cp && cp.opacity > 0) {
          const dist = Math.hypot(sx - cp.x, sy - cp.y);
          if (dist < 280) {
            const a = (1 - dist / 280) * 0.7 * cp.opacity;
            const grd = ctx.createLinearGradient(sx, sy, cp.x, cp.y);
            grd.addColorStop(0,   `rgba(160,215,255,${a})`);
            grd.addColorStop(0.6, `rgba(160,215,255,${a * 0.4})`);
            grd.addColorStop(1,   `rgba(160,215,255,0)`);
            ctx.save();
            ctx.strokeStyle = grd;
            ctx.lineWidth   = 0.8;
            ctx.setLineDash([3, 6]);
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cp.x, cp.y); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }
        }

        if (s.big) {
          const spikeLen  = radius * 18;
          const spikeLen2 = radius * 9;   // диагональные короче
          const spikes = [
            { a: 0,            l: spikeLen  },
            { a: Math.PI,      l: spikeLen  },
            { a: Math.PI/2,    l: spikeLen  },
            { a: -Math.PI/2,   l: spikeLen  },
            { a: Math.PI/4,    l: spikeLen2 },
            { a: -Math.PI/4,   l: spikeLen2 },
            { a: Math.PI*3/4,  l: spikeLen2 },
            { a: -Math.PI*3/4, l: spikeLen2 },
          ];
          spikes.forEach(({ a, l }) => {
            const ex = sx + Math.cos(a) * l;
            const ey = sy + Math.sin(a) * l;
            const grd = ctx.createLinearGradient(sx, sy, ex, ey);
            grd.addColorStop(0,   `rgba(255,255,255,${twinkle * 0.9})`);
            grd.addColorStop(0.3, `rgba(200,220,255,${twinkle * 0.4})`);
            grd.addColorStop(1,   `rgba(180,210,255,0)`);
            ctx.save();
            ctx.strokeStyle = grd;
            ctx.lineWidth   = 0.7;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.restore();
          });
          // центральное свечение
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 4);
          glow.addColorStop(0,   `rgba(255,255,255,${twinkle})`);
          glow.addColorStop(0.4, `rgba(200,225,255,${twinkle * 0.5})`);
          glow.addColorStop(1,   `rgba(150,190,255,0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,230,255,${twinkle})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [themeName]);

  // Хвост частиц + рябь при клике — только Cosmos
  useEffect(() => {
    if (themeName !== "cosmos") return;
    const canvas = trailCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = [];
    const ripples   = [];
    let raf;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    const onMove = (e) => {
      // обычный хвост
      particles.push({
        x: e.clientX, y: e.clientY,
        opacity: 0.75,
        size: 7 + Math.random() * 7,
        decay: 0.035 + Math.random() * 0.025,
        angle: Math.random() * Math.PI * 2,
      });
      // при drag — дополнительная пыль
      if (draggingRef.current) {
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: e.clientX + (Math.random() - 0.5) * 30,
            y: e.clientY + (Math.random() - 0.5) * 30,
            opacity: 0.55,
            size: 3 + Math.random() * 5,
            decay: 0.055 + Math.random() * 0.03,
            angle: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const onClick = (e) => {
      // созвездие — точка клика
      constellationRef.current = { x: e.clientX, y: e.clientY, opacity: 1.0 };
      // маленькая рябь
      ripples.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 70, opacity: 0.55, speed: 2.8, decay: 0.02 });
      ripples.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 110, opacity: 0.28, speed: 2.0, decay: 0.012, delay: 8 });
      // пара звёздочек
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i;
        const spd = 1.4 + Math.random() * 1.8;
        particles.push({ x: e.clientX, y: e.clientY, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, opacity: 0.75, size: 5 + Math.random() * 4, decay: 0.032 + Math.random() * 0.02, angle, burst: true });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // портал при открытии карточки
      if (portalBurstRef.current) {
        const { x, y } = portalBurstRef.current;
        portalBurstRef.current = null;
        // 24 частицы во все стороны
        for (let i = 0; i < 24; i++) {
          const angle = (Math.PI * 2 / 24) * i + Math.random() * 0.3;
          const spd   = 2.5 + Math.random() * 4.5;
          particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, opacity: 0.95, size: 4 + Math.random() * 9, decay: 0.012 + Math.random() * 0.018, angle, burst: true });
        }
        // 3 кольца разной скорости
        ripples.push({ x, y, radius: 0, maxRadius: 110, opacity: 0.9,  speed: 4.5, decay: 0.022 });
        ripples.push({ x, y, radius: 0, maxRadius: 190, opacity: 0.55, speed: 3.2, decay: 0.013, delay: 10 });
        ripples.push({ x, y, radius: 0, maxRadius: 280, opacity: 0.28, speed: 2.4, decay: 0.008, delay: 22 });
      }

      // рябь
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        if (r.delay) { r.delay--; continue; }
        r.radius  += r.speed;
        r.opacity -= r.decay;
        if (r.opacity <= 0 || r.radius > r.maxRadius) { ripples.splice(i, 1); continue; }
        const progress = r.radius / r.maxRadius;
        ctx.save();
        ctx.globalAlpha = r.opacity * (1 - progress * 0.5);
        ctx.strokeStyle = `rgba(160,210,255,1)`;
        ctx.lineWidth   = 1.2 * (1 - progress * 0.7);
        ctx.shadowColor = "rgba(100,180,255,0.6)";
        ctx.shadowBlur  = 8;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // хвост и взрывные частицы
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.opacity -= p.decay;
        p.size    *= 0.97;
        if (p.burst) { p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; }
        if (p.opacity <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(140,190,255,0.9)";
        ctx.shadowBlur  = 10;
        ctx.fillStyle   = "#ffffff";
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillText("✦", 0, 0);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    let lastDrag = 0;
    const onDragOver = (e) => {
      if (!draggingRef.current) return;
      const now = Date.now();
      if (now - lastDrag < 40) return; // ~25 раз/сек
      lastDrag = now;
      particles.push({
        x: e.clientX + (Math.random() - 0.5) * 22,
        y: e.clientY + (Math.random() - 0.5) * 22,
        opacity: 0.65, size: 4 + Math.random() * 5,
        decay: 0.045 + Math.random() * 0.025,
        angle: Math.random() * Math.PI * 2,
      });
    };

    resize();
    window.addEventListener("resize",    resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("click",     onClick);
    window.addEventListener("dragover",  onDragOver);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click",     onClick);
      window.removeEventListener("dragover",  onDragOver);
    };
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
  const shiftDue = (due, repeat) => { const base = due ? new Date(due + "T00:00:00") : new Date(TODAY + "T00:00:00"); if (repeat === "daily") base.setDate(base.getDate() + 1); else if (repeat === "weekly") base.setDate(base.getDate() + 7); else if (repeat === "monthly") base.setMonth(base.getMonth() + 1); return iso(base); };
  const setStatus = (id, status) => {
    const card = cards.find((c) => c.id === id);
    if (card && status === "done" && card.status !== "done" && card.repeat && card.repeat !== "none") {
      const newId = Math.max(0, ...cards.map((c) => c.id)) + 1;
      const nd = shiftDue(card.due, card.repeat);
      const clone = { ...card, id: newId, status: "todo", due: nd, checklist: (card.checklist || []).map((i) => ({ ...i, done: false })), ai: undefined };
      setCards((cs) => [...cs.map((c) => (c.id === id ? { ...c, status } : c)), clone]);
      toast(`Повтор создан: ${card.title} → ${fmtRu(nd)}`, "success");
    } else updateCard(id, { status });
  };
  const addTag = (id, tags, raw) => { const t = String(raw || "").trim().replace(/^#/, "").toLowerCase().slice(0, 24); if (!t) return; if ((tags || []).includes(t)) { setTagInput(""); return; } updateCard(id, { tags: [...(tags || []), t] }); setTagInput(""); };
  const removeTag = (id, tags, t) => updateCard(id, { tags: (tags || []).filter((x) => x !== t) });
  const onDrop = (status) => { if (dragId != null) setStatus(dragId, status); setDragId(null); setOverCol(null); };

  const addCard = (status) => {
    if (!draft.title.trim()) return;
    const newId = Math.max(0, ...cards.map((c) => c.id)) + 1;
    setCards((cs) => [...cs, { id: newId, title: draft.title, desc: draft.desc, status, due: draft.due, docs: 0, priority: draft.priority, notes: "", checklist: [] }]);
    setDraft({ title: "", desc: "", due: "", priority: "normal" });
    setAdding(null);
  };

  // Быстрое добавление задачи на конкретный день (календарь) — возвращает id
  const addQuickCard = (day) => {
    const newId = Math.max(0, ...cards.map((c) => c.id)) + 1;
    setCards((cs) => [...cs, { id: newId, title: "Новая задача", desc: "", status: "todo", due: day, docs: 0, priority: "normal", notes: "", checklist: [] }]);
    return newId;
  };

  const removeCard = (id) => {
    const card = cards.find((c) => c.id === id);
    if (selectedCardId === id) setSelectedCardId(null);
    setCards((cs) => cs.filter((c) => c.id !== id));
    if (card) {
      toast("Задача удалена", "info", { ttl: 5000, actionLabel: "Отменить",
        action: () => setCards((cs) => cs.some((c) => c.id === card.id) ? cs : [...cs, card]) });
    }
  };
  const resetCards = () => { if (window.confirm("Сбросить все задачи на демо-набор? Текущие задачи будут безвозвратно удалены.")) setCards(SEED.map((c) => ({ ...c }))); };

  const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d + "T00:00:00");
    const tod = new Date(TODAY + "T00:00:00");
    const diff = Math.round((dt - tod) / 86400000);
    const s = dt.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    if (diff < 0)   return { tone: "#C0392B", label: s, overdue: true };
    if (diff === 0) return { tone: "#C0392B", label: "Сегодня", today: true };
    if (diff <= 2)  return { tone: "#B8860B", label: s };
    return { tone: "#6B7280", label: s };
  };

  const q            = searchQuery.toLowerCase();
  const visibleCards = cards
    .filter((c) => (q ? (c.title.toLowerCase().includes(q) || (c.desc || "").toLowerCase().includes(q) || (c.tags || []).some((t) => t.toLowerCase().includes(q.replace(/^#/, "")))) : true))
    .filter((c) => (priorityFilter === "all" ? true : (c.priority || "normal") === priorityFilter));
  const todayCards   = cards.filter((c) => c.due && c.due <= TODAY).sort((a, b) => a.due.localeCompare(b.due));
  const overdueCount = cards.filter((c) => c.status !== "done" && c.due && c.due < TODAY).length;
  const todayTasks    = cards.filter((c) => c.status !== "done" && c.due && c.due <= TODAY).sort((a, b) => a.due.localeCompare(b.due));
  const upcomingTasks = cards.filter((c) => c.status !== "done" && c.due && c.due > TODAY).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
  const navItem = (key, icon, label, badge) => (
    <div key={key} role="button" tabIndex={0}
      className={"ys-nav-item" + (view === key ? " ys-nav-active" : "")}
      style={{ ...st.navItem, ...(view === key ? st.navActive : {}) }}
      onClick={() => setView(key)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setView(key); } }}>
      <Icon name={icon} /> <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span style={st.navBadge}>{badge}</span>}
    </div>
  );
  const visibleToday = q ? todayCards.filter((c) => c.title.toLowerCase().includes(q)) : todayCards;
  const countBy      = (status) => visibleCards.filter((c) => c.status === status).length;
  const allTags      = [...new Set(cards.flatMap((c) => c.tags || []))].sort();

  // ── Командная палитра (⌘K) ──
  const palCommands = [
    { id: "nav-today", label: "Перейти: Сегодня", icon: "sun", run: () => setView("today") },
    { id: "nav-board", label: "Перейти: Доска задач", icon: "board", run: () => setView("board") },
    { id: "nav-cal", label: "Перейти: Календарь", icon: "today", run: () => setView("calendar") },
    { id: "nav-fin", label: "Перейти: Финансы", icon: "wallet", run: () => setView("finance") },
    { id: "new-task", label: "Новая задача", icon: "plus", run: () => { setView("board"); setAdding(COLUMNS[0].id); setDraft({ title: "", desc: "", due: "", priority: "normal" }); } },
    { id: "add-expense", label: "Добавить расход", icon: "wallet", run: () => { setView("finance"); setFinTab("personal"); setFinForm({ kind: "personal", amount: "", category: "", note: "" }); setFinError(""); setFinModal("add"); } },
    { id: "theme-cosmos", label: "Тема: Космос", icon: "sun", run: () => switchTheme("cosmos") },
    { id: "theme-signal", label: "Тема: Сигнал", icon: "sun", run: () => switchTheme("signal") },
    { id: "theme-light", label: "Тема: Clarity", icon: "sun", run: () => switchTheme("light") },
    { id: "toggle-done", label: doneCollapsed ? "Развернуть «Готово»" : "Свернуть «Готово»", icon: "board", run: () => setDoneCollapsed((v) => !v) },
  ];
  const palItems = (() => {
    const ql = palQ.trim().toLowerCase();
    const cmds = palCommands.filter((c) => !ql || c.label.toLowerCase().includes(ql));
    const tasks = cards.filter((c) => !ql || c.title.toLowerCase().includes(ql) || (c.tags || []).some((t) => t.includes(ql.replace(/^#/, "")))).slice(0, 7)
      .map((c) => ({ id: "task-" + c.id, label: c.title, sub: "Задача", icon: "board", run: () => setSelectedCardId(c.id) }));
    return [...cmds, ...tasks];
  })();
  const palIdxClamped = palItems.length ? Math.min(palIdx, palItems.length - 1) : 0;
  const runPal = (it) => { setPaletteOpen(false); setPalQ(""); setPalIdx(0); if (it) it.run(); };
  const palKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setPalIdx((i) => Math.min(i + 1, palItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setPalIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); runPal(palItems[palIdxClamped]); }
    else if (e.key === "Escape") { e.preventDefault(); setPaletteOpen(false); }
  };
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
    let d  = fmtDate(c.due);
    if (d && c.status === "done") d = { ...d, tone: "#6B7280", overdue: false, today: false }; // выполненные не «горят»
    const pr = priorities[c.priority] || priorities.normal;
    const cl = c.checklist || [];
    const clDone = cl.filter((i) => i.done).length;
    return (
      <article
        key={c.id}
        draggable
        onDragStart={(e) => { e.currentTarget.style.transform = "none"; setDragId(c.id); wasDragging.current = true; }}
        onDragEnd={() => { setDragId(null); setOverCol(null); setTimeout(() => { wasDragging.current = false; }, 0); }}
        onClick={(e) => { if (!wasDragging.current) { portalBurstRef.current = { x: e.clientX, y: e.clientY }; setSelectedCardId(c.id); } }}
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />{pr.label}</span>
          </span>
          {d && (
            <span style={{ ...st.metaChip, color: d.tone, borderColor: d.tone + (d.overdue || d.today ? "66" : "33"), background: (d.overdue || d.today) ? d.tone + "18" : st.metaChip.background, fontWeight: (d.overdue || d.today) ? 700 : st.metaChip.fontWeight }}>
              <Icon name="clock" color={d.tone} /> {d.overdue ? "Просрочено · " : ""}{d.label}
            </span>
          )}
          {cl.length > 0 && <span style={st.metaChip}><Icon name="check" /> {clDone}/{cl.length}</span>}
          {c.repeat && c.repeat !== "none" && <span style={st.metaChip} title="Повторяется"><Icon name="repeat" /></span>}
          {(c.tags || []).map((t) => { const h = tagHue(t); return (
            <span key={t} onClick={(e) => { e.stopPropagation(); setSearchQuery("#" + t); }} title="Фильтр по тегу"
              style={{ ...st.metaChip, cursor: "pointer", color: `hsl(${h},62%,62%)`, borderColor: `hsla(${h},55%,50%,.4)`, background: `hsla(${h},60%,50%,.13)` }}>#{t}</span>
          ); })}
        </div>
        {cl.length > 0 && (
          <div style={{ height: 3, marginTop: 9, borderRadius: 999, background: "rgba(128,128,128,.2)", overflow: "hidden", position: "relative", zIndex: 1 }}>
            <div style={{ height: "100%", width: Math.round(clDone / cl.length * 100) + "%", background: st.checkboxAccent, borderRadius: 999, transition: "width .3s" }} />
          </div>
        )}
      </article>
    );
  };

  // canvases рендерим всегда чтобы refs были готовы до загрузки данных

  return (
    <div style={st.app} className="ys-app">
      <style>{css}</style>
      <canvas ref={starsCanvas} className="ys-stars" style={{ display: themeName === "cosmos" ? "block" : "none" }} aria-hidden="true" />
      <canvas ref={trailCanvas} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, display: themeName === "cosmos" ? "block" : "none" }} aria-hidden="true" />
      <div ref={cursorDot}  style={st.cursorDot}  className="ys-cursor-dot"  aria-hidden="true">{themeName === "cosmos" ? "✦" : ""}</div>      {loading && (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2000, fontFamily: st.app.fontFamily, background: st.app.background, gap: 14, color: "#9aa4b6" }}>
          <div style={{ ...st.logo }}>Я</div>
          <div style={{ fontSize: 14 }}>Загрузка…</div>
        </div>
      )}

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
          {navItem("today", "sun", "Сегодня", overdueCount)}
          {navItem("board", "board", "Доска задач", 0)}
          {navItem("calendar", "today", "Календарь", todayCards.length)}
          {navItem("finance", "wallet", "Финансы", 0)}
          <div style={st.navDivider} />
          {[["doc", "Документы"], ["bell", "Напоминания"], ["plus", "Новый раздел"]].map(([icon, label]) => (
            <div key={label} role="button" tabIndex={0} className="ys-nav-item"
              style={{ ...st.navItem, opacity: 0.5, cursor: "default" }}
              onClick={() => toast(label + " — скоро", "info")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toast(label + " — скоро", "info"); } }}>
              <Icon name={icon} /> <span style={{ flex: 1 }}>{label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.7, border: "1px solid currentColor", borderRadius: 5, padding: "1px 5px" }}>скоро</span>
            </div>
          ))}
        </nav>

        <div style={st.sidebarFoot} className="ys-sidebar-foot">
          <div style={st.sidebarFootLine}>v1.2 · прототип</div>
          <div style={{ ...st.sidebarFootLine, color: saveStatus === "error" ? "#E57373" : saveStatus === "saving" ? "#7E93B5" : "#4CAF82" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: saveStatus === "error" ? "#E57373" : saveStatus === "saving" ? "#E8A13A" : "#4CAF82" }} />{saveStatus === "saving" ? "Сохраняется…" : saveStatus === "error" ? "Ошибка сохранения" : "Данные на сервере"}</span>
          </div>
          <button style={st.resetBtn} onClick={resetCards}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}><Icon name="undo" /> Сбросить данные</span></button>
          {/* Theme switcher */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {THEME_DOTS.map(({ key, color, label }) => {
              const active = themeName === key;
              return (
                <button key={key} onClick={() => switchTheme(key)} title={label}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                    border: `1px solid ${active ? color : "rgba(128,128,128,.32)"}`,
                    background: active ? color + "22" : "transparent",
                    color: active ? st.cardTitle.color : st.cardDesc.color, transition: "all .15s" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: active ? `0 0 6px ${color}` : "none", border: "1px solid rgba(0,0,0,.15)" }} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={st.main} className="ys-main" ref={mainRef}>
        <div style={st.blob1} className="ys-blob1" aria-hidden="true" />
        <div style={st.blob2} className="ys-blob2" aria-hidden="true" />
        <div style={st.blob3} className="ys-blob3" aria-hidden="true" />

        <header style={st.header} className="ys-header">
          <div>
            <h1 style={st.h1} className="ys-h1">{view === "today" ? "Сегодня" : view === "board" ? "Доска задач" : view === "calendar" ? "Календарь" : "Финансы"}</h1>
            <p style={st.sub}>
              {view === "today" ? (() => { const p = String(TODAY).split("-"); return `${+p[2]} ${MONTHS_RU[+p[1] - 1]} · ${todayTasks.length} задач${overdueCount ? ` · ${overdueCount} просрочено` : ""}`; })() : view === "board" ? `${cards.length} задач · ${countBy("in_progress")} в работе` : view === "calendar" ? `${MONTHS_RU[calMonth.m]} ${calMonth.y}` : budgetData ? `Период ${fmtRu(budgetData.start_date)} — ${fmtRu(budgetData.end_date)}` : "Загрузка…"}
            </p>
          </div>
          <div style={st.headerRight}>
            <label style={st.searchWrap} className="ys-search">
              <Icon name="search" />
              <input ref={searchRef} style={st.searchInput} placeholder="Поиск…  (/)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </label>
            <button onClick={() => setPaletteOpen(true)} title="Командная палитра" className="ys-kbd"
              style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "1px solid rgba(128,128,128,.28)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: st.cardDesc.color, fontSize: 11.5, fontWeight: 700, fontFamily: "inherit", letterSpacing: ".02em" }}>Ctrl K</button>
            <button onClick={() => { setView("board"); setAdding(COLUMNS[0].id); setDraft({ title: "", desc: "", due: "", priority: "normal" }); }}
              className="ys-btn-primary ys-header-new" style={{ ...st.btnPrimary, flex: "none", padding: "9px 15px", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Icon name="plus" /> Задача</button>
            <div style={st.avatar}>И</div>
          </div>
        </header>

        {/* Board */}
        {view === "board" && (
          <>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: "14px 26px 0", alignItems: "center" }}>
            {[["all", "Все", null], ["urgent", "Срочно", priorities.urgent], ["important", "Важно", priorities.important], ["normal", "Обычно", priorities.normal]].map(([key, label, pr]) => {
              const active = priorityFilter === key;
              const col = pr ? pr.color : st.checkboxAccent;
              return (
                <button key={key} onClick={() => setPriorityFilter(key)} className="ys-chip"
                  style={{ ...st.prBtn, padding: "5px 12px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6,
                    color: active ? col : st.cardDesc.color,
                    background: active ? (pr ? pr.bg : col + "1A") : "transparent",
                    borderColor: active ? col : (st.prBtn.border ? undefined : "rgba(128,128,128,.25)") }}>
                  {pr && <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />}{label}</button>
              );
            })}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
              <span style={{ fontSize: 10.5, color: st.cardDesc.color, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Сортировка</span>
              <div style={{ display: "flex", gap: 3, alignItems: "center", background: "rgba(128,128,128,.08)", borderRadius: 999, padding: 3 }}>
                {[["manual", "Вручную"], ["priority", "Приоритет"], ["due", "Дедлайн"]].map(([key, label]) => {
                  const active = boardSort === key;
                  return (
                    <button key={key} onClick={() => setBoardSort(key)}
                      style={{ border: "none", borderRadius: 999, padding: "4px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        color: active ? (st.btnPrimary.color || "#fff") : st.cardDesc.color,
                        background: active ? st.checkboxAccent : "transparent", transition: "all .14s" }}>{label}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ ...st.board, gridTemplateColumns: doneCollapsed ? "minmax(310px, 1fr) minmax(310px, 1fr) 56px" : st.board.gridTemplateColumns }} className="ys-board">
            {COLUMNS.map((col) => {
              const collapsed = col.id === "done" && doneCollapsed;
              if (collapsed) {
                return (
                  <section key={col.id}
                    onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
                    onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                    onDrop={() => onDrop(col.id)}
                    className="ys-column"
                    data-colid={col.id}
                    onClick={() => setDoneCollapsed(false)}
                    title="Развернуть «Готово»"
                    style={{ ...st.column, ...(overCol === col.id ? st.columnOver : {}), cursor: "pointer", alignItems: "center", padding: "14px 6px", gap: 12 }}>
                    <button onClick={(e) => { e.stopPropagation(); setDoneCollapsed(false); }}
                      style={{ ...st.colAdd, width: 24, height: 24, fontSize: 13 }} title="Развернуть">›</button>
                    <span style={{ ...st.colDot, background: col.accent }} />
                    <span style={st.colCount}>{countBy(col.id)}</span>
                    <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", ...st.colTitle, letterSpacing: "0.12em" }}>{col.title}</span>
                  </section>
                );
              }
              return (
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
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {col.id === "done" && (
                      <button style={st.colAdd} className="ys-add" title="Свернуть колонку"
                        onClick={() => setDoneCollapsed(true)}>‹</button>
                    )}
                    <button style={st.colAdd} className="ys-add"
                      onClick={() => { setAdding(col.id); setDraft({ title: "", desc: "", due: "", priority: "normal" }); }}>+</button>
                  </div>
                </div>

                <div style={st.cardList} className="ys-cardlist">
                  {sortCards(visibleCards.filter((c) => c.status === col.id)).map((c) => renderCard(c, col.accent))}

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
                            style={{ ...st.prBtn, background: draft.priority === key ? pr.bg : "transparent", border: draft.priority === key ? `1px solid ${pr.color}` : st.prBtn.border || "1px solid rgba(255,255,255,.15)", color: draft.priority === key ? pr.color : "#7a8898" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />{pr.label}</span>
                          </button>
                        ))}
                      </div>
                      <div style={st.composerRow}>
                        <button className="ys-btn-primary" style={st.btnPrimary} onClick={() => addCard(col.id)}>Добавить</button>
                        <button className="ys-btn-ghost" style={st.btnGhost}   onClick={() => setAdding(null)}>Отмена</button>
                      </div>
                    </div>
                  )}

                  {countBy(col.id) === 0 && adding !== col.id && <div style={st.empty}>Перетащите задачу сюда</div>}
                </div>
              </section>
            );
            })}
          </div>
          </>
        )}

        {/* Calendar */}
        {view === "calendar" && (() => {
          const accent = st.checkboxAccent;
          const txt = st.cardTitle.color;
          const muted = st.cardDesc.color;
          const cellBorder = (st.metaChip.borderColor) || "rgba(128,128,128,.2)";
          const panel = { ...st.card, cursor: "default" };
          const RED = "#E5575C";
          const isWeek = calMode === "week";
          const maxVisible = isWeek ? 8 : 3;
          const cellMinH = isWeek ? 180 : 92;
          // tasks by date (only those with due), filtered by search
          const calCards = (q ? cards.filter((c) => c.title.toLowerCase().includes(q)) : cards).filter((c) => c.due);
          const byDate = {};
          calCards.forEach((c) => { (byDate[c.due] = byDate[c.due] || []).push(c); });
          // backlog: tasks without a due date (filtered by search)
          const backlogCards = (q ? cards.filter((c) => c.title.toLowerCase().includes(q)) : cards).filter((c) => !c.due);

          // build rows of dates depending on mode
          const { y, m } = calMonth;
          let weeks = [];
          if (isWeek) {
            const ws = new Date(calWeekStart + "T00:00:00");
            weeks = [Array.from({ length: 7 }, (_, d) => new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + d))];
          } else {
            const first = new Date(y, m, 1);
            const startOffset = (first.getDay() + 6) % 7; // Mon=0
            const gridStart = new Date(y, m, 1 - startOffset);
            for (let w = 0; w < 6; w++) {
              const row = [];
              for (let d = 0; d < 7; d++) row.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + w * 7 + d));
              weeks.push(row);
            }
            while (weeks.length > 4 && weeks[weeks.length - 1].every((dt) => dt.getMonth() !== m)) weeks.pop();
          }
          const navBtn = { ...st.btnGhost, padding: "7px 12px", lineHeight: 1, fontSize: 15 };

          const shiftPeriod = (dir) => {
            if (isWeek) {
              const ws = new Date(calWeekStart + "T00:00:00");
              setCalWeekStart(iso(new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + dir * 7)));
            } else {
              setCalMonth(({ y, m }) => {
                const nm = m + dir;
                if (nm < 0) return { y: y - 1, m: 11 };
                if (nm > 11) return { y: y + 1, m: 0 };
                return { y, m: nm };
              });
            }
          };
          const goToday = () => {
            const n = new Date();
            setCalMonth({ y: n.getFullYear(), m: n.getMonth() });
            const off = (n.getDay() + 6) % 7;
            setCalWeekStart(iso(new Date(n.getFullYear(), n.getMonth(), n.getDate() - off)));
          };
          const setMode = (mode) => {
            if (mode === "week") {
              // align week to a sensible default if needed
              const n = new Date();
              if (!calWeekStart) { const off = (n.getDay() + 6) % 7; setCalWeekStart(iso(new Date(n.getFullYear(), n.getMonth(), n.getDate() - off))); }
            }
            setCalMode(mode);
          };

          // period label
          let periodLabel;
          if (isWeek) {
            const ws = new Date(calWeekStart + "T00:00:00");
            const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
            periodLabel = `${ws.getDate()} ${MONTHS_RU[ws.getMonth()].slice(0, 3).toLowerCase()} — ${we.getDate()} ${MONTHS_RU[we.getMonth()].slice(0, 3).toLowerCase()} ${we.getFullYear()}`;
          } else {
            periodLabel = `${MONTHS_RU[m]} ${y}`;
          }

          const seg = (key, label) => {
            const active = calMode === key;
            return (
              <button key={key} onClick={() => setMode(key)}
                style={{ border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  color: active ? (st.btnPrimary.color || "#fff") : muted,
                  background: active ? accent : "transparent", transition: "all .14s" }}>{label}</button>
            );
          };

          const renderCell = (dt) => {
            const dIso = iso(dt);
            const inMonth = isWeek ? true : dt.getMonth() === m;
            const isToday = dIso === TODAY;
            const dayTasks = byDate[dIso] || [];
            const hasOverdue = dayTasks.some((c) => c.due < TODAY && c.status !== "done");
            const isDropTarget = calOverDay === dIso;
            return (
              <div key={dIso} className={"ys-calcell" + (isToday && !isDropTarget ? " ys-today-cell" : "")}
                onDragOver={(e) => { if (calDragId != null) { e.preventDefault(); setCalOverDay(dIso); } }}
                onDragLeave={() => setCalOverDay((d2) => (d2 === dIso ? null : d2))}
                onDrop={(e) => { e.preventDefault(); if (calDragId != null) { updateCard(calDragId, { due: dIso }); toast("Дедлайн перенесён", "success"); } setCalDragId(null); setCalOverDay(null); }}
                style={{
                  "--ys-accent": accent,
                  minHeight: cellMinH, borderRadius: 10, padding: "5px 6px",
                  border: (isDropTarget || isToday) ? `1.5px solid ${accent}` : `1px solid ${cellBorder}`,
                  background: isDropTarget ? (accent + "28") : isToday ? (accent + "14") : (inMonth ? "rgba(128,128,128,.04)" : "transparent"),
                  opacity: inMonth ? 1 : 0.4,
                  display: "flex", flexDirection: "column", gap: 3, overflow: "hidden",
                  transition: "background .15s, border-color .15s", position: "relative",
                }}>
                {hasOverdue && <span title="Есть просроченная задача" style={{ position: "absolute", top: 6, left: 6, width: 7, height: 7, borderRadius: 999, background: RED, boxShadow: `0 0 6px ${RED}99`, zIndex: 2 }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button title="Новая задача" className="ys-cal-add" onClick={(e) => { e.stopPropagation(); const id = addQuickCard(dIso); setSelectedCardId(id); }}
                    style={{ border: "none", background: "transparent", color: accent, fontSize: 15, lineHeight: 1, cursor: "pointer", padding: 0, opacity: 0, transition: "opacity .15s", marginRight: "auto" }}><Icon name="plus" /></button>
                  {isWeek && <span style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", marginRight: "auto" }}>{WEEKDAYS_RU[(dt.getDay() + 6) % 7]}</span>}
                  <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? accent : (inMonth ? txt : muted), textAlign: "right" }}>{dt.getDate()}</div>
                </div>
                {dayTasks.slice(0, maxVisible).map((c) => {
                  const pr = priorities[c.priority] || priorities.normal;
                  const over = c.due < TODAY && c.status !== "done";
                  return (
                    <div key={c.id} draggable
                      onDragStart={(e) => { setCalDragId(c.id); e.dataTransfer.effectAllowed = "move"; wasDragging.current = true; }}
                      onDragEnd={() => { setCalDragId(null); setCalOverDay(null); setCalBacklogOver(false); setTimeout(() => { wasDragging.current = false; }, 0); }}
                      onClick={(e) => { e.stopPropagation(); if (!wasDragging.current) setSelectedCardId(c.id); }} className="ys-calchip"
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: over ? RED : txt, background: over ? "rgba(229,87,92,.14)" : "rgba(128,128,128,.1)", borderRadius: 6, padding: "2px 5px", cursor: "grab", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", opacity: calDragId === c.id ? 0.4 : 1 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: over ? RED : pr.color, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                    </div>
                  );
                })}
                {dayTasks.length > maxVisible && (
                  <div style={{ fontSize: 10.5, color: muted, fontWeight: 600, paddingLeft: 2 }}>+{dayTasks.length - maxVisible}</div>
                )}
              </div>
            );
          };

          return (
            <div style={st.todayView} className="ys-fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: txt, letterSpacing: "-0.02em", minWidth: 170 }}>{periodLabel}</div>
                <button className="ys-btn-ghost" style={navBtn} onClick={() => shiftPeriod(-1)}>‹</button>
                <button className="ys-btn-ghost" style={navBtn} onClick={() => shiftPeriod(1)}>›</button>
                <div style={{ display: "flex", gap: 3, marginLeft: "auto", background: "rgba(128,128,128,.1)", borderRadius: 9, padding: 3 }}>
                  {seg("week", "Неделя")}
                  {seg("month", "Месяц")}
                </div>
              </div>
              <div style={{ ...panel, padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
                  {WEEKDAYS_RU.map((wd) => (
                    <div key={wd} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: muted }}>{wd}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateRows: `repeat(${weeks.length}, 1fr)`, gap: 6 }}>
                  {weeks.map((row, wi) => (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                      {row.map(renderCell)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Бэклог «Без даты» */}
              <div
                onDragOver={(e) => { if (calDragId != null) { const c = cards.find((x) => x.id === calDragId); if (c && c.due) { e.preventDefault(); setCalBacklogOver(true); } } }}
                onDragLeave={() => setCalBacklogOver(false)}
                onDrop={(e) => { e.preventDefault(); if (calDragId != null) { const c = cards.find((x) => x.id === calDragId); if (c && c.due) { updateCard(calDragId, { due: "" }); toast("Снято с даты", "info"); } } setCalBacklogOver(false); setCalDragId(null); setCalOverDay(null); }}
                style={{ ...panel, marginTop: 14, padding: "12px 14px", border: calBacklogOver ? `1.5px dashed ${accent}` : `1px solid ${cellBorder}`, background: calBacklogOver ? (accent + "14") : panel.background, transition: "background .15s, border-color .15s" }}>
                <div style={{ fontSize: 10.5, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  Без даты {backlogCards.length > 0 && <span style={{ ...st.colCount }}>{backlogCards.length}</span>}
                </div>
                {backlogCards.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: muted }}>Нет задач без даты</div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {backlogCards.map((c) => {
                      const pr = priorities[c.priority] || priorities.normal;
                      return (
                        <div key={c.id} draggable
                          onDragStart={(e) => { setCalDragId(c.id); e.dataTransfer.effectAllowed = "move"; wasDragging.current = true; }}
                          onDragEnd={() => { setCalDragId(null); setCalOverDay(null); setCalBacklogOver(false); setTimeout(() => { wasDragging.current = false; }, 0); }}
                          onClick={(e) => { e.stopPropagation(); if (!wasDragging.current) setSelectedCardId(c.id); }} className="ys-calchip"
                          title="Перетащите на день, чтобы задать дедлайн"
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: txt, background: "rgba(128,128,128,.1)", border: `1px solid ${cellBorder}`, borderRadius: 8, padding: "5px 10px", cursor: "grab", maxWidth: 220, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", opacity: calDragId === c.id ? 0.4 : 1 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: pr.color, flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Finance */}
        {view === "finance" && (
          <div style={st.todayView} className="ys-fade-in">
            {budgetLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ ...st.card, cursor: "default", padding: "16px 18px" }}>
                      <div className="ys-skel" style={{ height: 9, width: "55%", marginBottom: 12 }} />
                      <div className="ys-skel" style={{ height: 20, width: "75%" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} style={{ ...st.card, cursor: "default", padding: "16px 18px" }}>
                      <div className="ys-skel" style={{ height: 9, width: "40%", marginBottom: 16 }} />
                      <div className="ys-skel" style={{ height: 120, width: "100%" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!budgetLoading && budgetData && !budgetData.configured && (
              <div style={st.empty}>Бюджет ещё не настроен. Открой бота и напиши <b>/бюджет</b>.</div>
            )}
            {!budgetLoading && budgetData && budgetData.configured && (() => {
              const b = budgetData;
              const accent = st.checkboxAccent;
              const barFill = (st.btnPrimary && st.btnPrimary.background) || accent;
              const txt = st.cardTitle.color;
              const muted = st.cardDesc.color;
              const RED = "#E5575C", GREEN = "#3FB27F", AMBER = "#E8A13A";
              const isLight = themeName === "light";
              const panel = { ...st.card, cursor: "default", padding: "16px 18px" };
              const fmt = (n) => (n || 0).toLocaleString("ru-RU") + " ₽";
              const pct = b.days_total ? Math.min(100, Math.max(0, Math.round((b.days_total - b.days_left) / b.days_total * 100))) : 0;
              const cats = (() => { const m = {}; (b.personal_expenses || []).forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }); return Object.entries(m).sort((a, c) => c[1] - a[1]); })();
              const totalCats = cats.reduce((s, [, v]) => s + v, 0) || 1;
              const personalAll = (b.personal_expenses || []).map((e, idx) => ({ ...e, idx }));
              const corpAll = (b.corporate_expenses || []).map((e, idx) => ({ ...e, idx }));
              const lastIdx = (b.personal_expenses || []).length - 1;
              const categories = b.categories || [];
              const filterCat = finForm._filter || "__all__";
              const fsq = finSearch.trim().toLowerCase();
              const matchSearch = (e) => !fsq || (e.note || "").toLowerCase().includes(fsq) || (e.category || "").toLowerCase().includes(fsq);
              const shownPersonal = personalAll.filter((e) => (filterCat === "__all__" || e.category === filterCat) && matchSearch(e)).slice().reverse();
              const shownCorp = corpAll.filter(matchSearch).slice().reverse();
              const lbl = { fontSize: 10, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 };
              const scrollBox = { maxHeight: 360, overflowY: "auto", overflowX: "hidden", marginRight: -4, paddingRight: 4 };

              // ── Прогноз трат ──
              const forecast = (() => {
                const nonMandatory = (b.personal_expenses || []).filter((e) => !e.mandatory).reduce((s, e) => s + (e.amount || 0), 0);
                const daysPassed = Math.max(1, (b.days_total || 0) - (b.days_left || 0));
                const avgDaily = nonMandatory / daysPassed;
                const projected = avgDaily * (b.days_total || daysPassed);
                const budgetRef = b.free || b.monthly_budget || 0;
                const over = budgetRef > 0 && projected > budgetRef;
                return { projected, over, budgetRef };
              })();

              // ── Средний / день (личные НЕ-обязательные / прошедшие дни) ──
              const avgPerDay = (() => {
                const nonMandatory = (b.personal_expenses || []).filter((e) => !e.mandatory).reduce((s, e) => s + (e.amount || 0), 0);
                const daysPassed = Math.max(1, (b.days_total || 0) - (b.days_left || 0));
                return Math.round(nonMandatory / daysPassed);
              })();

              // клик по категории → фильтр списка (повторный клик сбрасывает)
              const toggleCatFilter = (cat) => {
                const cur = finForm._filter || "__all__";
                setFinForm({ ...finForm, _filter: (cur === cat ? "__all__" : cat) });
              };

              // ── Экспорт CSV ──
              const exportCsv = () => {
                const esc = (v) => { const s = String(v == null ? "" : v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
                const rows = [["Дата", "Тип", "Категория", "Заметка", "Сумма", "Компенсировано"]];
                (b.personal_expenses || []).forEach((e) => rows.push([e.date || "", e.mandatory ? "Личный (обяз.)" : "Личный", e.category || "", e.note || "", e.amount || 0, ""]));
                (b.corporate_expenses || []).forEach((e) => rows.push([e.date || "", "Корпоративный", e.category || "", e.note || "", e.amount || 0, e.compensated || 0]));
                const csv = "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `yasnost-rashody-${TODAY}.csv`;
                document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                toast("CSV выгружен", "success");
              };
              // палитра категорий: 10 различимых цветов, соседние максимально контрастны, не зависит от accent
              const PALETTE = ["#4D7CFF", "#F2A03D", "#3FB27F", "#E5575C", "#9B6DFF", "#37C2D4", "#FF8FA3", "#C9B23A", "#7BD148", "#FF7A45"];
              // hex-интерполяция для тепловой шкалы баров «по дням»
              const _rgb = (h) => { const s = h.replace("#", ""); const n = s.length === 3 ? s.split("").map((ch) => ch + ch).join("") : s; return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]; };
              const _h2 = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
              const mix = (c1, c2, t) => { const a = _rgb(c1), b2 = _rgb(c2), k = Math.max(0, Math.min(1, t)); return `#${_h2(Math.round(a[0] + (b2[0] - a[0]) * k))}${_h2(Math.round(a[1] + (b2[1] - a[1]) * k))}${_h2(Math.round(a[2] + (b2[2] - a[2]) * k))}`; };
              const heat = (t) => t <= 0 ? "rgba(128,128,128,.18)" : t < 0.5 ? mix(accent, AMBER, t / 0.5) : mix(AMBER, RED, (t - 0.5) / 0.5);
              const stat = (label, numValue, color) => (
                <div style={{ ...panel, "--ys-accent": color }} className="ys-stat">
                  <div style={{ fontSize: 10, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                  <div className="ys-num" style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.02em" }}><CountUp value={numValue || 0} format={fmt} /></div>
                </div>
              );
              const tbtn = (label, on, primary) => (
                <button onClick={on} disabled={finBusy} className={primary ? "ys-btn-primary" : "ys-btn-ghost"}
                  style={primary
                    ? { ...st.btnPrimary, flex: "none", padding: "9px 16px", opacity: finBusy ? .6 : 1 }
                    : { ...st.btnGhost, padding: "9px 14px", opacity: finBusy ? .6 : 1 }}>{label}</button>
              );
              const ic = { display: "inline-flex", alignItems: "center", gap: 7 };
              const tab = (key, label) => (
                <button className="ys-fin-tab ys-chip" onClick={() => setFinTab(key)}
                  style={{ ...st.prBtn, padding: "8px 18px", fontWeight: 700,
                    color: finTab === key ? accent : muted,
                    background: finTab === key ? (accent + "16") : "transparent",
                    boxShadow: finTab === key ? `inset 0 0 0 1px ${accent}55, 0 0 14px -4px ${accent}` : "none",
                    borderColor: finTab === key ? accent : (st.prBtn.border ? undefined : "rgba(128,128,128,.25)") }}>{label}</button>
              );
              const catChip = { display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: accent + "18", color: accent, border: `1px solid ${accent}33` };

              // ── Donut ──
              const donut = (() => {
                const data = cats.slice(0, 10);
                const total = data.reduce((s, [, v]) => s + v, 0);
                if (!total) return null;
                const R = 60, r = 38, cx = 70, cy = 70;
                let a0 = -Math.PI / 2;
                const arcs = data.map(([cat, sum], i) => {
                  const frac = sum / total;
                  const a1 = a0 + frac * Math.PI * 2;
                  const large = frac > 0.5 ? 1 : 0;
                  const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
                  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
                  const xi0 = cx + r * Math.cos(a1), yi0 = cy + r * Math.sin(a1);
                  const xi1 = cx + r * Math.cos(a0), yi1 = cy + r * Math.sin(a0);
                  const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
                  a0 = a1;
                  return { d, color: PALETTE[i % PALETTE.length], cat, sum };
                });
                const totalStr = total >= 1000000 ? (total / 1000000).toFixed(1).replace(".0", "") + "М" : total >= 10000 ? Math.round(total / 1000) + "к" : total.toLocaleString("ru-RU");
                return (
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0, overflow: "visible" }}>
                      <defs>
                        {arcs.map((a, i) => (
                          <linearGradient key={i} id={`ys-donut-${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={a.color} stopOpacity="1" />
                            <stop offset="100%" stopColor={a.color} stopOpacity="0.72" />
                          </linearGradient>
                        ))}
                      </defs>
                      <g style={{ transformOrigin: "70px 70px", animation: "ys-donut-in .7s cubic-bezier(.2,.7,.3,1) both" }}>
                        {arcs.map((a, i) => (
                          <path key={i} d={a.d} fill={`url(#ys-donut-${i})`} stroke={isLight ? "#fff" : "rgba(0,0,0,.3)"} strokeWidth="1.2" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.22))" }} />
                        ))}
                      </g>
                      <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill={txt} className="ys-num" style={{ letterSpacing: "-0.02em" }}>{totalStr}</text>
                      <text x="70" y="84" textAnchor="middle" fontSize="9.5" fontWeight="600" fill={muted} style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>всего ₽</text>
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                      {arcs.map((a, i) => {
                        const active = (finForm._filter || "__all__") === a.cat;
                        return (
                          <div key={i} className="ys-fin-row" onClick={() => toggleCatFilter(a.cat)} title="Фильтровать по категории"
                            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", padding: "3px 6px", borderRadius: 7, background: active ? accent + "1f" : "transparent", boxShadow: active ? `inset 0 0 0 1px ${accent}55` : "none" }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0, boxShadow: `0 0 6px ${a.color}66` }} />
                            <span style={{ color: active ? txt : muted, fontWeight: active ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.cat}</span>
                            <span className="ys-num" style={{ color: txt, fontWeight: 600, flexShrink: 0 }}>{fmt(a.sum)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })();

              // ── Burndown ──
              const burndown = (() => {
                if (!b.start_date || !b.end_date) return null;
                const start = new Date(b.start_date + "T00:00:00");
                const end = new Date(b.end_date + "T00:00:00");
                const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
                const budget = b.monthly_budget || b.free || 0;
                if (!budget) return null;
                // cumulative spent per day index
                const spentByDay = new Array(days).fill(0);
                (b.personal_expenses || []).forEach((e) => {
                  if (!e.date) return;
                  const di = Math.round((new Date(e.date + "T00:00:00") - start) / 86400000);
                  if (di >= 0 && di < days) spentByDay[di] += e.amount || 0;
                });
                let cum = 0;
                const actual = spentByDay.map((s) => (cum += s));
                const W = 460, H = 150, padL = 8, padR = 8, padT = 10, padB = 18;
                const innerW = W - padL - padR, innerH = H - padT - padB;
                const maxY = Math.max(budget, actual[actual.length - 1] || 0) || 1;
                const xAt = (i) => padL + (days <= 1 ? 0 : (i / (days - 1)) * innerW);
                const yAt = (v) => padT + (1 - v / maxY) * innerH;
                // ideal line: remaining budget from budget→0 ; but we plot cumulative ideal spend 0→budget
                const idealPts = `${xAt(0)},${yAt(0)} ${xAt(days - 1)},${yAt(budget)}`;
                const actualPts = actual.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
                const areaPts = `${xAt(0)},${yAt(0)} ${actualPts} ${xAt(days - 1)},${yAt(0)}`;
                const todayIdx = Math.min(days - 1, Math.max(0, Math.round((new Date(TODAY + "T00:00:00") - start) / 86400000)));
                const tx = xAt(todayIdx), ty = yAt(actual[todayIdx] || 0);
                const lineLen = Math.round(innerW * 1.6);
                return (
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", maxWidth: "100%", overflow: "visible" }}>
                    <defs>
                      <linearGradient id="ys-burn-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1={padL} y1={yAt(0)} x2={W - padR} y2={yAt(0)} stroke="rgba(128,128,128,.25)" strokeWidth="1" />
                    <polygon points={areaPts} fill="url(#ys-burn-area)" />
                    <polyline points={idealPts} fill="none" stroke={muted} strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
                    <polyline className="ys-draw" style={{ "--len": lineLen }} points={actualPts} fill="none" stroke={accent} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
                    <line x1={tx} y1={padT} x2={tx} y2={H - padB} stroke={AMBER} strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
                    <circle cx={tx} cy={ty} r="6" fill={accent} opacity="0.22" />
                    <circle cx={tx} cy={ty} r="3.2" fill={accent} style={{ filter: `drop-shadow(0 0 5px ${accent})` }} />
                    <text x={padL} y={H - 4} fontSize="9" fill={muted}>{fmtRu(b.start_date)}</text>
                    <text x={W - padR} y={H - 4} fontSize="9" fill={muted} textAnchor="end">{fmtRu(b.end_date)}</text>
                    <text x={padL} y={yAt(maxY) + 8} fontSize="9" fill={muted}>{Math.round(maxY).toLocaleString("ru-RU")} ₽</text>
                  </svg>
                );
              })();

              // ── Траты по дням (мини-бары) ──
              const dailyBars = (() => {
                const exps = (b.personal_expenses || []).filter((e) => e.date);
                if (!exps.length) return null;
                // диапазон дней: start_date..end_date, иначе по фактическим датам
                let startStr = b.start_date, endStr = b.end_date;
                if (!startStr || !endStr) {
                  const ds = exps.map((e) => e.date).sort();
                  startStr = ds[0]; endStr = ds[ds.length - 1];
                }
                const start = new Date(startStr + "T00:00:00");
                const end = new Date(endStr + "T00:00:00");
                let days = Math.round((end - start) / 86400000) + 1;
                if (!(days > 0)) return null;
                if (days > 92) { start.setTime(end.getTime() - 91 * 86400000); days = 92; } // safety cap
                const sums = new Array(days).fill(0);
                exps.forEach((e) => {
                  const di = Math.round((new Date(e.date + "T00:00:00") - start) / 86400000);
                  if (di >= 0 && di < days) sums[di] += e.amount || 0;
                });
                const maxV = Math.max(1, ...sums);
                const todayIdx = Math.round((new Date(TODAY + "T00:00:00") - start) / 86400000);
                const tickN = Math.min(7, days);
                const ticks = Array.from({ length: tickN }, (_, k) => {
                  const di = tickN <= 1 ? 0 : Math.round((k * (days - 1)) / (tickN - 1));
                  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + di);
                  return { di, label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}` };
                });
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 10, color: muted, marginBottom: 6 }}>макс. за день:&nbsp;<b style={{ color: txt }}>{fmt(maxV)}</b></div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: days > 45 ? 1 : 2, height: 110, padding: "0 2px" }}>
                      {sums.map((v, i) => {
                        const isToday = i === todayIdx;
                        const h = v > 0 ? Math.max(3, Math.round((v / maxV) * 100)) : 1;
                        const c = v > 0 ? heat(maxV > 0 ? v / maxV : 0) : null;
                        const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
                        return (
                          <div key={i} title={`${fmtRu(iso(dt))}: ${fmt(v)}`} className="ys-daybar"
                            style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end" }}>
                            <div className="ys-bar" style={{ width: "100%", height: h + "%", borderRadius: "4px 4px 1px 1px", animationDelay: Math.min(i * 12, 360) + "ms",
                              background: v > 0 ? `linear-gradient(180deg, ${c}, ${c}55)` : "rgba(128,128,128,.18)",
                              boxShadow: isToday ? `0 0 0 1.5px ${accent}, 0 0 10px ${accent}aa` : "none", transition: "height .3s, filter .15s" }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 9, color: muted, fontVariantNumeric: "tabular-nums" }}>
                      {ticks.map((t, k) => (
                        <span key={k} style={{ color: t.di === todayIdx ? accent : muted, fontWeight: t.di === todayIdx ? 700 : 400 }}>{t.label}</span>
                      ))}
                    </div>
                  </div>
                );
              })();

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {tab("personal", "Личные")}
                    {tab("corporate", "Корпоративные")}
                  </div>

                  {finTab === "personal" && (
                  <div className="ys-fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {tbtn(<span style={ic}><Icon name="plus" /> Расход</span>, () => { setFinForm({ kind: "personal", amount: "", category: "", note: "" }); setFinError(""); setFinModal("add"); }, true)}
                    {tbtn(<span style={ic}><Icon name="coins" /> Копилка</span>, () => { setFinForm({ action: "add", amount: "" }); setFinError(""); setFinModal("piggybank"); })}
                    {tbtn(<span style={ic}><Icon name="download" /> CSV</span>, exportCsv)}
                    <button onClick={runBudgetAnalysis} disabled={aiBudgetLoading} className="ys-btn-primary"
                      style={{ ...st.btnPrimary, flex: "none", padding: "9px 16px", opacity: aiBudgetLoading ? .6 : 1 }}>
                      {aiBudgetLoading ? "Анализирую…" : <span style={ic}><Icon name="sparkle" /> AI-анализ</span>}
                    </button>
                  </div>

                  {(aiAnalysis || aiBudgetError) && (
                    <div style={aiBudgetError ? { ...st.aiPanel, borderColor: AMBER + "55", color: muted } : st.aiPanel}>
                      {aiBudgetError || aiAnalysis}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                    {stat("Лимит сегодня", b.today_limit, accent)}
                    {stat("Потрачено", b.today_spent, b.remaining < 0 ? RED : txt)}
                    {stat("Остаток", b.remaining, b.remaining < 0 ? RED : GREEN)}
                    {stat("Копилка", b.piggybank, AMBER)}
                    {stat("Средний / день", avgPerDay, accent)}
                    <div style={{ ...panel, "--ys-accent": forecast.over ? RED : GREEN }} className="ys-stat">
                      <div style={{ fontSize: 10, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Прогноз до конца периода</div>
                      <div className="ys-num" style={{ fontSize: 22, fontWeight: 800, color: forecast.over ? RED : GREEN, letterSpacing: "-0.02em" }}><CountUp value={Math.round(forecast.projected)} format={fmt} /></div>
                      <div style={{ fontSize: 11, color: forecast.over ? RED : GREEN, marginTop: 4, fontWeight: 600 }}>{forecast.budgetRef > 0 ? (forecast.over ? "превышение бюджета" : "в рамках бюджета") : "—"}</div>
                    </div>
                  </div>

                  <div style={panel}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 12 }}>
                      <span style={{ color: txt, fontWeight: 600 }}>Период {fmtRu(b.start_date)} → {fmtRu(b.end_date)}</span>
                      <span style={{ color: muted }}>{b.days_left} дн. осталось</span>
                    </div>
                    <div style={{ height: 7, background: "rgba(128,128,128,.18)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: barFill, borderRadius: 999, transition: "width .5s cubic-bezier(.2,.7,.3,1)", boxShadow: `0 0 10px -1px ${accent}88` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: muted, flexWrap: "wrap", gap: 8 }}>
                      <span>Бюджет: {fmt(b.monthly_budget)}</span>
                      <span>Обязательные: {fmt(b.mandatory_total)}</span>
                      <span>Свободно: {fmt(b.free)}</span>
                    </div>
                  </div>

                  {(donut || burndown) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
                      {donut && <div style={panel}><div style={lbl}>Расходы по категориям</div>{donut}</div>}
                      {burndown && <div style={panel}><div style={lbl}>Сгорание бюджета</div>{burndown}</div>}
                    </div>
                  )}

                  {dailyBars && (
                    <div style={panel}><div style={lbl}>Траты по дням</div>{dailyBars}</div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                    <div style={panel}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        <div style={{ ...lbl, marginBottom: 0 }}>Последние расходы ({shownPersonal.length})</div>
                        <select value={filterCat} onChange={(e) => setFinForm({ ...finForm, _filter: e.target.value })}
                          style={{ ...st.input, width: "auto", padding: "5px 8px", fontSize: 12 }}>
                          <option value="__all__">Все</option>
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <input value={finSearch} onChange={(e) => setFinSearch(e.target.value)} placeholder="Поиск по заметке/категории…"
                        style={{ ...st.input, padding: "7px 10px", fontSize: 12, marginBottom: 10 }} />
                      {shownPersonal.length === 0 && <div style={{ color: muted, fontSize: 13 }}>Пока пусто</div>}
                      <div style={scrollBox}>
                      {shownPersonal.map((e) => {
                        const isMand = !!e.mandatory;
                        return (
                          <div key={e.idx} className={isMand ? "" : "ys-fin-row"}
                            onClick={() => { if (isMand) return; setFinForm({ kind: "personal", id: e.id != null ? e.id : e.idx, date: e.date, amount: String(e.amount), category: categories.includes(e.category) ? e.category : "__custom__", customCategory: categories.includes(e.category) ? "" : e.category, note: e.note || "" }); setFinError(""); setFinModal("edit"); }}
                            style={{ display: "flex", justifyContent: "space-between", padding: "8px 6px", borderBottom: "1px solid rgba(128,128,128,.12)", alignItems: "center", gap: 8, cursor: isMand ? "default" : "pointer" }}>
                            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                <span style={catChip}>{e.category}</span>
                                {isMand && <span style={{ fontSize: 10, color: AMBER, fontWeight: 700, border: `1px solid ${AMBER}55`, borderRadius: 999, padding: "1px 6px" }}>обяз.</span>}
                              </div>
                              {e.note && <div style={{ fontSize: 12, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note}</div>}
                              <div style={{ fontSize: 11, color: muted }}>{fmtRu(e.date)}</div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: RED, flexShrink: 0 }}>−{(e.amount || 0).toLocaleString("ru-RU")} ₽</span>
                          </div>
                        );
                      })}
                      </div>
                    </div>

                    <div style={panel}>
                      <div style={lbl}>По категориям</div>
                      {cats.length === 0 && <div style={{ color: muted, fontSize: 13 }}>Пока пусто</div>}
                      {cats.slice(0, 10).map(([cat, sum]) => {
                        const active = (finForm._filter || "__all__") === cat;
                        return (
                        <div key={cat} className="ys-fin-row" onClick={() => toggleCatFilter(cat)} title="Фильтровать по категории"
                          style={{ marginBottom: 6, cursor: "pointer", padding: "5px 6px", borderRadius: 8, background: active ? accent + "1f" : "transparent", boxShadow: active ? `inset 0 0 0 1px ${accent}55` : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                            <span style={{ color: active ? txt : muted, fontWeight: active ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>{cat}</span>
                            <span style={{ color: txt, fontWeight: 600, flexShrink: 0 }}>{sum.toLocaleString("ru-RU")} ₽</span>
                          </div>
                          <div style={{ height: 5, background: "rgba(128,128,128,.18)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: Math.round(sum / totalCats * 100) + "%", background: `linear-gradient(90deg, ${accent}, ${accent}aa)`, borderRadius: 999, transition: "width .5s cubic-bezier(.2,.7,.3,1)" }} />
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={panel}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ ...lbl, marginBottom: 0 }}>Обязательные расходы</div>
                      <button onClick={() => { setFinForm({ name: "", amount: "" }); setFinError(""); setFinModal("mandatory"); }} disabled={finBusy}
                        style={{ ...st.btnGhost, padding: "5px 11px", fontSize: 12, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" /> Добавить</button>
                    </div>
                    {(b.mandatory_expenses || []).length === 0 && <div style={{ color: muted, fontSize: 13, marginTop: 8 }}>Список пуст — добавь регулярные платежи (аренда, подписки, кредит).</div>}
                    {(b.mandatory_expenses || []).map((e, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(128,128,128,.12)", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: txt, display: "flex", alignItems: "center", gap: 6 }}><Icon name={e.paid ? "checkSquare" : "square"} color={e.paid ? GREEN : muted} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span></div>
                          <div style={{ fontSize: 11, color: muted }}>
                            план {(e.amount || 0).toLocaleString("ru-RU")} ₽{e.paid ? ` · факт ${(e.paid_amount || 0).toLocaleString("ru-RU")} ₽` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {e.paid
                            ? <button onClick={() => unpayMandatory(i)} disabled={finBusy}
                                style={{ ...st.btnGhost, padding: "6px 12px", fontSize: 12 }}>Откатить</button>
                            : <button onClick={() => { setFinForm({ actual: "" }); setFinError(""); setFinModal({ type: "pay", index: i, name: e.name, budgeted: e.amount }); }} disabled={finBusy}
                                style={{ ...st.btnGhost, padding: "6px 12px", fontSize: 12 }}>Оплатить</button>
                          }
                          {!e.paid && <button onClick={() => deleteMandatory(i, e.name)} disabled={finBusy} title="Удалить"
                            style={{ border: "none", background: "transparent", color: muted, fontSize: 16, cursor: "pointer", padding: "4px 6px", lineHeight: 1 }}>✕</button>}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: muted, marginTop: 10 }}>Экономия на обязательных возвращается в бюджет.</div>
                  </div>
                  </div>
                  )}

                  {finTab === "corporate" && (
                  <div className="ys-fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {tbtn(<span style={ic}><Icon name="plus" /> Корпоративная</span>, () => { setFinForm({ kind: "corp", amount: "", category: "", note: "" }); setFinError(""); setFinModal("add"); }, true)}
                    </div>

                    <div style={{ ...panel, padding: "20px 22px", "--ys-accent": (b.corporate_debt > 0 ? accent : GREEN) }} className="ys-stat">
                      <div style={{ fontSize: 11, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Компания должна вам</div>
                      <div className="ys-num" style={{ fontSize: 30, fontWeight: 800, color: (b.corporate_debt > 0 ? accent : GREEN), letterSpacing: "-0.02em" }}>{fmt(b.corporate_debt)}</div>
                      <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap", fontSize: 12, color: muted }}>
                        <span>Всего потрачено: <b style={{ color: txt }}>{fmt(b.corporate_total)}</b></span>
                        <span>Компенсировано: <b style={{ color: GREEN }}>{fmt(b.corporate_compensated)}</b></span>
                      </div>
                    </div>

                    <div style={panel}>
                      <div style={lbl}>Корпоративные расходы ({shownCorp.length})</div>
                      <input value={finSearch} onChange={(e) => setFinSearch(e.target.value)} placeholder="Поиск по заметке/категории…"
                        style={{ ...st.input, padding: "7px 10px", fontSize: 12, marginBottom: 10 }} />
                      {shownCorp.length === 0 && <div style={{ color: muted, fontSize: 13 }}>Пока пусто</div>}
                      <div style={scrollBox}>
                      {shownCorp.map((e) => {
                        const comp = e.compensated || 0;
                        const left = (e.amount || 0) - comp;
                        return (
                          <div key={e.idx} style={{ display: "flex", justifyContent: "space-between", padding: "9px 6px", borderBottom: "1px solid rgba(128,128,128,.12)", alignItems: "center", gap: 8 }}>
                            <div className="ys-fin-row" onClick={() => { setFinForm({ kind: "corp", id: e.id != null ? e.id : e.idx, date: e.date, amount: String(e.amount), category: categories.includes(e.category) ? e.category : "__custom__", customCategory: categories.includes(e.category) ? "" : e.category, note: e.note || "" }); setFinError(""); setFinModal("edit"); }}
                              style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3, cursor: "pointer", flex: 1, padding: "2px 4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={catChip}>{e.category}</span>
                                {left <= 0
                                  ? <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>компенсировано</span>
                                  : <span style={{ fontSize: 10, color: AMBER, fontWeight: 700 }}>осталось {left.toLocaleString("ru-RU")} ₽</span>}
                              </div>
                              {e.note && <div style={{ fontSize: 12, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note}</div>}
                              <div style={{ fontSize: 11, color: muted }}>{fmtRu(e.date)}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: txt }}>{(e.amount || 0).toLocaleString("ru-RU")} ₽</span>
                              {left > 0 && (
                                <button onClick={() => { setFinForm({ id: e.id != null ? e.id : e.idx, amount: "" }); setFinError(""); setFinModal("compensate"); }} disabled={finBusy}
                                  style={{ ...st.btnGhost, padding: "5px 10px", fontSize: 11.5 }}>Компенсировать</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Сегодня */}
        {view === "today" && (() => {
          const accent = st.checkboxAccent;
          const txt = st.cardTitle.color;
          const muted = st.cardDesc.color;
          const panel = { ...st.card, cursor: "default", padding: "18px 20px" };
          const lbl = { fontSize: 10, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 };
          const fmt = (n) => (n || 0).toLocaleString("ru-RU") + " ₽";
          const b = budgetData;
          const unpaidMand = (b && b.configured && (b.mandatory_expenses || []).filter((e) => !e.paid)) || [];
          const taskRow = (c) => {
            const overdue = c.due && c.due < TODAY;
            const pr = priorities[c.priority] || priorities.normal;
            return (
              <div key={c.id} onClick={() => setSelectedCardId(c.id)} className="ys-fin-row" role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setSelectedCardId(c.id); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderBottom: "1px solid rgba(128,128,128,.1)", cursor: "pointer" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: txt, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                  {c.desc && <div style={{ fontSize: 12, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</div>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: overdue ? "#E5575C" : muted, flexShrink: 0 }}>{overdue ? "просрочено " : ""}{fmtRu(c.due)}</span>
              </div>
            );
          };
          return (
            <div style={{ flex: 1, overflowY: "auto", padding: 26, position: "relative", zIndex: 1 }} className="ys-fade-in">
              <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={panel}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ ...lbl, marginBottom: 0 }}>Задачи на сегодня и просрочки</div>
                    <span style={{ fontSize: 12, color: muted }}>{todayTasks.length}</span>
                  </div>
                  {todayTasks.length === 0
                    ? <div style={{ color: muted, fontSize: 13, padding: "14px 0", textAlign: "center" }}>На сегодня всё чисто — нет задач с дедлайном.</div>
                    : todayTasks.map(taskRow)}
                </div>

                {b && b.configured && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                    {[["Лимит сегодня", b.today_limit, accent], ["Потрачено", b.today_spent, b.remaining < 0 ? "#E5575C" : txt], ["Остаток", b.remaining, b.remaining < 0 ? "#E5575C" : "#3FB27F"]].map(([l, v, col]) => (
                      <div key={l} style={{ ...panel, "--ys-accent": col }} className="ys-stat">
                        <div style={{ fontSize: 10, color: muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{l}</div>
                        <div className="ys-num" style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: "-0.02em" }}>{fmt(v)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {unpaidMand.length > 0 && (
                  <div style={panel}>
                    <div style={lbl}>Неоплаченные обязательные</div>
                    {unpaidMand.map((e, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(128,128,128,.1)", fontSize: 13 }}>
                        <span style={{ color: txt, display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="square" color={muted} /> {e.name}</span>
                        <span style={{ color: muted, fontWeight: 600 }}>{fmt(e.amount)}</span>
                      </div>
                    ))}
                    <button onClick={() => setView("finance")} style={{ ...st.btnGhost, marginTop: 12, padding: "8px 14px", fontSize: 12 }}>Открыть финансы →</button>
                  </div>
                )}

                {upcomingTasks.length > 0 && (
                  <div style={panel}>
                    <div style={lbl}>Скоро</div>
                    {upcomingTasks.map(taskRow)}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
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
                      style={{ ...st.prBtn, background: selectedCard.priority === key ? pr.bg : "transparent", border: selectedCard.priority === key ? `1px solid ${pr.color}` : st.prBtn.border || "1px solid rgba(255,255,255,.15)", color: selectedCard.priority === key ? pr.color : "#7a8898" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />{pr.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>Статус</div>
                <div style={st.priorityPicker}>
                  {COLUMNS.map((col) => (
                    <button key={col.id} onClick={() => setStatus(selectedCard.id, col.id)}
                      style={{ ...st.prBtn, background: selectedCard.status === col.id ? col.accent + "18" : "transparent", border: selectedCard.status === col.id ? `1px solid ${col.accent}` : st.prBtn.border || "1px solid rgba(255,255,255,.15)", color: selectedCard.status === col.id ? col.accent : "#7a8898" }}>
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
                <div style={st.modalLabel}>Теги</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {(selectedCard.tags || []).map((t) => { const h = tagHue(t); return (
                    <span key={t} style={{ ...st.metaChip, color: `hsl(${h},62%,62%)`, borderColor: `hsla(${h},55%,50%,.4)`, background: `hsla(${h},60%,50%,.13)`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      #{t}
                      <button onClick={() => removeTag(selectedCard.id, selectedCard.tags, t)} style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
                    </span>
                  ); })}
                  <input list="ys-all-tags" style={{ ...st.input, width: 160, padding: "6px 10px", fontSize: 12 }} placeholder="+ тег, Enter"
                    value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(selectedCard.id, selectedCard.tags, tagInput); } }} />
                  <datalist id="ys-all-tags">{allTags.map((t) => <option key={t} value={t} />)}</datalist>
                </div>
              </div>

              <div style={st.modalSection}>
                <div style={st.modalLabel}>Повтор</div>
                <div style={st.priorityPicker}>
                  {[["none", "Нет"], ["daily", "Каждый день"], ["weekly", "Каждую неделю"], ["monthly", "Каждый месяц"]].map(([key, label]) => {
                    const active = (selectedCard.repeat || "none") === key;
                    return (
                      <button key={key} onClick={() => updateCard(selectedCard.id, { repeat: key })}
                        style={{ ...st.prBtn, display: "inline-flex", alignItems: "center", gap: 6, background: active ? st.checkboxAccent + "1f" : "transparent", border: active ? `1px solid ${st.checkboxAccent}` : st.prBtn.border || "1px solid rgba(255,255,255,.15)", color: active ? st.checkboxAccent : "#8893a8" }}>
                        {key !== "none" && <Icon name="repeat" />}{label}
                      </button>
                    );
                  })}
                </div>
                {selectedCard.repeat && selectedCard.repeat !== "none" && <div style={{ fontSize: 11, color: st.cardDesc.color, marginTop: 8 }}>При переносе в «Готово» задача пересоздастся со сдвинутым дедлайном.</div>}
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

      {/* ── Finance modals ── */}
      {finModal && (() => {
        const cats = (budgetData && budgetData.categories) || [];
        const isAdd = finModal === "add";
        const isEdit = finModal === "edit";
        const isExpenseForm = isAdd || isEdit;
        const isCorp = finForm.kind === "corp";
        const title = isAdd ? (isCorp ? "Корпоративная трата" : "Личная трата")
          : isEdit ? (isCorp ? "Редактировать корпоративную" : "Редактировать расход")
          : finModal === "compensate" ? "Компенсация"
          : finModal === "piggybank" ? "Копилка"
          : finModal === "mandatory" ? "Новый обязательный расход"
          : "Оплата обязательного";
        const onExpenseSubmit = isAdd ? submitExpense : submitEditExpense;
        return (
        <div style={st.overlay} className="ys-overlay" onClick={closeFin}>
          <div style={{ ...st.modal, width: "min(440px, 94vw)" }} className="ys-modal" onClick={(e) => e.stopPropagation()}>
            <div style={st.modalHeader}>
              <span style={st.modalTitle}>{title}</span>
              <button style={st.modalClose} onClick={closeFin}>×</button>
            </div>
            <div style={{ ...st.modalBody, gap: 14 }}>
              {isExpenseForm && (
                <>
                  {isEdit && (
                    <div>
                      <div style={st.modalLabel}>Дата</div>
                      <input style={st.input} type="date" value={finForm.date || ""}
                        onChange={(e) => setFinForm({ ...finForm, date: e.target.value })} />
                    </div>
                  )}
                  <div>
                    <div style={st.modalLabel}>Сумма</div>
                    <input style={st.input} type="text" inputMode="decimal" placeholder="Сумма, ₽" autoFocus={isAdd}
                      value={finForm.amount || ""} onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && onExpenseSubmit()} />
                  </div>
                  <div>
                    <div style={st.modalLabel}>Категория</div>
                    <select style={st.input} value={finForm.category || ""}
                      onChange={(e) => setFinForm({ ...finForm, category: e.target.value })}>
                      <option value="">— выберите —</option>
                      {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom__">Своя…</option>
                    </select>
                    {finForm.category === "__custom__" && (
                      <input style={{ ...st.input, marginTop: 8 }} type="text" placeholder="Название категории"
                        value={finForm.customCategory || ""} onChange={(e) => setFinForm({ ...finForm, customCategory: e.target.value })} />
                    )}
                  </div>
                  <div>
                    <div style={st.modalLabel}>Заметка</div>
                    <input style={st.input} type="text" placeholder="Необязательно"
                      value={finForm.note || ""} onChange={(e) => setFinForm({ ...finForm, note: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && onExpenseSubmit()} />
                  </div>
                </>
              )}
              {finModal === "compensate" && (
                <>
                  <div style={{ fontSize: 13, color: st.cardDesc.color }}>Сумма для компенсации. Оставьте пустым, чтобы компенсировать весь остаток.</div>
                  <input style={st.input} type="text" inputMode="decimal" placeholder="Сумма, ₽ (пусто = весь остаток)" autoFocus
                    value={finForm.amount || ""} onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && submitCompensate()} />
                </>
              )}
              {finModal === "piggybank" && (
                <>
                  <div style={{ fontSize: 13, color: st.cardDesc.color }}>Сейчас в копилке: <b style={{ color: st.cardTitle.color }}>{(budgetData?.piggybank || 0).toLocaleString("ru-RU")} ₽</b></div>
                  <div style={st.priorityPicker}>
                    {[["add", "plus", "Пополнить"], ["withdraw", "minus", "Снять"]].map(([k, icn, l]) => (
                      <button key={k} onClick={() => setFinForm({ ...finForm, action: k })}
                        style={{ ...st.prBtn, display: "inline-flex", alignItems: "center", gap: 6, color: (finForm.action || "add") === k ? st.checkboxAccent : st.cardDesc.color, borderColor: (finForm.action || "add") === k ? st.checkboxAccent : undefined }}><Icon name={icn} /> {l}</button>
                    ))}
                  </div>
                  <input style={st.input} type="text" inputMode="decimal" placeholder="Сумма, ₽" autoFocus
                    value={finForm.amount || ""} onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && submitPiggy()} />
                  {finForm.action === "withdraw" && <div style={{ fontSize: 11, color: st.cardDesc.color }}>Снятие увеличит лимит сегодняшнего дня.</div>}
                </>
              )}
              {finModal === "mandatory" && (
                <>
                  <div>
                    <div style={st.modalLabel}>Название</div>
                    <input style={st.input} type="text" placeholder="Напр. Аренда, Подписки, Кредит" autoFocus
                      value={finForm.name || ""} onChange={(e) => setFinForm({ ...finForm, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && submitMandatory()} />
                  </div>
                  <div>
                    <div style={st.modalLabel}>Сумма в месяц</div>
                    <input style={st.input} type="text" inputMode="decimal" placeholder="Сумма, ₽"
                      value={finForm.amount || ""} onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && submitMandatory()} />
                  </div>
                  <div style={{ fontSize: 11, color: st.cardDesc.color }}>Обязательные вычитаются из бюджета и снижают дневной лимит. Отметишь оплату — экономия (план − факт) вернётся в свободные деньги.</div>
                </>
              )}
              {finModal && finModal.type === "pay" && (
                <>
                  <div style={{ fontSize: 14, color: st.cardTitle.color }}>{finModal.name}</div>
                  <div style={{ fontSize: 13, color: st.cardDesc.color }}>Заложено: <b>{(finModal.budgeted || 0).toLocaleString("ru-RU")} ₽</b></div>
                  <input style={st.input} type="text" inputMode="decimal" placeholder={`Факт (пусто = ${(finModal.budgeted || 0).toLocaleString("ru-RU")} ₽)`} autoFocus
                    value={finForm.actual || ""} onChange={(e) => setFinForm({ ...finForm, actual: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && submitPay()} />
                  <div style={{ fontSize: 11, color: st.cardDesc.color }}>Экономия вернётся в бюджет.</div>
                </>
              )}
              {finError && <div style={{ color: "#E5575C", fontSize: 12 }}>{finErrText(finError)}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="ys-btn-primary" style={{ ...st.btnPrimary, opacity: finBusy ? .6 : 1 }} disabled={finBusy}
                  onClick={isExpenseForm ? onExpenseSubmit : finModal === "compensate" ? submitCompensate : finModal === "piggybank" ? submitPiggy : finModal === "mandatory" ? submitMandatory : submitPay}>
                  {finBusy ? "…" : isAdd ? "Добавить" : isEdit ? "Сохранить" : finModal === "compensate" ? "Компенсировать" : finModal === "piggybank" ? "Применить" : finModal === "mandatory" ? "Добавить" : "Оплатить"}
                </button>
                {isEdit && (
                  <button className="ys-btn-ghost" style={{ ...st.btnGhost, color: "#E5575C", borderColor: "#E5575C55" }} disabled={finBusy} onClick={deleteExpense}>Удалить</button>
                )}
                <button className="ys-btn-ghost" style={st.btnGhost} onClick={closeFin}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Командная палитра (⌘K) ── */}
      {paletteOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}
          onClick={() => setPaletteOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="ys-modal"
            style={{ width: "min(560px, 92vw)", background: st.modal.background, border: st.modal.border, borderRadius: 16, boxShadow: st.modal.boxShadow, overflow: "hidden", backdropFilter: st.modal.backdropFilter, WebkitBackdropFilter: st.modal.WebkitBackdropFilter }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderBottom: "1px solid rgba(128,128,128,.15)" }}>
              <Icon name="search" color={st.cardDesc.color} size={16} />
              <input autoFocus value={palQ} onChange={(e) => { setPalQ(e.target.value); setPalIdx(0); }} onKeyDown={palKeyDown}
                placeholder="Команда или задача…"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: st.cardTitle.color, fontSize: 15, fontFamily: "inherit" }} />
              <span style={{ fontSize: 10, color: st.cardDesc.color, border: "1px solid rgba(128,128,128,.3)", borderRadius: 5, padding: "2px 6px" }}>ESC</span>
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto", padding: 6 }}>
              {palItems.length === 0 && <div style={{ padding: 20, textAlign: "center", color: st.cardDesc.color, fontSize: 13 }}>Ничего не найдено</div>}
              {palItems.map((it, i) => (
                <div key={it.id} onClick={() => runPal(it)} onMouseEnter={() => setPalIdx(i)}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: i === palIdxClamped ? st.checkboxAccent + "22" : "transparent" }}>
                  <Icon name={it.icon} color={i === palIdxClamped ? st.checkboxAccent : st.cardDesc.color} size={16} />
                  <span style={{ flex: 1, color: st.cardTitle.color, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                  {it.sub && <span style={{ fontSize: 11, color: st.cardDesc.color, flexShrink: 0 }}>{it.sub}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Тосты ── */}
      <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 3000, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", pointerEvents: "none", maxWidth: "min(360px, 90vw)" }}>
        {toasts.map((t) => {
          const tone = t.type === "success" ? "#3FB27F" : t.type === "error" ? "#E5575C" : st.checkboxAccent;
          return (
            <div key={t.id} className="ys-toast"
              style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 10, background: st.modal.background, border: `1px solid ${tone}66`, borderLeft: `3px solid ${tone}`, color: st.cardTitle.color, borderRadius: 11, padding: "10px 13px 12px", fontSize: 13, fontWeight: 500, boxShadow: "0 10px 32px -8px rgba(0,0,0,.45)", backdropFilter: "blur(16px) saturate(1.2)", WebkitBackdropFilter: "blur(16px) saturate(1.2)", maxWidth: "100%" }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: tone + "22", color: tone, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{t.type === "success" ? "✓" : t.type === "error" ? "!" : "i"}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{t.msg}</span>
              {t.action && (
                <button onClick={() => { t.action(); dismissToast(t.id); }}
                  style={{ background: "transparent", border: "none", color: tone, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, padding: 0 }}>{t.actionLabel || "OK"}</button>
              )}
              <button onClick={() => dismissToast(t.id)} style={{ background: "transparent", border: "none", color: st.cardDesc.color, fontSize: 16, lineHeight: 1, cursor: "pointer", padding: 0, flexShrink: 0 }}>×</button>
              <span className="ys-toast-bar" style={{ background: tone, opacity: .55, animationDuration: (t.ttl || 2500) + "ms" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CountUp({ value, format }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = Number(value) || 0;
    const start = Number(fromRef.current) || 0;
    if (reduce || start === target) { fromRef.current = target; setDisplay(target); return; }
    const dur = 650, t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (target - start) * eased;
      setDisplay(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <>{format ? format(display) : Math.round(display)}</>;
}

function Icon({ name, color = "currentColor", size = 14 }) {
  const p = { width: size, height: size, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 };
  const paths = {
    board:  <><rect x="3" y="3" width="6" height="18" rx="1" /><rect x="11" y="3" width="6" height="11" rx="1" /></>,
    wallet: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3H6a2 2 0 0 0-2 2" /><circle cx="17" cy="14" r="1" fill={color} stroke="none" /></>,
    doc:    <><path d="M6 2h7l5 5v15H6z" /><path d="M13 2v5h5" /></>,
    bell:   <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    plus:   <><path d="M12 5v14M5 12h14" /></>,
    minus:  <><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    clock:  <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    today:  <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    sun:    <><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" /></>,
    tag:    <><path d="M3 11.5V4a1 1 0 0 1 1-1h7.5a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7z" /><circle cx="7.5" cy="7.5" r="1.3" fill={color} stroke="none" /></>,
    repeat: <><path d="M17 2.5 20.5 6 17 9.5" /><path d="M3.5 11V9a3 3 0 0 1 3-3h14" /><path d="M7 21.5 3.5 18 7 14.5" /><path d="M20.5 13v2a3 3 0 0 1-3 3h-14" /></>,
    coins:  <><ellipse cx="12" cy="6.5" rx="7" ry="3" /><path d="M5 6.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" /><path d="M5 11.5v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" /></>,
    undo:   <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" /></>,
    download: <><path d="M12 3v13" /><path d="m7 12 5 5 5-5" /><path d="M5 21h14" /></>,
    sparkle: <><path d="M12 3.5 13.7 9 19 10.5 13.7 12 12 17.5 10.3 12 5 10.5 10.3 9z" /><path d="M19 4v3M20.5 5.5h-3" /></>,
    check:  <><path d="M5 12.5 10 17.5 19 7" /></>,
    square: <><rect x="4" y="4" width="16" height="16" rx="3.5" /></>,
    checkSquare: <><rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M8.5 12.2 11 14.7 15.7 9.3" /></>,
  };
  return <svg viewBox="0 0 24 24" style={p}>{paths[name]}</svg>;
}
