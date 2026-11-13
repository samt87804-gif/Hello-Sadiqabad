import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { fetchPublicSiteSettings } from '../lib/api';
import { DEFAULT_SITE_SETTINGS, type SiteSettingsMap } from '../lib/siteSettings';
import { normalizePkPhone } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card, Container } from '../components/ui/Surface';

export function ForgotPassword() {
  const { requestPasswordReset, isDemoMode } = useAuth();
  const { lang, urduHints } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    updatePageSeo({
      title: lang === 'ur' ? 'پاس ورڈ بحالی — ہیلو صادق آباد' : 'Forgot Password — Hello Sadiqabad',
      description: 'Request a password recovery link for your Hello Sadiqabad portal account.',
      canonicalPath: '/forgot-password',
    });
    fetchPublicSiteSettings().then(setSiteSettings).catch(() => {});
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError(
        lang === 'ur'
          ? 'براہ کرم درست رجسٹرڈ ای میل ایڈریس درج کریں۔'
          : 'Please provide a valid registered email address.'
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await requestPasswordReset(trimmed);
      if (!res.ok) {
        setError(res.error ?? (lang === 'ur' ? 'ری سیٹ ای میل نہیں بھیجی جا سکی۔' : 'Could not send reset email.'));
        return;
      }
      setSimulated(Boolean(res.simulated || isDemoMode));
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const waDigits = normalizePkPhone(siteSettings.contact_whatsapp || siteSettings.contact_phone).replace(
    /^\+/,
    ''
  );

  return (
    <AppShell hideBottomNav>
      <Container size="sm" className="py-6 sm:py-10 space-y-5 max-w-[460px]">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{lang === 'ur' ? 'لاگ ان پر واپس جائیں' : 'Back to Login'}</span>
          </Link>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/30 text-primary text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {isDemoMode
              ? lang === 'ur'
                ? 'ڈیمو / پیش نظارہ'
                : 'Preview / Demo'
              : lang === 'ur'
                ? 'محفوظ تصدیق'
                : 'Secure Auth'}
          </span>
        </div>

        <Card className="p-6 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-secondary-container to-primary" />

          <div className="text-center space-y-1.5 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed/50 text-primary flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-on-surface">
              {lang === 'ur' ? 'پاس ورڈ بھول گئے؟' : 'Forgot Your Password?'}
            </h1>
            {lang === 'en' && urduHints && (
              <p className="font-urdu text-sm text-primary" dir="rtl">
                پاس ورڈ بھول گئے؟
              </p>
            )}
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              {lang === 'ur'
                ? 'اپنا رجسٹرڈ ای میل ایڈریس درج کریں۔ ہم تصدیق شدہ پتے پر پاس ورڈ بحالی کا محفوظ لنک بھیجیں گے۔'
                : 'Enter your registered email address. We will dispatch a secure password reset link to your verified inbox.'}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-tertiary-fixed/40 text-on-tertiary-fixed text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {simulated
                      ? lang === 'ur'
                        ? 'ڈیمو موڈ: درخواست ریکارڈ ہوئی (ای میل نہیں بھیجی گئی)'
                        : 'Preview Mode: Simulated Reset Request'
                      : lang === 'ur'
                        ? 'ری سیٹ لنک بھیج دیا گیا ہے!'
                        : 'Reset link sent!'}
                  </p>
                  <p className="leading-relaxed">
                    {simulated ? (
                      lang === 'ur' ? (
                        <>
                          پری ویو موڈ میں <strong dir="ltr">{email}</strong> پر کوئی حقیقی ای میل نہیں بھیجی جاتی۔ ڈیمو اکاؤنٹس کے لیے لاگ ان صفحے پر 1-کلک رسائی استعمال کریں۔
                        </>
                      ) : (
                        <>
                          Preview Mode does not send live recovery emails to <strong>{email}</strong>. Return to Login and use the 1-click Preview Access buttons for demo portals.
                        </>
                      )
                    ) : lang === 'ur' ? (
                      <>
                        اگر <strong dir="ltr">{email}</strong> ہمارے نظام میں رجسٹرڈ ہے تو بحالی کا لنک بھیج دیا گیا ہے۔ اپنا ان باکس اور اسپام فولڈر چیک کریں۔
                      </>
                    ) : (
                      <>
                        If <strong>{email}</strong> is registered in our system, a password reset link
                        has been dispatched. Check your inbox and spam folder.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setSent(false)}
                >
                  {lang === 'ur' ? 'دوبارہ بھیجیں' : 'Send Again'}
                </Button>
                <Link to="/login" className="w-full">
                  <Button type="button" fullWidth>
                    {lang === 'ur' ? 'لاگ ان پر واپس' : 'Back to Login'}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="forgot-email" className="text-xs font-bold text-on-surface">
                    {lang === 'ur' ? 'رجسٹرڈ ای میل ایڈریس' : 'Registered Email Address'}
                  </label>
                  {lang === 'en' && urduHints && (
                    <span className="font-urdu text-xs text-outline">ای میل ایڈریس</span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@hellosadiqabad.com"
                    className="w-full h-12 ps-10 pe-10 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
                  />
                  {email.length > 0 && (
                    <button
                      type="button"
                      aria-label="Clear email"
                      onClick={() => setEmail('')}
                      className="absolute end-2.5 w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {lang === 'ur'
                    ? 'مثال: owner@hellosadiqabad.com'
                    : 'Format: owner@domain.com used when your portal account was provisioned.'}
                </p>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {lang === 'ur' ? 'ری سیٹ لنک بھیجیں' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {/* Alternative Help Box */}
          <div className="p-3.5 rounded-xl bg-surface-container flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0 mt-0.5">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-on-surface">
                  {lang === 'ur' ? 'ای میل تک رسائی نہیں؟' : 'No email access?'}
                </p>
                <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                  {lang === 'ur' ? 'تحصیل ڈیسک' : 'City Desk'}
                </span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                {lang === 'ur'
                  ? 'اگر آپ اپنا ای میل بھول گئے ہیں تو دستی تصدیق کے لیے ہماری ٹیم سے رابطہ کریں۔'
                  : 'Didn’t receive the email or lost mailbox access? Contact the Hello Sadiqabad verification desk for manual assistance.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <a
                  href={`tel:${normalizePkPhone(siteSettings.contact_phone)}`}
                  className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  dir="ltr"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{siteSettings.contact_phone}</span>
                </a>
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-secondary font-bold hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'واٹس ایپ ہیلپ لائن' : 'WhatsApp Helpline'}</span>
                </a>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </AppShell>
  );
}
