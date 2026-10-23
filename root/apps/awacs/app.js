import { destinationPoint, initialBearing, feet_to_meters, traceVisibility, classifyTarget } from './geometry.js';
import { ensureTerrain, getElevation } from './terrain.js';
import { updateCountryLabels } from './labels.js';

const byId = id => document.getElementById(id);
const formatNumber = value => Math.round(value).toLocaleString('en-US');
let awacs_catalog = [];
let target_catalog = [];
let placed_awacs = null;
let placed_targets = [];
let selected_aircraft = null;
let pending_placement = null;
let picker_type = 'awacs';
let previous_focus = null;
let map = null;
let projection_matrix = null;
let update_timer = null;
let update_revision = 0;
let is_3d = true;
let drag_state = null;
const storage_key = 'awacs-atlas-v1';

function setStatus(message) { byId('status').textContent = message; }
function getAircraft() { return [...(placed_awacs ? [placed_awacs] : []), ...placed_targets]; }
function flagUrl(country) { return `https://flagcdn.com/w80/${country.toLowerCase()}.png`; }

function createOption(data, type) {
	const button = document.createElement('button');
	button.className = 'aircraft-option';
	const flag = document.createElement('img');
	flag.className = 'flag'; flag.src = flagUrl(data.country); flag.alt = data.country;
	flag.addEventListener('error', () => { flag.hidden = true; }, { once: true });
	const text = document.createElement('span'); text.className = 'option-text';
	const name = document.createElement('strong'); name.textContent = data.name;
	const detail = document.createElement('small');
	detail.textContent = type === 'awacs' ? `${data.airframe} · ${formatNumber(data.instrument_range)} km · ${data.coverage}°` : 'Radar cross section';
	text.append(name, detail); button.append(flag, text);
	const icon = document.createElement('span'); icon.className = 'option-icon';
	const image = document.createElement('img'); image.src = data.icon; image.alt = '';
	icon.append(image);
	if (type === 'target') { const rcs = document.createElement('small'); rcs.textContent = `${data.rcs} m²`; icon.append(rcs); }
	button.append(icon);
	button.addEventListener('click', () => beginPlacement(data, type));
	return button;
}

function renderCatalog() {
	const search_term = byId('catalog-search').value.toLowerCase();
	const filtered_catalog = awacs_catalog.filter(data => `${data.name} ${data.airframe} ${data.country}`.toLowerCase().includes(search_term));
	byId('catalog').replaceChildren(...filtered_catalog.map(data => createOption(data, 'awacs')));
	byId('catalog-count').textContent = awacs_catalog.length;
	if (!filtered_catalog.length) byId('catalog').innerHTML = '<p class="empty">No matching aircraft.</p>';
}

function renderPicker() {
	const search_term = byId('picker-search').value.toLowerCase();
	const catalog = picker_type === 'awacs' ? awacs_catalog : target_catalog;
	const results = catalog.filter(data => `${data.name} ${data.airframe || ''} ${data.country}`.toLowerCase().includes(search_term));
	byId('picker-list').replaceChildren(...results.map(data => createOption(data, picker_type)));
	if (!results.length) byId('picker-list').innerHTML = '<p class="empty">No matching aircraft.</p>';
}

function openPicker(type) {
	previous_focus = document.activeElement;
	picker_type = type;
	byId('picker-title').textContent = type === 'awacs' ? 'Place AWACS' : 'Place Target';
	byId('picker-search').value = '';
	renderPicker(); byId('picker').showModal(); byId('picker-search').focus();
}

function beginPlacement(data, type) {
	byId('picker').close();
	pending_placement = { data, type };
	byId('placement-hint').textContent = `Click the map to place ${data.name}${type === 'awacs' && placed_awacs ? ' (replaces current AWACS)' : ''} · Esc to cancel`;
	byId('placement-hint').hidden = false;
	byId('map-shell').classList.add('placing');
}

function cancelPlacement() {
	pending_placement = null; byId('placement-hint').hidden = true;
	byId('map-shell').classList.remove('placing');
}

function makeAircraft(data, type, position, altitude = 30000, heading = 45) {
	const aircraft = { data, type, position, altitude, heading, result: { state: 'UNKNOWN', reason: 'Loading elevation' } };
	if (type === 'awacs') {
		// Detection functions come only from the locally maintained, trusted catalogue.
		try { aircraft.detect = new Function(`"use strict"; return (${data.detection_curve});`)(); }
		catch { aircraft.detect = () => { throw new Error('Invalid detection curve'); }; }
	}
	const element = document.createElement('button'); element.className = 'aircraft-marker';
	const image = document.createElement('img'); image.src = data.icon; image.alt = '';
	const label = document.createElement('span'); label.className = 'marker-label';
	element.append(image, label); aircraft.element = element;
	element.setAttribute('aria-label', `Select ${data.name}`);
	element.addEventListener('click', event => { event.stopPropagation(); if (!drag_state?.moved) selectAircraft(aircraft); });
	element.addEventListener('pointerdown', event => startDrag(event, aircraft));
	byId('aircraft-overlay').append(element);
	return aircraft;
}

function placeAircraft(data, type, position, altitude, heading) {
	if (type === 'awacs') {
		if (placed_awacs) placed_awacs.element.remove();
		placed_awacs = makeAircraft(data, type, position, altitude, heading);
		selectAircraft(placed_awacs);
	} else {
		const aircraft = makeAircraft(data, type, position, altitude || 15000, heading);
		placed_targets.push(aircraft); selectAircraft(aircraft);
	}
	saveScenario(); scheduleUpdate(); map.triggerRepaint();
}

function selectAircraft(aircraft) {
	selected_aircraft = aircraft;
	for (const item of getAircraft()) item.element.classList.toggle('selected', item === aircraft);
	renderInspector();
}

function renderInspector() {
	const aircraft = selected_aircraft;
	if (!aircraft) {
		byId('inspector').innerHTML = '<div class="inspector-card"><p class="eyebrow">BUILD A SCENARIO</p><h2>No AWACS placed!</h2><p class="data-note">Place one AWACS and multiple targets. Select an aircraft to adjust altitude and heading.</p></div>';
		return;
	}
	byId('inspector').innerHTML = `<section class="inspector-card"><div class="inspector-title"><div><p class="eyebrow">${aircraft.type === 'awacs' ? 'AWACS / SELECTED' : 'TARGET / SELECTED'}</p><h2 id="selected-name"></h2></div><button id="delete-aircraft" class="close" aria-label="Delete selected aircraft" title="Delete aircraft">×</button></div><label for="aircraft-altitude">Altitude above sea level<output id="altitude-value"></output></label><input id="aircraft-altitude" type="range" min="${aircraft.type === 'awacs' ? 3000 : 0}" max="60000" step="500"><div class="range-ends"><span>${aircraft.type === 'awacs' ? '3,000' : '0'} ft</span><span>60,000 ft</span></div>${aircraft.type === 'awacs' ? '<label for="aircraft-heading">Heading · clockwise from north<output id="heading-value"></output></label><input id="aircraft-heading" type="range" min="0" max="359" step="1"><div class="range-ends"><span>000° N</span><span>359° N</span></div>' : ''}<div id="aircraft-stats" class="stats"></div><div id="aircraft-result" class="result"></div></section>`;
	byId('selected-name').textContent = aircraft.data.name;
	byId('aircraft-altitude').value = aircraft.altitude;
	byId('aircraft-altitude').oninput = event => {
		aircraft.altitude = Number(event.target.value); updateInspectorValues();
		updateMarkerStates(); map.triggerRepaint(); saveScenario(); scheduleUpdate();
	};
	if (aircraft.type === 'awacs') {
		byId('aircraft-heading').value = aircraft.heading;
		byId('aircraft-heading').oninput = event => {
			aircraft.heading = Number(event.target.value); updateInspectorValues();
			updateMarkerStates(); map.triggerRepaint(); saveScenario(); scheduleUpdate();
		};
	}
	byId('delete-aircraft').onclick = () => {
		aircraft.element.remove();
		if (aircraft.type === 'awacs') placed_awacs = null;
		else placed_targets = placed_targets.filter(item => item !== aircraft);
		selectAircraft(null); saveScenario(); scheduleUpdate(); map.triggerRepaint();
	};
	updateInspectorValues();
}

function updateInspectorValues() {
	const aircraft = selected_aircraft;
	if (!aircraft || !byId('altitude-value')) return;
	byId('altitude-value').textContent = `${formatNumber(aircraft.altitude)} ft ASL`;
	const ground_altitude = getElevation(aircraft.position);
	const clearance = ground_altitude == null ? 'Unknown' : `${formatNumber(aircraft.altitude - ground_altitude / feet_to_meters)} ft`;
	const stats = byId('aircraft-stats'); stats.replaceChildren();
	const entries = [['Ground clearance', clearance], ['Position', `${aircraft.position[1].toFixed(2)}°, ${aircraft.position[0].toFixed(2)}°`]];
	if (aircraft.type === 'awacs') {
		byId('heading-value').textContent = `${String(aircraft.heading).padStart(3, '0')}°`;
		entries.push(['Instrument range', `${aircraft.data.instrument_range} km`], ['Field of view', `${aircraft.data.coverage}°`], ['Airframe range', `${formatNumber(aircraft.data.airframe_range)} km`]);
	} else entries.push(['RCS (illustrative)', `${aircraft.data.rcs} m²`], ['Slant distance', aircraft.result.distance == null ? '—' : `${aircraft.result.distance.toFixed(1)} km`]);
	for (const [label, value] of entries) {
		const span = document.createElement('span'); span.textContent = label;
		const strong = document.createElement('strong'); strong.textContent = value;
		span.append(strong); stats.append(span);
	}
	const result = byId('aircraft-result');
	result.textContent = aircraft.type === 'awacs' ? (aircraft.data.coverage === 360 ? '360° radar: heading rotates the icon; coverage stays omnidirectional.' : 'The radar sector is centred on the aircraft heading.') : `${aircraft.result.state} · ${aircraft.result.reason}`;
	if (ground_altitude != null && aircraft.altitude * feet_to_meters <= ground_altitude) result.textContent = 'BELOW TERRAIN · Increase altitude or move the aircraft.';
}

function startDrag(event, aircraft) {
	if (event.button !== 0 || pending_placement) return;
	event.preventDefault(); event.stopPropagation();
	const ground_point = map.project(aircraft.position);
	const bounds = byId('map-shell').getBoundingClientRect();
	drag_state = { aircraft, moved: false, start_x: event.clientX, start_y: event.clientY, offset_x: event.clientX - bounds.left - ground_point.x, offset_y: event.clientY - bounds.top - ground_point.y };
	aircraft.element.setPointerCapture(event.pointerId); map.dragPan.disable(); selectAircraft(aircraft);
}

window.addEventListener('pointermove', event => {
	if (!drag_state) return;
	if (Math.hypot(event.clientX - drag_state.start_x, event.clientY - drag_state.start_y) < 3 && !drag_state.moved) return;
	drag_state.moved = true;
	const bounds = byId('map-shell').getBoundingClientRect();
	const position = map.unproject([event.clientX - bounds.left - drag_state.offset_x, event.clientY - bounds.top - drag_state.offset_y]);
	drag_state.aircraft.position = [((position.lng + 540) % 360) - 180, Math.max(-84, Math.min(84, position.lat))];
	updateInspectorValues(); updateMarkerStates(); map.triggerRepaint(); scheduleUpdate();
});
window.addEventListener('pointerup', () => {
	if (!drag_state) return;
	map.dragPan.enable(); saveScenario(); scheduleUpdate();
	setTimeout(() => { drag_state = null; }, 0);
});
window.addEventListener('pointercancel', () => { if (drag_state) { drag_state = null; map.dragPan.enable(); scheduleUpdate(); } });

// The map's Mercator projection matrix projects icons at their actual ASL height.
function renderAircraft() {
	if (!projection_matrix) return;
	const map_canvas = map.getCanvas();
	const width = map_canvas.clientWidth; const height = map_canvas.clientHeight;
	const tethers = [];
	const center_longitude = map.getCenter().lng;
	for (const aircraft of getAircraft()) {
		const longitude = aircraft.position[0] + 360 * Math.round((center_longitude - aircraft.position[0]) / 360);
		const point = maplibregl.MercatorCoordinate.fromLngLat([longitude, aircraft.position[1]], aircraft.altitude * feet_to_meters);
		const matrix = projection_matrix;
		const clip_x = matrix[0] * point.x + matrix[4] * point.y + matrix[8] * point.z + matrix[12];
		const clip_y = matrix[1] * point.x + matrix[5] * point.y + matrix[9] * point.z + matrix[13];
		const clip_w = matrix[3] * point.x + matrix[7] * point.y + matrix[11] * point.z + matrix[15];
		const screen_x = (clip_x / clip_w + 1) * width / 2;
		const screen_y = (1 - clip_y / clip_w) * height / 2;
		const visible = clip_w > 0 && screen_x > -100 && screen_x < width + 100 && screen_y > -100 && screen_y < height + 100;
		aircraft.element.hidden = !visible;
		if (!visible) continue;
		aircraft.element.style.transform = `translate(${screen_x}px, ${screen_y}px)`;
		aircraft.element.querySelector('img').style.transform = `rotate(${aircraft.heading - map.getBearing()}deg)`;
		const ground_point = map.project([longitude, aircraft.position[1]]);
		if (is_3d) tethers.push(`<line x1="${screen_x}" y1="${screen_y}" x2="${ground_point.x}" y2="${ground_point.y}"/>`);
	}
	byId('tethers').innerHTML = tethers.join('');
}

function updateMarkerStates() {
	for (const target of placed_targets) {
		target.result = placed_awacs ? classifyTarget(placed_awacs, target, getElevation) : { state: 'LOST', reason: 'No AWACS placed' };
		target.element.dataset.state = target.result.state;
		target.element.title = `${target.data.name}: ${target.result.state} — ${target.result.reason}`;
		target.element.querySelector('.marker-label').textContent = `${target.data.name} · ${target.result.state}`;
	}
	if (placed_awacs) placed_awacs.element.querySelector('.marker-label').textContent = `${placed_awacs.data.name} · ${formatNumber(placed_awacs.altitude)} ft`;
	for (const aircraft of getAircraft()) {
		const ground_altitude = getElevation(aircraft.position);
		if (ground_altitude != null && aircraft.altitude * feet_to_meters < ground_altitude) {
			const warning = document.createElement('span');
			warning.className = 'below-ground-warning';
			warning.textContent = 'Aircraft below ground level';
			aircraft.element.querySelector('.marker-label').append(warning);
		}
	}
	const detected_count = placed_targets.filter(target => ['DETECT', 'LOCK'].includes(target.result.state)).length;
	byId('track-count').textContent = `${placed_targets.length} TARGETS ON MAP · ${detected_count} DETECTED`;
	updateInspectorValues();
}

function scheduleUpdate() {
	update_revision++; clearTimeout(update_timer);
	// Clear stale coverage immediately while a newer terrain calculation is pending.
	map?.getSource('coverage')?.setData({ type: 'FeatureCollection', features: [] });
	updateMarkerStates(); update_timer = setTimeout(updateCoverage, 250);
}

function unwrapPoint(position, center) {
	return [position[0] + 360 * Math.round((center - position[0]) / 360), position[1]];
}

async function updateCoverage() {
	const revision = update_revision;
	const aircraft = placed_awacs;
	const empty_data = { type: 'FeatureCollection', features: [] };
	if (!aircraft) {
		map.getSource('coverage').setData(empty_data); map.getSource('range').setData(empty_data);
		updateMarkerStates(); setStatus('Place an AWACS to explore visibility.'); return;
	}
	const position = [...aircraft.position];
	const altitude = aircraft.altitude * feet_to_meters;
	const range = aircraft.data.instrument_range * 1000;
	const heading = aircraft.heading;
	const coverage = aircraft.data.coverage;
	const reference_altitude = Number(byId('overlay-altitude').value) * feet_to_meters;
	const radial_count = Math.ceil(range / 10000);
	const radial_step = range / radial_count;
	const bearings = Array.from({ length: 121 }, (_, index) => heading - coverage / 2 + index * coverage / 120);
	const grid = bearings.map(bearing => Array.from({ length: radial_count + 1 }, (_, index) => destinationPoint(position, bearing, index * radial_step)));
	const range_ring = [position, ...grid.map(row => row.at(-1)), position].map(point => unwrapPoint(point, position[0]));
	map.getSource('range').setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: range_ring } });
	const terrain_positions = [...grid.flat(), ...placed_targets.map(target => target.position)];
	for (const target of placed_targets) {
		const distance = Math.min(2000000, maplibregl.LngLat.convert(position).distanceTo(maplibregl.LngLat.convert(target.position)));
		const bearing = initialBearing(position, target.position);
		for (let offset = 0; offset < distance; offset += 10000) terrain_positions.push(destinationPoint(position, bearing, offset));
	}
	setStatus('Sampling terrain & calculating line of sight…');
	await ensureTerrain(terrain_positions);
	if (revision !== update_revision) return;
	updateMarkerStates();
	if (!byId('show-coverage').checked) { setStatus('Coverage overlay hidden · target detection active'); return; }
	const features = [];
	let unknown_count = 0;
	for (let bearing_index = 0; bearing_index < bearings.length - 1; bearing_index++) {
		for (let radial_index = 0; radial_index < radial_count; radial_index++) {
			const distance = (radial_index + 0.5) * radial_step;
			const bearing = (bearings[bearing_index] + bearings[bearing_index + 1]) / 2;
			const sample_position = destinationPoint(position, bearing, distance);
			const visibility = traceVisibility(position, altitude, sample_position, reference_altitude, getElevation);
			if (visibility.state === 'UNKNOWN') unknown_count++;
			const coordinates = [grid[bearing_index][radial_index], grid[bearing_index + 1][radial_index], grid[bearing_index + 1][radial_index + 1], grid[bearing_index][radial_index + 1], grid[bearing_index][radial_index]].map(point => unwrapPoint(point, position[0]));
			features.push({ type: 'Feature', properties: { state: visibility.state }, geometry: { type: 'Polygon', coordinates: [coordinates] } });
		}
		if (bearing_index % 8 === 0) {
			await new Promise(resolve => setTimeout(resolve, 0));
			if (revision !== update_revision) return;
		}
	}
	if (revision !== update_revision) return;
	map.getSource('coverage').setData({ type: 'FeatureCollection', features });
	setStatus(unknown_count ? `${unknown_count} coverage cells unknown · elevation unavailable (grey)` : `Terrain sampled · visibility at ${formatNumber(reference_altitude / feet_to_meters)} ft ASL`);
}

function saveScenario() {
	function serializeAircraft(aircraft) { return { name: aircraft.data.name, type: aircraft.type, position: aircraft.position, altitude: aircraft.altitude, heading: aircraft.heading }; }
	try { localStorage.setItem(storage_key, JSON.stringify({ aircraft: getAircraft().map(serializeAircraft), overlay_altitude: Number(byId('overlay-altitude').value) })); } catch { /* Storage may be disabled by browser privacy settings. */ }
}

function restoreScenario() {
	try {
		const saved_state = JSON.parse(localStorage.getItem(storage_key));
		if (!saved_state || !Array.isArray(saved_state.aircraft)) return;
		for (const saved_aircraft of saved_state.aircraft.slice(0, 101)) {
			const catalog = saved_aircraft.type === 'awacs' ? awacs_catalog : target_catalog;
			const data = catalog.find(item => item.name === saved_aircraft.name);
			if (!data || !Array.isArray(saved_aircraft.position) || saved_aircraft.position.length !== 2 || !saved_aircraft.position.every(Number.isFinite) || Math.abs(saved_aircraft.position[1]) > 84) continue;
			const altitude = Math.max(saved_aircraft.type === 'awacs' ? 3000 : 0, Math.min(60000, Number(saved_aircraft.altitude) || 15000));
			if (saved_aircraft.type === 'awacs' && placed_awacs) continue;
			const aircraft = makeAircraft(data, saved_aircraft.type, saved_aircraft.position, altitude, ((Number(saved_aircraft.heading) || 0) % 360 + 360) % 360);
			if (saved_aircraft.type === 'awacs') placed_awacs = aircraft;
			else placed_targets.push(aircraft);
		}
		byId('overlay-altitude').value = Math.max(0, Math.min(60000, Number(saved_state.overlay_altitude) || 3000));
		byId('overlay-value').textContent = `${formatNumber(byId('overlay-altitude').value)} ft ASL`;
	} catch { /* Ignore invalid or outdated local scenarios. */ }
}

function setView(terrain_view) {
	is_3d = terrain_view;
	// Keep the DEM enabled in both views: switching camera pitch must not change calculations.
	map.easeTo({ pitch: terrain_view ? 55 : 0, bearing: 0, duration: 650 });
	byId('terrain-button').classList.toggle('active', terrain_view);
	byId('flat-button').classList.toggle('active', !terrain_view);
	byId('terrain-button').setAttribute('aria-pressed', String(terrain_view));
	byId('flat-button').setAttribute('aria-pressed', String(!terrain_view));
}

async function initializeAtlas() {
	try {
		const responses = await Promise.all([fetch('./awacs.json'), fetch('./targets.json'), fetch('./data/countries.geojson'), fetch('./data/country-labels.geojson')]);
		if (responses.some(response => !response.ok)) throw new Error('Catalogue could not be loaded');
		const [awacs_data, target_data, country_data, country_labels] = await Promise.all(responses.map(response => response.json()));
		awacs_catalog = awacs_data; target_catalog = target_data;
		if (!window.maplibregl) throw new Error('Map library unavailable. Check your internet connection.');
		const elevation_source = { type: 'raster-dem', tiles: [new URL('./data/terrain/{z}/{x}/{y}.png', location.href).href.replaceAll('%7B', '{').replaceAll('%7D', '}')], encoding: 'terrarium', tileSize: 256, maxzoom: 5, attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Mapzen terrain</a>' };
		map = new maplibregl.Map({
			container: 'map', center: [78.7, 30.5], zoom: 6.3, pitch: 55, maxPitch: 70, minZoom: 2, maxZoom: 13, renderWorldCopies: true, attributionControl: true, style: {
				version: 8, glyphs: new URL('./data/fonts/{fontstack}/{range}.pbf', location.href).href.replaceAll('%7B', '{').replaceAll('%7D', '}'), sources: {
					countries: { type: 'geojson', data: country_data, attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>' },
					country_labels: { type: 'geojson', data: country_labels },
					elevation: elevation_source,
					hillshade_elevation: { ...elevation_source, attribution: '' }
				}, layers: [
					{ id: 'ocean', type: 'background', paint: { 'background-color': '#152b35' } },
					{ id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': '#354a48' } },
					{ id: 'relief', type: 'hillshade', source: 'hillshade_elevation', paint: { 'hillshade-exaggeration': 0.65, 'hillshade-shadow-color': '#0a151f', 'hillshade-highlight-color': '#bdcbb6', 'hillshade-accent-color': '#55756b' } },
					{ id: 'border-casing', type: 'line', source: 'countries', paint: { 'line-color': '#10202a', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2, 8, 4], 'line-opacity': 0.9 } },
					{ id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': '#d3d1b0', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.65, 8, 1.5], 'line-opacity': 0.95 } },
					{ id: 'country-labels', type: 'symbol', source: 'country_labels', layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 14], 'text-letter-spacing': 0.12, 'text-max-width': 9, 'text-padding': 12 }, paint: { 'text-color': '#e4e5cc', 'text-halo-color': '#14262e', 'text-halo-width': 2 } }
				], terrain: { source: 'elevation', exaggeration: 1 }
			}
		});
		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
		let map_error_count = 0;
		map.on('error', () => { if (++map_error_count === 3) setStatus('Some map tiles failed to load. Check your connection; missing elevation remains unknown.'); });
		map.on('load', () => {
			for (const source_id of ['coverage', 'range']) map.addSource(source_id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
			map.addLayer({ id: 'coverage-fill', type: 'fill', source: 'coverage', paint: { 'fill-color': ['match', ['get', 'state'], 'VISIBLE', '#66c596', 'LOST', '#a782bf', '#92999f'], 'fill-opacity': ['match', ['get', 'state'], 'VISIBLE', 0.24, 'LOST', 0.30, 0.20], 'fill-antialias': false } }, 'border-casing');
			map.addLayer({ id: 'range-line', type: 'line', source: 'range', paint: { 'line-color': '#c3e1bd', 'line-width': 1.4, 'line-dasharray': [4, 4], 'line-opacity': 0.85 } });
			map.addLayer({ id: 'aircraft-projection', type: 'custom', renderingMode: '3d', render(context, args) { projection_matrix = args.defaultProjectionData.mainMatrix; renderAircraft(); } });
			restoreScenario(); renderCatalog(); renderInspector(); scheduleUpdate();
			updateCountryLabels(map, country_data, country_labels);
		});
		map.on('moveend', () => updateCountryLabels(map, country_data, country_labels));
		map.on('click', event => {
			if (!pending_placement || drag_state) return;
			const { data, type } = pending_placement;
			placeAircraft(data, type, [((event.lngLat.lng + 540) % 360) - 180, Math.max(-84, Math.min(84, event.lngLat.lat))]); cancelPlacement();
		});
		map.on('mousemove', event => { byId('coordinates').textContent = `${Math.abs(event.lngLat.lat).toFixed(2)}° ${event.lngLat.lat >= 0 ? 'N' : 'S'} / ${Math.abs(event.lngLat.wrap().lng).toFixed(2)}° ${event.lngLat.wrap().lng >= 0 ? 'E' : 'W'}`; });
		byId('catalog-search').oninput = renderCatalog;
		byId('picker-search').oninput = renderPicker;
		byId('place-awacs').onclick = () => openPicker('awacs');
		byId('place-target').onclick = () => openPicker('target');
		byId('close-picker').onclick = () => byId('picker').close();
		byId('picker').addEventListener('close', () => previous_focus?.focus());
		byId('about-button').onclick = byId('notes-link').onclick = () => byId('notes').showModal();
		byId('close-notes').onclick = () => byId('notes').close();
		byId('terrain-button').onclick = () => setView(true);
		byId('flat-button').onclick = () => setView(false);
		byId('home-button').onclick = () => map.flyTo({ center: placed_awacs?.position || [78.7, 30.5], zoom: 6.3, pitch: is_3d ? 55 : 0, bearing: 0 });
		byId('show-coverage').onchange = scheduleUpdate;
		byId('overlay-altitude').oninput = event => { byId('overlay-value').textContent = `${formatNumber(event.target.value)} ft ASL`; saveScenario(); scheduleUpdate(); };
		document.addEventListener('keydown', event => { if (event.key === 'Escape') cancelPlacement(); });
		window.addEventListener('online', () => scheduleUpdate());
	} catch (error) {
		setStatus(error.message); byId('placement-hint').hidden = false;
		byId('placement-hint').textContent = `${error.message} Serve this folder through HTTP/HTTPS, not file://.`;
	}
}

initializeAtlas();
