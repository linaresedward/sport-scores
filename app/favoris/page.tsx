import type { Metadata } from 'next'
import FavorisClient from "./FavorisClient";

export const metadata: Metadata = {
  title: 'Favoris',
  description: 'Vos équipes et ligues favorites — suivez vos sports préférés sur NyxScores.',
  robots: { index: false, follow: false },
}

export default function FavorisPage() {
  return <FavorisClient />;
}