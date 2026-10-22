import type { Metadata } from "next";
import GalleryGrid from "@/components/GalleryGrid";
import { gallery } from "@/data/gallery";
import { galleryIntro } from "@/data/site";

export const metadata: Metadata = { title: "گالری فضاها و جزئیات", description: galleryIntro };

export default function GalleryPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>گالری فضاها و جزئیات</h1>
        <p className="lead">{galleryIntro}</p>
      </div>
      <div style={{ paddingBottom: 80 }}><GalleryGrid items={gallery} /></div>
    </div>
  );
}
