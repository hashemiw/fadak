import { publicGalleryItem } from "@/data/gallery";
import GalleryGrid from "@/components/en/GalleryGrid";
import { gallery } from "@/data/gallery-en";
import { galleryIntro } from "@/data/site-en";


export default function GalleryPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Spaces & details</h1>
        <p className="lead">{galleryIntro}</p>
      </div>
      <div style={{ paddingBottom: 80 }}><GalleryGrid items={gallery.map(publicGalleryItem)} /></div>
    </div>
  );
}
