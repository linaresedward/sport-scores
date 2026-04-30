// app/components/MatchSkeleton.tsx
export default function MatchSkeleton() {
  return (
    <div style={{ maxWidth: "672px", margin: "0 auto", padding: "0 16px" }}>
      {/* Skeleton navigation date */}
      <div style={{
        display: "flex", gap: "8px", marginBottom: "24px",
        background: "#fff", borderRadius: "12px",
        padding: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            flex: 1, height: "44px", borderRadius: "8px",
            background: i === 1 ? "#dbeafe" : "#f1f5f9",
            animation: "shimmer 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>

      {/* Skeleton ligues */}
      {[0, 1, 2].map((league) => (
        <div key={league} style={{
          background: "#fff", borderRadius: "12px",
          border: "1px solid #f1f5f9", marginBottom: "16px",
          overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {/* Header ligue */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 16px", borderBottom: "1px solid #f8fafc",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "6px",
              background: "#f1f5f9", animation: "shimmer 1.5s ease-in-out infinite",
            }} />
            <div style={{
              width: "140px", height: "14px", borderRadius: "4px",
              background: "#f1f5f9", animation: "shimmer 1.5s ease-in-out infinite",
            }} />
          </div>

          {/* Lignes de matchs */}
          {[0, 1, 2].map((match) => (
            <div key={match} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", borderBottom: "1px solid #f8fafc",
            }}>
              {/* Heure */}
              <div style={{
                width: "36px", height: "32px", borderRadius: "6px",
                background: "#f8fafc", animation: "shimmer 1.5s ease-in-out infinite",
                flexShrink: 0,
              }} />
              {/* Équipes */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{
                  height: "12px", borderRadius: "4px", background: "#f1f5f9",
                  width: `${60 + Math.random() * 30}%`,
                  animation: "shimmer 1.5s ease-in-out infinite",
                }} />
                <div style={{
                  height: "12px", borderRadius: "4px", background: "#f1f5f9",
                  width: `${50 + Math.random() * 30}%`,
                  animation: "shimmer 1.5s ease-in-out infinite",
                }} />
              </div>
              {/* Score */}
              <div style={{
                width: "24px", height: "32px", borderRadius: "6px",
                background: "#f8fafc", animation: "shimmer 1.5s ease-in-out infinite",
                flexShrink: 0,
              }} />
            </div>
          ))}
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}