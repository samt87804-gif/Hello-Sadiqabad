import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { fetchPublishedSdkJobBySlug, fetchPublishedSdkJobs, type SdkJobPublic } from '../lib/sdkJobs';
import { useI18n } from '../lib/i18n';
import { bilingualText, daysUntil, formatDateShort } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import { ContentShareActions } from '../components/ui/ContentShareActions';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { Button } from '../components/ui/Button';
import { Badge, Card, Container, SectionHeading } from '../components/ui/Surface';

const CONTACT_WHATSAPP = '923283212342';
function jobType(value: string, lang: 'en' | 'ur') {
  const labels: Record<string, [string, string]> = {
    'full-time': ['Full-time', 'کل وقتی'], 'part-time': ['Part-time', 'جز وقتی'],
    contract: ['Contract', 'کنٹریکٹ'], temporary: ['Temporary', 'عارضی'],
    internship: ['Internship', 'انٹرن شپ'], apprenticeship: ['Apprenticeship', 'شاگردی'],
  };
  const found = labels[value.toLowerCase()];
  return found ? found[lang === 'ur' ? 1 : 0] : value;
}
function dateOnly(value: string | null, lang: 'en' | 'ur') {
  if (!value) return lang === 'ur' ? 'آخری تاریخ مقرر نہیں' : 'No closing date';
  return formatDateShort(value + 'T12:00:00+05:00', lang);
}
function statusFor(job: SdkJobPublic, lang: 'en' | 'ur') {
  const days = job.closing_date ? daysUntil(job.closing_date + 'T23:59:59+05:00') : null;
  return days !== null && days <= 7
    ? (lang === 'ur' ? 'آخری تاریخ قریب' : 'Closing soon')
    : (lang === 'ur' ? 'درخواستیں جاری' : 'Open');
}
function salary(job: SdkJobPublic) {
  if (!job.salary_disclosed || (job.salary_min === null && job.salary_max === null)) return null;
  const fmt = (value: number) => new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value);
  if (job.salary_min !== null && job.salary_max !== null) return `PKR ${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  return job.salary_min !== null ? `From PKR ${fmt(job.salary_min)}` : `Up to PKR ${fmt(job.salary_max as number)}`;
}

export function SdkJobs() {
  const { slug } = useParams();
  const { lang, urduHints } = useI18n();
  const [jobs, setJobs] = useState<SdkJobPublic[]>([]);
  const [job, setJob] = useState<SdkJobPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [area, setArea] = useState('all');
  const [deadline, setDeadline] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true); setFailed(false);
    const request = slug
      ? fetchPublishedSdkJobBySlug(slug).then((value) => ({ job: value, jobs: [] as SdkJobPublic[] }))
      : fetchPublishedSdkJobs().then((value) => ({ job: null, jobs: value }));
    request.then((result) => {
      if (!active) return;
      setJob(result.job); setJobs(result.jobs);
      if (slug && !result.job) {
        updatePageSeo({ title: 'Local Job Not Found', description: 'This local job is not currently available.', canonicalPath: '/sdk-jobs/' + slug, robots: 'noindex,follow' });
      } else if (result.job) {
        const item = result.job;
        const location = item.work_location_en || item.area_name_en || 'Sadiqabad';
        const description = [item.summary_en, item.qualifications_en, item.experience_en, item.duties_en].filter(Boolean).join('\n\n');
        const employmentType = ({ 'full-time': 'FULL_TIME', 'part-time': 'PART_TIME', contract: 'CONTRACTOR', temporary: 'TEMPORARY', internship: 'INTERN', apprenticeship: 'INTERN' } as Record<string, string>)[item.job_type.toLowerCase()] || 'OTHER';
        updatePageSeo({
          title: item.title_en + ' — Local Job',
          description: [item.summary_en, location].filter(Boolean).join(' · '),
          canonicalPath: '/sdk-jobs/' + item.slug,
          image: item.image_url,
          ogType: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'JobPosting',
            title: item.title_en,
            description,
            datePosted: item.published_at,
            ...(item.closing_date ? { validThrough: item.closing_date + 'T23:59:59+05:00' } : {}),
            employmentType,
            hiringOrganization: { '@type': 'Organization', name: 'Confidential local employer' },
            jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: location, addressRegion: 'Punjab', addressCountry: 'PK' } },
            ...(item.image_url ? { image: item.image_url } : {}),
          },
        });
      } else {
        updatePageSeo({
          title: 'Local Jobs in Sadiqabad — SDK Jobs',
          description: 'Explore current local vacancies in Sadiqabad. Job listings are reviewed before publication; applications are handled directly by the approved contact channel.',
          canonicalPath: '/sdk-jobs',
          robots: result.jobs.length ? 'index,follow,max-image-preview:large' : 'noindex,follow',
        });
      }
    }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, retry]);

  const categories = useMemo(() => [...new Set(jobs.map((item) => item.job_category).filter(Boolean))].sort(), [jobs]);
  const types = useMemo(() => [...new Set(jobs.map((item) => item.job_type).filter(Boolean))].sort(), [jobs]);
  const areas = useMemo(() => [...new Set(jobs.map((item) => item.area_name_en).filter((value): value is string => Boolean(value)))].sort(), [jobs]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return jobs.filter((item) => {
      if (category !== 'all' && item.job_category !== category) return false;
      if (type !== 'all' && item.job_type !== type) return false;
      if (area !== 'all' && item.area_name_en !== area) return false;
      if (deadline === 'no_deadline' && item.closing_date) return false;
      if (deadline === 'closing_soon' && (!item.closing_date || (daysUntil(item.closing_date + 'T23:59:59+05:00') ?? 99) > 7)) return false;
      return !term || [item.title_en, item.title_ur, item.summary_en, item.summary_ur, item.job_category, item.work_location_en, item.work_location_ur, item.area_name_en, item.area_name_ur, item.qualifications_en].filter(Boolean).join(' ').toLocaleLowerCase().includes(term);
    });
  }, [jobs, query, category, type, area, deadline]);

  const title = lang === 'ur' ? 'مقامی نوکریاں' : 'Local Jobs';
  const publicUrl = job ? 'https://hellosadiqabad.com/sdk-jobs/' + job.slug : '';
  const contactText = job ? `Hello Sadiqabad SDK Jobs: ${job.title_en}\n${publicUrl}` : '';
  const contactUrl = 'https://wa.me/' + CONTACT_WHATSAPP + '?text=' + encodeURIComponent(contactText);

  return <AppShell><Container size="lg" className="py-6 space-y-5">
    {slug ? <Link to="/sdk-jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="w-4 h-4" />{lang === 'ur' ? 'تمام مقامی نوکریاں' : 'All Local Jobs'}</Link>
      : <SectionHeading title={title} titleUr="صادق آباد اور قریبی علاقوں میں روزگار کے مواقع" subtitle="Owner-submitted vacancies reviewed by Hello Sadiqabad. Employer identity and personal contact details are kept private." headingLevel="h1" />}
    {loading ? <div className="space-y-3"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
      : failed ? <EmptyState icon={<BriefcaseBusiness className="w-6 h-6" />} title="Local jobs could not be loaded" description="Please check your connection and try again." action={<Button onClick={() => setRetry((value) => value + 1)}>Retry</Button>} />
      : slug && !job ? <EmptyState icon={<BriefcaseBusiness className="w-6 h-6" />} title="Local job not found" description="This vacancy may have closed or the link may be incorrect." action={<Link to="/sdk-jobs"><Button>Browse local jobs</Button></Link>} />
      : job ? <article className="max-w-3xl mx-auto space-y-5">
        <div className="flex flex-wrap gap-2"><Badge variant="primary">{job.job_category}</Badge><Badge variant="secondary">{jobType(job.job_type, lang)}</Badge><Badge variant="success">{statusFor(job, lang)}</Badge></div>
        <div className="space-y-3">
          {job.image_url && <img src={job.image_url} alt={job.title_en + ' job poster'} className="w-full max-h-[560px] rounded-2xl border border-outline-variant/50 object-contain bg-surface" loading="lazy" />}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">{bilingualText(lang, job.title_en, job.title_ur)}</h1>
          {lang === 'en' && urduHints && job.title_ur && <p dir="rtl" className="font-urdu text-lg text-primary">{job.title_ur}</p>}
          <p className="text-sm text-on-surface-variant">{bilingualText(lang, job.summary_en, job.summary_ur)}</p>
        </div>
        <Card className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span>{job.vacancy_count} {lang === 'ur' ? 'آسامیاں' : 'vacancies'}</span></div>
          <div className="flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-primary" /><span>{jobType(job.job_type, lang)}</span></div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><span>{bilingualText(lang, job.work_location_en || job.area_name_en || 'Sadiqabad', job.work_location_ur || job.area_name_ur || 'صادق آباد')}</span></div>
          <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /><span>{lang === 'ur' ? 'آخری تاریخ: ' : 'Closing date: '}{dateOnly(job.closing_date, lang)}</span></div>
          {salary(job) && <div className="sm:col-span-2 font-semibold">{salary(job)}</div>}
        </Card>
        {job.duties_en && <section className="space-y-2"><h2 className="text-lg font-bold">{lang === 'ur' ? 'ذمہ داریاں' : 'Duties & responsibilities'}</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{bilingualText(lang, job.duties_en, job.duties_ur)}</p></section>}
        {job.qualifications_en && <section className="space-y-2"><h2 className="text-lg font-bold">{lang === 'ur' ? 'تعلیمی قابلیت' : 'Qualifications'}</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{bilingualText(lang, job.qualifications_en, job.qualifications_ur)}</p></section>}
        {job.experience_en && <section className="space-y-2"><h2 className="text-lg font-bold">{lang === 'ur' ? 'تجربہ' : 'Experience'}</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{bilingualText(lang, job.experience_en, job.experience_ur)}</p></section>}
        {job.working_hours_en && <section className="space-y-2"><h2 className="text-lg font-bold">{lang === 'ur' ? 'اوقات کار' : 'Working hours'}</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{bilingualText(lang, job.working_hours_en, job.working_hours_ur)}</p></section>}
        {job.benefits_en && <section className="space-y-2"><h2 className="text-lg font-bold">{lang === 'ur' ? 'سہولیات' : 'Benefits'}</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{bilingualText(lang, job.benefits_en, job.benefits_ur)}</p></section>}
        <Card className="p-4 space-y-3"><h2 className="font-bold">{lang === 'ur' ? 'رابطہ اور دفتر آنے کی ہدایات' : 'Contact & office visit instructions'}</h2><p className="text-sm text-on-surface-variant">{lang === 'ur' ? 'آجر کی شناخت اور ذاتی رابطہ معلومات نجی رکھی جاتی ہیں۔ اس نوکری کے بارے میں صرف Hello Sadiqabad کے منظور شدہ واٹس ایپ رابطے پر پوچھیں۔' : 'The employer identity and personal contact details remain private. For information about this vacancy, use the approved Hello Sadiqabad contact channel.'}</p><div className="rounded-xl bg-surface-container-low p-3 text-sm"><p className="font-bold">{lang === 'ur' ? 'فزیکل CV کے ساتھ دفتر تشریف لائیں' : 'Bring a physical CV to the office'}</p><p className="mt-1">{lang === 'ur' ? 'پیر تا جمعہ، صبح 10:00 بجے سے دوپہر 2:00 بجے تک (پاکستانی وقت)۔ ہفتہ اور اتوار دفتر بند ہے۔ ان اوقات سے پہلے، بعد یا ہفتہ/اتوار کو نہ آئیں۔' : 'Monday–Friday, 10:00 AM–2:00 PM Pakistan time. The office is closed Saturday and Sunday. Do not arrive before 10:00 AM, after 2:00 PM, or on weekends.'}</p><p className="mt-1 text-xs text-on-surface-variant">{lang === 'ur' ? 'تصدیق شدہ دفتر کا پتہ فی الحال یہاں درج نہیں؛ پتہ تصدیق ہونے تک کوئی غیر مصدقہ مقام استعمال نہ کریں۔' : 'A verified street address is not currently displayed. Do not rely on an unverified location.'}</p></div><a href={contactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary">{lang === 'ur' ? 'واٹس ایپ پر معلومات لیں' : 'Ask about this job on WhatsApp'}</a></Card>
        <ContentShareActions title={bilingualText(lang, job.title_en, job.title_ur)} description={bilingualText(lang, job.summary_en, job.summary_ur)} url={publicUrl} lang={lang} contentType="sdk_job" />
        <p className="text-xs text-on-surface-variant">{lang === 'ur' ? 'یہ نوکری آجر کی جانب سے جمع کرائی گئی اور اشاعت سے پہلے دیکھی گئی ہے۔ Hello Sadiqabad بھرتی، انتخاب یا ملازمت کی ضمانت نہیں دیتا۔ کسی بھی فیس یا اصل دستاویزات کی ادائیگی سے پہلے خود تصدیق کریں۔' : 'This vacancy was submitted by an employer and reviewed before publication. Hello Sadiqabad does not recruit, select candidates or guarantee employment. Verify independently before paying fees or sharing original documents.'}</p>
      </article>
      : <div className="space-y-4">
        <Card className="p-3 sm:p-4 space-y-3"><label className="relative block"><Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === 'ur' ? 'نوکری تلاش کریں' : 'Search jobs'} className="w-full rounded-xl border border-outline-variant bg-surface pl-10 pr-3 py-2.5 text-sm" /></label>
          <div className="grid sm:grid-cols-3 gap-2">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm"><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select>
            <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm"><option value="all">All job types</option>{types.map((value) => <option key={value} value={value}>{jobType(value, 'en')}</option>)}</select>
            <select value={area} onChange={(event) => setArea(event.target.value)} className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm"><option value="all">All areas</option>{areas.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm"><option value="all">All closing dates</option><option value="closing_soon">Closing within 7 days</option><option value="no_deadline">No closing date</option></select>
          </div>
        </Card>
        {filtered.length === 0 ? <EmptyState icon={<BriefcaseBusiness className="w-6 h-6" />} title={jobs.length ? 'No jobs match these filters' : 'No current local vacancies'} description={jobs.length ? 'Try changing your search or filters.' : 'Approved local vacancies will appear here when available.'} action={jobs.length ? <Button variant="outline" onClick={() => { setQuery(''); setCategory('all'); setType('all'); setArea('all'); setDeadline('all'); }}>Clear filters</Button> : undefined} />
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map((item) => <Link key={item.slug} to={'/sdk-jobs/' + item.slug} className="group"><Card className="h-full overflow-hidden hover:border-primary/50 transition-colors">
            {item.image_url && <img src={item.image_url} alt="" className="w-full h-44 object-contain bg-surface-container-low" loading="lazy" />}
            <div className="p-4 space-y-2"><div className="flex flex-wrap gap-2"><Badge variant="primary">{item.job_category}</Badge><Badge variant="success">{statusFor(item, lang)}</Badge></div><h2 className="font-bold group-hover:text-primary">{bilingualText(lang, item.title_en, item.title_ur)}</h2><p className="text-xs text-on-surface-variant line-clamp-3">{bilingualText(lang, item.summary_en, item.summary_ur)}</p><div className="flex flex-wrap gap-3 text-xs text-on-surface-variant"><span>{jobType(item.job_type, lang)}</span><span>{item.area_name_en || item.work_location_en || 'Sadiqabad'}</span><span>{item.vacancy_count} vacancies</span></div><p className="text-xs font-semibold text-primary">{lang === 'ur' ? 'تفصیل دیکھیں' : 'View job details'} →</p></div>
          </Card></Link>)}</div>}
      </div>}
  </Container></AppShell>;
}
