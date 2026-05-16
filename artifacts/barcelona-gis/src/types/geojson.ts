export interface FeatureProperties {
  osm_id?: number;
  osm_type?: string;
  highway?: string;
  surface?: string | null;
  operator?: string | null;
  rooms?: number | null;
  name?: string | null;
  beds?: number | null;
  opening_hours?: string | null;
  railway?: string | null;
  shop?: string | null;
  width?: number | null;
  tourism?: string | null;
  roof_material?: string | null;
  building?: string | null;
  oneway?: string | null;
  amenity?: string | null;
  tunnel?: string | null;
  bridge?: string | null;
  [key: string]: unknown;
}

export interface GeoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: FeatureProperties;
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

export type LayerCategory =
  | "restaurants"
  | "cafes"
  | "bars"
  | "hotels"
  | "tourism"
  | "transport"
  | "shops"
  | "parks"
  | "healthcare";

export interface LayerConfig {
  id: LayerCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}
