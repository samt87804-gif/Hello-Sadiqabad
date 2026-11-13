import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Database,
  Download,
  Edit2,
  ExternalLink,
  FileCode,
  FileJson,
  Megaphone,
  Plus,
  Search,
  Shield,
  Wrench,
} from 'lucide-react';
import type {
  AnnouncementRow,
  AreaRow,
  AuditLogRow,
  CategoryRow,
  EmergencyCategory,
  EmergencyContactRow,
  LeadRow,
  PageRow,
  PermissionKey,
  ProfileRow,
  SiteSettingRow,
  StaffMemberRow,
  StaffType,
  SubmissionRow,
} from '../../types/database';
import type { AdminAnalyticsData, BusinessPublicView } from '../../types/directory';
import { formatDateShort, slugify } from '../../lib/format';
import { normalizePkPhone } from '../../lib/phone';
import { STAFF_TYPE_LABELS } from '../../lib/permissions';
import {
  adminCreateUser,
  generateSitemapXml,
  updateSiteSetting,
  upsertAnnouncement,
  upsertArea,
  upsertCategory,
  upsertEmergencyContact,
  upsertStaffMember,
  upsertStaticPage,
} from '../../lib/api';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { BarChartSvg, LineChartSvg } from '../ui/Charts';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { DemoModeNotice } from '../ui/DemoModeNotice';

export function TaxonomyManager({
  mode,
  categories,
  areas,
  emergencyContacts,
  actorId,
  onReload,
}: {
  mode: 'categories' | 'areas' | 'emergency';
  categories: CategoryRow[];
  areas: AreaRow[];
  emergencyContacts: EmergencyContactRow[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [phone, setPhone] = useState('');
  const [emCat, setEmCat] = useState<EmergencyCategory>('general');

  const [editCat, setEditCat] = useState<CategoryRow | null>(null);
  const [catSynonyms, setCatSynonyms] = useState('');
  const [editArea, setEditArea] = useState<AreaRow | null>(null);
  const [editEm, setEditEm] = useState<EmergencyContactRow | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameUr.trim()) return;
    if (mode === 'categories') {
      await upsertCategory({ name_en: nameEn.trim(), name_ur: nameUr.trim(), slug: slugify(nameEn) }, actorId);
    } else if (mode === 'areas') {
      await upsertArea({ name_en: nameEn.trim(), name_ur: nameUr.trim(), slug: slugify(nameEn) }, actorId);
    } else {
      await upsertEmergencyContact(
        { name_en: nameEn.trim(), name_ur: nameUr.trim(), phone: phone.trim(), category: emCat },
        actorId
      );
    }
    showToast('Saved taxonomy entry!', 'success');
    setNameEn('');
    setNameUr('');
    setPhone('');
    await onReload();
  };

  const saveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCat) return;
    const synonyms = catSynonyms
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await upsertCategory(
      {
        ...editCat,
        slug: editCat.slug.trim() || slugify(editCat.name_en),
        synonyms,
      },
      actorId
    );
    showToast('Category updated!', 'success');
    setEditCat(null);
    await onReload();
  };

  const saveEditArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArea) return;
    await upsertArea(
      {
        ...editArea,
        slug: editArea.slug.trim() || slugify(editArea.name_en),
      },
      actorId
    );
    showToast('Area updated!', 'success');
    setEditArea(null);
    await onReload();
  };

  const saveEditEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEm) return;
    await upsertEmergencyContact(editEm, actorId);
    showToast('Emergency contact updated!', 'success');
    setEditEm(null);
    await onReload();
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <h2 className="text-base font-bold text-on-surface mb-3 capitalize">Add {mode}</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <Input label="Name (English)" required value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          <Input label="Name (Urdu)" required dir="rtl" className="font-urdu" value={nameUr} onChange={(e) => setNameUr(e.target.value)} />
          {mode === 'emergency' && (
            <>
              <Input label="Helpline Phone" required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Select label="Type" value={emCat} onChange={(e) => setEmCat(e.target.value as EmergencyCategory)}>
                <option value="rescue">Rescue</option>
                <option value="police">Police</option>
                <option value="fire">Fire</option>
                <option value="hospital">Hospital</option>
                <option value="ambulance">Ambulance</option>
                <option value="utility">Utility</option>
                <option value="general">General</option>
              </Select>
            </>
          )}
          <Button type="submit" leftIcon={<Plus className="w-4 h-4" />}>Add</Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mode === 'categories' &&
          categories.map((c) => (
            <Card key={c.id} className="p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm truncate">{c.name_en}</p>
                  <Badge variant={c.is_active ? 'success' : 'neutral'}>
                    {c.is_active ? c.slug : `${c.slug} · inactive`}
                  </Badge>
                </div>
                <p className="font-urdu text-xs text-primary">{c.name_ur}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditCat({ ...c });
                    setCatSynonyms((c.synonyms ?? []).join(', '));
                  }}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await upsertCategory({ ...c, is_active: !c.is_active }, actorId);
                    showToast(`${c.name_en} ${c.is_active ? 'deactivated' : 'activated'}.`, 'success');
                    await onReload();
                  }}
                >
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        {mode === 'areas' &&
          areas.map((a) => (
            <Card key={a.id} className="p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm truncate">{a.name_en}</p>
                  <Badge variant={a.is_active ? 'success' : 'neutral'}>
                    {a.is_active ? a.slug : `${a.slug} · inactive`}
                  </Badge>
                </div>
                <p className="font-urdu text-xs text-primary">{a.name_ur}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditArea({ ...a })}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await upsertArea({ ...a, is_active: !a.is_active }, actorId);
                    showToast(`${a.name_en} ${a.is_active ? 'deactivated' : 'activated'}.`, 'success');
                    await onReload();
                  }}
                >
                  {a.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        {mode === 'emergency' &&
          emergencyContacts.map((em) => (
            <Card key={em.id} className="p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm truncate">{em.name_en}</p>
                  <Badge variant={em.is_active ? 'danger' : 'neutral'}>
                    {em.is_active ? em.category : 'inactive'}
                  </Badge>
                </div>
                <p className="font-urdu text-xs text-primary">{em.name_ur}</p>
                <span className="text-xs font-extrabold text-error tabular-nums" dir="ltr">
                  {em.phone}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditEm({ ...em })}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await upsertEmergencyContact({ ...em, is_active: !em.is_active }, actorId);
                    showToast(`${em.name_en} ${em.is_active ? 'deactivated' : 'activated'}.`, 'success');
                    await onReload();
                  }}
                >
                  {em.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
      </div>

      <Modal open={Boolean(editCat)} onClose={() => setEditCat(null)} title={`Edit Category — ${editCat?.name_en ?? ''}`}>
        {editCat && (
          <form onSubmit={saveEditCategory} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Name (English)" required value={editCat.name_en} onChange={(e) => setEditCat({ ...editCat, name_en: e.target.value })} />
              <Input label="Name (Urdu)" required dir="rtl" className="font-urdu" value={editCat.name_ur} onChange={(e) => setEditCat({ ...editCat, name_ur: e.target.value })} />
              <Input label="Slug" dir="ltr" value={editCat.slug} onChange={(e) => setEditCat({ ...editCat, slug: e.target.value })} />
              <Input label="Lucide Icon Name" dir="ltr" value={editCat.icon} onChange={(e) => setEditCat({ ...editCat, icon: e.target.value })} />
              <Input label="Accent Color Hex" dir="ltr" value={editCat.color} onChange={(e) => setEditCat({ ...editCat, color: e.target.value })} />
              <Input label="Sort Order" type="number" dir="ltr" value={editCat.sort_order} onChange={(e) => setEditCat({ ...editCat, sort_order: Number(e.target.value) })} />
            </div>
            <Input
              label="Search Synonyms (comma-separated, EN/Roman Urdu)"
              value={catSynonyms}
              onChange={(e) => setCatSynonyms(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditCat(null)}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(editArea)} onClose={() => setEditArea(null)} title={`Edit Area — ${editArea?.name_en ?? ''}`}>
        {editArea && (
          <form onSubmit={saveEditArea} className="space-y-3">
            <Input label="Area Name (English)" required value={editArea.name_en} onChange={(e) => setEditArea({ ...editArea, name_en: e.target.value })} />
            <Input label="Area Name (Urdu)" required dir="rtl" className="font-urdu" value={editArea.name_ur} onChange={(e) => setEditArea({ ...editArea, name_ur: e.target.value })} />
            <Input label="Slug" dir="ltr" value={editArea.slug} onChange={(e) => setEditArea({ ...editArea, slug: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditArea(null)}>Cancel</Button>
              <Button type="submit">Save Area</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(editEm)} onClose={() => setEditEm(null)} title={`Edit Helpline — ${editEm?.name_en ?? ''}`}>
        {editEm && (
          <form onSubmit={saveEditEmergency} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Name (English)" required value={editEm.name_en} onChange={(e) => setEditEm({ ...editEm, name_en: e.target.value })} />
              <Input label="Name (Urdu)" required dir="rtl" className="font-urdu" value={editEm.name_ur} onChange={(e) => setEditEm({ ...editEm, name_ur: e.target.value })} />
              <Input label="Helpline Phone" required dir="ltr" value={editEm.phone} onChange={(e) => setEditEm({ ...editEm, phone: e.target.value })} />
              <Input label="WhatsApp (optional)" dir="ltr" value={editEm.whatsapp ?? ''} onChange={(e) => setEditEm({ ...editEm, whatsapp: e.target.value || null })} />
              <Select label="Category" value={editEm.category} onChange={(e) => setEditEm({ ...editEm, category: e.target.value as EmergencyCategory })}>
                <option value="rescue">Rescue</option>
                <option value="police">Police</option>
                <option value="fire">Fire</option>
                <option value="hospital">Hospital</option>
                <option value="ambulance">Ambulance</option>
                <option value="utility">Utility</option>
                <option value="general">General</option>
              </Select>
              <Input label="Sort Order" type="number" dir="ltr" value={editEm.sort_order} onChange={(e) => setEditEm({ ...editEm, sort_order: Number(e.target.value) })} />
            </div>
            <Textarea label="Description (English)" rows={2} value={editEm.description_en ?? ''} onChange={(e) => setEditEm({ ...editEm, description_en: e.target.value || null })} />
            <Textarea label="Description (Urdu)" dir="rtl" className="font-urdu" rows={2} value={editEm.description_ur ?? ''} onChange={(e) => setEditEm({ ...editEm, description_ur: e.target.value || null })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditEm(null)}>Cancel</Button>
              <Button type="submit">Save Helpline</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export function AnnouncementsManager({
  announcements,
  actorId,
  onReload,
}: {
  announcements: AnnouncementRow[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [titleEn, setTitleEn] = useState('');
  const [titleUr, setTitleUr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyUr, setBodyUr] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertAnnouncement({ title_en: titleEn, title_ur: titleUr, body_en: bodyEn, body_ur: bodyUr }, actorId);
    showToast('City announcement published!', 'success');
    setTitleEn('');
    setTitleUr('');
    setBodyEn('');
    setBodyUr('');
    await onReload();
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> New Civic Announcement
        </h2>
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Title (English)" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            <Input label="Title (Urdu)" required dir="rtl" className="font-urdu" value={titleUr} onChange={(e) => setTitleUr(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea label="Body (English)" required rows={2} value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} />
            <Textarea label="Body (Urdu)" required dir="rtl" className="font-urdu" rows={2} value={bodyUr} onChange={(e) => setBodyUr(e.target.value)} />
          </div>
          <Button type="submit">Publish Announcement</Button>
        </form>
      </Card>

      <div className="space-y-2.5">
        {announcements.map((a) => (
          <Card key={a.id} className="p-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">{a.title_en}</h3>
              <p className="font-urdu text-xs text-primary">{a.title_ur}</p>
              <p className="text-xs text-on-surface-variant mt-1">{a.body_en}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await upsertAnnouncement({ ...a, is_active: !a.is_active }, actorId);
                await onReload();
              }}
            >
              {a.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

const ALL_PERMISSION_KEYS: Array<{ key: PermissionKey; label: string }> = [
  { key: 'business.create', label: 'Create Drafts' },
  { key: 'business.edit_own', label: 'Edit Own Drafts' },
  { key: 'business.publish', label: 'Publish / Suspend / Verify' },
  { key: 'import.run', label: 'Bulk CSV Import' },
  { key: 'leads.manage', label: 'Manage Sales Leads' },
  { key: 'owners.create', label: 'Create Owners' },
  { key: 'tiers.manage', label: 'Manage Plans / Tiers' },
  { key: 'ads.review', label: 'Review & Manage Ads' },
  { key: 'moderation.review', label: 'Moderate Reviews / Claims' },
  { key: 'support.read', label: 'View Inquiries' },
  { key: 'analytics.view', label: 'View Analytics' },
  { key: 'announcements.manage', label: 'Manage Announcements' },
  { key: 'settings.manage', label: 'Manage Settings & Pages' },
];

export function StaffManager({
  profiles,
  actorId,
  onReload,
}: {
  profiles: Array<ProfileRow & { email?: string; is_active?: boolean; staff?: StaffMemberRow | null }>;
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff@2026');
  const [selectedTypes, setSelectedTypes] = useState<StaffType[]>(['moderator']);

  const [editingMember, setEditingMember] = useState<{
    id: string;
    name: string;
    staffTypes: StaffType[];
    permissions: Record<string, boolean>;
    isActive: boolean;
  } | null>(null);
  const [confirmDisableMember, setConfirmDisableMember] = useState<{
    id: string;
    name: string;
    staff: StaffMemberRow;
  } | null>(null);

  const staffList = profiles.filter((p) => p.role === 'staff' || p.role === 'super_admin');

  const toggleType = (st: StaffType) => {
    setSelectedTypes((prev) =>
      prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
    );
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminCreateUser(
      {
        email,
        password,
        full_name: fullName,
        role: 'staff',
        staff_types: selectedTypes,
      },
      actorId
    );
    if (!res.ok) {
      showToast(res.error ?? 'Failed to invite staff.', 'error');
      return;
    }
    showToast('Staff account created!', 'success');
    setModalOpen(false);
    setFullName('');
    setEmail('');
    await onReload();
  };

  const saveEditPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    await upsertStaffMember(
      editingMember.id,
      editingMember.staffTypes,
      editingMember.permissions,
      editingMember.isActive,
      actorId
    );
    showToast(`Updated permissions for ${editingMember.name}.`, 'success');
    setEditingMember(null);
    await onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Staff &amp; Permissions Matrix
        </h2>
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Invite Staff Member
        </Button>
      </div>

      <div className="space-y-3">
        {staffList.map((member) => (
          <Card key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{member.full_name}</span>
                <Badge variant={member.role === 'super_admin' ? 'gold' : 'primary'}>
                  {member.role}
                </Badge>
                {member.staff && !member.staff.is_active && (
                  <Badge variant="danger">Disabled</Badge>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">{member.email ?? member.id}</p>
              {member.staff && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {member.staff.staff_types.map((st) => (
                    <Badge key={st} variant="neutral">
                      {STAFF_TYPE_LABELS[st]?.en ?? st}
                    </Badge>
                  ))}
                  {Object.entries(member.staff.permissions ?? {}).map(([pk, pv]) => (
                    <Badge key={pk} variant={pv ? 'success' : 'danger'}>
                      {pv ? '+' : '−'} {pk}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {member.role === 'staff' && member.staff && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditingMember({
                      id: member.id,
                      name: member.full_name || member.email || 'Staff Member',
                      staffTypes: [...member.staff!.staff_types],
                      permissions: { ...(member.staff!.permissions ?? {}) },
                      isActive: member.staff!.is_active,
                    })
                  }
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Permissions
                </Button>
                <Button
                  size="sm"
                  variant={member.staff.is_active ? 'danger' : 'primary'}
                  onClick={async () => {
                    if (!member.staff!.is_active) {
                      await upsertStaffMember(
                        member.id,
                        member.staff!.staff_types,
                        member.staff!.permissions,
                        true,
                        actorId
                      );
                      showToast('Staff access enabled.', 'success');
                      await onReload();
                    } else {
                      setConfirmDisableMember({
                        id: member.id,
                        name: member.full_name || member.email || 'Staff Member',
                        staff: member.staff!,
                      });
                    }
                  }}
                >
                  {member.staff.is_active ? 'Disable Access' : 'Enable Access'}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(confirmDisableMember)}
        onClose={() => setConfirmDisableMember(null)}
        destructive
        title="Disable Staff Access?"
        message={`Revoke admin portal access for ${confirmDisableMember?.name ?? 'this staff member'}?`}
        confirmLabel="Disable Access"
        onConfirm={async () => {
          if (!confirmDisableMember) return;
          const target = confirmDisableMember;
          setConfirmDisableMember(null);
          await upsertStaffMember(
            target.id,
            target.staff.staff_types,
            target.staff.permissions,
            false,
            actorId
          );
          showToast('Staff access disabled.', 'success');
          await onReload();
        }}
      />

      <Modal
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title={`Edit Roles & Permissions — ${editingMember?.name ?? ''}`}
        maxWidthClass="max-w-2xl"
      >
        {editingMember && (
          <form onSubmit={saveEditPermissions} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-on-surface">Staff Roles:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(STAFF_TYPE_LABELS) as StaffType[]).map((st) => (
                  <label
                    key={st}
                    className="p-2.5 rounded-xl bg-surface-container-low text-xs flex items-start gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={editingMember.staffTypes.includes(st)}
                      onChange={() =>
                        setEditingMember((prev) =>
                          prev
                            ? {
                                ...prev,
                                staffTypes: prev.staffTypes.includes(st)
                                  ? prev.staffTypes.filter((x) => x !== st)
                                  : [...prev.staffTypes, st],
                              }
                            : null
                        )
                      }
                      className="mt-0.5 accent-primary"
                    />
                    <span>
                      <strong className="block">{STAFF_TYPE_LABELS[st].en}</strong>
                      <span className="text-on-surface-variant">{STAFF_TYPE_LABELS[st].desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-outline-variant/25">
              <span className="text-xs font-bold text-on-surface">
                Individual Permission Overrides:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pe-1">
                {ALL_PERMISSION_KEYS.map(({ key, label }) => {
                  const val = editingMember.permissions[key];
                  const state = val === true ? 'allow' : val === false ? 'deny' : 'inherit';
                  return (
                    <div
                      key={key}
                      className="p-2 rounded-xl bg-surface-container-low flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-semibold truncate" title={key}>
                        {label}
                      </span>
                      <select
                        value={state}
                        aria-label={`Override ${key}`}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setEditingMember((prev) => {
                            if (!prev) return null;
                            const nextPerms = { ...prev.permissions };
                            if (nextVal === 'inherit') delete nextPerms[key];
                            else nextPerms[key] = nextVal === 'allow';
                            return { ...prev, permissions: nextPerms };
                          });
                        }}
                        className="h-7 px-2 rounded-lg border border-outline-variant bg-surface text-[11px] font-semibold"
                      >
                        <option value="inherit">Role Default</option>
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Permissions</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Staff Account">
        <form onSubmit={createStaff} className="space-y-3">
          <Input label="Staff Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Temporary Password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-on-surface">Assign Staff Roles:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(STAFF_TYPE_LABELS) as StaffType[]).map((st) => (
                <label
                  key={st}
                  className="p-2.5 rounded-xl bg-surface-container-low text-xs flex items-start gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(st)}
                    onChange={() => toggleType(st)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <strong className="block">{STAFF_TYPE_LABELS[st].en}</strong>
                    <span className="text-on-surface-variant">{STAFF_TYPE_LABELS[st].desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Staff</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function AnalyticsView({
  analytics,
  businesses,
  days = 30,
  onDaysChange,
}: {
  analytics: AdminAnalyticsData;
  businesses: BusinessPublicView[];
  days?: 7 | 30 | 90;
  onDaysChange?: (d: 7 | 30 | 90) => void;
}) {
  const { showToast } = useToast();
  const incomplete = businesses.filter((b) => !b.logo_url || !b.lat || (!b.opening_hours && !b.is_open_24h));

  const downloadFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`, 'success');
  };

  const exportCsv = () => {
    const rows = [
      ['id', 'name_en', 'phone_primary', 'status', 'plan_code', 'rating_avg', 'views'].join(','),
      ...businesses.map((b) =>
        [
          b.id,
          `"${b.name_en.replace(/"/g, '""')}"`,
          b.phone_primary,
          b.status,
          b.plan_code,
          b.rating_avg ?? '',
          b.view_count,
        ].join(',')
      ),
    ];
    downloadFile('hello_sadiqabad_businesses.csv', rows.join('\n'), 'text/csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-on-surface">City Directory Analytics &amp; Exports</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {onDaysChange && (
            <div className="inline-flex rounded-xl bg-surface-container-low p-1 gap-1">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    days === d ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={exportCsv} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile('sitemap.xml', generateSitemapXml(), 'application/xml')}
            leftIcon={<FileCode className="w-4 h-4" />}
          >
            Download sitemap.xml
          </Button>
        </div>
      </div>

      <DemoModeNotice
        variant="sample-data"
        contextLabelEn="Sample Preview Analytics: Traffic lines, view totals, and search logs include seeded demo activity stored locally."
        contextLabelUr="نمونہ پیش نظارہ شماریات: ٹریفک گراف اور سرچ لاگز میں مقامی ڈیمو سرگرمی شامل ہے۔"
      />

      <Card className="p-5">
        <h3 className="text-sm font-bold text-on-surface mb-3">{days}-Day Directory Traffic</h3>
        <LineChartSvg
          data={analytics.daily_traffic}
          series={[
            { key: 'views', label: 'Views', color: '#006948' },
            { key: 'calls', label: 'Calls', color: '#904d00' },
            { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-on-surface mb-3">Top Businesses by Views</h3>
          <BarChartSvg
            items={analytics.top_businesses.map((b) => ({ label: b.name_en, value: b.views }))}
          />
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-on-surface">Zero-Result Search Opportunities</h3>
          <div className="space-y-1.5">
            {analytics.zero_result_searches.map((z) => (
              <div
                key={z.query}
                className="flex justify-between text-xs px-3 py-2 rounded-xl bg-error-container/35"
              >
                <span className="font-semibold">“{z.query}”</span>
                <span className="tabular-nums font-bold">{z.count} misses</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Wrench className="w-4 h-4 text-secondary" />
            Data Quality Health Check ({incomplete.length} incomplete records)
          </h3>
          <Link to="/admin/quality" className="text-xs font-bold text-primary hover:underline">
            Open Full Data Quality Audit →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {incomplete.slice(0, 6).map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-surface-container-low flex justify-between">
              <span className="font-semibold truncate">{b.name_en}</span>
              <span className="text-secondary">
                {!b.logo_url ? 'No Photo ' : ''}
                {!b.lat ? 'No Pin ' : ''}
                {!b.opening_hours && !b.is_open_24h ? 'No Hours' : ''}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DataQualityManager({
  businesses,
  submissions = [],
  onJumpToBusiness,
}: {
  businesses: BusinessPublicView[];
  submissions?: SubmissionRow[];
  onJumpToBusiness: (query: string) => void;
}) {
  const { showToast } = useToast();
  const [issueFilter, setIssueFilter] = useState<
    'all' | 'pin' | 'photo' | 'hours' | 'urdu' | 'phone' | 'category' | 'area' | 'broken_image'
  >('all');

  const brokenImageBizIds = new Set(
    submissions
      .filter(
        (s) =>
          s.type === 'broken_image' &&
          (s.status === 'new' || s.status === 'in_review') &&
          Boolean(s.business_id)
      )
      .map((s) => s.business_id!)
  );

  const audited = businesses.map((b) => {
    const missingPin = !b.lat || !b.lng;
    const missingPhoto = !b.logo_url;
    const missingHours = !b.is_open_24h && (!b.opening_hours || Object.keys(b.opening_hours).length === 0);
    const missingUrdu = !b.name_ur?.trim();
    const invalidPhone = normalizePkPhone(b.phone_primary).length < 7;
    const missingCategory = !b.category_id;
    const missingArea = !b.area_id;
    const hasBrokenImageReport = brokenImageBizIds.has(b.id);

    const issues: string[] = [];
    if (missingPin) issues.push('Missing Map Pin');
    if (missingPhoto) issues.push('Missing Logo');
    if (missingHours) issues.push('Missing Hours');
    if (missingUrdu) issues.push('Missing Urdu Name');
    if (invalidPhone) issues.push('Invalid Phone Format');
    if (missingCategory) issues.push('Missing Category');
    if (missingArea) issues.push('Missing Area');
    if (hasBrokenImageReport) issues.push('Broken Image Report');
    return {
      b,
      missingPin,
      missingPhoto,
      missingHours,
      missingUrdu,
      invalidPhone,
      missingCategory,
      missingArea,
      hasBrokenImageReport,
      issues,
    };
  });

  const withAnyIssue = audited.filter((item) => item.issues.length > 0);
  const shown = withAnyIssue.filter((item) => {
    if (issueFilter === 'all') return true;
    if (issueFilter === 'pin') return item.missingPin;
    if (issueFilter === 'photo') return item.missingPhoto;
    if (issueFilter === 'hours') return item.missingHours;
    if (issueFilter === 'urdu') return item.missingUrdu;
    if (issueFilter === 'category') return item.missingCategory;
    if (issueFilter === 'area') return item.missingArea;
    if (issueFilter === 'broken_image') return item.hasBrokenImageReport;
    return item.invalidPhone;
  });

  const exportQualityCsv = () => {
    const header = ['id', 'name_en', 'phone_primary', 'status', 'issues'].join(',');
    const lines = shown.map(({ b, issues }) =>
      [
        b.id,
        `"${b.name_en.replace(/"/g, '""')}"`,
        b.phone_primary,
        b.status,
        `"${issues.join('; ')}"`,
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hello_sadiqabad_data_quality.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Data Quality CSV.', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" /> Data Quality &amp; Missing Info Monitor
          </h2>
          <p className="text-xs text-on-surface-variant">
            {withAnyIssue.length} of {businesses.length} listings need attention for complete bilingual &amp; map accuracy.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exportQualityCsv}
          disabled={shown.length === 0}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Data Quality CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all' as const, label: `All Issues (${withAnyIssue.length})` },
          { id: 'pin' as const, label: `Missing Pin (${audited.filter((x) => x.missingPin).length})` },
          { id: 'photo' as const, label: `Missing Logo (${audited.filter((x) => x.missingPhoto).length})` },
          { id: 'hours' as const, label: `Missing Hours (${audited.filter((x) => x.missingHours).length})` },
          { id: 'urdu' as const, label: `Missing Urdu (${audited.filter((x) => x.missingUrdu).length})` },
          { id: 'phone' as const, label: `Invalid Phone (${audited.filter((x) => x.invalidPhone).length})` },
          { id: 'category' as const, label: `Missing Category (${audited.filter((x) => x.missingCategory).length})` },
          { id: 'area' as const, label: `Missing Area (${audited.filter((x) => x.missingArea).length})` },
          { id: 'broken_image' as const, label: `Broken Image Reports (${audited.filter((x) => x.hasBrokenImageReport).length})` },
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setIssueFilter(chip.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              issueFilter === chip.id
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
          <p className="font-bold text-sm text-on-surface">100% Clean for Selected Filter!</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {shown.map(({ b, issues }) => (
            <Card key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-on-surface">{b.name_en}</span>
                  <span className="text-xs text-on-surface-variant tabular-nums" dir="ltr">
                    {b.phone_primary}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {issues.map((iss) => (
                    <Badge
                      key={iss}
                      variant={iss.includes('Phone') || iss.includes('Broken') ? 'danger' : 'warning'}
                    >
                      {iss}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onJumpToBusiness(b.name_en)}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Fix in Directory
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function BackupExportManager({
  businesses,
  categories,
  areas,
  emergencyContacts,
  leads = [],
}: {
  businesses: BusinessPublicView[];
  categories: CategoryRow[];
  areas: AreaRow[];
  emergencyContacts: EmergencyContactRow[];
  leads?: LeadRow[];
}) {
  const { showToast } = useToast();

  const downloadBlob = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`, 'success');
  };

  const exportFullJson = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      city: 'sadiqabad',
      counts: {
        businesses: businesses.length,
        categories: categories.length,
        areas: areas.length,
        emergency_contacts: emergencyContacts.length,
        leads: leads.length,
      },
      categories,
      areas,
      emergency_contacts: emergencyContacts,
      leads,
      businesses,
    };
    downloadBlob(
      `hello_sadiqabad_backup_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
  };

  const exportBusinessesCsv = () => {
    const header = [
      'id',
      'name_en',
      'name_ur',
      'phone_primary',
      'whatsapp',
      'category',
      'area',
      'address_en',
      'status',
      'plan_code',
      'is_verified',
    ].join(',');
    const lines = businesses.map((b) =>
      [
        b.id,
        `"${b.name_en.replace(/"/g, '""')}"`,
        `"${(b.name_ur ?? '').replace(/"/g, '""')}"`,
        b.phone_primary,
        b.whatsapp ?? '',
        `"${(b.category?.name_en ?? '').replace(/"/g, '""')}"`,
        `"${(b.area?.name_en ?? '').replace(/"/g, '""')}"`,
        `"${(b.address_en ?? '').replace(/"/g, '""')}"`,
        b.status,
        b.plan_code,
        b.is_verified,
      ].join(',')
    );
    downloadBlob('hello_sadiqabad_businesses_full.csv', [header, ...lines].join('\n'), 'text/csv');
  };

  const exportEmergencyCsv = () => {
    const header = ['id', 'name_en', 'name_ur', 'phone', 'category'].join(',');
    const lines = emergencyContacts.map((e) =>
      [e.id, `"${e.name_en}"`, `"${e.name_ur}"`, e.phone, e.category].join(',')
    );
    downloadBlob('sadiqabad_emergency_contacts.csv', [header, ...lines].join('\n'), 'text/csv');
  };

  const exportLeadsCsv = () => {
    const header = ['id', 'name', 'phone', 'category', 'area', 'status', 'notes'].join(',');
    const lines = leads.map((l) =>
      [
        l.id,
        `"${l.name.replace(/"/g, '""')}"`,
        l.phone,
        `"${(l.category_text ?? '').replace(/"/g, '""')}"`,
        `"${(l.area_text ?? '').replace(/"/g, '""')}"`,
        l.status,
        `"${(l.notes ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    downloadBlob('hello_sadiqabad_sales_leads.csv', [header, ...lines].join('\n'), 'text/csv');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" /> Directory Backups, CSV Exports &amp; Sitemap
        </h2>
        <p className="text-xs text-on-surface-variant">
          Download full directory snapshots, CSV spreadsheets, leads, emergency records, and SEO sitemap XML.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Full JSON Archive</h3>
            <Badge variant="primary">{businesses.length} shops</Badge>
          </div>
          <p className="text-xs text-on-surface-variant">
            Complete structured backup including all businesses, categories, areas, leads, and emergency helplines.
          </p>
          <Button onClick={exportFullJson} leftIcon={<FileJson className="w-4 h-4" />}>
            Download Full JSON Backup
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Businesses CSV Spreadsheet</h3>
            <Badge variant="success">UTF-8</Badge>
          </div>
          <p className="text-xs text-on-surface-variant">
            Ready for Excel or Google Sheets with English/Urdu names, normalized phone numbers, and plans.
          </p>
          <Button variant="outline" onClick={exportBusinessesCsv} leftIcon={<Download className="w-4 h-4" />}>
            Export Businesses CSV
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Sales Leads CSV</h3>
            <Badge variant="warning">{leads.length} leads</Badge>
          </div>
          <p className="text-xs text-on-surface-variant">
            Export field-sales and onboarding pipeline records with contact numbers, markets, and conversion status.
          </p>
          <Button variant="outline" onClick={exportLeadsCsv} leftIcon={<Download className="w-4 h-4" />}>
            Export Leads CSV
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Emergency Helplines CSV</h3>
            <Badge variant="danger">{emergencyContacts.length} numbers</Badge>
          </div>
          <p className="text-xs text-on-surface-variant">
            Print-ready emergency phone directory for Sadiqabad municipal and rescue distribution.
          </p>
          <Button variant="outline" onClick={exportEmergencyCsv} leftIcon={<Download className="w-4 h-4" />}>
            Export Emergency CSV
          </Button>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">SEO Sitemap XML</h3>
            <Badge variant="secondary">Live</Badge>
          </div>
          <p className="text-xs text-on-surface-variant">
            Dynamically generated sitemap.xml covering all published listings, categories, and neighborhood pages.
          </p>
          <Button
            variant="outline"
            onClick={() => downloadBlob('sitemap.xml', generateSitemapXml(), 'application/xml')}
            leftIcon={<FileCode className="w-4 h-4" />}
          >
            Download sitemap.xml
          </Button>
        </Card>
      </div>
    </div>
  );
}

export function SettingsManager({
  settings,
  pages,
  actorId,
  onReload,
}: {
  settings: SiteSettingRow[];
  pages: PageRow[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [selectedSlug, setSelectedSlug] = useState(pages[0]?.slug ?? 'about');
  const activePage = pages.find((p) => p.slug === selectedSlug) ?? pages[0];
  const [pageTitleEn, setPageTitleEn] = useState(activePage?.title_en ?? '');
  const [pageTitleUr, setPageTitleUr] = useState(activePage?.title_ur ?? '');
  const [pagePublished, setPagePublished] = useState(activePage?.is_published ?? true);
  const [pageEn, setPageEn] = useState(activePage?.body_md_en ?? '');
  const [pageUr, setPageUr] = useState(activePage?.body_md_ur ?? '');
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activePage) {
      setPageTitleEn(activePage.title_en ?? '');
      setPageTitleUr(activePage.title_ur ?? '');
      setPagePublished(activePage.is_published);
      setPageEn(activePage.body_md_en ?? '');
      setPageUr(activePage.body_md_ur ?? '');
    }
  }, [
    activePage?.slug,
    activePage?.title_en,
    activePage?.title_ur,
    activePage?.is_published,
    activePage?.body_md_en,
    activePage?.body_md_ur,
  ]);

  const toggleBoolSetting = async (row: SiteSettingRow) => {
    await updateSiteSetting(row.key, !Boolean(row.value), actorId);
    showToast(`Updated ${row.key}.`, 'success');
    await onReload();
  };

  const saveTextSetting = async (row: SiteSettingRow) => {
    const raw = draftValues[row.key] ?? String(row.value ?? '');
    const parsed = typeof row.value === 'number' ? Number(raw) : raw;
    await updateSiteSetting(row.key, parsed, actorId);
    showToast(`Saved ${row.key}.`, 'success');
    await onReload();
  };

  const savePage = async () => {
    if (!activePage) return;
    await upsertStaticPage(
      {
        ...activePage,
        title_en: pageTitleEn.trim() || activePage.title_en,
        title_ur: pageTitleUr.trim() || activePage.title_ur,
        is_published: pagePublished,
        body_md_en: pageEn,
        body_md_ur: pageUr,
      },
      actorId
    );
    showToast(`Saved /${activePage.slug} page!`, 'success');
    await onReload();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-3">
        <h2 className="text-base font-bold text-on-surface">Site Settings &amp; Feature Flags</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {settings.map((s) => (
            <div
              key={s.key}
              className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-on-surface">{s.key}</p>
                  <p className="text-on-surface-variant">{s.description}</p>
                </div>
                {typeof s.value === 'boolean' && (
                  <Button
                    size="sm"
                    variant={s.value ? 'primary' : 'outline'}
                    onClick={() => toggleBoolSetting(s)}
                  >
                    {s.value ? 'ON' : 'OFF'}
                  </Button>
                )}
              </div>
              {typeof s.value !== 'boolean' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={
                      draftValues[s.key] ??
                      (typeof s.value === 'string' ? s.value : JSON.stringify(s.value))
                    }
                    onChange={(e) => setDraftValues((p) => ({ ...p, [s.key]: e.target.value }))}
                    className="flex-1 h-8 px-2.5 rounded-lg border border-outline-variant bg-surface font-mono text-[11px]"
                  />
                  <Button size="sm" variant="outline" onClick={() => saveTextSetting(s)}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {activePage && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-on-surface">Static Page Content Editor</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="h-10 px-3 rounded-xl border border-outline-variant bg-surface text-xs font-semibold"
              >
                {pages.map((p) => (
                  <option key={p.slug} value={p.slug}>/{p.slug} — {p.title_en}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={pagePublished}
                  onChange={(e) => setPagePublished(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span>Published</span>
              </label>
              <Button size="sm" onClick={savePage}>Save Page</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Page Title (English)"
              value={pageTitleEn}
              onChange={(e) => setPageTitleEn(e.target.value)}
            />
            <Input
              label="Page Title (Urdu)"
              dir="rtl"
              className="font-urdu"
              value={pageTitleUr}
              onChange={(e) => setPageTitleUr(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea label="Markdown (English)" rows={8} value={pageEn} onChange={(e) => setPageEn(e.target.value)} />
            <Textarea label="Markdown (Urdu)" dir="rtl" className="font-urdu" rows={8} value={pageUr} onChange={(e) => setPageUr(e.target.value)} />
          </div>
        </Card>
      )}
    </div>
  );
}

export function AuditLogsViewer({ logs }: { logs: AuditLogRow[] }) {
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const entities = Array.from(new Set(logs.map((l) => l.entity)));
  const filtered = logs.filter((l) => {
    if (entityFilter !== 'all' && l.entity !== entityFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        (l.entity_id ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-on-surface">Audit Log History ({filtered.length})</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter action or ID..."
            leftAdornment={<Search className="w-3.5 h-3.5" />}
            className="h-9 text-xs"
          />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-outline-variant bg-surface text-xs font-semibold"
          >
            <option value="all">All Entities</option>
            {entities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((log) => (
          <Card key={log.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-primary">{log.action}</span>
              <span className="ms-2 text-on-surface-variant">
                on {log.entity} ({log.entity_id ?? '—'})
              </span>
            </div>
            <span className="text-outline tabular-nums">{formatDateShort(log.created_at)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
