import ContactForm from "@/components/ContactForm";
import { contact } from "@/data/contact";


export default function ContactPage() {
  const links = [
    contact.phone && { k: "تلفن", v: <a className="ltr" href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a> },
    contact.whatsapp && { k: "واتساپ", v: <a className="link" href={`https://wa.me/${contact.whatsapp}`} rel="noopener">گفت‌وگو در واتساپ</a> },
    contact.instagram && { k: "اینستاگرام", v: <a className="ltr" href={`https://instagram.com/${contact.instagram}`} rel="noopener">@{contact.instagram}</a> },
    contact.telegram && { k: "تلگرام", v: <a className="ltr" href={`https://t.me/${contact.telegram}`} rel="noopener">@{contact.telegram}</a> },
    contact.serviceArea && { k: "محدوده فعالیت", v: contact.serviceArea },
  ].filter(Boolean) as { k: string; v: React.ReactNode }[];

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>برای فضای شما چه چیزی بسازیم؟</h1>
        <p className="lead">نیاز خود را کوتاه بنویسید تا درباره آن گفت‌وگو کنیم.</p>
      </div>
      <div className="contact-grid">
        <ContactForm endpoint={contact.formEndpoint} />
        {links.length > 0 && (
          <aside className="info"><dl>{links.map((l) => <div key={l.k}><dt>{l.k}</dt><dd>{l.v}</dd></div>)}</dl></aside>
        )}
      </div>
    </div>
  );
}
