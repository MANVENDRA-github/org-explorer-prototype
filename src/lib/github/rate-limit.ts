import type { RateLimitState } from '@/types/domain'

export function parseRateLimitHeaders(headers: Headers): RateLimitState | null {
  const remaining = headers.get('x-ratelimit-remaining')
  const limit = headers.get('x-ratelimit-limit')
  const reset = headers.get('x-ratelimit-reset')
  const used = headers.get('x-ratelimit-used')
  const resource = headers.get('x-ratelimit-resource') ?? 'core'
  if (remaining == null || limit == null || reset == null) return null
  return {
    remaining: Number(remaining),
    limit: Number(limit),
    resetUnix: Number(reset),
    used: used != null ? Number(used) : Number(limit) - Number(remaining),
    resource,
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function secondsUntilReset(resetUnix: number): number {
  return Math.max(0, resetUnix - Math.floor(Date.now() / 1000))
}
