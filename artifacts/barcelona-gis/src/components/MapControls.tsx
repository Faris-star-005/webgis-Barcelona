type GpsMode = "off" | "loading" | "following" | "active";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGPS: () => void;
  onResetView: () => void;
  gpsMode: GpsMode;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onGPS,
  onResetView,
  gpsMode,
}: MapControlsProps) {
  const btnBase =
    "w-10 h-10 flex items-center justify-center rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer border-0";

  // Derive button appearance from gpsMode
  const gpsLoading   = gpsMode === "loading";
  const gpsFollowing = gpsMode === "following";
  const gpsActive    = gpsMode === "active";
  const gpsOff       = gpsMode === "off";

  // Button background
  const gpsBg = gpsFollowing
    ? "#4285f4"                              // solid Google blue — following
    : gpsActive
      ? "rgba(66,133,244,0.12)"             // pale blue tint — active, not following
      : "rgba(255,255,255,0.95)";           // white — off / loading

  // Icon color
  const gpsIconColor = gpsFollowing
    ? "white"
    : gpsActive
      ? "#4285f4"
      : gpsLoading
        ? "#4285f4"
        : "#666";

  // Tooltip text
  const gpsTitle = gpsFollowing
    ? "GPS aktif — Klik untuk mematikan"
    : gpsActive
      ? "Klik untuk kembali ke lokasi Anda"
      : gpsLoading
        ? "Mencari lokasi…"
        : "Lokasi Saya";

  return (
    <div className="flex flex-col gap-2">
      {/* Zoom In */}
      <button
        className={btnBase}
        onClick={onZoomIn}
        title="Zoom In"
        style={{ background: "rgba(255,255,255,0.95)" }}
      >
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {/* Zoom Out */}
      <button
        className={btnBase}
        onClick={onZoomOut}
        title="Zoom Out"
        style={{ background: "rgba(255,255,255,0.95)" }}
      >
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <path strokeLinecap="round" d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {/* Divider */}
      <div className="h-px w-6 mx-auto bg-gray-200" />

      {/* GPS — 3-state button */}
      <button
        className={`${btnBase} relative overflow-hidden`}
        onClick={onGPS}
        title={gpsTitle}
        style={{
          background: gpsBg,
          boxShadow: gpsFollowing
            ? "0 0 0 2px rgba(66,133,244,0.4), 0 4px 12px rgba(66,133,244,0.3)"
            : undefined,
          border: gpsActive ? "1.5px solid #4285f4" : undefined,
          transition: "background 0.25s, box-shadow 0.25s",
        }}
      >
        {gpsLoading ? (
          /* Spinning search ring */
          <svg
            className="w-5 h-5"
            style={{ color: gpsIconColor, animation: "bcn-spin 0.9s linear infinite" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : gpsFollowing ? (
          /* Solid navigation arrow — following */
          <svg className="w-5 h-5" style={{ color: gpsIconColor }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        ) : gpsActive ? (
          /* Outlined navigation arrow — active but not following */
          <svg className="w-5 h-5" style={{ color: gpsIconColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        ) : (
          /* Crosshair — off */
          <svg className="w-5 h-5" style={{ color: gpsIconColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" strokeDasharray="2 4" />
          </svg>
        )}

        {/* Subtle ripple ring when active */}
        {(gpsFollowing || gpsActive) && (
          <span
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              animation: gpsFollowing ? "gps-btn-pulse 2s ease-out infinite" : undefined,
              background: "transparent",
              border: gpsFollowing ? "2px solid rgba(66,133,244,0.5)" : undefined,
            }}
          />
        )}
      </button>

      {/* Reset view */}
      <button
        className={btnBase}
        onClick={onResetView}
        title="Kembali ke Barcelona"
        style={{ background: "rgba(255,255,255,0.95)" }}
      >
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      </button>

      {/* GPS mode label badge */}
      {!gpsOff && (
        <div
          className="text-center rounded-lg px-1.5 py-0.5 text-xs font-semibold leading-tight select-none"
          style={{
            background: gpsFollowing ? "rgba(66,133,244,0.12)" : "rgba(0,0,0,0.06)",
            color: gpsFollowing ? "#4285f4" : gpsActive ? "#4285f4" : "#888",
            fontSize: 9,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {gpsLoading ? "Mencari…" : gpsFollowing ? "Mengikuti" : "Aktif"}
        </div>
      )}
    </div>
  );
}
