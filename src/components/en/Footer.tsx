import Link from "next/link";
import { brand, nav } from "@/data/site-en";
import { contact, serviceAreaLabel } from "@/data/contact";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <b>{brand.name}</b>
          <p>{brand.tagline}</p>
        </div>
        <nav aria-label="Footer navigation">
          {nav.map((n) => <Link key={n.href} href={`/en${n.href === "/" ? "" : n.href}`}>{n.label}</Link>)}
        </nav>
        {(contact.phone || contact.instagram || contact.serviceArea) && (
          <div>
            {contact.phone && <p><a className="ltr" href={`tel:${contact.phone}`}>{contact.phone}</a></p>}
            {contact.instagram && <p><a className="ltr" href={`https://instagram.com/${contact.instagram}`} rel="noopener">@{contact.instagram}</a></p>}
            {contact.serviceArea && <p>{serviceAreaLabel("en")}</p>}
          </div>
        )}
      </div>
    </footer>
  );
}
