import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Plus,
  Search,
  ShieldAlert,
  Star,
  XCircle,
} from 'lucide-react';
import type {
  AreaRow,
  BusinessNoteRow,
  BusinessRow,
  BusinessStatus,
  CategoryRow,
  InquiryRow,
  InquiryStatus,
  OpeningHoursJson,
  PlanCode,
  ProfileRow,
  ReviewRow,
  StaffMemberRow,
  SubmissionRow,
} from '../../types/database';
import type { AdminDashboardCounts, BusinessPublicView } from '../../types/directory';
import { formatDateShort } from '../../lib/format';
import { isValidHttpsUrl } from '../../lib/phone';
import {
  addBusinessNote,
  adminUpsertBusiness,
  bulkUpdateBusinesses,
  fetchBusinessNotes,
  findDuplicateBusinesses,
  moderateReview,
  reviewSubmission,
  updateInquiryStatus,
} from '../../lib/api';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { Tabs } from '../ui/DataDisplay';
import { useToast } from '../ui/Toast';
import { HoursEditor } from '../owner/HoursEditor';
import { LocationPicker } from '../owner/LocationPicker';
import { UrlListEditor } from '../owner/UrlListEditor';
import { DemoModeNotice } from '../ui/DemoModeNotice';

export function AdminDashboard({ counts }: { counts: AdminDashboardCounts }) {
  const cards = [
    {
      label: 'Published Listings',
      value: counts.published_businesses,
      to: '/admin/businesses',
      tone: 'primary',
    },
    {
      label: 'Pending Businesses',
      value: counts.pending_businesses,
      to: '/admin/businesses',
      tone: counts.pending_businesses > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Pending Reviews',
      value: counts.pending_reviews,
      to: '/admin/moderation',
      tone: counts.pending_reviews > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Visitor Submissions / Claims',
      value: counts.new_submissions,
      to: '/admin/moderation',
      tone: counts.new_submissions > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Open Sales Leads',
      value: counts.open_leads,
      to: '/admin/leads',
      tone: 'primary',
    },
    {
      label: 'Expiring Plans (≤14d)',
      value: counts.expiring_plans,
      to: '/admin/plans',
      tone: counts.expiring_plans > 0 ? 'danger' : 'neutral',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
          Operations Command Overview
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Moderation queue, Sadiqabad listing health, and onboarding pipeline
        </p>
      </div>

      <DemoModeNotice
        variant="sample-data"
        contextLabelEn="Preview / Sample Data: Counts, queue items, leads, and audit records reflect local browser demo data."
        contextLabelUr="پیش نظارہ / نمونہ ڈیٹا: گنتی، قطار کے آئٹمز اور ریکارڈز مقامی براؤزر ڈیمو ڈیٹا پر مبنی ہیں۔"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="block group">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  {c.label}
                </span>
                {c.value > 0 && c.tone === 'warning' && (
                  <AlertCircle className="w-4 h-4 text-secondary" />
                )}
              </div>
              <p className="text-3xl font-extrabold text-on-surface mt-2 tabular-nums group-hover:text-primary transition-colors">
                {c.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface AdminBusinessForm {
  name_en: string;
  name_ur: string;
  phone_primary: string;
  whatsapp: string;
  category_id: string;
  area_id: string;
  address_en: string;
  address_ur: string;
  landmark_en: string;
  description_en: string;
  lat: number | null;
  lng: number | null;
  opening_hours: OpeningHoursJson;
  is_open_24h: boolean;
  home_delivery: boolean;
  logo_url: string;
  cover_url: string;
  gallery_urls: string[];
  status: BusinessStatus;
  rejection_reason: string;
  plan_code: PlanCode;
  is_verified: boolean;
  is_featured: boolean;
}

const STATUS_BADGE_VARIANT: Record<BusinessStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  published: 'success',
  pending_approval: 'warning',
  rejected: 'danger',
  suspended: 'danger',
  draft: 'neutral',
  archived: 'neutral',
};

export function BusinessManager({
  businesses,
  categories,
  areas,
  profiles = [],
  actorId,
  canPublish,
  initialSearch = '',
  onReload,
}: {
  businesses: BusinessPublicView[];
  categories: CategoryRow[];
  areas: AreaRow[];
  profiles?: Array<ProfileRow & { email?: string; is_active?: boolean; staff?: StaffMemberRow | null }>;
  actorId: string;
  canPublish: boolean;
  initialSearch?: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState(categories[0]?.id ?? '');
  const [bulkAreaId, setBulkAreaId] = useState(areas[0]?.id ?? '');
  const [bulkStaffId, setBulkStaffId] = useState('');
  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false);
  const [confirmSuspendBiz, setConfirmSuspendBiz] = useState<BusinessPublicView | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'core' | 'location' | 'hours' | 'media'>('core');
  const [editing, setEditing] = useState<BusinessPublicView | null>(null);
  const [notesModalBiz, setNotesModalBiz] = useState<BusinessPublicView | null>(null);
  const [notes, setNotes] = useState<BusinessNoteRow[]>([]);
  const [newNote, setNewNote] = useState('');
  const [duplicates, setDuplicates] = useState<BusinessRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const staffAssignees = profiles.filter((p) => p.role === 'staff' || p.role === 'super_admin');

  const emptyForm = (): AdminBusinessForm => ({
    name_en: '',
    name_ur: '',
    phone_primary: '',
    whatsapp: '',
    category_id: categories[0]?.id ?? '',
    area_id: areas[0]?.id ?? '',
    address_en: '',
    address_ur: '',
    landmark_en: '',
    description_en: '',
    lat: null,
    lng: null,
    opening_hours: {},
    is_open_24h: false,
    home_delivery: false,
    logo_url: '',
    cover_url: '',
    gallery_urls: [],
    status: canPublish ? 'published' : 'draft',
    rejection_reason: '',
    plan_code: 'free',
    is_verified: false,
    is_featured: false,
  });

  const [form, setForm] = useState<AdminBusinessForm>(emptyForm);

  const filtered = businesses.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.name_en.toLowerCase().includes(q) ||
        (b.name_ur ?? '').includes(q) ||
        b.phone_primary.includes(q) ||
        (b.area?.name_en ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((b) => selectedIds.includes(b.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runBulk = async (
    patch: Partial<Pick<BusinessRow, 'status' | 'category_id' | 'area_id' | 'assigned_to' | 'is_verified'>>,
    label: string
  ) => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await bulkUpdateBusinesses(selectedIds, patch, actorId);
      showToast(`Applied "${label}" to ${selectedIds.length} listings.`, 'success');
      setSelectedIds([]);
      await onReload();
    } finally {
      setBulkBusy(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDuplicates([]);
    setModalTab('core');
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (b: BusinessPublicView) => {
    setEditing(b);
    setDuplicates([]);
    setModalTab('core');
    setForm({
      name_en: b.name_en,
      name_ur: b.name_ur ?? '',
      phone_primary: b.phone_primary,
      whatsapp: b.whatsapp ?? '',
      category_id: b.category_id,
      area_id: b.area_id ?? '',
      address_en: b.address_en ?? '',
      address_ur: b.address_ur ?? '',
      landmark_en: b.landmark_en ?? '',
      description_en: b.description_en ?? '',
      lat: b.lat,
      lng: b.lng,
      opening_hours: b.opening_hours ?? {},
      is_open_24h: b.is_open_24h,
      home_delivery: b.home_delivery,
      logo_url: b.logo_url ?? '',
      cover_url: b.cover_url ?? '',
      gallery_urls: b.gallery_urls ?? [],
      status: b.status,
      rejection_reason: b.rejection_reason ?? '',
      plan_code: b.plan_code,
      is_verified: b.is_verified,
      is_featured: b.is_featured,
    });
    setModalOpen(true);
  };

  const checkDuplicates = async () => {
    const found = await findDuplicateBusinesses(form.phone_primary, form.name_en, form.area_id);
    setDuplicates(found.filter((d) => d.id !== editing?.id));
    if (found.length === 0) showToast('No duplicates found in directory.', 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.logo_url.trim() && !isValidHttpsUrl(form.logo_url.trim())) {
      showToast('Logo URL must start with https://', 'error');
      setModalTab('media');
      return;
    }
    if (form.cover_url.trim() && !isValidHttpsUrl(form.cover_url.trim())) {
      showToast('Cover URL must start with https://', 'error');
      setModalTab('media');
      return;
    }
    setSaving(true);
    try {
      await adminUpsertBusiness(
        {
          id: editing?.id,
          ...form,
          name_ur: form.name_ur || null,
          whatsapp: form.whatsapp || null,
          area_id: form.area_id || null,
          address_en: form.address_en || null,
          address_ur: form.address_ur || null,
          landmark_en: form.landmark_en || null,
          description_en: form.description_en || null,
          rejection_reason:
            form.status === 'rejected' ? form.rejection_reason.trim() || null : null,
          logo_url: form.logo_url.trim() || null,
          cover_url: form.cover_url.trim() || null,
        },
        actorId
      );
      showToast(editing ? 'Business updated!' : 'Business created!', 'success');
      setModalOpen(false);
      await onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (b: BusinessPublicView, nextStatus: BusinessStatus) => {
    await adminUpsertBusiness(
      { id: b.id, name_en: b.name_en, phone_primary: b.phone_primary, category_id: b.category_id, status: nextStatus },
      actorId
    );
    showToast(`Status set to ${nextStatus}`, 'success');
    await onReload();
  };

  const toggleVerified = async (b: BusinessPublicView) => {
    await adminUpsertBusiness(
      {
        id: b.id,
        name_en: b.name_en,
        phone_primary: b.phone_primary,
        category_id: b.category_id,
        is_verified: !b.is_verified,
      },
      actorId
    );
    await onReload();
  };

  const openNotes = async (b: BusinessPublicView) => {
    setNotesModalBiz(b);
    const list = await fetchBusinessNotes(b.id);
    setNotes(list);
  };

  const handleAddNote = async () => {
    if (!notesModalBiz || !newNote.trim()) return;
    await addBusinessNote(notesModalBiz.id, actorId, newNote);
    setNewNote('');
    setNotes(await fetchBusinessNotes(notesModalBiz.id));
    showToast('Internal note saved.', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-on-surface">
          Businesses Directory ({filtered.length})
        </h2>
        <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Add Business
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, area..."
          leftAdornment={<Search className="w-4 h-4" />}
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="draft">Draft</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </Select>
        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant cursor-pointer px-3 py-2.5 rounded-xl bg-surface-container-low">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-primary"
          />
          <span>Select All Filtered ({filtered.length})</span>
        </label>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && canPublish && (
        <div className="p-3.5 rounded-2xl bg-primary-fixed/40 border border-primary/25 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-primary">
              {selectedIds.length} listing(s) selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" loading={bulkBusy} onClick={() => runBulk({ status: 'published' }, 'Publish')}>
                Bulk Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={bulkBusy}
                onClick={() => runBulk({ status: 'draft' }, 'Move to Draft')}
              >
                Unpublish
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={bulkBusy}
                onClick={() => setConfirmBulkArchive(true)}
              >
                Bulk Archive
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={bulkBusy}
                onClick={() => runBulk({ is_verified: true }, 'Verify')}
              >
                Bulk Verify
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={bulkBusy}
                onClick={() => runBulk({ is_verified: false }, 'Unverify')}
              >
                Unverify
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-primary/15">
            <div className="flex items-center gap-1.5">
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                aria-label="Bulk change category"
                className="flex-1 h-9 px-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={!bulkCategoryId || bulkBusy}
                onClick={() => runBulk({ category_id: bulkCategoryId }, 'Change Category')}
              >
                Set Cat
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={bulkAreaId}
                onChange={(e) => setBulkAreaId(e.target.value)}
                aria-label="Bulk change area"
                className="flex-1 h-9 px-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-semibold"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name_en}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={!bulkAreaId || bulkBusy}
                onClick={() => runBulk({ area_id: bulkAreaId }, 'Change Area')}
              >
                Set Area
              </Button>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={bulkStaffId}
                onChange={(e) => setBulkStaffId(e.target.value)}
                aria-label="Bulk assign staff"
                className="flex-1 h-9 px-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-semibold"
              >
                <option value="">Assign Staff…</option>
                {staffAssignees.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name || st.email || st.id}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                disabled={!bulkStaffId || bulkBusy}
                onClick={() => runBulk({ assigned_to: bulkStaffId }, 'Assign Staff')}
              >
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Data Table */}
      <Card className="hidden xl:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all filtered rows"
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </th>
                <th className="p-3">Business</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Sector &amp; Area</th>
                <th className="p-3">Status &amp; Plan</th>
                <th className="p-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((b) => {
                const isChecked = selectedIds.includes(b.id);
                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-surface-container-low/50 transition-colors ${
                      isChecked ? 'bg-primary-fixed/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(b.id)}
                        aria-label={`Select ${b.name_en}`}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="p-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-on-surface truncate">
                        <span className="truncate">{b.name_en}</span>
                        {b.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      {!b.lat && (
                        <span className="text-[11px] text-error font-semibold">Missing Map Pin</span>
                      )}
                    </td>
                    <td className="p-3 tabular-nums font-semibold" dir="ltr">
                      {b.phone_primary}
                    </td>
                    <td className="p-3 text-on-surface-variant">
                      <div>{b.category?.name_en ?? 'Uncategorized'}</div>
                      <div className="text-[11px]">{b.area?.name_en ?? 'Sadiqabad'}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={STATUS_BADGE_VARIANT[b.status]}>{b.status}</Badge>
                        <Badge variant={b.plan_code === 'premium' ? 'gold' : 'neutral'}>
                          {b.plan_code}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNotes(b)}
                          leftIcon={<FileText className="w-3.5 h-3.5" />}
                        >
                          Notes
                        </Button>
                        {canPublish && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => toggleVerified(b)}>
                              {b.is_verified ? 'Unverify' : 'Verify'}
                            </Button>
                            {b.status !== 'published' ? (
                              <Button size="sm" onClick={() => quickStatus(b, 'published')}>
                                Publish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setConfirmSuspendBiz(b)}
                              >
                                Suspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile / Tablet Stacked Cards */}
      <div className="space-y-2.5 xl:hidden">
        {filtered.map((b) => {
          const isChecked = selectedIds.includes(b.id);
          return (
            <Card
              key={b.id}
              className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                isChecked ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelectOne(b.id)}
                  aria-label={`Select ${b.name_en}`}
                  className="w-4 h-4 mt-1 accent-primary shrink-0 cursor-pointer"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-on-surface">{b.name_en}</span>
                    {b.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                    <Badge variant={STATUS_BADGE_VARIANT[b.status]}>{b.status}</Badge>
                    <Badge variant={b.plan_code === 'premium' ? 'gold' : 'neutral'}>
                      {b.plan_code}
                    </Badge>
                  </div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-2 flex-wrap">
                    <span dir="ltr" className="tabular-nums font-semibold">
                      {b.phone_primary}
                    </span>
                    <span>·</span>
                    <span>{b.category?.name_en ?? 'Uncategorized'}</span>
                    <span>·</span>
                    <span>{b.area?.name_en ?? 'Sadiqabad'}</span>
                    {!b.lat && <span className="text-error font-semibold">· Missing Pin</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openNotes(b)}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  Notes
                </Button>
                {canPublish && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => toggleVerified(b)}>
                      {b.is_verified ? 'Unverify' : 'Verify'}
                    </Button>
                    {b.status !== 'published' ? (
                      <Button size="sm" onClick={() => quickStatus(b, 'published')}>
                        Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmSuspendBiz(b)}
                      >
                        Suspend
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name_en}` : 'Add New Business'}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Tabs
            active={modalTab}
            onChange={setModalTab}
            tabs={[
              { id: 'core', label: 'Basic & Plan' },
              { id: 'location', label: 'Address & Map Pin' },
              { id: 'hours', label: 'Opening Hours' },
              { id: 'media', label: 'Logo & Gallery' },
            ]}
          />

          {modalTab === 'core' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Name (English)"
                  required
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                />
                <Input
                  label="Name (Urdu)"
                  dir="rtl"
                  className="font-urdu"
                  value={form.name_ur}
                  onChange={(e) => setForm({ ...form, name_ur: e.target.value })}
                />
                <Input
                  label="Primary Phone"
                  required
                  dir="ltr"
                  value={form.phone_primary}
                  onChange={(e) => setForm({ ...form, phone_primary: e.target.value })}
                />
                <Input
                  label="WhatsApp"
                  dir="ltr"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
                <Select
                  label="Category"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Area"
                  value={form.area_id}
                  onChange={(e) => setForm({ ...form, area_id: e.target.value })}
                >
                  <option value="">Select Area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name_en}
                    </option>
                  ))}
                </Select>
              </div>
              <Textarea
                label="Description (English)"
                rows={3}
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Status"
                  disabled={!canPublish}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BusinessStatus })}
                >
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                  <option value="archived">Archived</option>
                </Select>
                <Select
                  label="Plan Tier"
                  value={form.plan_code}
                  onChange={(e) => setForm({ ...form, plan_code: e.target.value as PlanCode })}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic Verified</option>
                  <option value="premium">Premium Plan</option>
                </Select>
              </div>

              {form.status === 'rejected' && (
                <Textarea
                  label="Rejection Reason (visible to owner)"
                  rows={2}
                  value={form.rejection_reason}
                  placeholder="Explain what needs correction (e.g., invalid phone or unclear address)..."
                  onChange={(e) => setForm({ ...form, rejection_reason: e.target.value })}
                />
              )}

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_verified}
                    onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  Verified Badge
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  Featured Listing
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.home_delivery}
                    onChange={(e) => setForm({ ...form, home_delivery: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  Home Delivery
                </label>
                <Button size="sm" variant="outline" onClick={checkDuplicates}>
                  Check Duplicates
                </Button>
              </div>
            </div>
          )}

          {modalTab === 'location' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Street Address (English)"
                  value={form.address_en}
                  onChange={(e) => setForm({ ...form, address_en: e.target.value })}
                />
                <Input
                  label="Street Address (Urdu)"
                  dir="rtl"
                  className="font-urdu"
                  value={form.address_ur}
                  onChange={(e) => setForm({ ...form, address_ur: e.target.value })}
                />
              </div>
              <Input
                label="Nearby Landmark"
                value={form.landmark_en}
                onChange={(e) => setForm({ ...form, landmark_en: e.target.value })}
              />
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={({ lat, lng }) => setForm((p) => ({ ...p, lat, lng }))}
              />
            </div>
          )}

          {modalTab === 'hours' && (
            <HoursEditor
              value={form.opening_hours}
              isOpen24h={form.is_open_24h}
              onChange={(opening_hours) => setForm((p) => ({ ...p, opening_hours }))}
              onChange24h={(is_open_24h) => setForm((p) => ({ ...p, is_open_24h }))}
            />
          )}

          {modalTab === 'media' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Logo URL (HTTPS)"
                  dir="ltr"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                />
                <Input
                  label="Cover URL (HTTPS)"
                  dir="ltr"
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                />
              </div>
              <UrlListEditor
                title="Gallery Photo URLs"
                urls={form.gallery_urls}
                maxItems={10}
                kind="image"
                onChange={(gallery_urls) => setForm((p) => ({ ...p, gallery_urls }))}
              />
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Possible duplicate listings found:
              </p>
              {duplicates.map((d) => (
                <div key={d.id}>
                  • {d.name_en} ({d.phone_primary}) — {d.status}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Business
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(notesModalBiz)}
        onClose={() => setNotesModalBiz(null)}
        title={`Internal Notes — ${notesModalBiz?.name_en ?? ''}`}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add verification or onboarding note..."
            />
            <Button onClick={handleAddNote}>Add</Button>
          </div>
          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No internal notes yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-surface-container-low text-xs">
                  <p className="text-on-surface">{n.note}</p>
                  <span className="text-[10px] text-outline mt-1 block">
                    {formatDateShort(n.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmSuspendBiz)}
        onClose={() => setConfirmSuspendBiz(null)}
        destructive
        title="Suspend Business Listing?"
        message={`Suspending "${confirmSuspendBiz?.name_en ?? ''}" removes it from public search and maps until republished.`}
        confirmLabel="Suspend Listing"
        onConfirm={async () => {
          if (!confirmSuspendBiz) return;
          const target = confirmSuspendBiz;
          setConfirmSuspendBiz(null);
          await quickStatus(target, 'suspended');
        }}
      />

      <ConfirmDialog
        open={confirmBulkArchive}
        onClose={() => setConfirmBulkArchive(false)}
        destructive
        loading={bulkBusy}
        title="Archive Selected Listings?"
        message={`Archive ${selectedIds.length} selected listing(s)? Archived listings are hidden from public search.`}
        confirmLabel="Archive Listings"
        onConfirm={async () => {
          setConfirmBulkArchive(false);
          await runBulk({ status: 'archived' }, 'Archive');
        }}
      />
    </div>
  );
}

type SubmissionFilterGroup =
  | 'all'
  | 'new_business'
  | 'corrections'
  | 'claim'
  | 'plan_upgrade'
  | 'reports';

export function ModerationManager({
  reviews,
  submissions,
  businesses,
  actorId,
  onJumpToBusiness,
  onReload,
}: {
  reviews: ReviewRow[];
  submissions: SubmissionRow[];
  businesses: BusinessPublicView[];
  actorId: string;
  onJumpToBusiness?: (query: string) => void;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'submissions' | 'reviews'>('submissions');
  const [typeFilter, setTypeFilter] = useState<SubmissionFilterGroup>('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const openSubs = submissions.filter((s) => s.status === 'new' || s.status === 'in_review');

  const filteredSubs = openSubs.filter((s) => {
    if (typeFilter === 'all') return true;
    if (typeFilter === 'new_business') return s.type === 'new_business';
    if (typeFilter === 'corrections')
      return s.type === 'correction' || s.type === 'phone_suggestion';
    if (typeFilter === 'claim') return s.type === 'claim';
    if (typeFilter === 'plan_upgrade') return s.type === 'plan_upgrade';
    return s.type === 'report' || s.type === 'broken_image';
  });

  const handleReviewDecision = async (id: string, status: 'approved' | 'rejected') => {
    await moderateReview(id, status, actorId);
    showToast(`Review ${status}.`, 'success');
    await onReload();
  };

  const handleSubDecision = async (id: string, action: 'approve' | 'reject') => {
    await reviewSubmission(id, action, noteDrafts[id] ?? '', actorId);
    showToast(`Submission ${action === 'approve' ? 'approved & applied' : 'rejected'}.`, 'success');
    await onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-on-surface">Moderation Queue</h2>
      </div>

      <Tabs
        active={subTab}
        onChange={setSubTab}
        tabs={[
          { id: 'submissions', label: 'Submissions & Claims', count: openSubs.length },
          { id: 'reviews', label: 'Pending Reviews', count: pendingReviews.length },
        ]}
      />

      {subTab === 'submissions' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { id: 'all', label: `All (${openSubs.length})` },
                {
                  id: 'new_business',
                  label: `New Listings (${openSubs.filter((s) => s.type === 'new_business').length})`,
                },
                {
                  id: 'corrections',
                  label: `Corrections / Phones (${
                    openSubs.filter((s) => s.type === 'correction' || s.type === 'phone_suggestion')
                      .length
                  })`,
                },
                {
                  id: 'claim',
                  label: `Claims (${openSubs.filter((s) => s.type === 'claim').length})`,
                },
                {
                  id: 'plan_upgrade',
                  label: `Plan Upgrades (${openSubs.filter((s) => s.type === 'plan_upgrade').length})`,
                },
                {
                  id: 'reports',
                  label: `Reports / Photos (${
                    openSubs.filter((s) => s.type === 'report' || s.type === 'broken_image').length
                  })`,
                },
              ] as Array<{ id: SubmissionFilterGroup; label: string }>
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTypeFilter(pill.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
                  typeFilter === pill.id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/50 hover:border-primary'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {filteredSubs.length === 0 ? (
            <Card className="p-6 text-center text-sm text-on-surface-variant">
              All submissions &amp; claims processed for this filter.
            </Card>
          ) : (
            filteredSubs.map((sub) => {
              const targetBiz = sub.business_id
                ? businesses.find((b) => b.id === sub.business_id)
                : null;
              const payload = sub.payload as Record<string, unknown>;

              return (
                <Card key={sub.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="warning">{sub.type}</Badge>
                      <span className="font-bold text-sm text-on-surface">
                        {targetBiz?.name_en ??
                          String(payload.name_en ?? 'New Submission')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {targetBiz && onJumpToBusiness && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onJumpToBusiness(targetBiz.name_en)}
                          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          View / Edit Listing
                        </Button>
                      )}
                      <span className="text-xs text-outline">{formatDateShort(sub.created_at)}</span>
                    </div>
                  </div>

                  {/* Diff Viewer when editing/correcting an existing listing */}
                  {sub.type === 'correction' && targetBiz ? (
                    <div className="p-3 rounded-xl bg-surface-container-low text-xs space-y-2">
                      <div className="font-bold text-primary">Proposed Corrections (Current → Proposed):</div>
                      {Object.entries(payload).map(([k, v]) => {
                        const currentVal = (targetBiz as unknown as Record<string, unknown>)[k];
                        const hasCurrent = currentVal !== undefined && currentVal !== null && String(currentVal) !== '';
                        return (
                          <div key={k} className="grid grid-cols-1 sm:grid-cols-3 gap-1 border-b border-outline-variant/20 pb-1 last:border-0">
                            <span className="font-semibold text-on-surface">{k}</span>
                            <span className="text-on-surface-variant line-through">
                              {hasCurrent ? String(currentVal) : '—'}
                            </span>
                            <span className="text-primary font-bold">{String(v)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-surface-container-low text-xs space-y-1">
                      {Object.entries(payload).map(([k, v]) => (
                        <div key={k}>
                          <strong className="text-on-surface">{k}:</strong>{' '}
                          <span className="text-on-surface-variant">{String(v)}</span>
                        </div>
                      ))}
                      {sub.contact_name && (
                        <div>
                          <strong>Reporter:</strong> {sub.contact_name} ({sub.contact_phone})
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Optional moderator note..."
                      value={noteDrafts[sub.id] ?? ''}
                      onChange={(e) => setNoteDrafts((p) => ({ ...p, [sub.id]: e.target.value }))}
                      className="flex-1 min-h-[40px] px-3 rounded-xl border border-outline-variant/60 bg-surface text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubDecision(sub.id, 'approve')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleSubDecision(sub.id, 'reject')}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {subTab === 'reviews' && (
        <div className="space-y-3">
          {pendingReviews.length === 0 ? (
            <Card className="p-6 text-center text-sm text-on-surface-variant">
              No pending reviews waiting for approval.
            </Card>
          ) : (
            pendingReviews.map((rev) => {
              const biz = businesses.find((b) => b.id === rev.business_id);
              return (
                <Card key={rev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{rev.author_name}</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-secondary">
                        <Star className="w-3.5 h-3.5 fill-current" /> {rev.rating}
                      </span>
                      {biz && <span className="text-xs text-primary font-semibold">→ {biz.name_en}</span>}
                    </div>
                    <p className="text-sm text-on-surface-variant">{rev.comment}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleReviewDecision(rev.id, 'approved')}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReviewDecision(rev.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function InquiriesManager({
  inquiries,
  businesses,
  actorId,
  onReload,
}: {
  inquiries: InquiryRow[];
  businesses: BusinessPublicView[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();

  const changeStatus = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status, actorId);
    showToast(`Inquiry marked as ${status}.`, 'success');
    await onReload();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-on-surface">All Customer Inquiries ({inquiries.length})</h2>
      <div className="space-y-2.5">
        {inquiries.map((inq) => {
          const biz = businesses.find((b) => b.id === inq.business_id);
          return (
            <Card key={inq.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{inq.name}</span>
                  <span className="text-xs font-bold text-primary tabular-nums" dir="ltr">
                    {inq.phone}
                  </span>
                  {biz && <span className="text-xs text-on-surface-variant">→ {biz.name_en}</span>}
                  <Badge variant={inq.status === 'new' ? 'warning' : 'success'}>
                    {inq.status}
                  </Badge>
                </div>
                <p className="text-sm text-on-surface-variant">{inq.message}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {inq.status !== 'handled' && (
                  <Button size="sm" onClick={() => changeStatus(inq.id, 'handled')}>
                    Mark Handled
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
