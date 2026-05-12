import Link from "next/link";
import { siteConfig } from "@/lib/seo/config";
import type { CitySeoPage } from "@/lib/seo/types";

type HeroProps = {
  city: CitySeoPage;
  title?: string;
  intro?: string;
};

export function Hero({ city, title = city.h1, intro = city.intro }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">{city.eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={siteConfig.marketplaceUrl}>
              Encontrar una sala
            </Link>
            <Link className="btn btn-secondary" href="#tipos-de-espacio">
              Explorar espacios
            </Link>
          </div>
          <div className="hero-strip" aria-label="Temas principales">
            {city.chips.map((chip) => (
              <span className="hero-chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
