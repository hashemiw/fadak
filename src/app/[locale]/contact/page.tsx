import Fa from "@/views/fa/Contact";
import En from "@/views/en/Contact";
import { isLocale, localizedMetadata } from "@/lib/i18n";
import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return localizedMetadata(locale, "/contact", locale === "fa" ? "تماس" : "Contact", locale === "fa" ? "درخواست مشاوره طراحی داخلی و ساخت سفارشی." : "Discuss your interior or bespoke woodwork needs with Fadak Atelier.");
}
export default async function Page({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return locale === "fa" ? <Fa /> : <En />;
}
