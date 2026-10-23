import Fa from "@/views/fa/About";
import En from "@/views/en/About";
import { isLocale, localizedMetadata } from "@/lib/i18n";
import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return localizedMetadata(locale, "/about", locale === "fa" ? "درباره فدک" : "About the atelier", locale === "fa" ? "آشنایی با آتلیه فدک و روش همکاری." : "Discover Fadak Atelier and our approach to design, production and installation.");
}
export default async function Page({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return locale === "fa" ? <Fa /> : <En />;
}
