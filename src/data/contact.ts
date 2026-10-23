export const serviceAreas = [
  { fa: "تهران", en: "Tehran" }, { fa: "کرج", en: "Karaj" }, { fa: "قم", en: "Qom" },
  { fa: "قزوین", en: "Qazvin" }, { fa: "مازندران", en: "Mazandaran" },
];
export const serviceAreaLabel = (locale: "en" | "fa") => serviceAreas.map(area => area[locale]).join(locale === "fa" ? "، " : ", ");
// Fill in real values to enable the matching buttons/links. Empty = hidden.
export const contact = {
  phone: "+989199294498",
  phoneDisplay: "+98 919 929 4498",
  whatsapp: "989199294498",
  instagram: "fadakatelier",
  telegram: "fadakatelier",
  serviceArea: serviceAreaLabel("fa"), // e.g. "تهران و حومه"
  // Same-origin path proxied to the Go backend (see next.config.mjs). Empty = form stays a disabled preview.
  formEndpoint: "/api/inquiries",
};
