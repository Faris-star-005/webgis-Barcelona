import { LAYER_CONFIGS } from "../utils/mapUtils";

interface StatsPanelProps {
  counts: Record<string, number>;
  activeLayers: Set<string>;
}

export default function StatsPanel({ counts, activeLayers }: StatsPanelProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeTotal = LAYER_CONFIGS
    .filter((c) => activeLayers.has(c.id))
    .reduce((a, c) => a + (counts[c.id] ?? 0), 0);

  const sorted = [...LAYER_CONFIGS]
    .map((c) => ({ ...c, count: counts[c.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const maxCount = sorted[0]?.count ?? 1;

  return (
    <div className="glass-panel rounded-2xl shadow-xl overflow-hidden" style={{ width: 260 }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1a2744, #0f3460)" }}
      >
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <div>
            <h3 className="text-white text-xs font-bold tracking-wide uppercase">Statistik POI</h3>
            <p className="text-white/40 text-xs">{activeTotal.toLocaleString()} aktif dari {total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="px-3 pt-3 pb-2">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div
            className="rounded-xl p-2 text-center"
            style={{ background: "linear-gradient(135deg, #fef2ef, #fde8e4)" }}
          >
            <div className="text-lg font-bold" style={{ color: "#e85d3d" }}>
              {total > 999 ? `${(total / 1000).toFixed(1)}k` : total}
            </div>
            <div className="text-xs text-gray-400 font-medium">Total</div>
          </div>
          <div
            className="rounded-xl p-2 text-center"
            style={{ background: "linear-gradient(135deg, #eff8ff, #dbeeff)" }}
          >
            <div className="text-lg font-bold" style={{ color: "#0f3460" }}>
              {LAYER_CONFIGS.filter((c) => activeLayers.has(c.id)).length}
            </div>
            <div className="text-xs text-gray-400 font-medium">Layer</div>
          </div>
          <div
            className="rounded-xl p-2 text-center"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}
          >
            <div className="text-lg font-bold" style={{ color: "#16a34a" }}>
              {LAYER_CONFIGS.length}
            </div>
            <div className="text-xs text-gray-400 font-medium">Kategori</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="space-y-1.5">
          {sorted.map((cfg) => {
            const pct = maxCount > 0 ? (cfg.count / maxCount) * 100 : 0;
            const active = activeLayers.has(cfg.id);
            return (
              <div key={cfg.id} className="group">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm leading-none w-5 text-center">{cfg.icon}</span>
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: active ? "#374151" : "#bbb" }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: active ? cfg.color : "#ccc" }}
                  >
                    {cfg.count > 999 ? `${(cfg.count / 1000).toFixed(1)}k` : cfg.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: active ? cfg.color : "#e0e0e0",
                      opacity: active ? 1 : 0.4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid rgba(0,0,0,0.05)", background: "rgba(0,0,0,0.02)" }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: "bcn-pulse 2s ease infinite" }} />
        <span className="text-xs text-gray-400">Barcelona, Catalunya · OSM data</span>
      </div>
    </div>
  );
}
