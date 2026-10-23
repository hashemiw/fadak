import Link from "next/link";
import Image from "next/image";
import Card from "@/components/en/Card";
import { gallery } from "@/data/gallery-en";
import { areas, brand, galleryIntro, process, services } from "@/data/site-en";

export default function Home() {
  const hero = gallery.find((g) => g.id === "b1-13")!;
  const featured = gallery.filter((g) => g.featured);
  return (
    <>
      <section className="wrap hero">
        <div className="rise">
          <p className="eyebrow">INTERIORS / WOODWORK / DETAIL</p>
          <h1>Considered spaces.<br />Made personal.</h1>
          <p>{brand.tagline}</p>
          <p className="lead">{brand.intro}</p>
          <div className="actions">
            <Link href="/en/gallery" className="btn">Explore the gallery</Link>
            <Link href="/en/contact" className="btn ghost">Discuss your space</Link>
          </div>
        </div>
        <figure>
          <Image src={hero.imagePath} alt={hero.alt} width={hero.width} height={hero.height} priority sizes="(max-width: 860px) 90vw, 440px" />
        <figcaption>REFERENCE STUDY — KITCHEN &amp; CABINETRY</figcaption></figure>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="eyebrow">Spaces & details</p>
              <h2 className="h2">A study in space</h2>
              <p className="lead">{galleryIntro}</p>
            </div>
            <Link href="/en/gallery" className="link">View the collection</Link>
          </div>
          <div className="masonry">
            {featured.map((i) => <Card key={i.id} item={i} sizes="(max-width: 480px) 100vw, (max-width: 900px) 50vw, 400px" />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 32 }}>Spaces we work with</h2>
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
            <h2 className="h2">Services</h2>
            <Link href="/en/services" className="link">Explore our services</Link>
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
            <p className="eyebrow">About the atelier</p>
            <h2 className="h2">From first idea to final detail</h2>
          </div>
          <div>
            <p>Fadak Atelier works across interior design, fit-out and bespoke woodwork for homes, workplaces and commercial spaces.</p>
            <p><Link href="/en/about" className="link">Discover the atelier</Link></p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 32 }}>How we work</h2>
          <ol className="steps">
            {process.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="section cta-band">
        <div className="wrap">
          <h2 className="h2">What could your space become?</h2>
          <p>Tell us about your space and what you have in mind.</p>
          <Link href="/en/contact" className="btn">Start a conversation</Link>
        </div>
      </section>
    </>
  );
}
