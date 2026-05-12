import { Suspense } from 'react'
import TennisClient from './TennisClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tennis',
  description: 'Scores en direct et résultats tennis — ATP, WTA, Grand Chelem. Suivez tous les matchs en temps réel sur NyxScores.',
  openGraph: { title: 'Tennis | NyxScores', description: 'Scores et résultats tennis en direct.' },
}

export default function TennisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Chargement...</div>}>
      <TennisClient />
    </Suspense>
  )
}