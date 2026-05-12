import { siteConfig } from "./config";
import {
  cityPath,
  homePath,
  spaceTypeHubPath,
  useCaseHubPath,
  useCasesHubPath,
} from "./routes";
import type { LinkItem, PageContext } from "./types";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }

  return `${siteConfig.pagesBaseUrl}${path}`;
}

export function getCanonicalPath(context: PageContext): string {
  const { city } = context;

  if (context.kind === "spaceType" && context.spaceType) {
    return `/${context.spaceType.slug}/${city.slug}/`;
  }

  if (context.kind === "useCase" && context.useCase) {
    return `/usos/${context.useCase.slug}/${city.slug}/`;
  }

  if (context.kind === "district" && context.district) {
    return `/${city.slug}/${context.district.slug}/`;
  }

  return cityPath(city);
}

export function getBreadcrumbs(context: PageContext): LinkItem[] {
  const breadcrumbs: LinkItem[] = [{ label: "Inicio", href: homePath() }];

  if (context.kind === "city") {
    breadcrumbs.push({ label: context.city.name, href: cityPath(context.city) });
  }

  if (context.kind === "spaceType" && context.spaceType) {
    breadcrumbs.push(
      { label: context.spaceType.titlePlural, href: spaceTypeHubPath(context.spaceType) },
      { label: context.city.name, href: getCanonicalPath(context) },
    );
  }

  if (context.kind === "useCase" && context.useCase) {
    breadcrumbs.push(
      { label: "Usos", href: useCasesHubPath() },
      { label: context.useCase.title, href: useCaseHubPath(context.useCase) },
      { label: context.city.name, href: getCanonicalPath(context) },
    );
  }

  if (context.kind === "district" && context.district) {
    breadcrumbs.push(
      { label: context.city.name, href: cityPath(context.city) },
      { label: context.district.name, href: getCanonicalPath(context) },
    );
  }

  return breadcrumbs;
}
