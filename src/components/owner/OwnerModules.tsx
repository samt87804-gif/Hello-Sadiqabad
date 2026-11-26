import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Edit2,
  Eye,
  Lock,
  MessageCircle,
  MessageSquareReply,
  Phone,
  Plus,
  Package,
  Pencil,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {
  InquiryRow,
  InquiryStatus,
  NotificationRow,
  OfferRow,
  PlanRow,
  ProductRow,
  ReviewRow,
  SubmissionRow,
} from '../../types/database';
import type { BusinessPublicView, OwnerDashboardStats } from '../../types/directory';
import { formatDateShort } from '../../lib/format';
import { buildTelUrl, buildWhatsAppUrl, formatPkPhoneDisplay, isValidHttpsUrl } from '../../lib/phone';
import { effectivePlanCode } from '../../lib/searchFilter';
import { DemoModeNotice } from '../ui/DemoModeNotice';
import {
  countEffectiveActiveOffers,
  getEffectiveOfferStatus,
  getPakistanDateString,
  getPlanOfferLimit,
} from '../../lib/offers';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/FormFields';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { LineChartSvg } from '../ui/Charts';
import { useToast } from '../ui/Toast';
import { fetchPublicSiteSettings, submitPlanUpgradeRequest } from '../../lib/api';
import { DEFAULT_PLAN_PAYMENT_SETTINGS, type PlanPaymentMethodKey, type PlanPaymentSettings } from '../../lib/siteSettings';

export function ProductCatalogueManager({
  business,
  products,
  requests,
  onSave,
  onDelete,
}: {
  business: BusinessPublicView;
  products: ProductRow[];
  requests: SubmissionRow[];
  onSave: (product: Partial<ProductRow> & { business_id: string; name_en: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { showToast } = useToast();
  const productRequests = requests.filter((request) => request.type === 'owner_product' && request.business_id === business.id).slice(0, 6);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionUr, setDescriptionUr] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    if (products.length >= 2) {
      showToast('Each business can have a maximum of 2 products. Remove one before adding another.', 'error');
      return;
    }
    setEditing(null);
    setNameEn('');
    setNameUr('');
    setDescriptionEn('');
    setDescriptionUr('');
    setPrice('');
    setImageUrl('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (product: ProductRow) => {
    setEditing(product);
    setNameEn(product.name_en);
    setNameUr(product.name_ur ?? '');
    setDescriptionEn(product.description_en ?? '');
    setDescriptionUr(product.description_ur ?? '');
    setPrice(product.price === null ? '' : String(product.price));
    setImageUrl(product.image_url ?? '');
    setIsActive(product.is_active);
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = nameEn.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      showToast('Product name must be between 2 and 120 characters.', 'error');
      return;
    }
    const parsedPrice = price.trim() ? Number(price) : null;
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      showToast('Enter a valid non-negative price in PKR.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...(editing ? { id: editing.id } : {}),
        business_id: business.id,
        name_en: trimmedName,
        name_ur: nameUr.trim() || null,
        description_en: descriptionEn.trim() || null,
        description_ur: descriptionUr.trim() || null,
        price: parsedPrice,
        image_url: imageUrl.trim() || null,
        is_active: isActive,
        sort_order: editing?.sort_order ?? products.length,
      });
      showToast('Product request sent to Admin for approval. It will appear publicly after approval.', 'success');
      setModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Product could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Products Catalogue</h2>
          <p className="text-xs text-on-surface-variant">Add up to 2 products for {business.name_en}. Every change needs Admin approval.</p>
          <p className="font-urdu text-xs text-primary mt-1" dir="rtl">ہر کاروبار کے لیے زیادہ سے زیادہ 2 مصنوعات</p>
        </div>
        <Button onClick={openNew} disabled={products.length >= 2} leftIcon={<Plus className="w-4 h-4" />}>
          Add Product ({products.length}/2)
        </Button>
      </div>

      {productRequests.length > 0 && <Card className="p-4 space-y-2 border border-secondary/30"><h3 className="text-sm font-bold text-on-surface">Product approval requests</h3>{productRequests.map((request)=><div key={request.id} className="flex items-center justify-between gap-3 text-xs border-t border-outline-variant/20 pt-2"><span className="min-w-0 truncate text-on-surface">{String(request.payload.name_en??request.payload.action??'Product change')}</span><Badge variant={request.status==='done'?'success':request.status==='rejected'?'danger':'warning'}>{request.status==='done'?'Approved':request.status==='rejected'?'Rejected':'Awaiting Admin'}</Badge></div>)}</Card>}
      {products.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <Package className="w-9 h-9 mx-auto text-primary" />
          <p className="text-sm font-bold text-on-surface">No products added yet</p>
          <p className="text-xs text-on-surface-variant">Add up to two products to display them on your public business profile.</p>
          <div><Button size="sm" onClick={openNew}>Add your first product</Button></div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((product) => (
            <Card key={product.id} className="p-4 flex flex-col gap-3">
              {product.image_url && (
                <img src={product.image_url} alt={product.name_en} loading="lazy" className="w-full h-36 object-cover rounded-xl bg-surface-container-low" />
              )}
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-on-surface">{product.name_en}</h3>
                <Badge variant={product.is_active ? 'success' : 'neutral'}>{product.is_active ? 'Visible' : 'Hidden'}</Badge>
              </div>
              {product.name_ur && <p className="font-urdu text-sm text-primary" dir="rtl">{product.name_ur}</p>}
              {product.description_en && <p className="text-xs text-on-surface-variant">{product.description_en}</p>}
              {product.price !== null && <p className="text-sm font-bold text-on-surface">{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(product.price)}</p>}
              <div className="flex justify-end gap-2 border-t border-outline-variant/30 pt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(product)} leftIcon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await onSave({ ...product, is_active: !product.is_active });
                      showToast('Product visibility change submitted for Admin approval.', 'success');
                    } catch (error) {
                      showToast(error instanceof Error ? error.message : 'Product status could not be changed.', 'error');
                    }
                  }}
                >
                  {product.is_active ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmDeleteId(product.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        destructive
        title="Delete Product"
        message="A deletion request will be sent to Admin. The product stays visible until the request is approved."
        confirmLabel="Delete Product"
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          try {
            await onDelete(confirmDeleteId);
            showToast('Product deletion request submitted for Admin approval.', 'success');
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Product could not be deleted.', 'error');
          } finally {
            setConfirmDeleteId(null);
          }
        }}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={save} className="space-y-3">
          <Input label="Product Name (English)" required maxLength={120} value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
          <Input label="Product Name (Urdu)" dir="rtl" className="font-urdu" maxLength={120} value={nameUr} onChange={(event) => setNameUr(event.target.value)} />
          <Textarea label="Description (English)" rows={3} value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} />
          <Textarea label="Description (Urdu)" rows={3} value={descriptionUr} onChange={(event) => setDescriptionUr(event.target.value)} />
          <Input label="Price in PKR (optional)" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
          <div className="rounded-xl bg-surface-container-low p-3 space-y-2"><p className="text-xs font-semibold text-on-surface">Product image</p>{imageUrl ? <img src={imageUrl} alt={nameEn || 'Product image'} className="w-full max-h-36 rounded-lg object-cover" /> : <p className="text-xs text-on-surface-variant">Product images are managed by Hello Sadiqabad Admin. Existing images will remain unchanged when you edit product details.</p>}</div>
          <label className="flex items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" />
            Show this product on my public business profile
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function OffersManager({
  business,
  offers,
  requests,
  plan,
  onSaveOffer,
  onDeleteOffer,
}: {
  business: BusinessPublicView;
  offers: OfferRow[];
  requests: SubmissionRow[];
  plan: PlanRow | null;
  onSaveOffer: (
    offer: Partial<OfferRow> & { business_id: string; title: string; valid_from: string; valid_to: string }
  ) => Promise<void>;
  onDeleteOffer: (id: string) => Promise<void>;
}) {
  const { showToast } = useToast();
  const offerRequests = requests.filter((request) => request.type === 'owner_offer' && request.business_id === business.id).slice(0, 6);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<'active' | 'paused'>('active');
  const [editingWasEffectiveActive, setEditingWasEffectiveActive] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const todayStr = getPakistanDateString();
  const [validFrom, setValidFrom] = useState(todayStr);
  const [validTo, setValidTo] = useState('2027-06-30');
  const [saving, setSaving] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effPlan = effectivePlanCode(business.plan_code, business.plan_expires_at);
  const maxOffers = plan?.limits.offers ?? getPlanOfferLimit(plan?.code ?? effPlan);
  const activeCount = countEffectiveActiveOffers(offers, todayStr);
  const isAtLimit = maxOffers === 0 || activeCount >= maxOffers;

  const openNewModal = () => {
    if (isAtLimit) {
      if (maxOffers === 0) {
        showToast('Offers are locked on the Free plan. Upgrade to unlock promotional offers.', 'error');
      } else {
        showToast(`Plan limit of ${maxOffers} active offers reached. Pause an offer or upgrade your plan.`, 'error');
      }
      return;
    }
    setEditingId(null);
    setEditingStatus('active');
    setEditingWasEffectiveActive(false);
    setTitle('');
    setDesc('');
    setImageUrl('');
    setValidFrom(todayStr);
    setValidTo('2027-06-30');
    setModalOpen(true);
  };

  const openEditModal = (offer: OfferRow) => {
    setEditingId(offer.id);
    setEditingStatus(offer.status === 'paused' ? 'paused' : 'active');
    setEditingWasEffectiveActive(getEffectiveOfferStatus(offer, todayStr) === 'active');
    setTitle(offer.title);
    setDesc(offer.description ?? '');
    setImageUrl(offer.image_url ?? '');
    setValidFrom(offer.valid_from.slice(0, 10));
    setValidTo(offer.valid_to.slice(0, 10));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Offer title is required.', 'error');
      return;
    }
    if (validTo < validFrom) {
      showToast('End date must be on or after start date.', 'error');
      return;
    }

    const statusToSave: 'active' | 'paused' = editingId ? editingStatus : 'active';
    const willBeEffectiveActive =
      getEffectiveOfferStatus(
        { status: statusToSave, valid_from: validFrom, valid_to: validTo },
        todayStr
      ) === 'active';

    // Enforce plan limit for new offers AND when extending an expired/upcoming offer into active dates
    if (willBeEffectiveActive && (!editingId || !editingWasEffectiveActive) && isAtLimit) {
      showToast(
        maxOffers === 0
          ? 'Offers are locked on the Free plan. Upgrade to publish offers.'
          : `Cannot activate offer. Plan limit of ${maxOffers} active offers reached.`,
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      // RULE: Creating a new offer defaults to 'active'.
      // RULE: Editing an existing offer must preserve its current status ('active' or 'paused').
      // RULE: Editing a paused or expired offer must not automatically activate it.

      await onSaveOffer({
        id: editingId ?? undefined,
        business_id: business.id,
        title: title.trim(),
        description: desc.trim() || null,
        image_url: imageUrl.trim() || null,
        valid_from: validFrom,
        valid_to: validTo,
        status: statusToSave,
      });

      showToast(
        'Offer request sent to Admin for approval. It will be visible publicly after approval.',
        'success'
      );
      setModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save offer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePauseOffer = async (offer: OfferRow) => {
    setActionInProgressId(offer.id);
    try {
      await onSaveOffer({
        ...offer,
        status: 'paused',
      });
      showToast(`Pause request for "${offer.title}" sent to Admin.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to pause offer.', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleActivateOffer = async (offer: OfferRow) => {
    const toDate = offer.valid_to.slice(0, 10);
    if (toDate < todayStr) {
      showToast('Cannot activate an expired offer. Please edit valid dates first.', 'error');
      return;
    }

    if (activeCount >= maxOffers) {
      showToast(
        `Active offer limit (${maxOffers}) reached. Upgrade your plan or pause an active offer first.`,
        'error'
      );
      return;
    }

    setActionInProgressId(offer.id);
    try {
      await onSaveOffer({
        ...offer,
        status: 'active',
      });
      showToast(`Activation request for "${offer.title}" sent to Admin.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to activate offer.', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Plan Summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Promotional Offers</h2><p className="text-xs text-on-surface-variant">New offers and all changes are reviewed by Admin before going live.</p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-bold text-primary tabular-nums">{activeCount}</span> /{' '}
            <span className="tabular-nums">{maxOffers}</span> active offers used on your current plan
          </p>
        </div>
        <Button
          disabled={isAtLimit}
          onClick={openNewModal}
          leftIcon={maxOffers === 0 ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        >
          {maxOffers === 0 ? 'Upgrade to Unlock Offers' : 'New Offer'}
        </Button>
      </div>

      {offerRequests.length > 0 && <Card className="p-4 space-y-2 border border-secondary/30"><h3 className="text-sm font-bold text-on-surface">Offer approval requests</h3>{offerRequests.map((request)=><div key={request.id} className="flex items-center justify-between gap-3 text-xs border-t border-outline-variant/20 pt-2"><span className="min-w-0 truncate text-on-surface">{String(request.payload.title??request.payload.action??'Offer change')}</span><Badge variant={request.status==='done'?'success':request.status==='rejected'?'danger':'warning'}>{request.status==='done'?'Approved':request.status==='rejected'?'Rejected':'Awaiting Admin'}</Badge></div>)}</Card>}
      {/* Plan Limit Notifications */}
      {maxOffers === 0 ? (
        <Card className="p-4 bg-tertiary-container/25 border border-tertiary/30 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-tertiary" /> Promotional Offers Locked on Free Plan
            </p>
            <p className="text-xs text-on-surface-variant">
              Upgrade to Basic (2 active offers) or Premium (10 active offers) to promote deals in Sadiqabad.
            </p>
          </div>
          <Link to="/owner/plan">
            <Button size="sm" variant="secondary" leftIcon={<Crown className="w-3.5 h-3.5" />}>
              Upgrade Plan
            </Button>
          </Link>
        </Card>
      ) : activeCount >= maxOffers ? (
        <Card className="p-4 bg-secondary-container/25 border border-secondary/30 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-secondary" /> Plan Limit Reached ({activeCount} / {maxOffers} active offers)
            </p>
            <p className="text-xs text-on-surface-variant">
              You are using all active offers allowed on your plan. Expired and paused offers do not count against this limit.
            </p>
          </div>
          <Link to="/owner/plan">
            <Button size="sm" variant="secondary" leftIcon={<Crown className="w-3.5 h-3.5" />}>
              Upgrade for More Offers
            </Button>
          </Link>
        </Card>
      ) : null}

      {offers.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant space-y-2">
          <p>No promotional offers created yet.</p>
          <p className="text-xs text-outline">
            Create special deals, Eid sales, or discount coupons to attract shoppers in Sadiqabad.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const effState = getEffectiveOfferStatus(offer, todayStr);
            const isPaused = offer.status === 'paused';
            const isExpired = effState === 'expired';
            const isUpcoming = effState === 'upcoming';
            const isActive = effState === 'active';

            return (
              <Card key={offer.id} className="p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Clear Status Badges */}
                    {isPaused ? (
                      <Badge variant="neutral">Paused</Badge>
                    ) : isExpired ? (
                      <Badge variant="danger">Expired</Badge>
                    ) : isUpcoming ? (
                      <Badge variant="warning">Upcoming (from {formatDateShort(offer.valid_from)})</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}

                    <span className="text-xs text-on-surface-variant tabular-nums flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-outline" /> Till {formatDateShort(offer.valid_to)}
                    </span>
                  </div>

                  {offer.image_url && (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="w-full h-28 object-cover rounded-xl mt-2.5 border border-outline-variant/30"
                    />
                  )}
                  <h3 className="text-base font-bold text-on-surface mt-2">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-xs text-on-surface-variant mt-1">{offer.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/25 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(offer)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>

                  {/* Intentional Separate Actions for Pause & Activate */}
                  {isPaused ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={actionInProgressId === offer.id}
                      onClick={() => handleActivateOffer(offer)}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={actionInProgressId === offer.id}
                      onClick={() => handlePauseOffer(offer)}
                    >
                      Pause
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmDeleteId(offer.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        destructive
        title="Delete Promotional Offer"
        message="Are you sure you want to permanently remove this promotional offer from your listing?"
        confirmLabel="Delete Offer"
        onConfirm={async () => {
          if (confirmDeleteId) {
            try {
              await onDeleteOffer(confirmDeleteId);
              showToast('Offer deletion request sent to Admin for approval.', 'info');
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Failed to delete offer.', 'error');
            }
            setConfirmDeleteId(null);
          }
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Promotional Offer' : 'Create Offer / Deal'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Offer Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Flat 10% OFF on Winter Checkup"
          />
          <Textarea
            label="Offer Description"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="rounded-xl bg-surface-container-low p-3 space-y-2"><p className="text-xs font-semibold text-on-surface">Offer banner image</p>{imageUrl ? <img src={imageUrl} alt={title || 'Offer banner'} className="w-full max-h-36 rounded-lg object-cover" /> : <p className="text-xs text-on-surface-variant">Offer images are managed by Hello Sadiqabad Admin. Existing images will remain unchanged when you edit offer details.</p>}</div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valid From"
              type="date"
              required
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
            <Input
              label="Valid To"
              type="date"
              required
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>

          {editingId && (() => {
            const modalEffStatus = getEffectiveOfferStatus(
              { status: editingStatus, valid_from: validFrom, valid_to: validTo },
              todayStr
            );
            return (
              <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex items-center justify-between">
                <span>Current Status (preserved on save):</span>
                <Badge
                  variant={
                    modalEffStatus === 'active'
                      ? 'success'
                      : modalEffStatus === 'expired'
                      ? 'danger'
                      : modalEffStatus === 'upcoming'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {modalEffStatus.toUpperCase()}
                </Badge>
              </div>
            );
          })()}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Save Changes' : 'Publish Offer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function ReviewsReply({
  reviews,
  onReply,
}: {
  reviews: ReviewRow[];
  onReply: (reviewId: string, reply: string) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const send = async (id: string) => {
    const text = (drafts[id] ?? '').trim();
    if (!text) {
      showToast('Reply text cannot be empty.', 'error');
      return;
    }
    if (text.length > 500) {
      showToast('Reply must be 500 characters or fewer.', 'error');
      return;
    }
    setSendingId(id);
    try {
      await onReply(id, text);
      showToast('Reply published successfully!', 'success');
      setEditingId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to publish reply.', 'error');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Customer Reviews ({reviews.length})</h2>
          <p className="text-xs text-on-surface-variant">
            Only approved public reviews for your selected business appear here.
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-6 text-center text-sm text-on-surface-variant">
          No approved reviews yet for this listing.
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => {
            const isEditing = !rev.owner_reply || editingId === rev.id;
            const draftVal = drafts[rev.id] ?? (editingId === rev.id ? rev.owner_reply ?? '' : '');
            return (
              <Card key={rev.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-sm text-on-surface">{rev.author_name}</span>
                    <span className="text-xs text-on-surface-variant ms-2">
                      {formatDateShort(rev.created_at)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> {rev.rating}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">{rev.comment}</p>

                {rev.owner_reply && !isEditing ? (
                  <div className="p-3 rounded-xl bg-primary-fixed/30 text-xs flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-primary">Owner Reply:</span>{' '}
                      <span>{rev.owner_reply}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDrafts((p) => ({ ...p, [rev.id]: rev.owner_reply ?? '' }));
                        setEditingId(rev.id);
                      }}
                      leftIcon={<Edit2 className="w-3 h-3" />}
                    >
                      Edit Reply
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={500}
                        placeholder="Write a polite, professional reply to this customer (max 500 chars)..."
                        value={draftVal}
                        onChange={(e) => setDrafts((p) => ({ ...p, [rev.id]: e.target.value }))}
                        className="flex-1 min-h-[40px] px-3 rounded-xl border border-outline-variant/60 bg-surface text-sm focus:border-primary focus:outline-none"
                      />
                      {editingId === rev.id && rev.owner_reply && (
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        loading={sendingId === rev.id}
                        onClick={() => send(rev.id)}
                        leftIcon={<MessageSquareReply className="w-3.5 h-3.5" />}
                      >
                        {rev.owner_reply ? 'Update' : 'Reply'}
                      </Button>
                    </div>
                    <div className="text-[10px] text-on-surface-variant text-end tabular-nums">
                      {draftVal.length} / 500 characters
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function InquiriesInbox({
  inquiries,
  onStatusChange,
}: {
  inquiries: InquiryRow[];
  onStatusChange: (id: string, status: InquiryStatus) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRow | null>(null);

  const handleMarkRead = async (inq: InquiryRow) => {
    try {
      await onStatusChange(inq.id, 'read');
      showToast('Inquiry marked as read.', 'info');
      if (selectedInquiry?.id === inq.id) {
        setSelectedInquiry({ ...selectedInquiry, status: 'read' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update inquiry status.', 'error');
    }
  };

  const handleMarkHandled = async (inq: InquiryRow) => {
    try {
      await onStatusChange(inq.id, 'handled');
      showToast('Inquiry marked as handled.', 'success');
      if (selectedInquiry?.id === inq.id) {
        setSelectedInquiry({ ...selectedInquiry, status: 'handled' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update inquiry status.', 'error');
    }
  };

  const handleCallBack = (inq: InquiryRow) => {
    if (inq.status === 'new') {
      onStatusChange(inq.id, 'read').catch(() => {});
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Customer Inquiries ({inquiries.length})</h2>
          <p className="text-xs text-on-surface-variant">
            Direct phone inquiries and WhatsApp leads submitted by visitors.
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant space-y-1">
          <p>No customer inquiries received yet for this listing.</p>
          <p className="text-xs text-outline">
            Inquiries sent through your listing&apos;s contact forms will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card
              key={inq.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                inq.status === 'new'
                  ? 'border-s-4 border-s-secondary-container bg-surface-container-low/40'
                  : ''
              }`}
            >
              <div
                className="space-y-1 flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  setSelectedInquiry(inq);
                  if (inq.status === 'new') {
                    handleMarkRead(inq);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-on-surface">{inq.name}</span>
                  <span dir="ltr" className="text-xs font-bold text-primary tabular-nums">
                    {formatPkPhoneDisplay(inq.phone)}
                  </span>
                  <Badge
                    variant={
                      inq.status === 'new'
                        ? 'warning'
                        : inq.status === 'handled'
                        ? 'success'
                        : 'neutral'
                    }
                  >
                    {inq.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-2">{inq.message}</p>
                <p className="text-[11px] text-outline flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDateShort(inq.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  className="sm:hidden"
                  onClick={() => {
                    setSelectedInquiry(inq);
                    if (inq.status === 'new') handleMarkRead(inq);
                  }}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Details
                </Button>

                <a
                  href={buildTelUrl(inq.phone)}
                  onClick={() => handleCallBack(inq)}
                  className="min-h-[36px] px-3 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1 hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Back
                </a>

                <a
                  href={buildWhatsAppUrl(
                    inq.phone,
                    `Assalam-o-Alaikum ${inq.name}, replying to your inquiry on Hello Sadiqabad.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleCallBack(inq)}
                  className="min-h-[36px] px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-[#20ba59] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>

                {inq.status === 'new' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkRead(inq)}
                  >
                    Mark Read
                  </Button>
                )}

                {inq.status !== 'handled' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarkHandled(inq)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Handled
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile List-to-Detail Dialog */}
      <Modal
        open={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        title="Customer Inquiry Details"
      >
        {selectedInquiry && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="text-base font-bold text-on-surface">{selectedInquiry.name}</h3>
                <p dir="ltr" className="text-xs text-primary font-bold">
                  {formatPkPhoneDisplay(selectedInquiry.phone)}
                </p>
              </div>
              <Badge
                variant={
                  selectedInquiry.status === 'new'
                    ? 'warning'
                    : selectedInquiry.status === 'handled'
                    ? 'success'
                    : 'neutral'
                }
              >
                {selectedInquiry.status.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant">Customer Message:</label>
              <div className="p-3.5 rounded-xl bg-surface-container-low text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                {selectedInquiry.message}
              </div>
              <p className="text-[11px] text-outline text-end pt-1">
                Received on {formatDateShort(selectedInquiry.created_at)}
              </p>
            </div>

            <div className="pt-2 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={buildTelUrl(selectedInquiry.phone)}
                  onClick={() => handleCallBack(selectedInquiry)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4" /> Call Back
                </a>
                <a
                  href={buildWhatsAppUrl(
                    selectedInquiry.phone,
                    `Assalam-o-Alaikum ${selectedInquiry.name}, replying to your inquiry on Hello Sadiqabad.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleCallBack(selectedInquiry)}
                  className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>

              <div className="flex items-center gap-2">
                {selectedInquiry.status === 'new' && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkRead(selectedInquiry)}>
                    Mark Read
                  </Button>
                )}
                {selectedInquiry.status !== 'handled' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarkHandled(selectedInquiry)}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Handled
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function OwnerAnalytics({
  stats,
  isFullAnalytics,
  days = 30,
  onDaysChange,
}: {
  stats: OwnerDashboardStats;
  isFullAnalytics: boolean;
  days?: 7 | 30 | 90;
  onDaysChange?: (next: 7 | 30 | 90) => void;
}) {
  return (
    <div className="space-y-4">
      <DemoModeNotice
        variant="sample-data"
        contextLabelEn="Sample Preview Analytics: Engagement trends and top search terms include seeded demo figures in this browser."
        contextLabelUr="نمونہ پیش نظارہ شماریات: مصروفیت کے ٹرینڈز اور سرچ اصطلاحات اس براؤزر کے ڈیمو ڈیٹا پر مبنی ہیں۔"
      />
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-on-surface">Profile Engagement Trends</h3>
            {!isFullAnalytics && <Badge variant="warning">Summary (Upgrade for Full)</Badge>}
          </div>
          {onDaysChange && (
            <div className="inline-flex rounded-xl bg-surface-container-low p-1 gap-1" role="group" aria-label="Date range">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    days === d
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>
        <LineChartSvg
          data={stats.series}
          series={[
            { key: 'views', label: 'Views', color: '#006948' },
            { key: 'calls', label: 'Calls', color: '#904d00' },
            { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
          ]}
        />
      </Card>

      {isFullAnalytics && (
        <Card className="p-5">
          <h3 className="text-base font-bold text-on-surface mb-3">Top Search Terms Finding You</h3>
          <div className="space-y-2">
            {stats.top_search_terms.map((t) => (
              <div
                key={t.query}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-surface-container-low"
              >
                <span className="font-medium text-on-surface">“{t.query}”</span>
                <span className="font-bold text-primary tabular-nums">{t.count} searches</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function PlanCard({ business, plans, requests, onReload }: { business: BusinessPublicView; plans: PlanRow[]; requests: SubmissionRow[]; onReload: () => Promise<void> }) {
  const { showToast } = useToast();
  const [paymentSettings, setPaymentSettings] = useState<PlanPaymentSettings>(DEFAULT_PLAN_PAYMENT_SETTINGS);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PlanPaymentMethodKey>('jazzcash');
  const [transactionReference, setTransactionReference] = useState('');
  const [ownerConfirmedPaid, setOwnerConfirmedPaid] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [sending, setSending] = useState(false);
  const effCode = effectivePlanCode(business.plan_code, business.plan_expires_at);
  const planRequests = requests.filter((request) => request.type === 'plan_upgrade' && request.business_id === business.id).sort((a,b) => Date.parse(b.created_at)-Date.parse(a.created_at));
  const pendingRequest = planRequests.find((request) => request.status === 'new' || request.status === 'in_review');
  useEffect(() => { let active=true; void fetchPublicSiteSettings().then((settings)=>{if(active)setPaymentSettings(settings.plan_payment_methods);}).catch(()=>{if(active)showToast('Payment account details could not be loaded. Please refresh the page.','error');}); return ()=>{active=false;}; },[showToast]);
  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault(); if(!selectedPlan||!ownerConfirmedPaid||transactionReference.trim().length<4)return; setSending(true);
    try { await submitPlanUpgradeRequest({businessId:business.id,requestedPlan:selectedPlan,paymentMethod,transactionReference:transactionReference.trim(),ownerConfirmedPaid,note:requestNote}); showToast('Payment request Admin ko bhej di gayi hai. Plan payment verification ke baad activate hoga.','success'); setSelectedPlan(null);setTransactionReference('');setOwnerConfirmedPaid(false);setRequestNote('');await onReload(); }
    catch(error){showToast(error instanceof Error?error.message:'Plan payment request send nahi ho saki.','error');} finally{setSending(false);}
  };
  const selectedMethod=paymentSettings.methods[paymentMethod];
  const methodKeys:PlanPaymentMethodKey[]=['jazzcash','easypaisa','ubl'];
  return <div className="space-y-5">
    <Card className="p-5 bg-primary text-on-primary"><div className="flex items-center justify-between gap-4 flex-wrap"><div><span className="text-xs uppercase tracking-wider opacity-85 font-bold">Current Plan</span><h2 className="text-2xl font-extrabold flex items-center gap-2 mt-0.5"><Crown className="w-6 h-6 text-secondary-container"/><span className="uppercase">{effCode}</span></h2>{business.plan_expires_at&&effCode!=='free'&&<div className="text-xs opacity-90 mt-1 space-y-0.5"><p>Valid until {formatDateShort(business.plan_expires_at)}</p><p>{Math.max(0,Math.ceil((Date.parse(business.plan_expires_at)-Date.now())/86400000))} days remaining</p></div>}</div><Badge variant="gold">{business.is_verified?'Verified Badge Active':'Unverified'}</Badge></div></Card>
    {pendingRequest&&<Card className="p-4 border border-secondary/40 bg-secondary/5 space-y-1"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-secondary"/><strong className="text-sm">Plan payment request under Admin review</strong></div><p className="text-xs text-on-surface-variant">Aap ki {String((pendingRequest.payload as Record<string,unknown>).requested_plan??'').toUpperCase()} request pending hai. Admin verification se pehle dobara request na bhejein.</p><p className="text-[11px] text-on-surface-variant">Request ID: {pendingRequest.id} · Sent: {formatDateShort(pendingRequest.created_at)}</p></Card>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{plans.map((p)=>{const isCurrent=p.code===effCode;const isDowngrade=effCode==='premium'&&p.code==='basic';return <Card key={p.id} className={'p-5 flex flex-col justify-between gap-4 '+(isCurrent?'ring-2 ring-primary':'')}><div className="space-y-2"><div className="flex items-center justify-between"><h3 className="text-base font-bold text-on-surface">{p.name_en}</h3>{isCurrent&&<Badge variant="primary">Current plan</Badge>}</div><p className="font-urdu text-xs text-primary" dir="rtl">{p.name_ur}</p><p className="text-sm font-bold text-on-surface">{p.price_note}</p>
      <ul className="space-y-1 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/25"><li>• Photos: {p.limits.max_photos}</li><li>• Videos: {p.limits.max_videos}</li><li>• Active Offers: {p.limits.offers}</li><li>• Social Links: {p.limits.social_links>=999?'Unlimited':p.limits.social_links}</li><li>• WhatsApp Button: {p.features.whatsapp?'Included':'Not included'}</li><li>• Website URL: {(p.features.website_url??p.code!=='free')?'Included':'Not included'}</li><li>• Cover Image: {p.features.cover?'Included':'Not included'}</li><li>• Photo Gallery: {p.features.gallery?'Included':'Not included'}</li><li>• Verified Badge: {p.features.verified_badge?'Included':'Not included'}</li><li>• QR Code: {p.features.qr?'Included':'Not included'}</li><li>• Inquiry Button: {p.features.inquiry?'Included':'Not included'}</li><li>• Full Analytics: {p.features.analytics_full?'Included':'Not included'}</li><li>• Search Priority: Tier {p.limits.search_priority}</li></ul></div>
      {p.code!=='free'&&!isDowngrade&&<Button variant="secondary" disabled={Boolean(pendingRequest)} onClick={()=>{setSelectedPlan(p.code as 'basic'|'premium');setPaymentMethod('jazzcash');}} leftIcon={<Send className="w-3.5 h-3.5"/>}>{isCurrent?'Renew '+p.name_en:'Choose '+p.name_en}</Button>}</Card>;})}</div>
    {planRequests.length>0&&<Card className="p-4 space-y-3"><h3 className="text-sm font-bold">Plan Request History</h3>{planRequests.slice(0,5).map((request)=>{const payload=request.payload as Record<string,unknown>;const statusLabel=request.status==='done'?'Approved & Active':request.status==='rejected'?'Rejected':'Waiting for Admin';return <div key={request.id} className="rounded-xl bg-surface-container-low p-3 text-xs space-y-1"><div className="flex items-center justify-between gap-2 flex-wrap"><strong>{String(payload.requested_plan??'').toUpperCase()} · Rs. {Number(payload.monthly_amount_pkr??0).toLocaleString('en-PK')}</strong><Badge variant={request.status==='done'?'success':request.status==='rejected'?'danger':'warning'}>{statusLabel}</Badge></div><p className="text-on-surface-variant">Submitted {formatDateShort(request.created_at)} · Reference: {String(payload.transaction_reference??'—')}</p>{typeof payload.plan_expires_at==='string'&&<p className="font-semibold text-primary">Valid until {formatDateShort(payload.plan_expires_at)}</p>}{request.admin_note&&<p className="text-error">Admin note: {request.admin_note}</p>}</div>;})}</Card>}
    <Modal open={Boolean(selectedPlan)} onClose={()=>{if(!sending)setSelectedPlan(null);}} title="Plan Payment & Confirmation" maxWidthClass="max-w-2xl">{selectedPlan&&<form onSubmit={submitRequest} className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3"><p className="text-sm font-bold">{selectedPlan.toUpperCase()} Plan</p><p className="text-xl font-extrabold text-primary">Rs. {selectedPlan==='basic'?'700':'1,500'} / month</p><p className="text-xs text-on-surface-variant">Transfer the exact amount. Your plan will start only after Admin verifies the payment.</p></div>
      <p className="text-xs text-on-surface-variant">{paymentSettings.instructions_en}</p><p className="font-urdu text-xs text-on-surface-variant" dir="rtl">{paymentSettings.instructions_ur}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{methodKeys.map((key)=>{const method=paymentSettings.methods[key];const active=paymentMethod===key;return <button key={key} type="button" onClick={()=>setPaymentMethod(key)} className={'rounded-xl border p-3 text-left space-y-2 '+(active?'border-primary bg-primary/5 ring-1 ring-primary':'border-outline-variant hover:border-primary/50')}><div className="flex items-center gap-2">{method.icon_url?<img src={method.icon_url} alt="" className="w-8 h-8 rounded-lg object-contain"/>:<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-xs font-bold">{key==='ubl'?'UBL':key==='jazzcash'?'JC':'EP'}</span>}<strong className="text-xs">{method.label}</strong></div><span className="text-[10px] text-on-surface-variant">{active?'Selected payment method':'Select this method'}</span></button>;})}</div>
      <div className="rounded-xl border border-outline-variant/50 p-3 space-y-1"><div className="flex items-center gap-2">{selectedMethod.icon_url&&<img src={selectedMethod.icon_url} alt="" className="w-7 h-7 rounded object-contain"/>}<strong className="text-sm">{selectedMethod.label}</strong></div><p className="text-xs">Account Title: <strong>{selectedMethod.account_title}</strong></p><p className="text-xs">Account Number: <strong dir="ltr">{selectedMethod.account_number}</strong></p>{selectedMethod.iban&&<p className="text-xs">IBAN: <strong dir="ltr">{selectedMethod.iban}</strong></p>}</div>
      <Input label="Transaction / Payment Reference Number" required minLength={4} maxLength={120} value={transactionReference} onChange={(event)=>setTransactionReference(event.target.value)} placeholder="Enter the receipt / transaction reference"/>
      <Textarea label="Optional payment note" rows={2} value={requestNote} onChange={(event)=>setRequestNote(event.target.value)} placeholder="Any extra detail for Admin"/>
      <label className="flex items-start gap-2 rounded-xl border border-outline-variant/50 p-3 text-xs"><input type="checkbox" checked={ownerConfirmedPaid} onChange={(event)=>setOwnerConfirmedPaid(event.target.checked)} className="mt-0.5 accent-primary"/><span><strong>I confirm that I have paid the full amount.</strong><br/>Admin will independently verify the payment before activating this plan.</span></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={sending} onClick={()=>setSelectedPlan(null)}>Cancel</Button><Button type="submit" loading={sending} disabled={!ownerConfirmedPaid||transactionReference.trim().length<4}>Send Payment Request</Button></div>
    </form>}</Modal>
  </div>;
}

export function NotificationsList({
  items,
  onMarkAllRead,
}: {
  items: NotificationRow[];
  onMarkAllRead: () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-on-surface">Notifications ({items.length})</h2>
        {items.some((n) => !n.is_read) && (
          <Button size="sm" variant="outline" onClick={onMarkAllRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="p-6 text-center text-sm text-on-surface-variant">
          No notifications yet.
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`p-4 flex items-start justify-between gap-3 ${
                !n.is_read ? 'border-s-4 border-s-primary bg-surface-container-low/50' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">{n.title_en}</span>
                  {!n.is_read && <Badge variant="primary">New</Badge>}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{n.body_en}</p>
                <span className="text-[11px] text-outline mt-1 block">
                  {formatDateShort(n.created_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
