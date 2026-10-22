import Link from "next/link";
import Image from "next/image";
import Card from "@/components/Card";
import { gallery } from "@/data/gallery";
import { areas, brand, galleryIntro, process, services } from "@/data/site";

export default function Home() {
  const hero = gallery.find((g) => g.id === "b1-13")!;
  const featured = gallery.filter((g) => g.featured);
  return (
    <>
      <section className="wrap hero">
        <div className="rise">
          <p className="eyebrow ltr">{brand.nameEn}</p>
          <h1>{brand.name}</h1>
          <p>{brand.tagline}</p>
          <p className="lead">{brand.intro}</p>
          <div className="actions">
            <Link href="/gallery" className="btn">دیدن گالری</Link>
            <Link href="/contact" className="btn ghost">گفت‌وگو درباره پروژه شما</Link>
          </div>
        </div>
        <figure>
          <Image src={hero.imagePath} alt={hero.alt} width={hero.width} height={hero.height} priority sizes="(max-width: 860px) 90vw, 440px" />
        </figure>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">گالری فضاها و جزئیات</p>
              <h2 className="h2">منتخبی از فضاها</h2>
              <p className="lead">{galleryIntro}</p>
            </div>
            <Link href="/gallery" className="link">مشاهده کل گالری</Link>
          </div>
          <div className="masonry">
            {featured.map((i) => <Card key={i.id} item={i} sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 400px" />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 32 }}>زمینه‌های فعالیت</h2>
          <div className="cols3">
            {areas.map((a) => {
              const img = gallery.find((g) => g.id === a.image);
              return (
                <div className="area" key={a.title}>
                  {img && <Image src={img.imagePath} alt={img.alt} width={img.width} height={img.height} sizes="(max-width: 860px) 100vw, 400px" loading="lazy" />}
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="h2">خدمات</h2>
            <Link href="/services" className="link">جزئیات خدمات</Link>
          </div>
          <div className="svc-list">
            {services.map((s) => (
              <div className="svc" key={s.id}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap about-grid">
          <div>
            <p className="eyebrow">درباره فدک</p>
            <h2 className="h2">طراحی و ساخت، در یک مسیر</h2>
          </div>
          <div>
            <p>آتلیه فدک در زمینه طراحی داخلی، اجرای دکوراسیون و ساخت سفارشی سازه‌ها و تجهیزات چوبی فعالیت می‌کند.</p>
            <p><Link href="/about" className="link">بیشتر بخوانید</Link></p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 32 }}>مراحل همکاری</h2>
          <ol className="steps">
            {process.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="section cta-band">
        <div className="wrap">
          <h2 className="h2">برای فضای شما چه چیزی بسازیم؟</h2>
          <p>نیاز و ابعاد فضایتان را برای ما بنویسید.</p>
          <Link href="/contact" className="btn">درخواست مشاوره</Link>
        </div>
      </section>
    </>
  );
}
