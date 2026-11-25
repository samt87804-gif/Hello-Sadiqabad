import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSINESS_APPROVAL_CORE_FIELDS,
  buildBusinessFieldDecisions,
  canUnpublishBusinessField,
  countApprovedCoreFields,
  shouldProcessOwnerInvitation,
} from './businessApproval';

const fields = [
  { field_key: 'name_en', status: 'approved_published' as const },
  { field_key: 'category_id', status: 'approved_published' as const },
  { field_key: 'area_id', status: 'pending_review' as const },
  { field_key: 'phone_primary', status: 'pending_review' as const },
  { field_key: 'address_en', status: 'pending_review' as const },
  { field_key: 'description_en', status: 'pending_review' as const },
  { field_key: 'owner_name', status: 'pending_review' as const },
];

test('the publication gate is exactly the five approved core fields', () => {
  assert.deepEqual(BUSINESS_APPROVAL_CORE_FIELDS, ['name_en', 'category_id', 'area_id', 'phone_primary', 'address_en']);
  assert.equal(countApprovedCoreFields(fields, ['area_id', 'phone_primary']), 4);
  assert.equal(countApprovedCoreFields(fields, ['area_id', 'phone_primary', 'address_en']), 5);
});

test('one bulk save includes only explicitly selected approvals', () => {
  const decisions = buildBusinessFieldDecisions(fields, ['area_id', 'description_en'], {}, []);
  assert.deepEqual(decisions, [
    { field_key: 'area_id', status: 'approved_published' },
    { field_key: 'description_en', status: 'approved_published' },
  ]);
});

test('unchecked fields remain untouched and private owner name can never be approved', () => {
  const decisions = buildBusinessFieldDecisions(fields, ['owner_name'], {}, []);
  assert.deepEqual(decisions, []);
});

test('rejection requires an explicit non-empty reason', () => {
  const decisions = buildBusinessFieldDecisions(fields, [], { description_en: '   ', area_id: 'Area does not match' }, []);
  assert.deepEqual(decisions, [
    { field_key: 'area_id', status: 'rejected', admin_note: 'Area does not match' },
  ]);
});

test('unpublish is only available for an approved field on a published business', () => {
  assert.equal(canUnpublishBusinessField('approved_published', 'published'), true);
  assert.equal(canUnpublishBusinessField('pending_review', 'published'), false);
  assert.equal(canUnpublishBusinessField('approved_published', 'pending_approval'), false);
});

test('invitation processing waits until the minimum listing gate is satisfied', () => {
  assert.equal(shouldProcessOwnerInvitation('waiting_for_business', null, false), false);
  assert.equal(shouldProcessOwnerInvitation('waiting_for_business', 'business-1', false), false);
  assert.equal(shouldProcessOwnerInvitation('pending', 'business-1', true), true);
  assert.equal(shouldProcessOwnerInvitation('sent', 'business-1', true), false);
});

test('unpublishing a required core field removes it from the publication gate', () => {
  assert.equal(countApprovedCoreFields(fields, [], ['name_en']), 1);
  assert.equal(countApprovedCoreFields(fields, ['area_id', 'phone_primary', 'address_en'], ['name_en']), 4);
});
