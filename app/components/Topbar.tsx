'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SPORTS = [
  { label: 'Football', icon: '⚽', href: '/' },
  { label: 'Tennis', icon: '🎾', href: '/tennis' },
  { label: 'Basketball', icon: '🏀', href: '/basketball' },
]

export default function Topbar() {
  const pathname = usePathname()

  const activeSport =
    pathname.startsWith('/tennis') ? '/tennis' :
    pathname.startsWith('/basketball') ? '/basketball' :
    '/'

  return (
    <header className="topbar">
      <div className="topbar__logo">
        <div className="topbar__logo-dot" />
        <span>SportScores</span>
      </div>
      <nav className="topbar__sports">
        {SPORTS.map(sport => (
          <Link
            key={sport.href}
            href={sport.href}
            className={`topbar__sport-tab ${activeSport === sport.href ? 'topbar__sport-tab--active' : ''}`}
          >
            <span className="topbar__sport-icon">{sport.icon}</span>
            {sport.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}