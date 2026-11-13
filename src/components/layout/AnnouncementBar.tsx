import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, X } from 'lucide-react';
import { fetchAnnouncements } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { bilingualText } from '../../lib/format';
import type { AnnouncementRow } from '../../types/database';

export function AnnouncementBar() {
  const { lang } = useI18n();
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [dismissedId, setDismissedId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('hs_dismissed_ann');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetchAnnouncements(true)
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const top = items.find((i) => i.id !== dismissedId);
  if (!top) return null;

  const dismiss = () => {
    setDismissedId(top.id);
    try {
      sessionStorage.setItem('hs_dismissed_ann', top.id);
    } catch {
      // ignore
    }
  };

  const title = bilingualText(lang, top.title_en, top.title_ur);
  const linkTarget = top.link_url || '/announcements';
  const isExternal = /^https?:\/\//i.test(linkTarget);

  return (
    <div className="bg-secondary-fixed text-on-secondary-fixed border-b border-secondary/20 px-4 py-2 text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {isExternal ? (
          <a
            href={linkTarget}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
          >
            <Megaphone className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-semibold truncate">{title}</span>
            <span className="text-secondary font-bold shrink-0 hidden sm:inline">
              {lang === 'ur' ? '← اعلانات' : '→ Notices'}
            </span>
          </a>
        ) : (
          <Link
            to={linkTarget}
            className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
          >
            <Megaphone className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-semibold truncate">{title}</span>
            <span className="text-secondary font-bold shrink-0 hidden sm:inline">
              {lang === 'ur' ? '← اعلانات' : '→ Notices'}
            </span>
          </Link>
        )}
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={dismiss}
          className="p-1 rounded-full hover:bg-black/10 shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
