import { Suspense } from "react"
import type { Metadata } from "next"
import HockeyLeagueClient from "./HockeyLeagueClient"
import MatchSkeleton from "@/app/components/MatchSkeleton"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const name = decodeURIComponent(slug)
  const title = `${name} — Hockey`
  const desc = `Scores en direct, résultats et classement ${name} sur NyxScores.`
  return { title, description: desc, openGraph: { title: `${title} | NyxScores`, description: desc } }
}

// Revalidation toutes les 5 min — ISR pour les pages de ligues hockey
export const revalidate = 300

export default async function HockeyLeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const leagueName = decodeURIComponent(slug)
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <HockeyLeagueClient leagueName={leagueName} />
    </Suspense>
  )
}
