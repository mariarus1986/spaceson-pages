import type { CitySeoPage, LinkItem } from "@/lib/seo/types";
import { Section } from "./Section";
import { SidebarLinkCard } from "./SidebarLinkCard";

type SeoTextSectionProps = {
  city: CitySeoPage;
  districtLinks: LinkItem[];
  prioritySearchLinks: LinkItem[];
  strategicLinks: LinkItem[];
};

export function SeoTextSection({
  city,
  districtLinks,
  prioritySearchLinks,
  strategicLinks,
}: SeoTextSectionProps) {
  return (
    <Section title={city.contentTitle} lede={city.contentLede} variant="soft">
      <div className="content-columns">
        <div className="seo-copy">
          {city.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <aside className="aside-stack">
          <SidebarLinkCard title={`Lo que mas se busca en ${city.name}`} links={prioritySearchLinks} />
          <SidebarLinkCard title="Barrios destacados" links={districtLinks} variant="pills" />
          <SidebarLinkCard title="Enlaces estrategicos" links={strategicLinks} variant="pills" />
        </aside>
      </div>
    </Section>
  );
}
