import type { MetadataRoute } from "next";
import { getSeoDataset } from "@/lib/bubble/seo";
import { absoluteUrl } from "@/lib/seo/urls";
import { getAllSeoPaths } from "@/lib/seo/page-builders";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dataset = await getSeoDataset();
  return getAllSeoPaths(dataset).map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly",
    priority: path === "/madrid/" ? 1 : 0.7,
  }));
}
