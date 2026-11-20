import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ExternalLink, MapPin, Search } from 'lucide-react';
import { fetchPublishedGovernmentJobBySlug, fetchPublishedGovernmentJobs } from '../lib/api';
import { getGovernmentJobDisplayStatus } from '../lib/governmentJobs';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import type { GovernmentJobRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { Button } from '../components/ui/Button';
import { Badge, Card, Container, SectionHeading } from '../components/ui/Surface';

function formatJobDate(value: string | null, lang: string): string {
 if (!value) return lang === 'ur' ? 'درج نہیں' : 'Not specified';
 return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-PK',{timeZone:'Asia/Karachi',day:'numeric',month:'short',year:'numeric'}).format(new Date(value.slice(0,10)+'T12:00:00+05:00'));
}
function statusLabel(status:ReturnType<typeof getGovernmentJobDisplayStatus>,lang:string):string {
 const labels:Record<string,[string,string]>={upcoming:['Upcoming','جلد شروع'],open:['Open','درخواستیں جاری'],closing_soon:['Closing Soon','آخری تاریخ قریب'],closed:['Closed','درخواستیں بند'],expired:['Expired','مدت ختم'],cancelled:['Cancelled','منسوخ']};
 return labels[status][lang==='ur'?1:0];
}
function statusVariant(status:ReturnType<typeof getGovernmentJobDisplayStatus>):'primary'|'secondary'|'warning' {
 if(status==='upcoming') return 'secondary';
 if(status==='open') return 'primary';
 if(status==='closing_soon') return 'warning';
 return 'secondary';
}
function jobTypeLabel(value:string,lang:string):string {
 const labels:Record<string,[string,string]>={regular:['Regular','مستقل'],contract:['Contract','کنٹریکٹ'],project:['Project','پروجیکٹ'],internship:['Internship','انٹرن شپ'],temporary:['Temporary','عارضی'],other:['Other','دیگر']};
 return (labels[value]||labels.other)[lang==='ur'?1:0];
}

export function GovernmentJobs() {
 const {slug}=useParams();
 const {lang,urduHints}=useI18n();
 const [jobs,setJobs]=useState<GovernmentJobRow[]>([]);
 const [job,setJob]=useState<GovernmentJobRow|null>(null);
 const [loading,setLoading]=useState(true);
 const [failed,setFailed]=useState(false);
 const [retry,setRetry]=useState(0);
 const [query,setQuery]=useState('');
 const [scope,setScope]=useState('all');
 const [departmentFilter,setDepartmentFilter]=useState('all');
 const [jobTypeFilter,setJobTypeFilter]=useState('all');
 const [archive,setArchive]=useState(false);

 useEffect(()=>{
  let active=true;
  setLoading(true); setFailed(false);
  const request=slug
   ? fetchPublishedGovernmentJobBySlug(slug).then(value=>({job:value,jobs:[] as GovernmentJobRow[]}))
   : fetchPublishedGovernmentJobs().then(value=>({job:null,jobs:value}));
  request.then(result=>{
   if(!active) return;
   setJob(result.job); setJobs(result.jobs);
   if(slug&&!result.job){
    updatePageSeo({title:'Government Job Not Found',description:'This government job is not currently available.',canonicalPath:'/government-jobs/'+slug,robots:'noindex,follow'});
   } else if(result.job){
    const status=getGovernmentJobDisplayStatus(result.job);
    updatePageSeo({
     title:result.job.title_en+' — Government Job',
     description:[result.job.summary_en,result.job.location_text,result.job.department_name].filter(Boolean).join(' · '),
     canonicalPath:'/government-jobs/'+result.job.slug,
     jsonLd:status==='open'||status==='closing_soon'?{
      '@context':'https://schema.org','@type':'JobPosting',title:result.job.title_en,
      description:[result.job.summary_en,result.job.qualification_text,result.job.experience_text,result.job.application_steps].filter(Boolean).join('\n\n'),
      datePosted:result.job.published_at,
      ...(result.job.deadline_at?{validThrough:result.job.deadline_at+'T23:59:59+05:00'}:{}),
      employmentType:result.job.job_type==='regular'?'FULL_TIME':result.job.job_type.toUpperCase(),
      hiringOrganization:{'@type':'Organization',name:result.job.department_name},
      jobLocation:{'@type':'Place',address:{'@type':'PostalAddress',addressLocality:result.job.location_text,addressCountry:'PK'}},
      ...(result.job.official_case_number?{identifier:{'@type':'PropertyValue',name:result.job.department_name,value:result.job.official_case_number}}:{}),
     }:null,
    });
   } else {
    updatePageSeo({title:'Government Jobs in Sadiqabad — Punjab & Federal',description:'Find official Punjab and Federal Government job advertisements relevant to Sadiqabad and Rahim Yar Khan.',canonicalPath:'/government-jobs',robots:result.jobs.length?'index,follow,max-image-preview:large':'noindex,follow'});
   }
  }).catch(()=>{if(active)setFailed(true);}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[slug,retry]);

 const filteredJobs=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase();
  return jobs.filter(item=>{
   const status=getGovernmentJobDisplayStatus(item);
   const isArchived=status==='closed'||status==='expired'||status==='cancelled';
   if(archive!==isArchived) return false;
   if(scope!=='all'&&item.department_scope!==scope) return false;
   if(departmentFilter!=='all'&&item.department_name!==departmentFilter) return false;
   if(jobTypeFilter!=='all'&&item.job_type!==jobTypeFilter) return false;
   if(term&&![item.title_en,item.title_ur,item.summary_en,item.summary_ur,item.department_name,item.location_text,item.qualification_text].filter(Boolean).join(' ').toLocaleLowerCase().includes(term)) return false;
   return true;
  });
 },[jobs,query,scope,departmentFilter,jobTypeFilter,archive]);

 const title=lang==='ur'?'سرکاری نوکریاں':'Government Jobs';
 return <AppShell><Container size="lg" className="py-6 space-y-5">
  {slug?<Link to="/government-jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="w-4 h-4"/>{lang==='ur'?'تمام نوکریاں':'All Government Jobs'}</Link>
   :<SectionHeading title={title} titleUr="پنجاب اور وفاقی سرکاری نوکریاں" subtitle="Official advertisements and application links. Hello Sadiqabad does not accept job applications." headingLevel="h1"/>}
  {loading?<div className="space-y-3"><Skeleton className="h-48 rounded-2xl"/><Skeleton className="h-28 rounded-2xl"/></div>
   :failed?<EmptyState icon={<BriefcaseBusiness className="w-6 h-6"/>} title="Government jobs could not be loaded" description="Please check your connection and try again." action={<Button onClick={()=>setRetry(v=>v+1)}>Retry</Button>}/>
   :slug&&!job?<EmptyState icon={<BriefcaseBusiness className="w-6 h-6"/>} title="Government job not found" description="This listing may have been removed or the link may be incorrect." action={<Link to="/government-jobs"><Button>Browse Government Jobs</Button></Link>}/>
   :job?<article className="max-w-3xl mx-auto space-y-5">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant={statusVariant(getGovernmentJobDisplayStatus(job))}>{statusLabel(getGovernmentJobDisplayStatus(job),lang)}</Badge>
     <Badge variant="secondary">{job.department_scope==='federal'?'Federal Government':job.department_scope==='punjab'?'Punjab Government':'Government'}</Badge>
     <Badge variant="secondary">{jobTypeLabel(job.job_type,lang)}</Badge>
    </div>
    <div className="space-y-2">
     <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">{bilingualText(lang,job.title_en,job.title_ur)}</h1>
     {lang==='en'&&urduHints&&job.title_ur&&<p className="font-urdu text-lg text-primary leading-[2]" dir="rtl">{job.title_ur}</p>}
     <p className="text-sm font-semibold text-on-surface-variant">{job.department_name}</p>
     {job.image_url&&<img src={job.image_url} alt={job.title_en+" job poster"} className="w-full max-h-[520px] rounded-2xl border border-outline-variant/50 object-contain bg-surface" loading="lazy"/>}
     <p className="flex items-center gap-2 text-sm text-on-surface-variant"><MapPin className="w-4 h-4"/>{job.location_text}</p>
     {job.sadiqabad_relevance===true&&<Badge variant="primary">Sadiqabad / Rahim Yar Khan eligible (as stated in advertisement)</Badge>}
    </div>
    {job.summary_en&&<section className="space-y-1"><h2 className="text-base font-bold text-on-surface">Job summary</h2><p className="text-sm text-on-surface-variant leading-7">{bilingualText(lang,job.summary_en,job.summary_ur)}</p>{lang==='en'&&urduHints&&job.summary_ur&&<p className="font-urdu text-sm text-on-surface leading-8" dir="rtl">{job.summary_ur}</p>}</section>}
    <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
     <div><p className="text-xs text-on-surface-variant">Qualification</p><p className="text-sm font-semibold">{job.qualification_text}</p></div>
     <div><p className="text-xs text-on-surface-variant">Vacancies</p><p className="text-sm font-semibold">{job.vacancy_count??'Not specified'}</p></div>
     <div><p className="text-xs text-on-surface-variant">Scale / Grade</p><p className="text-sm font-semibold">{job.scale_or_grade||'Not specified'}</p></div>
     <div><p className="text-xs text-on-surface-variant">Closing date</p><p className="text-sm font-semibold">{formatJobDate(job.deadline_at,lang)}</p></div>
     <div><p className="text-xs text-on-surface-variant">Source last verified</p><p className="text-sm font-semibold">{formatDateShort(job.verified_at??job.updated_at,lang)}</p></div>
     <div><p className="text-xs text-on-surface-variant">Official case / ad number</p><p className="text-sm font-semibold">{job.official_case_number||'Not specified'}</p></div>
    </Card>
    {[
     ['Experience',job.experience_text],['Age requirement',job.age_text],['Domicile',job.domicile_text],
     ['Gender / quota',job.gender_or_quota_text],['Other eligibility',job.other_eligibility_text],
     ['Application fee',job.application_fee_text],['Application instructions',job.application_steps],
    ].filter(entry=>Boolean(entry[1])).map(entry=><section key={String(entry[0])} className="space-y-1"><h2 className="text-base font-bold text-on-surface">{entry[0]}</h2><p className="text-sm text-on-surface-variant whitespace-pre-line leading-7">{entry[1]}</p></section>)}
    <Card className="p-4 space-y-3">
     <h2 className="font-bold text-on-surface">Official application & source</h2>
     {job.apply_url&&<a href={job.apply_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary">Apply on official portal <ExternalLink className="w-4 h-4"/></a>}
     {job.advertisement_url&&<p><a className="text-sm font-semibold text-primary underline" href={job.advertisement_url} target="_blank" rel="noopener noreferrer nofollow">View official advertisement <ExternalLink className="inline w-3.5 h-3.5"/></a></p>}
     {job.source_document_url&&<p><a className="text-sm font-semibold text-primary underline" href={job.source_document_url} target="_blank" rel="noopener noreferrer nofollow">Open source document <ExternalLink className="inline w-3.5 h-3.5"/></a></p>}
     {job.source_url&&<p><a className="text-sm font-semibold text-primary underline" href={job.source_url} target="_blank" rel="noopener noreferrer nofollow">Source: {job.source_name||'Official department'} <ExternalLink className="inline w-3.5 h-3.5"/></a></p>}
     <p className="text-xs text-on-surface-variant">The official advertisement and department portal are authoritative if any summary differs. Hello Sadiqabad does not accept applications, collect fees or guarantee eligibility/selection.</p>
    </Card>
   </article>
   :<div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
     <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"/>
      <input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search job title, department, location or qualification" aria-label="Search government jobs" className="min-h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary"/>
     </div>
     <select value={scope} onChange={event=>setScope(event.target.value)} aria-label="Government level" className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
      <option value="all">Punjab + Federal</option><option value="punjab">Punjab</option><option value="federal">Federal</option><option value="other">Other</option>
     </select>
     <select value={departmentFilter} onChange={event=>setDepartmentFilter(event.target.value)} aria-label="Department" className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm"><option value="all">All departments</option>{Array.from(new Set(jobs.map(item=>item.department_name))).sort().map(name=><option key={name} value={name}>{name}</option>)}</select>
     <select value={jobTypeFilter} onChange={event=>setJobTypeFilter(event.target.value)} aria-label="Job type" className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm"><option value="all">All job types</option><option value="regular">Regular</option><option value="contract">Contract</option><option value="project">Project</option><option value="internship">Internship</option><option value="temporary">Temporary</option><option value="other">Other</option></select>
     <Button variant={archive?'outline':'primary'} onClick={()=>setArchive(false)}>Open jobs</Button>
     <Button variant={archive?'primary':'outline'} onClick={()=>setArchive(true)}>Closed / expired</Button>
    </div>
    {filteredJobs.length===0?<EmptyState icon={<BriefcaseBusiness className="w-6 h-6"/>} title={archive?'No archived jobs found':'No open government jobs found'} description={query||scope!=='all'?'Try changing your search or filters.':'New verified government job advertisements will appear here when published.'}/>
     :<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredJobs.map(item=>{
      const status=getGovernmentJobDisplayStatus(item);
      return <Card key={item.id} className="p-4 space-y-3">
       <div className="flex flex-wrap gap-2"><Badge variant={statusVariant(status)}>{statusLabel(status,lang)}</Badge><Badge variant="secondary">{item.department_scope==='federal'?'Federal':item.department_scope==='punjab'?'Punjab':'Other'}</Badge></div>
       {item.image_url&&<img src={item.image_url} alt={item.title_en+" job poster"} className="h-36 w-full rounded-xl object-contain bg-surface-container-low" loading="lazy"/>}
       <div className="space-y-1"><Link to={'/government-jobs/'+item.slug} className="text-base font-bold text-on-surface hover:text-primary">{bilingualText(lang,item.title_en,item.title_ur)}</Link><p className="text-xs font-semibold text-on-surface-variant">{item.department_name}</p><p className="text-xs text-on-surface-variant flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{item.location_text}</p></div>
       <p className="text-sm text-on-surface-variant line-clamp-3">{bilingualText(lang,item.summary_en||item.qualification_text,item.summary_ur)}</p>
       <div className="flex items-center justify-between gap-3 border-t border-outline-variant/40 pt-3"><span className="text-xs text-on-surface-variant inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5"/>{formatJobDate(item.deadline_at,lang)}</span><Link to={'/government-jobs/'+item.slug} className="text-xs font-bold text-primary">View details →</Link></div>
      </Card>;
     })}</div>}
    <p className="text-xs text-on-surface-variant">Listings are based on official sources and show when they were last checked. Always read the original advertisement before applying.</p>
   </div>}
 </Container></AppShell>;
}
