import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: string;
  lede?: string;
  variant?: "default" | "soft" | "accent";
  children: ReactNode;
};

export function Section({ id, title, lede, variant = "default", children }: SectionProps) {
  const className = ["section", variant === "soft" ? "section-soft" : "", variant === "accent" ? "section-accent" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} id={id}>
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          {lede ? <p className="lede">{lede}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
