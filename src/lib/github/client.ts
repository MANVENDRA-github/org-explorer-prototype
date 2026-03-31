import { parseRateLimitHeaders, sleep, secondsUntilReset } from './rate-limit'
import type { RateLimitState } from '@/types/domain'

const API = 'https://api.github.com'

export type RateLimitCallback = (s: RateLimitState | null) => void

export interface GitHubClientOptions {
  token?: string
  onRateLimit?: RateLimitCallback
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string,
  ) {
    super(message)
    this.name = 'GitHubError'
  }
}

let lastRateLimit: RateLimitState | null = null

export function getLastRateLimit(): RateLimitState | null {
  return lastRateLimit
}

export async function githubRequest<T>(
  path: string,
  options: GitHubClientOptions & { signal?: AbortSignal },
): Promise<T> {
  const { token, onRateLimit, signal } = options
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const url = path.startsWith('http') ? path : `${API}${path}`
  const res = await fetch(url, { headers, signal })

  const rl = parseRateLimitHeaders(res.headers)
  if (rl) {
    lastRateLimit = rl
    onRateLimit?.(rl)
    if (rl.remaining <= 0) {
      const wait = secondsUntilReset(rl.resetUnix) * 1000 + 500
      if (wait < 120_000) await sleep(wait)
    }
  }

  if (res.status === 304) {
    return undefined as T
  }

  if (!res.ok) {
    let body = ''
    try {
      body = await res.text()
    } catch {
      void 0
    }
    throw new GitHubError(body || res.statusText, res.status, path)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function githubPaginate<T>(
  pathBuilder: (page: number) => string,
  options: GitHubClientOptions & { maxPages?: number; signal?: AbortSignal },
  extract: (items: T[]) => boolean,
): Promise<T[]> {
  const maxPages = options.maxPages ?? 100
  const out: T[] = []
  for (let page = 1; page <= maxPages; page++) {
    const items = await githubRequest<T[]>(pathBuilder(page), options)
    if (!items?.length) break
    out.push(...items)
    if (extract(items)) break
    if (items.length < 100) break
  }
  return out
}

export interface GithubRepo {
  id: number
  name: string
  full_name: string
  stargazers_count: number
  forks_count: number
  pushed_at: string | null
  updated_at: string | null
  open_issues_count: number
  owner: { login: string }
}

export interface GithubContributor {
  id?: number
  login: string
  avatar_url: string
  contributions: number
}

export interface GithubPull {
  id: number
  number: number
  user: { id: number; login: string } | null
  created_at: string
  merged_at: string | null
  closed_at: string | null
  state: string
}

export interface GithubIssue {
  id: number
  pull_request?: unknown
  created_at: string
  closed_at: string | null
  user: { id: number; login: string } | null
}

export interface GithubOrg {
  login: string
  id: number
}
