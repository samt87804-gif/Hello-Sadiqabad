import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Headphones,
  Info,
  KeyRound,
  Lock,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { fetchPublicSiteSettings } from '../lib/api';
import { DEFAULT_SITE_SETTINGS, type SiteSettingsMap } from '../lib/siteSettings';
import { evaluatePasswordStrength, validatePasswordPair } from '../lib/password';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card, Container } from '../components/ui/Surface';
import { useToast } from '../components/ui/Toast';

export function ChangePassword() {
  const { updatePassword, role, profile, user, isDemoMode } = useAuth();
  const { lang, urduHints } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPwd, setCurrentPwd] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    updatePageSeo({
      title: lang === 'ur' ? 'پاس ورڈ تبدیل کریں — ہیلو صادق آباد' : 'Change Password — Hello Sadiqabad',
      description: 'Set your permanent personal password for Hello Sadiqabad.',
      canonicalPath: '/change-password',
    });
    fetchPublicSiteSettings().then(setSiteSettings).catch(() => {});
  }, [lang]);

  const strength = evaluatePasswordStrength(password);
  const pairCheck = validatePasswordPair(password, confirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairCheck.valid) {
      setError(
        lang === 'ur'
          ? pairCheck.errorUr ?? 'پاس ورڈ کی شرائط پوری کریں۔'
          : pairCheck.errorEn ?? 'Please satisfy all password requirements.'
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await updatePassword(password);
      if (!res.ok) {
        setError(res.error ?? (lang === 'ur' ? 'پاس ورڈ تبدیل نہ ہو سکا۔' : 'Could not change password.'));
        return;
      }
      showToast(
        res.simulated || isDemoMode
          ? lang === 'ur'
            ? 'ڈیمو موڈ: مقامی پاس ورڈ کی تصدیق مکمل ہو گئی۔'
            : 'Preview Mode: local demo password prompt cleared.'
          : lang === 'ur'
            ? 'پاس ورڈ کامیابی سے تبدیل ہو گیا!'
            : 'Password updated successfully!',
        'success'
      );
      navigate(role === 'owner' ? '/owner' : '/admin', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell hideBottomNav>
      <Container size="sm" className="py-6 sm:py-10 space-y-5 max-w-[480px]">
        {/* Mandatory Security Notice (Stitch 20) */}
        {profile?.must_change_password && (
          <Card className="p-4 bg-secondary-fixed/50 border-secondary/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-extrabold text-on-secondary-fixed">
                  {lang === 'ur' ? 'عارضی پاس ورڈ تبدیل کرنا لازمی ہے' : 'Mandatory Security Update'}
                </h2>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-secondary font-bold">
                    عارضی پاس ورڈ تبدیل کرنا لازمی ہے
                  </span>
                )}
              </div>
              <p className="text-xs text-on-secondary-fixed-variant leading-relaxed">
                {lang === 'ur'
                  ? 'نئے کاروباری یا عملے کے اکاؤنٹ کے طور پر، ڈیش بورڈ استعمال کرنے سے پہلے اپنا ذاتی پاس ورڈ مقرر کرنا ضروری ہے۔'
                  : 'As a newly provisioned account, you must replace your temporary password with a private one before entering your portal.'}
              </p>
            </div>
          </Card>
        )}

        {/* Signed-in Identity Chip */}
        <Card className="p-3.5 bg-surface-container-low flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-on-surface-variant">
                {lang === 'ur' ? 'لاگ ان بطور:' : 'Signed in as'}
              </p>
              <p className="text-xs font-bold text-on-surface truncate">
                {profile?.full_name || user?.email || 'Portal User'}
              </p>
            </div>
          </div>
          {user?.email && (
            <span
              className="px-2.5 py-1 rounded-full bg-surface-container-highest text-[11px] font-semibold text-on-surface-variant truncate max-w-[170px]"
              dir="ltr"
            >
              {user.email}
            </span>
          )}
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-on-surface">
                {lang === 'ur' ? 'پہلے لاگ ان پر پاس ورڈ کی تبدیلی' : 'First-Login Password Update'}
              </h1>
              <p className="text-xs text-on-surface-variant">
                {lang === 'ur'
                  ? 'اپنا نیا ذاتی پاس ورڈ درج کریں'
                  : 'Set a permanent private password for your Sadiqabad portal.'}
              </p>
            </div>
          </div>

          {isDemoMode && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface-variant">
              {lang === 'ur'
                ? 'پیش نظارہ موڈ: پاس ورڈ کی تبدیلی صرف مقامی براؤزر ڈیمو پروفائل میں محفوظ ہوتی ہے۔'
                : 'Preview Mode: Saving clears the local browser demo flag and does not modify a live backend account.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Optional Current / Temp Password reference */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="cp-current" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'موجودہ / عارضی پاس ورڈ (اختیاری)' : 'Current / Temporary Password (Optional)'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">موجودہ یا عارضی پاس ورڈ</span>
                )}
              </div>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="cp-current"
                  type={showCur ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="current-password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 ps-10 pe-11 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showCur ? 'Hide password' : 'Show password'}
                  onClick={() => setShowCur((s) => !s)}
                  className="absolute end-2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Personal Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="cp-new" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'نیا ذاتی پاس ورڈ' : 'New Personal Password'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">نیا ذاتی پاس ورڈ</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="cp-new"
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 chars, letters & numbers"
                  className="w-full h-12 ps-10 pe-11 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute end-2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 3-Bar Strength Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-on-surface-variant">
                    {lang === 'ur' ? 'طاقت:' : 'Strength:'}
                  </span>
                  <span
                    className={
                      strength.score === 3
                        ? 'text-primary'
                        : strength.score === 2
                          ? 'text-secondary'
                          : strength.score === 1
                            ? 'text-error'
                            : 'text-outline'
                    }
                  >
                    {lang === 'ur' ? strength.labelUr : strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-1.5">
                  {[1, 2, 3].map((bar) => {
                    const active = strength.score >= bar;
                    const colorClass = !active
                      ? 'bg-outline-variant/40'
                      : strength.score === 3
                        ? 'bg-primary'
                        : strength.score === 2
                          ? 'bg-secondary-container'
                          : 'bg-error';
                    return <div key={bar} className={`rounded-full transition-colors ${colorClass}`} />;
                  })}
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="cp-confirm" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'نئے پاس ورڈ کی تصدیق' : 'Confirm Personal Password'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">نئے پاس ورڈ کی تصدیق</span>
                )}
              </div>
              <div className="relative flex items-center">
                <ShieldCheck className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="cp-confirm"
                  type={showConf ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-12 ps-10 pe-11 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showConf ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConf((s) => !s)}
                  className="absolute end-2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security Checklist */}
            <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-xs">
              <p className="font-bold text-on-surface">
                {lang === 'ur' ? 'حفاظتی شرائط' : 'Security Requirements'}
              </p>
              <ReqRow
                ok={strength.rules.minLength}
                label={lang === 'ur' ? 'کم از کم 8 حروف' : 'At least 8 characters long'}
              />
              <ReqRow
                ok={strength.rules.hasLetter && strength.rules.hasNumberOrSymbol}
                label={
                  lang === 'ur'
                    ? 'حروف اور ہندسے یا علامت دونوں شامل ہوں'
                    : 'Includes both letters and a number or symbol'
                }
              />
              <ReqRow
                ok={pairCheck.matches}
                label={lang === 'ur' ? 'دونوں پاس ورڈ ایک جیسے ہوں' : 'Both entered passwords match'}
              />
            </div>

            {profile?.must_change_password && (
              <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
                <Info className="w-4 h-4 text-outline shrink-0" />
                <span>
                  {lang === 'ur'
                    ? 'محفوظ پاس ورڈ بنائے بغیر آپ آگے نہیں جا سکتے۔'
                    : 'You cannot bypass this step until a secure personal password is saved.'}
                </span>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {lang === 'ur' ? 'محفوظ کریں اور پورٹل پر جائیں' : 'Update & Continue to Portal'}
            </Button>
          </form>
        </Card>

        {/* Support Footer */}
        <div className="text-center text-xs text-outline space-y-1">
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <Headphones className="w-3.5 h-3.5" />
            <span>
              {lang === 'ur' ? 'ابتدائی لاگ ان میں مدد چاہیے؟' : 'Need help with your initial login?'}
            </span>
          </p>
          <p>
            {lang === 'ur' ? 'صادق آباد سپورٹ ڈیسک:' : 'Contact Sadiqabad IT Desk:'}{' '}
            <strong className="text-on-surface" dir="ltr">
              {siteSettings.contact_phone}
            </strong>
          </p>
        </div>
      </Container>
    </AppShell>
  );
}

function ReqRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? 'text-primary font-semibold' : 'text-outline'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </div>
  );
}
