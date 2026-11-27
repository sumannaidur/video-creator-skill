// P024.14B: pure pre-render validators (timing, transitions, project paths). Browser DOM checks run in render.mjs fixtures.
import assert from 'node:assert/strict';
import { validatePaths, validateTiming } from '../lib/prerender.mjs';

const ok = {duration: 10, cues: [{id: 'a', cue: 'x', at: 2}], checks: {keyframes: [['k', 5]]},
  shots: [{id: 's1', start: 0, end: 5, transition: {type: 'dip', at: 5, from: 4.5, to: 5.5}}, {id: 's2', start: 5, end: 10}]};
const checks = e => validateTiming(e).map(f => f.check);
assert.deepEqual(validateTiming(ok), []);
assert.deepEqual(checks({...ok, cues: [{id: 'a', at: 12}]}), ['unresolved-cue']);
assert.deepEqual(checks({...ok, cues: [{id: 'a', at: NaN}]}), ['unresolved-cue']);
assert.deepEqual(checks({...ok, checks: {keyframes: [['k', -1]]}}), ['keyframe-time']);
assert.deepEqual(checks({...ok, shots: [ok.shots[0], {id: 's2', start: 5.2, end: 10}]}), ['shot-time']);
assert.deepEqual(checks({...ok, shots: [{...ok.shots[0], transition: {type: 'dip', at: 5, from: 4.5, to: 11}}, ok.shots[1]]}), ['transition']);
assert.deepEqual(checks({...ok, shots: [ok.shots[0], {...ok.shots[1], transition: {type: 'dip', at: 10, from: 9.5, to: 10.5}}]}), ['transition']);
assert.deepEqual(checks({...ok, duration: 0}), ['timing']);
const project = process.platform === 'win32' ? 'C:\\p\\proj' : '/p/proj';
assert.deepEqual(validatePaths({project, timeline: {audio: {path: 'narration/n.wav'}}}), []);
for (const bad of ['../other/n.wav', project + '/narration/n.wav', undefined])
  assert.deepEqual(validatePaths({project, timeline: {audio: {path: bad}}}).map(f => f.check), ['project-path'], String(bad));
console.log('Pre-render validator fixtures passed.');
