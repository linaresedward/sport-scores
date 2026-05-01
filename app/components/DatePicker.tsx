"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface DatePickerProps {
  selected: Date
  onChange: (date: Date) => void
  lang?: "fr" | "en"
}

const MONTHS = {
  fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
}
const DAYS_LONG = {
  fr: ["Dim.","Lun.","Mar.","Mer.","Jeu.","Ven.","Sam."],
  en: ["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."],
}
const DAYS_SHORT = {
  fr: ["Lu","Ma","Me","Je","Ve","Sa","Di"],
  en: ["Mo","Tu","We","Th","Fr","Sa","Su"],
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatLabel(date: Date, lang: "fr" | "en"): string {
  const day = DAYS_LONG[lang][date.getDay()]
  const num = date.getDate()
  const mon = MONTHS[lang][date.getMonth()].toLowerCase()
  const year = date.getFullYear()
  return `${day} ${num} ${mon} ${year}`
}

function MiniCalendar({ selected, onSelect, lang }: {
  selected: Date
  onSelect: (d: Date) => void
  lang: "fr" | "en"
}) {
  const [view, setView] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const today = new Date()
  const firstDow      = (view.getDay() + 6) % 7
  const daysInMonth   = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const prevMonthDays = new Date(view.getFullYear(), view.getMonth(), 0).getDate()

  const cells: { date: Date; current: boolean }[] = []
  for (let i = 0; i < firstDow; i++) {
    cells.push({
      date: new Date(view.getFullYear(), view.getMonth() - 1, prevMonthDays - firstDow + 1 + i),
      current: false,
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(view.getFullYear(), view.getMonth(), d), current: true })
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      date: new Date(view.getFullYear(), view.getMonth() + 1, cells.length - daysInMonth - firstDow + 1),
      current: false,
    })
  }

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", left: "50%",
      transform: "translateX(-50%)", zIndex: 9999, width: 236,
      background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      animation: "dpFade .12s ease",
    }}>
      {/* Header mois */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          style={{ width:24, height:24, borderRadius:6, border:"1px solid #e2e8f0",
            background:"transparent", color:"#475569", cursor:"pointer", fontSize:14,
            display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>
          {MONTHS[lang][view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          style={{ width:24, height:24, borderRadius:6, border:"1px solid #e2e8f0",
            background:"transparent", color:"#475569", cursor:"pointer", fontSize:14,
            display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
      </div>

      {/* Jours semaine */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {DAYS_SHORT[lang].map(d => (
          <span key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600,
            color:"#94a3b8", padding:"2px 0" }}>{d}</span>
        ))}
      </div>

      {/* Grille jours */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map(({ date, current }, i) => {
          const isSel   = isSameDay(date, selected)
          const isToday = isSameDay(date, today)
          return (
            <button key={i} onClick={() => onSelect(date)} style={{
              height:28, border:"none", borderRadius:6, cursor:"pointer",
              fontSize:12, display:"flex", alignItems:"center", justifyContent:"center",
              opacity: current ? 1 : 0.3,
              background: isSel ? "#2563eb" : isToday ? "#eff6ff" : "transparent",
              color: isSel ? "#ffffff" : isToday ? "#2563eb" : "#374151",
              fontWeight: isSel || isToday ? 700 : 400,
            }}>{date.getDate()}</button>
          )
        })}
      </div>
    </div>
  )
}

export default function DatePicker({ selected, onChange, lang = "fr" }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const prev = useCallback(() => onChange(addDays(selected, -1)), [selected, onChange])
  const next = useCallback(() => onChange(addDays(selected,  1)), [selected, onChange])

  return (
    <>
      <style>{`
        @keyframes dpFade {
          from { opacity:0; transform:translateX(-50%) translateY(-4px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        .dp-arrow {
          width:28px; height:28px; border-radius:7px;
          border:1px solid #e2e8f0; background:transparent;
          color:#64748b; font-size:15px; cursor:pointer; line-height:1;
          display:flex; align-items:center; justify-content:center;
          transition:border-color .15s, color .15s; flex-shrink:0;
        }
        .dp-arrow:hover { border-color:#3b82f6; color:#2563eb; }
        .dp-chip {
          display:flex; align-items:center; gap:7px;
          padding:5px 13px; border-radius:8px; border:1px solid #e2e8f0;
          background:transparent; cursor:pointer; white-space:nowrap;
          transition:border-color .15s, background .15s;
        }
        .dp-chip:hover, .dp-chip[data-open="true"] {
          border-color:#3b82f6; background:#eff6ff;
        }
        .dp-chip-label { font-size:13px; font-weight:500; color:#0f172a; letter-spacing:.01em; }
        .dp-chip-icon  { color:#2563eb; flex-shrink:0; }
      `}</style>

      <div ref={ref} style={{ position:"relative", display:"inline-flex", alignItems:"center", gap:4, userSelect:"none" }}>

        <button className="dp-arrow" onClick={prev} aria-label="Jour précédent">‹</button>

        <div className="dp-chip" data-open={String(open)} onClick={() => setOpen(o => !o)}>
          <svg className="dp-chip-icon" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <span className="dp-chip-label">{formatLabel(selected, lang)}</span>
        </div>

        <button className="dp-arrow" onClick={next} aria-label="Jour suivant">›</button>

        {open && (
          <MiniCalendar
            selected={selected}
            onSelect={(d) => { onChange(d); setOpen(false) }}
            lang={lang}
          />
        )}
      </div>
    </>
  )
}