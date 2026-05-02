import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import { LangProvider } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sport Scores',
  description: 'Résultats et classements sportifs',
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
          </div>
        </LangProvider>
        <Analytics />
      </body>
    </html>
  )
}