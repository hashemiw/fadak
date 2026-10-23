"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
export default function NotFound() {
  const fa = usePathname().startsWith("/fa");
  return <div className="wrap page-head" style={{ paddingBottom: 96 }}>
    <h1>{fa ? "صفحه پیدا نشد" : "Page not found"}</h1>
    <p className="lead">{fa ? "نشانی را بررسی کنید یا به صفحه اصلی برگردید." : "Check the address or return to the home page."}</p>
    <p style={{ marginTop: 24 }}><Link href={fa ? "/fa" : "/en"} className="btn">{fa ? "بازگشت به خانه" : "Back to home"}</Link></p>
  </div>;
}
