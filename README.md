# Org Explorer

Local-first organizational intelligence for GitHub orgs: multi-org merge, IndexedDB cache, Sigma.js graph, insight engine, time-series charts, tables, and CSV/PDF export.

## Prerequisites

- **Node.js** 18+ (20+ recommended for tooling compatibility)
- **npm** 9+

## 1. Install dependencies

From the project directory (path may include a space):

```bash
cd "/Users/manvendrasingh/Desktop/Org Explorer"
npm install
```

## 2. Start the dev server

```bash
npm run dev
```

Vite prints a local URL (typically `http://localhost:5173`). Open it in Chromium, Firefox, or Safari.

## 3. Use the app

1. **Organizations & sync** — Add one or more GitHub organization slugs (e.g. `vercel`, `remix-run`). Toggle inclusion with the checkbox. Optionally paste a [GitHub personal access token](https://github.com/settings/tokens) (repo read scope) into the token field; it is stored in **session storage** only for higher API limits.
2. Click **Sync now**. Progress appears while repositories are listed and the top repos (by stars) are analyzed in depth (contributors, recent PRs/issues). Results are written to **IndexedDB**.
3. **Graph** — Explore repo–contributor relationships; use filters and click nodes for the side drawer.
4. **Analytics** — Insight cards and ECharts time series (weekly/monthly, configurable window).
5. **Tables** — Sortable, searchable, paginated repositories and contributors.
6. **Export** — From the home page, open **Export** for CSV bundles and a PDF summary (add chart screenshots from Analytics for a full deck).

**Clear cached data** removes repositories, contributors, edges, and sync metadata but **keeps your org list** in IndexedDB.

## Production build

```bash
npm run build
npm run preview
```

`preview` serves the `dist/` folder locally for smoke testing.

## Notes

- Unauthenticated requests are limited to **60/hour** per GitHub IP; a PAT raises this substantially.
- Full detail sync is capped (see `src/config/constants.ts`, `MAX_REPOS_FULL_DETAIL`) so large orgs stay usable; remaining repos are stored with metadata only.
