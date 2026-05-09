import { Suspense } from "react"
import BasketLeagueClient from "./BasketLeagueClient"
import MatchSkeleton from "@/app/components/MatchSkeleton"

export default async function BasketLeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const leagueName = decodeURIComponent(slug)
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <BasketLeagueClient leagueName={leagueName} />
    </Suspense>
  )
}
