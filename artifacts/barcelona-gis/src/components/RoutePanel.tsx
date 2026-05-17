import { useState } from "react";
import type { GeoFeature } from "../types/geojson";
import { categorizeFeature, getLayerConfig } from "../utils/mapUtils";

export interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
}

export interface RouteStep {
  name: string;
  distance: number;
  duration: number;
  maneuver: string;
  modifier?: string;
}

export interface RouteResult {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface RoutePanelProps {
  features: GeoFeature[];
  origin: RoutePoint | null;
  dest: RoutePoint | null;
  result: RouteResult | null;
  loading: boolean;
  pickMode: "origin" | "dest" | null;
  profile: "driving" | "walking" | "cycling";
  onOriginChange: (pt: RoutePoint | null) => void;
  onDestChange: (pt: RoutePoint | null) => void;
  onStartPickMode: (mode: "origin" | "dest") => void;
  onProfileChange: (p: "driving" | "walking" | "cycling") => void;
  onClear: () => void;
  onClose: () => void;
}

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtDur(s: number): string {
  const min = Math.round(s / 60);
  if (min >= 60) return `${Math.floor(min / 60)} j ${min % 60} mnt`;
  return `${min} mnt`;
}

function stepSymbol(maneuver: string, modifier?: string): string {
  if (maneuver === "depart") return "🚩";
  if (maneuver === "arrive") return "🏁";
  if (maneuver === "roundabout" || maneuver === "rotary") return "🔄";
  if (!modifier) return "⬆";
  if (modifier.includes("uturn")) return "↩";
  if (modifier.includes("sharp left")) return "↙";
  if (modifier.includes("left")) return modifier.includes("slight") ? "↖" : "⬅";
  if (modifier.includes("sharp right")) return "↘";
  if (modifier.includes("right")) return modifier.includes("slight") ? "↗" : "➡";
  return "⬆";
}

// ── Mini POI search input inside the panel ───────────────────────
interface MiniSearchProps {
  features: GeoFeature[];
  value: string;
  placeholder: string;
  accent: string;
  onChange: (v: string) => void;
  onSelect: (pt: RoutePoint) => void;
  onPickMap: () => void;
  isPickActive: boolean;
  onClear: () => void;
}

function MiniSearch({
  features, value, placeholder, accent,
  onChange, onSelect, onPickMap, isPickActive, onClear,
}: MiniSearchProps) {
  const [results, setResults] = useState<GeoFeature[]>([]);
  const [open, setOpen] = useState(false);

  function handleChange(q: string) {
    onChange(q);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    const lq = q.toLowerCase();
    const hits: GeoFeature[] = [];
    for (const f of features) {
      const n = (f.properties.name ?? "").toLowerCase();
      if (!n) continue;
      if (n.startsWith(lq) || n.includes(lq)) hits.push(f);
      if (hits.length >= 5) break;
    }
    setResults(hits);
    setOpen(hits.length > 0);
  }

  function choose(f: GeoFeature) {
    const [lng, lat] = f.geometry.coordinates;
    onSelect({ lat, lng, label: String(f.properties.name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`) });
    onChange(String(f.properties.name ?? ""));
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="flex gap-1.5 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 160)}
            className="w-full pl-3 pr-7 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              border: `1.5px solid ${isPickActive ? accent : "#e5e7eb"}`,
              boxShadow: isPickActive ? `0 0 0 3px ${accent}22` : "none",
              background: isPickActive ? `${accent}09` : "white",
            }}
          />
          {value && (
            <button
              tabIndex={-1}
              onMouseDown={(e) => { e.preventDefault(); onClear(); setResults([]); setOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        {/* Pick-on-map button */}
        <button
          onClick={onPickMap}
          title={isPickActive ? "Batalkan pilih peta" : "Klik titik di peta"}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm transition-all"
          style={{
            background: isPickActive ? accent : "#f3f4f6",
            color: isPickActive ? "white" : "#9ca3af",
          }}
        >
          📍
        </button>
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl overflow-hidden z-20"
          style={{ border: "1px solid #e5e7eb" }}
        >
          {results.map((f, i) => {
            const cat = categorizeFeature(f.properties);
            const cfg = cat ? getLayerConfig(cat) : null;
            return (
              <button
                key={i}
                onMouseDown={() => choose(f)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-base shrink-0">{cfg?.icon ?? "📍"}</span>
                <div className="min-w-0">
                  <div className="text-sm text-gray-800 truncate font-medium">{f.properties.name}</div>
                  {cfg && <div className="text-xs" style={{ color: cfg.color }}>{cfg.label}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main RoutePanel ───────────────────────────────────────────────
const PROFILES = [
  { id: "driving", icon: "🚗", label: "Berkendara" },
  { id: "walking", icon: "🚶", label: "Jalan Kaki" },
  { id: "cycling", icon: "🚲", label: "Sepeda" },
] as const;

export default function RoutePanel({
  features, origin, dest, result, loading, pickMode, profile,
  onOriginChange, onDestChange, onStartPickMode, onProfileChange,
  onClear, onClose,
}: RoutePanelProps) {
  const [originText, setOriginText] = useState(origin?.label ?? "");
  const [destText, setDestText]     = useState(dest?.label ?? "");

  function handleSwap() {
    const tmpPt   = origin;
    const tmpDest = dest;
    const tmpOT   = originText;
    const tmpDT   = destText;
    onOriginChange(tmpDest);
    onDestChange(tmpPt);
    setOriginText(tmpDT);
    setDestText(tmpOT);
  }

  return (
    <div
      className="route-panel"
      style={{
        width: 300,
        background: "white",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(135deg,#1a2744,#0f3460)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <span className="text-white font-bold text-sm">Petunjuk Arah</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2.5">
        {/* Profile switcher */}
        <div className="flex gap-1.5">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => onProfileChange(p.id)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
              style={{
                background: profile === p.id ? "#0f3460" : "#f3f4f6",
                color: profile === p.id ? "white" : "#6b7280",
              }}
            >
              <span>{p.icon}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Origin + Dest inputs */}
        <div className="flex gap-2">
          <div className="flex flex-col items-center pt-2.5 gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: "#34a853" }} />
            <div className="w-px flex-1 bg-gray-200 my-0.5" style={{ minHeight: 20 }} />
            <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: "#ea4335" }} />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <MiniSearch
              features={features}
              value={originText}
              placeholder="Titik asal..."
              accent="#34a853"
              onChange={setOriginText}
              onSelect={(pt) => { setOriginText(pt.label); onOriginChange(pt); }}
              onPickMap={() => onStartPickMode("origin")}
              isPickActive={pickMode === "origin"}
              onClear={() => { setOriginText(""); onOriginChange(null); }}
            />
            <MiniSearch
              features={features}
              value={destText}
              placeholder="Titik tujuan..."
              accent="#ea4335"
              onChange={setDestText}
              onSelect={(pt) => { setDestText(pt.label); onDestChange(pt); }}
              onPickMap={() => onStartPickMode("dest")}
              isPickActive={pickMode === "dest"}
              onClear={() => { setDestText(""); onDestChange(null); }}
            />
          </div>

          {/* Swap */}
          <button
            onClick={handleSwap}
            title="Tukar asal & tujuan"
            className="self-center w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            ⇅
          </button>
        </div>

        {/* Pick mode hint */}
        {pickMode && (
          <div
            className="text-xs text-center py-1.5 px-3 rounded-lg font-medium"
            style={{
              background: pickMode === "origin" ? "#34a85312" : "#ea433512",
              color: pickMode === "origin" ? "#34a853" : "#ea4335",
              border: `1px dashed ${pickMode === "origin" ? "#34a853" : "#ea4335"}`,
            }}
          >
            {pickMode === "origin" ? "🟢 Klik peta untuk pilih asal" : "🔴 Klik peta untuk pilih tujuan"}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-400">
            <svg className="w-4 h-4 text-blue-400" style={{ animation: "bcn-spin 0.9s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Menghitung rute...
          </div>
        )}

        {/* Route result summary */}
        {result && !loading && (
          <>
            <div
              className="flex items-center justify-around py-2.5 px-3 rounded-xl"
              style={{ background: "linear-gradient(135deg,#0f3460,#1a5276)" }}
            >
              <div className="text-center">
                <div className="text-white font-bold text-lg leading-tight">{fmtDist(result.distance)}</div>
                <div className="text-white/60 text-xs">Jarak</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-bold text-lg leading-tight">{fmtDur(result.duration)}</div>
                <div className="text-white/60 text-xs">Estimasi</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-bold text-lg leading-tight">{result.steps.length - 1}</div>
                <div className="text-white/60 text-xs">Belokan</div>
              </div>
            </div>

            {/* Step list */}
            <div
              className="flex flex-col gap-0.5 max-h-52 overflow-y-auto info-scroll rounded-xl"
              style={{ border: "1px solid #f3f4f6" }}
            >
              {result.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3 py-2"
                  style={{
                    background: i === 0 || i === result.steps.length - 1 ? "#f8fafc" : "white",
                    borderBottom: i < result.steps.length - 1 ? "1px solid #f3f4f6" : undefined,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                    style={{ background: i === result.steps.length - 1 ? "#fef2f2" : "#f0f9ff" }}
                  >
                    {stepSymbol(step.maneuver, step.modifier)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-700 font-medium truncate">
                      {step.name || "Jalan tidak bernama"}
                    </div>
                    <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                      <span>{fmtDist(step.distance)}</span>
                      <span>·</span>
                      <span>{fmtDur(step.duration)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Clear / footer */}
        {(origin || dest || result) && (
          <button
            onClick={onClear}
            className="w-full py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            Hapus rute
          </button>
        )}
      </div>
    </div>
  );
}
