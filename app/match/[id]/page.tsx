import { Suspense } from 'react'
import MatchDetailClient from './MatchDetailClient'
import MatchDetailHighlightly from './MatchDetailHighlightly'

interface PageProps {
  params: Promise<{ id: string }>
}

function isHighlightlyId(id: string): boolean {
  return /^\d+$/.test(id)
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params
  const useHighlightly = isHighlightlyId(id)

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Suspense fallback={<MatchDetailSkeleton />}>
        {useHighlightly
          ? <MatchDetailHighlightly matchId={id} />
          : <MatchDetailClient matchId={id} />
        }
      </Suspense>
    </main>
  )
}

function MatchDetailSkeleton() {
  return (
    <div style={{ maxWidth: 896, margin: "0 auto", padding: "32px 16px", animation: "shimmer 1.6s ease-in-out infinite" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
      <div style={{ background: "var(--bg-surface)", borderRadius: 16, height: 192, marginBottom: 16, border: "1px solid var(--border)" }} />
      <div style={{ background: "var(--bg-surface)", borderRadius: 12, height: 256, border: "1px solid var(--border)" }} />
    </div>
  )
}