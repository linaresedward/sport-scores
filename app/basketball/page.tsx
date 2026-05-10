import { Suspense } from 'react'
import BasketballHLClient from './BasketballHLClient'
import MatchSkeleton from '@/app/components/MatchSkeleton'

export const metadata = {
  title: 'Basketball — NyxScores',
  description: 'Scores en direct NBA, LNB, ACB et toutes les ligues de basketball.',
}

export default function BasketballPage() {
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <BasketballHLClient />
    </Suspense>
  )
}