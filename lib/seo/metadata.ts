import type { Metadata } from "next";
import { siteConfig } from "./config";
import { getPageDescription, getPageTitle } from "./page-meta";
import { absoluteUrl, getCanonicalPath } from "./urls";
import type { PageContext } from "./types";

export function buildMetadata(context: PageContext): Metadata {
  const title = getPageTitle(context);
  const description = getPageDescription(context);
  const canonical = absoluteUrl(getCanonicalPath(context));

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: context.city.locale.replace("-", "_"),
      title,
      description,
      url: canonical,
      siteName: siteConfig.brandName,
    },
  };
}
