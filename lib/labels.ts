// ─── Labels centralisés — statuts de match et noms de pays ─────────────────
// Tout texte affiché à l'utilisateur doit passer par ces fonctions.
// Ajouter ici si un libellé manque → automatiquement appliqué partout.

export const STATUS_LABELS: Record<string, { fr: string; en: string }> = {
  "NS":             { fr: "À venir",     en: "NS" },
  "1H":             { fr: "1MT",         en: "1H" },
  "HT":             { fr: "MT",          en: "HT" },
  "2H":             { fr: "2MT",         en: "2H" },
  "ET":             { fr: "Prol.",       en: "ET" },
  "P":              { fr: "TAB",         en: "PEN" },
  "Match Finished": { fr: "FT",          en: "FT" },
  "FT-ET":          { fr: "Ap. prol.",   en: "AET" },
  "FT-P":           { fr: "Ap. pén.",    en: "AET Pen" },
  "Postponed":      { fr: "Reporté",     en: "Postponed" },
  "Cancelled":      { fr: "Annulé",      en: "Cancelled" },
  "Suspended":      { fr: "Suspendu",    en: "Suspended" },
  "Awarded":        { fr: "Forfait",     en: "Awarded" },
  "Interrupted":    { fr: "Interrompu",  en: "Interrupted" },
  "Abandoned":      { fr: "Abandonné",   en: "Abandoned" },
  "Not covered":    { fr: "Non couvert", en: "Not covered" },
}

export const COUNTRY_NAMES: Record<string, string> = {
  // Europe
  "England":          "Angleterre",
  "France":           "France",
  "Spain":            "Espagne",
  "Germany":          "Allemagne",
  "Italy":            "Italie",
  "Portugal":         "Portugal",
  "Netherlands":      "Pays-Bas",
  "Belgium":          "Belgique",
  "Scotland":         "Écosse",
  "Turkey":           "Turquie",
  "Switzerland":      "Suisse",
  "Austria":          "Autriche",
  "Poland":           "Pologne",
  "Denmark":          "Danemark",
  "Sweden":           "Suède",
  "Norway":           "Norvège",
  "Finland":          "Finlande",
  "Romania":          "Roumanie",
  "Hungary":          "Hongrie",
  "Ireland":          "Irlande",
  "Northern Ireland": "Irlande du Nord",
  "Wales":            "Pays de Galles",
  "Czech Republic":   "Rép. Tchèque",
  "Slovakia":         "Slovaquie",
  "Slovenia":         "Slovénie",
  "Croatia":          "Croatie",
  "Serbia":           "Serbie",
  "Bosnia":           "Bosnie",
  "Montenegro":       "Monténégro",
  "North Macedonia":  "Macédoine du Nord",
  "Albania":          "Albanie",
  "Kosovo":           "Kosovo",
  "Greece":           "Grèce",
  "Bulgaria":         "Bulgarie",
  "Ukraine":          "Ukraine",
  "Russia":           "Russie",
  "Belarus":          "Biélorussie",
  "Moldova":          "Moldova",
  "Georgia":          "Géorgie",
  "Armenia":          "Arménie",
  "Azerbaijan":       "Azerbaïdjan",
  "Cyprus":           "Chypre",
  "Malta":            "Malte",
  "Luxembourg":       "Luxembourg",
  "Iceland":          "Islande",
  "Latvia":           "Lettonie",
  "Lithuania":        "Lituanie",
  "Estonia":          "Estonie",
  "Faroe Islands":    "Îles Féroé",
  "Gibraltar":        "Gibraltar",
  "Andorra":          "Andorre",
  "San Marino":       "Saint-Marin",
  "Liechtenstein":    "Liechtenstein",
  // Moyen-Orient / Asie Centrale
  "Saudi Arabia":     "Arabie Saoudite",
  "Qatar":            "Qatar",
  "Iraq":             "Irak",
  "Iran":             "Iran",
  "Kuwait":           "Koweït",
  "Bahrain":          "Bahreïn",
  "Oman":             "Oman",
  "Jordan":           "Jordanie",
  "Lebanon":          "Liban",
  "Syria":            "Syrie",
  "Israel":           "Israël",
  "United Arab Emirates": "Émirats arabes unis",
  "Kazakhstan":       "Kazakhstan",
  "Uzbekistan":       "Ouzbékistan",
  "Tajikistan":       "Tadjikistan",
  "Kyrgyzstan":       "Kirghizistan",
  "Turkmenistan":     "Turkménistan",
  // Asie / Pacifique
  "Japan":            "Japon",
  "China":            "Chine",
  "China PR":         "Chine",
  "South Korea":      "Corée du Sud",
  "North Korea":      "Corée du Nord",
  "Australia":        "Australie",
  "India":            "Inde",
  "Pakistan":         "Pakistan",
  "Bangladesh":       "Bangladesh",
  "Vietnam":          "Vietnam",
  "Thailand":         "Thaïlande",
  "Indonesia":        "Indonésie",
  "Malaysia":         "Malaisie",
  "Philippines":      "Philippines",
  "Singapore":        "Singapour",
  "Myanmar":          "Myanmar",
  "Mongolia":         "Mongolie",
  "Bhutan":           "Bhoutan",
  "Taiwan":           "Taïwan",
  // Afrique
  "Egypt":            "Égypte",
  "Morocco":          "Maroc",
  "Tunisia":          "Tunisie",
  "Algeria":          "Algérie",
  "Libya":            "Libye",
  "Senegal":          "Sénégal",
  "Nigeria":          "Nigéria",
  "Ghana":            "Ghana",
  "Ivory Coast":      "Côte d'Ivoire",
  "Cameroon":         "Cameroun",
  "Mali":             "Mali",
  "Burkina Faso":     "Burkina Faso",
  "Tanzania":         "Tanzanie",
  "Uganda":           "Ouganda",
  "Ethiopia":         "Éthiopie",
  "Kenya":            "Kenya",
  "South Africa":     "Afrique du Sud",
  "Zimbabwe":         "Zimbabwe",
  "Zambia":           "Zambie",
  "Rwanda":           "Rwanda",
  "Gambia":           "Gambie",
  "Mauritania":       "Mauritanie",
  "Gabon":            "Gabon",
  "Liberia":          "Libéria",
  "Congo DR":         "RD Congo",
  "Eswatini":         "Eswatini",
  // Amériques
  "Brazil":           "Brésil",
  "Argentina":        "Argentine",
  "Mexico":           "Mexique",
  "USA":              "États-Unis",
  "Colombia":         "Colombie",
  "Ecuador":          "Équateur",
  "Bolivia":          "Bolivie",
  "Paraguay":         "Paraguay",
  "Peru":             "Pérou",
  "Chile":            "Chili",
  "Venezuela":        "Venezuela",
  "Uruguay":          "Uruguay",
  "Canada":           "Canada",
  "Costa Rica":       "Costa Rica",
  "Honduras":         "Honduras",
  "Guatemala":        "Guatemala",
  "Panama":           "Panamá",
  "El Salvador":      "El Salvador",
  "Nicaragua":        "Nicaragua",
  "Cuba":             "Cuba",
  "Jamaica":          "Jamaïque",
  "Haiti":            "Haïti",
  "Trinidad and Tobago": "Trinité-et-Tobago",
  "Aruba":            "Aruba",
  "Barbados":         "Barbade",
  // International
  "World":            "Monde",
  "International":    "International",
  "Europe":           "Europe",
  "South America":    "Amérique du Sud",
  "North America":    "Amérique du Nord",
  "Africa":           "Afrique",
}

// ─── Mapping Highlightly ID → TheSportsDB ID ────────────────────────────────
// Utilisé pour les pages de ligue qui récupèrent leurs données depuis TheSportsDB.
// Les compétitions sans mapping (Conference League, UEFA Euro) seront gérées
// directement via Highlightly en Phase 2.
export const HIGHLIGHTLY_TO_SPORTSDB: Record<string, string> = {
  // Compétitions internationales
  "2486":   "4480",  // UEFA Champions League
  "3337":   "4481",  // UEFA Europa League
  // "722432" → Conference League : pas de données TheSportsDB propres (4482 = FA Cup)
  // → géré par HighlightlyLeaguePage
  "1635":   "4429",  // FIFA World Cup
  "5890":   "4496",  // Africa Cup of Nations
  "8443":   "4499",  // Copa América
  // Ligues favorites
  "33973":  "4328",  // Premier League (Angleterre)
  "67162":  "4331",  // Bundesliga (Allemagne)
  "119924": "4335",  // La Liga (Espagne)
  "52695":  "4334",  // Ligue 1 (France)
  "115669": "4332",  // Serie A (Italie)
  "75672":  "4337",  // Eredivisie (Pays-Bas)
  "80778":  "4344",  // Primeira Liga (Portugal)
  "173537": "4339",  // Süper Lig (Turquie)
}

// IDs TheSportsDB qui sont des coupes (format groupes/phases KO) → tri spécial
export const SPORTSDB_CUP_IDS = new Set(["4480", "4481", "4429", "4496", "4499"])

/** Traduit un statut de match normalisé selon la langue. */
export function translateStatus(status: string, lang: string): string {
  const entry = STATUS_LABELS[status]
  if (!entry) return status
  return lang === "fr" ? entry.fr : entry.en
}

/** Traduit un nom de pays selon la langue. */
export function translateCountry(name: string, lang: string): string {
  if (lang !== "fr") return name
  return COUNTRY_NAMES[name] ?? name
}
