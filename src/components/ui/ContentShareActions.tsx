import React, { useState } from 'react';
import { trackSiteAnalyticsEvent } from '../../lib/siteAnalytics';
import { Check, Copy, Facebook, MessageCircle, Share2 } from 'lucide-react';

type ShareLanguage = 'en' | 'ur';

export function ContentShareActions({
  title,
  description,
  url,
  lang = 'en',
  contentType,
}: {
  title: string;
  description?: string | null;
  url: string;
  lang?: ShareLanguage;
  contentType?: 'business' | 'news' | 'authority_profile' | 'government_job' | 'government_scheme';
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const shareText = [title, description, url].filter(Boolean).join('\n\n');
  const isUrdu = lang === 'ur';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
      if (contentType) trackSiteAnalyticsEvent('content_share', { pagePath: window.location.pathname, filters: { content_type: contentType, action: 'copy' } });
    } catch {
      setCopyState('failed');
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: description || title, url });
      if (contentType) trackSiteAnalyticsEvent('content_share', { pagePath: window.location.pathname, filters: { content_type: contentType, action: 'native' } });
    } catch {
      // A cancelled native share is not an error.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={isUrdu ? 'یہ صفحہ شیئر کریں' : 'Share this page'}>
      <a
        href={'https://wa.me/?text=' + encodeURIComponent(shareText)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => contentType && trackSiteAnalyticsEvent('content_share', { pagePath: window.location.pathname, filters: { content_type: contentType, action: 'whatsapp' } })}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-whatsapp px-3 py-2 text-xs font-bold text-white hover:brightness-95"
      >
        <MessageCircle className="h-4 w-4" />
        {isUrdu ? 'واٹس ایپ' : 'WhatsApp'}
      </a>
      <a
        href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => contentType && trackSiteAnalyticsEvent('content_share', { pagePath: window.location.pathname, filters: { content_type: contentType, action: 'facebook' } })}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1877F2] px-3 py-2 text-xs font-bold text-white hover:brightness-95"
      >
        <Facebook className="h-4 w-4" />
        {isUrdu ? 'فیس بک' : 'Facebook'}
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container"
      >
        {copyState === 'copied' ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        {copyState === 'copied'
          ? (isUrdu ? 'لنک کاپی ہو گیا' : 'Link copied')
          : copyState === 'failed'
            ? (isUrdu ? 'کاپی نہیں ہو سکا' : 'Copy unavailable')
            : (isUrdu ? 'لنک کاپی کریں' : 'Copy link')}
      </button>
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container"
        >
          <Share2 className="h-4 w-4" />
          {isUrdu ? 'مزید شیئر کریں' : 'More'}
        </button>
      )}
    </div>
  );
}
