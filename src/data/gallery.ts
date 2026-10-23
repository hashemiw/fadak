import { batch2 } from "./gallery-batch2";

// Gallery records. One record per image; nothing here is tied to a project yet.
// See README.md for how to add images or promote an item to a confirmed project.

export type Category = "decor" | "office" | "reception" | "residential";

export type GalleryItem = {
  id: string;
  slug: string;
  batch: number;
  originalPath: string; // where the untouched source file lives (not used in URLs)
  imagePath: string; // public URL of the copy used by the site
  width: number;
  height: number;
  title: string;
  description: string;
  alt: string;
  category: Category;
  subcategory: string;
  workTypes: string[]; // shown as labels and used for the second filter row
  tags: string[];
  featured: boolean;
  contentStatus: "unverified" | "verified";
  projectId: string | null;
  watermark?: boolean; // image carries another source's mark; never use as hero, never remove the mark
  kind?: "reference-3d"; // file name says it is a 3D model, not a photo of a built job
  relatedIds?: string[]; // possible same-model images; internal only, not a confirmed project
  alsoOriginalPaths?: string[]; // other source files merged into this record
};

export const categories: Record<Category, string> = {
  office: "اداری و سازمانی",
  reception: "اداری و تجاری",
  residential: "مسکونی",
  decor: "دکوراسیون داخلی",
};

type Seed = Omit<GalleryItem, "id" | "batch" | "originalPath" | "imagePath" | "contentStatus" | "projectId" | "alt" | "featured"> & {
  n: number;
  featured?: boolean;
};

const seeds: Seed[] = [
  { n: 2, slug: "decorative-cabinet-glass-display", width: 736, height: 1308, category: "decor", subcategory: "کابینت و ویترین دکوراتیو", workTypes: ["کابینت", "ویترین"],
    title: "کابینت دکوراتیو روشن با ویترین شیشه‌ای",
    description: "ترکیب کابینت‌های روشن با درهای ساده، ویترین شیشه‌ای با قاب تیره و قفسه‌های باز. نورپردازی خطی گرم، سطح میانی با ظاهر چوب و گوشه‌های منحنی، به این مجموعه یکپارچه جلوه‌ای آرام و مدرن داده‌اند.",
    tags: ["کابینت دکوراتیو", "ویترین", "قفسه باز", "فرم منحنی", "نور مخفی"] },
  { n: 3, slug: "wall-workstation-tall-storage", width: 735, height: 1228, category: "office", subcategory: "ایستگاه کار", workTypes: ["میز گروهی"],
    title: "میز کار گروهی دیواری با کمدهای سرتاسری",
    description: "میز کار ممتد در امتداد دیوار با چند جایگاه کامپیوتر و کشوهای زیر میز. کمدهای مرتفع روشن، قفسه‌های باز تیره و پوشش دیوار با ظاهر چوب، فضای کار و نگهداری وسایل را در یک ترکیب منظم کنار هم قرار داده‌اند.",
    tags: ["میز کار گروهی", "کمد اداری", "قفسه‌بندی", "نور خطی", "فضای ذخیره‌سازی"] },
  { n: 4, slug: "light-executive-desk-lit-bookcase", width: 688, height: 683, category: "office", subcategory: "اتاق مدیریت", workTypes: ["میز مدیریت"], featured: true,
    title: "میز مدیریت روشن با کتابخانه نورپردازی‌شده",
    description: "میز مدیریت بزرگ با ترکیب رنگ‌های خنثی، صفحه تیره و نورپردازی گرم در بخش جلویی. کتابخانه پشت میز با قفسه‌های باز و سطوح شیاردار، ترکیب بصری هماهنگی با میز و دیوارهای اطراف ایجاد کرده است.",
    tags: ["میز مدیریت", "کتابخانه", "دکور اداری", "سطوح شیاردار", "نور مخفی"] },
  { n: 5, slug: "geometric-reception-counter-linear-wood", width: 736, height: 662, category: "reception", subcategory: "کانتر پذیرش", workTypes: ["کانتر"], featured: true,
    title: "کانتر پذیرش هندسی با نمای چوبی خطی",
    description: "کانتر پذیرش با ترکیب سطح سفید زاویه‌دار و نوارهای افقی با ظاهر چوب. دیوار پشت کانتر با خطوط عمودی، پس‌زمینه‌ای هماهنگ برای محل نصب نشان تجاری ایجاد کرده است.",
    tags: ["کانتر پذیرش", "دکور تجاری", "فرم هندسی", "دیوارپوش خطی"] },
  { n: 6, slug: "white-wood-reception-counter-linear-light", width: 736, height: 736, category: "reception", subcategory: "کانتر پذیرش", workTypes: ["کانتر"],
    title: "کانتر پذیرش سفید و چوب با نور خطی",
    description: "کانتر پذیرش با بدنه دارای ظاهر چوب و پنل سفید با لبه مورب. نور گرم در امتداد اتصال دو سطح، فرم کانتر را برجسته کرده و با دیوارهای ساده و پوشش چوبی اطراف هماهنگ شده است.",
    tags: ["میز پذیرش", "ترکیب سفید و چوب", "نورپردازی خطی", "طراحی مدرن"] },
  { n: 7, slug: "dark-wood-executive-desk-bookcase", width: 736, height: 695, category: "office", subcategory: "اتاق مدیریت", workTypes: ["میز مدیریت"], featured: true,
    title: "میز و کتابخانه مدیریت با رنگ چوب تیره",
    description: "مجموعه میز مدیریت و کمد پشت میز با ظاهر چوب تیره و جزئیات مشکی. کتابخانه شامل قفسه‌های باز، کابینت‌های بسته و بخش شیشه‌ای است و فضایی برای نگهداری زونکن و نمایش اشیای دکوراتیو فراهم می‌کند.",
    tags: ["میز مدیریت", "کتابخانه اداری", "کمد بایگانی", "ویترین شیشه‌ای", "چوب تیره"] },
  { n: 8, slug: "meeting-room-glass-partition", width: 736, height: 1104, category: "office", subcategory: "اتاق جلسات", workTypes: ["میز جلسات"], featured: true,
    title: "اتاق جلسات با میز روشن و پارتیشن شیشه‌ای",
    description: "اتاق جلسات با میز مستطیلی بزرگ، صندلی‌های قهوه‌ای و دیوار نمایشگر تیره. پارتیشن‌های شیشه‌ای با قاب مشکی و سقف تیغه‌ای سفید، ساختار منظم و مشخصی به فضا داده‌اند.",
    tags: ["میز کنفرانس", "اتاق جلسات", "پارتیشن شیشه‌ای", "دیوار نمایشگر", "سقف تیغه‌ای"] },
  { n: 10, slug: "open-office-exposed-ceiling", width: 528, height: 790, category: "office", subcategory: "دفتر کار باز", workTypes: ["میز گروهی"],
    title: "فضای اداری گسترده با سقف تأسیسات نمایان",
    description: "ردیف‌های میز کار سفید با فایل‌های کشویی و صندلی‌های مشکی در یک سالن اداری باز. تأسیسات نمایان سقف، چراغ‌های آویز و نورهای خطی، حال‌وهوای صنعتی فضا را شکل داده‌اند و گیاهان میان میزها به تفکیک بصری کمک می‌کنند.",
    tags: ["تجهیز فضای اداری", "میز گروهی", "سبک صنعتی", "تأسیسات نمایان", "چیدمان باز"] },
  { n: 11, slug: "group-workspace-graphic-wall", width: 736, height: 736, category: "office", subcategory: "دفتر کار باز", workTypes: ["میز گروهی"],
    title: "فضای کار گروهی با دیوار گرافیکی",
    description: "میزهای کار گروهی با صفحات روشن، پایه‌های تیره و جداکننده‌های خاکستری. سقف تیره با تأسیسات نمایان و نور خطی، در کنار دیوار گرافیکی با جزئیات زرد و آبی، به فضا حال‌وهوایی پویا داده است.",
    tags: ["فضای کار گروهی", "جداکننده میز", "دیوار گرافیکی", "سقف باز", "نور خطی"] },
  { n: 12, slug: "minimal-office-white-desks", width: 735, height: 951, category: "office", subcategory: "دفتر کار باز", workTypes: ["میز گروهی"],
    title: "دفتر کار مینیمال با میزهای سفید",
    description: "چیدمان منظم میزهای سفید و صندلی‌های مشکی در فضایی روشن با پارتیشن‌های شیشه‌ای. فایل‌های زیر میز، نظم‌دهنده‌های رومیزی با ظاهر چوب و فضای نشیمن کوچک در انتهای سالن، بخش‌های مختلف محیط کار را تکمیل کرده‌اند.",
    tags: ["دفتر کار مینیمال", "میز اداری", "پارتیشن شیشه‌ای", "فایل اداری", "فضای نشیمن"] },
  { n: 13, slug: "light-green-cabinets-upper-display", width: 736, height: 1308, category: "residential", subcategory: "آشپزخانه و کابینت", workTypes: ["کابینت", "ویترین"], featured: true,
    title: "کابینت سبز روشن با ویترین فوقانی",
    description: "کابینت‌های سبز روشن با سطوح صاف و براق، صفحه روشن و سینک سفید با پیشانی نمایان. ویترین‌های شیشه‌ای بالای کابینت‌ها با قاب تیره و نور گرم، همراه با نور زیر کابینت و پایین یونیت‌ها، لایه‌های مختلف ترکیب را برجسته کرده‌اند.",
    tags: ["کابینت سبز", "ویترین شیشه‌ای", "نور زیر کابینت", "سینک پیشانی‌دار", "آشپزخانه مدرن"] },
  { n: 14, slug: "u-shaped-kitchen-green-white", width: 735, height: 985, category: "residential", subcategory: "آشپزخانه و کابینت", workTypes: ["کابینت"],
    title: "آشپزخانه سه‌طرفه سبز و سفید",
    description: "آشپزخانه با چیدمان سه‌طرفه و ترکیب کابینت‌های سبز روشن و سفید. سطوح روشن با طرح رگه‌دار، تجهیزات مشکی، کابینت‌های مرتفع و نورپردازی خطی سقف، ترکیبی یکپارچه و مدرن ایجاد کرده‌اند.",
    tags: ["آشپزخانه U شکل", "کابینت سبز و سفید", "تجهیزات توکار", "سطوح طرح سنگ", "نور خطی"] },
  { n: 15, slug: "warm-wood-look-kitchen", width: 735, height: 981, category: "residential", subcategory: "آشپزخانه و کابینت", workTypes: ["کابینت"],
    title: "آشپزخانه با ظاهر چوب و رنگ‌های گرم",
    description: "ترکیب کابینت‌های پایین با ظاهر چوب و کابینت‌های بالایی به رنگ خنثی گرم. صفحه روشن، تجهیزات توکار مشکی و نور زیر کابینت، در کنار میز غذاخوری هماهنگ و چراغ‌های آویز، فضای آشپزخانه و غذاخوری را به هم پیوند داده‌اند.",
    tags: ["کابینت با ظاهر چوب", "آشپزخانه گرم", "تجهیزات توکار", "میز غذاخوری", "نورپردازی آویز"] },
  { n: 16, slug: "green-framed-cabinets-black-display", width: 735, height: 1294, category: "residential", subcategory: "آشپزخانه و کابینت", workTypes: ["کابینت", "ویترین"],
    title: "کابینت سبز قاب‌دار با ویترین مشکی",
    description: "آشپزخانه کشیده با کابینت‌های سبز قاب‌دار، دستگیره‌های مشکی و ویترین‌های شیشه‌ای با قاب تیره. صفحه و دیوار بین کابینتی روشن با طرح رگه‌دار، همراه نور داخلی ویترین و نور زیر کابینت، تضاد ملایمی با رنگ سبز ایجاد کرده‌اند.",
    tags: ["کابینت قاب‌دار", "سبک شیکر", "کابینت سبز", "ویترین مشکی", "آشپزخانه کشیده"] },
  { n: 17, slug: "kitchen-breakfast-counter-fluted", width: 736, height: 975, category: "residential", subcategory: "آشپزخانه و کابینت", workTypes: ["کابینت", "کانتر"], featured: true,
    title: "آشپزخانه با کانتر صبحانه‌خوری و نمای شیاردار",
    description: "آشپزخانه با کابینت‌های بالایی دارای ظاهر چوب و یونیت‌های پایین خاکستری. کانتر صبحانه‌خوری با نمای عمودی شیاردار، صفحه روشن و نور مخفی، همراه قفسه‌های دکوراتیو نورپردازی‌شده و چراغ‌های آویز باریک، نقطه شاخص تصویر است.",
    tags: ["کانتر صبحانه‌خوری", "نمای شیاردار", "کابینت چوب و خاکستری", "قفسه دکوراتیو", "نور مخفی"] },
];

const pad = (n: number) => String(n).padStart(2, "0");

const batch1: GalleryItem[] = seeds.map(({ n, featured, ...s }) => ({
  ...s,
  id: `b1-${pad(n)}`,
  batch: 1,
  // Source files have a leading space before the dash, e.g. " -2.jpg".
  originalPath: `/Users/hashemi/Downloads/ -${n}.jpg`,
  imagePath: `/assets/gallery/img-${pad(n)}.jpg`,
  alt: `${s.title} — ${s.subcategory}`,
  featured: !!featured,
  contentStatus: "unverified",
  projectId: null,
}));

// Office Interior.jpg is a slightly larger copy of the same scene as " -3.jpg"; its file is used as the site image.
const dup = batch1.find((g) => g.id === "b1-03")!;
dup.width = 736;
dup.alsoOriginalPaths = ["/Users/hashemi/Downloads/Office Interior.jpg"];

export const gallery: GalleryItem[] = [...batch1, ...batch2];

export const getItem = (slug: string) => gallery.find((g) => g.slug === slug);

export type PublicGalleryItem = Omit<GalleryItem, "originalPath" | "alsoOriginalPaths">;
export const publicGalleryItem = ({ originalPath: _source, alsoOriginalPaths: _duplicates, ...item }: GalleryItem): PublicGalleryItem => item;
