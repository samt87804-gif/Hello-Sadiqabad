import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Link2, Plus, Search, ShieldCheck, UserRound } from 'lucide-react';
import type { AuthorityProfileRow } from '../../types/database';
import type { BusinessPublicView } from '../../types/directory';
import { slugify } from '../../lib/format';
import { isValidHttpsUrl } from '../../lib/phone';
import { upsertAuthorityProfile } from '../../lib/api';
import { AdminImageUpload } from './AdminImageUpload';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/FormFields';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

type ProfileDraft = Partial<AuthorityProfileRow> & {
  name_en: string;
  name_ur: string;
  slug: string;
};

const EMPTY: ProfileDraft = {
  name_en: '', name_ur: '', slug: '', photo_url: null,
  designation_en: null, designation_ur: null, organization_en: null, organization_ur: null,
  status_label_en: null, status_label_ur: null, authority_en: null, authority_ur: null,
  bio_en: null, bio_ur: null, phone: null, email: null, website_url: null,
  facebook_url: null, instagram_url: null, business_ids: [],
  show_status: true, show_organization: true, show_authority: true,
  show_bio: true, show_contact: true, show_businesses: true,
  source_url: null, sort_order: 0, is_active: true,
};

const textFields = [
  ['designation_en', 'Designation (English)'],
  ['designation_ur', 'Designation (Urdu)'],
  ['organization_en', 'Organization / Union (English)'],
  ['organization_ur', 'Organization / Union (Urdu)'],
  ['status_label_en', 'Current status (English)'],
  ['status_label_ur', 'Current status (Urdu)'],
] as const;

function optional(value: string): string | null { return value.trim() || null; }

export function AuthorityProfilesManager({
  profiles,
  businesses,
  actorId,
  onReload,
}: {
  profiles: AuthorityProfileRow[];
  businesses: BusinessPublicView[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileDraft>({ ...EMPTY });
  const [businessQuery, setBusinessQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof ProfileDraft, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }) as ProfileDraft);
  const publishedBusinesses = useMemo(() => businesses.filter((business) => business.status === 'published'), [businesses]);
  const matchingBusinesses = useMemo(() => {
    const term = businessQuery.trim().toLocaleLowerCase('en');
    return publishedBusinesses.filter((business) => !term || business.name_en.toLocaleLowerCase('en').includes(term)).slice(0, 80);
  }, [publishedBusinesses, businessQuery]);

  const create = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setBusinessQuery('');
    setModalOpen(true);
  };
  const edit = (profile: AuthorityProfileRow) => {
    setEditingId(profile.id);
    setForm({ ...profile });
    setBusinessQuery('');
    setModalOpen(true);
  };
  const toggleBusiness = (id: string) => {
    const current = form.business_ids ?? [];
    update('business_ids', current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name_en.trim()) {
      showToast('Please enter the person’s name.', 'error');
      return;
    }
    if (!form.slug.trim()) {
      showToast('Please enter a profile URL slug.', 'error');
      return;
    }
    const urls = [
      ['Website', form.website_url], ['Facebook', form.facebook_url],
      ['Instagram', form.instagram_url], ['Source', form.source_url],
    ] as const;
    for (const [label, value] of urls) {
      if (value && !isValidHttpsUrl(value)) {
        showToast(`${label} URL must be a valid HTTPS link.`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await upsertAuthorityProfile({
        ...form,
        id: editingId ?? undefined,
        name_en: form.name_en.trim(),
        name_ur: form.name_ur?.trim() || '',
        slug: slugify(form.slug),
        business_ids: form.business_ids ?? [],
        created_by: editingId ? form.created_by : actorId,
        source_url: optional(form.source_url ?? ''),
        verified_at: form.source_url ? new Date().toISOString() : null,
      }, actorId);
      showToast(editingId ? 'Authority profile updated.' : 'Authority profile created.', 'success');
      setModalOpen(false);
      await onReload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save authority profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Authority Profiles ({profiles.length})</h2>
          <p className="mt-1 text-xs text-on-surface-variant">Create public profiles for union chairmen, association presidents, elected representatives and government officers. All public fields are controlled here.</p>
        </div>
        <Button onClick={create} leftIcon={<Plus className="w-4 h-4" />}>Add Profile</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-4 flex gap-3">
            <div className="w-20 h-20 rounded-2xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
              {profile.photo_url ? <img src={profile.photo_url} alt={profile.name_en} className="w-full h-full object-cover" /> : <UserRound className="w-8 h-8 text-outline" />}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><h3 className="font-bold text-sm truncate">{profile.name_en}</h3><p className="text-xs text-primary truncate">{profile.designation_en || 'Authority profile'}</p></div>
                <Badge variant={profile.is_active ? 'success' : 'neutral'}>{profile.is_active ? 'Public' : 'Hidden'}</Badge>
              </div>
              <p className="text-xs text-on-surface-variant truncate">{profile.organization_en || 'Organization not set'}</p>
              <p className="text-[10px] text-outline">{profile.business_ids?.length ?? 0} linked businesses · /authority-profiles/{profile.slug}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => edit(profile)}>Edit profile</Button>
                <Link to={`/authority-profiles/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-container-low">Preview public profile</Link>
                <Button size="sm" variant="outline" onClick={async () => {
                  try { await upsertAuthorityProfile({ ...profile, is_active: !profile.is_active }, actorId); await onReload(); }
                  catch (error) { showToast(error instanceof Error ? error.message : 'Could not update visibility.', 'error'); }
                }}>{profile.is_active ? 'Hide' : 'Publish'}</Button>
              </div>
            </div>
          </Card>
        ))}
        {profiles.length === 0 && <Card className="p-8 text-center text-sm text-on-surface-variant md:col-span-2">No authority profiles yet. Add the first chairman or office-holder profile.</Card>}
      </div>

      <Modal open={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editingId ? 'Edit Authority Profile' : 'Create Authority Profile'}>
        <form onSubmit={save} className="space-y-4">
          <section className="rounded-2xl border border-outline-variant/40 p-3 space-y-3">
            <div className="flex items-center gap-2"><UserRound className="w-4 h-4 text-primary" /><h3 className="text-sm font-extrabold">Person & identity</h3></div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container shrink-0 flex items-center justify-center">
                {form.photo_url ? <img src={form.photo_url} alt="Profile preview" className="w-full h-full object-cover" /> : <Camera className="w-7 h-7 text-outline" />}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <label className="text-xs font-bold text-on-surface">Profile photo (auto-compressed WebP · max 15 MB original)</label>
                <AdminImageUpload purpose="profile" disabled={saving} onUploadingChange={setUploading} onUploaded={(url) => update('photo_url', url)} label="Upload profile photo" />
                {uploading && <p className="text-xs text-primary">Compressing and uploading photo…</p>}
              </div>
            </div>
            <Input label="Full name (English)" required value={form.name_en} onChange={(event) => { const value = event.target.value; update('name_en', value); if (!editingId || !form.slug) update('slug', slugify(value)); }} />
            <Input label="Full name (Urdu)" dir="rtl" className="font-urdu" value={form.name_ur ?? ''} onChange={(event) => update('name_ur', event.target.value)} />
            <Input label="Public profile URL slug" required value={form.slug} onChange={(event) => update('slug', slugify(event.target.value))} hint="Example: press-club-chairman" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {textFields.map(([key, label]) => <Input key={key} label={label} dir={key.endsWith('_ur') ? 'rtl' : 'ltr'} className={key.endsWith('_ur') ? 'font-urdu' : ''} value={(form[key] as string | null) ?? ''} onChange={(event) => update(key, optional(event.target.value))} />)}
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/40 p-3 space-y-3">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /><h3 className="text-sm font-extrabold">Authority & public description</h3></div>
            <Textarea label="Authority / responsibilities (English)" rows={3} value={form.authority_en ?? ''} onChange={(event) => update('authority_en', optional(event.target.value))} />
            <Textarea label="اختیارات اور ذمہ داریاں (Urdu)" rows={3} dir="rtl" className="font-urdu" value={form.authority_ur ?? ''} onChange={(event) => update('authority_ur', optional(event.target.value))} />
            <Textarea label="Profile introduction / biography (English)" rows={3} value={form.bio_en ?? ''} onChange={(event) => update('bio_en', optional(event.target.value))} />
            <Textarea label="تعارف / سوانح (Urdu)" rows={3} dir="rtl" className="font-urdu" value={form.bio_ur ?? ''} onChange={(event) => update('bio_ur', optional(event.target.value))} />
          </section>

          <section className="rounded-2xl border border-outline-variant/40 p-3 space-y-3">
            <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /><h3 className="text-sm font-extrabold">Contact & online links</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Phone" value={form.phone ?? ''} onChange={(event) => update('phone', optional(event.target.value))} />
              <Input label="Email" type="email" value={form.email ?? ''} onChange={(event) => update('email', optional(event.target.value))} />
              <Input label="Website (HTTPS)" value={form.website_url ?? ''} onChange={(event) => update('website_url', optional(event.target.value))} />
              <Input label="Facebook (HTTPS)" value={form.facebook_url ?? ''} onChange={(event) => update('facebook_url', optional(event.target.value))} />
              <Input label="Instagram (HTTPS)" value={form.instagram_url ?? ''} onChange={(event) => update('instagram_url', optional(event.target.value))} />
              <Input label="Reference / source URL (HTTPS)" value={form.source_url ?? ''} onChange={(event) => update('source_url', optional(event.target.value))} />
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/40 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">Link public businesses</h3><Badge>{form.business_ids?.length ?? 0} selected</Badge></div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 h-10"><Search className="w-4 h-4 text-outline" /><input value={businessQuery} onChange={(event) => setBusinessQuery(event.target.value)} placeholder="Search published businesses…" className="flex-1 min-w-0 bg-transparent outline-none text-xs" /></div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {matchingBusinesses.map((business) => <label key={business.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-surface-container-low text-xs cursor-pointer"><input type="checkbox" checked={(form.business_ids ?? []).includes(business.id)} onChange={() => toggleBusiness(business.id)} /><span className="min-w-0 flex-1 truncate">{business.name_en}</span><span className="text-[10px] text-outline">{business.area?.name_en || 'Sadiqabad'}</span></label>)}
              {matchingBusinesses.length === 0 && <p className="py-3 text-center text-xs text-on-surface-variant">No published business matches.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/40 p-3 space-y-2.5">
            <h3 className="text-sm font-extrabold">Public display controls</h3>
            {([
              ['show_status', 'Show current status'],
              ['show_organization', 'Show organization / union'],
              ['show_authority', 'Show authority / responsibilities'],
              ['show_bio', 'Show biography'],
              ['show_contact', 'Show phone, email and website links'],
              ['show_businesses', 'Show linked businesses'],
            ] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 text-xs font-medium"><span>{label}</span><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => update(key, event.target.checked)} className="w-4 h-4 accent-primary" /></label>)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Input label="Display order" type="number" value={form.sort_order ?? 0} onChange={(event) => update('sort_order', Number(event.target.value))} />
              <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update('is_active', event.target.checked)} className="w-4 h-4 accent-primary" /> Publish profile publicly</label>
            </div>
          </section>
          <div className="flex items-center justify-between gap-2 border-t border-outline-variant/40 pt-3">
            <p className="text-[10px] text-on-surface-variant">Only Super Admin can create, edit or publish profiles.</p>
            <div className="flex gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" loading={saving} disabled={saving || uploading}>Save Profile</Button></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
