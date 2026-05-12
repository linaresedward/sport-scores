import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import { LangProvider } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nyxscores.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NyxScores — Résultats et scores en direct',
    template: '%s | NyxScores',
  },
  description: 'Scores en direct, résultats et classements football, hockey, basketball. Champions League, Ligue 1, Premier League et plus.',
  keywords: ['scores en direct', 'résultats sport', 'NBA', 'NHL', 'football', 'Ligue 1', 'Premier League'],
  openGraph: {
    type: 'website',
    siteName: 'NyxScores',
    title: 'NyxScores — Résultats et scores en direct',
    description: 'Scores en direct, résultats et classements football, hockey, basketball.',
    locale: 'fr_FR',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NyxScores — Résultats et scores en direct',
    description: 'Scores en direct, résultats et classements football, hockey, basketball.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={geist.className}>
        <LangProvider>
          <div className="app-shell">
            <Topbar />
            <div className="app-body">
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
            <BottomNav />
          </div>
        </LangProvider>
      </body>
    </html>
  )
}