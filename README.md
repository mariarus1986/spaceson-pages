# SpacesON SEO Pages

Next.js App Router implementation for programmatic SEO pages only.

Bubble remains responsible for transactional product routes, including:

- `/empresa/`
- `/espacio-horas/`

This app owns SEO route families such as:

- `/{city}/`
- `/salas-de-reunion/{city}/`
- `/salas-de-formacion/{city}/`
- `/coworking/{city}/`
- `/salas-para-eventos/{city}/`
- `/usos/{use}/{city}/`
- `/{city}/{district}/`

## Data Model

Programmatic content lives in `lib/seo/data.ts`.

- `cities`: city landing pages, editorial body, districts, FAQs, sidebar links
- `spaceTypes`: reusable type pages such as meeting rooms and coworking
- `useCases`: reusable use pages such as interviews and workshops

Reusable rendering lives in `components/`, and route-specific metadata/schema is generated from `lib/seo/schema.ts`.

## Bubble Boundary

The Next.js app should be mounted or proxied only for SEO page families. Bubble-owned transactional paths are listed in `lib/seo/config.ts` and intentionally excluded from sitemap generation.

## Relational Internal Linking

Internal links are resolved from Bubble-style relations instead of stored URLs.

City records expose relation fields such as `relatedCitySlugs`, `featuredDistrictSlugs`, `enabledSpaceTypeSlugs`, `enabledUseCaseSlugs`, `prioritySearchRelations`, and `strategicLinkRelations`. The resolver in `lib/seo/relations.ts` turns those related records into URLs centrally, so templates do not need to hardcode page paths.

## Bubble Fetching

Bubble fetching lives in `lib/bubble/`.

- `lib/bubble/client.ts`: small Bubble Data API client
- `lib/bubble/seo.ts`: maps Bubble records into the SEO dataset consumed by pages
- `lib/seo/data.ts`: local fallback dataset used when Bubble fetching is disabled or unavailable

Expected environment variables:

```bash
BUBBLE_SEO_API_ENABLED=true
BUBBLE_API_BASE_URL=https://your-app.bubbleapps.io
BUBBLE_API_TOKEN=your-private-api-token
```

Expected Bubble data types are currently named:

- `seo_city_page`
- `seo_city`
- `seo_space_type`
- `seo_use_case`

## Metadata And JSON-LD

The uploaded HTML metadata is modularized under `lib/seo/`.

- `urls.ts`: canonical paths, absolute URLs, breadcrumbs
- `page-meta.ts`: page title and meta description text
- `metadata.ts`: Next.js `Metadata` object with canonical and Open Graph
- `jsonld.ts`: Schema.org graph for `WebPage`, `BreadcrumbList`, `ItemList`, and `FAQPage`

Route files call `buildMetadata(context)`. Page rendering calls `buildJsonLd(dataset, context)` through the reusable `JsonLd` component.
