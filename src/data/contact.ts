export const serviceAreas = [
  { fa: "تهران", en: "Tehran" }, { fa: "کرج", en: "Karaj" }, { fa: "قم", en: "Qom" },
  { fa: "قزوین", en: "Qazvin" }, { fa: "مازندران", en: "Mazandaran" },
];
export const serviceAreaLabel = (locale: "en" | "fa") => serviceAreas.map(area => area[locale]).join(locale === "fa" ? "، " : ", ");
// Fill in real values to enable the matching buttons/links. Empty = hidden.
export const contact = {
  phone: "", // e.g. "09120000000"
  whatsapp: "", // digits with country code, e.g. "989120000000"
  instagram: "", // username without @
  serviceArea: serviceAreaLabel("fa"), // e.g. "تهران و حومه"
  // Endpoint that accepts a JSON POST of the form. Empty = form stays a disabled preview.
  formEndpoint: "",
};
