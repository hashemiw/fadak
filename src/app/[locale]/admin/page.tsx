import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminView from "@/components/account/AdminView";
import { account } from "@/data/account-i18n";
import { isLocale, localizedMetadata } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const a = account(locale).admin;
  return { ...localizedMetadata(locale, "/admin", a.title, a.intro), robots: { index: false, follow: false } };
}
export default async function Page({ params }: Props) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const a = account(locale).admin;
  return <div className="wrap"><div className="page-head"><h1>{a.title}</h1><p className="lead">{a.intro}</p></div><div style={{ paddingBottom: 96 }}><AdminView locale={locale} /></div></div>;
}
