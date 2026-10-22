import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page-head" style={{ paddingBottom: 96 }}>
      <h1>صفحه پیدا نشد</h1>
      <p className="lead">نشانی را بررسی کنید یا به صفحه اصلی برگردید.</p>
      <p style={{ marginTop: 24 }}><Link href="/" className="btn">بازگشت به خانه</Link></p>
    </div>
  );
}
