import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPage } from "@/components/SeoPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCity, getUseCase, getUseCaseStaticParams } from "@/lib/seo/routes";

type PageProps = {
  params: {
    use: string;
    city: string;
  };
};

export async function generateStaticParams() {
  const dataset = await getSeoDataset();
  return getUseCaseStaticParams(dataset);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  const useCase = getUseCase(dataset, params.use);

  if (!city || !useCase) {
    return {};
  }

  const context = { kind: "useCase" as const, city, useCase };
  return buildMetadata(context);
}

export default async function UseCaseCityPage({ params }: PageProps) {
  const dataset = await getSeoDataset();
  const city = getCity(dataset, params.city);
  const useCase = getUseCase(dataset, params.use);

  if (!city || !useCase) {
    notFound();
  }

  return <SeoPage dataset={dataset} context={{ kind: "useCase", city, useCase }} />;
}
