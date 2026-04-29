// app/match/[id]/page.tsx
import { Suspense } from 'react'
import MatchDetailClient from './MatchDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Suspense fallback={<MatchDetailSkeleton />}>
        <MatchDetailClient matchId={id} />
      </Suspense>
    </main>
  )
}

function MatchDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="bg-gray-800 rounded-2xl h-48 mb-6" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl h-64" />
        <div className="bg-gray-800 rounded-xl h-64" />
      </div>
    </div>
  )
}