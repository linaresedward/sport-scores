import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sport Scores',
  description: 'Résultats et classements Ligue 1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={geist.className}>

        {/* NAVBAR */}
        <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-800">
              ⚽ <span>Sport Scores</span>
            </Link>

            {/* Liens de navigation */}
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600 ml-auto">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Résultats
              </Link>
              <Link href="/classements" className="hover:text-blue-600 transition-colors">
                Classements
              </Link>
              <Link href="/equipes" className="hover:text-blue-600 transition-colors">
                Équipes
              </Link>
            </div>

          </div>
        </nav>

        {/* CONTENU DE LA PAGE */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>

      </body>
    </html>
  )
}