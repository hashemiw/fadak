import Link from "next/link";
import { brand, nav } from "@/data/site-en";
import { getContact, phoneDisplay } from "@/lib/content";

export default async function Footer() {
  const contact = await getContact();
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <b>{brand.name.split(" ")[0]} <span>{brand.name.split(" ").slice(1).join(" ")}</span></b>
          <p>{brand.tagline}</p>
        </div>
        <nav aria-label="Footer navigation">
          {nav.map((n) => <Link key={n.href} href={`/en${n.href === "/" ? "" : n.href}`}>{n.label}</Link>)}
        </nav>
        {(contact.phone || contact.instagram || contact.address.en) && (
          <div>
            {contact.phone && <p><a className="ltr" href={`tel:${contact.phone}`}>{phoneDisplay(contact.phone)}</a></p>}
            {contact.instagram && <p><a className="ltr" href={`https://instagram.com/${contact.instagram}`} rel="noopener">@{contact.instagram}</a></p>}
            {contact.telegram && <p><a className="ltr" href={`https://t.me/${contact.telegram}`} rel="noopener">Telegram @{contact.telegram}</a></p>}
            {contact.address.en && <p>{contact.address.en}</p>}
          </div>
        )}
      </div>
    </footer>
  );
}
