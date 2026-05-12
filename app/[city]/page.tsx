import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/SeoPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCity, getCityStaticParams } from "@/lib/seo/routes";

type PageProps = {
  params: {
    city: string;
  };
};

export async function generateStaticParams() {
  const dataset = await getSeoDataset();
  return getCityStaticParams(dataset);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  if (!city) {
    return {};
  }

  const context = { kind: "city" as const, city };
  return buildMetadata(context);
}

export default async function CityPage({ params }: PageProps) {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  if (!city) {
    notFound();
  }

  return <SeoPage dataset={dataset} context={{ kind: "city", city }} />;
}
