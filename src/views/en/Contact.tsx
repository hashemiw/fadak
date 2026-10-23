import ContactForm from "@/components/ContactForm";
import { getContact, phoneDisplay } from "@/lib/content";
import { contact } from "@/data/contact";


export default async function ContactPage() {
  const c = await getContact();
  const links = [
    c.phone && { k: "Phone", v: <a className="ltr" href={`tel:${c.phone}`}>{phoneDisplay(c.phone)}</a> },
    c.whatsapp && { k: "WhatsApp", v: <a className="link" href={`https://wa.me/${c.whatsapp}`} rel="noopener">Chat on WhatsApp</a> },
    c.instagram && { k: "Instagram", v: <a className="ltr" href={`https://instagram.com/${c.instagram}`} rel="noopener">@{c.instagram}</a> },
    c.telegram && { k: "Telegram", v: <a className="ltr" href={`https://t.me/${c.telegram}`} rel="noopener">@{c.telegram}</a> },
    c.address.en && { k: "Address", v: c.address.en },
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
