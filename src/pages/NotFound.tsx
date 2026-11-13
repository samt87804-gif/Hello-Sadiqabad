import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { AppShell } from '../components/layout/AppShell';
import { Container } from '../components/ui/Surface';

export function NotFound() {
  const { lang, urduHints } = useI18n();
  return (
    <AppShell>
      <Container size="sm" className="py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-container text-primary flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface">
          {lang === 'ur' ? 'صفحہ نہیں ملا' : 'Page Not Found'}
        </h1>
        {lang === 'en' && urduHints && (
          <p className="font-urdu text-base text-primary" dir="rtl">
            مطلوبہ صفحہ دستیاب نہیں ہے
          </p>
        )}
        <p className="text-sm text-on-surface-variant">
          {lang === 'ur'
            ? 'آپ کا مطلوبہ صفحہ یا کاروبار صادق آباد ڈائریکٹری میں دستیاب نہیں ہے۔'
            : 'The page or listing you requested could not be found in the Sadiqabad directory.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold inline-flex items-center"
          >
            {lang === 'ur' ? 'ہوم پر واپس' : 'Back to Home'}
          </Link>
          <Link
            to="/search"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-surface-container text-on-surface text-sm font-bold inline-flex items-center"
          >
            {lang === 'ur' ? 'ڈائریکٹری تلاش کریں' : 'Search Directory'}
          </Link>
        </div>
      </Container>
    </AppShell>
  );
}
