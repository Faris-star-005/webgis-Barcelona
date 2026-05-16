import { useState, useEffect, useRef, useCallback } from "react";
import type { GeoFeature } from "../types/geojson";
import { categorizeFeature, getLayerConfig } from "../utils/mapUtils";

interface SearchBarProps {
  features: GeoFeature[];
  onSelect: (feature: GeoFeature) => void;
}

export default function SearchBar({ features, onSelect }: SearchBarProps) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<GeoFeature[]>([]);
  const [open, setOpen]         = useState(false);
  const [focused, setFocused]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);
  const itemRefs     = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Search logic ─────────────────────────────────────────────────
  useEffect(() => {
    setActiveIdx(-1);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const starts: GeoFeature[]   = [];
    const contains: GeoFeature[] = [];
    for (const f of features) {
      const name = f.properties.name?.toLowerCase() ?? "";
      if (!name) continue;
      if (name.startsWith(q)) starts.push(f);
      else if (name.includes(q)) contains.push(f);
      if (starts.length + contains.length >= 50) break;
    }
    const found = [...starts, ...contains].slice(0, 8);
    setResults(found);
    setOpen(found.length > 0);
  }, [query, features]);

  // ── Click outside ─────────────────────────────────────────────────
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Keep active item visible ──────────────────────────────────────
  useEffect(() => {
    if (activeIdx >= 0 && itemRefs.current[activeIdx]) {
      itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  // ── Keyboard handler ──────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIdx((i) => (i + 1) % results.length);
          break;

        case "ArrowUp":
          e.preventDefault();
          setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
          break;

        case "Enter":
          e.preventDefault();
          if (activeIdx >= 0 && results[activeIdx]) {
            handleSelect(results[activeIdx]);
          } else if (results.length === 1) {
            handleSelect(results[0]);
          }
          break;

        case "Escape":
          e.preventDefault();
          setOpen(false);
          setActiveIdx(-1);
          inputRef.current?.blur();
          setFocused(false);
          break;

        case "Tab":
          setOpen(false);
          setActiveIdx(-1);
          break;

        default:
          break;
      }
    },
    [open, results, activeIdx]
  );

  function handleSelect(feature: GeoFeature) {
    setQuery(String(feature.properties.name ?? ""));
    setOpen(false);
    setFocused(false);
    setActiveIdx(-1);
    onSelect(feature);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  // ── Highlight matched text ────────────────────────────────────────
  function highlight(text: string, q: string): React.ReactNode {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark
          style={{
            background: "rgba(232,93,61,0.18)",
            color: "#c2410c",
            fontWeight: 700,
            borderRadius: 2,
            padding: "0 1px",
          }}
        >
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Input ──────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
          focused ? "ring-2 ring-orange-400/60 bg-white shadow-lg" : "bg-white/95 shadow-md"
        }`}
        style={{ minWidth: 280 }}
      >
        <svg
          className="w-4 h-4 shrink-0 transition-colors"
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
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-activedescendant={activeIdx >= 0 ? `search-item-${activeIdx}` : undefined}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cari lokasi di Barcelona..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
          style={{ minWidth: 0 }}
        />

        {/* Keyboard hint — shown when dropdown is open */}
        {open && (
          <span className="shrink-0 text-gray-300 text-xs hidden sm:flex items-center gap-0.5 select-none">
            <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-400 text-xs font-mono">↑↓</kbd>
            <kbd className="px-1 py-0.5 rounded bg-gray-100 text-gray-400 text-xs font-mono">↵</kbd>
          </span>
        )}

        {query && (
          <button
            onClick={handleClear}
            tabIndex={-1}
            className="shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-2.5 h-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Dropdown ───────────────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl overflow-hidden z-50"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="py-1 max-h-64 overflow-y-auto info-scroll">
            {results.map((feature, i) => {
              const cat  = categorizeFeature(feature.properties);
              const cfg  = cat ? getLayerConfig(cat) : null;
              const name = String(feature.properties.name ?? "");
              const type =
                String(
                  feature.properties.amenity ||
                  feature.properties.tourism ||
                  feature.properties.shop   ||
                  feature.properties.railway ||
                  ""
                ).replace(/_/g, " ");

              const isActive = i === activeIdx;

              return (
                <button
                  key={i}
                  id={`search-item-${i}`}
                  role="option"
                  aria-selected={isActive}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="search-result w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
                  style={{
                    background: isActive
                      ? "linear-gradient(90deg, rgba(232,93,61,0.08), rgba(232,93,61,0.04))"
                      : undefined,
                    borderLeft: isActive ? "3px solid #e85d3d" : "3px solid transparent",
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => handleSelect(feature)}
                >
                  {/* Category dot */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: cfg ? cfg.bgColor : "#f5f5f5" }}
                  >
                    {cfg?.icon ?? "📍"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {highlight(name, query)}
                    </div>
                    {type && (
                      <div className="text-xs capitalize" style={{ color: cfg?.color ?? "#999" }}>
                        {type}
                      </div>
                    )}
                  </div>

                  {/* Arrow hint when active */}
                  {isActive && (
                    <svg className="w-3.5 h-3.5 shrink-0 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="px-3.5 py-2 flex items-center justify-between border-t border-gray-100"
            style={{ background: "rgba(0,0,0,0.015)" }}
          >
            <p className="text-xs text-gray-400">{results.length} hasil</p>
            <div className="flex items-center gap-1.5 text-gray-300 text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-xs font-mono leading-none">Esc</kbd>
              <span>tutup</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
