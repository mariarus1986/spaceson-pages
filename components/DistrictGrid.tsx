import type { CardItem } from "@/lib/seo/types";
import { Section } from "./Section";

type DistrictGridProps = {
  items: CardItem[];
};

export function DistrictGrid({ items }: DistrictGridProps) {
  return (
    <Section
      id="zonas"
      title="Barrios y zonas recomendadas"
      lede="Cada zona responde mejor a un tipo de reunion, de asistentes y de presupuesto."
      variant="soft"
    >
      <div className="district-list">
        {items.map((item) => (
          <article className="district" key={item.href}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <a className="card-link" href={item.href}>
              {item.label}
            </a>
          </article>
        ))}
      </div>
    </Section>
  );
}
