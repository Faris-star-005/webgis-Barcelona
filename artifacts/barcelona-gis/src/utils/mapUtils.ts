import type { FeatureProperties, LayerCategory, LayerConfig } from "../types/geojson";

export const LAYER_CONFIGS: LayerConfig[] = [
  { id: "restaurants", label: "Restaurants", icon: "🍽️", color: "#e85d3d", bgColor: "#fef2ef" },
  { id: "cafes",       label: "Cafes",        icon: "☕",  color: "#8b5e3c", bgColor: "#fdf6f0" },
  { id: "bars",        label: "Bars & Nightlife", icon: "🍷", color: "#7c3aed", bgColor: "#f5f3ff" },
  { id: "hotels",      label: "Hotels",       icon: "🏨", color: "#0369a1", bgColor: "#f0f9ff" },
  { id: "tourism",     label: "Tourism & Culture", icon: "🏛️", color: "#d97706", bgColor: "#fffbeb" },
  { id: "transport",   label: "Transport",    icon: "🚌", color: "#059669", bgColor: "#ecfdf5" },
  { id: "shops",       label: "Shopping",     icon: "🛍️", color: "#db2777", bgColor: "#fdf2f8" },
  { id: "parks",       label: "Parks & Nature", icon: "🌳", color: "#16a34a", bgColor: "#f0fdf4" },
  { id: "healthcare",  label: "Healthcare",   icon: "🏥", color: "#dc2626", bgColor: "#fef2f2" },
];

export function categorizeFeature(props: FeatureProperties): LayerCategory | null {
  const amenity  = props.amenity?.toLowerCase();
  const tourism  = props.tourism?.toLowerCase();
  const shop     = props.shop;
  const highway  = props.highway?.toLowerCase();
  const railway  = props.railway?.toLowerCase();

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

function fmt(v: string | number | undefined | null): string {
  if (!v) return "";
  return String(v).replace(/_/g, " ");
}

function fmtHours(raw: string): string {
  // Prettify common OSM opening_hours patterns a little
  return raw
    .replace(/Mo-Su/g, "Every day")
    .replace(/Mo-Fr/g, "Mon–Fri")
    .replace(/Sa-Su/g, "Sat–Sun")
    .replace(/;/g, " · ");
}

function starRating(stars: unknown): string {
  if (!stars) return "";
  const n = parseInt(String(stars));
  if (isNaN(n)) return "";
  return "⭐".repeat(Math.min(n, 5));
}

function websiteLink(url: string | undefined): string {
  if (!url) return "";
  const clean = String(url).replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `<a href="${url}" target="_blank" rel="noopener noreferrer"
    style="color:#0369a1;text-decoration:underline;font-size:11px;display:block;truncate;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
    title="${url}">${clean}</a>`;
}

function row(label: string, value: string, accent?: string): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:3px 0;border-bottom:1px solid #f5f5f5;">
      <span style="color:#9ca3af;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;padding-top:1px">${label}</span>
      <span style="color:${accent ?? "#374151"};font-size:11px;text-align:right;max-width:160px">${value}</span>
    </div>`;
}

export function buildPopupContent(props: FeatureProperties, category: LayerCategory): string {
  const cfg  = getLayerConfig(category);
  const name = props.name || "Unnamed Location";
  const typeRaw = props.amenity || props.tourism || props.shop || props.railway || props.highway || "";
  const typeLabel = fmt(typeRaw) || cfg.label;

  const rows: string[] = [];

  // ── Address ──────────────────────────────────────────
  const addrStreet = props["addr:street"] as string | undefined;
  const addrNum    = props["addr:housenumber"] as string | undefined;
  const addrPost   = props["addr:postcode"] as string | number | undefined;
  const addrCity   = props["addr:city"] as string | undefined;
  const addrParts = [
    addrStreet ? `${fmt(addrStreet)}${addrNum ? " " + addrNum : ""}` : "",
    addrPost   ? String(addrPost) : "",
    addrCity   ? fmt(addrCity) : "",
  ].filter(Boolean);
  if (addrParts.length) rows.push(row("Alamat", addrParts.join(", ")));

  // ── Category-specific details ─────────────────────────
  if (props.cuisine)         rows.push(row("Cuisine", fmt(String(props.cuisine))));
  if (props.stars)           rows.push(row("Bintang", starRating(props.stars) + " " + String(props.stars), "#d97706"));
  if (props.rooms)           rows.push(row("Kamar", String(props.rooms)));
  if (props.beds)            rows.push(row("Tempat tidur", String(props.beds)));
  if (props.capacity)        rows.push(row("Kapasitas", String(props.capacity)));
  if (props.operator)        rows.push(row("Operator", String(props.operator)));
  if (props.brand)           rows.push(row("Brand", String(props.brand)));
  if (props.surface)         rows.push(row("Permukaan", fmt(String(props.surface))));
  if (props.network)         rows.push(row("Jaringan", String(props.network)));
  if (props.ref)             rows.push(row("Ref", String(props.ref)));

  // ── Hours ─────────────────────────────────────────────
  if (props.opening_hours)   rows.push(row("Jam buka", fmtHours(String(props.opening_hours)), "#059669"));

  // ── Contact ───────────────────────────────────────────
  if (props.phone || props["contact:phone"]) {
    const phone = String(props.phone || props["contact:phone"]);
    rows.push(row("Telepon", `<a href="tel:${phone}" style="color:#0369a1">${phone}</a>`));
  }
  if (props.website || props["contact:website"]) {
    rows.push(row("Website", websiteLink(String(props.website || props["contact:website"]))));
  }

  // ── Accessibility ─────────────────────────────────────
  if (props.wheelchair) {
    const icons: Record<string, string> = { yes: "♿ Ya", no: "🚫 Tidak", limited: "⚠️ Terbatas" };
    rows.push(row("Kursi roda", icons[String(props.wheelchair)] ?? fmt(String(props.wheelchair))));
  }

  // ── Level / floor ─────────────────────────────────────
  if (props.level != null) rows.push(row("Lantai", String(props.level)));

  const rowsHtml = rows.join("") ||
    `<div style="color:#d1d5db;font-size:11px;text-align:center;padding:6px 0">Tidak ada detail tambahan</div>`;

  const osmIdStr = props.osm_id != null ? String(props.osm_id) : "";
  const osmId = osmIdStr
    ? `<div style="color:#d1d5db;font-size:9px;margin-top:8px;padding-top:6px;border-top:1px solid #f5f5f5">
        <a href="https://www.openstreetmap.org/node/${osmIdStr.replace(/\D/g, "")}"
           target="_blank" rel="noopener noreferrer" style="color:#cbd5e1;text-decoration:none;">
          🔗 OSM: ${osmIdStr}
        </a>
       </div>`
    : "";

  return `
<div style="font-family:system-ui,-apple-system,sans-serif;overflow:hidden;min-width:220px">
  <div style="background:linear-gradient(135deg,${cfg.color},${cfg.color}cc);padding:12px 14px;display:flex;align-items:center;gap:10px">
    <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${cfg.icon}</div>
    <div style="min-width:0">
      <div style="color:white;font-weight:700;font-size:13px;line-height:1.3;word-break:break-word">${name}</div>
      <div style="color:rgba(255,255,255,0.75);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px">${typeLabel}</div>
    </div>
  </div>
  <div style="padding:10px 14px 12px">
    ${rowsHtml}
    ${osmId}
  </div>
</div>`;
}

export function formatLabel(value: string): string {
  return value.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Human-readable type labels for tooltip subtitles
const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restoran", fast_food: "Fast Food", food_court: "Food Court",
  cafe: "Kafe",
  bar: "Bar", pub: "Pub", nightclub: "Nightclub", biergarten: "Beer Garden",
  hotel: "Hotel", hostel: "Hostel", motel: "Motel", guest_house: "Guest House", apartment: "Apartemen",
  museum: "Museum", gallery: "Galeri Seni", attraction: "Atraksi Wisata",
  viewpoint: "Titik Pandang", artwork: "Karya Seni", theme_park: "Taman Hiburan",
  theatre: "Teater", cinema: "Bioskop", arts_centre: "Pusat Seni",
  bus_stop: "Halte Bus", station: "Stasiun", tram_stop: "Halte Tram",
  subway_entrance: "Pintu Masuk Metro", taxi: "Taksi", ferry_terminal: "Terminal Ferry",
  park: "Taman", garden: "Taman Bunga", picnic_site: "Area Piknik",
  hospital: "Rumah Sakit", pharmacy: "Apotek", clinic: "Klinik",
  doctors: "Dokter", dentist: "Dokter Gigi",
};

function resolveType(props: FeatureProperties): string {
  const raw = String(
    props.amenity || props.tourism || props.shop || props.railway || props.highway || ""
  );
  return TYPE_LABELS[raw] ?? formatLabel(raw);
}

export function buildTooltipContent(props: FeatureProperties, category: LayerCategory): string {
  const cfg      = getLayerConfig(category);
  const name     = props.name ? String(props.name) : "";
  const typeLabel = resolveType(props);

  // Extra detail line for important categories
  let detail = "";
  if (props.opening_hours) {
    const hrs = String(props.opening_hours)
      .replace(/Mo-Su/g, "Setiap hari")
      .replace(/Mo-Fr/g, "Sen–Jum")
      .split(";")[0]
      .trim();
    detail = `<div class="bcn-tt-hours">🕐 ${hrs}</div>`;
  } else if (props.cuisine) {
    detail = `<div class="bcn-tt-hours">🍴 ${formatLabel(String(props.cuisine))}</div>`;
  } else if (props.stars) {
    detail = `<div class="bcn-tt-hours">${"⭐".repeat(Math.min(parseInt(String(props.stars)), 5))}</div>`;
  } else if (props.operator) {
    detail = `<div class="bcn-tt-hours">🏢 ${String(props.operator)}</div>`;
  } else if (props.network) {
    detail = `<div class="bcn-tt-hours">🔗 ${String(props.network)}</div>`;
  }

  return `
<div class="bcn-tooltip">
  <div class="bcn-tt-header">
    <span class="bcn-tt-icon" style="background:${cfg.color}20;color:${cfg.color}">${cfg.icon}</span>
    <div class="bcn-tt-body">
      <div class="bcn-tt-name">${name || typeLabel}</div>
      <div class="bcn-tt-type" style="color:${cfg.color}">${typeLabel}</div>
    </div>
  </div>
  ${detail}
</div>`;
}
