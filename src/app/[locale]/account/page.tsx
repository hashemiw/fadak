import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccountView from "@/components/account/AccountView";
import { account } from "@/data/account-i18n";
import { isLocale, localizedMetadata } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const t = account(locale);
  return { ...localizedMetadata(locale, "/account", t.title, t.intro), robots: { index: false, follow: false } };
}
export default async function Page({ params }: Props) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const t = account(locale);
  return <div className="wrap"><div className="page-head"><h1>{t.title}</h1><p className="lead">{t.intro}</p></div><div style={{ paddingBottom: 96 }}><AccountView locale={locale} /></div></div>;
}
