import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "@/components/FavoriteButton";
import { categories, type PublicGalleryItem } from "@/data/gallery-en";

export default function Card({ item, sizes, priority }: { item: PublicGalleryItem; sizes: string; priority?: boolean }) {
  return (
    <div className="card">
    <Link href={`/en/gallery/${item.slug}`} className="card-link">
      <Image src={item.imagePath} alt={item.alt} width={item.width} height={item.height} sizes={sizes} priority={priority} />
      <h3>{item.title}</h3>
      <small>{[categories[item.category], item.subcategory].filter(Boolean).join(" · ")}</small>
    </Link>
    <FavoriteButton id={item.id} locale="en" />
    </div>
  );
}
