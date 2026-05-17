import { useState, useRef, useEffect } from "react";

export default function MusicPlayer() {
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying]   = useState(false);
  const [volume, setVolume]     = useState(0.4);
  const [showVol, setShowVol]   = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const rafRef = useRef<number>(0);

  // Init audio
  useEffect(() => {
    const audio = new Audio("/barcelona-music.mp3");
    audio.loop   = true;
    audio.volume = volume;
    audioRef.current = audio;

    function onTimeUpdate() {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    }
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.pause();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  // Volume icon based on level
  function VolIcon() {
    if (volume === 0) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" strokeWidth="0" opacity="0.7"/>
        <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    );
    if (volume < 0.5) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" strokeWidth="0" opacity="0.7"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" strokeWidth="0" opacity="0.7"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
  }

  const pct = Math.round(volume * 100);

  return (
    <div
      className="flex items-center gap-2 select-none"
      style={{ pointerEvents: "auto" }}
    >
      {/* Play/pause */}
      <button
        onClick={togglePlay}
        title={playing ? "Pause musik" : "Putar musik Barcelona"}
        className="relative flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
        style={{
          width: 34,
          height: 34,
          background: playing
            ? "linear-gradient(135deg,#e85d3d,#f59e0b)"
            : "rgba(255,255,255,0.12)",
          boxShadow: playing ? "0 2px 10px rgba(232,93,61,0.45)" : undefined,
          border: "1.5px solid rgba(255,255,255,0.18)",
        }}
      >
        {playing ? (
          /* Pause bars */
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
        ) : (
          /* Play triangle */
          <svg className="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
            <path d="M8 5.14v14l11-7-11-7z"/>
          </svg>
        )}

        {/* Pulse ring when playing */}
        {playing && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid rgba(232,93,61,0.5)",
              animation: "bcn-pulse 2s ease infinite",
            }}
          />
        )}
      </button>

      {/* Track name */}
      <div className="flex flex-col leading-tight" style={{ maxWidth: 120 }}>
        <span className="text-white/80 text-xs font-semibold truncate">
          🎵 Barcelona
        </span>
        <div
          className="mt-0.5 rounded-full overflow-hidden"
          style={{ height: 2, background: "rgba(255,255,255,0.15)", width: 80 }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress * 100}%`,
              background: playing
                ? "linear-gradient(90deg,#e85d3d,#f59e0b)"
                : "rgba(255,255,255,0.3)",
            }}
          />
        </div>
      </div>

      {/* Volume control */}
      <div className="relative flex items-center">
        <button
          onClick={() => setShowVol((v) => !v)}
          title="Atur volume"
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{
            color: volume === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
            background: showVol ? "rgba(255,255,255,0.1)" : "transparent",
          }}
        >
          <div className="w-4 h-4">
            <VolIcon />
          </div>
        </button>

        {/* Volume popup */}
        {showVol && (
          <div
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-xl"
            style={{
              background: "rgba(15,52,96,0.97)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Vertical slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="volume-slider-v"
              style={{
                writingMode: "vertical-lr" as const,
                direction: "rtl" as const,
                width: 4,
                height: 80,
                appearance: "slider-vertical" as unknown as "none",
                accentColor: "#e85d3d",
                cursor: "pointer",
              }}
            />
            <span className="text-white/60 text-xs font-mono">{pct}%</span>
            {/* Quick presets */}
            <div className="flex flex-col gap-1 mt-1">
              {[100, 50, 0].map((p) => (
                <button
                  key={p}
                  onClick={() => setVolume(p / 100)}
                  className="text-xs rounded px-2 py-0.5 transition-all"
                  style={{
                    background: pct === p ? "rgba(232,93,61,0.3)" : "transparent",
                    color: pct === p ? "#f59e0b" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {p === 0 ? "🔇" : p === 50 ? "🔉 50%" : "🔊 Max"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
