import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import { LangProvider } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NyxScores — Résultats et scores en direct',
  description: 'Scores en direct, résultats et classements football, hockey, basketball. Champions League, Ligue 1, Premier League et plus. NyxScores.',
  viewport: 'width=device-width, initial-scale=1',
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