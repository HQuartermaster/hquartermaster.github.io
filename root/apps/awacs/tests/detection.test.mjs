import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../geometry.js', import.meta.url), 'utf8');
const { classifyTarget } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const catalog = JSON.parse(await readFile(new URL('../awacs.json', import.meta.url), 'utf8'));

const aircraft = { position: [0, 0], altitude: 30000, heading: 90, data: { instrument_range: 600, coverage: 360 } };
const target = { position: [0.1, 0], altitude: 15000, data: { rcs: 1 } };
const flatTerrain = () => 0;
const classify = (P_d, terrain = flatTerrain, overrides = {}) => classifyTarget({ ...aircraft, detect: () => P_d, ...overrides }, target, terrain);

test('classification includes the exact probability cutoffs', () => {
  for (const [P_d, state] of [[0, 'LOST'], [0.499999, 'LOST'], [0.5, 'DETECT'], [0.899999, 'DETECT'], [0.9, 'LOCK'], [1, 'LOCK']]) {
    const result = classify(P_d);
    assert.equal(result.state, state);
    assert.equal(result.P_d, P_d);
  }
});

test('invalid and legacy string results remain unknown', () => {
  for (const value of [NaN, Infinity, -0.1, 1.1, null, undefined, true, '0.9', 'LOCK', 'DETECT', 'LOST']) {
    assert.equal(classify(value).state, 'UNKNOWN');
    assert.equal(classify(value).P_d, null);
  }
  assert.equal(classifyTarget({ ...aircraft, detect: () => { throw new Error('broken'); } }, target, flatTerrain).state, 'UNKNOWN');
});

test('physical exclusions force zero without invoking the curve', () => {
  const detect = () => { throw new Error('Excluded targets must not evaluate the curve'); };
  const cases = [
    [flatTerrain, { data: { ...aircraft.data, instrument_range: 1 } }, 'Beyond instrument range'],
    [flatTerrain, { heading: 270, data: { ...aircraft.data, coverage: 90 } }, 'Outside field of view'],
    [() => 10000, {}, 'Aircraft at or below ground'],
    [position => position[0] > 0.02 && position[0] < 0.08 ? 20000 : 0, {}, 'Terrain masks line of sight']
  ];
  for (const [terrain, overrides, reason] of cases) {
    const result = classify(1, terrain, { ...overrides, detect });
    assert.equal(result.state, 'LOST');
    assert.equal(result.P_d, 0);
    assert.equal(result.reason, reason);
  }
});

test('missing elevation preserves unknown probability', () => {
  for (const terrain of [() => null, position => position[0] > 0.02 && position[0] < 0.08 ? null : 0]) {
    assert.equal(classify(1, terrain).state, 'UNKNOWN');
    assert.equal(classify(1, terrain).P_d, null);
  }
});

test('all catalogue curves preserve range anchors and fourth-root RCS scaling', () => {
  const anchors = [[225, 470], [225, 470], [250, 530], [215, 450], [190, 400], [230, 480], [225, 470], [170, 350]];
  assert.equal(catalog.length, anchors.length);
  catalog.forEach((entry, index) => {
    const detect = new Function(`"use strict"; return (${entry.detection_curve});`)();
    const [lockRange, detectRange] = anchors[index];
    for (const rcs of [0.005, 0.01, 0.5, 0.75, 1, 8, 250]) {
      const scale = Math.pow(rcs, 0.25);
      assert.ok(Math.abs(detect(lockRange * scale, rcs) - 0.9) < 1e-12, entry.name);
      assert.ok(Math.abs(detect(detectRange * scale, rcs) - 0.5) < 1e-12, entry.name);
      let previous = 1;
      for (let distance = 0; distance <= 2000; distance += 10) {
        const P_d = detect(distance, rcs);
        assert.ok(Number.isFinite(P_d) && P_d >= 0 && P_d <= previous, entry.name);
        previous = P_d;
      }
    }
    assert.equal(detect(0, 0), 0);
    assert.equal(detect(100, 0), 0);
    for (const args of [[-1, 1], [1, -1], [NaN, 1], [1, Infinity]]) assert.ok(Number.isNaN(detect(...args)));
  });
});
