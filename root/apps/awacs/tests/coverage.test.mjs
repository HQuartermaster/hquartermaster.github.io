import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../coverage.js', import.meta.url), 'utf8');
const { combineCoverage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const context = {};
vm.runInNewContext(await readFile(new URL('../data/vendor/polygon-clipping.js', import.meta.url), 'utf8'), context);
const clipping = context.polygonClipping;
const cell = (state, x1, y1, x2, y2) => ({ type: 'Feature', properties: { state }, geometry: { type: 'Polygon', coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] } });
const area = polygons => polygons.reduce((total, rings) => total + rings.reduce((sum, ring, i) => {
  const value = Math.abs(ring.slice(1).reduce((s, point, index) => s + ring[index][0] * point[1] - point[0] * ring[index][1], 0)) / 2;
  return sum + (i ? -value : value);
}, 0), 0);

test('green wins overlaps without purple tint or repeated green opacity', () => {
  const entries = [
    { features: [cell('VISIBLE', 0, 0, 2, 2), cell('LOST', 2, 0, 4, 2)] },
    { features: [cell('LOST', 0, 0, 2, 2), cell('VISIBLE', 1, 0, 3, 2)] }
  ];
  const result = combineCoverage(entries, clipping);
  const green = result.find(f => f.properties.state === 'VISIBLE').geometry.coordinates;
  const purple = result.find(f => f.properties.state === 'LOST').geometry.coordinates;
  assert.equal(area(green), 6);
  assert.equal(area(purple), 2);
  assert.equal(clipping.intersection(green, purple).length, 0);
  assert.equal(JSON.stringify(combineCoverage(entries.reverse(), clipping)), JSON.stringify(result));
});

test('unknown wins masked areas but never covers confirmed visible areas', () => {
  const result = combineCoverage([{ features: [cell('LOST', 0, 0, 4, 2), cell('UNKNOWN', 1, 0, 3, 2), cell('VISIBLE', 2, 0, 4, 2)] }], clipping);
  const geometry = Object.fromEntries(result.map(f => [f.properties.state, f.geometry.coordinates]));
  assert.equal(area(geometry.VISIBLE), 4);
  assert.equal(area(geometry.UNKNOWN), 2);
  assert.equal(area(geometry.LOST), 2);
});

test('coverage crossing the date line merges with the opposite world edge', () => {
  const result = combineCoverage([{ features: [cell('VISIBLE', 179, 0, 181, 2)] }, { features: [cell('LOST', -180, 0, -178, 2)] }], clipping);
  const green = result.find(f => f.properties.state === 'VISIBLE').geometry.coordinates;
  const purple = result.find(f => f.properties.state === 'LOST').geometry.coordinates;
  assert.equal(area(green), 4);
  assert.equal(area(purple), 2);
  assert.equal(clipping.intersection(green, purple).length, 0);
});
