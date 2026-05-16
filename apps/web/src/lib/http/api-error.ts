import { HttpError } from '@/lib/http/fetch-json'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpError)) {
    return fallback
  }

  const { body } = error
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message
    if (Array.isArray(message)) {
      return message.map(String).join(' ')
    }
    if (typeof message === 'string') {
      return message
    }
  }

  return fallback
}
