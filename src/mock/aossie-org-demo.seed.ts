import { db } from '@/lib/idb/database'
import { weekKey } from '@/lib/analytics/rollups'
import type {
  NormalizedRepo,
  NormalizedContributor,
  ContributionEdge,
  BucketStats,
  OrgConfig,
} from '@/types/domain'
import type { Insight } from '@/types/insights'

export const USE_AOSSIE_DEMO_SEED = true

export const AOSSIE_DEMO_ORG_SNAPSHOT = {
  login: 'AOSSIE-Org',
  followers: 1067,
  publicRepos: 69,
  websiteUrl: 'https://aossie.org',
  publicMembersListed: 1024,
  source: 'GitHub REST API',
  capturedAt: '2026-03-31',
} as const

const ORG = 'aossie-org'
const DEMO_META_KEY = 'aossie_demo_applied'
const DEMO_SEED_VERSION_META = 'aossie_demo_seed_version'
const COHORT_SOURCE_META = 'cohort_source'

const AOSSIE_DEMO_SEED_VERSION = 4

const DEMO_CONTRIBUTOR_COUNT = 1024

const REPO_FACTS: Array<{
  name: string
  stars: number
  forks: number
  openIssues: number
  lang: string
  pushedAt: string
  prsMerged: number
  prsOpened: number
  issuesClosed: number
  uniqueContributors: number
}> = [
  { name: "Resonate", stars: 348, forks: 367, openIssues: 123,
    lang: "Dart", pushedAt: "2026-02-11T17:18:41Z",
    prsOpened: 195, prsMerged: 107, issuesClosed: 477, uniqueContributors: 38 },
  { name: "PictoPy", stars: 230, forks: 625, openIssues: 299,
    lang: "Python", pushedAt: "2026-02-27T13:37:13Z",
    prsOpened: 189, prsMerged: 160, issuesClosed: 443, uniqueContributors: 36 },
  { name: "EduAid", stars: 166, forks: 437, openIssues: 448,
    lang: "JavaScript", pushedAt: "2026-03-17T19:03:24Z",
    prsOpened: 194, prsMerged: 155, issuesClosed: 474, uniqueContributors: 25 },
  { name: "Agora-Blockchain", stars: 93, forks: 195, openIssues: 95,
    lang: "JavaScript", pushedAt: "2026-02-11T19:18:25Z",
    prsOpened: 69, prsMerged: 44, issuesClosed: 159, uniqueContributors: 13 },
  { name: "Website", stars: 91, forks: 375, openIssues: 13,
    lang: "JavaScript", pushedAt: "2026-03-27T03:43:28Z",
    prsOpened: 48, prsMerged: 26, issuesClosed: 274, uniqueContributors: 18 },
  { name: "InPactAI", stars: 89, forks: 151, openIssues: 172,
    lang: "TypeScript", pushedAt: "2026-03-26T11:57:10Z",
    prsOpened: 87, prsMerged: 69, issuesClosed: 186, uniqueContributors: 12 },
  { name: "Devr.AI", stars: 86, forks: 142, openIssues: 120,
    lang: "Python", pushedAt: "2026-02-11T19:14:35Z",
    prsOpened: 73, prsMerged: 47, issuesClosed: 134, uniqueContributors: 12 },
  { name: "DebateAI", stars: 56, forks: 167, openIssues: 246,
    lang: "TypeScript", pushedAt: "2026-03-19T15:51:07Z",
    prsOpened: 89, prsMerged: 48, issuesClosed: 255, uniqueContributors: 10 },
  { name: "BabyNest", stars: 53, forks: 127, openIssues: 111,
    lang: "JavaScript", pushedAt: "2026-03-02T17:25:05Z",
    prsOpened: 53, prsMerged: 39, issuesClosed: 119, uniqueContributors: 9 },
  { name: "Monumento", stars: 51, forks: 83, openIssues: 30,
    lang: "Dart", pushedAt: "2026-02-11T19:15:28Z",
    prsOpened: 32, prsMerged: 20, issuesClosed: 82, uniqueContributors: 8 },
  { name: "Social-Street-Smart", stars: 48, forks: 100, openIssues: 37,
    lang: "Jupyter Notebook", pushedAt: "2026-02-11T19:11:31Z",
    prsOpened: 33, prsMerged: 28, issuesClosed: 86, uniqueContributors: 8 },
  { name: "Perspective", stars: 43, forks: 84, openIssues: 45,
    lang: "TypeScript", pushedAt: "2026-02-11T19:13:38Z",
    prsOpened: 32, prsMerged: 19, issuesClosed: 70, uniqueContributors: 7 },
  { name: "Info", stars: 42, forks: 64, openIssues: 2,
    lang: "Other", pushedAt: "2026-03-27T03:57:15Z",
    prsOpened: 21, prsMerged: 11, issuesClosed: 74, uniqueContributors: 6 },
  { name: "Resonate-Backend", stars: 40, forks: 123, openIssues: 32,
    lang: "JavaScript", pushedAt: "2026-01-18T12:29:59Z",
    prsOpened: 28, prsMerged: 22, issuesClosed: 91, uniqueContributors: 8 },
  { name: "Ell-ena", stars: 37, forks: 88, openIssues: 104,
    lang: "Dart", pushedAt: "2026-03-29T11:37:35Z",
    prsOpened: 44, prsMerged: 28, issuesClosed: 110, uniqueContributors: 7 },
  { name: "Resonate-Website", stars: 36, forks: 151, openIssues: 58,
    lang: "JavaScript", pushedAt: "2026-03-15T18:01:29Z",
    prsOpened: 32, prsMerged: 19, issuesClosed: 92, uniqueContributors: 8 },
  { name: "Rein", stars: 30, forks: 75, openIssues: 42,
    lang: "TypeScript", pushedAt: "2026-03-27T08:04:19Z",
    prsOpened: 25, prsMerged: 16, issuesClosed: 53, uniqueContributors: 5 },
  { name: "OpenPeerChat-flutter", stars: 27, forks: 54, openIssues: 24,
    lang: "Dart", pushedAt: "2026-02-11T19:12:26Z",
    prsOpened: 19, prsMerged: 16, issuesClosed: 46, uniqueContributors: 5 },
  { name: "CarbonFootprint-API", stars: 22, forks: 12, openIssues: 1,
    lang: "JavaScript", pushedAt: "2026-02-11T19:08:00Z",
    prsOpened: 11, prsMerged: 6, issuesClosed: 28, uniqueContributors: 3 },
  { name: "NeuroTrack", stars: 21, forks: 52, openIssues: 75,
    lang: "Dart", pushedAt: "2026-03-08T04:23:49Z",
    prsOpened: 28, prsMerged: 15, issuesClosed: 78, uniqueContributors: 4 },
  { name: "Aossie-Scholar", stars: 18, forks: 18, openIssues: 3,
    lang: "JavaScript", pushedAt: "2026-02-11T19:09:42Z",
    prsOpened: 9, prsMerged: 6, issuesClosed: 26, uniqueContributors: 3 },
  { name: "Agora-Android", stars: 16, forks: 48, openIssues: 6,
    lang: "Java", pushedAt: "2026-02-11T19:11:08Z",
    prsOpened: 9, prsMerged: 5, issuesClosed: 38, uniqueContributors: 4 },
  { name: "DocPilot", stars: 13, forks: 23, openIssues: 31,
    lang: "Dart", pushedAt: "2026-03-28T13:52:26Z",
    prsOpened: 13, prsMerged: 11, issuesClosed: 33, uniqueContributors: 3 },
  { name: "OrgExplorer", stars: 12, forks: 42, openIssues: 45,
    lang: "JavaScript", pushedAt: "2026-02-25T22:54:41Z",
    prsOpened: 17, prsMerged: 13, issuesClosed: 47, uniqueContributors: 4 },
  { name: "SmartNotes", stars: 12, forks: 30, openIssues: 22,
    lang: "Other", pushedAt: "2026-03-21T08:00:02Z",
    prsOpened: 11, prsMerged: 8, issuesClosed: 24, uniqueContributors: 3 },
  { name: "SocialShareButton", stars: 12, forks: 44, openIssues: 54,
    lang: "JavaScript", pushedAt: "2026-03-30T23:47:17Z",
    prsOpened: 19, prsMerged: 15, issuesClosed: 56, uniqueContributors: 4 },
  { name: "CarbonFootprint", stars: 11, forks: 7, openIssues: 1,
    lang: "JavaScript", pushedAt: "2026-02-11T19:07:29Z",
    prsOpened: 5, prsMerged: 3, issuesClosed: 14, uniqueContributors: 2 },
  { name: "Template-Repo", stars: 11, forks: 26, openIssues: 28,
    lang: "Other", pushedAt: "2026-03-30T23:24:54Z",
    prsOpened: 12, prsMerged: 9, issuesClosed: 29, uniqueContributors: 2 },
  { name: "CarbonFootprint-Mobile", stars: 10, forks: 13, openIssues: 5,
    lang: "JavaScript", pushedAt: "2026-02-11T19:08:36Z",
    prsOpened: 6, prsMerged: 4, issuesClosed: 15, uniqueContributors: 2 },
  { name: "Gitcord-GithubDiscordBot", stars: 9, forks: 13, openIssues: 3,
    lang: "Python", pushedAt: "2026-03-28T06:40:46Z",
    prsOpened: 4, prsMerged: 2, issuesClosed: 14, uniqueContributors: 2 },
  { name: "OpenVerifiableLLM", stars: 9, forks: 28, openIssues: 33,
    lang: "Python", pushedAt: "2026-03-17T21:19:05Z",
    prsOpened: 12, prsMerged: 7, issuesClosed: 34, uniqueContributors: 2 },
  { name: "LibrEd", stars: 8, forks: 11, openIssues: 5,
    lang: "Python", pushedAt: "2026-03-27T05:28:05Z",
    prsOpened: 5, prsMerged: 3, issuesClosed: 12, uniqueContributors: 2 },
  { name: "Zplit", stars: 8, forks: 4, openIssues: 0,
    lang: "Dart", pushedAt: "2025-11-08T08:08:33Z",
    prsOpened: 4, prsMerged: 2, issuesClosed: 10, uniqueContributors: 2 },
  { name: "PictoPy-Website", stars: 7, forks: 13, openIssues: 23,
    lang: "TypeScript", pushedAt: "2026-03-01T01:44:49Z",
    prsOpened: 8, prsMerged: 4, issuesClosed: 24, uniqueContributors: 2 },
  { name: "Agora-Web", stars: 6, forks: 8, openIssues: 0,
    lang: "HTML", pushedAt: "2026-02-11T19:10:41Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 10, uniqueContributors: 2 },
  { name: "Agora-web-frontend", stars: 6, forks: 9, openIssues: 1,
    lang: "SCSS", pushedAt: "2026-02-11T19:08:48Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 10, uniqueContributors: 2 },
  { name: "MindTheWord", stars: 6, forks: 8, openIssues: 0,
    lang: "JavaScript", pushedAt: "2026-02-11T19:06:59Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 10, uniqueContributors: 2 },
  { name: "Starcross-Android", stars: 6, forks: 7, openIssues: 0,
    lang: "Java", pushedAt: "2026-02-11T19:07:09Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 9, uniqueContributors: 2 },
  { name: "SupportUsButton", stars: 6, forks: 9, openIssues: 3,
    lang: "TypeScript", pushedAt: "2026-03-28T05:15:24Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 9, uniqueContributors: 2 },
  { name: "Agora", stars: 5, forks: 11, openIssues: 7,
    lang: "Scala", pushedAt: "2026-02-11T19:11:55Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 8, uniqueContributors: 2 },
  { name: "BringYourOwnKey", stars: 4, forks: 0, openIssues: 1,
    lang: "TypeScript", pushedAt: "2026-03-17T06:53:43Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 4, uniqueContributors: 2 },
  { name: "Djed-Solidity-WebDashboard", stars: 4, forks: 5, openIssues: 0,
    lang: "Other", pushedAt: "2024-02-22T18:10:33Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 6, uniqueContributors: 2 },
  { name: "Agora-iOS", stars: 3, forks: 4, openIssues: 0,
    lang: "Swift", pushedAt: "2026-02-11T19:08:26Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 5, uniqueContributors: 2 },
  { name: "CarbonFootPrint-Alexa", stars: 3, forks: 1, openIssues: 0,
    lang: "JavaScript", pushedAt: "2026-02-11T19:06:48Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 3, uniqueContributors: 2 },
  { name: "Slagora", stars: 3, forks: 2, openIssues: 0,
    lang: "Scala", pushedAt: "2026-02-11T19:09:00Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 4, uniqueContributors: 2 },
  { name: "starcross", stars: 3, forks: 2, openIssues: 0,
    lang: "Objective-C", pushedAt: "2026-02-11T19:07:50Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 4, uniqueContributors: 2 },
  { name: "WebSift", stars: 3, forks: 3, openIssues: 1,
    lang: "Other", pushedAt: "2026-03-04T13:59:38Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 4, uniqueContributors: 2 },
  { name: ".github", stars: 2, forks: 2, openIssues: 1,
    lang: "Other", pushedAt: "2026-03-08T04:08:22Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 3, uniqueContributors: 2 },
  { name: "AutoInitialIssues", stars: 2, forks: 2, openIssues: 2,
    lang: "JavaScript", pushedAt: "2026-03-14T06:08:05Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 3, uniqueContributors: 2 },
  { name: "CarbonAssistant-Function", stars: 2, forks: 3, openIssues: 1,
    lang: "JavaScript", pushedAt: "2026-02-11T19:08:10Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 3, uniqueContributors: 2 },
  { name: "ComputationalPhilosophy", stars: 2, forks: 2, openIssues: 0,
    lang: "TeX", pushedAt: "2026-02-11T19:06:38Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 3, uniqueContributors: 2 },
  { name: "ContributorAutomation", stars: 2, forks: 1, openIssues: 2,
    lang: "Other", pushedAt: "2026-02-11T13:37:02Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 2, uniqueContributors: 2 },
  { name: "CrowdAlert-Mobile", stars: 2, forks: 4, openIssues: 0,
    lang: "JavaScript", pushedAt: "2026-02-11T19:07:40Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 4, uniqueContributors: 2 },
  { name: "CrowdAlert-Web", stars: 2, forks: 10, openIssues: 0,
    lang: "JavaScript", pushedAt: "2026-02-11T19:07:19Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 7, uniqueContributors: 2 },
  { name: "OpenPeerChat-react-native", stars: 2, forks: 6, openIssues: 6,
    lang: "JavaScript", pushedAt: "2026-02-11T19:10:28Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 6, uniqueContributors: 2 },
  { name: "SciKitLearn-Rust", stars: 2, forks: 1, openIssues: 0,
    lang: "Other", pushedAt: "2026-02-11T19:11:44Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 2, uniqueContributors: 2 },
  { name: "AOSSIE-Blogs", stars: 1, forks: 3, openIssues: 1,
    lang: "SCSS", pushedAt: "2026-02-11T19:09:18Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 2, uniqueContributors: 2 },
  { name: "CarbonAssistant-Agent", stars: 1, forks: 1, openIssues: 0,
    lang: "Other", pushedAt: "2026-02-11T19:05:49Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "CodingAgent", stars: 1, forks: 1, openIssues: 0,
    lang: "Other", pushedAt: "2026-02-27T15:25:04Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "CrowdAlert", stars: 1, forks: 3, openIssues: 0,
    lang: "JavaScript", pushedAt: "2018-05-07T15:51:16Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 2, uniqueContributors: 2 },
  { name: "MindTheWord-Mobile", stars: 1, forks: 1, openIssues: 0,
    lang: "TypeScript", pushedAt: "2026-02-11T19:06:20Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "P2PRelay", stars: 1, forks: 1, openIssues: 0,
    lang: "Other", pushedAt: "2026-02-11T19:10:54Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "Scavenger", stars: 1, forks: 1, openIssues: 0,
    lang: "SMT", pushedAt: "2026-02-11T19:06:11Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "Sensala", stars: 1, forks: 1, openIssues: 0,
    lang: "Scala", pushedAt: "2026-02-11T19:05:58Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "Skeptik", stars: 1, forks: 1, openIssues: 0,
    lang: "SMT", pushedAt: "2026-02-11T19:06:28Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 1, uniqueContributors: 2 },
  { name: "Skills", stars: 1, forks: 2, openIssues: 0,
    lang: "Other", pushedAt: "2026-03-08T17:25:41Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 2, uniqueContributors: 2 },
  { name: "SummerOfCode-Reports", stars: 1, forks: 7, openIssues: 5,
    lang: "Other", pushedAt: "2026-02-11T19:14:21Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 5, uniqueContributors: 2 },
  { name: "Gitcord-Test", stars: 0, forks: 0, openIssues: 4,
    lang: "Other", pushedAt: "2026-03-26T12:29:01Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 4, uniqueContributors: 2 },
  { name: "social-street-smart-api", stars: 0, forks: 0, openIssues: 0,
    lang: "Other", pushedAt: "2023-06-25T04:30:10Z",
    prsOpened: 3, prsMerged: 2, issuesClosed: 0, uniqueContributors: 2 },
]

const PEOPLE: Array<{ id: number; login: string; weightBias: number }> = [
  { id: 53724307, login: 'aaryankotharii', weightBias: 1.35 },
  { id: 25280541, login: 'aayushdutt', weightBias: 1.33 },
  { id: 38162294, login: 'ad6398', weightBias: 1.31 },
  { id: 42573842, login: 'adityabisoi', weightBias: 1.3 },
  { id: 84623707, login: 'Archit381', weightBias: 1.28 },
  { id: 144162711, login: 'AyaNady17', weightBias: 1.26 },
  { id: 41890434, login: 'chandansgowda', weightBias: 1.24 },
  { id: 42653703, login: 'chirag-singhal', weightBias: 1.23 },
  { id: 105799602, login: 'DeveloperAmrit', weightBias: 1.21 },
  { id: 76870298, login: 'hackeramitkumar', weightBias: 1.19 },
  { id: 33792202, login: 'harkishen', weightBias: 1.17 },
  { id: 73700675, login: 'hasanravda', weightBias: 1.15 },
  { id: 43133646, login: 'jddeep', weightBias: 1.14 },
  { id: 25744170, login: 'joydeep1701', weightBias: 1.12 },
  { id: 28304184, login: 'makhanovable', weightBias: 1.1 },
  { id: 59914433, login: 'mdmohsin7', weightBias: 1.08 },
  { id: 58695010, login: 'MiHarsh', weightBias: 1.06 },
  { id: 33973666, login: 'MukulCode', weightBias: 1.05 },
  { id: 22762181, login: 'nveenjain', weightBias: 1.03 },
  { id: 96537779, login: 'Pranav0-0Aggarwal', weightBias: 1.01 },
  { id: 87240342, login: 'prarabdhshukla', weightBias: 0.99 },
  { id: 20471162, login: 'prudhvir3ddy', weightBias: 0.98 },
  { id: 15330327, login: 'raghavpuri31', weightBias: 0.96 },
  { id: 44135362, login: 'Rits1272', weightBias: 0.94 },
  { id: 9396452, login: 'saisankargochhayat', weightBias: 0.92 },
  { id: 189630694, login: 'shubham5080', weightBias: 0.9 },
  { id: 18613564, login: 'thakursaurabh1998', weightBias: 0.89 },
  { id: 17289840, login: 'thuva4', weightBias: 0.87 },
  { id: 28961693, login: 'us241098', weightBias: 0.85 },
  { id: 2326183, login: 'varunchitre15', weightBias: 0.83 },
  { id: 23319631, login: 'vibhavagarwal5', weightBias: 0.82 },
  { id: 95279293, login: 'vishavsingla', weightBias: 0.8 },
  { id: 71162979, login: 'xkaper001', weightBias: 0.78 },
]

function buildRepos(): NormalizedRepo[] {
  return REPO_FACTS.map((r) => {
    const key = `${ORG}/${r.name}`.toLowerCase()
    const pushed = r.pushedAt
    return {
      key,
      orgLogin: ORG,
      fullName: `${ORG}/${r.name}`,
      name: r.name,
      stars: r.stars,
      forks: r.forks,
      pushedAt: pushed,
      updatedAt: pushed,
      openIssuesCount: r.openIssues,
      sizeHint: r.stars >= 40 ? 'L' : r.stars >= 15 ? 'M' : 'S',
      primaryLanguage: r.lang,
      aggregates: {
        prsOpened: r.prsOpened,
        prsMerged: r.prsMerged,
        prsClosed: Math.max(0, r.prsOpened - r.prsMerged),
        issuesOpened: r.openIssues + r.issuesClosed,
        issuesClosed: r.issuesClosed,
        uniqueContributors: r.uniqueContributors,
        lastActivityAt: pushed,
      },
      series: {},
      detailLevel: 'full',
    }
  })
}

function buildContributents(now: number): NormalizedContributor[] {
  const iso = new Date(now - 86400000 * 2).toISOString()
  const list: NormalizedContributor[] = []
  for (let i = 0; i < DEMO_CONTRIBUTOR_COUNT; i++) {
    if (i < PEOPLE.length) {
      const p = PEOPLE[i]
      list.push({
        key: String(p.id),
        login: p.login,
        name: null,
        avatarUrl: `https://github.com/${p.login}.png?size=64`,
        orgsSeen: [ORG],
        aggregates: { prs: 0, issues: 0, lastContributionAt: iso, repoCount: 0 },
      })
    } else {
      const id = 8_000_000 + i
      list.push({
        key: String(id),
        login: `cohort-${i}`,
        name: null,
        avatarUrl: `https://avatars.githubusercontent.com/u/${id}?v=4`,
        orgsSeen: [ORG],
        aggregates: { prs: 0, issues: 0, lastContributionAt: iso, repoCount: 0 },
      })
    }
  }
  return list
}

function contributorWeightBias(key: string): number {
  const found = PEOPLE.find((p) => String(p.id) === key)
  if (found) return found.weightBias
  const h = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 0.75 + (h % 45) / 100
}

function buildEdges(repos: NormalizedRepo[], contributors: NormalizedContributor[], now: number): ContributionEdge[] {
  const edges: ContributionEdge[] = []
  const n = contributors.length
  let i = 0
  for (const repo of repos) {
    for (let j = 0; j < 6; j++) {
      const idx = (i * 5 + j * 17) % n
      const c = contributors[idx]
      const base = Math.round((8 + repo.stars / 6) * contributorWeightBias(c.key))
      edges.push({
        id: `${c.key}|${repo.key}|${j}`,
        contributorKey: c.key,
        repoKey: repo.key,
        weight: Math.max(1, base),
        lastAt: new Date(now - 86400000 * ((i + j) % 5)).toISOString(),
      })
    }
    i++
  }
  return edges
}

function recomputeContributorAggregates(
  people: NormalizedContributor[],
  edges: ContributionEdge[],
): void {
  const w = new Map<string, number>()
  const rs = new Map<string, Set<string>>()
  const last = new Map<string, string | null>()
  for (const e of edges) {
    w.set(e.contributorKey, (w.get(e.contributorKey) ?? 0) + e.weight)
    if (!rs.has(e.contributorKey)) rs.set(e.contributorKey, new Set())
    rs.get(e.contributorKey)!.add(e.repoKey)
    last.set(e.contributorKey, e.lastAt)
  }
  for (const c of people) {
    c.aggregates.prs = w.get(c.key) ?? 0
    c.aggregates.repoCount = rs.get(c.key)?.size ?? 0
    c.aggregates.lastContributionAt = last.get(c.key) ?? c.aggregates.lastContributionAt
  }
}

function buildGlobalSeries(): Record<string, BucketStats> {
  const out: Record<string, BucketStats> = {}
  const d0 = new Date()
  for (let wk = 15; wk >= 0; wk--) {
    const d = new Date(d0)
    d.setUTCDate(d.getUTCDate() - wk * 7)
    const k = weekKey(d)
    const t = 1 + ((15 - wk) % 5)
    out[k] = {
      prsOpened: 20 + t * 4,
      prsMerged: 15 + t * 3,
      prsClosed: 6 + t * 2,
      issuesOpened: 28 + t * 3,
      issuesClosed: 22 + t * 2,
      activeContributors: Math.min(42, 20 + t * 3),
    }
  }
  return out
}

function buildInsights(repos: NormalizedRepo[], now: number): Insight[] {
  const pick = (n: string) => repos.find((r) => r.name === n)
  const resonate = pick('Resonate')!
  const website = pick('Website')!
  const pictopy = pick('PictoPy')!
  return [
    {
      id: 'demo-flagship-resonate',
      title: 'Flagship: Resonate + satellite repos',
      severity: 'info',
      summary: `${resonate.fullName} leads public stars in this GitHub snapshot; Resonate-Backend and Resonate-Website extend the same product line.`,
      rationale: 'Stars, forks, and open issues in the seed match the public org listing; related repos cluster by name prefix.',
      metrics: { stars: resonate.stars, openIssues: resonate.openIssuesCount },
      related: [{ kind: 'repo', key: resonate.key, label: resonate.fullName }],
      computedAt: now,
      confidence: 0.88,
    },
    {
      id: 'demo-bus-website',
      title: 'Contributor concentration (bus factor)',
      severity: 'watch',
      summary: `${website.fullName} still draws a large share of merge activity in this cohort sample.`,
      rationale: 'Edge weights from the demo graph are skewed toward maintainers on flagship repos.',
      metrics: { sampleRepos: repos.length },
      related: [{ kind: 'repo', key: website.key, label: website.fullName }],
      computedAt: now,
      confidence: 0.82,
    },
    {
      id: 'demo-pictopy',
      title: 'Python workload depth (PictoPy)',
      severity: 'info',
      summary: `${pictopy.fullName} mirrors high fork and issue counts on GitHub — strong signals workload for triage and mentorship.`,
      rationale: 'Open issue totals come from the org API snapshot; demo PR aggregates are illustrative.',
      metrics: { forks: pictopy.forks ?? 0, merges: pictopy.aggregates.prsMerged },
      related: [{ kind: 'repo', key: pictopy.key, label: pictopy.fullName }],
      computedAt: now,
      confidence: 0.8,
    },
    {
      id: 'demo-cross',
      title: 'Cross-repo maintainership',
      severity: 'info',
      summary:
        'Public member list overlaps across Resonate, Website, PictoPy, and Dart clients — synthetic edges mimic that cross-pollination.',
      rationale: 'Demo edges connect the same GitHub handles across multiple repositories in the 69-repo cohort.',
      metrics: { bridgeContributors: 6 },
      related: [],
      computedAt: now,
      confidence: 0.72,
    },
  ]
}

export async function applyAossieDemoSeedIfEnabled(): Promise<boolean> {
  if (!USE_AOSSIE_DEMO_SEED) return false

  const repoCount = await db.repos.count()
  const contribCount = await db.contributors.count()
  const demoApplied = Boolean(await db.getMeta<boolean>(DEMO_META_KEY))
  const cohortSource = await db.getMeta<'demo' | 'live'>(COHORT_SOURCE_META)
  const storedSeedVer = (await db.getMeta<number>(DEMO_SEED_VERSION_META)) ?? 0

  const isDemoCohort =
    cohortSource === 'demo' || (cohortSource == null && demoApplied && repoCount > 0)
  const needsVersionRefresh = isDemoCohort && storedSeedVer < AOSSIE_DEMO_SEED_VERSION
  const needsInitialSeed = repoCount === 0 && !demoApplied

  const expectedRepoTotal = REPO_FACTS.length
  const demoContributorShortfall =
    (cohortSource === 'demo' || cohortSource == null) &&
    demoApplied &&
    repoCount === expectedRepoTotal &&
    contribCount > 0 &&
    contribCount < DEMO_CONTRIBUTOR_COUNT

  const liveStaleDemoShape =
    cohortSource === 'live' &&
    repoCount === expectedRepoTotal &&
    contribCount > 0 &&
    contribCount <= PEOPLE.length + 8

  const needsContributorRepair = demoContributorShortfall || liveStaleDemoShape

  if (!needsVersionRefresh && !needsInitialSeed && !needsContributorRepair) return false

  const now = Date.now()
  const ts = now
  const repos = buildRepos()
  const contributors = buildContributents(ts)
  const edges = buildEdges(repos, contributors, ts)
  recomputeContributorAggregates(contributors, edges)
  const globalSeries = buildGlobalSeries()
  const insights = buildInsights(repos, ts)

  const orgRow: OrgConfig = { login: ORG, included: true, addedAt: ts }

  await db.transaction('rw', [db.orgConfigs, db.repos, db.contributors, db.edges, db.meta], async () => {
    await db.orgConfigs.put(orgRow)
    await db.repos.clear()
    await db.contributors.clear()
    await db.edges.clear()
    for (const r of repos) {
      await db.repos.put({ ...r, lastSyncedAt: ts })
    }
    for (const c of contributors) {
      await db.contributors.put({ ...c, lastSyncedAt: ts })
    }
    for (const e of edges) await db.edges.put(e)
    await db.setMeta('global_series', globalSeries)
    await db.saveInsightsSnapshot(insights, ts)
    await db.setMeta('last_sync', ts)
    await db.setMeta(DEMO_META_KEY, true)
    await db.setMeta(DEMO_SEED_VERSION_META, AOSSIE_DEMO_SEED_VERSION)
    await db.setMeta(COHORT_SOURCE_META, 'demo')
  })

  return true
}

export async function resetDemoSeedFlag(): Promise<void> {
  await db.meta.delete(DEMO_META_KEY)
  await db.meta.delete(DEMO_SEED_VERSION_META)
  await db.meta.delete(COHORT_SOURCE_META)
}
