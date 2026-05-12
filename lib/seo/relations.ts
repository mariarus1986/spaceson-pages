import { siteConfig } from "./config";
import {
  cityPath,
  districtPath,
  getCity,
  getDistrict,
  getSpaceType,
  getUseCase,
  homePath,
  spaceTypeHubPath,
  spaceTypeCityPath,
  useCaseCityPath,
  useCaseHubPath,
} from "./routes";
import type { CityReference, CitySeoPage, LinkItem, SeoDataset, SeoRelation } from "./types";

export function resolveSeoRelation(
  dataset: SeoDataset,
  relation: SeoRelation,
  currentCity: CitySeoPage,
): LinkItem | undefined {
  if (relation.kind === "home") {
    return {
      label: relation.label ?? "Inicio",
      href: homePath(),
    };
  }

  if (relation.kind === "marketplace") {
    return {
      label: relation.label ?? "Marketplace principal",
      href: siteConfig.marketplaceUrl,
    };
  }

  if (relation.kind === "city") {
    const city = getCityReference(dataset, relation.citySlug);
    if (!city) {
      return undefined;
    }

    return {
      label: relation.label ?? city.name,
      href: cityPath(city),
    };
  }

  if (relation.kind === "spaceType") {
    const citySlug = relation.citySlug ?? currentCity.slug;
    const city = getCity(dataset, citySlug) ?? getCityReference(dataset, citySlug);
    const spaceType = getSpaceType(dataset, relation.spaceTypeSlug);
    if (!city || !spaceType) {
      return undefined;
    }

    return {
      label: relation.label ?? `${spaceType.titlePlural} en ${city.name}`,
      href: spaceTypeCityPath(spaceType, city),
    };
  }

  if (relation.kind === "spaceTypeHub") {
    const spaceType = getSpaceType(dataset, relation.spaceTypeSlug);
    if (!spaceType) {
      return undefined;
    }

    return {
      label: relation.label ?? spaceType.titlePlural,
      href: spaceTypeHubPath(spaceType),
    };
  }

  if (relation.kind === "useCase") {
    const citySlug = relation.citySlug ?? currentCity.slug;
    const city = getCity(dataset, citySlug) ?? getCityReference(dataset, citySlug);
    const useCase = getUseCase(dataset, relation.useCaseSlug);
    if (!city || !useCase) {
      return undefined;
    }

    return {
      label: relation.label ?? `${useCase.title} en ${city.name}`,
      href: useCaseCityPath(useCase, city),
    };
  }

  if (relation.kind === "useCaseHub") {
    const useCase = getUseCase(dataset, relation.useCaseSlug);
    if (!useCase) {
      return undefined;
    }

    return {
      label: relation.label ?? useCase.title,
      href: useCaseHubPath(useCase),
    };
  }

  const city = getCity(dataset, relation.citySlug ?? currentCity.slug);
  const district = city ? getDistrict(city, relation.districtSlug) : undefined;
  if (!city || !district) {
    return undefined;
  }

  return {
    label: relation.label ?? district.name,
    href: districtPath(city, district),
  };
}

export function resolveSeoRelations(
  dataset: SeoDataset,
  relations: SeoRelation[],
  currentCity: CitySeoPage,
): LinkItem[] {
  return relations
    .map((relation) => resolveSeoRelation(dataset, relation, currentCity))
    .filter((link): link is LinkItem => Boolean(link));
}

export function getRelatedCities(dataset: SeoDataset, city: CitySeoPage): CityReference[] {
  return city.relatedCitySlugs
    .map((slug) => getCityReference(dataset, slug))
    .filter((candidate): candidate is CityReference => Boolean(candidate));
}

export function getCityReference(dataset: SeoDataset, slug: string): CityReference | undefined {
  return dataset.cityDirectory.find((city) => city.slug === slug);
}
