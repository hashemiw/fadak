import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import PrevNext from "@/components/PrevNext";
import FavoriteButton from "@/components/FavoriteButton";
import Lightbox from "@/components/Lightbox";
import { categories } from "@/data/gallery";
import { getGallery, getItem } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };



export default async function ItemPage({ params }: Props) {
  const gallery = await getGallery("fa");
  const item = await getItem("fa", (await params).slug);
  if (!item) notFound();
  const at = gallery.findIndex((g) => g.id === item.id);
  const near = (i: number) => (gallery[i] ? { slug: gallery[i].slug, title: gallery[i].title } : null);
  const related = gallery.filter((g) => g.category === item.category && g.id !== item.id).slice(0, 4);

  return (
    <div className="wrap">
      <p className="crumbs"><Link href="/fa/gallery">گالری</Link> / {categories[item.category]}</p>
      <article className="detail">
        <figure>
          <Image src={item.imagePath} alt={item.alt} width={item.width} height={item.height} priority sizes="(max-width: 860px) 100vw, 700px" quality={85} style={{ margin: "0 auto", maxWidth: item.width }} />
          <Lightbox src={item.imagePath} alt={item.alt} width={item.width} height={item.height} />
        </figure>
        <div>
          <h1>{item.title}</h1>
          <p className="meta">{[categories[item.category], item.subcategory].filter(Boolean).join(" · ")}</p>
          <p>{item.description}</p>
          <div className="labels" aria-label="نوع کار">
            {item.workTypes.map((t) => <span key={t} className="label wood">{t}</span>)}
          </div>
          <div className="labels" aria-label="برچسب‌ها">
            {item.tags.map((t) => <span key={t} className="label">{t}</span>)}
          </div>
          {item.contentStatus !== "verified" && (
            <p className="note">این تصویر در بخش معرفی سبک‌ها و زمینه‌های طراحی آمده است و به پروژه مشخصی نسبت داده نشده است.</p>
          )}
          {item.watermark && <p className="note">روی این تصویر نشان یا نوشته‌ای از منبع دیگر دیده می‌شود؛ تصویر مرجع است و به آتلیه فدک نسبت داده نمی‌شود.</p>}
          {item.kind === "reference-3d" && <p className="note">بر اساس نام فایل منبع، این تصویر مدل سه‌بعدی است، نه عکس اجرای واقعی.</p>}
          <div className="actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}><Link href="/fa/contact" className="btn">درخواست مشاوره</Link><FavoriteButton id={item.id} locale="fa" /></div>
          <PrevNext locale="fa" prev={near(at - 1)} next={near(at + 1)} />
        </div>
      </article>
      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <h2 className="h2" style={{ marginBottom: 20 }}>تصاویر مرتبط در همین دسته</h2>
          <div className="related">
            {related.map((r) => <Card key={r.id} item={r} sizes="(max-width: 760px) 50vw, 300px" />)}
          </div>
        </section>
      )}
    </div>
  );
}
