/* D3 handles spherical circles, antimeridian splitting, and projection clipping. */
const earth_radius_km = 6371.0088;
const map_container = document.querySelector('#map-container');
const map_svg = d3.select('#world-map');
const map_layer = map_svg.append('g');

const ocean_path = map_layer.append('path').datum({ type: 'Sphere' }).attr('class', 'ocean');
const grid_path = map_layer.append('path').datum(d3.geoGraticule10()).attr('class', 'graticule');

const land_layer = map_layer.append('g');
const range_layer = map_layer.append('g');
const marker_layer = map_layer.append('g');

const missile_list = document.querySelector('#missile-list');

const search_input = document.querySelector('#missile-search');

const status_element = document.querySelector('#status');
const number_format = new Intl.NumberFormat('en-US');

const platform_icons = {
	"ssbn": './icons/ssbn.png',
	"tel": './icons/tel.png',
	"silo": './icons/silo.png'
};

let missiles = [];
let selected_missile = null;
let placements = [];
let projection_mode = 'mercator';
let map_projection;
let map_path;
let map_width = 0;
let map_height = 0;
let zoom_level = 1;
let map_offset = [0, 0];
let globe_rotation = [-15, -15, 0];
let drag_origin = null;
let drag_moved = false;
let world_ready = false;

function setStatus(message) { status_element.textContent = message; }

function createText(tag, class_name, content) {
	const element = document.createElement(tag);
	element.className = class_name;
	element.textContent = content;
	return element;
}

function validateMissiles(data) {
	const entries = Array.isArray(data) ? data : data?.missiles;
	if (!Array.isArray(entries) || !entries.length) throw new Error('JSON must contain a nonempty array or an object with a missiles array.');
	return entries.map((entry, entry_index) => {
		const prefix = `Entry ${entry_index + 1}: `;
		if (!entry || typeof entry !== 'object') throw new Error(prefix + 'expected a missile object.');
		for (const field of ['name', 'country', 'launch_platform']) {
			if (typeof entry[field] !== 'string' || !entry[field].trim()) throw new Error(prefix + `${field} must be a nonempty string.`);
		}
		if (!Number.isFinite(entry.range) || entry.range <= 0 || entry.range >= Math.PI * earth_radius_km) throw new Error(prefix + 'range must be greater than 0 and less than 20,015 km.');
		if (!Number.isFinite(entry.warhead_kt) || entry.warhead_kt < 0) throw new Error(prefix + 'warhead_kt must be a nonnegative number.');
		if (typeof entry.MIRV !== 'boolean') throw new Error(prefix + 'MIRV must be true or false.');
		if (!Number.isInteger(entry.n_MIRV) || entry.n_MIRV < 1 || (!entry.MIRV && entry.n_MIRV !== 1)) throw new Error(prefix + 'n_MIRV must be a positive integer; use 1 for a non-MIRV missile.');
		if (!['SILO', 'TEL', 'SSBN'].includes(entry.launch_platform)) throw new Error(prefix + 'launch_platform must be SILO, TEL, or SSBN.');
		if (entry.country_code && !/^[A-Za-z]{2}$/.test(entry.country_code)) throw new Error(prefix + 'country_code must be a two-letter ISO code.');
		return { ...entry };
	});
}

function getCountryCode(missile) {
	const country_codes = { 'United States': 'US', 'United Kingdom': 'GB', 'France': 'FR', 'India': 'IN', 'China': 'CN', 'Russia': 'RU', 'Pakistan': 'PK', 'North Korea': 'KP', 'Israel': 'IL' };
	return (missile.country_code || country_codes[missile.country] || '').toLowerCase();
}

function renderList() {
	const query = search_input.value.trim().toLowerCase();
	const filtered_missiles = missiles.filter(missile => `${missile.name} ${missile.country}`.toLowerCase().includes(query));
	missile_list.replaceChildren();
	document.querySelector('#missile-count').textContent = missiles.length;
	for (const missile of filtered_missiles) {
		const option = document.createElement('button');
		option.className = 'missile-option';
		option.type = 'button';
		option.setAttribute('role', 'option');
		option.setAttribute('aria-selected', String(missile === selected_missile));
		const flag = createText('span', 'flag', '⚑');
		const country_code = getCountryCode(missile);
		if (country_code) {
			const flag_image = document.createElement('img');
			flag_image.src = `https://flagcdn.com/w40/${country_code}.png`;
			flag_image.alt = missile.country + ' flag';
			flag_image.addEventListener('error', () => { flag.textContent = '⚑'; });
			flag.replaceChildren(flag_image);
		}
		const names = document.createElement('span');
		names.append(createText('span', 'missile-name', missile.name), createText('span', 'missile-country', missile.country));
		const numbers = createText('span', 'missile-numbers', `${number_format.format(missile.range)} km`);
		numbers.append(createText('small', '', `(${number_format.format(missile.warhead_kt)} kt)`));
		option.append(flag, names, numbers);
		option.addEventListener('click', () => selectMissile(missile));
		missile_list.append(option);
	}
	if (!filtered_missiles.length) missile_list.append(createText('p', 'empty-state', 'No missiles match your search.'));
}

function selectMissile(missile) {
	selected_missile = missile;
	renderList();
	const details = document.querySelector('#selected-details');
	details.replaceChildren();
	const top = createText('div', 'detail-top', '');
	const name = document.createElement('div');
	name.append(createText('div', 'detail-label', 'SELECTED MISSILE'), createText('div', 'detail-name', missile.name));
	top.append(createText('span', 'detail-icon', missile.icon), name);
	const grid = createText('dl', 'detail-grid', '');
	const properties = [['RANGE', `${number_format.format(missile.range)} km`], ['WARHEAD / EACH', `${number_format.format(missile.warhead_kt)} kt`], ['PAYLOAD', missile.MIRV ? `${missile.n_MIRV} MIRVs` : 'Single warhead'], ['PLATFORM', missile.launch_platform]];
	for (const [label, value] of properties) {
		const pair = document.createElement('div');
		pair.append(createText('dt', '', label), createText('dd', '', value));
		grid.append(pair);
	}
	details.append(top, grid, createText('p', 'selected-tip', 'Click the map to place this missile. Each placement keeps its own missile and range.'));
}

function updateProjection() {
	map_width = map_container.clientWidth;
	map_height = map_container.clientHeight;
	map_svg.attr('viewBox', `0 0 ${map_width} ${map_height}`);
	if (projection_mode === 'globe') {
		map_projection = d3.geoOrthographic().rotate(globe_rotation).scale(Math.min(map_width, map_height) * .43 * zoom_level).translate([map_width / 2, map_height / 2]).clipAngle(90);
	} else {
		const base_scale = Math.min((map_width - 44) / (2 * Math.PI), (map_height - 70) / (2 * Math.PI));
		map_projection = d3.geoMercator().scale(base_scale * zoom_level).translate([map_width / 2 + map_offset[0], map_height / 2 + map_offset[1]]).clipExtent([[0, 0], [map_width, map_height]]);
	}
	map_path = d3.geoPath(map_projection);
	renderMap();
}

function renderMap() {
	ocean_path.attr('d', map_path);
	grid_path.attr('d', map_path);
	land_layer.selectAll('path').attr('d', map_path);
	range_layer.selectAll('path').data(placements).join('path').attr('class', 'range').attr('d', placement => map_path(placement.circle));

	const visible_placements = placements.filter(placement => projection_mode !== 'globe' || d3.geoDistance(placement.coordinates, map_projection.invert([map_width / 2, map_height / 2])) < Math.PI / 2);

	const markers = marker_layer.selectAll('g').data(visible_placements).join(enter => {
		const group = enter.append('g').attr('class', 'marker');
		group.append('circle').attr('class', 'launch-dot').attr('r', 4);
		group.append('image')
			.attr('class', 'platform-icon')
			.attr('width', 48)
			.attr('height', 48)
			.attr('x', -24)
			.attr('y', -54);
		group.append('title');
		return group;
	});
	markers.attr('transform', placement => `translate(${map_projection(placement.coordinates)})`);
	markers.select('title').text(placement => `${placement.missile.name} · ${number_format.format(placement.missile.range)} km`);
	markers.select('image').attr('href', placement => {
		const platform = placement.missile.launch_platform.toLowerCase();
		return platform_icons[platform];
	});
	document.querySelector('#placement-count').textContent = placements.length;
	document.querySelector('#clear-button').disabled = !placements.length;
	document.querySelector('#map-hint').hidden = placements.length > 0 || !world_ready;
}

function getMapCoordinates(event) {
	const point = d3.pointer(event, map_svg.node());
	const coordinates = map_projection.invert(point);
	if (!coordinates || !coordinates.every(Number.isFinite) || Math.abs(coordinates[1]) > 85.05113 && projection_mode === 'mercator') return null;
	if (projection_mode === 'globe' && Math.hypot(point[0] - map_width / 2, point[1] - map_height / 2) > map_projection.scale()) return null;
	if (projection_mode === 'mercator' && Math.abs(point[0] - map_projection.translate()[0]) > Math.PI * map_projection.scale()) return null;
	return coordinates;
}

function placeMissile(coordinates) {
	if (!selected_missile || !world_ready) return;
	const missile = { ...selected_missile };
	const circle = d3.geoCircle().center(coordinates).radius(missile.range / earth_radius_km * 180 / Math.PI).precision(.5)();
	placements.push({ coordinates, missile, circle });
	renderMap();
}

function switchProjection(mode) {
	projection_mode = mode;
	zoom_level = 1;
	map_offset = [0, 0];
	for (const item of ['mercator', 'globe']) document.querySelector(`#${item}-button`).setAttribute('aria-pressed', String(item === mode));
	document.querySelector('#projection-label').textContent = mode === 'globe' ? 'ORTHOGRAPHIC GLOBE' : 'MERCATOR PROJECTION';
	updateProjection();
}

function changeZoom(factor) {
	zoom_level = Math.max(.7, Math.min(6, zoom_level * factor));
	updateProjection();
}

map_svg.on('pointerdown', event => {
	if (event.button !== 0) return;
	drag_origin = { point: d3.pointer(event, map_svg.node()), offset: [...map_offset], rotation: [...globe_rotation] };
	drag_moved = false;
	map_svg.node().setPointerCapture(event.pointerId);
}).on('pointermove', event => {
	const point = d3.pointer(event, map_svg.node());
	if (drag_origin) {
		const delta_x = point[0] - drag_origin.point[0];
		const delta_y = point[1] - drag_origin.point[1];
		if (Math.hypot(delta_x, delta_y) > 5) drag_moved = true;
		if (drag_moved) {
			if (projection_mode === 'globe') globe_rotation = [drag_origin.rotation[0] + delta_x * .3 / zoom_level, Math.max(-89, Math.min(89, drag_origin.rotation[1] - delta_y * .3 / zoom_level)), 0];
			else map_offset = [drag_origin.offset[0] + delta_x, drag_origin.offset[1] + delta_y];
			updateProjection();
		}
	}
	const coordinates = getMapCoordinates(event);
	document.querySelector('#coordinates').textContent = coordinates ? `${Math.abs(coordinates[1]).toFixed(2)}° ${coordinates[1] >= 0 ? 'N' : 'S'}   ${Math.abs(coordinates[0]).toFixed(2)}° ${coordinates[0] >= 0 ? 'E' : 'W'}` : '—';
}).on('pointerup', event => {
	if (!drag_origin) return;
	if (!drag_moved) {
		const coordinates = getMapCoordinates(event);
		if (coordinates) placeMissile(coordinates);
	}
	drag_origin = null;
	map_svg.node().releasePointerCapture(event.pointerId);
}).on('pointercancel', () => { drag_origin = null; }).on('wheel', event => {
	event.preventDefault();
	changeZoom(event.deltaY < 0 ? 1.1 : 1 / 1.1);
}, { passive: false });

search_input.addEventListener('input', renderList);
missile_list.addEventListener('keydown', event => {
	if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
	event.preventDefault();
	const options = [...missile_list.querySelectorAll('button')];
	const current_index = options.indexOf(document.activeElement);
	const next_index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, current_index + (event.key === 'ArrowDown' ? 1 : -1)));
	options[next_index]?.focus();
});
document.querySelector('#mercator-button').addEventListener('click', () => switchProjection('mercator'));
document.querySelector('#globe-button').addEventListener('click', () => switchProjection('globe'));
document.querySelector('#clear-button').addEventListener('click', () => { placements = []; renderMap(); });
document.querySelector('#zoom-in').addEventListener('click', () => changeZoom(1.3));
document.querySelector('#zoom-out').addEventListener('click', () => changeZoom(1 / 1.3));
document.querySelector('#reset-view').addEventListener('click', () => { globe_rotation = [-15, -15, 0]; zoom_level = 1; map_offset = [0, 0]; updateProjection(); });
document.querySelector('#json-input').addEventListener('change', async event => {
	const file = event.target.files[0];
	if (!file) return;
	try {
		const imported_missiles = validateMissiles(JSON.parse(await file.text()));
		missiles = imported_missiles;
		search_input.value = '';
		selectMissile(missiles[0]);
		document.querySelector('#data-note').textContent = `Loaded ${file.name} · ${missiles.length} missiles`;
		setStatus('Missile library loaded. Existing launch points are preserved.');
	} catch (error) { setStatus('Import failed: ' + error.message); }
	event.target.value = '';
});

async function initializeMap() {
	updateProjection();
	new ResizeObserver(updateProjection).observe(map_container);
	setStatus('Loading map and missile library…');
	const results = await Promise.allSettled([
		loadWorldMap(),
		d3.json('./missiles.json')
	]);
	const errors = [];
	if (results[0].status === 'fulfilled') {
		const world = results[0].value;
		land_layer.selectAll('path').data(world.features).join('path').attr('class', 'land');
		world_ready = true;
	} else errors.push('Map unavailable. Check your internet connection and reload.');
	if (results[1].status === 'fulfilled') {
		try { missiles = validateMissiles(results[1].value); selectMissile(missiles[0]); }
		catch (error) { errors.push(error.message); }
	} else errors.push('Could not load missiles.json. Serve the page over HTTP, or use ↥ to import JSON.');
	setStatus(errors.join(' '));
	renderMap();
}

/* 
	Use the India legal map instead of the international one.
*/
async function loadWorldMap() {
	const [original_world, regional_map] = await Promise.all([
		d3.json('./data/countries-110m.json'),
		d3.json('./data/india-legal.topojson')
	]);

	const original_features = topojson.feature(
		original_world,
		original_world.objects.countries
	).features;

	const regional_features = topojson.feature(
		regional_map,
		regional_map.objects.countries
	).features;

	const replaced_names = new Set([
		'India', 'Pakistan', 'China', 'Afghanistan',
		'Nepal', 'Bhutan', 'Bangladesh', 'Myanmar'
	]);

	return {
		type: 'FeatureCollection',
		features: [
			...original_features.filter(
				feature => !replaced_names.has(feature.properties.name)
			),
			...regional_features
		]
	};
}

initializeMap();
