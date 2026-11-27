import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAuthLink } from './authLink';

test('parses invite token hashes', () => {
  const parsed = parseAuthLink('https://hellosadiqabad.com/reset-password?token_hash=abc123&type=invite');
  assert.equal(parsed.tokenHash, 'abc123');
  assert.equal(parsed.tokenType, 'invite');
  assert.equal(parsed.error, null);
});
test('parses recovery access and refresh tokens', () => {
  const parsed = parseAuthLink('https://hellosadiqabad.com/reset-password#access_token=access123&refresh_token=refresh123&type=recovery');
  assert.equal(parsed.accessToken, 'access123');
  assert.equal(parsed.refreshToken, 'refresh123');
  assert.equal(parsed.tokenType, 'recovery');
});
test('parses PKCE code and expired-link errors', () => {
  assert.equal(parseAuthLink('https://hellosadiqabad.com/reset-password?code=pkce123').code, 'pkce123');
  assert.equal(parseAuthLink('https://hellosadiqabad.com/reset-password?error=access_denied&error_code=otp_expired').error, 'otp_expired');
});
