import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, Store } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card, Container } from '../components/ui/Surface';
import { Input } from '../components/ui/FormFields';
import { useToast } from '../components/ui/Toast';

export function OwnerRegistration() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseClient();
    if (!client) {
      showToast('Registration is temporarily unavailable. Please try again later.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await client.from('owner_registration_requests').insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        business_name: businessName.trim() || null,
      });
      if (error) {
        if (error.code === '23505') {
          throw new Error('A pending registration request already exists for this email address.');
        }
        throw error;
      }
      setSubmitted(true);
      showToast('Your registration request has been submitted for Admin review.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not submit your request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell hideBottomNav>
      <Container size="sm" className="py-8 sm:py-12 max-w-[560px]">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        <Card className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed/40 text-primary flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-on-surface">Owner Portal Registration</h1>
              <p className="text-xs text-on-surface-variant">Hello Sadiqabad · Sadiqabad, Pakistan</p>
            </div>
          </div>
          {submitted ? (
            <div className="text-center space-y-3 py-5">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-lg font-bold text-on-surface">Request received</h2>
              <p className="text-sm text-on-surface-variant">
                Your details have been sent to the Admin team. No account or portal access is created until approval.
                If approved, you will receive an email invitation to activate your account.
              </p>
              <Button onClick={() => navigate('/login')} fullWidth>Return to Login</Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-surface-container-low p-3 flex gap-2 text-xs text-on-surface-variant">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                Submit your details for review. An account is created only after Admin approval.
              </div>
              <form onSubmit={submit} className="space-y-4">
                <Input label="Full Name" required minLength={2} maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Input label="Email Address" type="email" required maxLength={254} dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Mobile Number" type="tel" required minLength={5} maxLength={30} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Business Name (optional)" maxLength={160} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                <Button type="submit" fullWidth size="lg" loading={loading}>Submit Registration Request</Button>
              </form>
            </>
          )}
        </Card>
      </Container>
    </AppShell>
  );
}
