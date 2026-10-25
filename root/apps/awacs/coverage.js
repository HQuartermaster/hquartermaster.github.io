// Merge in bounded batches: avoid passing thousands of polygons as arguments.
function unionAll(polygons, clipping) {
  if (!polygons.length) return [];
  let groups = polygons;
  do {
    const next = [];
    for (let i = 0; i < groups.length; i += 64) next.push(clipping.union(...groups.slice(i, i + 64)));
    groups = next;
  } while (groups.length > 1);
  return groups[0];
}

export function combineCoverage(entries, clipping) {
  const states = { VISIBLE: [], UNKNOWN: [], LOST: [] };
  const world = [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]];
  for (const entry of entries) {
    if (entry.merged) {
      for (const state of Object.keys(states)) if (entry.merged[state].length) states[state].push(entry.merged[state]);
      continue;
    }
    const source_states = { VISIBLE: [], UNKNOWN: [], LOST: [] };
    for (const feature of entry.features) {
      const polygon = feature.geometry.coordinates;
      const longitudes = polygon[0].map(point => point[0]);
      const shifts = [0];
      if (Math.max(...longitudes) > 180) shifts.push(-360);
      if (Math.min(...longitudes) < -180) shifts.push(360);
      for (const shift of shifts) {
        const shifted = polygon.map(ring => ring.map(([x, y]) => [x + shift, y]));
        const clipped = shifts.length > 1 ? clipping.intersection(shifted, world) : [shifted];
        if (clipped.length) source_states[feature.properties.state].push(clipped);
      }
    }
    entry.merged = {};
    for (const state of Object.keys(states)) {
      entry.merged[state] = unionAll(source_states[state], clipping);
      if (entry.merged[state].length) states[state].push(entry.merged[state]);
    }
  }
  const visible = unionAll(states.VISIBLE, clipping);
  const unknown = unionAll(states.UNKNOWN, clipping);
  const lost = unionAll(states.LOST, clipping);
  // A visible observation wins; otherwise unknown coverage is not confirmed masking.
  const disjoint = {
    VISIBLE: visible,
    UNKNOWN: unknown.length && visible.length ? clipping.difference(unknown, visible) : unknown,
    LOST: lost.length ? clipping.difference(lost, ...[visible, unknown].filter(shape => shape.length)) : []
  };
  return Object.entries(disjoint).filter(([, coordinates]) => coordinates.length).map(([state, coordinates]) => ({
    type: 'Feature', properties: { state }, geometry: { type: 'MultiPolygon', coordinates }
  }));
}
