import ContactForm from "@/components/ContactForm";
import { contact, addressLabel } from "@/data/contact";


export default function ContactPage() {
  const links = [
    contact.phone && { k: "Phone", v: <a className="ltr" href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a> },
    contact.whatsapp && { k: "WhatsApp", v: <a className="link" href={`https://wa.me/${contact.whatsapp}`} rel="noopener">Chat on WhatsApp</a> },
    contact.instagram && { k: "Instagram", v: <a className="ltr" href={`https://instagram.com/${contact.instagram}`} rel="noopener">@{contact.instagram}</a> },
    contact.telegram && { k: "Telegram", v: <a className="ltr" href={`https://t.me/${contact.telegram}`} rel="noopener">@{contact.telegram}</a> },
    contact.address && { k: "Address", v: addressLabel("en") },
  ].filter(Boolean) as { k: string; v: React.ReactNode }[];

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>What could your space become?</h1>
        <p className="lead">Share a little about your plans so we can explore the possibilities together.</p>
      </div>
      <div className="contact-grid">
        <ContactForm locale="en" endpoint={contact.formEndpoint} />
        {links.length > 0 && (
          <aside className="info"><dl>{links.map((l) => <div key={l.k}><dt>{l.k}</dt><dd>{l.v}</dd></div>)}</dl></aside>
        )}
      </div>
    </div>
  );
}
