import Link from "next/link";
import Image from "next/image";
import { categories, type PublicGalleryItem } from "@/data/gallery-en";

export default function Card({ item, sizes, priority }: { item: PublicGalleryItem; sizes: string; priority?: boolean }) {
  return (
    <Link href={`/en/gallery/${item.slug}`} className="card">
      <Image src={item.imagePath} alt={item.alt} width={item.width} height={item.height} sizes={sizes} priority={priority} />
      <h3>{item.title}</h3>
      <small>{categories[item.category]} · {item.subcategory}</small>
    </Link>
  );
}
