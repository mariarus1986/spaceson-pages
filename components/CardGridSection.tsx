import type { CardItem } from "@/lib/seo/types";
import { Section } from "./Section";

type CardGridSectionProps = {
  id?: string;
  title: string;
  lede: string;
  accent?: boolean;
  items: CardItem[];
};

export function CardGridSection({ id, title, lede, accent = false, items }: CardGridSectionProps) {
  return (
    <Section id={id} title={title} lede={lede} variant={accent ? "accent" : "default"}>
      <div className="grid grid-2">
        {items.map((item) => (
          <article className="card" key={item.href}>
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
