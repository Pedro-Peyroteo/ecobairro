/**
 * Typed HTTP helper for JSON API requests.
 * Wraps fetch with URL building, JSON parsing, and typed error handling.
 *
 * Usage:
 *   import { fetchJson } from '@/lib/http/fetch-json'
 *   import { clientEnv } from '@/lib/env'
 *
 *   const data = await fetchJson<MyResponse>('/v1/ecopontos', {
 *     baseUrl: clientEnv.apiBaseUrl,
 *   })
 */

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`HTTP ${status}: ${statusText}`)
    this.name = 'HttpError'
  }
}

export interface FetchJsonOptions extends RequestInit {
  /** Prepended to the path. Defaults to '' (relative). */
  baseUrl?: string
  /** Query string params appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>
}

export async function fetchJson<T = unknown>(
  path: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { baseUrl = '', params, ...init } = options

  // Build URL
  const url = new URL(`${baseUrl}${path}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  // Default headers
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(url.toString(), { ...init, headers })

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = await response.text()
    }
    throw new HttpError(response.status, response.statusText, body)
  }

  // 204 No Content — return undefined cast to T
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return response.text() as unknown as T
}
