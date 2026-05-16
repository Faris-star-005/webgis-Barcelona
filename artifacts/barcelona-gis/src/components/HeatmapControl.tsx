import { LAYER_CONFIGS } from "../utils/mapUtils";
import type { LayerCategory } from "../types/geojson";

interface HeatmapControlProps {
  activeHeat: LayerCategory | "all" | null;
  onSelect: (cat: LayerCategory | "all" | null) => void;
  opacity: number;
  onOpacityChange: (v: number) => void;
  counts: Record<string, number>;
}

export default function HeatmapControl({
  activeHeat,
  onSelect,
  opacity,
  onOpacityChange,
  counts,
}: HeatmapControlProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="glass-panel rounded-2xl shadow-xl overflow-hidden" style={{ width: 220 }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ background: "linear-gradient(135deg, #7c2d12, #c2410c)" }}
      >
        <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
        <div>
          <h3 className="text-white text-xs font-bold tracking-wide uppercase">Heatmap</h3>
          <p className="text-white/50 text-xs">{total.toLocaleString()} titik</p>
        </div>
      </div>

      <div className="p-2">
        {/* Off */}
        <button
          className="layer-item w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg mb-1 hover:bg-gray-50 transition-colors"
          onClick={() => onSelect(null)}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
            style={{
              background: activeHeat === null ? "#374151" : "white",
              borderColor: activeHeat === null ? "#374151" : "#ddd",
            }}
          >
            {activeHeat === null && (
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-base">⬛</span>
          <span className="text-xs font-medium text-gray-700">Nonaktif</span>
        </button>

        {/* All */}
        <button
          className="layer-item w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg mb-1 hover:bg-gray-50 transition-colors"
          onClick={() => onSelect("all")}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
            style={{
              background: activeHeat === "all" ? "#c2410c" : "white",
              borderColor: activeHeat === "all" ? "#c2410c" : "#ddd",
            }}
          >
            {activeHeat === "all" && (
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-base">🌍</span>
          <div className="flex-1 text-left">
            <div className="text-xs font-semibold" style={{ color: activeHeat === "all" ? "#c2410c" : "#374151" }}>
              Semua Kategori
            </div>
          </div>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
            style={{
              background: activeHeat === "all" ? "#fef2ee" : "#f5f5f5",
              color: activeHeat === "all" ? "#c2410c" : "#bbb",
            }}
          >
            {total > 999 ? `${(total / 1000).toFixed(1)}k` : total}
          </span>
        </button>

        <div className="h-px bg-gray-100 mb-1" />

        {LAYER_CONFIGS.map((cfg) => {
          const active = activeHeat === cfg.id;
          const count = counts[cfg.id] || 0;
          return (
            <button
              key={cfg.id}
              className="layer-item w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => onSelect(active ? null : cfg.id)}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
                style={{
                  background: active ? cfg.color : "white",
                  borderColor: active ? cfg.color : "#ddd",
                }}
              >
                {active && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-base leading-none">{cfg.icon}</span>
              <span className="text-xs font-medium flex-1 text-left truncate" style={{ color: active ? "#1a1a2e" : "#999" }}>
                {cfg.label}
              </span>
              {count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                  style={{
                    background: active ? cfg.bgColor : "#f5f5f5",
                    color: active ? cfg.color : "#bbb",
                  }}
                >
                  {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Opacity slider — only when active */}
      {activeHeat !== null && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Intensitas</span>
            <span className="text-xs font-bold" style={{ color: "#c2410c" }}>
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(90deg, #c2410c ${Math.round(opacity * 100)}%, #e5e7eb ${Math.round(opacity * 100)}%)`,
              accentColor: "#c2410c",
            }}
          />

          {/* Gradient legend */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #f0f0f0" }}>
            <div className="px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Rendah</span>
              <div
                className="flex-1 h-2 rounded-full"
                style={{
                  background: "linear-gradient(90deg, rgba(0,0,255,0.4), rgba(0,255,0,0.6), rgba(255,255,0,0.8), rgba(255,128,0,0.9), rgba(255,0,0,1))",
                }}
              />
              <span className="text-xs text-gray-400">Tinggi</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
