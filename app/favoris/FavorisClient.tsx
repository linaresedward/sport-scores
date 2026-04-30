"use client";

import Link from "next/link";
import { useFavorites } from "@/hooks/useFavorites";
import { useT } from "@/lib/i18n";

export default function FavorisClient() {
  const { teams, leagues, removeFavorite } = useFavorites();
  const { t } = useT();
  const isEmpty = teams.length === 0 && leagues.length === 0;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 24px" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <span style={{ fontSize: "28px" }}>⭐</span>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          {t("my_favorites")}
        </h1>
      </div>

      {isEmpty && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>☆</div>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#64748b" }}>
            {t("no_favorites")}
          </p>
          <p style={{ fontSize: "13px", marginBottom: "24px" }}>
            {t("no_favorites_sub")}
          </p>
          <Link href="/" style={{
            display: "inline-block", padding: "10px 20px",
            background: "#2563eb", color: "#fff",
            borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            textDecoration: "none",
          }}>
            {t("explore")}
          </Link>
        </div>
      )}

      {leagues.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("leagues_label")} ({leagues.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {leagues.map((fav) => (
              <div key={fav.id} style={{
                display: "flex", alignItems: "center",
                background: "#fff", border: "1px solid #f1f5f9",
                borderRadius: "12px", padding: "12px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <Link href={`/ligue/${fav.id}`} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  flex: 1, textDecoration: "none",
                }}>
                  {fav.logo && (
                    <img src={fav.logo} alt="" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                  )}
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {fav.name}
                  </span>
                </Link>
                <button
                  onClick={() => removeFavorite(fav.id, "league")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "18px", color: "#cbd5e1", padding: "4px 8px", lineHeight: 1,
                  }}
                  title={t("remove")}
                >×</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {teams.length > 0 && (
        <section>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("teams_label")} ({teams.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {teams.map((fav) => (
              <div key={fav.id} style={{
                display: "flex", alignItems: "center",
                background: "#fff", border: "1px solid #f1f5f9",
                borderRadius: "12px", padding: "12px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <Link href={`/equipe/${fav.id}`} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  flex: 1, textDecoration: "none",
                }}>
                  {fav.logo && (
                    <img src={fav.logo} alt="" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                  )}
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                    {fav.name}
                  </span>
                </Link>
                <button
                  onClick={() => removeFavorite(fav.id, "team")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "18px", color: "#cbd5e1", padding: "4px 8px", lineHeight: 1,
                  }}
                  title={t("remove")}
                >×</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}