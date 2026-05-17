# Barcelona WebGIS

Interactive WebGIS map explorer for Barcelona, built with React, Vite, and Leaflet.

## Development

```bash
pnpm install
pnpm --filter @workspace/barcelona-gis run dev
```

Set `PORT` and `BASE_PATH` environment variables (see `artifacts/barcelona-gis/.replit-artifact/artifact.toml`).

## Deploy

Configured for [Vercel](https://vercel.com) via `vercel.json`. Connect this repository in the Vercel dashboard or run `vercel --prod`.
