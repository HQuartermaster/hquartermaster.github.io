// Scenario files contain catalogue references and placement data, never executable curves.
export function validateScenario(value, awacs_catalog, target_catalog) {
  if (!value || !Array.isArray(value.aircraft)) throw new Error('Scenario must contain an aircraft array.');
  if (value.version != null && value.version !== 1 && value.version !== 2) throw new Error('Unsupported scenario version.');
  if (value.aircraft.length > 500) throw new Error('Scenarios support up to 500 aircraft.');
  const inRange = (number, min, max) => Number.isFinite(number) && number >= min && number <= max;
  const aircraft = value.aircraft.map((item, index) => {
    const fail = message => { throw new Error(`Aircraft ${index + 1}: ${message}`); };
    if (!item || !['awacs', 'target'].includes(item.type)) fail('invalid type.');
    const catalog = item.type === 'awacs' ? awacs_catalog : target_catalog;
    if (!catalog.some(entry => entry.name === item.name)) fail('unknown catalogue name.');
    if (!Array.isArray(item.position) || item.position.length !== 2 || !inRange(item.position[0], -180, 180) || !inRange(item.position[1], -84, 84)) fail('invalid position.');
    if (!inRange(item.altitude, item.type === 'awacs' ? 3000 : 0, 60000)) fail('invalid altitude.');
    if (!inRange(item.heading, 0, 359)) fail('invalid heading.');
    return { name: item.name, type: item.type, position: [...item.position], altitude: item.altitude, heading: item.heading };
  });
  const overlay_altitude = value.overlay_altitude ?? 26000;
  if (!inRange(overlay_altitude, 0, 60000)) throw new Error('Invalid overlay altitude.');
  if (value.show_coverage != null && typeof value.show_coverage !== 'boolean') throw new Error('Invalid coverage setting.');
  if (value.show_sight_lines != null && typeof value.show_sight_lines !== 'boolean') throw new Error('Invalid line-of-sight setting.');
  let view;
  if (value.view != null) {
    const v = value.view;
    if (!Array.isArray(v.center) || v.center.length !== 2 || !inRange(v.center[0], -180, 180) || !inRange(v.center[1], -84, 84) || !inRange(v.zoom, 2, 13) || !inRange(v.pitch, 0, 70) || !inRange(v.bearing, -180, 180) || typeof v.is_3d !== 'boolean') throw new Error('Invalid map view.');
    view = { center: [...v.center], zoom: v.zoom, pitch: v.pitch, bearing: v.bearing, is_3d: v.is_3d };
  }
  return { version: 2, aircraft, overlay_altitude, show_coverage: value.show_coverage ?? true, show_sight_lines: value.show_sight_lines ?? true, ...(view ? { view } : {}) };
}
