import { HubPage } from "@/components/HubPage";
import { getSeoDataset } from "@/lib/bubble/seo";
import { getSpaceType, spaceTypeCityPath } from "@/lib/seo/routes";

export default async function SpaceTypeHubPage() {
  const dataset = await getSeoDataset();
  const spaceType = getSpaceType(dataset, "salas-de-formacion");
  if (!spaceType) {
    return null;
  }

  return (
    <HubPage
      title={spaceType.titlePlural}
      intro={spaceType.description}
      city={dataset.cities[0]}
      links={dataset.cityDirectory.map((city) => ({
        label: `${spaceType.titlePlural} en ${city.name}`,
        href: spaceTypeCityPath(spaceType, city),
      }))}
    />
  );
}
