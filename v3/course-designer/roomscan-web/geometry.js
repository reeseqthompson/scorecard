// 2D primitives and merging (meters in world XZ)

export class Vec2 { constructor(x, y) { this.x = x; this.y = y; } }
export class LineSegment { constructor(a, b) { this.a = a; this.b = b; } }
export const Opening = Object.freeze({ DOOR: 'door', WINDOW: 'window' });

function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy); }

const ANGLE_SNAP_DEG = 10;
const MERGE_DIST = 0.05; // meters

function snapAngleRad(theta) {
  const degrees = (theta * 180 / Math.PI);
  const opts = [0, 90, 180, 270];
  const norm = ((degrees % 360) + 360) % 360;
  let best = opts[0], bestd = 999;
  for (const d of opts) { const dd = Math.abs(d - norm); if (dd < bestd) { bestd = dd; best = d; } }
  return best * Math.PI / 180;
}

function snapSegment(seg) {
  const dx = seg.b.x - seg.a.x, dy = seg.b.y - seg.a.y;
  const theta = Math.atan2(dy, dx);
  const snapped = snapAngleRad(theta);
  const len = Math.hypot(dx, dy);
  const cx = (seg.a.x + seg.b.x) / 2, cy = (seg.a.y + seg.b.y) / 2;
  const ux = Math.cos(snapped), uy = Math.sin(snapped);
  const hx = ux * (len / 2), hy = uy * (len / 2);
  return new LineSegment(new Vec2(cx - hx, cy - hy), new Vec2(cx + hx, cy + hy));
}

function pointToSegDistance(p, s) {
  const x = p.x, y = p.y, x1 = s.a.x, y1 = s.a.y, x2 = s.b.x, y2 = s.b.y;
  const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D, lenSq = C * C + D * D;
  const t = lenSq !== 0 ? Math.max(0, Math.min(1, dot / lenSq)) : 0;
  const xx = x1 + t * C, yy = y1 + t * D;
  return Math.hypot(x - xx, y - yy);
}

function areColinear(a, b) {
  const dax = a.b.x - a.a.x, day = a.b.y - a.a.y;
  const dbx = b.b.x - b.a.x, dby = b.b.y - b.a.y;
  const da = Math.hypot(dax, day), db = Math.hypot(dbx, dby);
  if (da === 0 || db === 0) return false;
  const dot = Math.abs((dax/da)*(dbx/db) + (day/da)*(dby/db));
  return dot > Math.cos(ANGLE_SNAP_DEG * Math.PI / 180);
}

function projectionsOverlap(a, b) {
  const ax = a.b.x - a.a.x, ay = a.b.y - a.a.y;
  const aMin = 0, aMax = ax*ax + ay*ay;
  const b0 = (b.a.x - a.a.x) * ax + (b.a.y - a.a.y) * ay;
  const b1 = (b.b.x - a.a.x) * ax + (b.b.y - a.a.y) * ay;
  const bMin = Math.min(b0, b1), bMax = Math.max(b0, b1);
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
}

function areNear(a, b) {
  const d = Math.min(
    Math.min(pointToSegDistance(a.a, b), pointToSegDistance(a.b, b)),
    Math.min(pointToSegDistance(b.a, a), pointToSegDistance(b.b, a))
  );
  if (d > MERGE_DIST) return false;
  return projectionsOverlap(a, b);
}

export class FloorPlanBuilder {
  constructor() {
    this.walls = [];
    this.doors = [];
    this.windows = [];
    this.trace = []; // manual trace points
  }
  updateWithSegment(seg) {
    const snappedNew = snapSegment(seg);
    let merged = false;
    for (let i = 0; i < this.walls.length; i++) {
      const s = snapSegment(this.walls[i]);
      if (areColinear(snappedNew, s) && areNear(snappedNew, s)) {
        const pts = [snappedNew.a, snappedNew.b, s.a, s.b];
        const axis = { x: snappedNew.b.x - snappedNew.a.x, y: snappedNew.b.y - snappedNew.a.y };
        const proj = pts.map(p => p.x * axis.x + p.y * axis.y);
        const minIdx = proj.indexOf(Math.min(...proj));
        const maxIdx = proj.indexOf(Math.max(...proj));
        this.walls[i] = new LineSegment(pts[minIdx], pts[maxIdx]);
        merged = true; break;
      }
    }
    if (!merged) this.walls.push(snappedNew);
  }
  addTracePoint(p) {
    // Add point and connect to previous as a segment if distance is sufficient
    const v = new Vec2(p.x, p.y);
    const n = this.trace.length;
    if (n > 0) {
      const last = this.trace[n - 1];
      if (dist(last, v) > 0.05) this.updateWithSegment(new LineSegment(last, v));
    }
    this.trace.push(v);
  }
  addOpening(kind, p, widthMeters = 0.9) {
    const entry = { center: new Vec2(p.x, p.y), widthMeters, kind };
    if (kind === Opening.DOOR) this.doors.push(entry);
    else this.windows.push(entry);
  }
  getWalls() { return this.walls; }
  getDoors() { return this.doors; }
  getWindows() { return this.windows; }
  reset() { this.walls = []; this.doors = []; this.windows = []; this.trace = []; }
}
