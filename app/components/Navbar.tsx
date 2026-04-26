'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const linkClass = (href: string) =>
    pathname === href
      ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-0.5'
      : 'text-slate-600 hover:text-blue-600 transition-colors'

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <span>Sport Scores</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium ml-auto">
          <Link href="/" className={linkClass('/')}>
            Resultats
          </Link>
          <Link href="/classements" className={linkClass('/classements')}>
            Classements
          </Link>
          <Link href="/equipes" className={linkClass('/equipes')}>
            Equipes
          </Link>
        </div>

      </div>
    </nav>
  )
}
