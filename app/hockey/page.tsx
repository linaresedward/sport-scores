import { Suspense } from 'react'
import HockeyClient from './HockeyClient'
import MatchSkeleton from '@/app/components/MatchSkeleton'

export const metadata = {
  title: 'Hockey sur glace — SportScores',
  description: 'Scores en direct NHL, AHL, KHL et toutes les ligues de hockey sur glace.',
}

export default function HockeyPage() {
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <HockeyClient />
    </Suspense>
  )
}
