export type LinkItem = {
  label: string;
  href: string;
};

export type SeoRelation =
  | {
      kind: "home";
      label?: string;
    }
  | {
      kind: "marketplace";
      label?: string;
    }
  | {
      kind: "city";
      citySlug: string;
      label?: string;
    }
  | {
      kind: "spaceType";
      spaceTypeSlug: string;
      citySlug?: string;
      label?: string;
    }
  | {
      kind: "spaceTypeHub";
      spaceTypeSlug: string;
      label?: string;
    }
  | {
      kind: "useCase";
      useCaseSlug: string;
      citySlug?: string;
      label?: string;
    }
  | {
      kind: "useCaseHub";
      useCaseSlug: string;
      label?: string;
    }
  | {
      kind: "district";
      citySlug?: string;
      districtSlug: string;
      label?: string;
    };

export type CardItem = LinkItem & {
  title: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type SpaceType = {
  slug: string;
  titleSingular: string;
  titlePlural: string;
  shortLabel: string;
  description: string;
};

export type UseCase = {
  slug: string;
  title: string;
  description: string;
};

export type CityReference = {
  slug: string;
  name: string;
};

export type District = {
  slug: string;
  name: string;
  description: string;
};

export type CitySeoPage = {
  slug: string;
  name: string;
  country: string;
  locale: string;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string;
  chips: string[];
  contentTitle: string;
  contentLede: string;
  body: string[];
  districts: District[];
  faqs: FaqItem[];
  relatedCitySlugs: string[];
  featuredDistrictSlugs: string[];
  enabledSpaceTypeSlugs: string[];
  enabledUseCaseSlugs: string[];
  prioritySearchRelations: SeoRelation[];
  strategicLinkRelations: SeoRelation[];
};

export type SeoPageKind = "city" | "spaceType" | "useCase" | "district";

export type PageContext = {
  kind: SeoPageKind;
  city: CitySeoPage;
  spaceType?: SpaceType;
  useCase?: UseCase;
  district?: District;
};

export type SeoDataset = {
  cityDirectory: CityReference[];
  cities: CitySeoPage[];
  spaceTypes: SpaceType[];
  useCases: UseCase[];
};
