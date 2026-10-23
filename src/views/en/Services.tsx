import Link from "next/link";
import Image from "next/image";
import { gallery } from "@/data/gallery-en";
import { services } from "@/data/site-en";


export default function ServicesPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Services</h1>
        <p className="lead">From design to production and installation, every service is shaped around your space and its needs.</p>
      </div>
      <div style={{ paddingBottom: 40 }}>
        {services.map((s) => {
          const items = s.images.map((id) => gallery.find((g) => g.id === id)).filter((g) => !!g);
          return (
            <section className="svc-row" key={s.id} id={s.id}>
              <div>
                <h2>{s.title}</h2>
                <p className="lead" style={{ marginTop: 8 }}>{s.text}</p>
                <div className="go">
                  <Link href="/en/contact" className="link">Tell us what you need</Link>
                </div>
              </div>
              {items.length > 0 && (
                <div className="thumbs">
                  {items.map((g) => (
                    <Link key={g.id} href={`/en/gallery/${g.slug}`} aria-label={g.title}>
                      <Image src={g.imagePath} alt={g.alt} width={220} height={220} sizes="110px" loading="lazy" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
