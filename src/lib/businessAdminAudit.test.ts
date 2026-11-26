import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('business Admin audit migration records before/after values without private owner profile fields', async () => {
  const sql = await readFile(
    new URL('../../supabase/migrations/20261126075257_business_admin_field_change_audit.sql', import.meta.url),
    'utf8'
  );
  assert.match(sql, /jsonb_build_object\(\s*'old',\s*old_fields\.value,\s*'new',\s*new_fields\.value\s*\)/);
  assert.match(sql, /'owner_name','owner_photo_url'/);
  assert.match(sql, /app\.business_field_review/);
  assert.match(sql, /'admin_direct_edit'/);
  assert.match(sql, /insert into public\.audit_logs\(actor_id,action,entity,entity_id,details\)/);
});
