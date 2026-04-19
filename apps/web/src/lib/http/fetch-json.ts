export class HttpError extends Error {
  status: number;
  statusText: string;
  body: unknown;
  url: string;

  constructor({
    body,
    status,
    statusText,
    url,
  }: {
    body: unknown;
    status: number;
    statusText: string;
    url: string;
  }) {
    super(`Request to ${url} failed with ${status} ${statusText}.`);
    this.name = "HttpError";
    this.body = body;
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export type FetchJsonOptions = RequestInit & {
  baseUrl?: string;
  query?: Record<string, QueryValue>;
};

function resolveOrigin(baseUrl?: string) {
  if (baseUrl) {
    return baseUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost";
}

function buildUrl(
  input: string,
  baseUrl?: string,
  query?: Record<string, QueryValue>,
) {
  const url = new URL(input, resolveOrigin(baseUrl));

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function fetchJson<T>(
  input: string,
  { baseUrl, query, headers, ...init }: FetchJsonOptions = {},
) {
  const url = buildUrl(input, baseUrl, query);
  const response = await fetch(url.toString(), {
    ...init,
    headers: new Headers(headers),
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new HttpError({
      body,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
    });
  }

  return body as T;
}
