import { Suspense } from 'react'
import SportDayClient from '../components/SportDayClient'

export default function BasketballPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Chargement...</div>}>
      <SportDayClient sport="Basketball" sportLabel="Basketball" emoji="🏀" />
    </Suspense>
  )
}