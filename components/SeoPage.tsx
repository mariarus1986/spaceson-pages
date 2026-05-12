import { CardGridSection } from "./CardGridSection";
import { DistrictGrid } from "./DistrictGrid";
import { FaqSection } from "./FaqSection";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { InternalLinks } from "./InternalLinks";
import { JsonLd } from "./JsonLd";
import { SeoTextSection } from "./SeoTextSection";
import {
  buildDistrictCards,
  buildDistrictLinks,
  buildFooterLinks,
  buildHeroForContext,
  buildInternalLinkGroups,
  buildPrioritySearchLinks,
  buildSpaceTypeCards,
  buildStrategicLinks,
  buildUseCaseCards,
} from "@/lib/seo/page-builders";
import { buildJsonLd } from "@/lib/seo/jsonld";
import type { PageContext, SeoDataset } from "@/lib/seo/types";

type SeoPageProps = {
  context: PageContext;
  dataset: SeoDataset;
};

export function SeoPage({ context, dataset }: SeoPageProps) {
  const { city } = context;
  const hero = buildHeroForContext(context);

  return (
    <>
      <JsonLd data={buildJsonLd(dataset, context)} />
      <main className="shell">
        <Hero city={city} title={hero.title} intro={hero.intro} />
        <SeoTextSection
          city={city}
          districtLinks={buildDistrictLinks(dataset, city)}
          prioritySearchLinks={buildPrioritySearchLinks(dataset, city)}
          strategicLinks={buildStrategicLinks(dataset, city)}
        />
        <CardGridSection
          id="tipos-de-espacio"
          title={`Tipos de espacios en ${city.name}`}
          lede="Accede directamente a los formatos mas buscados para reuniones, formacion, coworking y eventos."
          accent
          items={buildSpaceTypeCards(dataset, city)}
        />
        <CardGridSection
          id="usos"
          title="Usos frecuentes"
          lede="Empieza por el objetivo de tu reserva para ir mas rapido a la opcion que encaja contigo."
          items={buildUseCaseCards(dataset, city)}
        />
        <DistrictGrid items={buildDistrictCards(city)} />
        <InternalLinks cityName={city.name} groups={buildInternalLinkGroups(dataset, city)} />
        <FaqSection cityName={city.name} faqs={city.faqs} />
      </main>
      <Footer city={city} links={buildFooterLinks(dataset, city)} />
    </>
  );
}
