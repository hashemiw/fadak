import ContactForm from "@/components/ContactForm";
import { getContact, phoneDisplay } from "@/lib/content";
import { contact } from "@/data/contact";


export default async function ContactPage() {
  const c = await getContact();
  const links = [
    c.phone && { k: "تلفن", v: <a className="ltr" href={`tel:${c.phone}`}>{phoneDisplay(c.phone)}</a> },
    c.whatsapp && { k: "واتساپ", v: <a className="link" href={`https://wa.me/${c.whatsapp}`} rel="noopener">گفت‌وگو در واتساپ</a> },
    c.instagram && { k: "اینستاگرام", v: <a className="ltr" href={`https://instagram.com/${c.instagram}`} rel="noopener">@{c.instagram}</a> },
    c.telegram && { k: "تلگرام", v: <a className="ltr" href={`https://t.me/${c.telegram}`} rel="noopener">@{c.telegram}</a> },
    c.address.fa && { k: "نشانی", v: c.address.fa },
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
