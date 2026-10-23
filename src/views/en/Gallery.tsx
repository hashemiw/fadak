import GalleryGrid from "@/components/en/GalleryGrid";
import { getGallery, getSite } from "@/lib/content";


export default async function GalleryPage() {
  const [gallery, site] = await Promise.all([getGallery("en"), getSite("en")]);
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Spaces & details</h1>
        <p className="lead">{site.galleryIntro}</p>
      </div>
      <div style={{ paddingBottom: 80 }}><GalleryGrid items={gallery} /></div>
    </div>
  );
}
