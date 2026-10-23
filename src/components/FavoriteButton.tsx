"use client";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import type { Locale } from "@/lib/i18n";

export default function FavoriteButton({ id, locale }: { id: string; locale: Locale }) {
  const on = useFavorites().includes(id);
  const label = locale === "fa" ? (on ? "حذف از ذخیره‌شده‌ها" : "ذخیره برای مشاوره") : (on ? "Remove from saved" : "Save for consultation");
  return (
    <button type="button" className="fav" aria-pressed={on} aria-label={label} title={label} onClick={() => toggleFavorite(id)}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5 4.2 12.9a4.7 4.7 0 0 1 6.6-6.7l1.2 1.2 1.2-1.2a4.7 4.7 0 0 1 6.6 6.7z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
    </button>
  );
}
