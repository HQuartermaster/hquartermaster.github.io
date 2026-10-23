function containsPoint(point, ring) {
  let inside = false;
  for (let first_index = 0, last_index = ring.length - 1; first_index < ring.length; last_index = first_index++) {
    const first_point = ring[first_index]; const last_point = ring[last_index];
    if ((first_point[1] > point[1]) !== (last_point[1] > point[1]) && point[0] < (last_point[0] - first_point[0]) * (point[1] - first_point[1]) / (last_point[1] - first_point[1]) + first_point[0]) inside = !inside;
  }
  return inside;
}

// Keep a country name inside each visible country even when its capital/centre is offscreen.
export function updateCountryLabels(map, countries, original_labels) {
  if (!map.getSource('country_labels')) return;
  if (map.getZoom() < 4.5) { map.getSource('country_labels').setData(original_labels); return; }
  const width = map.getCanvas().clientWidth;
  const height = map.getCanvas().clientHeight;
  const samples = [];
  for (let column = 1; column < 18; column++) {
    for (let row = 2; row < 13; row++) {
      const screen_point = [column * width / 18, row * height / 14];
      const coordinate = map.unproject(screen_point).wrap();
      samples.push({position: [coordinate.lng, coordinate.lat], screen_point});
    }
  }
  const features = [];
  for (const country of countries.features) {
    const polygons = country.geometry.type === 'Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
    const visible_samples = samples.filter(sample => polygons.some(polygon => containsPoint(sample.position, polygon[0]) && !polygon.slice(1).some(ring => containsPoint(sample.position, ring))));
    if (!visible_samples.length) continue;
    const center = visible_samples.reduce((total, sample) => [total[0] + sample.screen_point[0] / visible_samples.length, total[1] + sample.screen_point[1] / visible_samples.length], [0, 0]);
    visible_samples.sort((first, last) => Math.hypot(first.screen_point[0] - center[0], first.screen_point[1] - center[1]) - Math.hypot(last.screen_point[0] - center[0], last.screen_point[1] - center[1]));
    features.push({type: 'Feature', properties: {name: country.properties.NAME_EN.normalize('NFKD').replace(/[^\x20-\x7E]/g, '')}, geometry: {type: 'Point', coordinates: visible_samples[0].position}});
  }
  map.getSource('country_labels').setData({type: 'FeatureCollection', features});
}
