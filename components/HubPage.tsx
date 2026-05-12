import { Footer } from "./Footer";
import type { CitySeoPage, LinkItem } from "@/lib/seo/types";

type HubPageProps = {
  title: string;
  intro: string;
  links: LinkItem[];
  city: CitySeoPage;
};

export function HubPage({ title, intro, links, city }: HubPageProps) {
  return (
    <>
      <main className="shell">
        <section className="hero">
          <div className="hero-card">
            <div className="hero-copy">
              <span className="eyebrow">Paginas SEO SpacesON</span>
              <h1>{title}</h1>
              <p>{intro}</p>
            </div>
          </div>
        </section>
        <section className="section section-accent">
          <div className="section-header">
            <div>
              <h2>Explora por ciudad</h2>
              <p className="lede">Accede a las paginas SEO disponibles para este formato.</p>
            </div>
          </div>
          <nav className="internal-links" aria-label={title}>
            {links.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </section>
      </main>
      <Footer city={city} links={links} />
    </>
  );
}
