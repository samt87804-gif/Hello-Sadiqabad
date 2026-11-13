import test from 'node:test';
import assert from 'node:assert/strict';
import { getOpenStatus } from './openNow';

test('returns open_24h when isOpen24h is true', () => {
  const res = getOpenStatus(null, true, new Date('2026-11-13T10:00:00+05:00'));
  assert.equal(res.state, 'open_24h');
});

test('returns not_listed when opening_hours is missing and not 24h', () => {
  const res = getOpenStatus(null, false, new Date('2026-11-13T10:00:00+05:00'));
  assert.equal(res.state, 'not_listed');
});

test('computes open and closed accurately in Asia/Karachi timezone with multiple ranges', () => {
  // 2026-11-13 is Friday
  const schedule = {
    fri: [
      { open: '09:00', close: '13:00' },
      { open: '14:30', close: '22:00' },
    ],
  };

  // 11:00 PKT -> open
  const morning = getOpenStatus(schedule, false, new Date('2026-11-13T11:00:00+05:00'));
  assert.equal(morning.state, 'open');
  assert.equal(morning.todayDayKey, 'fri');

  // 13:30 PKT (Jummah break) -> closed, opens at 2:30 PM
  const jummah = getOpenStatus(schedule, false, new Date('2026-11-13T13:30:00+05:00'));
  assert.equal(jummah.state, 'closed');
  assert.match(jummah.detailEn ?? '', /2:30 PM/);

  // 20:00 PKT -> open
  const evening = getOpenStatus(schedule, false, new Date('2026-11-13T20:00:00+05:00'));
  assert.equal(evening.state, 'open');
});
