import Fa from "@/views/fa/Detail";
import En from "@/views/en/Detail";
import { gallery, getItem } from "@/data/gallery";
import { getItem as getEnglishItem } from "@/data/gallery-en";
import { isLocale, localizedMetadata } from "@/lib/i18n";
import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string; slug: string }> };
export const generateStaticParams = () => gallery.map(item => ({ slug: item.slug }));
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const item = locale === "fa" ? getItem(slug) : getEnglishItem(slug);
  if (!item) notFound();
  return localizedMetadata(locale, `/gallery/${slug}`, item.title, item.description.slice(0, 160), item.imagePath);
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale === "fa" ? <Fa params={params} /> : <En params={params} />;
}
