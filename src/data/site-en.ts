import { brand as identity } from "./site";
export const brand = {
  name: identity.nameEn,
  nameEn: identity.nameEn,
  tagline: "Interior design, fit-out & bespoke woodwork",
  intro: "Every space has its own rhythm, proportions and purpose. We bring these together through considered interiors and woodwork made to fit.",
};

export const nav = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About the atelier" },
  { href: "/contact", label: "Contact" },
];

export const galleryIntro =
  "A collection of reference spaces and details to explore design directions. These images are not presented as completed Fadak Atelier projects.";

export const areas = [
  { title: "Workplaces", text: "Executive desks, shared workstations, storage, meeting rooms and reception counters.", image: "b1-12" },
  { title: "Retail & commercial", text: "Counters, display units and wall treatments for spaces that welcome customers.", image: null },
  { title: "Residential", text: "Kitchens, wardrobes, media walls and shelving shaped around everyday life.", image: "b1-14" },
];

// `images`: gallery ids shown on the services page. Leave empty when nothing fits.
export const services = [
  { id: "interior-design", title: "Interior design", text: "Understanding your space, planning its layout, selecting materials and preparing drawings for production.", images: ["b1-14", "b1-15"] },
  { id: "decoration", title: "Interior fit-out", text: "Wall treatments, linear lighting, partitions and woodwork brought together around the approved design.", images: ["b1-12", "b1-11"] },
  { id: "cabinets", title: "Cabinetry & wardrobes", text: "Kitchen cabinetry, wardrobes and bookcases tailored to the precise dimensions of your space.", images: ["b1-13", "b1-16", "b1-17", "b2-05", "b2-12"] },
  { id: "office", title: "Workplace interiors", text: "Executive desks, shared workstations, reception counters and filing storage.", images: ["b1-04", "b1-07", "b1-03", "b1-08", "b2-06", "b2-11", "b2-15"] },
  { id: "retail", title: "Retail interiors", text: "Counters, display cases and shelving for retail and commercial settings. Images will be added once approved.", images: [] },
  { id: "custom-wood", title: "Bespoke woodwork", text: "Shelving, display units, media walls and decorative pieces made to your design and dimensions.", images: ["b1-02", "b1-05", "b2-01", "b2-09"] },
];

// Edit freely to match the real workflow.
export const process = [
  { title: "First conversation", text: "We discuss your needs, how the space will be used and your budget." },
  { title: "Understanding the space", text: "We review the dimensions and practical conditions of the space." },
  { title: "Design & estimate", text: "We present a design and cost estimate for your approval." },
  { title: "Production", text: "Pieces are made to the approved design." },
  { title: "Installation & handover", text: "We install the pieces and hand over the finished work." },
];

export const about = {
  lead: "Fadak Atelier works across interior design, fit-out and bespoke woodwork for homes, workplaces and commercial spaces.",
  body: [
    "We begin with the space: its purpose, proportions, light and daily use. These observations guide the design and the pieces we make for it.",
    "Our work spans residential, workplace and retail interiors, from cabinetry and wardrobes to executive desks, reception counters, wall treatments and shelving.",
  ],
  approach: [
    { title: "Shaped by the space", text: "Each design begins with the real needs and dimensions of its setting." },
    { title: "Made to fit", text: "Every piece is made for its setting and considered in relation to the whole." },
  ],
  // Add { src, alt, caption, width, height } once real team/workshop photos exist. Empty = section hidden.
  photos: [] as { src: string; alt: string; caption: string; width: number; height: number }[],
};

export const projectTypes = ["Workplaces", "Retail & commercial", "Residential", "Cabinetry & wardrobes", "Bespoke woodwork", "Other"];
