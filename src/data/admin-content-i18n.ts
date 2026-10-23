import type { Locale } from "@/lib/i18n";

const fa = {
  tabs: { gallery: "گالری", content: "متن‌ها و تماس" },
  gallery: {
    add: "افزودن تصویر", edit: "ویرایش", remove: "حذف", hide: "مخفی کردن", show: "نمایش", up: "بالا", down: "پایین", hidden: "مخفی", featured: "منتخب",
    watermark: "واترمارک", unverified: "تأییدنشده", verified: "تأییدشده", confirmDelete: "این تصویر برای همیشه از گالری حذف شود؟", empty: "گالری خالی است.",
    count: "تصویر", saved: "ذخیره شد و روی سایت اعمال شد.", cancel: "انصراف", save: "ذخیره", saving: "در حال ذخیره…",
    image: "تصویر", replaceImage: "جایگزینی تصویر", chooseImage: "انتخاب تصویر", imageHint: "JPG، PNG یا WebP، تا ۱۰ مگابایت. نسبت تصویر حفظ می‌شود.",
    slug: "نشانی صفحه (لاتین، با خط تیره)", slugHint: "پس از ساخت قابل تغییر نیست تا لینک‌ها نشکنند.", category: "دسته‌بندی",
    featuredLabel: "نمایش در منتخب صفحه اول", hiddenLabel: "مخفی از سایت", watermarkLabel: "روی تصویر نشان یا نوشته‌ی منبع دیگر دیده می‌شود",
    status: "وضعیت تأیید", projectId: "شناسه پروژه واقعی", kind: "نوع تصویر", kindNone: "عکس / عادی", kind3d: "مدل سه‌بعدی (مرجع)",
    fa: "فارسی", en: "انگلیسی", title: "عنوان", description: "توضیح", alt: "متن جایگزین تصویر (alt)", subcategory: "زیردسته", workTypes: "نوع کار (با ویرگول جدا کنید)",
    tags: "برچسب‌ها (با ویرگول جدا کنید)", needImage: "ابتدا تصویر را انتخاب کنید.", needSlug: "نشانی صفحه باید لاتین و با خط تیره باشد.", needTitles: "عنوان و alt هر دو زبان لازم است.",
    categories: { office: "اداری و سازمانی", reception: "اداری و تجاری", residential: "مسکونی", decor: "دکوراسیون داخلی" },
    errors: { invalid: "اطلاعات واردشده معتبر نیست.", duplicate: "این شناسه یا نشانی قبلاً استفاده شده است.", unsupported_type: "این نوع تصویر پذیرفته نمی‌شود.", too_large: "حجم تصویر بیش از ۱۰ مگابایت است.", default: "ذخیره انجام نشد." },
  },
  content: {
    contactTitle: "اطلاعات تماس", phone: "تلفن (مثلاً ‎+989121234567)", whatsapp: "واتساپ (فقط ارقام، با کد کشور)", instagram: "اینستاگرام (بدون @)", telegram: "تلگرام (بدون @)",
    addressFa: "نشانی (فارسی)", addressEn: "نشانی (انگلیسی)", textTitle: "متن‌های سایت", language: "زبان", save: "ذخیره و اعمال روی سایت", saved: "ذخیره شد و روی سایت اعمال شد.", failed: "ذخیره انجام نشد؛ ورودی‌ها را بررسی کنید.",
    hero: "بخش اصلی صفحه اول", eyebrow: "عنوان کوچک بالای تیتر", line1: "تیتر، خط اول", line2: "تیتر، خط دوم", caption: "زیرنویس تصویر", heroImage: "تصویر صفحه اول",
    tagline: "عبارت معرفی برند", intro: "متن معرفی کوتاه", galleryIntro: "توضیح گالری", areas: "زمینه‌های فعالیت", services: "خدمات", process: "مراحل همکاری", about: "درباره",
    aboutLead: "جمله‌ی اصلی", aboutBody: "پاراگراف‌ها (هر پاراگراف را با یک خط خالی جدا کنید)", approach: "رویکرد", itemTitle: "عنوان", itemText: "توضیح", itemImage: "تصویر (اختیاری)",
    itemImages: "تصاویر مرتبط", none: "— بدون تصویر —", add: "افزودن مورد", remove: "حذف", up: "بالا", down: "پایین", serviceId: "شناسه (لاتین)",
  },
};

const en: typeof fa = {
  tabs: { gallery: "Gallery", content: "Texts & contact" },
  gallery: {
    add: "Add image", edit: "Edit", remove: "Delete", hide: "Hide", show: "Show", up: "Up", down: "Down", hidden: "Hidden", featured: "Featured",
    watermark: "Watermark", unverified: "Unverified", verified: "Verified", confirmDelete: "Delete this image from the gallery permanently?", empty: "The gallery is empty.",
    count: "images", saved: "Saved and live on the site.", cancel: "Cancel", save: "Save", saving: "Saving…",
    image: "Image", replaceImage: "Replace image", chooseImage: "Choose an image", imageHint: "JPG, PNG or WebP, up to 10 MB. The aspect ratio is kept.",
    slug: "Page address (latin, hyphenated)", slugHint: "Cannot be changed after creation, so links never break.", category: "Category",
    featuredLabel: "Show in featured on the home page", hiddenLabel: "Hide from the site", watermarkLabel: "The image carries another source's mark or text",
    status: "Verification status", projectId: "Real project id", kind: "Image type", kindNone: "Photo / regular", kind3d: "3D model (reference)",
    fa: "Persian", en: "English", title: "Title", description: "Description", alt: "Image alt text", subcategory: "Subcategory", workTypes: "Work types (comma separated)",
    tags: "Tags (comma separated)", needImage: "Choose an image first.", needSlug: "The page address must be latin letters, digits and hyphens.", needTitles: "A title and alt text are required in both languages.",
    categories: { office: "Workplaces", reception: "Office & commercial", residential: "Residential", decor: "Interior decoration" },
    errors: { invalid: "Some of the information is not valid.", duplicate: "This id or address is already in use.", unsupported_type: "This image type is not accepted.", too_large: "The image is larger than 10 MB.", default: "Could not save." },
  },
  content: {
    contactTitle: "Contact details", phone: "Phone (e.g. +989121234567)", whatsapp: "WhatsApp (digits with country code)", instagram: "Instagram (without @)", telegram: "Telegram (without @)",
    addressFa: "Address (Persian)", addressEn: "Address (English)", textTitle: "Site texts", language: "Language", save: "Save and publish", saved: "Saved and live on the site.", failed: "Could not save; check the inputs.",
    hero: "Home page hero", eyebrow: "Small line above the headline", line1: "Headline, line 1", line2: "Headline, line 2", caption: "Image caption", heroImage: "Home page image",
    tagline: "Brand tagline", intro: "Short introduction", galleryIntro: "Gallery description", areas: "Areas of work", services: "Services", process: "How we work", about: "About",
    aboutLead: "Lead sentence", aboutBody: "Paragraphs (separate with a blank line)", approach: "Approach", itemTitle: "Title", itemText: "Description", itemImage: "Image (optional)",
    itemImages: "Related images", none: "— none —", add: "Add item", remove: "Remove", up: "Up", down: "Down", serviceId: "Id (latin)",
  },
};

export const adminContent = (locale: Locale) => (locale === "fa" ? fa : en);
export type AdminContentText = typeof fa;
