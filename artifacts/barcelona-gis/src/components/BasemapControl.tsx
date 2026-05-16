export type BasemapId = "streets" | "satellite" | "dark" | "positron";

export interface BasemapConfig {
  id: BasemapId;
  label: string;
  icon: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const BASEMAPS: BasemapConfig[] = [
  {
    id: "streets",
    label: "Streets",
    icon: "🗺️",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
  {
    id: "satellite",
    label: "Satellite",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri — Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP",
    maxZoom: 19,
  },
  {
    id: "dark",
    label: "Dark",
    icon: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    maxZoom: 19,
  },
  {
    id: "positron",
    label: "Light",
    icon: "☀️",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    maxZoom: 19,
  },
];

interface BasemapControlProps {
  active: BasemapId;
  onSelect: (id: BasemapId) => void;
}

export default function BasemapControl({ active, onSelect }: BasemapControlProps) {
  return (
    <div className="glass-panel rounded-2xl shadow-xl overflow-hidden" style={{ width: 220 }}>
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ background: "linear-gradient(135deg, #0f3460, #1a5276)" }}
      >
        <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
        <div>
          <h3 className="text-white text-xs font-bold tracking-wide uppercase">Basemap</h3>
          <p className="text-white/40 text-xs">Pilih tampilan peta</p>
        </div>
      </div>

      <div className="p-2 grid grid-cols-2 gap-1.5">
        {BASEMAPS.map((bm) => {
          const isActive = active === bm.id;
          return (
            <button
              key={bm.id}
              onClick={() => onSelect(bm.id)}
              className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #0f3460, #1a5276)"
                  : "rgba(0,0,0,0.03)",
                border: isActive ? "2px solid #0f3460" : "2px solid transparent",
                boxShadow: isActive ? "0 2px 8px rgba(15,52,96,0.3)" : "none",
              }}
            >
              <span className="text-xl leading-none">{bm.icon}</span>
              <span
                className="text-xs font-semibold"
                style={{ color: isActive ? "white" : "#555" }}
              >
                {bm.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
