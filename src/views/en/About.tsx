import Link from "next/link";
import Image from "next/image";
import { about, process } from "@/data/site-en";


export default function AboutPage() {
  return (
    <>
      <div className="wrap">
        <div className="page-head">
          <h1>About the atelier</h1>
          <p className="lead">{about.lead}</p>
        </div>
        <div className="about-grid" style={{ paddingBottom: 56 }}>
          <div>{about.body.map((p) => <p key={p}>{p}</p>)}</div>
          <div>{about.approach.map((a) => <p key={a.title}><b>{a.title}.</b> {a.text}</p>)}</div>
        </div>
        {about.photos.length > 0 && (
          <div className="cols3" style={{ paddingBottom: 56 }}>
            {about.photos.map((p) => (
              <figure key={p.src} style={{ margin: 0 }}>
                <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes="(max-width: 860px) 100vw, 400px" loading="lazy" />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
      <section className="section alt">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 32 }}>How we work</h2>
          <ol className="steps">{process.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>)}</ol>
          <p style={{ marginTop: 40 }}><Link href="/en/contact" className="btn">Start a conversation</Link></p>
        </div>
      </section>
    </>
  );
}
