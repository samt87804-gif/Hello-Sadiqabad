import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  ShieldCheck,
  Store,
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
import { useToast } from '../components/ui/Toast';
import type { UserRole } from '../types/database';

const REMEMBER_EMAIL_KEY = 'hs_remembered_email';

function getSafeNextPath(raw: string | null | undefined, targetRole: UserRole | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return targetRole === 'owner' ? '/owner' : '/admin';
  }
  if (targetRole === 'owner' && raw.startsWith('/admin')) {
    return '/owner';
  }
  return raw;
}

export function Login() {
  const { signIn, signInDemoRole, isDemoMode, user, role } = useAuth();
  const { lang, setLang, urduHints } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const rawNext =
    searchParams.get('next') ||
    ((location.state as { from?: { pathname?: string; search?: string } } | null)?.from
      ? `${(location.state as { from: { pathname?: string; search?: string } }).from.pathname ?? ''}${
          (location.state as { from: { pathname?: string; search?: string } }).from.search ?? ''
        }`
      : '');

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    updatePageSeo({
      title: lang === 'ur' ? 'پورٹل لاگ ان — ہیلو صادق آباد' : 'Portal Login — Hello Sadiqabad',
      description: 'Sign in for Sadiqabad Business Owners and Directory Administrators.',
      canonicalPath: '/login',
    });
    fetchPublicSiteSettings().then(setSiteSettings).catch(() => {});
    if (user && role) {
      navigate(getSafeNextPath(rawNext, role), { replace: true });
    }
  }, [user, role, navigate, rawNext, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      try {
        if (rememberMe && email.trim()) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignore storage restrictions
      }
      const res = await signIn(email, password);
      if (!res.ok) {
        setError(res.error ?? (lang === 'ur' ? 'لاگ ان ناکام رہا۔' : 'Login failed.'));
        return;
      }
      showToast(
        lang === 'ur' ? 'ہیلو صادق آباد پورٹل میں خوش آمدید!' : 'Welcome to Hello Sadiqabad Portal!',
        'success'
      );
      const fallback = res.redirectPath ?? '/';
      const dest =
        fallback === '/change-password'
          ? '/change-password'
          : rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
            ? rawNext
            : fallback;
      navigate(dest, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const quickDemo = async (targetRole: 'owner' | 'super_admin' | 'staff') => {
    if (!isDemoMode) return;
    setLoading(true);
    try {
      const res = await signInDemoRole(targetRole);
      if (!res.ok) return;
      showToast(
        lang === 'ur'
          ? `ڈیمو ${targetRole.replace('_', ' ')} لاگ ان مکمل`
          : `Signed in as Demo ${targetRole.replace('_', ' ')}`,
        'success'
      );
      navigate(getSafeNextPath(rawNext, targetRole), { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const waDigits = normalizePkPhone(siteSettings.contact_whatsapp || siteSettings.contact_phone).replace(
    /^\+/,
    ''
  );
  const waHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    'Assalam-o-Alaikum, I am a Sadiqabad business owner requesting portal login support.'
  )}`;

  return (
    <AppShell hideBottomNav>
      <Container size="sm" className="py-6 sm:py-10 space-y-5 max-w-[460px]">
        {/* Top Portal Badge & Language Switch */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{lang === 'ur' ? 'ڈائریکٹری پر واپس' : 'Directory / ڈائریکٹری'}</span>
          </Link>

          <div className="inline-flex items-center bg-surface-container-lowest border border-outline-variant/40 p-1 rounded-full shadow-xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                lang === 'en' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ur')}
              className={`px-3 py-1 rounded-full font-urdu text-xs font-bold transition-colors cursor-pointer ${
                lang === 'ur' ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Header & Restricted Access Notice (Stitch 17) */}
        <Card className="p-5 relative overflow-hidden space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-on-surface leading-tight">
                {lang === 'ur' ? 'بزنس اونر اور سٹاف پورٹل' : 'Owner & Staff Portal'}
              </h1>
              {urduHints && (
                <p className="font-urdu text-xs text-primary leading-relaxed" dir="rtl">
                  کاروباری مالکان اور مجاز عملے کا محفوظ پورٹل
                </p>
              )}
            </div>
            <span className="ms-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/30 text-primary text-[11px] font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isDemoMode
                ? lang === 'ur'
                  ? 'ڈیمو / پیش نظارہ'
                  : 'Preview / Demo'
                : lang === 'ur'
                  ? 'محفوظ'
                  : 'Secure Auth'}
            </span>
          </div>

          <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-2.5 border border-outline-variant/25">
            <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-semibold text-on-surface-variant leading-relaxed">
                {lang === 'ur'
                  ? 'رسائی صرف رجسٹرڈ کاروباری مالکان اور مجاز عملے تک محدود ہے۔ عوامی صارفین کو لاگ ان کی ضرورت نہیں۔'
                  : 'Access restricted to registered business owners & authorized Tehsil staff. No public self-registration.'}
              </p>
              {lang === 'en' && urduHints && (
                <p className="font-urdu text-xs text-outline leading-relaxed" dir="rtl">
                  رسائی صرف رجسٹرڈ کاروباری مالکان اور تصدیق شدہ عملے تک محدود ہے۔
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Login Form Card */}
        <Card className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs space-y-1"
            >
              <p className="font-bold">{error}</p>
              {urduHints && (
                <p className="font-urdu text-xs opacity-90" dir="rtl">
                  غلط ای میل ایڈریس یا پاس ورڈ، یا اکاؤنٹ معطل ہے۔
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="login-email" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'رجسٹرڈ ای میل پتہ' : 'Registered Email Address'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">ای میل پتہ</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  dir="ltr"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@hellosadiqabad.com"
                  className="w-full h-12 ps-10 pe-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="login-password" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'پاس ورڈ' : 'Password'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">پاس ورڈ</span>
                )}
              </div>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 ps-10 pe-11 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute end-2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none min-h-[36px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span className="text-on-surface-variant font-medium">
                  {lang === 'ur' ? 'اس ڈیوائس پر یاد رکھیں' : 'Remember this device'}
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-primary hover:underline text-end"
              >
                {lang === 'ur' ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password?'}
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {lang === 'ur' ? 'پورٹل میں لاگ ان کریں' : 'Sign In to Portal'}
            </Button>

            <div className="text-center pt-1">
              <Link
                to="/add-business"
                className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
              >
                <span>
                  {lang === 'ur'
                    ? 'دکان کا اندراج یا ملکیت کا دعویٰ کروائیں'
                    : 'Claim or register shop →'}
                </span>
              </Link>
            </div>
          </form>

          {isDemoMode && (
            <div className="pt-4 border-t border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface">
                  {lang === 'ur' ? 'انٹرایکٹو ڈیمو رسائی' : 'Interactive Preview Access'}
                </span>
                <span className="text-outline">
                  {lang === 'ur' ? '1-کلک ڈیمو لاگ ان' : '1-click demo login'}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {lang === 'ur'
                  ? 'پیش نظارہ موڈ میں ای میل لاگ ان صرف اس براؤزر کے مقامی ڈیمو ریکارڈز چیک کرتا ہے۔ فوری آزمائش کے لیے نیچے دیے گئے بٹن استعمال کریں:'
                  : 'In Preview Mode, password login checks local browser demo records only. Use 1-click access below to explore portals:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickDemo('owner')}
                  leftIcon={<Store className="w-3.5 h-3.5 text-primary" />}
                >
                  Demo Owner
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickDemo('staff')}
                  leftIcon={<KeyRound className="w-3.5 h-3.5 text-secondary" />}
                >
                  Demo Staff
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickDemo('super_admin')}
                  leftIcon={<Shield className="w-3.5 h-3.5 text-error" />}
                >
                  Demo Super Admin
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Civic Help Desk Assistance Card (Stitch 17) */}
        <Card className="p-4 bg-surface-container space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-on-surface">
                {lang === 'ur'
                  ? 'اکاؤنٹ تک رسائی یا رجسٹریشن میں مدد چاہیے؟'
                  : 'Need account access or registration?'}
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                {lang === 'ur'
                  ? 'نئے کاروباری اکاؤنٹس ہیلو صادق آباد ڈیسک کے ذریعے تصدیق کے بعد جاری کیے جاتے ہیں۔'
                  : 'Business portal accounts are reviewed and issued via our Sadiqabad directory desk.'}
              </p>
            </div>
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between hover:bg-surface-container-high transition-colors border border-outline-variant/25"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-tertiary-container/15 text-tertiary flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'صادق آباد ہیلپ ڈیسک' : 'Sadiqabad Civic Desk'}
                </p>
                <p className="text-[11px] text-outline tabular-nums" dir="ltr">
                  {siteSettings.contact_whatsapp || siteSettings.contact_phone}
                </p>
              </div>
            </div>
            <span className="font-urdu text-xs font-bold text-tertiary bg-tertiary-fixed/40 px-2.5 py-1 rounded-lg">
              واٹس ایپ رابطہ
            </span>
          </a>
        </Card>
      </Container>
    </AppShell>
  );
}
