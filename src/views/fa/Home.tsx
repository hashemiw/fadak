import Link from "next/link";
import Image from "next/image";
import Card from "@/components/Card";
import { getGallery, getSite } from "@/lib/content";

export default async function Home() {
  const gallery = await getGallery("fa");
  const site = await getSite("fa");
  const hero = gallery.find((g) => g.id === site.hero.imageId && !g.watermark) ?? gallery.find((g) => !g.watermark) ?? gallery[0];
  const featured = gallery.filter((g) => g.featured);
  return (
    <>
      <section className="wrap hero">
        <div className="rise">
          <p className="eyebrow">{site.hero.eyebrow}</p>
          <h1>{site.hero.headline.map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}</h1>
          <p>{site.tagline}</p>
          <p className="lead">{site.intro}</p>
          <div className="actions">
            <Link href="/fa/gallery" className="btn">دیدن گالری</Link>
            <Link href="/fa/contact" className="btn ghost">گفت‌وگو درباره پروژه شما</Link>
          </div>
        </div>
        {hero && <figure>
          <Image src={hero.imagePath} alt={hero.alt} width={hero.width} height={hero.height} priority sizes="(max-width: 860px) 90vw, 440px" />
          <figcaption>{site.hero.caption}</figcaption>
        </figure>}
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">گالری فضاها و جزئیات</p>
              <h2 className="h2">منتخبی از فضاها</h2>
              <p className="lead">{site.galleryIntro}</p>
            </div>
            <Link href="/fa/gallery" className="link">مشاهده کل گالری</Link>
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
            {site.areas.map((a) => {
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
            <Link href="/fa/services" className="link">جزئیات خدمات</Link>
          </div>
          <div className="svc-list">
            {site.services.map((s) => (
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
            <p>{site.about.lead}</p>
            <p><Link href="/fa/about" className="link">بیشتر بخوانید</Link></p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 32 }}>مراحل همکاری</h2>
          <ol className="steps">
            {site.process.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="section cta-band">
        <div className="wrap">
          <h2 className="h2">برای فضای شما چه چیزی بسازیم؟</h2>
          <p>نیاز و ابعاد فضایتان را برای ما بنویسید.</p>
          <Link href="/fa/contact" className="btn">درخواست مشاوره</Link>
        </div>
      </section>
    </>
  );
}
