/**
 * Canvas-based heatmap layer for Leaflet.
 * Positions the canvas correctly using containerPointToLayerPoint, matching
 * the approach used by the official leaflet.heat plugin.
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
    this._reset();
    return this;
  }

  setOptions(opts: HeatOptions) {
    Object.assign(this._opts, opts);
    this._reset();
    return this;
  }

  onAdd(map: L.Map): this {
    const pane = map.getPanes().overlayPane;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    const zoomAnimated = map.options.zoomAnimation && L.Browser.any3d;
    canvas.classList.add("leaflet-zoom-" + (zoomAnimated ? "animated" : "hide"));
    pane.appendChild(canvas);
    this._canvas = canvas;
    map.on("moveend", this._reset, this);
    map.on("zoomanim", this._onZoomAnim as unknown as L.LeafletEventHandlerFn, this);
    this._reset();
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
    map.off("moveend", this._reset, this);
    map.off("zoomanim", this._onZoomAnim as unknown as L.LeafletEventHandlerFn, this);
    return this;
  }

  // Called during animated zoom to scale/translate the canvas
  private _onZoomAnim = (ev: unknown) => {
    if (!this._canvas || !this._map) return;
    const e = ev as { center: L.LatLng; zoom: number };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = this._map as any;
    const scale = (this._map as L.Map).getZoomScale(e.zoom);
    const offset = (m._getCenterOffset(e.center) as L.Point)
      .multiplyBy(-scale)
      .subtract(m._getMapPanePos() as L.Point);
    if (L.DomUtil.setTransform) {
      L.DomUtil.setTransform(this._canvas, offset, scale);
    }
  };

  // Reposition canvas and redraw
  private _reset = () => {
    if (!this._canvas || !this._map) return;
    const map = this._map as L.Map;

    // Align canvas top-left with the map container's top-left corner,
    // accounting for Leaflet's pane offset (critical for correct positioning)
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    const size = map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    this._scheduleRedraw();
  };

  private _scheduleRedraw() {
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._frame = requestAnimationFrame(() => {
      this._frame = null;
      this._draw();
    });
  }

  private _draw() {
    if (!this._canvas || !this._map) return;
    const map = this._map as L.Map;
    const ctx = this._canvas.getContext("2d");
    if (!ctx) return;

    const w = this._canvas.width;
    const h = this._canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!this._points.length) return;

    const r = this._opts.radius;
    const blur = this._opts.blur;
    const max = this._opts.max;
    const minOpacity = this._opts.minOpacity;

    // Pre-build circle stamp and gradient lookup once per draw
    const circle = this._buildCircle(r, blur);
    const gradient = this._buildGradient();

    // Project latlngs → container pixels (container coords, but canvas is
    // already positioned at containerPointToLayerPoint([0,0]) so these
    // pixels map correctly onto our canvas)
    const mapped: Array<[number, number, number]> = [];
    for (const [lat, lng, intensity] of this._points) {
      const pt = map.latLngToContainerPoint([lat, lng]);
      mapped.push([pt.x, pt.y, intensity]);
    }

    // Draw alpha stamps
    ctx.globalCompositeOperation = "source-over";
    for (const [x, y, intensity] of mapped) {
      const alpha = Math.max(intensity / max, minOpacity);
      ctx.globalAlpha = alpha;
      ctx.drawImage(circle, x - r - blur, y - r - blur);
    }

    // Colorize via gradient palette
    const imageData = ctx.getImageData(0, 0, w, h);
    this._colorize(imageData.data, gradient);
    ctx.putImageData(imageData, 0, 0);
  }

  private _buildCircle(r: number, blur: number): HTMLCanvasElement {
    const size = (r + blur) * 2;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    // Paint a radial gradient circle: opaque center → transparent edge
    const grad = ctx.createRadialGradient(r + blur, r + blur, 0, r + blur, r + blur, r + blur);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
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
        // Alpha encodes density; map to gradient color
        const idx = Math.min(255, Math.floor(alpha)) * 4;
        data[i - 3] = gradient[idx];
        data[i - 2] = gradient[idx + 1];
        data[i - 1] = gradient[idx + 2];
        // Keep alpha for minOpacity blending
      }
    }
  }
}

export function createHeatLayer(points: HeatPoint[], opts?: HeatOptions): L.Layer {
  return new HeatLayerImpl(points, opts);
}
