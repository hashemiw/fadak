"use client";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand, nav } from "@/data/site";

export default function Header() {
  const path = usePathname().replace(/^\/fa(?=\/|$)/, "") || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const current = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="header">
      <div className="wrap">
        <Link href="/fa" className="brand" aria-label={`${brand.name} — صفحه اصلی`}>
          <b>{brand.name}</b>
          <small>{brand.nameEn}</small>
        </Link>
        <nav id="site-nav" className={`nav${open ? " open" : ""}`} aria-label="منوی اصلی">
          {nav.map((n) => (
            <Link key={n.href} href={`/fa${n.href === "/" ? "" : n.href}`} aria-current={current(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
          <Link href="/fa/contact" className="btn cta-m">درخواست مشاوره</Link>
        </nav>
        <Link href="/fa/contact" className="btn cta">درخواست مشاوره</Link>
        <LanguageSwitcher />
        <button className="menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? "بستن" : "منو"}
        </button>
      </div>
    </header>
  );
}
