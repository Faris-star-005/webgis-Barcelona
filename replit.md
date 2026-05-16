# Barcelona WebGIS

An interactive WebGIS explorer for Barcelona, built with React + Leaflet. Visualizes 20,644 named POI locations from OpenStreetMap data including restaurants, cafes, hotels, tourist attractions, transport stops, shops, and more.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/barcelona-gis run dev` — run the WebGIS app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Map: Leaflet.js with Canvas renderer (CircleMarker for performance)
- UI: React + Vite + Tailwind CSS
- Data: OpenStreetMap GeoJSON (Barcelona) — pre-filtered to 20,644 POI features

## Where things live

- `artifacts/barcelona-gis/` — Main WebGIS React app
- `artifacts/barcelona-gis/public/barcelona.geojson` — Pre-filtered POI GeoJSON (12.4MB)
- `artifacts/barcelona-gis/src/components/BarcelonaMap.tsx` — Main map component
- `artifacts/barcelona-gis/src/utils/mapUtils.ts` — Layer configs and popup builder
- `attached_assets/barcelona_1778919288661.geojson` — Original full GeoJSON (188MB, 257k features)

## Features

- Loading screen with progress bar
- 9 layer categories (restaurants, cafes, bars, hotels, tourism, transport, shops, parks, healthcare)
- Layer control panel — toggle each category on/off
- Search bar — search by location name with dropdown results
- GPS button — locate user on the map with accuracy circle
- Clickable popups with location info
- Zoom in/out controls + reset view
- Canvas-based rendering for performance (20k+ points)

## Architecture decisions

- Pre-filtered GeoJSON from 257k to 20.6k features server-side to reduce download size from 188MB to 12.4MB
- Used Leaflet CircleMarker with L.canvas() renderer instead of DivIcon — renders 20k points efficiently on canvas vs DOM
- All UI overlays are hidden during data loading to avoid interaction issues
- GeoJSON categorization is done in-browser at runtime for flexibility

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Pre-filter script: run `python3 scripts/filter-geojson.py` if you need to regenerate the filtered GeoJSON
- The GeoJSON public file must be at `artifacts/barcelona-gis/public/barcelona.geojson` for Vite to serve it
- Do NOT remove or rename the original GeoJSON in `attached_assets/`
