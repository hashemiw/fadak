import Fa from "@/views/fa/Gallery";
import En from "@/views/en/Gallery";
import { isLocale, localizedMetadata } from "@/lib/i18n";
import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return localizedMetadata(locale, "/gallery", locale === "fa" ? "گالری فضاها و جزئیات" : "Spaces & details", locale === "fa" ? "تصاویر مرجع برای آشنایی با سبک‌ها و زمینه‌های طراحی." : "Explore reference interiors and details. These images are not completed Fadak Atelier projects.");
}
export default async function Page({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return locale === "fa" ? <Fa /> : <En />;
}
