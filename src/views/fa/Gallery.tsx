import GalleryGrid from "@/components/GalleryGrid";
import { getGallery, getSite } from "@/lib/content";


export default async function GalleryPage() {
  const [gallery, site] = await Promise.all([getGallery("fa"), getSite("fa")]);
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>گالری فضاها و جزئیات</h1>
        <p className="lead">{site.galleryIntro}</p>
      </div>
      <div style={{ paddingBottom: 80 }}><GalleryGrid items={gallery} /></div>
    </div>
  );
}
