import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { Card, Container, SectionHeading } from '../components/ui/Surface';
import { GOV_SECTIONS } from '../lib/govNavigation';

export function Gov() {
  const { lang, urduHints } = useI18n();

  useEffect(() => {
    updatePageSeo({
      title: 'Government Services in Sadiqabad — Jobs, Schemes & Authorities',
      description: 'Find Government Jobs, Government Schemes, Local Authorities and Authority Profiles through Hello Sadiqabad.',
      canonicalPath: '/gov',
    });
  }, []);

  return (
    <AppShell>
      <Container className="py-6 sm:py-8 space-y-6">
        <SectionHeading
          headingLevel="h1"
          title={lang === 'ur' ? 'سرکاری معلومات اور خدمات' : 'Government & Civic Services'}
          titleUr="سرکاری معلومات اور خدمات"
          subtitle={lang === 'ur'
            ? 'نوکریوں، سرکاری اسکیموں، دفاتر اور متعلقہ شخصیات کی معلومات ایک جگہ دیکھیں۔'
            : 'Explore government opportunities, public schemes, local offices and authority profiles in one place.'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GOV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const title = lang === 'ur' ? section.titleUr : section.titleEn;
            const description = lang === 'ur' ? section.descriptionUr : section.descriptionEn;
            return (
              <Card key={section.to} className="p-0 overflow-hidden hs-card-motion">
                <Link
                  to={section.to}
                  aria-label={title}
                  className="group min-h-36 h-full flex items-center gap-4 p-4 sm:p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-3px]"
                >
                  <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] shrink-0 rounded-2xl bg-primary-fixed/70 text-primary flex items-center justify-center">
                    <Icon aria-hidden="true" className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{title}</h2>
                    {lang === 'en' && urduHints && (
                      <p className="font-urdu text-xs text-outline mt-1" dir="rtl">{section.titleUr}</p>
                    )}
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">{description}</p>
                    {lang === 'en' && urduHints && (
                      <p className="font-urdu text-xs text-outline mt-1 leading-relaxed" dir="rtl">{section.descriptionUr}</p>
                    )}
                  </div>
                  <ChevronRight aria-hidden="true" className="w-5 h-5 shrink-0 text-outline group-hover:text-primary rtl:rotate-180" />
                </Link>
              </Card>
            );
          })}
        </div>
      </Container>
    </AppShell>
  );
}
