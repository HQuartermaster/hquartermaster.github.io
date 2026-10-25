import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const importSource = async path => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};
const { validateScenario } = await importSource('../scenario.js');
const geometry = await importSource('../geometry.js');
const { combineCoverage } = await importSource('../coverage.js');
const clippingContext = {};
vm.runInNewContext(await readFile(new URL('../data/vendor/polygon-clipping.js', import.meta.url), 'utf8'), clippingContext);
const polygonClipping = clippingContext.polygonClipping;
const awacs = JSON.parse(await readFile(new URL('../awacs.json', import.meta.url), 'utf8'));
const targets = JSON.parse(await readFile(new URL('../targets.json', import.meta.url), 'utf8'));
const item = (type, name, altitude = 30000) => ({ type, name, position: [78, 30], altitude, heading: 45 });
const scenario = { version: 2, aircraft: [item('awacs', awacs[0].name), item('awacs', awacs[0].name), item('target', targets[0].name, 0)], overlay_altitude: 0, show_coverage: false, show_sight_lines: false };

test('scenario round trip preserves multiple identical AWACS, order and zero settings', () => {
  assert.deepEqual(validateScenario(JSON.parse(JSON.stringify(scenario)), awacs, targets), scenario);
  assert.equal(validateScenario({ aircraft: [] }, awacs, targets).version, 2);
  assert.equal(validateScenario({ aircraft: [] }, awacs, targets).show_sight_lines, true);
  assert.throws(() => validateScenario({ aircraft: [], show_sight_lines: 'false' }, awacs, targets));
});

test('invalid scenarios are rejected and imported code is discarded', () => {
  for (const change of [s => s.version = 99, s => s.aircraft[0].type = 'bad', s => s.aircraft[0].name = 'Missing', s => s.aircraft[0].position = [0, 90], s => s.aircraft[0].altitude = -1, s => s.aircraft[0].heading = 360, s => s.overlay_altitude = '0', s => s.show_coverage = 'false', s => s.view = {}, s => s.aircraft = Array(501).fill(s.aircraft[0])]) {
    const value = structuredClone(scenario); change(value);
    assert.throws(() => validateScenario(value, awacs, targets));
  }
  const value = structuredClone(scenario);
  value.aircraft[0].detection_curve = 'throw new Error()';
  assert.ok(!('detection_curve' in validateScenario(value, awacs, targets).aircraft[0]));
});

test('independent probabilities combine regardless of placement order', () => {
  const radar = P_d => ({ data: { name: String(P_d), coverage: 360, instrument_range: 600 }, position: [0, 0], altitude: 30000, heading: 0, detect: () => P_d });
  const target = { data: { rcs: 1 }, position: [0.1, 0], altitude: 15000 };
  const classify = list => geometry.classifyWithAwacs(list.map(radar), target, () => 0);
  assert.ok(Math.abs(classify([0.6, 0.5, 0.4]).P_d - 0.88) < 1e-12);
  assert.equal(classify([0.6, 0.5, 0.4]).state, 'DETECT');
  assert.equal(classify([0.4, 0.4]).state, 'DETECT');
  assert.equal(classify([0.8, 0.8]).state, 'LOCK');
  assert.equal(classify([0.8, 0.8, 0]).P_d, classify([0, 0.8, 0.8]).P_d);
  assert.equal(classify([0.95, 0.6]).state, 'LOCK');
  assert.equal(classify([NaN, 0.6]).state, 'UNKNOWN');
  assert.equal(classify([NaN, 1]).state, 'LOCK');
  assert.equal(classify([0.1, NaN]).state, 'UNKNOWN');
  assert.equal(classify([0.1, 0.2]).state, 'LOST');
  assert.equal(classify([]).P_d, 0);
});

test('excluded sources contribute zero to combined probability', () => {
  const radar = { data: { coverage: 360, instrument_range: 600 }, position: [0, 0], altitude: 30000, heading: 0, detect: () => 0.6 };
  const target = { data: { rcs: 1 }, position: [0.1, 0], altitude: 15000 };
  const excluded = { ...radar, data: { ...radar.data, instrument_range: 1 }, detect: () => 1 };
  assert.equal(geometry.classifyWithAwacs([radar, excluded], target, () => 0).P_d, 0.6);
});

const appSource = (await readFile(new URL('../app.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '').replace(/initializeAtlas\(\);\s*$/, '');
function appHarness() {
  const elements = new Map();
  function element() { return { value: '26000', checked: true, textContent: '', innerHTML: '', dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, append() {}, replaceChildren() {}, setAttribute() {}, addEventListener() {}, querySelector() { return this.label ??= element(); }, remove() { this.removed = true; } }; }
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element };
  const sources = { coverage: { setData(data) { this.data = data; } }, range: { setData(data) { this.data = data; } } };
  const mapStub = { dragPan: { enable() {} }, triggerRepaint() {}, getSource: id => sources[id], getCenter: () => ({ wrap: () => ({ lng: 78, lat: 30 }) }), getZoom: () => 6, getPitch: () => 55, getBearing: () => 0, easeTo() {}, stop() {}, jumpTo() {} };
  const context = vm.createContext({ document, window: { addEventListener() {} }, localStorage: { setItem() {} }, setTimeout(callback, delay) { if (delay === 0) queueMicrotask(callback); }, clearTimeout() {}, validateScenario, combineCoverage, polygonClipping, ...geometry, ensureTerrain: async () => {}, getElevation: () => 0, awacsData: awacs, targetData: targets, mapStub });
  vm.runInContext(appSource + '\nawacs_catalog = awacsData; target_catalog = targetData; map = mapStub;', context);
  return { run: code => vm.runInContext(code, context), sources };
}

test('app adds multiple AWACS, exports/reloads them, deletes independently and clears overlays', () => {
  const { run, sources } = appHarness();
  run("placeAircraft(awacs_catalog[0], 'awacs', [78, 30]); placeAircraft(awacs_catalog[1], 'awacs', [79, 30]); placeAircraft(target_catalog[0], 'target', [78.1, 30], 0);");
  assert.equal(run('placed_awacs.length'), 2);
  assert.equal(run('placed_targets[0].altitude'), 0);
  run('const exported = JSON.parse(JSON.stringify(serializeScenario())); clearMap(); loadScenario(exported);');
  assert.equal(run('placed_awacs.length'), 2);
  assert.equal(run('placed_targets.length'), 1);
  assert.throws(() => run('loadScenario({aircraft: [{type: "bad"}]})'));
  assert.equal(run('placed_awacs.length'), 2);
  run("selectAircraft(placed_awacs[0]); byId('delete-aircraft').onclick();");
  assert.equal(run('placed_awacs.length'), 1);
  assert.equal(run('placed_awacs[0].data.name'), awacs[1].name);
  run('clearMap();');
  assert.equal(run('getAircraft().length'), 0);
  assert.equal(run('selected_aircraft'), null);
  assert.equal(sources.coverage.data.features.length, 0);
  assert.equal(sources.range.data.features.length, 0);
});

test('coverage keeps every AWACS range ring when shading is hidden', async () => {
  const { run, sources } = appHarness();
  run("placeAircraft(awacs_catalog[0], 'awacs', [78, 30]); placeAircraft(awacs_catalog[1], 'awacs', [79, 30]); byId('show-coverage').checked = false;");
  await run('updateCoverage();');
  assert.equal(sources.range.data.features.length, 2);
  assert.equal(sources.coverage.data.features.length, 0);
});

test('sight lines depend on geometry, respect the toggle and survive scenario reload', () => {
  const { run } = appHarness();
  run("placeAircraft(awacs_catalog[0], 'awacs', [0, 0]); placeAircraft(target_catalog[0], 'target', [0.1, 0], 15000);");
  assert.equal(run('sight_pairs.length'), 1);
  run('placed_awacs[0].data = { ...placed_awacs[0].data, instrument_range: 1 }; updateMarkerStates();');
  assert.equal(run('placed_targets[0].result.state'), 'LOST');
  assert.equal(run('sight_pairs.length'), 1);
  run("byId('show-sight-lines').checked = false; updateMarkerStates();");
  assert.equal(run('sight_pairs.length'), 0);
  run('loadScenario(JSON.parse(JSON.stringify(serializeScenario())));');
  assert.equal(run("byId('show-sight-lines').checked"), false);
  run("byId('show-sight-lines').checked = true; placed_targets[0].altitude = 0; updateMarkerStates();");
  assert.equal(run('sight_pairs.length'), 0);
  run('placed_targets[0].altitude = 15000; getElevation = () => null; updateMarkerStates();');
  assert.equal(run('sight_pairs.length'), 0);
});

test('sight lines render between projected aircraft positions and disappear when disabled', () => {
  const { run } = appHarness();
  run(`
    map.getCanvas = () => ({ clientWidth: 1000, clientHeight: 800 });
    map.getCenter = () => ({ lng: 0 });
    map.project = () => ({ x: 0, y: 0 });
    maplibregl = { MercatorCoordinate: { fromLngLat: position => ({ x: position[0], y: position[1], z: 0 }) } };
    projection_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    placeAircraft(awacs_catalog[0], 'awacs', [0, 0]);
    placeAircraft(target_catalog[0], 'target', [0.1, 0], 15000);
    for (const aircraft of getAircraft()) { aircraft.element.style = {}; aircraft.element.querySelector('img').style = {}; }
    renderAircraft();
  `);
  assert.equal(run("byId('sight-lines').innerHTML"), '<line x1="500" y1="400" x2="550" y2="400"/>');
  run("byId('show-sight-lines').checked = false; renderAircraft();");
  assert.equal(run("byId('sight-lines').innerHTML"), '');
});

test('coverage is reused for target edits and toggles, with only changed AWACS invalidated', async () => {
  const { run, sources } = appHarness();
  run(`
    maplibregl = { LngLat: { convert: p => ({ distanceTo: q => surfaceDistance(p, q.position), position: p }) } };
    placeAircraft(awacs_catalog[0], 'awacs', [0, 0]);
    placeAircraft(awacs_catalog[1], 'awacs', [0.1, 0]);
    for (const aircraft of placed_awacs) aircraft.data = { ...aircraft.data, instrument_range: 20, coverage: 360 };
    placeAircraft(target_catalog[0], 'target', [0.05, 0], 15000);
    coverage_calls = 0;
    const original_calculate = calculateCoverage;
    calculateCoverage = (...args) => { coverage_calls++; return original_calculate(...args); };
  `);
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 2);
  assert.ok(sources.coverage.data.features.length > 0);
  const original = sources.coverage.data;
  run('placed_targets[0].position = [0.06, 0]; placed_targets[0].altitude = 20000; scheduleUpdate();');
  assert.equal(sources.coverage.data, original);
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 2);
  assert.equal(sources.coverage.data, original);
  run("byId('show-coverage').checked = false; scheduleUpdate();");
  assert.equal(sources.coverage.data.features.length, 0);
  run("byId('show-coverage').checked = true; scheduleUpdate();");
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 2);
  run('placed_awacs[0].position = [0.02, 0]; scheduleUpdate();');
  assert.equal(sources.range.data.features.length, 1);
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 3);
  run('placed_awacs[0].heading += 10; scheduleUpdate();');
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 3);
  run('placed_awacs[0].altitude += 500; scheduleUpdate();');
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 4);
  run('placed_awacs[0].data = { ...placed_awacs[0].data, coverage: 270 }; scheduleUpdate();');
  await run('updateCoverage();');
  run('placed_awacs[0].heading += 10; scheduleUpdate();');
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 6);
  run("byId('overlay-altitude').value = '30000'; scheduleUpdate();");
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 8);
  run('placed_awacs.pop(); scheduleUpdate();');
  await run('updateCoverage();');
  assert.equal(run('coverage_calls'), 8);
  assert.equal(sources.range.data.features.length, 1);
});
