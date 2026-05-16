import { useState, useEffect, useRef } from "react";
import type { GeoFeature } from "../types/geojson";
import { categorizeFeature, getLayerConfig } from "../utils/mapUtils";

interface SearchBarProps {
  features: GeoFeature[];
  onSelect: (feature: GeoFeature) => void;
}

export default function SearchBar({ features, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    // Prefix-first: results that START with the query come first,
    // then results that contain it elsewhere, deduped.
    const starts: GeoFeature[] = [];
    const contains: GeoFeature[] = [];
    for (const f of features) {
      const name = f.properties.name?.toLowerCase() ?? "";
      if (!name) continue;
      if (name.startsWith(q)) starts.push(f);
      else if (name.includes(q)) contains.push(f);
      if (starts.length + contains.length >= 50) break; // early exit
    }
    const found = [...starts, ...contains].slice(0, 8);
    setResults(found);
    setOpen(found.length > 0);
  }, [query, features]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(feature: GeoFeature) {
    setQuery(feature.properties.name || "");
    setOpen(false);
    setFocused(false);
    onSelect(feature);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
          focused
            ? "ring-2 ring-orange-400/60 bg-white shadow-lg"
            : "bg-white/95 shadow-md"
        }`}
        style={{ minWidth: 280 }}
      >
        <svg
          className="w-4 h-4 shrink-0"
          style={{ color: focused ? "#e85d3d" : "#aaa" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Cari lokasi di Barcelona..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
          style={{ minWidth: 0 }}
        />

        {query && (
          <button
            onClick={handleClear}
            className="shrink-0 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <svg className="w-2.5 h-2.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl overflow-hidden z-50"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="py-1 max-h-60 overflow-y-auto info-scroll">
            {results.map((feature, i) => {
              const cat = categorizeFeature(feature.properties);
              const cfg = cat ? getLayerConfig(cat) : null;
              const type =
                feature.properties.amenity ||
                feature.properties.tourism ||
                feature.properties.shop ||
                feature.properties.railway ||
                "";

              return (
                <button
                  key={i}
                  className="search-result w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
                  onClick={() => handleSelect(feature)}
                >
                  <span className="text-lg shrink-0">{cfg?.icon || "📍"}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {feature.properties.name}
                    </div>
                    {type && (
                      <div className="text-xs text-gray-400 capitalize">
                        {String(type).replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-3.5 py-2 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">{results.length} hasil ditemukan</p>
          </div>
        </div>
      )}
    </div>
  );
}
