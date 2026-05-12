import type { LinkItem } from "@/lib/seo/types";

type InternalLinksProps = {
  cityName: string;
  groups: {
    title: string;
    ariaLabel: string;
    links: LinkItem[];
  }[];
};

export function InternalLinks({ cityName, groups }: InternalLinksProps) {
  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>Sigue explorando opciones</h2>
          <p className="lede">
            Compara otras ciudades, formatos de espacio y tipos de uso desde la misma pagina.
          </p>
        </div>
      </div>
      {groups.map((group) => (
        <div className="link-group" key={`${cityName}-${group.title}`}>
          <h3>{group.title}</h3>
          <nav className="internal-links" aria-label={group.ariaLabel}>
            {group.links.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      ))}
    </section>
  );
}
