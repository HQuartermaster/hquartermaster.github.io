export const earth_radius = 6371000;
export const feet_to_meters = 0.3048;
const degrees_to_radians = Math.PI / 180;
const radians_to_degrees = 180 / Math.PI;

export function destinationPoint(origin, bearing, distance) {
  const angular_distance = distance / earth_radius;
  const latitude = origin[1] * degrees_to_radians;
  const heading = bearing * degrees_to_radians;
  const next_latitude = Math.asin(Math.sin(latitude) * Math.cos(angular_distance) + Math.cos(latitude) * Math.sin(angular_distance) * Math.cos(heading));
  const next_longitude = origin[0] * degrees_to_radians + Math.atan2(Math.sin(heading) * Math.sin(angular_distance) * Math.cos(latitude), Math.cos(angular_distance) - Math.sin(latitude) * Math.sin(next_latitude));
  return [((next_longitude * radians_to_degrees + 540) % 360) - 180, next_latitude * radians_to_degrees];
}

export function surfaceDistance(start, end) {
  const delta_latitude = (end[1] - start[1]) * degrees_to_radians;
  const delta_longitude = (end[0] - start[0]) * degrees_to_radians;
  const haversine = Math.sin(delta_latitude / 2) ** 2 + Math.cos(start[1] * degrees_to_radians) * Math.cos(end[1] * degrees_to_radians) * Math.sin(delta_longitude / 2) ** 2;
  return 2 * earth_radius * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export function initialBearing(start, end) {
  const delta_longitude = (end[0] - start[0]) * degrees_to_radians;
  const first_latitude = start[1] * degrees_to_radians;
  const last_latitude = end[1] * degrees_to_radians;
  return (Math.atan2(Math.sin(delta_longitude) * Math.cos(last_latitude), Math.cos(first_latitude) * Math.sin(last_latitude) - Math.sin(first_latitude) * Math.cos(last_latitude) * Math.cos(delta_longitude)) * radians_to_degrees + 360) % 360;
}

export function withinSector(bearing, heading, coverage) {
  return Math.abs(((bearing - heading + 540) % 360) - 180) <= coverage / 2;
}

export function toCartesian(position, altitude) {
  const latitude = position[1] * degrees_to_radians;
  const longitude = position[0] * degrees_to_radians;
  const radius = earth_radius + altitude;
  return [radius * Math.cos(latitude) * Math.cos(longitude), radius * Math.cos(latitude) * Math.sin(longitude), radius * Math.sin(latitude)];
}

export function slantDistance(start, start_altitude, end, end_altitude) {
  const first_point = toCartesian(start, start_altitude);
  const last_point = toCartesian(end, end_altitude);
  return Math.hypot(...first_point.map((value, index) => value - last_point[index]));
}

// Test the actual Earth-centred chord against terrain, including Earth curvature.
// null terrain means missing data: callers must report unknown rather than clear.
export function traceVisibility(start, start_altitude, end, end_altitude, getElevation) {
  const first_elevation = getElevation(start);
  const last_elevation = getElevation(end);
  if (first_elevation == null || last_elevation == null) return {state: 'UNKNOWN', reason: 'Elevation data unavailable'};
  if (start_altitude <= first_elevation || end_altitude <= last_elevation) return {state: 'LOST', reason: 'Aircraft at or below ground'};
  const first_point = toCartesian(start, start_altitude);
  const last_point = toCartesian(end, end_altitude);
  const sample_count = Math.max(2, Math.ceil(surfaceDistance(start, end) / 2000));
  let missing_data = false;
  for (let sample_index = 1; sample_index < sample_count; sample_index++) {
    const fraction = sample_index / sample_count;
    const point = first_point.map((value, index) => value + fraction * (last_point[index] - value));
    const radius = Math.hypot(...point);
    const chord_altitude = radius - earth_radius;
    const location = [Math.atan2(point[1], point[0]) * radians_to_degrees, Math.asin(point[2] / radius) * radians_to_degrees];
    const ground_altitude = getElevation(location);
    if (ground_altitude == null) { missing_data = true; continue; }
    if (chord_altitude <= ground_altitude) return {state: 'LOST', reason: ground_altitude > 100 ? 'Terrain masks line of sight' : 'Earth / terrain blocks line of sight'};
  }
  return missing_data ? {state: 'UNKNOWN', reason: 'Elevation data incomplete'} : {state: 'VISIBLE', reason: 'Clear line of sight'};
}

export function classifyTarget(aircraft, target, getElevation) {
  const distance = slantDistance(aircraft.position, aircraft.altitude * feet_to_meters, target.position, target.altitude * feet_to_meters) / 1000;
  if (distance > aircraft.data.instrument_range) return {state: 'LOST', reason: 'Beyond instrument range', distance};
  if (!withinSector(initialBearing(aircraft.position, target.position), aircraft.heading, aircraft.data.coverage)) return {state: 'LOST', reason: 'Outside field of view', distance};
  const visibility = traceVisibility(aircraft.position, aircraft.altitude * feet_to_meters, target.position, target.altitude * feet_to_meters, getElevation);
  if (visibility.state !== 'VISIBLE') return {...visibility, distance};
  try {
    const state = aircraft.detect(distance, target.data.rcs);
    if (!['LOST', 'DETECT', 'LOCK'].includes(state)) throw new Error('Invalid curve result');
    return {state, reason: state === 'LOST' ? 'Below illustrative detection threshold' : 'Line of sight + illustrative curve', distance};
  } catch { return {state: 'UNKNOWN', reason: 'Invalid detection curve', distance}; }
}
