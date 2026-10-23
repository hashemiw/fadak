"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

type Nav = { slug: string; title: string } | null;

// Previous/next within the gallery order; arrow keys work too unless a dialog or field has focus.
export default function PrevNext({ locale, prev, next }: { locale: Locale; prev: Nav; next: Nav }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(el.tagName) || document.querySelector("dialog[open]")) return;
      const forward = (e.key === "ArrowRight") === (locale === "en");
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const target = forward ? next : prev;
      if (target) router.push(`/${locale}/gallery/${target.slug}`);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [locale, prev, next, router]);
  const fa = locale === "fa";
  return (
    <nav className="pn" aria-label={fa ? "تصویر قبلی و بعدی" : "Previous and next image"}>
      {prev ? <Link href={`/${locale}/gallery/${prev.slug}`} rel="prev">{fa ? "→ قبلی" : "← Previous"}</Link> : <span />}
      {next ? <Link href={`/${locale}/gallery/${next.slug}`} rel="next">{fa ? "بعدی ←" : "Next →"}</Link> : <span />}
    </nav>
  );
}
