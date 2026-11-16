import React, { useState } from 'react';
import type { LocalAuthorityRow, LocalAuthorityType } from '../../types/database';
import { isValidHttpsUrl } from '../../lib/phone';
import { formatDateShort } from '../../lib/format';
import { upsertLocalAuthority } from '../../lib/api';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

type AuthorityDraft = Partial<LocalAuthorityRow> & {
  name_en: string;
  name_ur: string;
  authority_type: LocalAuthorityType;
  source_url: string;
};

const EMPTY_FORM: AuthorityDraft = {
  name_en: '', name_ur: '', authority_type: 'other', source_url: '',
  description_en: null, description_ur: null, phone: null, phone_secondary: null,
  email: null, address_en: null, address_ur: null, website_url: null, map_url: null,
  office_hours_en: null, office_hours_ur: null, sort_order: 0, is_active: true,
};

const TYPE_LABELS: Record<LocalAuthorityType, string> = {
  municipal: 'Municipal', police: 'Police', revenue: 'Revenue / Tehsil',
  district: 'District Government', sanitation: 'Sanitation', other: 'Other',
};

export function LocalAuthoritiesManager({
  authorities,
  actorId,
  onReload,
}: {
  authorities: LocalAuthorityRow[];
  actorId: string;
  onReload: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AuthorityDraft>({ ...EMPTY_FORM });
  const update = (key: keyof AuthorityDraft, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }) as AuthorityDraft);

  const create = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };
  const edit = (row: LocalAuthorityRow) => {
    setEditingId(row.id);
    setForm({ ...row });
    setModalOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name_en.trim() || !form.name_ur.trim()) return;
    if (!isValidHttpsUrl(form.source_url.trim())) {
      showToast('Official source must be a valid HTTPS URL.', 'error');
      return;
    }
    for (const [label, url] of [['Website', form.website_url], ['Map', form.map_url]] as const) {
      if (url && !isValidHttpsUrl(url)) {
        showToast(`${label} URL must use HTTPS.`, 'error');
        return;
      }
    }
    try {
      await upsertLocalAuthority({
        ...form,
        id: editingId ?? undefined,
        name_en: form.name_en.trim(),
        name_ur: form.name_ur.trim(),
        source_url: form.source_url.trim(),
        verified_at: new Date().toISOString(),
      }, actorId);
      showToast(editingId ? 'Authority updated.' : 'Authority added.', 'success');
      setModalOpen(false);
      await onReload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save authority.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">Local Authorities ({authorities.length})</h2>
          <p className="text-xs text-on-surface-variant mt-1">Publish only official office contacts and source links.</p>
        </div>
        <Button onClick={create}>Add Authority</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {authorities.map((row) => (
          <Card key={row.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm">{row.name_en}</h3>
                <p className="font-urdu text-sm text-primary" dir="rtl">{row.name_ur}</p>
              </div>
              <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? TYPE_LABELS[row.authority_type] : 'Inactive'}</Badge>
            </div>
            <p className="text-xs text-on-surface-variant">{row.phone ?? 'No published phone'}{row.phone_secondary ? ` · ${row.phone_secondary}` : ''}</p>
            <p className="text-[11px] text-outline">Source checked: {formatDateShort(row.verified_at)}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => edit(row)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={async () => {
                try {
                  await upsertLocalAuthority({ ...row, is_active: !row.is_active }, actorId);
                  await onReload();
                } catch (error) {
                  showToast(error instanceof Error ? error.message : 'Could not change visibility.', 'error');
                }
              }}>{row.is_active ? 'Deactivate' : 'Activate'}</Button>
              <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 text-xs font-bold text-primary underline">Official source</a>
            </div>
          </Card>
        ))}
        {authorities.length === 0 && <Card className="p-8 text-center text-sm text-on-surface-variant">No local authority records yet.</Card>}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Local Authority' : 'Add Local Authority'}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name (English)" required value={form.name_en} onChange={(e) => update('name_en', e.target.value)} />
            <Input label="Name (Urdu)" required dir="rtl" className="font-urdu" value={form.name_ur} onChange={(e) => update('name_ur', e.target.value)} />
            <Select label="Authority Type" value={form.authority_type} onChange={(e) => update('authority_type', e.target.value as LocalAuthorityType)}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <Input label="Primary Phone" dir="ltr" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value || null)} />
            <Input label="Secondary Phone" dir="ltr" value={form.phone_secondary ?? ''} onChange={(e) => update('phone_secondary', e.target.value || null)} />
            <Input label="Email" type="email" dir="ltr" value={form.email ?? ''} onChange={(e) => update('email', e.target.value || null)} />
            <Input label="Website URL (HTTPS)" dir="ltr" value={form.website_url ?? ''} onChange={(e) => update('website_url', e.target.value || null)} />
            <Input label="Map URL (HTTPS)" dir="ltr" value={form.map_url ?? ''} onChange={(e) => update('map_url', e.target.value || null)} />
            <Input label="Sort Order" type="number" dir="ltr" value={form.sort_order ?? 0} onChange={(e) => update('sort_order', Number(e.target.value))} />
          </div>
          <Input label="Official Source URL (required)" required dir="ltr" value={form.source_url} onChange={(e) => update('source_url', e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Address (English)" value={form.address_en ?? ''} onChange={(e) => update('address_en', e.target.value || null)} />
            <Input label="Address (Urdu)" dir="rtl" className="font-urdu" value={form.address_ur ?? ''} onChange={(e) => update('address_ur', e.target.value || null)} />
            <Input label="Office Hours (English)" value={form.office_hours_en ?? ''} onChange={(e) => update('office_hours_en', e.target.value || null)} />
            <Input label="Office Hours (Urdu)" dir="rtl" className="font-urdu" value={form.office_hours_ur ?? ''} onChange={(e) => update('office_hours_ur', e.target.value || null)} />
          </div>
          <Textarea label="Description (English)" rows={2} value={form.description_en ?? ''} onChange={(e) => update('description_en', e.target.value || null)} />
          <Textarea label="Description (Urdu)" rows={2} dir="rtl" className="font-urdu" value={form.description_ur ?? ''} onChange={(e) => update('description_ur', e.target.value || null)} />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">Save Authority</Button></div>
        </form>
      </Modal>
    </div>
  );
}
