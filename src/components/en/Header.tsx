"use client";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand, nav } from "@/data/site-en";

export default function Header() {
  const path = usePathname().replace(/^\/en(?=\/|$)/, "") || "/";
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
        <Link href="/en" className="brand" aria-label={`${brand.name} — Home`}>
          <b>{brand.name}</b>
          <small>INTERIORS &amp; BESPOKE WOODWORK</small>
        </Link>
        <nav id="site-nav" className={`nav${open ? " open" : ""}`} aria-label="Main navigation">
          {nav.map((n) => (
            <Link key={n.href} href={`/en${n.href === "/" ? "" : n.href}`} aria-current={current(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
          <Link href="/en/contact" className="btn cta-m">Start a conversation</Link>
        </nav>
        <Link href="/en/contact" className="btn cta">Start a conversation</Link>
        <LanguageSwitcher />
        <button className="menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}
