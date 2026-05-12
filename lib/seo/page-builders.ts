import { siteConfig } from "./config";
import { getRelatedCities, resolveSeoRelations } from "./relations";
import {
  cityPath,
  districtPath,
  getDistrict,
  getSpaceType,
  getUseCase,
  spaceTypeHubPath,
  spaceTypeCityPath,
  useCaseCityPath,
  useCasesHubPath,
  useCaseHubPath,
} from "./routes";
import type { CardItem, CitySeoPage, LinkItem, PageContext, SeoDataset } from "./types";

function isDefined<T>(value: T | undefined): value is T {
  return Boolean(value);
}

export function buildSpaceTypeCards(dataset: SeoDataset, city: CitySeoPage): CardItem[] {
  return city.enabledSpaceTypeSlugs
    .map((slug) => getSpaceType(dataset, slug))
    .filter(isDefined)
    .map((spaceType) => ({
      title: `${spaceType.titlePlural} en ${city.name}`,
      description: spaceType.description,
      label: "Explorar",
      href: spaceTypeCityPath(spaceType, city),
    }));
}

export function buildUseCaseCards(dataset: SeoDataset, city: CitySeoPage): CardItem[] {
  return city.enabledUseCaseSlugs
    .map((slug) => getUseCase(dataset, slug))
    .filter(isDefined)
    .map((useCase) => ({
      title: `${useCase.title} en ${city.name}`,
      description: useCase.description,
      label: "Explorar",
      href: useCaseCityPath(useCase, city),
    }));
}

export function buildDistrictCards(city: CitySeoPage): CardItem[] {
  return city.featuredDistrictSlugs
    .map((slug) => getDistrict(city, slug))
    .filter(isDefined)
    .map((district) => ({
      title: district.name,
      description: district.description,
      label: "Ver zona",
      href: districtPath(city, district),
    }));
}

export function buildDistrictLinks(dataset: SeoDataset, city: CitySeoPage): LinkItem[] {
  return resolveSeoRelations(
    dataset,
    city.featuredDistrictSlugs.map((districtSlug) => ({
      kind: "district" as const,
      districtSlug,
    })),
    city,
  );
}

export function buildPrioritySearchLinks(dataset: SeoDataset, city: CitySeoPage): LinkItem[] {
  return resolveSeoRelations(dataset, city.prioritySearchRelations, city);
}

export function buildStrategicLinks(dataset: SeoDataset, city: CitySeoPage): LinkItem[] {
  return resolveSeoRelations(dataset, city.strategicLinkRelations, city);
}

export function buildInternalLinkGroups(dataset: SeoDataset, city: CitySeoPage) {
  return [
    {
      title: "Otras ciudades",
      ariaLabel: "Enlaces a otras ciudades",
      links: getRelatedCities(dataset, city).map((otherCity) => ({
        label: otherCity.name,
        href: cityPath(otherCity),
      })),
    },
    {
      title: `Tipos de espacio en ${city.name}`,
      ariaLabel: "Enlaces a tipos de espacio",
      links: resolveSeoRelations(
        dataset,
        city.enabledSpaceTypeSlugs.map((spaceTypeSlug) => ({
          kind: "spaceType" as const,
          spaceTypeSlug,
        })),
        city,
      ),
    },
    {
      title: "Paginas de uso",
      ariaLabel: "Enlaces a usos",
      links: resolveSeoRelations(
        dataset,
        city.enabledUseCaseSlugs.map((useCaseSlug) => ({
          kind: "useCase" as const,
          useCaseSlug,
        })),
        city,
      ),
    },
  ];
}

export function buildFooterLinks(dataset: SeoDataset, city: CitySeoPage): LinkItem[] {
  return resolveSeoRelations(
    dataset,
    [
      { kind: "home" },
      { kind: "city", citySlug: city.slug },
      ...city.enabledSpaceTypeSlugs.map((spaceTypeSlug) => ({
        kind: "spaceType" as const,
        spaceTypeSlug,
        label: getSpaceType(dataset, spaceTypeSlug)?.shortLabel,
      })),
    ],
    city,
  );
}

export function buildHeroForContext(context: PageContext) {
  const { city } = context;

  if (context.kind === "spaceType" && context.spaceType) {
    return {
      title: `${context.spaceType.titlePlural} en ${city.name}`,
      intro: `${context.spaceType.description} Compara zonas recomendadas y enlaces relacionados para encontrar una opcion lista para usar.`,
    };
  }

  if (context.kind === "useCase" && context.useCase) {
    return {
      title: `${context.useCase.title} en ${city.name}`,
      intro: `${context.useCase.description} Explora salas por horas en ${city.name} segun ubicacion, acceso y formato de trabajo.`,
    };
  }

  if (context.kind === "district" && context.district) {
    return {
      title: `Alquiler de salas en ${context.district.name}`,
      intro: `${context.district.description} Compara alternativas conectadas con otros barrios y formatos de sala en ${city.name}.`,
    };
  }

  return {
    title: city.h1,
    intro: city.intro,
  };
}

export function getAllSeoPaths(dataset: SeoDataset): string[] {
  const hubPaths = [
    ...dataset.spaceTypes.map(spaceTypeHubPath),
    useCasesHubPath(),
    ...dataset.useCases.map(useCaseHubPath),
  ];
  const cityPaths = dataset.cities.map(cityPath);
  const spacePaths = dataset.cities.flatMap((city) =>
    city.enabledSpaceTypeSlugs
      .map((slug) => getSpaceType(dataset, slug))
      .filter(isDefined)
      .map((spaceType) => spaceTypeCityPath(spaceType, city)),
  );
  const usePaths = dataset.cities.flatMap((city) =>
    city.enabledUseCaseSlugs
      .map((slug) => getUseCase(dataset, slug))
      .filter(isDefined)
      .map((useCase) => useCaseCityPath(useCase, city)),
  );
  const districtPaths = dataset.cities.flatMap((city) =>
    city.featuredDistrictSlugs
      .map((districtSlug) => getDistrict(city, districtSlug))
      .filter(isDefined)
      .map((district) => districtPath(city, district)),
  );

  return [...hubPaths, ...cityPaths, ...spacePaths, ...usePaths, ...districtPaths].filter(
    (path) => !siteConfig.bubbleOwnedRoutes.includes(path),
  );
}
