import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/seo/config";
import type { CitySeoPage, LinkItem } from "@/lib/seo/types";

type FooterProps = {
  city: CitySeoPage;
  links: LinkItem[];
};

export function Footer({ city, links }: FooterProps) {
  return (
    <footer className="footer shell">
      <div className="footer-card">
        <Link className="brand footer-brand" href="/">
          <Image
            className="brand-logo"
            src="/logo-spaceson.png"
            alt="SpacesON"
            width={118}
            height={34}
          />
          <span className="brand-text">
            <span className="brand-title">SpacesON</span>
            <span className="brand-subtitle">Reserva de salas para empresas</span>
          </span>
        </Link>
        <h2>SpacesON en {city.name}</h2>
        <p>
          Explora salas de reuniones, formacion, coworking y eventos en {city.name}. Para
          comparar opciones disponibles en toda Espana puedes visitar el marketplace principal.
        </p>
        <div className="footer-links">
          <a href={siteConfig.marketplaceUrl}>Marketplace principal</a>
          {links.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
