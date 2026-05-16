interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGPS: () => void;
  onResetView: () => void;
  gpsLoading: boolean;
  gpsActive: boolean;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onGPS,
  onResetView,
  gpsLoading,
  gpsActive,
}: MapControlsProps) {
  const btnBase =
    "w-10 h-10 flex items-center justify-center rounded-xl glass-panel shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer border-0";

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

      {/* GPS */}
      <button
        className={`${btnBase} relative overflow-hidden`}
        onClick={onGPS}
        title="Lokasi Saya"
        style={{
          background: gpsActive
            ? "linear-gradient(135deg, #e85d3d, #f59e0b)"
            : "rgba(255,255,255,0.95)",
        }}
      >
        {gpsLoading ? (
          <svg
            className="w-5 h-5"
            style={{
              color: gpsActive ? "white" : "#e85d3d",
              animation: "bcn-spin 1s linear infinite",
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            style={{ color: gpsActive ? "white" : "#666" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" strokeDasharray="2 4" />
          </svg>
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
    </div>
  );
}
