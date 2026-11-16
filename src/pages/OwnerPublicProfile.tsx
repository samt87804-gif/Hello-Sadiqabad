import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone, ShieldCheck, Store } from 'lucide-react';
import { fetchPublicOwnerProfile, fetchPublicOwnerProfileBusinesses } from '../lib/api';
import type { BusinessPublicView, OwnerPublicProfileView } from '../types/directory';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { Card, Container } from '../components/ui/Surface';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Skeleton, ErrorState } from '../components/ui/Feedback';

export function OwnerPublicProfile() {
  const { ownerId = '' } = useParams();
  const [profile, setProfile] = useState<OwnerPublicProfileView | null>(null);
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    const load = async () => {
      try {
        const owner = await fetchPublicOwnerProfile(ownerId);
        if (!active) return;
        if (!owner) {
          setProfile(null);
          setBusinesses([]);
          return;
        }
        setProfile(owner);
        updatePageSeo({
          title: owner.display_name ? `${owner.display_name} — Hello Sadiqabad` : 'Business Owner — Hello Sadiqabad',
          description: 'Public business owner profile and approved Sadiqabad business listings.',
          canonicalPath: `/owner-profile/${ownerId}`,
        });
        const selectedBusinesses = await fetchPublicOwnerProfileBusinesses(ownerId);
        if (!active) return;
        setBusinesses(selectedBusinesses);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [ownerId]);

  return (
    <AppShell>
      <Container className="py-6 sm:py-8 space-y-5 max-w-4xl">
        <Link to="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </Link>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : failed ? (
          <ErrorState title="Could not load owner profile" description="Please check your connection and try again." />
        ) : !profile ? (
          <ErrorState title="Public owner profile unavailable" description="This owner has not enabled a public profile, or no profile fields are currently shared." />
        ) : (
          <>
            <Card className="p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-4">
                {profile.photo_url ? (
                  <ImageWithFallback src={profile.photo_url} alt={profile.display_name || 'Business owner'} className="w-20 h-20 rounded-full shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-9 h-9" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Public Owner Profile</p>
                  <h1 className="text-2xl font-extrabold text-on-surface mt-1">{profile.display_name || 'Business Owner'}</h1>
                  <p className="text-xs text-on-surface-variant mt-1">Sadiqabad, Punjab</p>
                </div>
              </div>
              {(profile.phone || profile.email) && (
                <div className="flex flex-wrap gap-3 border-t border-outline-variant/30 pt-4">
                  {profile.phone && (
                    <a href={`tel:${profile.phone.replace(/[^+0-9]/g, '')}`} className="inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface">
                      <Phone className="w-4 h-4 text-primary" /> <span dir="ltr">{profile.phone}</span>
                    </a>
                  )}
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface">
                      <Mail className="w-4 h-4 text-primary" /> {profile.email}
                    </a>
                  )}
                </div>
              )}
            </Card>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Published Businesses ({businesses.length})</h2>
              </div>
              {businesses.length === 0 ? (
                <Card className="p-5 text-sm text-on-surface-variant">No published business listings are currently linked to this owner.</Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businesses.map((business) => (
                    <Link key={business.id} to={`/business/${business.slug}`}>
                      <Card className="p-4 h-full hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback src={business.logo_url || business.cover_url} alt={business.name_en} className="w-14 h-14 rounded-xl shrink-0" />
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-on-surface truncate">{business.name_en}</h3>
                            <p className="text-xs text-on-surface-variant mt-1">{business.category?.name_en || 'Local business'}</p>
                            <p className="text-xs text-on-surface-variant mt-1 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{business.area?.name_en || 'Sadiqabad'}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </Container>
    </AppShell>
  );
}
