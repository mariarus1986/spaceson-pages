import Image from "next/image";
import Link from "next/link";
import { homePath } from "@/lib/seo/routes";

const navItems = [
  { label: "Inicio", href: homePath() },
  { label: "Tipos de espacios", href: "#tipos-de-espacio" },
  { label: "Usos", href: "#usos" },
  { label: "Barrios", href: "#zonas" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">
          <Image
            className="brand-logo"
            src="/logo-spaceson.png"
            alt="SpacesON"
            width={118}
            height={34}
            priority
          />
          <span className="brand-text">
            <span className="brand-title">SpacesON</span>
            <span className="brand-subtitle">Salas por horas</span>
          </span>
        </Link>
        <nav className="topnav" aria-label="Navegacion principal">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
