const PX_PER_METER = 100;
const WALL_STROKE = 8;

function bounds(walls, opens) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (p) => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); };
  walls.forEach(w => { add(w.a); add(w.b); });
  opens.forEach(o => add(o.center));
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 1; maxY = 1; }
  return { minX, minY, maxX, maxY };
}

export function exportSVG(walls, doors, windows) {
  const b = bounds(walls, [...doors, ...windows]);
  const width = Math.max(100, (b.maxX - b.minX) * PX_PER_METER);
  const height = Math.max(100, (b.maxY - b.minY) * PX_PER_METER);
  let svg = '';
  svg += `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>`;
  svg += `<g transform='translate(${ -b.minX * PX_PER_METER }, ${ -b.minY * PX_PER_METER })'>`;
  for (const w of walls) {
    const x1 = w.a.x * PX_PER_METER, y1 = w.a.y * PX_PER_METER;
    const x2 = w.b.x * PX_PER_METER, y2 = w.b.y * PX_PER_METER;
    svg += `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='black' stroke-width='${WALL_STROKE}' stroke-linecap='round' />`;
  }
  const openLine = (o, color) => {
    const x = o.center.x * PX_PER_METER, y = o.center.y * PX_PER_METER;
    const half = (o.widthMeters * PX_PER_METER) / 2;
    return `<line x1='${x - half}' y1='${y}' x2='${x + half}' y2='${y}' stroke='${color}' stroke-width='4' />`;
  };
  doors.forEach(o => svg += openLine(o, '#2e7d32'));
  windows.forEach(o => svg += openLine(o, '#1565c0'));
  svg += `</g></svg>`;
  return svg;
}

export function exportJSON(walls, doors, windows) {
  const obj = {
    units: 'meters',
    walls: walls.map(w => ({ x1: w.a.x, y1: w.a.y, x2: w.b.x, y2: w.b.y })),
    doors: doors.map(d => ({ kind: 'door', x: d.center.x, y: d.center.y, width: d.widthMeters })),
    windows: windows.map(w => ({ kind: 'window', x: w.center.x, y: w.center.y, width: w.widthMeters }))
  };
  return JSON.stringify(obj, null, 2);
}
