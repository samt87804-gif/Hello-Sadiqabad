import React, { useEffect, useState } from 'react';
import { Edit2, FileText, Plus, Send } from 'lucide-react';
import { fetchAllNewsArticlesAdmin, upsertNewsArticle } from '../../lib/api';
import type { NewsArticleRow } from '../../types/database';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { useToast } from '../ui/Toast';

const emptyForm = {
  slug: '', title_en: '', title_ur: '', excerpt_en: '', excerpt_ur: '',
  content_en: '', content_ur: '', cover_image_url: '',
};

function makeSlug(value: string): string {
  return value.toLowerCase().trim().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function NewsManager({ actorId }: { actorId: string }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<NewsArticleRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [featured, setFeatured] = useState(false);\n  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await fetchAllNewsArticlesAdmin());
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'News articles could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const reset = () => {
    setForm(emptyForm);
    setStatus('draft');
    setFeatured(false);
    setEditingId(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await upsertNewsArticle({
        ...(editingId ? { id: editingId } : {}),
        ...form,
        cover_image_url: form.cover_image_url || null,
        status,
        is_featured: featured,
      }, actorId);
      showToast(status === 'published' ? 'News article published.' : 'Draft saved.', 'success');
      reset();
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'News article could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: NewsArticleRow) => {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      title_en: item.title_en,
      title_ur: item.title_ur,
      excerpt_en: item.excerpt_en,
      excerpt_ur: item.excerpt_ur,
      content_en: item.content_en,
      content_ur: item.content_ur,
      cover_image_url: item.cover_image_url ?? '',
    });
    setStatus(item.status);
    setFeatured(item.is_featured);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-bold text-base">{editingId ? 'Edit News Article' : 'Create News Article'}</h2>
            <p className="text-xs text-on-surface-variant">English and Urdu headline, summary and full story</p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Headline (English)" required maxLength={180} value={form.title_en}
              onChange={(e) => setForm(v => ({ ...v, title_en: e.target.value, slug: editingId ? v.slug : makeSlug(e.target.value) }))} />
            <Input label="Headline (Urdu)" required maxLength={180} dir="rtl" className="font-urdu" value={form.title_ur}
              onChange={(e) => setForm(v => ({ ...v, title_ur: e.target.value }))} />
            <Input label="URL Slug" required value={form.slug}
              onChange={(e) => setForm(v => ({ ...v, slug: makeSlug(e.target.value) }))} />
            <Input label="Cover Image URL (HTTPS)" type="url" value={form.cover_image_url}
              onChange={(e) => setForm(v => ({ ...v, cover_image_url: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea label="Short Summary (English)" required rows={3} maxLength={500} value={form.excerpt_en}
              onChange={(e) => setForm(v => ({ ...v, excerpt_en: e.target.value }))} />
            <Textarea label="Short Summary (Urdu)" required rows={3} maxLength={500} dir="rtl" className="font-urdu" value={form.excerpt_ur}
              onChange={(e) => setForm(v => ({ ...v, excerpt_ur: e.target.value }))} />
            <Textarea label="Full Story (English)" required rows={8} maxLength={30000} value={form.content_en}
              onChange={(e) => setForm(v => ({ ...v, content_en: e.target.value }))} />
            <Textarea label="Full Story (Urdu)" required rows={8} maxLength={30000} dir="rtl" className="font-urdu" value={form.content_ur}
              onChange={(e) => setForm(v => ({ ...v, content_ur: e.target.value }))} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-44">
              <Select label="Publication Status" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Now</option>
              </Select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer mt-5">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Featured story
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {editingId && <Button type="button" variant="outline" onClick={reset}>Cancel Edit</Button>}
            <Button type="submit" disabled={saving} leftIcon={status === 'published' ? <Send className="w-4 h-4" /> : <Plus className="w-4 h-4" />}>
              {saving ? 'Saving…' : status === 'published' ? 'Publish Article' : 'Save Draft'}
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="font-bold text-base">News Articles</h2>
        {loading ? <Card className="p-5 text-sm text-on-surface-variant">Loading articles…</Card> :
          items.length === 0 ? <Card className="p-5 text-sm text-on-surface-variant">No news articles yet.</Card> :
          items.map(item => (
            <Card key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm">{item.title_en}</h3>
                  <Badge variant={item.status === 'published' ? 'success' : 'neutral'}>{item.status}</Badge>
                  {item.is_featured && <Badge variant="info">Featured</Badge>}
                </div>
                <p className="text-xs text-primary font-urdu" dir="rtl">{item.title_ur}</p>
                <p className="text-xs text-on-surface-variant line-clamp-2">{item.excerpt_en}</p>
                <p className="text-[11px] text-outline">/{item.slug}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => edit(item)} leftIcon={<Edit2 className="w-3.5 h-3.5" />}>Edit</Button>
            </Card>
          ))}
      </section>
    </div>
  );
}
