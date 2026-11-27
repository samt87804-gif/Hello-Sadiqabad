import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { getSupabaseClient, supabaseConfig } from '../lib/supabase';
import { parseAuthLink } from '../lib/authLink';
import { evaluatePasswordStrength, validatePasswordPair } from '../lib/password';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card, Container } from '../components/ui/Surface';
import { useToast } from '../components/ui/Toast';

export function ResetPassword() {
  const { updatePassword, isDemoMode } = useAuth();
  const { lang, urduHints } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    updatePageSeo({
      title: lang === 'ur' ? 'نیا پاس ورڈ مقرر کریں — ہیلو صادق آباد' : 'Set New Password — Hello Sadiqabad',
      description: 'Reset your Hello Sadiqabad portal password.',
      canonicalPath: '/reset-password',
    });
    let cancelled = false;
    const prepareSecureSession = async () => {
      if (!supabaseConfig.isConfigured) { setCheckingLink(false); return; }
      const client = getSupabaseClient();
      if (!client) { setLinkExpired(true); setCheckingLink(false); return; }
      try {
        const authLink = parseAuthLink(window.location.href);
        if (authLink.error) throw new Error('This invitation or password link has expired or is invalid.');
        let session = (await client.auth.getSession()).data.session;
        if (!session && authLink.code) {
          const { data, error } = await client.auth.exchangeCodeForSession(authLink.code);
          if (error) throw error;
          session = data.session;
        }
        if (!session && authLink.tokenHash && authLink.tokenType) {
          const { data, error } = await client.auth.verifyOtp({ token_hash: authLink.tokenHash, type: authLink.tokenType });
          if (error) throw error;
          session = data.session;
        }
        if (!session && authLink.accessToken && authLink.refreshToken) {
          const { data, error } = await client.auth.setSession({
            access_token: authLink.accessToken, refresh_token: authLink.refreshToken,
          });
          if (error) throw error;
          session = data.session;
        }
        if (!session) session = (await client.auth.getSession()).data.session;
        if (!session) throw new Error('No valid invitation session was found. Please request a fresh invitation link.');
        if (!cancelled) {
          setLinkExpired(false);
          setError('');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (authError) {
        if (!cancelled) {
          setLinkExpired(true);
          setError(authError instanceof Error ? authError.message : 'The invitation link is invalid or expired.');
        }
      } finally {
        if (!cancelled) setCheckingLink(false);
      }
    };
    void prepareSecureSession();
    return () => { cancelled = true; };
  }, [searchParams, lang]);

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
        setError(res.error ?? (lang === 'ur' ? 'پاس ورڈ اپڈیٹ نہ ہو سکا۔' : 'Failed to update password.'));
        return;
      }
      showToast(
        res.simulated || isDemoMode
          ? lang === 'ur'
            ? 'ڈیمو موڈ: مقامی پاس ورڈ کی تصدیق اپ ڈیٹ ہو گئی (کوئی حقیقی سرور اپ ڈیٹ نہیں)۔'
            : 'Preview Mode: simulated password check updated locally.'
          : lang === 'ur'
            ? 'پاس ورڈ تبدیل ہو گیا! اب لاگ ان کریں۔'
            : 'Password updated! Please sign in.',
        'success'
      );
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell hideBottomNav>
      <Container size="sm" className="py-6 sm:py-10 space-y-5 max-w-[460px]">
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{lang === 'ur' ? 'لاگ ان پر واپس' : 'Back to Login'}</span>
          </Link>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/30 text-primary text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'پاس ورڈ بحالی' : 'Recovery'}
          </span>
        </div>

        {/* Security Shield Header */}
        <Card className="p-5 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-extrabold text-on-surface">
              {lang === 'ur' ? 'نیا پاس ورڈ بنائیں' : 'Create New Password'}
            </h1>
            {lang === 'en' && urduHints && (
              <p className="font-urdu text-xs text-primary" dir="rtl">
                نیا پاس ورڈ بنائیں
              </p>
            )}
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {lang === 'ur'
                ? 'اکاؤنٹ کے تحفظ کے لیے کم از کم 8 حروف، حروفِ تہجی اور کم از کم ایک عدد یا علامت شامل کریں۔'
                : 'Your password must be at least 8 characters and include both letters and a number or symbol.'}
            </p>
          </div>
        </Card>

        {isDemoMode && (
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface-variant">
            {lang === 'ur'
              ? 'پیش نظارہ موڈ: یہ فارم صرف مقامی براؤزر ڈیمو فلو کی جانچ کے لیے ہے اور ریموٹ سرور پاس ورڈ تبدیل نہیں کرتا۔'
              : 'Preview Mode: Submitting updates the local browser demo flag only — no remote auth server password is modified.'}
          </div>
        )}

        {linkExpired && (
          <Card className="p-4 bg-error-container text-on-error-container border-error/30 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm">
                  {lang === 'ur' ? 'ری سیٹ لنک کی میعاد ختم ہو گئی' : 'Reset Link Expired or Invalid'}
                </p>
                <p className="leading-relaxed">
                  {lang === 'ur'
                    ? 'یہ لنک منسوخ ہو چکا ہے یا پہلے استعمال ہو چکا ہے۔ براہ کرم نیا ری سیٹ لنک حاصل کریں۔'
                    : 'This password reset link has expired, is invalid, or has already been used. Please request a fresh recovery link.'}
                </p>
              </div>
            </div>
            <Link to="/forgot-password" className="block">
              <Button variant="danger" fullWidth size="sm">
                {lang === 'ur' ? 'نیا ری سیٹ لنک حاصل کریں' : 'Request New Reset Link'}
              </Button>
            </Link>
          </Card>
        )}

        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
                {error}
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="reset-password" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'نیا پاس ورڈ' : 'New Password'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">نیا پاس ورڈ</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="reset-password"
                  type={showPass ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
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

              {/* 3-Bar Strength Meter */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-on-surface-variant">
                    {lang === 'ur' ? 'پاس ورڈ کی طاقت:' : 'Strength:'}
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
                <label htmlFor="reset-confirm" className="text-xs font-bold text-on-surface">
                  {lang === 'ur' ? 'نئے پاس ورڈ کی تصدیق' : 'Confirm New Password'}
                </label>
                {lang === 'en' && urduHints && (
                  <span className="font-urdu text-xs text-outline">پاس ورڈ کی تصدیق</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-outline absolute start-3.5 pointer-events-none" />
                <input
                  id="reset-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 ps-10 pe-11 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute end-2 w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3-Rule Live Checklist */}
            <div className="bg-surface-container-low rounded-xl p-3 space-y-2 text-xs">
              <p className="font-bold text-on-surface">
                {lang === 'ur' ? 'پاس ورڈ کی شرائط' : 'Password Requirements'}
              </p>
              <ChecklistItem
                ok={strength.rules.minLength}
                label={lang === 'ur' ? 'کم از کم 8 حروف' : 'At least 8 characters'}
              />
              <ChecklistItem
                ok={strength.rules.hasLetter && strength.rules.hasNumberOrSymbol}
                label={
                  lang === 'ur'
                    ? 'حروف اور کم از کم ایک عدد یا علامت شامل ہو'
                    : 'Includes letters & a number or symbol'
                }
              />
              <ChecklistItem
                ok={pairCheck.matches}
                label={lang === 'ur' ? 'دونوں پاس ورڈ ایک جیسے ہوں' : 'Both passwords match'}
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading || checkingLink} disabled={checkingLink || linkExpired}>
              {checkingLink
                ? (lang === 'ur' ? 'دعوت نامہ چیک ہو رہا ہے...' : 'Checking secure invitation...')
                : (lang === 'ur' ? 'نیا پاس ورڈ محفوظ کریں' : 'Save New Password')}
            </Button>
          </form>
        </Card>
      </Container>
    </AppShell>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? 'text-primary font-semibold' : 'text-outline'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </div>
  );
}
