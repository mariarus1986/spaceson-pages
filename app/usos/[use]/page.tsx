import { notFound } from "next/navigation";
import { HubPage } from "@/components/HubPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { getUseCase, useCaseCityPath } from "@/lib/seo/routes";

type PageProps = {
  params: {
    use: string;
  };
};

export async function generateStaticParams() {
  const dataset = await getSeoDataset();
  return dataset.useCases.map((useCase) => ({ use: useCase.slug }));
}

export default async function UseCaseHubPage({ params }: PageProps) {
  const dataset = await getSeoDataset();
  const useCase = getUseCase(dataset, params.use);

  if (!useCase) {
    notFound();
  }

  return (
    <HubPage
      title={useCase.title}
      intro={useCase.description}
      city={dataset.cities[0]}
      links={dataset.cityDirectory.map((city) => ({
        label: `${useCase.title} en ${city.name}`,
        href: useCaseCityPath(useCase, city),
      }))}
    />
  );
}
