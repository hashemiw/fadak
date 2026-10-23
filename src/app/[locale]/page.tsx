import Fa from "@/views/fa/Home";
import En from "@/views/en/Home";
import { isLocale, localizedMetadata } from "@/lib/i18n";
import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return localizedMetadata(locale, "", locale === "fa" ? "خانه" : "Home", locale === "fa" ? "طراحی داخلی و ساخت سفارشی سازه‌های چوبی." : "Considered interiors and bespoke woodwork in Tehran, Karaj, Qom, Qazvin and Mazandaran.");
}
export default async function Page({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return locale === "fa" ? <Fa /> : <En />;
}
