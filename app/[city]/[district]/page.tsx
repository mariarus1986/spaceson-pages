import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/SeoPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCity, getDistrict, getDistrictStaticParams } from "@/lib/seo/routes";

type PageProps = {
  params: {
    city: string;
    district: string;
  };
};

export async function generateStaticParams() {
  const dataset = await getSeoDataset();
  return getDistrictStaticParams(dataset);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  const district = city ? getDistrict(city, params.district) : undefined;

  if (!city || !district) {
    return {};
  }

  const context = { kind: "district" as const, city, district };
  return buildMetadata(context);
}

export default async function DistrictPage({ params }: PageProps) {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  const district = city ? getDistrict(city, params.district) : undefined;

  if (!city || !district) {
    notFound();
  }

  return <SeoPage dataset={dataset} context={{ kind: "district", city, district }} />;
}
