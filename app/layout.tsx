import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import { LangProvider } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SportScores — Résultats et scores en direct',
  description: 'Scores en direct, résultats et classements football, tennis et basketball. Champions League, Ligue 1, Premier League et plus.',
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
                <div className="scroll-inner">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </LangProvider>
      </body>
    </html>
  )
}