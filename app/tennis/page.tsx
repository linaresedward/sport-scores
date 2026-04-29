import { Suspense } from 'react'
import TennisClient from './TennisClient'

export default function TennisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Chargement...</div>}>
      <TennisClient />
    </Suspense>
  )
}