import type { FeatureProperties, LayerCategory, LayerConfig } from "../types/geojson";

export const LAYER_CONFIGS: LayerConfig[] = [
  { id: "restaurants", label: "Restaurants", icon: "🍽️", color: "#e85d3d", bgColor: "#fef2ef" },
  { id: "cafes", label: "Cafes", icon: "☕", color: "#8b5e3c", bgColor: "#fdf6f0" },
  { id: "bars", label: "Bars & Nightlife", icon: "🍷", color: "#7c3aed", bgColor: "#f5f3ff" },
  { id: "hotels", label: "Hotels", icon: "🏨", color: "#0369a1", bgColor: "#f0f9ff" },
  { id: "tourism", label: "Tourism & Culture", icon: "🏛️", color: "#d97706", bgColor: "#fffbeb" },
  { id: "transport", label: "Transport", icon: "🚌", color: "#059669", bgColor: "#ecfdf5" },
  { id: "shops", label: "Shopping", icon: "🛍️", color: "#db2777", bgColor: "#fdf2f8" },
  { id: "parks", label: "Parks & Nature", icon: "🌳", color: "#16a34a", bgColor: "#f0fdf4" },
  { id: "healthcare", label: "Healthcare", icon: "🏥", color: "#dc2626", bgColor: "#fef2f2" },
];

export function categorizeFeature(props: FeatureProperties): LayerCategory | null {
  const amenity = props.amenity?.toLowerCase();
  const tourism = props.tourism?.toLowerCase();
  const shop = props.shop;
  const highway = props.highway?.toLowerCase();
  const railway = props.railway?.toLowerCase();

  if (amenity === "restaurant" || amenity === "fast_food" || amenity === "food_court") return "restaurants";
  if (amenity === "cafe") return "cafes";
  if (amenity === "bar" || amenity === "pub" || amenity === "nightclub" || amenity === "biergarten") return "bars";
  if (tourism === "hotel" || tourism === "hostel" || tourism === "motel" || tourism === "guest_house" || tourism === "apartment") return "hotels";
  if (
    tourism === "museum" || tourism === "gallery" || tourism === "attraction" ||
    tourism === "viewpoint" || tourism === "artwork" || tourism === "theme_park" ||
    amenity === "theatre" || amenity === "cinema" || amenity === "arts_centre"
  ) return "tourism";
  if (
    highway === "bus_stop" || railway === "station" || railway === "tram_stop" ||
    railway === "subway_entrance" || amenity === "taxi" || amenity === "ferry_terminal"
  ) return "transport";
  if (shop) return "shops";
  if (amenity === "park" || amenity === "garden" || tourism === "picnic_site") return "parks";
  if (
    amenity === "hospital" || amenity === "pharmacy" || amenity === "clinic" ||
    amenity === "doctors" || amenity === "dentist"
  ) return "healthcare";
  return null;
}

export function getLayerConfig(category: LayerCategory): LayerConfig {
  return LAYER_CONFIGS.find((c) => c.id === category) ?? LAYER_CONFIGS[0];
}

export function buildPopupContent(props: FeatureProperties, category: LayerCategory): string {
  const cfg = getLayerConfig(category);
  const name = props.name || "Unnamed Location";
  const type = props.amenity || props.tourism || props.shop || props.railway || props.highway || "—";

  const rows: { label: string; value: string }[] = [];
  if (props.operator) rows.push({ label: "Operator", value: String(props.operator) });
  if (props.opening_hours) rows.push({ label: "Hours", value: String(props.opening_hours) });
  if (props.rooms) rows.push({ label: "Rooms", value: String(props.rooms) });
  if (props.beds) rows.push({ label: "Beds", value: String(props.beds) });
  if (props.surface) rows.push({ label: "Surface", value: String(props.surface) });

  const rowsHtml = rows
    .map(
      (r) =>
        `<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid #f0f0f0;">
          <span style="color:#888;font-size:11px;font-weight:500;white-space:nowrap">${r.label}</span>
          <span style="color:#333;font-size:11px;text-align:right">${r.value}</span>
        </div>`
    )
    .join("");

  return `
<div style="font-family:system-ui,sans-serif;overflow:hidden">
  <div style="background:${cfg.color};padding:12px 14px;display:flex;align-items:center;gap:8px">
    <span style="font-size:18px">${cfg.icon}</span>
    <div>
      <div style="color:white;font-weight:700;font-size:13px;line-height:1.2">${name}</div>
      <div style="color:rgba(255,255,255,0.8);font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">${String(type).replace(/_/g, " ")}</div>
    </div>
  </div>
  <div style="padding:10px 14px">
    ${rowsHtml || `<div style="color:#aaa;font-size:11px;text-align:center;padding:4px 0">No additional details</div>`}
    ${props.osm_id ? `<div style="color:#ccc;font-size:9px;margin-top:6px">OSM ID: ${props.osm_id}</div>` : ""}
  </div>
</div>`;
}

export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
