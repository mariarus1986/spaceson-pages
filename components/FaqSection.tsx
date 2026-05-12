import type { FaqItem } from "@/lib/seo/types";
import { Section } from "./Section";

type FaqSectionProps = {
  cityName: string;
  faqs: FaqItem[];
};

export function FaqSection({ cityName, faqs }: FaqSectionProps) {
  return (
    <Section
      id="faq"
      title={`Preguntas frecuentes sobre salas en ${cityName}`}
      lede="Respuestas rapidas a las dudas mas habituales antes de reservar."
    >
      <div className="faq-list">
        {faqs.map((faq) => (
          <article className="faq-item" key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
