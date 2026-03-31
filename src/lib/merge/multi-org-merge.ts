import type { GithubRepo } from '@/lib/github/client'
import type { RepoKey } from '@/types/domain'

export function repoKeyFromFullName(fullName: string): RepoKey {
  return fullName.toLowerCase()
}

export function mergeRepoLists(byOrg: Map<string, GithubRepo[]>): GithubRepo[] {
  const map = new Map<RepoKey, GithubRepo>()
  for (const repos of byOrg.values()) {
    for (const r of repos) {
      const k = repoKeyFromFullName(r.full_name)
      if (!map.has(k)) map.set(k, r)
    }
  }
  return [...map.values()].sort((a, b) => b.stargazers_count - a.stargazers_count)
}

export function sizeHintFromStarsAndIssues(stars: number, issues: number): 'S' | 'M' | 'L' {
  const score = stars + issues * 2
  if (score < 50) return 'S'
  if (score < 500) return 'M'
  return 'L'
}
