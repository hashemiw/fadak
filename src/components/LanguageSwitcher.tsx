"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const target = pathname.startsWith("/fa") ? "en" : "fa";
  const path = `/${target}${pathname.replace(/^\/(en|fa)(?=\/|$)/, "")}`;
  const [suffix, setSuffix] = useState("");
  useEffect(() => {
    const update = () => setSuffix(window.location.search + window.location.hash);
    update(); window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);
  return <a className="language-switch" href={path + suffix} hrefLang={target} lang={target} dir={target === "fa" ? "rtl" : "ltr"}
    onClick={event => {
      // The form can cancel navigation if browser storage is unavailable, preserving entered text.
      const change = new Event("fadak:language-change", { cancelable: true });
      if (!window.dispatchEvent(change)) event.preventDefault();
      else event.currentTarget.href = path + window.location.search + window.location.hash;
    }}>{target === "fa" ? "فارسی" : "English"}</a>;
}
