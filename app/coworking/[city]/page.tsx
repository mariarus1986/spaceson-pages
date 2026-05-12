import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/SeoPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCity, getSpaceType, getSpaceTypeStaticParams } from "@/lib/seo/routes";

const spaceTypeSlug = "coworking";

type PageProps = {
  params: {
    city: string;
  };
};

export async function generateStaticParams() {
  const dataset = await getSeoDataset();
  return getSpaceTypeStaticParams(dataset, spaceTypeSlug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  const spaceType = getSpaceType(dataset, spaceTypeSlug);

  if (!city || !spaceType) {
    return {};
  }

  const context = { kind: "spaceType" as const, city, spaceType };
  return buildMetadata(context);
}

export default async function SpaceTypeCityPage({ params }: PageProps) {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  const spaceType = getSpaceType(dataset, spaceTypeSlug);

  if (!city || !spaceType) {
    notFound();
  }

  return <SeoPage dataset={dataset} context={{ kind: "spaceType", city, spaceType }} />;
}
