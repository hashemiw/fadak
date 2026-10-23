import { gallery as source, type GalleryItem, type Category } from "./gallery";
import translations from "./gallery-en.json";
export type { GalleryItem, PublicGalleryItem, Category } from "./gallery";
export const categories: Record<Category, string> = { office: "Workplaces", reception: "Office & commercial", residential: "Residential", decor: "Interior details" };
// Only editorial fields are overridden. Identity, provenance, flags and asset paths remain canonical.
export const gallery: GalleryItem[] = source.map(item => ({ ...item, ...translations[item.id as keyof typeof translations] }));
export const getItem = (slug: string) => gallery.find(item => item.slug === slug);
