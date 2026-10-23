import Link from "next/link";
import { brand, nav } from "@/data/site";
import { contact } from "@/data/contact";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <b>{brand.name}</b>
          <p>{brand.tagline}</p>
        </div>
        <nav aria-label="پیوندهای پایین صفحه">
          {nav.map((n) => <Link key={n.href} href={`/fa${n.href === "/" ? "" : n.href}`}>{n.label}</Link>)}
        </nav>
        {(contact.phone || contact.instagram || contact.serviceArea) && (
          <div>
            {contact.phone && <p><a className="ltr" href={`tel:${contact.phone}`}>{contact.phoneDisplay}</a></p>}
            {contact.instagram && <p><a className="ltr" href={`https://instagram.com/${contact.instagram}`} rel="noopener">@{contact.instagram}</a></p>}
            {contact.telegram && <p><a className="ltr" href={`https://t.me/${contact.telegram}`} rel="noopener">Telegram @{contact.telegram}</a></p>}
            {contact.serviceArea && <p>{contact.serviceArea}</p>}
          </div>
        )}
      </div>
    </footer>
  );
}
