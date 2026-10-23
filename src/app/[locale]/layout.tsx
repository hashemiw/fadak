import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import HeaderFa from "@/components/Header";
import FooterFa from "@/components/Footer";
import HeaderEn from "@/components/en/Header";
import FooterEn from "@/components/en/Footer";
import { brand } from "@/data/site";
import { isLocale, locales } from "@/lib/i18n";
import { contact } from "@/data/contact";
import { siteUrl } from "@/lib/site";

export const generateStaticParams = () => locales.map(locale => ({ locale }));
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const name = locale === "fa" ? brand.name : brand.nameEn;
  return { metadataBase: new URL(siteUrl), title: { default: name, template: `%s | ${name}` } };
}
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const fa = locale === "fa";
  return <html lang={locale} dir={fa ? "rtl" : "ltr"}>
    <head>{fa ? <>
      <link rel="preload" href="/fonts/Vazirmatn-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/Vazirmatn-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </> : <link rel="preload" href="/fonts/Manrope-Variable.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />}</head>
    <body><a className="skip" href="#main">{fa ? "پرش به محتوا" : "Skip to content"}</a>
      {fa ? <HeaderFa /> : <HeaderEn />}<main id="main">{children}</main>{fa ? <FooterFa /> : <FooterEn />}
      {contact.whatsapp && <a className="wa-float" href={`https://wa.me/${contact.whatsapp}`} rel="noopener">{fa ? "واتساپ" : "WhatsApp"}</a>}
    </body>
  </html>;
}
