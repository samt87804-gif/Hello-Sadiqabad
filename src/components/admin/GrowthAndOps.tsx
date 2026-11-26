import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightCircle,
  CheckCircle2,
  Crown,
  Edit2,
  Globe,
  FileSpreadsheet,
  KeyRound,
  ListChecks,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import type {
  AdPlacement,
  AdRow,
  AdStatus,
  AreaRow,
  CategoryRow,
  ImportBatchRow,
  LeadRow,
  LeadStatus,
  PlanFeatures,
  PlanLimits,
  PlanRow,
  ProfileRow,
  StaffMemberRow,
} from '../../types/database';
import type { BusinessPublicView } from '../../types/directory';
import { daysUntil, formatDateShort } from '../../lib/format';
import { isValidHttpsUrl } from '../../lib/phone';
import {
  autoMapCsvHeaders,
  MAX_IMPORT_FILE_SIZE_BYTES,
  detectImportFileType,
  parseCsvText,
  parseSpreadsheetBuffer,
  validateCsvRows,
  validateMappings,
  type CsvColumnMapping,
  type CsvTargetField,
} from '../../lib/csvImport';
import {
  adminManageOwnerListings,
  adminSetUserActive,
  convertLeadToBusiness,
  recordImportBatch,
  updatePlanRow,
  upsertAd,
  upsertLead,
} from '../../lib/api';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { getSupabaseClient } from '../../lib/supabase';
import type { OwnerPublicProfileRow } from '../../types/database';
import { AdminImageUpload } from './AdminImageUpload';

export function LeadsManager({
  leads,
  actorId,
  onReload,
}: {
  leads: LeadRow[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [catText, setCatText] = useState('');
  const [areaText, setAreaText] = useState('');
  const [notes, setNotes] = useState('');

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    await upsertLead(
      { name: name.trim(), phone: phone.trim(), category_text: catText, area_text: areaText, notes },
      actorId
    );
    showToast('Sales lead created!', 'success');
    setName('');
    setPhone('');
    setNotes('');
    setModalOpen(false);
    await onReload();
  };

  const changeLeadStatus = async (lead: LeadRow, status: LeadStatus) => {
    await upsertLead({ ...lead, status }, actorId);
    await onReload();
  };

  const handleConvert = async (leadId: string) => {
    await convertLeadToBusiness(leadId, actorId);
    showToast('Lead converted into draft business listing!', 'success');
    await onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-on-surface">Sales &amp; Onboarding Leads ({leads.length})</h2>
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Lead
        </Button>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-on-surface">{lead.name}</span>
                <span className="text-xs font-bold text-primary tabular-nums" dir="ltr">
                  {lead.phone}
                </span>
                <Badge variant={lead.status === 'converted' ? 'success' : 'warning'}>
                  {lead.status}
                </Badge>
              </div>
              <p className="text-xs text-on-surface-variant">
                {lead.category_text || 'General'} · {lead.area_text || 'Sadiqabad'}
              </p>
              {lead.notes && <p className="text-xs text-outline">{lead.notes}</p>}
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <select
                value={lead.status}
                onChange={(e) => changeLeadStatus(lead, e.target.value as LeadStatus)}
                aria-label={`Status for ${lead.name}`}
                className="h-9 px-2.5 rounded-xl border border-outline-variant bg-surface text-xs font-semibold"
              >
                {(['new', 'contacted', 'interested', 'paid', 'converted', 'dropped', 'not_interested'] as LeadStatus[]).map(
                  (st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  )
                )}
              </select>
              {lead.status !== 'converted' && (
                <Button
                  size="sm"
                  onClick={() => handleConvert(lead.id)}
                  leftIcon={<ArrowRightCircle className="w-3.5 h-3.5" />}
                >
                  Convert to Listing
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Sales Lead">
        <form onSubmit={createLead} className="space-y-3">
          <Input label="Business Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone Number" required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Category" value={catText} onChange={(e) => setCatText(e.target.value)} />
          <Input label="Area / Market" value={areaText} onChange={(e) => setAreaText(e.target.value)} />
          <Textarea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Lead</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function OwnersManager({
  profiles,
  businesses,
  actorId,
  onReload,
}: {
  profiles: Array<ProfileRow & { email?: string; is_active?: boolean; staff?: StaffMemberRow | null }>;
  businesses: BusinessPublicView[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [resetOwner, setResetOwner] = useState<{ id: string; name: string; email: string } | null>(null);
  const [confirmDeactivateOwner, setConfirmDeactivateOwner] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [publicProfiles, setPublicProfiles] = useState<Record<string, OwnerPublicProfileRow>>({});
  const [profileEditorOwner, setProfileEditorOwner] = useState<(ProfileRow & { email?: string }) | null>(null);
  const [profileForm, setProfileForm] = useState<Omit<OwnerPublicProfileRow, 'updated_at' | 'updated_by'>>({
    owner_id: '',
    display_name: '',
    photo_url: '',
    phone: '',
    email: '',
    is_public: false,
    show_name: false,
    show_photo: false,
    show_phone: false,
    show_email: false,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [listingsOwner, setListingsOwner] = useState<(ProfileRow & { email?: string }) | null>(null);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [listingsSaving, setListingsSaving] = useState(false);

  const owners = useMemo(() => profiles.filter((p) => p.role === 'owner'), [profiles]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || owners.length === 0) {
      setPublicProfiles({});
      return;
    }
    let active = true;
    client.from('owner_public_profiles').select('*')
      .in('owner_id', owners.map((owner) => owner.id))
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          showToast(error.message, 'error');
          return;
        }
        const next: Record<string, OwnerPublicProfileRow> = {};
        for (const row of (data ?? []) as OwnerPublicProfileRow[]) next[row.owner_id] = row;
        setPublicProfiles(next);
      });
    return () => { active = false; };
  }, [owners, showToast]);

  const openListingsManager = (owner: ProfileRow & { email?: string }) => {
    setListingsOwner(owner);
    setSelectedListingIds(businesses.filter((business) => business.owner_id === owner.id).map((business) => business.id));
  };

  const saveOwnerListings = async () => {
    if (!listingsOwner) return;
    setListingsSaving(true);
    try {
      const result = await adminManageOwnerListings(listingsOwner.id, selectedListingIds, actorId);
      if (!result.ok) throw new Error(result.error ?? 'Could not update owner listings.');
      showToast(`Owner listings updated (${selectedListingIds.length} assigned).`, 'success');
      setListingsOwner(null);
      await onReload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update owner listings.', 'error');
      await onReload();
    } finally {
      setListingsSaving(false);
    }
  };

  const openPublicProfileEditor = (owner: ProfileRow & { email?: string }) => {
    const saved = publicProfiles[owner.id];
    setProfileEditorOwner(owner);
    setProfileForm(saved ? {
      owner_id: saved.owner_id,
      display_name: saved.display_name ?? owner.full_name ?? '',
      photo_url: saved.photo_url ?? '',
      phone: saved.phone ?? owner.phone ?? '',
      email: saved.email ?? owner.email ?? '',
      is_public: saved.is_public,
      show_name: saved.show_name,
      show_photo: saved.show_photo,
      show_phone: saved.show_phone,
      show_email: saved.show_email,
    } : {
      owner_id: owner.id,
      display_name: owner.full_name ?? '',
      photo_url: '',
      phone: owner.phone ?? '',
      email: owner.email ?? '',
      is_public: false,
      show_name: false,
      show_photo: false,
      show_phone: false,
      show_email: false,
    });
  };

  const savePublicProfile = async () => {
    const client = getSupabaseClient();
    if (!client || !profileEditorOwner) return;
    if (profileForm.photo_url?.trim() && !isValidHttpsUrl(profileForm.photo_url.trim())) {
      showToast('Owner profile photo must be a valid HTTPS URL.', 'error');
      return;
    }
    if ((profileForm.display_name ?? '').trim().length > 120 ||
        (profileForm.phone ?? '').trim().length > 40 ||
        (profileForm.email ?? '').trim().length > 254) {
      showToast('Please check the owner profile field lengths.', 'error');
      return;
    }
    setProfileSaving(true);
    try {
      const payload = {
        ...profileForm,
        display_name: profileForm.display_name?.trim() || null,
        photo_url: profileForm.photo_url?.trim() || null,
        phone: profileForm.phone?.trim() || null,
        email: profileForm.email?.trim().toLowerCase() || null,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await client.from('owner_public_profiles')
        .upsert(payload, { onConflict: 'owner_id' }).select('*').single();
      if (error) throw error;
      setPublicProfiles((current) => ({ ...current, [profileEditorOwner.id]: data as OwnerPublicProfileRow }));
      showToast('Owner public profile and privacy settings saved.', 'success');
      setProfileEditorOwner(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save owner profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const sendPasswordResetLink = async () => {
    if (!resetOwner?.email) return;
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client.auth.resetPasswordForEmail(resetOwner.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast(`Password reset link sent to ${resetOwner.email}. The owner sets their own password.`, 'success');
      setResetOwner(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send password reset link.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-on-surface">Business Owners ({owners.length})</h2>
        <p className="text-xs text-on-surface-variant">
          Manage existing Owner accounts and their business assignments. New standalone access requests are handled in Owner Registration Requests; Add Business-linked invitations are sent from Business Field Approval.
        </p>
      </div>

      <div className="space-y-2.5">
        {owners.map((owner) => {
          const ownedBiz = businesses.filter((b) => b.owner_id === owner.id);
          return (
            <Card key={owner.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">{owner.full_name || 'Owner'}</span>
                  <Badge variant={owner.is_active === false ? 'danger' : 'success'}>
                    {owner.is_active === false ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {owner.email ?? owner.id} · {owner.phone ?? 'No phone'}
                </p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  Listings: {ownedBiz.map((b) => b.name_en).join(', ') || 'None assigned'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openListingsManager(owner)}
                  leftIcon={<ListChecks className="w-3.5 h-3.5" />}
                >
                  Manage Listings
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPublicProfileEditor(owner)}
                  leftIcon={<Globe className="w-3.5 h-3.5" />}
                >
                  Public Profile &amp; Privacy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!owner.email}
                  onClick={() => setResetOwner({ id: owner.id, name: owner.full_name || 'Owner', email: owner.email || '' })}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Send Password Reset Link
                </Button>
                <Button
                  size="sm"
                  variant={owner.is_active === false ? 'primary' : 'danger'}
                  onClick={async () => {
                    if (owner.is_active === false) {
                      await adminSetUserActive(owner.id, true, actorId);
                      showToast('Owner account reactivated.', 'success');
                      await onReload();
                    } else {
                      setConfirmDeactivateOwner({
                        id: owner.id,
                        name: owner.full_name || owner.email || 'Owner',
                      });
                    }
                  }}
                >
                  {owner.is_active === false ? 'Activate' : 'Deactivate'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeactivateOwner)}
        onClose={() => setConfirmDeactivateOwner(null)}
        destructive
        title="Suspend Owner Account?"
        message={`Pause portal access for ${confirmDeactivateOwner?.name ?? 'this owner'}? They will not be able to sign in or edit listings until reactivated.`}
        confirmLabel="Suspend Account"
        onConfirm={async () => {
          if (!confirmDeactivateOwner) return;
          const targetId = confirmDeactivateOwner.id;
          setConfirmDeactivateOwner(null);
          await adminSetUserActive(targetId, false, actorId);
          showToast('Owner account suspended.', 'success');
          await onReload();
        }}
      />

      <Modal
        open={Boolean(listingsOwner)}
        onClose={() => setListingsOwner(null)}
        title={listingsOwner ? `Manage Listings — ${listingsOwner.full_name || listingsOwner.email || 'Owner'}` : 'Manage Owner Listings'}
      >
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Select all businesses this owner should manage. Businesses assigned to another owner are not available here.
          </p>
          <div className="max-h-[55vh] overflow-y-auto space-y-1 rounded-xl border border-outline-variant/40 p-2">
            {businesses.filter((business) => !business.owner_id || business.owner_id === listingsOwner?.id)
              .sort((a, b) => a.name_en.localeCompare(b.name_en))
              .map((business) => {
                const checked = selectedListingIds.includes(business.id);
                return (
                  <label key={business.id} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => setSelectedListingIds((current) =>
                        event.target.checked
                          ? [...current, business.id]
                          : current.filter((id) => id !== business.id)
                      )}
                      className="w-4 h-4 accent-primary shrink-0"
                    />
                    <span className="min-w-0 flex-1">{business.name_en}</span>
                    {business.owner_id === listingsOwner?.id && <Badge variant="success">Assigned</Badge>}
                  </label>
                );
              })}
            {businesses.every((business) => business.owner_id && business.owner_id !== listingsOwner?.id) && (
              <p className="p-3 text-sm text-on-surface-variant">No unassigned businesses are available.</p>
            )}
          </div>
          <p className="text-xs text-on-surface-variant">{selectedListingIds.length} listing(s) selected. Unchecking an assigned listing removes it from this owner; it does not delete the business.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setListingsOwner(null)}>Cancel</Button>
            <Button loading={listingsSaving} onClick={() => void saveOwnerListings()}>Save Listings</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(profileEditorOwner)}
        onClose={() => setProfileEditorOwner(null)}
        title={profileEditorOwner ? `Public Profile — ${profileEditorOwner.full_name || profileEditorOwner.email || 'Owner'}` : 'Public Owner Profile'}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-primary-fixed/30 border border-primary/20 text-xs text-on-surface-variant">
            Owner information stays private unless the profile is enabled and each individual field is selected below. The profile photo URL is managed by Admin.
          </div>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={profileForm.is_public} onChange={(e) => setProfileForm((p) => ({ ...p, is_public: e.target.checked }))} className="w-4 h-4 accent-primary" />
            Enable public owner profile
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Public Display Name" maxLength={120} value={profileForm.display_name ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, display_name: e.target.value }))} />
            <div className="space-y-2"><Input label="Admin-managed Profile Photo URL (HTTPS)" dir="ltr" value={profileForm.photo_url ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, photo_url: e.target.value }))} placeholder="https://..." /><AdminImageUpload purpose="profile" onUploaded={(url) => setProfileForm((p) => ({ ...p, photo_url: url }))} /></div>
            <Input label="Public Contact Phone" dir="ltr" maxLength={40} value={profileForm.phone ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
            <Input label="Public Contact Email" type="email" dir="ltr" maxLength={254} value={profileForm.email ?? ''} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2 border-t border-outline-variant/30 pt-3">
            <p className="text-xs font-bold text-on-surface">Field-level visibility</p>
            {([
              ['show_name', 'Show owner name'],
              ['show_photo', 'Show profile photo'],
              ['show_phone', 'Show contact phone'],
              ['show_email', 'Show contact email'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-on-surface">
                <input type="checkbox" checked={profileForm[key]} disabled={!profileForm.is_public} onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 accent-primary" />
                {label}
              </label>
            ))}
            {!profileForm.is_public && <p className="text-xs text-on-surface-variant">Enable the profile to select public fields. All fields remain hidden while disabled.</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProfileEditorOwner(null)}>Cancel</Button>
            <Button loading={profileSaving} onClick={() => void savePublicProfile()}>Save Privacy Settings</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(resetOwner)}
        onClose={() => setResetOwner(null)}
        title="Send Owner Password Reset Link?"
        message={resetOwner ? `Send a secure password-reset email to ${resetOwner.name} at ${resetOwner.email}? The Owner will choose their own new password.` : ''}
        confirmLabel="Send Reset Link"
        onConfirm={sendPasswordResetLink}
      />
    </div>
  );
}

const TARGET_FIELD_OPTIONS: Array<{ value: CsvTargetField; label: string }> = [
  { value: 'ignore', label: 'Ignore Column' },
  { value: 'name_en', label: 'Business Name (EN)' },
  { value: 'name_ur', label: 'Business Name (UR)' },
  { value: 'phone', label: 'Primary Phone' },
  { value: 'whatsapp', label: 'WhatsApp Number' },
  { value: 'category', label: 'Category' },
  { value: 'area', label: 'Area / Neighborhood' },
  { value: 'address', label: 'Street Address' },
  { value: 'landmark', label: 'Landmark' },
  { value: 'description_en', label: 'Description (EN)' },
  { value: 'is_verified', label: 'Verified (true/false)' },
  { value: 'home_delivery', label: 'Home Delivery (true/false)' },
];

const SAMPLE_IMPORT_CSV =
  'name_en,phone_primary,category,area,address_en\nBismillah Bakery,0300-4455112,restaurants,rail-bazaar,Rail Bazaar Chowk Sadiqabad\nAl-Noor Solar Traders,0301-8899002,electronics,klp-road,KLP Road Sadiqabad';

export function ImportManager({
  categories,
  areas,
  businesses,
  batches,
  actorId,
  onReload,
}: {
  categories: CategoryRow[];
  areas: AreaRow[];
  businesses: BusinessPublicView[];
  batches: ImportBatchRow[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [fileName, setFileName] = useState('sadiqabad_paste.csv');
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [fileMatrix, setFileMatrix] = useState<string[][] | null>(null);
  const [csvText, setCsvText] = useState(SAMPLE_IMPORT_CSV);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [customMappings, setCustomMappings] = useState<CsvColumnMapping[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [lastSummary, setLastSummary] = useState<{
    filename: string;
    imported: number;
    duplicates: number;
    errors: number;
    issues: Array<{ row: number; reason: string }>;
  } | null>(null);

  const parsedMatrix = useMemo(
    () => (fileMatrix ? fileMatrix : parseCsvText(csvText)),
    [fileMatrix, csvText]
  );
  const headers = parsedMatrix[0] ?? [];
  const dataRows = parsedMatrix.slice(1);

  const activeMappings = useMemo(() => {
    if (customMappings && customMappings.length === headers.length) return customMappings;
    return autoMapCsvHeaders(headers);
  }, [headers, customMappings]);

  const mappingCheck = useMemo(() => validateMappings(activeMappings), [activeMappings]);

  const existingPhones = useMemo(
    () => businesses.map((b) => b.phone_normalized).filter(Boolean),
    [businesses]
  );

  const validatedRows = useMemo(
    () =>
      dataRows.length > 0 && mappingCheck.valid
        ? validateCsvRows(dataRows, activeMappings, categories, areas, existingPhones)
        : [],
    [dataRows, mappingCheck.valid, activeMappings, categories, areas, existingPhones]
  );

  const validRows = validatedRows.filter((r) => r.isValid);
  const duplicateRows = validatedRows.filter((r) => r.isDuplicate);
  const errorRows = validatedRows.filter((r) => !r.isValid);
  const displayedRows = showIssuesOnly ? errorRows : validatedRows;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      const msg = 'The selected file is too large. Maximum supported size is 20 MB.';
      setParseError(msg);
      showToast(msg, 'error');
      return;
    }

    const fileType = detectImportFileType(file.name, file.type);
    if (!fileType) {
      const msg = 'Unsupported file format. Upload a .xlsx or .csv file.';
      setParseError(msg);
      showToast(msg, 'error');
      return;
    }

    setParseError(null);
    setLastSummary(null);
    setCustomMappings(null);
    setFileName(file.name);

    try {
      if (fileType === 'xlsx') {
        const buffer = await file.arrayBuffer();
        const { sheetName: firstSheet, rows } = parseSpreadsheetBuffer(buffer, file.name);
        setFileMatrix(rows);
        setSheetName(firstSheet);
        showToast(
          `Loaded ${file.name} (sheet "${firstSheet}", ${Math.max(0, rows.length - 1)} rows).`,
          'info'
        );
      } else {
        const text = await file.text();
        setFileMatrix(null);
        setSheetName(null);
        setCsvText(text);
        showToast(`Loaded ${file.name}`, 'info');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to parse ${file.name}.`;
      setFileMatrix(null);
      setSheetName(null);
      setParseError(msg);
      showToast(msg, 'error');
    }
  };

  const updateColumnMapping = (idx: number, target: CsvTargetField) => {
    const base = [...activeMappings];
    base[idx] = { ...base[idx], target };
    setCustomMappings(base);
  };

  const resetToPasteMode = () => {
    setFileMatrix(null);
    setSheetName(null);
    setParseError(null);
    setCustomMappings(null);
    setFileName('sadiqabad_paste.csv');
    setCsvText(SAMPLE_IMPORT_CSV);
  };

  const runImport = async () => {
    if (!mappingCheck.valid) {
      showToast(
        `Map required columns first: ${mappingCheck.missingFields.join(', ')}.`,
        'error'
      );
      return;
    }
    if (validRows.length === 0) {
      showToast('No valid non-duplicate rows ready to import.', 'error');
      return;
    }

    setImporting(true);
    try {
      const payloadRows = validRows.map((r) => ({
        name_en: r.name_en,
        name_ur: r.name_ur,
        phone_primary: r.phone_primary,
        whatsapp: r.whatsapp,
        category_id: r.category_id!,
        area_id: r.area_id,
        address_en: r.address_en,
        landmark_en: r.landmark_en,
        description_en: r.description_en,
        is_verified: r.is_verified,
        home_delivery: r.home_delivery,
        status: 'draft' as const,
        source: sheetName ? 'xlsx_import' : 'csv_import',
      }));
      const batchErrors = errorRows.map((r) => ({
        row: r.rowNumber,
        reason: r.errors.join('; '),
      }));
      const finalFileName =
        fileName || `import_${new Date().toISOString().slice(0, 10)}.csv`;

      await recordImportBatch(
        {
          filename: finalFileName,
          total_rows: validatedRows.length,
          imported_count: payloadRows.length,
          failed_count: batchErrors.length,
          errors: batchErrors,
          created_by: actorId,
        },
        payloadRows,
        actorId
      );
      setLastSummary({
        filename: finalFileName,
        imported: payloadRows.length,
        duplicates: duplicateRows.length,
        errors: batchErrors.length,
        issues: batchErrors,
      });
      showToast(
        `Imported ${payloadRows.length} draft listings (${batchErrors.length} blocked/skipped).`,
        'success'
      );
      await onReload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bulk import failed. Please retry.';
      showToast(msg, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Bulk .XLSX &amp; .CSV Importer
            </h2>
            <p className="text-xs text-on-surface-variant">
              Upload an Excel (.xlsx) or CSV (.csv) file, or paste CSV rows below. Invalid categories/areas and duplicate phone numbers are flagged and blocked before import.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="min-h-[38px] px-3.5 rounded-xl border border-outline-variant bg-surface-container-low text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:border-primary">
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Upload .XLSX / .CSV</span>
              <input
                type="file"
                accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <Button
              onClick={runImport}
              loading={importing}
              disabled={!mappingCheck.valid || validRows.length === 0}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Import {validRows.length} Valid Listings
            </Button>
          </div>
        </div>

        {parseError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center justify-between gap-2"
          >
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {parseError}
            </span>
            <button
              type="button"
              onClick={() => setParseError(null)}
              className="underline font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {fileMatrix ? (
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-on-surface">
                Loaded Excel Workbook: <span dir="ltr">{fileName}</span>
              </p>
              <p className="text-on-surface-variant">
                First sheet: <strong>{sheetName}</strong> · {dataRows.length} data row(s) detected
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={resetToPasteMode}>
              Switch to Paste CSV
            </Button>
          </div>
        ) : (
          <Textarea
            rows={5}
            dir="ltr"
            className="font-mono text-xs"
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setFileName('sadiqabad_paste.csv');
              setSheetName(null);
              setParseError(null);
              setCustomMappings(null);
            }}
          />
        )}

        {/* Interactive Column Mapping */}
        {headers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-outline-variant/25">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-on-surface">Column Mapping:</span>
              {!mappingCheck.valid && (
                <span className="text-xs font-bold text-error inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Map required columns: {mappingCheck.missingFields.join(', ')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {activeMappings.map((col, idx) => (
                <div key={`${col.headerName}-${idx}`} className="p-2.5 rounded-xl bg-surface-container-low space-y-1">
                  <span className="block text-[11px] font-bold text-on-surface truncate" title={col.headerName}>
                    {col.headerName || `Column ${idx + 1}`}
                  </span>
                  <select
                    value={col.target}
                    onChange={(e) => updateColumnMapping(idx, e.target.value as CsvTargetField)}
                    className="w-full h-8 px-2 rounded-lg border border-outline-variant bg-surface text-[11px] font-semibold"
                  >
                    {TARGET_FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post-Import Result Summary */}
        {lastSummary && (
          <div className="p-4 rounded-xl bg-surface-container-low border border-primary/30 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-on-surface">
                Import Complete — <span dir="ltr">{lastSummary.filename}</span>
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="success">Imported: {lastSummary.imported}</Badge>
                {lastSummary.duplicates > 0 && (
                  <Badge variant="warning">Duplicates Blocked: {lastSummary.duplicates}</Badge>
                )}
                {lastSummary.errors > 0 && (
                  <Badge variant="danger">Total Skipped: {lastSummary.errors}</Badge>
                )}
              </div>
            </div>
            {lastSummary.issues.length > 0 && (
              <div className="text-on-surface-variant space-y-0.5 max-h-28 overflow-y-auto pt-1">
                {lastSummary.issues.slice(0, 10).map((iss) => (
                  <p key={`${iss.row}-${iss.reason}`}>
                    • Row #{iss.row}: {iss.reason}
                  </p>
                ))}
                {lastSummary.issues.length > 10 && (
                  <p className="font-semibold">
                    + {lastSummary.issues.length - 10} more skipped rows logged in Batch History below.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Validation Preview Summary & Table */}
        {validatedRows.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-outline-variant/25">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">Rows: {validatedRows.length}</Badge>
                <Badge variant="success">Ready: {validRows.length}</Badge>
                {duplicateRows.length > 0 && (
                  <Badge variant="warning">Duplicates Blocked: {duplicateRows.length}</Badge>
                )}
                {errorRows.length > 0 && (
                  <Badge variant="danger">Blocked / Errors: {errorRows.length}</Badge>
                )}
              </div>
              {errorRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowIssuesOnly((v) => !v)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {showIssuesOnly
                    ? 'Show All Rows'
                    : `Show Blocked / Error Rows Only (${errorRows.length})`}
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-96 rounded-xl border border-outline-variant/30">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold sticky top-0">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Business</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">Category / Area</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {displayedRows.slice(0, 50).map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="p-2.5 tabular-nums text-on-surface-variant">#{row.rowNumber}</td>
                      <td className="p-2.5 font-semibold text-on-surface">{row.name_en || '—'}</td>
                      <td className="p-2.5 tabular-nums" dir="ltr">{row.phone_primary || '—'}</td>
                      <td className="p-2.5 text-on-surface-variant">
                        {row.category_label} · {row.area_label}
                      </td>
                      <td className="p-2.5">
                        {!row.isValid ? (
                          <span className="text-error font-semibold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {row.errors.join('; ')}
                          </span>
                        ) : (
                          <span className="text-primary font-semibold">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {displayedRows.length > 50 && (
              <p className="text-[11px] text-on-surface-variant">
                Showing first 50 of {displayedRows.length} rows in preview table.
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-on-surface">Import Batch History</h3>
        {batches.map((b) => (
          <Card key={b.id} className="p-4 flex items-center justify-between gap-3 flex-wrap text-xs">
            <div>
              <p className="font-bold text-on-surface" dir="ltr">{b.filename}</p>
              <span className="text-outline">{formatDateShort(b.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <Badge variant="success">Imported: {b.imported_count}</Badge>
              {b.failed_count > 0 && <Badge variant="danger">Skipped: {b.failed_count}</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getAdDisplayStatus(ad: AdRow, today: string): string {
  if (ad.status === 'active' && ad.start_date > today) return 'scheduled';
  if (ad.status === 'active' && ad.end_date < today) return 'expired';
  return ad.status;
}

export function AdsManager({
  ads,
  businesses,
  actorId,
  onReload,
}: {
  ads: AdRow[];
  businesses: BusinessPublicView[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdRow | null>(null);
  const [confirmRejectAd, setConfirmRejectAd] = useState<AdRow | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? '');
  const [placement, setPlacement] = useState<AdPlacement>('homepage_top');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
  const totals = useMemo(() => {
    const impressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
    const clicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
    return {
      active: ads.filter((ad) => getAdDisplayStatus(ad, today) === 'active').length,
      pending: ads.filter((ad) => ad.status === 'pending').length,
      impressions,
      clicks,
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0',
    };
  }, [ads, today]);

  const filteredAds = useMemo(() => ads.filter((ad) => {
    const business = businesses.find((item) => item.id === ad.business_id);
    const haystack = [ad.title, business?.name_en ?? '', ad.placement, ad.notes ?? ''].join(' ').toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) &&
      (statusFilter === 'all' || getAdDisplayStatus(ad, today) === statusFilter) &&
      (placementFilter === 'all' || ad.placement === placementFilter);
  }), [ads, businesses, query, statusFilter, placementFilter, today]);

  const openCreateModal = () => {
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + 30);
    const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(endDateObj);
    setEditingAd(null);
    setTitle('');
    setBusinessId(businesses[0]?.id ?? '');
    setPlacement('homepage_top');
    setImageUrl('');
    setTargetUrl('');
    setNotes('');
    setStartDate(today);
    setEndDate(end);
    setModalOpen(true);
  };

  const openEditModal = (ad: AdRow) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setBusinessId(ad.business_id);
    setPlacement(ad.placement);
    setImageUrl(ad.image_url);
    setTargetUrl(ad.target_url ?? '');
    setNotes(ad.notes ?? '');
    setStartDate(ad.start_date);
    setEndDate(ad.end_date);
    setModalOpen(true);
  };

  const saveAdForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      showToast('Select a sponsoring business first.', 'error');
      return;
    }
    if (!isValidHttpsUrl(imageUrl)) {
      showToast('Banner image URL must be valid HTTPS.', 'error');
      return;
    }
    const destination = targetUrl.trim();
    const safeInternal = destination.startsWith('/') && !destination.startsWith('//') &&
      /^\/[A-Za-z0-9/_?&=#%+.-]*$/.test(destination);
    if (destination && !safeInternal && !isValidHttpsUrl(destination)) {
      showToast('Target URL must be HTTPS or a safe same-site path (not //host).', 'error');
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      showToast('Choose a valid campaign start and end date.', 'error');
      return;
    }
    const business = businesses.find((item) => item.id === businessId);
    const fallbackTarget = business ? '/business/' + business.slug : null;
    try {
      await upsertAd({
        id: editingAd?.id,
        title: title.trim(),
        business_id: businessId,
        placement,
        image_url: imageUrl.trim(),
        target_url: destination || fallbackTarget,
        notes: notes.trim() || null,
        start_date: startDate,
        end_date: endDate,
        status: editingAd?.status ?? 'active',
      }, actorId);
      showToast(editingAd ? 'Sponsored campaign updated!' : 'Sponsored campaign created!', 'success');
      setModalOpen(false);
      setEditingAd(null);
      await onReload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save sponsored campaign.', 'error');
    }
  };

  const setStatus = async (ad: AdRow, status: AdStatus) => {
    try {
      await upsertAd({ ...ad, status }, actorId);
      showToast('Campaign status set to ' + status + '.', 'success');
      await onReload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update campaign status.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" /> Sponsored Campaigns ({ads.length})
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">Manage placement, schedule, approvals and live performance.</p>
        </div>
        <Button onClick={openCreateModal} disabled={businesses.length === 0} leftIcon={<Plus className="w-4 h-4" />}>
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <Card className="p-3"><p className="text-[11px] text-on-surface-variant">Live campaigns</p><p className="text-2xl font-extrabold text-primary tabular-nums">{totals.active}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-on-surface-variant">Pending review</p><p className="text-2xl font-extrabold tabular-nums">{totals.pending}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-on-surface-variant">Impressions</p><p className="text-2xl font-extrabold tabular-nums">{totals.impressions.toLocaleString()}</p></Card>
        <Card className="p-3"><p className="text-[11px] text-on-surface-variant">Clicks</p><p className="text-2xl font-extrabold tabular-nums">{totals.clicks.toLocaleString()}</p></Card>
        <Card className="p-3 col-span-2 lg:col-span-1"><p className="text-[11px] text-on-surface-variant">Overall CTR</p><p className="text-2xl font-extrabold tabular-nums">{totals.ctr}%</p></Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <input aria-label="Search campaigns" placeholder="Search title, business or notes…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm" />
        <select aria-label="Filter by campaign status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm">
          <option value="all">All statuses</option><option value="active">Live</option><option value="scheduled">Scheduled</option><option value="pending">Pending</option><option value="paused">Paused</option><option value="expired">Expired</option><option value="rejected">Rejected</option>
        </select>
        <select aria-label="Filter by placement" value={placementFilter} onChange={(e) => setPlacementFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm">
          <option value="all">All placements</option><option value="homepage_top">Homepage Top</option><option value="search_sidebar">Search Sidebar</option><option value="category_banner">Category Banner</option><option value="popup">Popup</option><option value="emergency_banner">Government Helplines</option><option value="authorities_banner">Local Authorities</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredAds.map((ad) => {
          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
          const status = getAdDisplayStatus(ad, today);
          const business = businesses.find((item) => item.id === ad.business_id);
          return (
            <Card key={ad.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <img src={ad.image_url} alt="" className="w-full sm:w-28 h-24 object-cover rounded-xl bg-surface-container shrink-0" loading="lazy" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{ad.title}</span>
                  <Badge variant={status === 'active' ? 'success' : status === 'pending' || status === 'scheduled' ? 'warning' : status === 'rejected' ? 'danger' : 'neutral'}>{status}</Badge>
                  <Badge variant="secondary">{ad.placement}</Badge>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{business?.name_en ?? 'Business listing'} · {formatDateShort(ad.start_date)} – {formatDateShort(ad.end_date)}</p>
                <p className="text-xs text-on-surface-variant tabular-nums mt-1">Impressions: {ad.impressions.toLocaleString()} · Clicks: {ad.clicks.toLocaleString()} · CTR: {ctr}%</p>
                {ad.notes && <p className="text-xs text-outline mt-1 line-clamp-2">{ad.notes}</p>}
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openEditModal(ad)} leftIcon={<Edit2 className="w-3.5 h-3.5" />}>Edit</Button>
                {ad.status === 'pending' && <><Button size="sm" onClick={() => setStatus(ad, 'active')}>Approve</Button><Button size="sm" variant="danger" onClick={() => setConfirmRejectAd(ad)}>Reject</Button></>}
                {ad.status !== 'pending' && <Button size="sm" variant="outline" onClick={() => setStatus(ad, ad.status === 'active' ? 'paused' : 'active')}>{ad.status === 'active' ? 'Pause' : 'Activate'}</Button>}
              </div>
            </Card>
          );
        })}
        {filteredAds.length === 0 && <Card className="p-8 text-center text-sm text-on-surface-variant">No campaigns match these filters.</Card>}
      </div>

      <ConfirmDialog
        open={Boolean(confirmRejectAd)}
        onClose={() => setConfirmRejectAd(null)}
        destructive
        title="Reject Sponsored Campaign?"
        message={'Reject "' + (confirmRejectAd?.title ?? '') + '"? The campaign will no longer be eligible to display.'}
        confirmLabel="Reject Campaign"
        onConfirm={async () => {
          if (!confirmRejectAd) return;
          const target = confirmRejectAd;
          setConfirmRejectAd(null);
          await setStatus(target, 'rejected');
        }}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAd ? 'Edit Campaign — ' + editingAd.title : 'Create Sponsored Campaign'}>
        <form onSubmit={saveAdForm} className="space-y-3">
          <Input label="Campaign Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select label="Sponsoring Business" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name_en}</option>)}
          </Select>
          <Select label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value as AdPlacement)}>
            <option value="homepage_top">Homepage Top Spotlight</option>
            <option value="search_sidebar">Search Sidebar</option>
            <option value="category_banner">Category Banner</option>
            <option value="popup">Popup Spotlight Modal</option>
            <option value="emergency_banner">Government Helplines Banner</option>
            <option value="authorities_banner">Local Authorities Banner</option>
          </Select>
          <div className="space-y-2"><Input label="Banner Image URL (HTTPS)" required dir="ltr" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /><AdminImageUpload purpose="campaign" onUploaded={setImageUrl} /></div>
          {imageUrl && isValidHttpsUrl(imageUrl) && <img src={imageUrl} alt="Campaign preview" className="w-full max-h-44 object-cover rounded-xl border border-outline-variant" />}
          <Input label="Target URL (optional; defaults to business profile)" dir="ltr" placeholder="https://… or /business/slug" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Start Date" type="date" required dir="ltr" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" required dir="ltr" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Textarea label="Campaign Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">{editingAd ? 'Save Changes' : 'Create Campaign'}</Button></div>
        </form>
      </Modal>
    </div>
  );
}

export function PlansManager({
  plans,
  businesses,
  actorId,
  onReload,
}: {
  plans: PlanRow[];
  businesses: BusinessPublicView[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null);
  const [priceNote, setPriceNote] = useState('');
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [saving, setSaving] = useState(false);

  const expiring = businesses.filter((b) => {
    if (b.plan_code === 'free' || !b.plan_expires_at) return false;
    const d = daysUntil(b.plan_expires_at);
    return d !== null && d <= 30;
  });

  const openEditPlan = (plan: PlanRow) => {
    setEditingPlan(plan);
    setPriceNote(plan.price_note);
    setLimits({ ...plan.limits });
    setFeatures({ ...plan.features });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !limits || !features) return;
    setSaving(true);
    try {
      await updatePlanRow(
        {
          ...editingPlan,
          price_note: priceNote,
          limits: { ...limits, gallery: limits.max_photos, videos: limits.max_videos },
          features,
        },
        actorId
      );
      showToast(`Updated ${editingPlan.name_en} configuration!`, 'success');
      setEditingPlan(null);
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-secondary" />
                {p.name_en}
              </h3>
              <Badge variant="primary">{p.code}</Badge>
            </div>
            <p className="text-xs text-on-surface-variant">{p.price_note}</p>
            <div className="text-xs space-y-1 pt-2 border-t border-outline-variant/25">
              <div className="flex justify-between">
                <span>Max Photos:</span>
                <strong className="tabular-nums">{p.limits.max_photos}</strong>
              </div>
              <div className="flex justify-between">
                <span>Max Offers:</span>
                <strong className="tabular-nums">{p.limits.offers}</strong>
              </div>
              <div className="flex justify-between">
                <span>Social Links:</span>
                <strong className="tabular-nums">{p.limits.social_links}</strong>
              </div>
              <div className="flex justify-between">
                <span>Search Priority:</span>
                <strong className="tabular-nums">Tier {p.limits.search_priority}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditPlan(p)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Limits &amp; Features
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-3">
        <h3 className="text-base font-bold text-on-surface">
          Upcoming Plan Expirations (Next 30 Days)
        </h3>
        {expiring.length === 0 ? (
          <p className="text-xs text-on-surface-variant inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-tertiary" /> No paid plans expiring within 30 days.
          </p>
        ) : (
          <div className="space-y-2">
            {expiring.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-on-surface">{b.name_en}</span>
                  <span className="ms-2 text-secondary font-semibold uppercase">{b.plan_code}</span>
                </div>
                <span className="font-bold text-error tabular-nums">
                  Expires {formatDateShort(b.plan_expires_at)} ({daysUntil(b.plan_expires_at)}d)
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        title={`Edit Plan — ${editingPlan?.name_en ?? ''}`}
        maxWidthClass="max-w-xl"
      >
        {limits && features && (
          <form onSubmit={handleSavePlan} className="space-y-4">
            <Input
              label="Pricing Note"
              value={priceNote}
              onChange={(e) => setPriceNote(e.target.value)}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Max Photos"
                type="number"
                dir="ltr"
                value={limits.max_photos}
                onChange={(e) => setLimits({ ...limits, max_photos: Math.max(0, Number(e.target.value)) })}
              />
              <Input
                label="Max Videos"
                type="number"
                dir="ltr"
                value={limits.max_videos}
                onChange={(e) => setLimits({ ...limits, max_videos: Math.max(0, Number(e.target.value)) })}
              />
              <Input
                label="Max Offers"
                type="number"
                dir="ltr"
                value={limits.offers}
                onChange={(e) => setLimits({ ...limits, offers: Math.max(0, Number(e.target.value)) })}
              />
              <Input
                label="Social Links Cap"
                type="number"
                dir="ltr"
                value={limits.social_links}
                onChange={(e) => setLimits({ ...limits, social_links: Math.max(0, Number(e.target.value)) })}
              />
              <Input
                label="Search Priority Tier"
                type="number"
                dir="ltr"
                value={limits.search_priority}
                onChange={(e) => setLimits({ ...limits, search_priority: Math.max(1, Number(e.target.value)) })}
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-on-surface">Plan Feature Flags:</span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(features) as Array<keyof PlanFeatures>).map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low text-xs font-semibold cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(features[key])}
                      onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Plan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
