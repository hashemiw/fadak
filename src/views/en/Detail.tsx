import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Card from "@/components/en/Card";
import Lightbox from "@/components/en/Lightbox";
import PrevNext from "@/components/PrevNext";
import FavoriteButton from "@/components/FavoriteButton";
import { categories } from "@/data/gallery-en";
import { getGallery, getItem } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };



export default async function ItemPage({ params }: Props) {
  const gallery = await getGallery("en");
  const item = await getItem("en", (await params).slug);
  if (!item) notFound();
  const at = gallery.findIndex((g) => g.id === item.id);
  const near = (i: number) => (gallery[i] ? { slug: gallery[i].slug, title: gallery[i].title } : null);
  const related = gallery.filter((g) => g.category === item.category && g.id !== item.id).slice(0, 4);

  return (
    <div className="wrap">
      <p className="crumbs"><Link href="/en/gallery">Gallery</Link> / {categories[item.category]}</p>
      <article className="detail">
        <figure>
          <Image src={item.imagePath} alt={item.alt} width={item.width} height={item.height} priority sizes="(max-width: 860px) 100vw, 700px" quality={85} style={{ margin: "0 auto", maxWidth: item.width }} />
          <Lightbox src={item.imagePath} alt={item.alt} width={item.width} height={item.height} />
        </figure>
        <div>
          <h1>{item.title}</h1>
          <p className="meta">{[categories[item.category], item.subcategory].filter(Boolean).join(" · ")}</p>
          <p>{item.description}</p>
          <div className="labels" aria-label="Type">
            {item.workTypes.map((t) => <span key={t} className="label wood">{t}</span>)}
          </div>
          <div className="labels" aria-label="Tags">
            {item.tags.map((t) => <span key={t} className="label">{t}</span>)}
          </div>
          {item.contentStatus !== "verified" && (
            <p className="note">This is a reference image used to illustrate a design direction. It is not attributed to a completed Fadak Atelier project.</p>
          )}
          {item.watermark && <p className="note">This reference image carries a mark or text from another source. It is not attributed to Fadak Atelier.</p>}
          {item.kind === "reference-3d" && <p className="note">The source filename identifies this as a 3D model, rather than a photograph of completed work.</p>}
          <div className="actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}><Link href="/en/contact" className="btn">Start a conversation</Link><FavoriteButton id={item.id} locale="en" /></div>
          <PrevNext locale="en" prev={near(at - 1)} next={near(at + 1)} />
        </div>
      </article>
      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <h2 className="h2" style={{ marginBottom: 20 }}>Explore related references</h2>
          <div className="related">
            {related.map((r) => <Card key={r.id} item={r} sizes="(max-width: 760px) 50vw, 300px" />)}
          </div>
        </section>
      )}
    </div>
  );
}
