import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";

const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY;

async function getPlayer(id: string) {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${KEY}/lookupplayer.php?id=${id}`,
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return data.players?.[0] ?? null;
}

export default async function JoueurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value ?? "fr") === "en" ? "en" : "fr";
  const tr = translations[lang];
  const t = (key: keyof typeof tr) => tr[key] ?? translations.fr[key] ?? key;

  const player = await getPlayer(id);
  if (!player) notFound();

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px" }}>

      <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>
        <Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>{t("home")}</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span>{player.strPlayer}</span>
      </div>

      <div style={{
        display: "flex", gap: "24px", alignItems: "flex-start",
        background: "#fff", borderRadius: "16px",
        border: "1px solid #f1f5f9", padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: "24px",
      }}>
        <div style={{
          width: "100px", height: "100px", borderRadius: "50%",
          background: "#f1f5f9", flexShrink: 0, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {player.strThumb || player.strCutout ? (
            <img src={player.strThumb || player.strCutout} alt={player.strPlayer}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "36px" }}>👤</span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
            {player.strPlayer}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 16px" }}>
            {player.strPosition && <span>{player.strPosition} · </span>}
            {player.strTeam && (
              <Link href={`/equipe/${player.idTeam}`}
                style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                {player.strTeam}
              </Link>
            )}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {player.strNationality && <Stat label={t("nationality")} value={player.strNationality} />}
            {player.dateBorn && <Stat label={t("birth")} value={new Date(player.dateBorn).toLocaleDateString("fr-FR")} />}
            {player.strHeight && <Stat label={t("height")} value={player.strHeight} />}
            {player.strWeight && <Stat label={t("weight")} value={player.strWeight} />}
          </div>
        </div>
      </div>

      {(player.strDescriptionFR || player.strDescriptionEN) && (
        <div style={{
          background: "#fff", borderRadius: "12px",
          border: "1px solid #f1f5f9", padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <h2 style={{
            fontSize: "13px", fontWeight: 700, color: "#94a3b8",
            letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px",
          }}>
            {t("biography")}
          </h2>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#475569", margin: 0 }}>
            {lang === "en" && player.strDescriptionEN
              ? player.strDescriptionEN
              : player.strDescriptionFR || player.strDescriptionEN}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "8px 12px", minWidth: "80px" }}>
      <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{value}</div>
    </div>
  );
}