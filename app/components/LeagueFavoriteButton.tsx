"use client";

import FavoriteButton from "./FavoriteButton";

interface Props {
  id: string;
  name: string;
  logo: string;
}

export default function LeagueFavoriteButton({ id, name, logo }: Props) {
  return (
    <FavoriteButton
      item={{ id, type: "league", name, logo }}
      size="md"
    />
  );
}