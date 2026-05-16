/**
 * Lightweight canvas-based heatmap layer for Leaflet.
 * Implements the simpleheat algorithm without any external dependency.
 */
import L from "leaflet";

export type HeatPoint = [number, number, number]; // [lat, lng, intensity]

interface HeatOptions {
  radius?: number;
  blur?: number;
  minOpacity?: number;
  max?: number;
  gradient?: Record<string, string>;
}

const DEFAULT_GRADIENT: Record<string, string> = {
  "0.1": "blue",
  "0.3": "cyan",
  "0.5": "lime",
  "0.7": "yellow",
  "1.0": "red",
};

class HeatLayerImpl extends L.Layer {
  private _points: HeatPoint[];
  private _opts: Required<HeatOptions>;
  private _canvas: HTMLCanvasElement | null = null;
  private _frame: number | null = null;

  constructor(points: HeatPoint[], opts: HeatOptions = {}) {
    super();
    this._points = points;
    this._opts = {
      radius: opts.radius ?? 22,
      blur: opts.blur ?? 18,
      minOpacity: opts.minOpacity ?? 0.35,
      max: opts.max ?? 1,
      gradient: opts.gradient ?? DEFAULT_GRADIENT,
    };
  }

  setLatLngs(points: HeatPoint[]) {
    this._points = points;
    this._scheduleRedraw();
    return this;
  }

  setOptions(opts: HeatOptions) {
    Object.assign(this._opts, opts);
    this._scheduleRedraw();
    return this;
  }

  onAdd(map: L.Map): this {
    const pane = map.getPanes().overlayPane;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.pointerEvents = "none";
    canvas.classList.add("leaflet-zoom-animated");
    pane.appendChild(canvas);
    this._canvas = canvas;
    this._resize();
    map.on("moveend zoomend resize", this._redraw, this);
    map.on("zoomanim", this._onZoomAnim as unknown as L.LeafletEventHandlerFn, this);
    this._redraw();
    return this;
  }

  onRemove(map: L.Map): this {
    if (this._canvas) {
      this._canvas.remove();
      this._canvas = null;
    }
    if (this._frame !== null) {
      cancelAnimationFrame(this._frame);
      this._frame = null;
    }
    map.off("moveend zoomend resize", this._redraw, this);
    map.off("zoomanim", this._onZoomAnim as unknown as L.LeafletEventHandlerFn, this);
    return this;
  }

  private _onZoomAnim = (ev: unknown) => {
    if (!this._canvas || !this._map) return;
    const e = ev as { center: L.LatLng; zoom: number };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = this._map as any;
    const scale = map.getZoomScale(e.zoom);
    const offset = map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(map._getMapPanePos());
    if (L.DomUtil.setTransform) {
      L.DomUtil.setTransform(this._canvas!, offset as L.Point, scale);
    }
  };

  private _resize() {
    if (!this._canvas || !this._map) return;
    const size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
  }

  private _scheduleRedraw() {
    if (!this._map) return;
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._frame = requestAnimationFrame(() => {
      this._frame = null;
      this._redraw();
    });
  }

  private _redraw = () => {
    if (!this._canvas || !this._map) return;
    const map = this._map as L.Map;
    this._resize();

    const ctx = this._canvas.getContext("2d");
    if (!ctx) return;

    const w = this._canvas.width;
    const h = this._canvas.height;
    ctx.clearRect(0, 0, w, h);

    const r = this._opts.radius;
    const blur = this._opts.blur;
    const max = this._opts.max;

    // Build circle stamp
    const circle = this._buildCircle(r, blur);

    // Project points to container coords
    const mapped: Array<[number, number, number]> = [];
    for (const [lat, lng, intensity] of this._points) {
      const pt = map.latLngToContainerPoint([lat, lng]);
      mapped.push([pt.x, pt.y, intensity]);
    }

    // Draw stamps at min opacity
    ctx.globalAlpha = this._opts.minOpacity;
    ctx.globalCompositeOperation = "source-over";

    for (const [x, y, intensity] of mapped) {
      ctx.globalAlpha = Math.max(intensity / max, this._opts.minOpacity);
      ctx.drawImage(circle, x - r, y - r);
    }

    // Colorize
    const imageData = ctx.getImageData(0, 0, w, h);
    this._colorize(imageData.data, this._buildGradient());
    ctx.putImageData(imageData, 0, 0);
  };

  private _buildCircle(r: number, blur: number): HTMLCanvasElement {
    const d = (r + blur) * 2;
    const c = document.createElement("canvas");
    c.width = c.height = d;
    const ctx = c.getContext("2d")!;
    ctx.shadowOffsetX = ctx.shadowOffsetY = d * 2;
    ctx.shadowBlur = blur * 2;
    ctx.shadowColor = "black";
    ctx.beginPath();
    ctx.arc(-d, -d, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    return c;
  }

  private _buildGradient(): Uint8ClampedArray {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    for (const [stop, color] of Object.entries(this._opts.gradient)) {
      grad.addColorStop(parseFloat(stop), color);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 256);
    return ctx.getImageData(0, 0, 1, 256).data;
  }

  private _colorize(data: Uint8ClampedArray, gradient: Uint8ClampedArray) {
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha) {
        const idx = alpha * 4;
        data[i - 3] = gradient[idx];
        data[i - 2] = gradient[idx + 1];
        data[i - 1] = gradient[idx + 2];
        data[i] = alpha;
      }
    }
  }
}

export function createHeatLayer(points: HeatPoint[], opts?: HeatOptions): HeatLayerImpl {
  return new HeatLayerImpl(points, opts);
}
