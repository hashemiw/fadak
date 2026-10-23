export const address = { fa: "تهران، میدان تجریش، خیابان ولیعصر", en: "Tajrish Square, Valiasr Street, Tehran" };
export const addressLabel = (locale: "en" | "fa") => address[locale];
// Fill in real values to enable the matching buttons/links. Empty = hidden.
export const contact = {
  phone: "+989199294498",
  phoneDisplay: "+98 919 929 4498",
  whatsapp: "989199294498",
  instagram: "fadakatelier",
  telegram: "fadakatelier",
  address: address.fa, // shown when non-empty; the English text is address.en
  // Same-origin path proxied to the Go backend (see next.config.mjs). Empty = form stays a disabled preview.
  formEndpoint: "/api/inquiries",
};
