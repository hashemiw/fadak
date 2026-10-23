import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseView from "@/components/account/CaseView";
import { account } from "@/data/account-i18n";
import { isLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string; id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  return { title: { absolute: `${account(locale).admin.title} | ${locale === "fa" ? "آتلیه فدک" : "Fadak Atelier"}` }, robots: { index: false, follow: false } };
}
export default async function Page({ params }: Props) {
  const { locale, id } = await params; if (!isLocale(locale)) notFound();
  if (!/^\d+$/.test(id)) notFound();
  return <div className="wrap"><div className="page-head"><h1>{account(locale).admin.title}</h1></div><div style={{ paddingBottom: 96 }}><CaseView locale={locale} id={id} mode="admin" /></div></div>;
}
