"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string; // "2026-04-30"
  matchTime?: string | null; // "19:00"
}

interface ScheduledNotif {
  matchId: string;
  minutesBefore: number;
  scheduledAt: number; // timestamp ms quand la notif doit partir
  timeoutId?: number;
}

const STORAGE_KEY = "sport-scores-notifs";

function loadNotifs(): ScheduledNotif[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotifs(notifs: ScheduledNotif[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(
    notifs.map(({ timeoutId, ...n }) => n) // ne pas sauver timeoutId
  ));
}

function getMatchTimestamp(date: string, time?: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const dt = new Date(`${date}T00:00:00`);
  dt.setHours(h, m, 0, 0);
  return dt.getTime();
}

const DELAY_OPTIONS = [
  { label: "À l'heure exacte", minutes: 0 },
  { label: "5 min avant", minutes: 5 },
  { label: "15 min avant", minutes: 15 },
  { label: "30 min avant", minutes: 30 },
  { label: "1 heure avant", minutes: 60 },
];

export default function MatchNotifyButton({ matchId, homeTeam, awayTeam, matchDate, matchTime }: Props) {
  const [notif, setNotif] = useState<ScheduledNotif | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Chargement initial
  useEffect(() => {
    const notifs = loadNotifs();
    const existing = notifs.find((n) => n.matchId === matchId);
    if (existing) setNotif(existing);
    if ("Notification" in window) setPermission(Notification.permission);
  }, [matchId]);

  // Fermer le menu si clic dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowCustom(false);
        setCustomMinutes("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Remettre en place les timeouts au montage (page reload)
  useEffect(() => {
    if (!notif) return;
    const now = Date.now();
    const delay = notif.scheduledAt - now;
    if (delay <= 0) {
      // Déjà passé — nettoyer
      cancelNotif();
      return;
    }
    timeoutRef.current = window.setTimeout(() => {
      fireNotification(notif.minutesBefore);
      cancelNotif();
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [notif]);

  async function requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      setError("Votre navigateur ne supporte pas les notifications.");
      return false;
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
      setError("Notifications bloquées. Autorisez-les dans les paramètres du navigateur.");
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      setError("Permission refusée. Activez les notifications pour ce site.");
      return false;
    }
    return true;
  }

  function fireNotification(minutesBefore: number) {
    const title = minutesBefore === 0
      ? `⚽ Match qui commence !`
      : `⏰ Match dans ${minutesBefore} min`;
    const body = `${homeTeam} vs ${awayTeam}`;
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }

  async function scheduleNotif(minutesBefore: number) {
    setError(null);
    const ok = await requestPermission();
    if (!ok) return;

    const matchTs = getMatchTimestamp(matchDate, matchTime);
    if (!matchTs) {
      setError("Heure du match inconnue — impossible de programmer une notification.");
      return;
    }

    const scheduledAt = matchTs - minutesBefore * 60 * 1000;
    const now = Date.now();

    if (scheduledAt <= now) {
      setError("Ce moment est déjà passé. Choisissez un délai plus court.");
      return;
    }

    // Annuler l'ancien timeout si existant
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const delay = scheduledAt - now;
    const newNotif: ScheduledNotif = { matchId, minutesBefore, scheduledAt };

    timeoutRef.current = window.setTimeout(() => {
      fireNotification(minutesBefore);
      cancelNotif();
    }, delay);

    newNotif.timeoutId = timeoutRef.current;

    // Sauvegarder
    const notifs = loadNotifs().filter((n) => n.matchId !== matchId);
    notifs.push(newNotif);
    saveNotifs(notifs);
    setNotif(newNotif);
    setShowMenu(false);
    setShowCustom(false);
    setCustomMinutes("");
  }

  function cancelNotif() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const notifs = loadNotifs().filter((n) => n.matchId !== matchId);
    saveNotifs(notifs);
    setNotif(null);
    setError(null);
  }

  function handleCustomSubmit() {
    const mins = parseInt(customMinutes);
    if (isNaN(mins) || mins < 0 || mins > 1440) {
      setError("Entrez un nombre entre 0 et 1440 minutes.");
      return;
    }
    scheduleNotif(mins);
  }

  const hasTime = !!matchTime;
  const isActive = !!notif;

  // Heure formatée de la notification
  function getNotifTimeLabel(): string {
    if (!notif) return "";
    const d = new Date(notif.scheduledAt);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>

      {/* Bouton principal */}
      <button
        onClick={() => {
          if (isActive) {
            cancelNotif();
          } else {
            if (!hasTime) {
              setError("Heure du match inconnue — notification impossible.");
              return;
            }
            setShowMenu((v) => !v);
            setError(null);
          }
        }}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", borderRadius: "20px", border: "none",
          cursor: "pointer", fontSize: "12px", fontWeight: 600,
          transition: "all 0.2s",
          background: isActive ? "#fef3c7" : "#f1f5f9",
          color: isActive ? "#d97706" : "#64748b",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isActive ? "#fde68a" : "#e2e8f0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isActive ? "#fef3c7" : "#f1f5f9";
        }}
        title={isActive ? "Cliquez pour annuler la notification" : "Programmer une notification"}
      >
        <span>{isActive ? "🔔" : "🔕"}</span>
        <span>
          {isActive
            ? `Notif. à ${getNotifTimeLabel()}`
            : "Me notifier"}
        </span>
        {isActive && <span style={{ fontSize: "10px", color: "#94a3b8" }}>✕</span>}
      </button>

      {/* Menu de sélection */}
      {showMenu && !isActive && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          padding: "8px", minWidth: "200px", zIndex: 100,
        }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, color: "#94a3b8",
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "4px 8px 8px",
          }}>
            Me rappeler…
          </p>

          {DELAY_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => scheduleNotif(opt.minutes)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 12px", borderRadius: "8px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "13px", color: "#0f172a", fontWeight: 500,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {opt.label}
            </button>
          ))}

          {/* Option personnalisée */}
          <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "4px", paddingTop: "4px" }}>
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", borderRadius: "8px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "13px", color: "#2563eb", fontWeight: 600,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                ✏️ Personnalisé…
              </button>
            ) : (
              <div style={{ padding: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>
                  Rappel combien de minutes avant ?
                </p>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    placeholder="ex: 45"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                    autoFocus
                    style={{
                      flex: 1, padding: "6px 8px", borderRadius: "6px",
                      border: "1px solid #e2e8f0", fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleCustomSubmit}
                    style={{
                      padding: "6px 10px", borderRadius: "6px",
                      background: "#2563eb", color: "#fff",
                      border: "none", cursor: "pointer",
                      fontSize: "12px", fontWeight: 600,
                    }}
                  >OK</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "8px", padding: "8px 12px",
          fontSize: "12px", color: "#dc2626", zIndex: 100,
          maxWidth: "220px", lineHeight: 1.4,
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{ display: "block", marginTop: "4px", background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#94a3b8" }}
          >Fermer</button>
        </div>
      )}
    </div>
  );
}