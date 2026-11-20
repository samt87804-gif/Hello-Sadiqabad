import React,{useEffect,useMemo,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {ArrowLeft,BookOpenCheck,CalendarDays,ExternalLink,Search,ShieldAlert} from 'lucide-react';
import {fetchPublishedGovernmentSchemes,fetchPublishedGovernmentSchemeBySlug,submitGovernmentSchemeReport} from '../lib/governmentSchemes';
import {useI18n} from '../lib/i18n';
import {bilingualText} from '../lib/format';
import {updatePageSeo} from '../lib/seo';
import type {GovernmentSchemeRow,GovernmentSchemeReportReason} from '../types/database';
import {AppShell} from '../components/layout/AppShell';
import {EmptyState,Skeleton} from '../components/ui/Feedback';
import {Button} from '../components/ui/Button';
import {Badge,Card,Container,SectionHeading} from '../components/ui/Surface';
import {useToast} from '../components/ui/Toast';

function scopeLabel(value:string,lang:string){return value==='punjab'?(lang==='ur'?'حکومتِ پنجاب':'Punjab Government'):(lang==='ur'?'وفاقی حکومت':'Federal Government');}
function categoryLabel(value:string,lang:string){
 const labels:Record<string,[string,string]>={housing:['Housing','رہائش'],business_finance:['Business finance','کاروباری قرض'],agriculture:['Agriculture','زراعت'],education:['Education','تعلیم'],social_protection:['Social protection','سماجی تحفظ'],skills:['Skills & training','ہنر و تربیت'],health:['Health','صحت'],other:['Other','دیگر']};
 return (labels[value]||labels.other)[lang==='ur'?1:0];
}
function benefitLabel(value:string,lang:string){
 const labels:Record<string,[string,string]>={grant:['Grant','امداد'],loan:['Loan / financing','قرض / فنانسنگ'],cash_transfer:['Cash assistance','مالی امداد'],subsidy:['Subsidy','سبسڈی'],training:['Training','تربیت'],housing:['Housing support','رہائشی سہولت'],service:['Government service','سرکاری سہولت'],other:['Other benefit','دیگر']};
 return (labels[value]||labels.other)[lang==='ur'?1:0];
}
function intakeLabel(value:string,lang:string){
 const labels:Record<string,[string,string]>={unconfirmed:['Intake not confirmed','درخواستوں کا آغاز تصدیق طلب'],upcoming:['Expected / upcoming','متوقع'],open:['Applications open','درخواستیں جاری'],paused:['Temporarily paused','عارضی طور پر بند'],closed:['Applications closed','درخواستیں بند'],expired:['Deadline passed','آخری تاریخ گزر گئی'],cancelled:['Programme cancelled','منسوخ']};
 return (labels[value]||labels.unconfirmed)[lang==='ur'?1:0];
}
function dateLabel(value:string|null,lang:string){
 if(!value)return lang==='ur'?'درج نہیں':'Not announced';
 return new Intl.DateTimeFormat(lang==='ur'?'ur-PK':'en-PK',{timeZone:'Asia/Karachi',day:'numeric',month:'short',year:'numeric'}).format(new Date(value.slice(0,10)+'T12:00:00+05:00'));
}

export function GovernmentSchemes(){
 const {slug}=useParams();
 const {lang,urduHints}=useI18n();
 const {showToast}=useToast();
 const [schemes,setSchemes]=useState<GovernmentSchemeRow[]>([]);
 const [scheme,setScheme]=useState<GovernmentSchemeRow|null>(null);
 const [loading,setLoading]=useState(true);
 const [failed,setFailed]=useState(false);
 const [retry,setRetry]=useState(0);
 const [query,setQuery]=useState('');
 const [scope,setScope]=useState('all');
 const [category,setCategory]=useState('all');
 const [reportReason,setReportReason]=useState<GovernmentSchemeReportReason>('incorrect_information');
 const [reportNote,setReportNote]=useState('');
 const [reporting,setReporting]=useState(false);

 useEffect(()=>{
  let active=true;setLoading(true);setFailed(false);
  const request=slug?fetchPublishedGovernmentSchemeBySlug(slug).then(value=>({scheme:value,schemes:[] as GovernmentSchemeRow[]})):fetchPublishedGovernmentSchemes().then(value=>({scheme:null,schemes:value}));
  request.then(result=>{
   if(!active)return;setScheme(result.scheme);setSchemes(result.schemes);
   if(slug&&!result.scheme)updatePageSeo({title:'Government Scheme Not Found',description:'This government scheme is not currently available.',canonicalPath:'/government-schemes/'+slug,robots:'noindex,follow'});
   else if(result.scheme)updatePageSeo({title:result.scheme.title_en+' — Government Scheme',description:result.scheme.summary_en||result.scheme.benefit_details,canonicalPath:'/government-schemes/'+result.scheme.slug});
   else updatePageSeo({title:'Government Schemes in Sadiqabad — Punjab & Federal',description:'Official-source information about Punjab and Federal government schemes, eligibility, benefits and application links.',canonicalPath:'/government-schemes',robots:result.schemes.length?'index,follow,max-image-preview:large':'noindex,follow'});
  }).catch(()=>{if(active)setFailed(true);}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[slug,retry]);

 const filtered=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase();
  return schemes.filter(item=>{
   if(scope!=='all'&&item.government_scope!==scope)return false;
   if(category!=='all'&&item.category!==category)return false;
   return !term||[item.title_en,item.title_ur,item.summary_en,item.summary_ur,item.benefit_details,item.eligibility_text].filter(Boolean).join(' ').toLocaleLowerCase().includes(term);
  });
 },[schemes,query,scope,category]);

 const sendReport=async(event:React.FormEvent)=>{
  event.preventDefault();if(!scheme)return;setReporting(true);
  try{await submitGovernmentSchemeReport(scheme.id,reportReason,reportNote);setReportNote('');showToast('Thank you. Your correction report has been received.','success');}
  catch(error){showToast(error instanceof Error?error.message:'Report could not be submitted.','error');}
  finally{setReporting(false);}
 };

 return <AppShell><Container size="lg" className="py-6 space-y-5">
  {slug?<Link to="/government-schemes" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="w-4 h-4"/>{lang==='ur'?'تمام اسکیمیں':'All Government Schemes'}</Link>
   :<SectionHeading title={lang==='ur'?'سرکاری اسکیمیں':'Government Schemes'} titleUr="پنجاب اور وفاقی حکومتی پروگرام" subtitle="Official programme information only. Hello Sadiqabad does not accept applications, fees or personal documents." headingLevel="h1"/>}
  {loading?<div className="space-y-3"><Skeleton className="h-44 rounded-2xl"/><Skeleton className="h-28 rounded-2xl"/></div>
   :failed?<EmptyState icon={<BookOpenCheck className="w-6 h-6"/>} title="Government schemes could not be loaded" description="Please check your connection and try again." action={<Button onClick={()=>setRetry(v=>v+1)}>Retry</Button>}/>
   :slug&&!scheme?<EmptyState icon={<BookOpenCheck className="w-6 h-6"/>} title="Government scheme not found" description="This scheme may have been removed or the link may be incorrect." action={<Link to="/government-schemes"><Button>Browse Government Schemes</Button></Link>}/>
   :scheme?<article className="max-w-3xl mx-auto space-y-5">
    <div className="flex flex-wrap gap-2"><Badge variant="secondary">{scopeLabel(scheme.government_scope,lang)}</Badge><Badge variant="secondary">{categoryLabel(scheme.category,lang)}</Badge><Badge variant="secondary">{benefitLabel(scheme.benefit_type,lang)}</Badge></div>
    <div className="space-y-2"><h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">{bilingualText(lang,scheme.title_en,scheme.title_ur)}</h1>{lang==='en'&&urduHints&&scheme.title_ur&&<p dir="rtl" className="font-urdu text-lg text-primary">{scheme.title_ur}</p>}<p className="text-sm text-on-surface-variant">{bilingualText(lang,scheme.summary_en||scheme.benefit_details,scheme.summary_ur)}</p></div>
    <Card className="p-4 space-y-2 border border-amber-500/30"><div className="flex items-center gap-2 font-bold text-on-surface"><ShieldAlert className="w-5 h-5 text-amber-600"/>{intakeLabel(scheme.intake_status,lang)}</div><p className="text-sm text-on-surface-variant">{scheme.intake_status==='open'?'The official source currently confirms an open intake. Recheck the portal before applying.':'The current application window has not been independently confirmed. Do not assume applications are open; check the official programme page before taking action.'}</p></Card>
    <section className="space-y-2"><h2 className="text-lg font-bold">What the programme offers</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{scheme.benefit_details}</p></section>
    <section className="space-y-2"><h2 className="text-lg font-bold">Eligibility</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{scheme.eligibility_text}</p></section>
    {scheme.required_documents.length>0&&<section className="space-y-2"><h2 className="text-lg font-bold">Documents / information to prepare</h2><ul className="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">{scheme.required_documents.map((item,index)=><li key={index}>{item}</li>)}</ul><p className="text-xs text-on-surface-variant">Only submit documents on the official government portal or at the official office. Never send CNIC copies or financial documents to Hello Sadiqabad.</p></section>}
    {scheme.application_steps&&<section className="space-y-2"><h2 className="text-lg font-bold">How to check / apply</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{scheme.application_steps}</p></section>}
    {scheme.fees_and_repayment&&<section className="space-y-2"><h2 className="text-lg font-bold">Fees, loan and repayment details</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{scheme.fees_and_repayment}</p></section>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-surface-container-low p-4 text-sm"><div><span className="block text-xs text-on-surface-variant">Application opening</span><strong>{dateLabel(scheme.application_open_at,lang)}</strong></div><div><span className="block text-xs text-on-surface-variant">Deadline</span><strong>{dateLabel(scheme.deadline_at,lang)}</strong></div><div><span className="block text-xs text-on-surface-variant">Last verified</span><strong>{dateLabel(scheme.verified_at,lang)}</strong></div><div><span className="block text-xs text-on-surface-variant">Next review</span><strong>{dateLabel(scheme.next_review_at,lang)}</strong></div></div>
    <div className="flex flex-wrap gap-3">{scheme.official_apply_url&&<a href={scheme.official_apply_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary">{scheme.intake_status==='open'?'Open official application':'Check official portal'}<ExternalLink className="w-4 h-4"/></a>}{scheme.source_url&&<a href={scheme.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface">Official information source<ExternalLink className="w-4 h-4"/></a>}</div>
    <p className="text-xs text-on-surface-variant">Source: {scheme.source_name}. Always read the original government notice. Hello Sadiqabad is an information directory, not a government department, lender or application agent.</p>
    <Card className="p-4 space-y-3"><h2 className="font-bold">Report outdated or incorrect information</h2><p className="text-xs text-on-surface-variant">Do not include CNIC, phone number, OTP, bank details or private documents.</p><form onSubmit={sendReport} className="space-y-3"><select value={reportReason} onChange={event=>setReportReason(event.target.value as GovernmentSchemeReportReason)} className="h-11 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="incorrect_information">Information appears incorrect</option><option value="broken_official_link">Official link is broken</option><option value="intake_status_changed">Application status has changed</option><option value="other">Other correction</option></select><textarea rows={3} maxLength={500} value={reportNote} onChange={event=>setReportNote(event.target.value)} placeholder="Optional short note (max 500 characters)" className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm"/><div className="flex justify-end"><Button type="submit" disabled={reporting}>{reporting?'Sending…':'Send report'}</Button></div></form></Card>
   </article>
   :<div className="space-y-5">
    <Card className="p-4 space-y-3"><div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-on-surface-variant"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search schemes, eligibility or benefits" className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-10 text-sm"/></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><select value={scope} onChange={event=>setScope(event.target.value)} className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="all">Punjab & Federal</option><option value="punjab">Punjab Government</option><option value="federal">Federal Government</option></select><select value={category} onChange={event=>setCategory(event.target.value)} className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="all">All categories</option>{['housing','business_finance','agriculture','education','social_protection','skills','health','other'].map(item=><option key={item} value={item}>{categoryLabel(item,lang)}</option>)}</select></div></Card>
    {filtered.length===0?<EmptyState icon={<BookOpenCheck className="w-6 h-6"/>} title="No government schemes found" description="Try another search or filter. New verified programme information will appear here when published."/>:<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filtered.map(item=><Card key={item.id} className="p-4 space-y-3"><div className="flex flex-wrap gap-2"><Badge variant="secondary">{scopeLabel(item.government_scope,lang)}</Badge><Badge variant="secondary">{categoryLabel(item.category,lang)}</Badge></div><div><Link to={'/government-schemes/'+item.slug} className="font-bold text-base text-on-surface hover:text-primary">{bilingualText(lang,item.title_en,item.title_ur)}</Link><p className="mt-1 text-xs text-on-surface-variant">{benefitLabel(item.benefit_type,lang)}</p></div><p className="text-sm text-on-surface-variant line-clamp-3">{bilingualText(lang,item.summary_en||item.benefit_details,item.summary_ur)}</p><p className="text-xs font-semibold text-amber-700">{intakeLabel(item.intake_status,lang)}</p><div className="flex justify-between items-center border-t border-outline-variant/40 pt-3"><span className="text-xs text-on-surface-variant inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5"/>Verified {dateLabel(item.verified_at,lang)}</span><Link to={'/government-schemes/'+item.slug} className="text-xs font-bold text-primary">Details →</Link></div></Card>)}</div>}
    <p className="text-xs text-on-surface-variant">Schemes are grouped by the responsible government. Loans are not grants. Always confirm current intake, fees and eligibility on the official source.</p>
   </div>}
 </Container></AppShell>;
}
