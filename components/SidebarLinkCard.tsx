import type { LinkItem } from "@/lib/seo/types";

type SidebarLinkCardProps = {
  title: string;
  links: LinkItem[];
  variant?: "list" | "pills";
};

export function SidebarLinkCard({ title, links, variant = "list" }: SidebarLinkCardProps) {
  return (
    <div className="mini-card">
      <h3>{title}</h3>
      {variant === "list" ? (
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="pill-row">
          {links.map((link) => (
            <a className="pill" href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
