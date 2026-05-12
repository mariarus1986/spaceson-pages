import { cache } from "react";
import { fetchBubbleList } from "./client";
import { fallbackSeoDataset } from "@/lib/seo/data";
import type {
  CityReference,
  CitySeoPage,
  District,
  FaqItem,
  SeoDataset,
  SeoRelation,
  SpaceType,
  UseCase,
} from "@/lib/seo/types";

type BubbleRecord = Record<string, unknown>;

const bubbleTypes = {
  cityPages: "seo_city_page",
  cityDirectory: "seo_city",
  spaceTypes: "seo_space_type",
  useCases: "seo_use_case",
};

export const getSeoDataset = cache(async (): Promise<SeoDataset> => {
  try {
    const [cityRecords, cityDirectoryRecords, spaceTypeRecords, useCaseRecords] = await Promise.all([
      fetchBubbleList<BubbleRecord>(bubbleTypes.cityPages),
      fetchBubbleList<BubbleRecord>(bubbleTypes.cityDirectory),
      fetchBubbleList<BubbleRecord>(bubbleTypes.spaceTypes),
      fetchBubbleList<BubbleRecord>(bubbleTypes.useCases),
    ]);

    if (!cityRecords.length || !spaceTypeRecords.length || !useCaseRecords.length) {
      return fallbackSeoDataset;
    }

    return {
      cityDirectory: cityDirectoryRecords.length
        ? cityDirectoryRecords.map(mapCityReference)
        : cityRecords.map(mapCityReference),
      cities: cityRecords.map(mapCitySeoPage),
      spaceTypes: spaceTypeRecords.map(mapSpaceType),
      useCases: useCaseRecords.map(mapUseCase),
    };
  } catch {
    return fallbackSeoDataset;
  }
});

function mapCityReference(record: BubbleRecord): CityReference {
  return {
    slug: stringField(record, "slug"),
    name: stringField(record, "name", "nombre"),
  };
}

function mapSpaceType(record: BubbleRecord): SpaceType {
  return {
    slug: stringField(record, "slug"),
    titleSingular: stringField(record, "titleSingular", "title_singular", "titulo_singular"),
    titlePlural: stringField(record, "titlePlural", "title_plural", "titulo_plural"),
    shortLabel: stringField(record, "shortLabel", "short_label", "label"),
    description: stringField(record, "description", "descripcion"),
  };
}

function mapUseCase(record: BubbleRecord): UseCase {
  return {
    slug: stringField(record, "slug"),
    title: stringField(record, "title", "titulo", "name", "nombre"),
    description: stringField(record, "description", "descripcion"),
  };
}

function mapCitySeoPage(record: BubbleRecord): CitySeoPage {
  return {
    slug: stringField(record, "slug"),
    name: stringField(record, "name", "nombre"),
    country: stringField(record, "country", "pais"),
    locale: stringField(record, "locale", "idioma") || "es-ES",
    title: stringField(record, "title", "seo_title"),
    description: stringField(record, "description", "seo_description"),
    h1: stringField(record, "h1"),
    eyebrow: stringField(record, "eyebrow", "pretitle"),
    intro: stringField(record, "intro"),
    chips: stringArrayField(record, "chips"),
    contentTitle: stringField(record, "contentTitle", "content_title"),
    contentLede: stringField(record, "contentLede", "content_lede"),
    body: stringArrayField(record, "body", "seo_body", "paragraphs"),
    districts: recordArrayField(record, "districts", "barrios").map(mapDistrict),
    faqs: recordArrayField(record, "faqs", "faq").map(mapFaq),
    relatedCitySlugs: relationSlugArrayField(record, "relatedCities", "related_city_slugs"),
    featuredDistrictSlugs: relationSlugArrayField(record, "featuredDistricts", "featured_district_slugs"),
    enabledSpaceTypeSlugs: relationSlugArrayField(record, "enabledSpaceTypes", "enabled_space_type_slugs"),
    enabledUseCaseSlugs: relationSlugArrayField(record, "enabledUseCases", "enabled_use_case_slugs"),
    prioritySearchRelations: relationArrayField(record, "prioritySearchRelations", "priority_search_relations"),
    strategicLinkRelations: relationArrayField(record, "strategicLinkRelations", "strategic_link_relations"),
  };
}

function mapDistrict(record: BubbleRecord): District {
  return {
    slug: stringField(record, "slug"),
    name: stringField(record, "name", "nombre"),
    description: stringField(record, "description", "descripcion"),
  };
}

function mapFaq(record: BubbleRecord): FaqItem {
  return {
    question: stringField(record, "question", "pregunta"),
    answer: stringField(record, "answer", "respuesta"),
  };
}

function relationArrayField(record: BubbleRecord, ...keys: string[]): SeoRelation[] {
  return recordArrayField(record, ...keys) as SeoRelation[];
}

function relationSlugArrayField(record: BubbleRecord, ...keys: string[]): string[] {
  return arrayField(record, ...keys)
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (isRecord(item)) {
        return stringField(item, "slug", "Slug");
      }

      return "";
    })
    .filter(Boolean);
}

function stringArrayField(record: BubbleRecord, ...keys: string[]): string[] {
  return arrayField(record, ...keys).filter((item): item is string => typeof item === "string");
}

function recordArrayField(record: BubbleRecord, ...keys: string[]): BubbleRecord[] {
  return arrayField(record, ...keys).filter(isRecord);
}

function arrayField(record: BubbleRecord, ...keys: string[]): unknown[] {
  const value = field(record, ...keys);
  return Array.isArray(value) ? value : [];
}

function stringField(record: BubbleRecord, ...keys: string[]): string {
  const value = field(record, ...keys);

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function field(record: BubbleRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is BubbleRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
