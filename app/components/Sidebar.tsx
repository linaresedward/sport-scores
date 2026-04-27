'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LEAGUES = [
  {
    continent: 'Europe',
    leagues: [
      { label: 'Ligue 1', flag: '🇫🇷', href: '/' },
      { label: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', href: '/ligue/premier-league' },
      { label: 'La Liga', flag: '🇪🇸', href: '/ligue/la-liga' },
      { label: 'Bundesliga', flag: '🇩🇪', href: '/ligue/bundesliga' },
      { label: 'Serie A', flag: '🇮🇹', href: '/ligue/serie-a' },
      { label: 'Eredivisie', flag: '🇳🇱', href: '/ligue/eredivisie' },
      { label: 'Liga Portugal', flag: '🇵🇹', href: '/ligue/liga-portugal' },
      { label: 'Pro League', flag: '🇧🇪', href: '/ligue/pro-league' },
      { label: 'Super Lig', flag: '🇹🇷', href: '/ligue/super-lig' },
      { label: 'Premier Liga', flag: '🇷🇺', href: '/ligue/premier-liga' },
      { label: 'Ekstraklasa', flag: '🇵🇱', href: '/ligue/ekstraklasa' },
      { label: 'Super League', flag: '🇬🇷', href: '/ligue/super-league-grece' },
      { label: 'Liga 1', flag: '🇷🇴', href: '/ligue/liga-1-roumanie' },
      { label: 'Premiership', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', href: '/ligue/premiership-ecosse' },
      { label: 'Championship', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', href: '/ligue/championship' },
    ]
  },
  {
    continent: 'Amériques',
    leagues: [
      { label: 'MLS', flag: '🇺🇸', href: '/ligue/mls' },
      { label: 'Brasileirão', flag: '🇧🇷', href: '/ligue/brasileirao' },
      { label: 'Primera División', flag: '🇦🇷', href: '/ligue/primera-division' },
      { label: 'Liga MX', flag: '🇲🇽', href: '/ligue/liga-mx' },
      { label: 'Liga Betplay', flag: '🇨🇴', href: '/ligue/liga-betplay' },
      { label: 'Primera División', flag: '🇨🇱', href: '/ligue/primera-chile' },
      { label: 'Liga 1', flag: '🇵🇪', href: '/ligue/liga-1-perou' },
      { label: 'Canadian Premier', flag: '🇨🇦', href: '/ligue/canadian-premier' },
    ]
  },
  {
    continent: 'Asie',
    leagues: [
      { label: 'Saudi Pro League', flag: '🇸🇦', href: '/ligue/saudi-pro-league' },
      { label: 'J1 League', flag: '🇯🇵', href: '/ligue/j1-league' },
      { label: 'K League 1', flag: '🇰🇷', href: '/ligue/k-league' },
      { label: 'Super League', flag: '🇨🇳', href: '/ligue/super-league-chine' },
      { label: 'Persian Gulf Pro', flag: '🇮🇷', href: '/ligue/persian-gulf' },
      { label: 'UAE Pro League', flag: '🇦🇪', href: '/ligue/uae-pro-league' },
      { label: 'Indian Super', flag: '🇮🇳', href: '/ligue/indian-super' },
      { label: 'A-League', flag: '🇦🇺', href: '/ligue/a-league' },
    ]
  },
  {
    continent: 'Afrique',
    leagues: [
      { label: 'NPFL', flag: '🇳🇬', href: '/ligue/npfl' },
      { label: 'Premier League', flag: '🇿🇦', href: '/ligue/premier-league-afrique-du-sud' },
      { label: 'Botola Pro', flag: '🇲🇦', href: '/ligue/botola-pro' },
      { label: 'Premier League', flag: '🇬🇭', href: '/ligue/premier-league-ghana' },
      { label: 'Ligue Pro', flag: '🇩🇿', href: '/ligue/ligue-pro-algerie' },
      { label: 'Ligue 1', flag: '🇹🇳', href: '/ligue/ligue-1-tunisie' },
      { label: 'Premier League', flag: '🇪🇬', href: '/ligue/premier-league-egypte' },
    ]
  },
  {
    continent: 'Compétitions',
    leagues: [
      { label: 'Champions League', flag: '🏆', href: '/ligue/champions-league' },
      { label: 'Europa League', flag: '🥈', href: '/ligue/europa-league' },
      { label: 'Conférence League', flag: '🥉', href: '/ligue/conference-league' },
      { label: 'Copa Libertadores', flag: '🌎', href: '/ligue/copa-libertadores' },
      { label: 'Copa Sudamericana', flag: '🌎', href: '/ligue/copa-sudamericana' },
      { label: 'AFC Champions', flag: '🌏', href: '/ligue/afc-champions' },
      { label: 'CAF Champions', flag: '🌍', href: '/ligue/caf-champions' },
      { label: 'CONCACAF CL', flag: '🌎', href: '/ligue/concacaf-cl' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="sidebar">
      {LEAGUES.map(group => (
        <div key={group.continent} className="sidebar__section">
          <p className="sidebar__title">{group.continent}</p>
          {group.leagues.map(league => (
            <Link
              key={league.href}
              href={league.href}
              className={`sidebar__item ${pathname === league.href ? 'sidebar__item--active' : ''}`}
            >
              <span className="sidebar__flag">{league.flag}</span>
              <span>{league.label}</span>
            </Link>
          ))}
        </div>
      ))}

      <div className="sidebar__section">
        <p className="sidebar__title">Mon site</p>
        <Link
          href="/classements"
          className={`sidebar__item ${pathname === '/classements' ? 'sidebar__item--active' : ''}`}
        >
          <span className="sidebar__flag">📊</span>
          <span>Classements</span>
        </Link>
        <Link
          href="/equipes"
          className={`sidebar__item ${pathname === '/equipes' ? 'sidebar__item--active' : ''}`}
        >
          <span className="sidebar__flag">👥</span>
          <span>Équipes</span>
        </Link>
      </div>
    </aside>
  )
}