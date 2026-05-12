import { redirect } from "next/navigation";
import { getSeoDataset } from "@/lib/bubble/seo";
import { cityPath } from "@/lib/seo/routes";

export default async function HomePage() {
  const dataset = await getSeoDataset();
  redirect(cityPath(dataset.cities[0]));
}
