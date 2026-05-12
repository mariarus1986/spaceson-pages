import { bubbleConfig } from "./config";

type BubbleListResponse<T> = {
  response?: {
    results?: T[];
    remaining?: number;
    cursor?: number;
  };
};

export class BubbleFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BubbleFetchError";
  }
}

export async function fetchBubbleList<T>(typeName: string): Promise<T[]> {
  if (!bubbleConfig.enabled) {
    return [];
  }

  if (!bubbleConfig.apiBaseUrl) {
    throw new BubbleFetchError("Missing BUBBLE_API_BASE_URL");
  }

  const results: T[] = [];
  let cursor = 0;
  let remaining = 0;

  do {
    const url = new URL(`/api/1.1/obj/${typeName}`, bubbleConfig.apiBaseUrl);
    url.searchParams.set("cursor", String(cursor));
    url.searchParams.set("limit", "100");

    const response = await fetch(url, {
      headers: bubbleConfig.apiToken
        ? {
            Authorization: `Bearer ${bubbleConfig.apiToken}`,
          }
        : undefined,
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      throw new BubbleFetchError(`Bubble request failed for ${typeName}: ${response.status}`);
    }

    const payload = (await response.json()) as BubbleListResponse<T>;
    const page = payload.response?.results ?? [];
    results.push(...page);
    remaining = payload.response?.remaining ?? 0;
    if (!page.length) {
      break;
    }
    cursor += page.length;
  } while (remaining > 0);

  return results;
}
