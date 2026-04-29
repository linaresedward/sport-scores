import { Suspense } from 'react'
import TeamPageClient from './TeamPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: PageProps) {
  const { id } = await params
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamPageClient teamId={id} />
      </Suspense>
    </main>
  )
}

function TeamSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 bg-gray-800 rounded-2xl" />
        <div className="flex-1">
          <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-800 rounded w-32" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  )
}