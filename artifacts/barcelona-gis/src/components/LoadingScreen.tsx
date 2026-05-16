interface LoadingScreenProps {
  progress: number;
  status: string;
  visible: boolean;
}

export default function LoadingScreen({ progress, status, visible }: LoadingScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #1a2744 0%, #0f1e3d 40%, #1a3a5c 70%, #0d2137 100%)",
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Animated map icon */}
        <div className="relative mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.15)",
              animation: "bcn-pulse 2s ease-in-out infinite",
            }}
          >
            <svg
              className="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </div>

          {/* Ripple rings */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-white/20"
              style={{
                animation: `bcn-pulse ${1.5 + i * 0.5}s ease-out infinite`,
                animationDelay: `${i * 0.3}s`,
                transform: `scale(${1 + i * 0.35})`,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div style={{ animation: "bcn-slide-up 0.6s ease-out forwards" }}>
          <h1
            className="text-4xl font-bold text-white mb-1"
            style={{ letterSpacing: "-0.02em" }}
          >
            Barcelona
          </h1>
          <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mb-6">
            WebGIS Explorer
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 mb-4">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #e85d3d, #f59e0b)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/40 text-xs">{status}</span>
            <span className="text-white/40 text-xs">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-8 h-px bg-white/20" />
          <svg className="w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <div className="w-8 h-px bg-white/20" />
        </div>

        <p className="text-white/25 text-xs mt-3">
          Mapping 22,862 lokasi Barcelona
        </p>
      </div>
    </div>
  );
}
