// Minimal id -> slug/image list so client components can show saved references without bundling descriptions.
import { gallery as full } from "./gallery";
export const gallery = full.map(({ id, slug, imagePath }) => ({ id, slug, imagePath }));
