"use client";
import { usePathname } from "next/navigation";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const fa = usePathname().startsWith("/fa");
  return <div className="wrap page-head"><h1>{fa ? "بارگذاری صفحه انجام نشد" : "This page could not load"}</h1>
    <button className="btn" onClick={reset}>{fa ? "تلاش دوباره" : "Try again"}</button></div>;
}
