import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countEffectiveActiveOffers,
  getEffectiveOfferStatus,
  getPakistanDateString,
  getPlanOfferLimit,
  isOfferCurrentlyValid,
  normalizeDateOnly,
} from './offers';
import {
  deleteOffer,
  fetchActiveOffers,
  fetchBusinessOffers,
  fetchOwnerInquiries,
  fetchOwnerInquiriesPage,
  fetchOwnerReviews,
  fetchOwnerReviewsPage,
  fetchOwnerSubmissionsPage,
  fetchUnreadNotificationCount,
  loadDemoDb,
  replyToReview,
  updateInquiryStatus,
  setNotificationRead,
  updateOwnerBusiness,
  upsertOffer,
} from './api';
import { parseStepParam, STEPS } from './listingWizard';
import { buildTelUrl } from './phone';
import { countOwnerRequestsAwaitingReview } from './ownerPortal';
import { getSafeOwnerNotificationPath } from './notifications';
import type { ReviewRow } from '../types/database';

test('Owner request history page safely returns an empty page without a live session', async () => {
  const page = await fetchOwnerSubmissionsPage('demo-owner', 0, 20);
  assert.deepEqual(page, { items: [], hasMore: false });
});

test('Owner review and inquiry pages are bounded and do not overlap', async () => {
  const db = loadDemoDb();
  const businessId = 'owner-pagination-test-business';
  const reviewIds: string[] = [];
  const inquiryIds: string[] = [];
  const stamp = Date.now();
  for (let index = 0; index < 23; index += 1) {
    const reviewId = `review-page-${stamp}-${index}`;
    const inquiryId = `inquiry-page-${stamp}-${index}`;
    reviewIds.push(reviewId); inquiryIds.push(inquiryId);
    db.reviews.push({
      id: reviewId, business_id: businessId, author_name: `Reviewer ${index}`,
      rating: 5, comment: 'Pagination test', status: 'approved',
      owner_reply: index % 2 === 0 ? 'Thanks for your feedback.' : null,
      owner_reply_at: index % 2 === 0 ? new Date(stamp + index).toISOString() : null,
      created_at: new Date(stamp + index).toISOString(),
      updated_at: new Date(stamp + index).toISOString(),
    });
    db.inquiries.push({
      id: inquiryId, business_id: businessId, name: `Customer ${index}`,
      phone: '03001234567', message: 'Pagination test',
      status: (['new', 'read', 'handled'] as const)[index % 3],
      handled_by: null, created_at: new Date(stamp + index).toISOString(),
      updated_at: new Date(stamp + index).toISOString(),
    });
  }
  const firstReviews = await fetchOwnerReviewsPage(businessId, 0, 20);
  const nextReviews = await fetchOwnerReviewsPage(businessId, 20, 20);
  assert.equal(firstReviews.items.length, 20);
  assert.equal(firstReviews.hasMore, true);
  assert.equal(nextReviews.items.length, 3);
  assert.equal(nextReviews.hasMore, false);
  assert.equal(new Set([...firstReviews.items, ...nextReviews.items].map((row) => row.id)).size, 23);

  const repliedReviews = await fetchOwnerReviewsPage(businessId, 0, 20, 'replied');
  const unrepliedReviews = await fetchOwnerReviewsPage(businessId, 0, 20, 'not_replied');
  assert.equal(repliedReviews.items.length, 12);
  assert.equal(repliedReviews.hasMore, false);
  assert.ok(repliedReviews.items.every((row) => Boolean(row.owner_reply?.trim())));
  assert.equal(unrepliedReviews.items.length, 11);
  assert.equal(unrepliedReviews.hasMore, false);
  assert.ok(unrepliedReviews.items.every((row) => !row.owner_reply?.trim()));

  const firstInquiries = await fetchOwnerInquiriesPage(businessId, 0, 20);
  const nextInquiries = await fetchOwnerInquiriesPage(businessId, 20, 20);
  assert.equal(firstInquiries.items.length, 20);
  assert.equal(firstInquiries.hasMore, true);
  assert.equal(nextInquiries.items.length, 3);
  assert.equal(nextInquiries.hasMore, false);
  assert.equal(new Set([...firstInquiries.items, ...nextInquiries.items].map((row) => row.id)).size, 23);

  for (const status of ['new', 'read', 'handled'] as const) {
    const filtered = await fetchOwnerInquiriesPage(businessId, 0, 20, status);
    assert.equal(filtered.items.length, status === 'handled' ? 7 : 8);
    assert.equal(filtered.hasMore, false);
    assert.ok(filtered.items.every((row) => row.status === status));
  }

  db.reviews = db.reviews.filter((row) => !reviewIds.includes(row.id));
  db.inquiries = db.inquiries.filter((row) => !inquiryIds.includes(row.id));
});

test('Owner request count includes both new and in-review submissions', () => {
  assert.equal(countOwnerRequestsAwaitingReview([
    { status: 'new' },
    { status: 'in_review' },
    { status: 'done' },
    { status: 'rejected' },
  ]), 2);
});

test('Notification links are restricted to internal Owner Portal routes', () => {
  assert.equal(getSafeOwnerNotificationPath('/owner'), '/owner');
  assert.equal(getSafeOwnerNotificationPath('/owner/plan'), '/owner/plan');
  assert.equal(getSafeOwnerNotificationPath('https://example.com'), null);
  assert.equal(getSafeOwnerNotificationPath('//example.com'), null);
  assert.equal(getSafeOwnerNotificationPath('/admin'), null);
});

test('Owner unread notification count stays accurate without loading notification bodies', async () => {
  const db = loadDemoDb();
  const notification = {
    id: 'notification-count-test',
    user_id: 'user-owner-1',
    type: 'general' as const,
    title_en: 'Count test',
    title_ur: 'گنتی کا ٹیسٹ',
    body_en: 'Count test body',
    body_ur: 'گنتی کا ٹیسٹ متن',
    link_path: '/owner',
    is_read: false,
    created_at: new Date().toISOString(),
  };
  const before = await fetchUnreadNotificationCount('user-owner-1');
  db.notifications.push(notification);
  assert.equal(await fetchUnreadNotificationCount('user-owner-1'), before + 1);
  await setNotificationRead('user-owner-1', notification.id, true);
  assert.equal(await fetchUnreadNotificationCount('user-owner-1'), before);
  db.notifications = db.notifications.filter((item) => item.id !== notification.id);
});

test('Owner can mark one notification read and unread in demo mode', async () => {
  const db = loadDemoDb();
  const notification = {
    id: 'notification-toggle-test',
    user_id: 'user-owner-1',
    type: 'general' as const,
    title_en: 'Test notification',
    title_ur: 'آزمائشی اطلاع',
    body_en: 'Test body',
    body_ur: 'آزمائشی متن',
    link_path: '/owner',
    is_read: false,
    created_at: new Date().toISOString(),
  };
  db.notifications.push(notification);
  await setNotificationRead('user-owner-1', notification.id, true);
  assert.equal(db.notifications.find((item) => item.id === notification.id)?.is_read, true);
  await setNotificationRead('user-owner-1', notification.id, false);
  assert.equal(db.notifications.find((item) => item.id === notification.id)?.is_read, false);
  db.notifications = db.notifications.filter((item) => item.id !== notification.id);
});

test('1. Creating a new offer defaults to active', async () => {
  const newOffer = await upsertOffer({
    business_id: 'biz-al-madina-mart',
    title: 'New Flash Deal 10% Off',
    valid_from: '2026-05-01',
    valid_to: '2027-12-31',
  });

  assert.equal(newOffer.status, 'active');
  assert.ok(newOffer.id.startsWith('offer-'));

  // Clean up
  await deleteOffer(newOffer.id);
});

test('2. Editing an existing offer preserves current status (paused stays paused)', async () => {
  // Create a paused offer
  const created = await upsertOffer({
    business_id: 'biz-al-madina-mart',
    title: 'Paused Seasonal Discount',
    valid_from: '2026-01-01',
    valid_to: '2027-12-31',
    status: 'paused',
  });
  assert.equal(created.status, 'paused');

  // Edit the offer title and dates, preserving its paused status
  const updated = await upsertOffer({
    id: created.id,
    business_id: created.business_id,
    title: 'Updated Paused Title (Still Paused)',
    valid_from: '2026-02-01',
    valid_to: '2027-12-31',
    status: created.status, // preserved status
  });

  assert.equal(updated.title, 'Updated Paused Title (Still Paused)');
  assert.equal(updated.status, 'paused');

  // Clean up
  await deleteOffer(created.id);
});

test('3. Activating and pausing are separate intentional actions', async () => {
  const offer = await upsertOffer({
    business_id: 'biz-al-madina-mart',
    title: 'Intentional Toggle Test',
    valid_from: '2026-01-01',
    valid_to: '2027-12-31',
    status: 'active',
  });
  assert.equal(offer.status, 'active');

  // Intentional Pause
  const paused = await upsertOffer({
    ...offer,
    status: 'paused',
  });
  assert.equal(paused.status, 'paused');

  // Intentional Activate
  const activated = await upsertOffer({
    ...paused,
    status: 'active',
  });
  assert.equal(activated.status, 'active');

  // Clean up
  await deleteOffer(offer.id);
});

test('4. Correct offer expiry calculation with Pakistan local date', () => {
  const fixedToday = '2026-05-15';

  // Active within date range
  const activeOffer = {
    status: 'active',
    valid_from: '2026-05-01',
    valid_to: '2026-05-30',
  };
  assert.equal(getEffectiveOfferStatus(activeOffer, fixedToday), 'active');
  assert.equal(isOfferCurrentlyValid(activeOffer, fixedToday), true);

  // Expired offer (valid_to is yesterday)
  const expiredOffer = {
    status: 'active',
    valid_from: '2026-04-01',
    valid_to: '2026-05-14',
  };
  assert.equal(getEffectiveOfferStatus(expiredOffer, fixedToday), 'expired');
  assert.equal(isOfferCurrentlyValid(expiredOffer, fixedToday), false);

  // Future / upcoming offer (valid_from is tomorrow)
  const futureOffer = {
    status: 'active',
    valid_from: '2026-05-16',
    valid_to: '2026-06-01',
  };
  assert.equal(getEffectiveOfferStatus(futureOffer, fixedToday), 'upcoming');
  assert.equal(isOfferCurrentlyValid(futureOffer, fixedToday), false);

  // Paused offer must remain paused even if within valid date range
  const pausedOffer = {
    status: 'paused',
    valid_from: '2026-05-01',
    valid_to: '2026-05-30',
  };
  assert.equal(getEffectiveOfferStatus(pausedOffer, fixedToday), 'paused');
  assert.equal(isOfferCurrentlyValid(pausedOffer, fixedToday), false);
});

test('5. Expired offers do not count toward active offer usage', () => {
  const fixedToday = '2026-05-15';
  const offersList = [
    { status: 'active', valid_from: '2026-05-01', valid_to: '2026-05-30' }, // Effective active
    { status: 'active', valid_from: '2026-05-01', valid_to: '2026-05-10' }, // Expired!
    { status: 'paused', valid_from: '2026-05-01', valid_to: '2026-05-30' }, // Paused!
    { status: 'active', valid_from: '2026-06-01', valid_to: '2026-06-30' }, // Upcoming!
  ];

  const activeCount = countEffectiveActiveOffers(offersList, fixedToday);
  assert.equal(activeCount, 1); // Only 1 active offer
});

test('6. Plan offer limits: Free (0), Basic (2), Premium (10)', () => {
  assert.equal(getPlanOfferLimit('free'), 0);
  assert.equal(getPlanOfferLimit('basic'), 2);
  assert.equal(getPlanOfferLimit('premium'), 10);
  assert.equal(getPlanOfferLimit(null), 0);
  assert.equal(getPlanOfferLimit('gold'), 0); // fallback
});

test('7. Review & reply workflow enforces 500 character limit and persists in demo DB', async () => {
  const db = loadDemoDb();
  // Find or create an approved review
  const found = db.reviews.find((r) => r.status === 'approved');
  let review: ReviewRow;
  if (found) {
    review = found;
  } else {
    review = {
      id: 'rev-test-1',
      business_id: 'biz-al-madina-mart',
      author_name: 'Ahmed Khan',
      rating: 5,
      comment: 'Excellent shop in Sadiqabad!',
      status: 'approved',
      owner_reply: null,
      owner_reply_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.reviews.push(review);
  }

  // Reject empty reply
  await assert.rejects(async () => {
    await replyToReview(review.id, '   ');
  }, /empty/);

  // Reject reply > 500 characters
  const tooLong = 'A'.repeat(501);
  await assert.rejects(async () => {
    await replyToReview(review.id, tooLong);
  }, /500/);

  // Accept valid reply and verify persistence
  const validReply = 'Thank you Ahmed Khan for visiting our store! We appreciate your feedback.';
  await replyToReview(review.id, validReply);

  const updatedReviews = await fetchOwnerReviews([review.business_id]);
  const matched = updatedReviews.find((r) => r.id === review.id);
  assert.ok(matched);
  assert.equal(matched.owner_reply, validReply);
  assert.ok(matched.owner_reply_at);
});

test('8. Only approved reviews appear for owner review section', async () => {
  const db = loadDemoDb();
  const testBizId = 'biz-test-reviews';

  db.reviews.push({
    id: 'rev-approved-test',
    business_id: testBizId,
    author_name: 'Ali',
    rating: 5,
    comment: 'Approved comment',
    status: 'approved',
    owner_reply: null,
    owner_reply_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  db.reviews.push({
    id: 'rev-pending-test',
    business_id: testBizId,
    author_name: 'Sara',
    rating: 1,
    comment: 'Pending review',
    status: 'pending',
    owner_reply: null,
    owner_reply_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const ownerRevs = await fetchOwnerReviews([testBizId]);
  assert.equal(ownerRevs.some((r) => r.id === 'rev-approved-test'), true);
  assert.equal(ownerRevs.some((r) => r.id === 'rev-pending-test'), false);

  // Clean up
  db.reviews = db.reviews.filter((r) => r.business_id !== testBizId);
});

test('9. Inquiries workflow: filtered by business, mark read and mark handled update status', async () => {
  const db = loadDemoDb();
  const testBizId = 'biz-inq-test';

  const inq = {
    id: 'inq-test-123',
    business_id: testBizId,
    name: 'Zahid Malik',
    phone: '03011234567',
    message: 'Is wholesale available for rice?',
    status: 'new' as const,
    handled_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.inquiries.push(inq);

  // Filtering by business ID
  const fetched = await fetchOwnerInquiries([testBizId]);
  assert.equal(fetched.length, 1);
  assert.equal(fetched[0].name, 'Zahid Malik');
  assert.equal(fetched[0].status, 'new');

  // Verify phone Call Back URL
  const telUrl = buildTelUrl(fetched[0].phone);
  assert.equal(telUrl, 'tel:+923011234567');

  // Mark Read
  await updateInquiryStatus('inq-test-123', 'read');
  const afterRead = await fetchOwnerInquiries([testBizId]);
  assert.equal(afterRead[0].status, 'read');
  assert.equal(afterRead[0].handled_by, null, 'marking an inquiry read must not assign a handler');

  // Mark Handled
  await updateInquiryStatus('inq-test-123', 'handled', 'user-owner-1');
  const afterHandled = await fetchOwnerInquiries([testBizId]);
  assert.equal(afterHandled[0].status, 'handled');
  assert.equal(afterHandled[0].handled_by, 'user-owner-1');

  // Clean up
  db.inquiries = db.inquiries.filter((i) => i.id !== 'inq-test-123');
});

test('10. Listing editor: 5-step wizard and protected fields preservation', async () => {
  // Step parsing
  assert.equal(STEPS.length, 5);
  assert.equal(parseStepParam('basic'), 'basic');
  assert.equal(parseStepParam('contact'), 'contact');
  assert.equal(parseStepParam('social'), 'contact');
  assert.equal(parseStepParam('location'), 'location');
  assert.equal(parseStepParam('map'), 'location');
  assert.equal(parseStepParam('hours'), 'hours');
  assert.equal(parseStepParam('services'), 'hours');
  assert.equal(parseStepParam('preview'), 'preview');
  assert.equal(parseStepParam('media'), 'preview');

  // Protected fields preservation on business updates
  const db = loadDemoDb();
  const biz = db.businesses[0];
  const originalPlan = biz.plan_code;
  const originalVerified = biz.is_verified;
  const originalFeatured = biz.is_featured;
  const originalOwner = biz.owner_id;

  // Attempt to illegally self-upgrade or self-verify
  const updated = await updateOwnerBusiness(
    biz.id,
    {
      name_en: `${biz.name_en} Updated`,
      plan_code: 'premium' as any,
      is_verified: true,
      is_featured: true,
      owner_id: 'hacker-id',
      status: 'published' as any,
    },
    'user-owner-1'
  );

  // Protected fields MUST remain unchanged
  assert.equal(updated.plan_code, originalPlan);
  assert.equal(updated.is_verified, originalVerified);
  assert.equal(updated.is_featured, originalFeatured);
  assert.equal(updated.owner_id, originalOwner);
});
