import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
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
        <div className="app-shell">
          <Topbar />
          <div className="app-body">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}