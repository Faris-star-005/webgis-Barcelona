import { LAYER_CONFIGS } from "../utils/mapUtils";
import type { LayerCategory } from "../types/geojson";

interface LayerControlProps {
  activeLayers: Set<LayerCategory>;
  onToggle: (id: LayerCategory) => void;
  counts: Record<string, number>;
}

export default function LayerControl({ activeLayers, onToggle, counts }: LayerControlProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div
      className="glass-panel rounded-2xl shadow-xl overflow-hidden"
      style={{ width: 220 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ background: "linear-gradient(135deg, #1a2744, #0f3460)" }}
      >
        <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <h3 className="text-white text-xs font-bold tracking-wide uppercase">Layer Peta</h3>
          <p className="text-white/40 text-xs">{total.toLocaleString()} titik</p>
        </div>
      </div>

      {/* Layer list */}
      <div className="p-2">
        {/* All toggle */}
        <button
          className="layer-item w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg mb-1 hover:bg-gray-50 transition-colors"
          onClick={() => {
            const allActive = LAYER_CONFIGS.every((c) => activeLayers.has(c.id));
            LAYER_CONFIGS.forEach((c) => {
              if (allActive !== activeLayers.has(c.id)) return;
              onToggle(c.id);
            });
            if (!allActive) {
              LAYER_CONFIGS.forEach((c) => {
                if (!activeLayers.has(c.id)) onToggle(c.id);
              });
            } else {
              LAYER_CONFIGS.forEach((c) => {
                if (activeLayers.has(c.id)) onToggle(c.id);
              });
            }
          }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors"
            style={{
              background:
                LAYER_CONFIGS.every((c) => activeLayers.has(c.id))
                  ? "#1a2744"
                  : "white",
              borderColor:
                LAYER_CONFIGS.every((c) => activeLayers.has(c.id))
                  ? "#1a2744"
                  : "#ddd",
            }}
          >
            {LAYER_CONFIGS.every((c) => activeLayers.has(c.id)) && (
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-700">Semua Layer</span>
        </button>

        <div className="h-px bg-gray-100 mb-1" />

        {LAYER_CONFIGS.map((cfg) => {
          const active = activeLayers.has(cfg.id);
          const count = counts[cfg.id] || 0;

          return (
            <button
              key={cfg.id}
              className="layer-item w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => onToggle(cfg.id)}
            >
              {/* Checkbox */}
              <div
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all duration-150"
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

              {/* Icon */}
              <span className="text-base leading-none">{cfg.icon}</span>

              {/* Label */}
              <span
                className="text-xs font-medium flex-1 text-left truncate"
                style={{ color: active ? "#1a1a2e" : "#999" }}
              >
                {cfg.label}
              </span>

              {/* Count badge */}
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
    </div>
  );
}
