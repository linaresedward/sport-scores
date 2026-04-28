// app/components/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LEAGUES = [
  {
    continent: 'Europe',
    leagues: [
      { label: 'Ligue 1',       code: 'FR', href: '/ligue/ligue-1' },
      { label: 'Premier League',code: 'EN', href: '/ligue/premier-league' },
      { label: 'La Liga',       code: 'ES', href: '/ligue/la-liga' },
      { label: 'Bundesliga',    code: 'DE', href: '/ligue/bundesliga' },
      { label: 'Serie A',       code: 'IT', href: '/ligue/serie-a' },
      { label: 'Eredivisie',    code: 'NL', href: '/ligue/eredivisie' },
      { label: 'Liga Portugal', code: 'PT', href: '/ligue/liga-portugal' },
      { label: 'Pro League',    code: 'BE', href: '/ligue/pro-league' },
      { label: 'Super Lig',     code: 'TR', href: '/ligue/super-lig' },
      { label: 'Premier Liga',  code: 'RU', href: '/ligue/premier-liga' },
      { label: 'Ekstraklasa',   code: 'PL', href: '/ligue/ekstraklasa' },
      { label: 'Super League',  code: 'GR', href: '/ligue/super-league-grece' },
      { label: 'Liga 1',        code: 'RO', href: '/ligue/liga-1-roumanie' },
      { label: 'Premiership',   code: 'SC', href: '/ligue/premiership-ecosse' },
      { label: 'Championship',  code: 'EN', href: '/ligue/championship' },
    ]
  },
  {
    continent: 'Amériques',
    leagues: [
      { label: 'MLS',             code: 'US', href: '/ligue/mls' },
      { label: 'Brasileirão',     code: 'BR', href: '/ligue/brasileirao' },
      { label: 'Primera División',code: 'AR', href: '/ligue/primera-division' },
      { label: 'Liga MX',         code: 'MX', href: '/ligue/liga-mx' },
      { label: 'Liga Betplay',    code: 'CO', href: '/ligue/liga-betplay' },
      { label: 'Primera Chile',   code: 'CL', href: '/ligue/primera-chile' },
      { label: 'Liga 1',          code: 'PE', href: '/ligue/liga-1-perou' },
      { label: 'Canadian Premier',code: 'CA', href: '/ligue/canadian-premier' },
    ]
  },
  {
    continent: 'Asie',
    leagues: [
      { label: 'Saudi Pro League', code: 'SA', href: '/ligue/saudi-pro-league' },
      { label: 'J1 League',        code: 'JP', href: '/ligue/j1-league' },
      { label: 'K League 1',       code: 'KR', href: '/ligue/k-league' },
      { label: 'Super League',     code: 'CN', href: '/ligue/super-league-chine' },
      { label: 'Persian Gulf Pro', code: 'IR', href: '/ligue/persian-gulf' },
      { label: 'UAE Pro League',   code: 'AE', href: '/ligue/uae-pro-league' },
      { label: 'Indian Super',     code: 'IN', href: '/ligue/indian-super' },
      { label: 'A-League',         code: 'AU', href: '/ligue/a-league' },
    ]
  },
  {
    continent: 'Afrique',
    leagues: [
      { label: 'NPFL',           code: 'NG', href: '/ligue/npfl' },
      { label: 'Premier League', code: 'ZA', href: '/ligue/premier-league-afrique-du-sud' },
      { label: 'Botola Pro',     code: 'MA', href: '/ligue/botola-pro' },
      { label: 'Premier League', code: 'GH', href: '/ligue/premier-league-ghana' },
      { label: 'Ligue Pro',      code: 'DZ', href: '/ligue/ligue-pro-algerie' },
      { label: 'Ligue 1',        code: 'TN', href: '/ligue/ligue-1-tunisie' },
      { label: 'Premier League', code: 'EG', href: '/ligue/premier-league-egypte' },
    ]
  },
  {
    continent: 'Compétitions',
    leagues: [
      { label: 'Champions League',  code: 'UCL', href: '/ligue/champions-league' },
      { label: 'Europa League',     code: 'UEL', href: '/ligue/europa-league' },
      { label: 'Conférence League', code: 'ECL', href: '/ligue/conference-league' },
      { label: 'Copa Libertadores', code: 'LIB', href: '/ligue/copa-libertadores' },
      { label: 'Copa Sudamericana', code: 'SUD', href: '/ligue/copa-sudamericana' },
      { label: 'AFC Champions',     code: 'AFC', href: '/ligue/afc-champions' },
      { label: 'CAF Champions',     code: 'CAF', href: '/ligue/caf-champions' },
      { label: 'CONCACAF CL',       code: 'CCL', href: '/ligue/concacaf-cl' },
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
          {group.leagues.map(league => {
            const isActive = pathname === league.href
            return (
              <Link
                key={league.href}
                href={league.href}
                className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
              >
                {/* Code pays en texte — compatible Windows */}
                <span className="sidebar__flag sidebar__flag--code">
                  {league.code}
                </span>
                <span>{league.label}</span>
              </Link>
            )
          })}
        </div>
      ))}

      <div className="sidebar__section">
        <p className="sidebar__title">Mon site</p>
        <Link
          href="/classements"
          className={`sidebar__item ${pathname === '/classements' ? 'sidebar__item--active' : ''}`}
        >
          <span className="sidebar__flag sidebar__flag--code">📊</span>
          <span>Classements</span>
        </Link>
        <Link
          href="/equipes"
          className={`sidebar__item ${pathname === '/equipes' ? 'sidebar__item--active' : ''}`}
        >
          <span className="sidebar__flag sidebar__flag--code">👥</span>
          <span>Équipes</span>
        </Link>
      </div>
    </aside>
  )
}