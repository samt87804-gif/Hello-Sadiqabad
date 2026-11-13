import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyJummahSplitToFriday,
  applyMondayToWeek,
  JUMMAH_SPLIT_FRIDAY,
  validateOpeningHoursRanges,
} from './hours';
import type { OpeningHoursJson } from '../types/directory';

test('applyMondayToWeek copies Monday to remaining days and respects preserveFriday', () => {
  const base: OpeningHoursJson = {
    mon: [{ open: '08:30', close: '21:30' }],
    tue: [],
    wed: [],
    thu: [],
    fri: [{ open: '09:00', close: '12:30' }, { open: '14:30', close: '22:00' }],
    sat: [],
    sun: [],
  };

  const preserved = applyMondayToWeek(base, true);
  assert.deepEqual(preserved.tue, [{ open: '08:30', close: '21:30' }]);
  assert.deepEqual(preserved.sun, [{ open: '08:30', close: '21:30' }]);
  assert.equal(preserved.fri?.length, 2);

  const overwritten = applyMondayToWeek(base, false);
  assert.deepEqual(overwritten.fri, [{ open: '08:30', close: '21:30' }]);
});

test('applyJummahSplitToFriday sets standard Jummah split hours and clears 24/7', () => {
  const initial: OpeningHoursJson = {
    is_24_7: true,
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  const next = applyJummahSplitToFriday(initial);
  assert.equal(next.is_24_7, false);
  assert.deepEqual(next.fri, JUMMAH_SPLIT_FRIDAY);
});

test('validateOpeningHoursRanges flags inverted ranges and skips when 24/7', () => {
  const invalid: OpeningHoursJson = {
    mon: [{ open: '22:00', close: '09:00' }],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
  const err = validateOpeningHoursRanges(invalid);
  assert.ok(err && err.includes('MON'));

  assert.equal(validateOpeningHoursRanges({ ...invalid, is_24_7: true }), null);
  assert.equal(
    validateOpeningHoursRanges({ ...invalid, mon: [{ open: '09:00', close: '22:00' }] }),
    null
  );
});
