import Fa from "@/views/fa/Services";
import En from "@/views/en/Services";
import { isLocale, localizedMetadata } from "@/lib/i18n";
import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return localizedMetadata(locale, "/services", locale === "fa" ? "خدمات" : "Services", locale === "fa" ? "طراحی داخلی، اجرای دکوراسیون و ساخت سفارشی چوبی." : "Interior design, fit-out, cabinetry and bespoke woodwork tailored to your space.");
}
export default async function Page({ params }: Props) {
 const { locale } = await params; if (!isLocale(locale)) notFound();
 return locale === "fa" ? <Fa /> : <En />;
}
