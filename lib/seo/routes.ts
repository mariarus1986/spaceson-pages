import type { CitySeoPage, District, SeoDataset, SpaceType, UseCase } from "./types";

export function getCity(dataset: SeoDataset, slug: string): CitySeoPage | undefined {
  return dataset.cities.find((city) => city.slug === slug);
}

export function getSpaceType(dataset: SeoDataset, slug: string): SpaceType | undefined {
  return dataset.spaceTypes.find((spaceType) => spaceType.slug === slug);
}

export function getUseCase(dataset: SeoDataset, slug: string): UseCase | undefined {
  return dataset.useCases.find((useCase) => useCase.slug === slug);
}

export function getDistrict(city: CitySeoPage, slug: string): District | undefined {
  return city.districts.find((district) => district.slug === slug);
}

export function homePath(): string {
  return "/";
}

export function cityPath(city: Pick<CitySeoPage, "slug">): string {
  return `/${city.slug}/`;
}

export function spaceTypeCityPath(spaceType: SpaceType, city: Pick<CitySeoPage, "slug">): string {
  return `/${spaceType.slug}/${city.slug}/`;
}

export function spaceTypeHubPath(spaceType: SpaceType): string {
  return `/${spaceType.slug}/`;
}

export function useCaseCityPath(useCase: UseCase, city: Pick<CitySeoPage, "slug">): string {
  return `/usos/${useCase.slug}/${city.slug}/`;
}

export function useCaseHubPath(useCase: UseCase): string {
  return `/usos/${useCase.slug}/`;
}

export function useCasesHubPath(): string {
  return "/usos/";
}

export function districtPath(city: CitySeoPage, district: District): string {
  return `/${city.slug}/${district.slug}/`;
}

export function getCityStaticParams(dataset: SeoDataset) {
  return dataset.cities.map((city) => ({ city: city.slug }));
}

export function getSpaceTypeStaticParams(dataset: SeoDataset, spaceTypeSlug: string) {
  return dataset.cities
    .filter(() => Boolean(getSpaceType(dataset, spaceTypeSlug)))
    .map((city) => ({ city: city.slug }));
}

export function getUseCaseStaticParams(dataset: SeoDataset) {
  return dataset.useCases.flatMap((useCase) =>
    dataset.cities.map((city) => ({ use: useCase.slug, city: city.slug })),
  );
}

export function getDistrictStaticParams(dataset: SeoDataset) {
  return dataset.cities.flatMap((city) =>
    city.districts.map((district) => ({
      city: city.slug,
      district: district.slug,
    })),
  );
}
