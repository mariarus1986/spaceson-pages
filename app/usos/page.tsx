import { HubPage } from "@/components/HubPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { useCaseHubPath } from "@/lib/seo/routes";

export default async function UseCasesHubPage() {
  const dataset = await getSeoDataset();

  return (
    <HubPage
      title="Usos frecuentes"
      intro="Explora paginas SEO organizadas por objetivo de reserva."
      city={dataset.cities[0]}
      links={dataset.useCases.map((useCase) => ({
        label: useCase.title,
        href: useCaseHubPath(useCase),
      }))}
    />
  );
}
