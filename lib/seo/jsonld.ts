import { getPageDescription, getPageTitle } from "./page-meta";
import { getSpaceType, spaceTypeCityPath } from "./routes";
import { absoluteUrl, getBreadcrumbs, getCanonicalPath } from "./urls";
import type { FaqItem, LinkItem, PageContext, SeoDataset, SpaceType } from "./types";

function isSpaceType(value: SpaceType | undefined): value is SpaceType {
  return Boolean(value);
}

export function buildJsonLd(dataset: SeoDataset, context: PageContext) {
  return {
    "@context": "https://schema.org",
    "@graph": buildJsonLdGraph(dataset, context),
  };
}

function buildJsonLdGraph(dataset: SeoDataset, context: PageContext): Record<string, unknown>[] {
  return [
    buildWebPageNode(context),
    buildBreadcrumbListNode(context),
    ...buildOptionalItemListNodes(dataset, context),
    buildFaqPageNode(context.city.faqs),
  ];
}

function buildWebPageNode(context: PageContext): Record<string, unknown> {
  const url = absoluteUrl(getCanonicalPath(context));

  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: getPageTitle(context),
    description: getPageDescription(context),
    inLanguage: context.city.locale,
  };
}

function buildBreadcrumbListNode(context: PageContext): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: getBreadcrumbs(context).map((item, index) => buildListItem(item, index)),
  };
}

function buildOptionalItemListNodes(
  dataset: SeoDataset,
  context: PageContext,
): Record<string, unknown>[] {
  if (context.kind !== "city") {
    return [];
  }

  return [
    {
      "@type": "ItemList",
      name: `Tipos de espacios en ${context.city.name}`,
      itemListElement: context.city.enabledSpaceTypeSlugs
        .map((slug) => getSpaceType(dataset, slug))
        .filter(isSpaceType)
        .map((spaceType, index) =>
          buildListItem(
            {
              label: `${spaceType.titlePlural} en ${context.city.name}`,
              href: spaceTypeCityPath(spaceType, context.city),
            },
            index,
          ),
        ),
    },
  ];
}

function buildFaqPageNode(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function buildListItem(item: LinkItem, index: number): Record<string, unknown> {
  return {
    "@type": "ListItem",
    position: index + 1,
    name: item.label,
    item: absoluteUrl(item.href),
  };
}
