import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Newspaper, Search, X } from 'lucide-react';
import { fetchPublishedNewsArticleBySlug, fetchPublishedNewsArticles } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import type { NewsArticleRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { Button } from '../components/ui/Button';
import { Card, Container, SectionHeading } from '../components/ui/Surface';

function getYouTubeEmbedUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    let videoId = '';
    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      videoId = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] ?? '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export function News() {
  const { slug } = useParams();
  const { lang, urduHints } = useI18n();
  const [items, setItems] = useState<NewsArticleRow[]>([]);
  const [article, setArticle] = useState<NewsArticleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    const request = slug
      ? fetchPublishedNewsArticleBySlug(slug).then(value => ({ article: value, items: [] as NewsArticleRow[] }))
      : fetchPublishedNewsArticles().then(value => ({ article: null, items: value }));
    request.then(result => {
      if (!active) return;
      setArticle(result.article);
      setItems(result.items);
      updatePageSeo({
        title: result.article ? result.article.title_en + ' — Hello Sadiqabad News' : 'Sadiqabad News — Hello Sadiqabad',
        description: result.article?.excerpt_en ?? 'Latest verified local news and community updates from Sadiqabad.',
        canonicalPath: slug ? '/news/' + slug : '/news',
        ogType: result.article ? 'article' : 'website',
        jsonLd: result.article
          ? {
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: result.article.title_en,
              description: result.article.excerpt_en,
              datePublished: result.article.published_at,
              dateModified: result.article.updated_at || result.article.published_at,
              ...(result.article.cover_image_url ? { image: [result.article.cover_image_url] } : {}),
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': 'https://hellosadiqabad.com/news/' + result.article.slug,
              },
              publisher: {
                '@type': 'Organization',
                name: 'Hello Sadiqabad',
                url: 'https://hellosadiqabad.com/',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/186747.png',
                },
              },
              inLanguage: ['en', 'ur'],
            }
          : {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: 'Sadiqabad News',
              url: 'https://hellosadiqabad.com/news',
              inLanguage: ['en', 'ur'],
            },
      });
    }).catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, retry]);

  const title = lang === 'ur' ? 'صادق آباد کی خبریں' : 'Sadiqabad News';
  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.title_en, item.title_ur, item.excerpt_en, item.excerpt_ur]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(term));
  }, [items, query]);
  const galleryImages = article?.image_urls?.filter((url) => url && url !== article.cover_image_url) ?? [];
  const youtubeEmbedUrl = getYouTubeEmbedUrl(article?.youtube_url);
  return (
    <AppShell>
      <Container size="lg" className="py-6 space-y-5">
        {slug ? (
          <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> {lang === 'ur' ? 'تمام خبریں' : 'All News'}
          </Link>
        ) : (
          <SectionHeading title={title} titleUr="صادق آباد کی تازہ خبریں" subtitle="Local reporting, public-interest stories and community updates" />
        )}
        {loading ? (
          <div className="space-y-3"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
        ) : failed ? (
          <EmptyState icon={<Newspaper className="w-6 h-6" />} title="News could not be loaded"
            description="Please check your connection and try again."
            action={<Button onClick={() => setRetry(v => v + 1)}>Retry</Button>} />
        ) : slug && !article ? (
          <EmptyState icon={<Newspaper className="w-6 h-6" />} title="News article not found"
            description="This story may be unpublished or the link may be incorrect."
            action={<Link to="/news"><Button>Browse News</Button></Link>} />
        ) : article ? (
          <article className="max-w-3xl mx-auto space-y-4">
            {article.cover_image_url && <img src={article.cover_image_url} alt="" className="w-full max-h-[420px] object-cover rounded-2xl" loading="lazy" />}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {galleryImages.map((url, index) => (
                  <img key={url + index} src={url} alt={`Article image ${index + 1}`}
                    className="w-full aspect-video object-cover rounded-xl border border-outline-variant/30" loading="lazy" />
                ))}
              </div>
            )}
            {youtubeEmbedUrl && (
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={youtubeEmbedUrl}
                  title={bilingualText(lang, article.title_en, article.title_ur) + ' — YouTube video'}
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formatDateShort(article.published_at ?? article.created_at, lang)}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">{bilingualText(lang, article.title_en, article.title_ur)}</h1>
              {lang === 'en' && urduHints && <p className="font-urdu text-lg text-primary leading-[2]" dir="rtl">{article.title_ur}</p>}
              <p className="text-base text-on-surface-variant leading-relaxed">{bilingualText(lang, article.excerpt_en, article.excerpt_ur)}</p>
            </div>
            <div className="prose prose-sm max-w-none text-on-surface whitespace-pre-line leading-8" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
              {bilingualText(lang, article.content_en, article.content_ur)}
            </div>
            {lang === 'en' && urduHints && <div className="font-urdu whitespace-pre-line text-on-surface leading-[2.2]" dir="rtl">{article.content_ur}</div>}
          </article>
        ) : items.length === 0 ? (
          <EmptyState icon={<Newspaper className="w-6 h-6" />} title={lang === 'ur' ? 'ابھی کوئی خبر موجود نہیں' : 'No news published yet'}
            description={lang === 'ur' ? 'نئی مقامی خبروں کے لیے بعد میں دوبارہ تشریف لائیں۔' : 'Please check back for the latest Sadiqabad news.'} />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder={lang === 'ur' ? 'خبروں میں تلاش کریں...' : 'Search news by title or summary...'}
                aria-label={lang === 'ur' ? 'خبریں تلاش کریں' : 'Search news'}
                className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-11 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label={lang === 'ur' ? 'تلاش صاف کریں' : 'Clear search'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"><X className="h-4 w-4" /></button>}
            </div>
            {filteredItems.length === 0 ? (
              <EmptyState icon={<Newspaper className="w-6 h-6" />} title={lang === 'ur' ? 'کوئی خبر نہیں ملی' : 'No matching news'}
                description={lang === 'ur' ? 'دوسرے الفاظ سے تلاش کریں۔' : 'Try a different title or keyword.'} />
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                {item.cover_image_url && <img src={item.cover_image_url} alt="" className="w-full aspect-[16/9] object-cover" loading="lazy" />}
                <div className="p-4 space-y-2">
                  {item.is_featured && <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Featured</span>}
                  <p className="text-[11px] text-on-surface-variant">{formatDateShort(item.published_at ?? item.created_at, lang)}</p>
                  <h2 className="text-lg font-bold text-on-surface">{bilingualText(lang, item.title_en, item.title_ur)}</h2>
                  {lang === 'en' && urduHints && <p className="font-urdu text-sm text-primary" dir="rtl">{item.title_ur}</p>}
                  <p className="text-sm text-on-surface-variant leading-relaxed">{bilingualText(lang, item.excerpt_en, item.excerpt_ur)}</p>
                  <Link to={'/news/' + item.slug} className="inline-flex items-center text-sm font-bold text-primary hover:underline">
                    {lang === 'ur' ? 'مکمل خبر پڑھیں' : 'Read full story'} →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
            )}
          </div>
        )}
      </Container>
    </AppShell>
  );
}
