import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePasswordStrength, validatePasswordPair } from './password';

test('evaluatePasswordStrength handles empty and weak passwords', () => {
  const empty = evaluatePasswordStrength('');
  assert.equal(empty.score, 0);
  assert.equal(empty.label, 'None');

  const short = evaluatePasswordStrength('abc123');
  assert.equal(short.score, 1);
  assert.equal(short.label, 'Weak');
  assert.equal(short.rules.minLength, false);

  const lettersOnly = evaluatePasswordStrength('abcdefghij');
  assert.equal(lettersOnly.score, 1);
  assert.equal(lettersOnly.rules.minLength, true);
  assert.equal(lettersOnly.rules.hasNumberOrSymbol, false);
});

test('evaluatePasswordStrength distinguishes Fair and Strong passwords', () => {
  const fair = evaluatePasswordStrength('Shop1234');
  assert.equal(fair.score, 2);
  assert.equal(fair.label, 'Fair');

  const strong = evaluatePasswordStrength('Sadiqabad#2025');
  assert.equal(strong.score, 3);
  assert.equal(strong.label, 'Strong');
  assert.equal(strong.rules.minLength, true);
  assert.equal(strong.rules.hasLetter, true);
  assert.equal(strong.rules.hasNumberOrSymbol, true);
});

test('validatePasswordPair validates length, complexity, and match', () => {
  const mismatch = validatePasswordPair('Sadiqabad1', 'Sadiqabad2');
  assert.equal(mismatch.valid, false);
  assert.equal(mismatch.matches, false);
  assert.ok(mismatch.errorEn);

  const ok = validatePasswordPair('Sadiqabad#1', 'Sadiqabad#1');
  assert.equal(ok.valid, true);
  assert.equal(ok.matches, true);
  assert.equal(ok.errorEn, null);
});
