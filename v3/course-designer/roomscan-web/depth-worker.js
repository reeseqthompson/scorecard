// Worker: receive 2D points (world XZ in meters) and fit line segments via RANSAC

function ransacLines(points, eps = 0.08, iterations = 240, minInliers = 30) {
  // points: Float32Array [x0,y0,x1,y1,...]
  const N = points.length / 2;
  const used = new Array(N).fill(false);
  const idxs = [...Array(N).keys()];
  const results = [];

  function samplePair() {
    let i = 0, j = 0, tries = 0;
    do {
      i = idxs[Math.floor(Math.random() * N)];
      j = idxs[Math.floor(Math.random() * N)];
      tries++;
    } while ((j === i || used[i] || used[j] || distIdx(i, j) < 0.3) && tries < 50);
    return [i, j];
  }
  function distIdx(i, j) {
    const x1 = points[2*i], y1 = points[2*i+1];
    const x2 = points[2*j], y2 = points[2*j+1];
    const dx = x1 - x2, dy = y1 - y2;
    return Math.hypot(dx, dy);
  }
  function lineFrom(i, j) {
    const x1 = points[2*i], y1 = points[2*i+1];
    const x2 = points[2*j], y2 = points[2*j+1];
    const dx = x2 - x1, dy = y2 - y1;
    if (dx === 0 && dy === 0) return null;
    // ax + by + c = 0 normalized
    let a = dy, b = -dx, c = dx*y1 - dy*x1;
    const n = Math.hypot(a, b); a/=n; b/=n; c/=n;
    // Snap angle to 0/90 deg preference
    const ang = Math.atan2(-a, b); // line direction angle
    const snap = snapAngle(ang);
    const ux = Math.cos(snap), uy = Math.sin(snap);
    return { a, b, c, ux, uy };
  }
  function snapAngle(theta) {
    const deg = ((theta*180/Math.PI)%360+360)%360;
    const opts = [0, 90, 180, 270];
    let best = 0, bd = 999;
    for (const d of opts) { const dd = Math.abs(d - deg); if (dd < bd) { bd=dd; best=d; } }
    return best*Math.PI/180;
  }
  function pointLineDist(l, x, y) { return Math.abs(l.a*x + l.b*y + l.c); }

  for (let it = 0; it < iterations; it++) {
    const [i, j] = samplePair();
    const L = lineFrom(i, j); if (!L) continue;
    const inliers = [];
    for (let k = 0; k < N; k++) {
      if (used[k]) continue;
      const x = points[2*k], y = points[2*k+1];
      if (pointLineDist(L, x, y) <= eps) inliers.push(k);
    }
    if (inliers.length < minInliers) continue;
    // Compute segment extent along direction (ux,uy)
    let minT = Infinity, maxT = -Infinity;
    for (const k of inliers) {
      const x = points[2*k], y = points[2*k+1];
      const t = x*L.ux + y*L.uy; // projection
      if (t < minT) minT = t;
      if (t > maxT) maxT = t;
    }
    // Estimate a point on the line near average
    let mx = 0, my = 0;
    for (const k of inliers) { mx += points[2*k]; my += points[2*k+1]; }
    mx /= inliers.length; my /= inliers.length;
    const midT = mx*L.ux + my*L.uy;
    const pa = { x: (minT)*L.ux + (mx - midT)*L.ux + (my - midT)*(-L.uy), y: (minT)*L.uy + (mx - midT)*L.uy + (my - midT)*(L.ux) };
    const pb = { x: (maxT)*L.ux + (mx - midT)*L.ux + (my - midT)*(-L.uy), y: (maxT)*L.uy + (mx - midT)*L.uy + (my - midT)*(L.ux) };
    results.push({ x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y });
    // Mark inliers as used (greedy extraction)
    for (const k of inliers) used[k] = true;
  }
  return results;
}

self.onmessage = (e) => {
  const { type, points, eps, iterations, minInliers } = e.data || {};
  if (type !== 'points' || !(points instanceof Float32Array)) return;
  const segs = ransacLines(points, eps, iterations, minInliers);
  self.postMessage({ segments: segs });
};
