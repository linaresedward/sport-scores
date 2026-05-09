import { Suspense } from "react"
import HockeyLeagueClient from "./HockeyLeagueClient"
import MatchSkeleton from "@/app/components/MatchSkeleton"

export default async function HockeyLeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const leagueName = decodeURIComponent(slug)
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <HockeyLeagueClient leagueName={leagueName} />
    </Suspense>
  )
}
