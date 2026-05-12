import { Suspense } from "react"
import type { Metadata } from "next"
import BasketLeagueClient from "./BasketLeagueClient"
import MatchSkeleton from "@/app/components/MatchSkeleton"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const name = decodeURIComponent(slug)
  const title = `${name} — Basketball`
  const desc = `Scores en direct, résultats et classement ${name} sur NyxScores.`
  return { title, description: desc, openGraph: { title: `${title} | NyxScores`, description: desc } }
}

// Revalidation toutes les 5 min — ISR pour les pages de ligues basketball
export const revalidate = 300

export default async function BasketLeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const leagueName = decodeURIComponent(slug)
  return (
    <Suspense fallback={<MatchSkeleton />}>
      <BasketLeagueClient leagueName={leagueName} />
    </Suspense>
  )
}
