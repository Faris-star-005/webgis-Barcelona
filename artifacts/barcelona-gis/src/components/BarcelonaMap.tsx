import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { createHeatLayer } from "../utils/heatLayer";
import type { HeatPoint } from "../utils/heatLayer";
import type { GeoFeature, GeoFeatureCollection, LayerCategory } from "../types/geojson";
import {
  categorizeFeature,
  buildPopupContent,
  buildTooltipContent,
  LAYER_CONFIGS,
  getLayerConfig,
} from "../utils/mapUtils";
import LoadingScreen from "./LoadingScreen";
import SearchBar from "./SearchBar";
import LayerControl from "./LayerControl";
import MapControls from "./MapControls";
import HeatmapControl from "./HeatmapControl";
import BasemapControl, { BASEMAPS } from "./BasemapControl";
import type { BasemapId } from "./BasemapControl";
import StatsPanel from "./StatsPanel";

const BARCELONA_CENTER: [number, number] = [41.3851, 2.1734];
const DEFAULT_ZOOM = 14;

// Zoom → circle radius mapping
function radiusForZoom(z: number): number {
  if (z <= 12) return 3;
  if (z <= 13) return 4;
  if (z <= 14) return 5;
  if (z <= 15) return 7;
  if (z <= 16) return 9;
  return 11;
}

const canvasRenderer = L.canvas({ padding: 0.5 });

// Categories that get permanent labels when zoomed in close
const IMPORTANT_CATS = new Set<LayerCategory>(["tourism", "hotels", "healthcare", "parks"]);

function makeCircleMarker(
  lat: number,
  lng: number,
  color: string,
  props: GeoFeature["properties"],
  category: LayerCategory,
  radius: number,
) {
  // Important POIs get a slightly larger, more prominent marker
  const important = IMPORTANT_CATS.has(category);
  const cm = L.circleMarker([lat, lng], {
    renderer: canvasRenderer,
    radius: important ? radius + 1 : radius,
    color: "#fff",
    weight: important ? 2 : 1.5,
    fillColor: color,
    fillOpacity: 0.92,
  });

  cm.bindPopup(buildPopupContent(props, category), {
    maxWidth: 300,
    className: "bcn-popup",
  });

  // Hover tooltip — shows name + type instantly without clicking
  if (props.name) {
    cm.bindTooltip(buildTooltipContent(props, category), {
      className: "bcn-tooltip-wrapper",
      direction: "top",
      offset: [0, -8],
      opacity: 1,
    });
  }

  return cm;
}

export default function BarcelonaMap() {
  const mapRef            = useRef<L.Map | null>(null);
  const mapContainerRef   = useRef<HTMLDivElement>(null);
  const tileLayerRef      = useRef<L.TileLayer | null>(null);
  const layerGroupsRef    = useRef<Map<LayerCategory, L.LayerGroup>>(new Map());
  const allMarkersRef     = useRef<Array<{ cm: L.CircleMarker; color: string }>>([]);
  const heatDataRef       = useRef<Map<LayerCategory, HeatPoint[]>>(new Map());
  const heatLayerRef      = useRef<L.Layer | null>(null);
  const gpsMarkerRef      = useRef<L.Marker | null>(null);
  const gpsCircleRef      = useRef<L.Circle | null>(null);

  const [loadProgress, setLoadProgress] = useState({ progress: 0, status: "Memulai..." });
  const [loaded, setLoaded]             = useState(false);
  const [namedFeatures, setNamedFeatures] = useState<GeoFeature[]>([]);
  const [layerCounts, setLayerCounts]   = useState<Record<string, number>>({});
  const [activeLayers, setActiveLayers] = useState<Set<LayerCategory>>(
    new Set(LAYER_CONFIGS.map((c) => c.id))
  );
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [gpsActive, setGpsActive]       = useState(false);

  // Panel visibility
  const [showLayerPanel, setShowLayerPanel]     = useState(true);
  const [showHeatPanel, setShowHeatPanel]       = useState(false);
  const [showBasemapPanel, setShowBasemapPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel]     = useState(false);

  // Heatmap
  const [activeHeat, setActiveHeat]     = useState<LayerCategory | "all" | null>(null);
  const [heatOpacity, setHeatOpacity]   = useState(0.65);

  // Basemap
  const [activeBasemap, setActiveBasemap] = useState<BasemapId>("streets");

  const [statusBar, setStatusBar] = useState("Barcelona WebGIS — Memuat...");

  // ── Map init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BARCELONA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    const bm = BASEMAPS.find((b) => b.id === "streets")!;
    const tile = L.tileLayer(bm.url, { maxZoom: bm.maxZoom }).addTo(map);
    tileLayerRef.current = tile;

    L.control.attribution({ position: "bottomright", prefix: "" }).addTo(map);
    L.control.scale({ position: "bottomleft", metric: true, imperial: false }).addTo(map);

    mapRef.current = map;
    doLoad(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Zoom-adaptive marker radius ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const onZoom = () => {
      const r = radiusForZoom(map.getZoom());
      for (const { cm } of allMarkersRef.current) {
        cm.setRadius(r);
      }
    };

    map.on("zoomend", onZoom);
    return () => { map.off("zoomend", onZoom); };
  }, [loaded]);

  // ── Basemap switch ────────────────────────────────────────────────
  const handleBasemapSelect = useCallback((id: BasemapId) => {
    if (!mapRef.current) return;
    const bm = BASEMAPS.find((b) => b.id === id);
    if (!bm) return;
    if (tileLayerRef.current) mapRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(bm.url, { maxZoom: bm.maxZoom });
    newTile.addTo(mapRef.current);
    // Ensure tiles are below everything
    newTile.setZIndex(0);
    tileLayerRef.current = newTile;
    setActiveBasemap(id);
    setShowBasemapPanel(false);
  }, []);

  // ── Data load ─────────────────────────────────────────────────────
  async function doLoad(map: L.Map) {
    const tick = () => new Promise<void>((r) => setTimeout(r, 0));
    try {
      setLoadProgress({ progress: 8, status: "Mengambil data GeoJSON..." });
      await tick();

      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const res = await fetch(`${base}/barcelona.geojson`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setLoadProgress({ progress: 28, status: "Parsing data..." });
      await tick();

      const data: GeoFeatureCollection = await res.json();
      const features = data.features;

      setLoadProgress({ progress: 42, status: "Mengkategorikan fitur..." });
      await tick();

      const grouped  = new Map<LayerCategory, GeoFeature[]>();
      const heatPts  = new Map<LayerCategory, HeatPoint[]>();
      const named: GeoFeature[] = [];
      const counts: Record<string, number> = {};

      for (const cfg of LAYER_CONFIGS) {
        grouped.set(cfg.id, []);
        heatPts.set(cfg.id, []);
      }

      for (const feat of features) {
        if (feat.geometry?.type !== "Point") continue;
        const cat = categorizeFeature(feat.properties);
        if (cat) {
          grouped.get(cat)!.push(feat);
          const [lng, lat] = feat.geometry.coordinates;
          heatPts.get(cat)!.push([lat, lng, 1] as HeatPoint);
        }
        if (feat.properties.name) named.push(feat);
      }

      for (const [k, v] of grouped) counts[k] = v.length;

      heatDataRef.current = heatPts;
      setNamedFeatures(named);
      setLayerCounts(counts);

      setLoadProgress({ progress: 55, status: "Menambahkan marker..." });
      await tick();

      const initRadius = radiusForZoom(map.getZoom());
      const allMarkers: Array<{ cm: L.CircleMarker; color: string }> = [];

      for (let ci = 0; ci < LAYER_CONFIGS.length; ci++) {
        const cfg = LAYER_CONFIGS[ci];
        const feats = grouped.get(cfg.id) ?? [];
        const layerGroup = L.layerGroup();

        for (const feat of feats) {
          const [lng, lat] = feat.geometry.coordinates;
          const cm = makeCircleMarker(lat, lng, cfg.color, feat.properties, cfg.id, initRadius);
          layerGroup.addLayer(cm);
          allMarkers.push({ cm, color: cfg.color });
        }

        layerGroup.addTo(map);
        layerGroupsRef.current.set(cfg.id, layerGroup);

        const pct = 55 + ((ci + 1) / LAYER_CONFIGS.length) * 40;
        setLoadProgress({
          progress: pct,
          status: `Memuat ${cfg.icon} ${cfg.label} (${(counts[cfg.id] ?? 0).toLocaleString()} titik)`,
        });
        await tick();
      }

      allMarkersRef.current = allMarkers;

      setLoadProgress({ progress: 100, status: "Siap!" });
      await new Promise<void>((r) => setTimeout(r, 700));
      setLoaded(true);
      setStatusBar(
        `${named.length.toLocaleString()} lokasi bernama · ${features.length.toLocaleString()} total fitur`
      );
    } catch (err) {
      console.error("Load failed", err);
      setLoadProgress({ progress: 100, status: "Gagal memuat data" });
      await new Promise<void>((r) => setTimeout(r, 1000));
      setLoaded(true);
    }
  }

  // ── Heatmap ───────────────────────────────────────────────────────
  const applyHeatmap = useCallback((cat: LayerCategory | "all" | null, opacity: number) => {
    const map = mapRef.current;
    if (!map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (cat === null) {
      setStatusBar("Heatmap dinonaktifkan");
      return;
    }

    let pts: HeatPoint[] = [];
    if (cat === "all") {
      for (const v of heatDataRef.current.values()) pts = pts.concat(v);
    } else {
      pts = heatDataRef.current.get(cat) ?? [];
    }
    if (!pts.length) return;

    const cfg = cat !== "all" ? getLayerConfig(cat) : null;
    const gradient =
      cat !== "all" && cfg
        ? { "0.1": "blue", "0.3": "cyan", "0.5": "lime", "0.7": cfg.color, "1.0": "#ff1100" }
        : { "0.1": "navy", "0.3": "#0055ff", "0.5": "lime", "0.7": "orange", "1.0": "red" };

    const hl = createHeatLayer(pts, { radius: 22, blur: 18, minOpacity: opacity * 0.4, max: 1, gradient });
    hl.addTo(map);
    heatLayerRef.current = hl;

    const label = cat === "all" ? "Semua Kategori" : getLayerConfig(cat).label;
    const count = cat === "all"
      ? Array.from(heatDataRef.current.values()).reduce((a, v) => a + v.length, 0)
      : (heatDataRef.current.get(cat)?.length ?? 0);
    setStatusBar(`Heatmap: ${label} · ${count.toLocaleString()} titik`);
  }, []);

  const handleHeatSelect = useCallback((cat: LayerCategory | "all" | null) => {
    setActiveHeat(cat);
    applyHeatmap(cat, heatOpacity);
  }, [applyHeatmap, heatOpacity]);

  const handleOpacityChange = useCallback((v: number) => {
    setHeatOpacity(v);
    applyHeatmap(activeHeat, v);
  }, [applyHeatmap, activeHeat]);

  // ── Layer toggle ──────────────────────────────────────────────────
  const handleToggleLayer = useCallback((id: LayerCategory) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const group = layerGroupsRef.current.get(id);
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (group && map.hasLayer(group)) map.removeLayer(group);
      } else {
        next.add(id);
        if (group && !map.hasLayer(group)) map.addLayer(group);
      }
      return next;
    });
  }, []);

  // ── Search ────────────────────────────────────────────────────────
  const handleSearchSelect = useCallback((feature: GeoFeature) => {
    if (!mapRef.current) return;
    const [lng, lat] = feature.geometry.coordinates;
    mapRef.current.setView([lat, lng], 17, { animate: true });

    const cat = categorizeFeature(feature.properties);
    if (cat) {
      const group = layerGroupsRef.current.get(cat);
      if (group) {
        setActiveLayers((prev) => {
          if (!prev.has(cat)) {
            const next = new Set(prev);
            next.add(cat);
            mapRef.current!.addLayer(group);
            return next;
          }
          return prev;
        });
      }
    }

    const pulse = L.circleMarker([lat, lng], {
      radius: 16, color: "#e85d3d", weight: 3, fillColor: "#e85d3d", fillOpacity: 0.25,
    }).addTo(mapRef.current);
    const inner = L.circleMarker([lat, lng], {
      radius: 5, color: "#fff", weight: 2, fillColor: "#e85d3d", fillOpacity: 1,
    }).addTo(mapRef.current);
    setTimeout(() => { pulse.remove(); inner.remove(); }, 2800);

    const cfg = cat ? getLayerConfig(cat) : null;
    setStatusBar(`Navigasi ke: ${feature.properties.name ?? "Lokasi"} ${cfg?.icon ?? ""}`);
  }, []);

  // ── GPS ───────────────────────────────────────────────────────────
  function handleGPS() {
    if (!mapRef.current) return;
    if (!navigator.geolocation) { setStatusBar("Geolokasi tidak didukung browser Anda"); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setGpsLoading(false);
        setGpsActive(true);
        gpsMarkerRef.current?.remove();
        gpsCircleRef.current?.remove();

        const icon = L.divIcon({
          html: `<div style="width:16px;height:16px;background:#e85d3d;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(232,93,61,0.3)"></div>`,
          className: "custom-div-icon gps-pulse",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(
            `<div style="padding:10px 14px;font-family:system-ui">
              <div style="font-weight:700;color:#1a2744;margin-bottom:4px">📍 Lokasi Anda</div>
              <div style="color:#666;font-size:12px">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
              <div style="color:#aaa;font-size:11px;margin-top:2px">Akurasi: ±${Math.round(accuracy)}m</div>
            </div>`,
            { maxWidth: 220 }
          )
          .addTo(mapRef.current!);

        const circle = L.circle([lat, lng], {
          radius: accuracy, color: "#e85d3d", fillColor: "#e85d3d", fillOpacity: 0.06, weight: 1.5,
        }).addTo(mapRef.current!);

        gpsMarkerRef.current = marker;
        gpsCircleRef.current = circle;
        mapRef.current!.setView([lat, lng], 16, { animate: true });
        marker.openPopup();
        setStatusBar(`Lokasi: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${Math.round(accuracy)}m)`);
      },
      (err) => { setGpsLoading(false); setStatusBar(`GPS Error: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  const heatBtnActive = activeHeat !== null;

  // Mutually exclusive panel toggles — close others when opening one
  function togglePanel(which: "layer" | "heat" | "basemap" | "stats") {
    setShowLayerPanel(which === "layer" ? (v) => !v : false);
    setShowHeatPanel(which === "heat" ? (v) => !v : false);
    setShowBasemapPanel(which === "basemap" ? (v) => !v : false);
    setShowStatsPanel(which === "stats" ? (v) => !v : false);
  }

  const isDark = activeBasemap === "dark";
  const panelShadow = isDark
    ? "0 8px 32px rgba(0,0,0,0.6)"
    : "0 8px 32px rgba(0,0,0,0.15)";

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {!loaded && (
        <LoadingScreen progress={loadProgress.progress} status={loadProgress.status} visible={!loaded} />
      )}

      <div ref={mapContainerRef} id="map" className="absolute inset-0" />

      {loaded && (
        <>
          {/* ── Top bar ──────────────────────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 z-[1000] flex items-start gap-3 p-4"
            style={{ pointerEvents: "none" }}
          >
            {/* Brand */}
            <div
              className="glass-panel rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg shrink-0"
              style={{ pointerEvents: "auto", boxShadow: panelShadow }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#e85d3d,#f59e0b)" }}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800 leading-tight">Barcelona</div>
                <div className="text-xs text-gray-400">WebGIS</div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1" style={{ pointerEvents: "auto", maxWidth: 400 }}>
              <SearchBar features={namedFeatures} onSelect={handleSearchSelect} />
            </div>
          </div>

          {/* ── Right sidebar buttons ─────────────────────────────── */}
          <div
            className="absolute top-4 right-4 z-[1000] flex flex-col gap-2"
            style={{ pointerEvents: "auto" }}
          >
            <MapControls
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
              onGPS={handleGPS}
              onResetView={() => {
                mapRef.current?.setView(BARCELONA_CENTER, DEFAULT_ZOOM, { animate: true });
                setStatusBar("Kembali ke tampilan Barcelona");
              }}
              gpsLoading={gpsLoading}
              gpsActive={gpsActive}
            />

            {/* Basemap */}
            <SideBtn
              active={showBasemapPanel}
              onClick={() => togglePanel("basemap")}
              title="Pilih Basemap"
              gradient="linear-gradient(135deg,#0f3460,#1a5276)"
              inactiveColor="#555"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
            </SideBtn>

            {/* Layers */}
            <SideBtn
              active={showLayerPanel}
              onClick={() => togglePanel("layer")}
              title="Layer Peta"
              gradient="linear-gradient(135deg,#1a2744,#0f3460)"
              inactiveColor="#666"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </SideBtn>

            {/* Heatmap */}
            <SideBtn
              active={showHeatPanel || heatBtnActive}
              onClick={() => togglePanel("heat")}
              title="Heatmap Densitas"
              gradient="linear-gradient(135deg,#7c2d12,#c2410c)"
              inactiveColor="#666"
              dot={heatBtnActive}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </SideBtn>

            {/* Stats */}
            <SideBtn
              active={showStatsPanel}
              onClick={() => togglePanel("stats")}
              title="Statistik POI"
              gradient="linear-gradient(135deg,#16a34a,#059669)"
              inactiveColor="#666"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </SideBtn>
          </div>

          {/* ── Slide-out panels (bottom-right, above status bar) ─── */}
          <div
            className="absolute bottom-14 right-4 z-[1000] flex flex-col gap-3 items-end"
            style={{ pointerEvents: "auto" }}
          >
            {showBasemapPanel && (
              <BasemapControl active={activeBasemap} onSelect={handleBasemapSelect} />
            )}
            {showHeatPanel && (
              <HeatmapControl
                activeHeat={activeHeat}
                onSelect={handleHeatSelect}
                opacity={heatOpacity}
                onOpacityChange={handleOpacityChange}
                counts={layerCounts}
              />
            )}
            {showLayerPanel && (
              <LayerControl
                activeLayers={activeLayers}
                onToggle={handleToggleLayer}
                counts={layerCounts}
              />
            )}
            {showStatsPanel && (
              <StatsPanel counts={layerCounts} activeLayers={activeLayers} />
            )}
          </div>

          {/* ── Status bar ────────────────────────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 py-1.5"
            style={{
              background: "linear-gradient(90deg,rgba(26,39,68,0.93),rgba(15,52,96,0.93))",
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: heatBtnActive ? "#f59e0b" : "#4ade80",
                  animation: "bcn-pulse 2s ease infinite",
                }}
              />
              <span className="text-white/70 text-xs">{statusBar}</span>
            </div>
            <div className="flex items-center gap-3">
              {heatBtnActive && (
                <span className="text-amber-400/80 text-xs font-medium">🔥 Heatmap aktif</span>
              )}
              <span className="text-white/30 text-xs">
                {BASEMAPS.find((b) => b.id === activeBasemap)?.icon}{" "}
                {BASEMAPS.find((b) => b.id === activeBasemap)?.label}
              </span>
              <span className="text-white/30 text-xs">Barcelona, Catalunya</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Small reusable sidebar button ──────────────────────────────────
interface SideBtnProps {
  active: boolean;
  onClick: () => void;
  title: string;
  gradient: string;
  inactiveColor: string;
  dot?: boolean;
  children: React.ReactNode;
}

function SideBtn({ active, onClick, title, gradient, inactiveColor, dot, children }: SideBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border-0"
      style={{ background: active ? gradient : "rgba(255,255,255,0.95)" }}
    >
      <span style={{ color: active ? "white" : inactiveColor }}>{children}</span>
      {dot && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-300"
          style={{ animation: "bcn-pulse 2s ease infinite" }}
        />
      )}
    </button>
  );
}
