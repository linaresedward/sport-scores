import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Navbar from './components/Navbar'
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
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  )
}