import React,{useEffect,useMemo,useState} from 'react';
import {Clock3,ExternalLink,Plus,RefreshCw,Save,ShieldAlert} from 'lucide-react';
import {fetchAllGovernmentSchemesAdmin,fetchGovernmentSchemeReports,markGovernmentSchemeReportReviewed,upsertGovernmentScheme} from '../../lib/governmentSchemes';
import type {GovernmentSchemeRow,GovernmentSchemeReportRow} from '../../types/database';
import {Badge,Card} from '../ui/Surface';
import {Button} from '../ui/Button';
import {useToast} from '../ui/Toast';

type FormState={
 id:string;slug:string;title_en:string;title_ur:string;summary_en:string;summary_ur:string;government_scope:string;category:string;benefit_type:string;
 benefit_details:string;eligibility_text:string;required_documents:string;application_steps:string;fees_and_repayment:string;
 official_apply_url:string;source_name:string;source_url:string;source_document_url:string;intake_status:string;
 application_open_at:string;deadline_at:string;status:string;verified_date:string;next_review_date:string;published_at:string|null;created_by:string|null;
};
function blank():FormState{return {id:'',slug:'',title_en:'',title_ur:'',summary_en:'',summary_ur:'',government_scope:'punjab',category:'other',benefit_type:'other',
 benefit_details:'',eligibility_text:'',required_documents:'',application_steps:'',fees_and_repayment:'',official_apply_url:'',source_name:'',source_url:'',
 source_document_url:'',intake_status:'unconfirmed',application_open_at:'',deadline_at:'',status:'draft',verified_date:'',next_review_date:'',published_at:null,created_by:null};}
function toForm(row:GovernmentSchemeRow):FormState{return {...blank(),id:row.id,slug:row.slug,title_en:row.title_en,title_ur:row.title_ur??'',summary_en:row.summary_en??'',summary_ur:row.summary_ur??'',
 government_scope:row.government_scope,category:row.category,benefit_type:row.benefit_type,benefit_details:row.benefit_details,eligibility_text:row.eligibility_text,
 required_documents:(row.required_documents??[]).join('\n'),application_steps:row.application_steps??'',fees_and_repayment:row.fees_and_repayment??'',
 official_apply_url:row.official_apply_url??'',source_name:row.source_name??'',source_url:row.source_url??'',source_document_url:row.source_document_url??'',
 intake_status:row.intake_status,application_open_at:row.application_open_at??'',deadline_at:row.deadline_at??'',status:row.status,
 verified_date:row.verified_at?row.verified_at.slice(0,10):'',next_review_date:row.next_review_at?row.next_review_at.slice(0,10):'',published_at:row.published_at,created_by:row.created_by};}
function Field({label,value,onChange,type='text',required=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label className="block min-w-0 space-y-1"><span className="text-xs font-semibold">{label}{required?' *':''}</span><input type={type} required={required} value={value} onChange={e=>onChange(e.target.value)} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm"/></label>;}
function Area({label,value,onChange,required=false}:{label:string;value:string;onChange:(v:string)=>void;required?:boolean}){return <label className="block min-w-0 space-y-1"><span className="text-xs font-semibold">{label}{required?' *':''}</span><textarea rows={4} required={required} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm"/></label>;}
function Choice({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:Array<[string,string]>}){return <label className="block min-w-0 space-y-1"><span className="text-xs font-semibold">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm">{options.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>;}

const scopeOptions:[string,string][]=[['punjab','Punjab Government'],['federal','Federal Government']];
const categoryOptions:[string,string][]=[['housing','Housing'],['business_finance','Business finance'],['agriculture','Agriculture'],['education','Education'],['social_protection','Social protection'],['skills','Skills & training'],['health','Health'],['other','Other']];
const benefitOptions:[string,string][]=[['grant','Grant'],['loan','Loan / financing'],['cash_transfer','Cash assistance'],['subsidy','Subsidy'],['training','Training'],['housing','Housing support'],['service','Government service'],['other','Other']];
const intakeOptions:[string,string][]=[['unconfirmed','Not confirmed'],['upcoming','Upcoming'],['open','Open — officially verified'],['paused','Paused'],['closed','Closed'],['expired','Expired'],['cancelled','Cancelled']];
const reasonLabel:Record<string,string>={incorrect_information:'Incorrect information',broken_official_link:'Broken official link',intake_status_changed:'Intake status changed',other:'Other'};

export function GovernmentSchemesManager({actorId}:{actorId:string}){
 const {showToast}=useToast();
 const [schemes,setSchemes]=useState<GovernmentSchemeRow[]>([]);
 const [reports,setReports]=useState<GovernmentSchemeReportRow[]>([]);
 const [form,setForm]=useState<FormState>(blank());
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [showForm,setShowForm]=useState(false);
 const [query,setQuery]=useState('');
 const [reviewOnly,setReviewOnly]=useState(false);
 const [reviewNote,setReviewNote]=useState<Record<string,string>>({});
 const reload=async()=>{setLoading(true);try{const [s,r]=await Promise.all([fetchAllGovernmentSchemesAdmin(),fetchGovernmentSchemeReports()]);setSchemes(s);setReports(r);}catch(error){showToast(error instanceof Error?error.message:'Government Schemes could not be loaded.','error');}finally{setLoading(false);}};
 useEffect(()=>{void reload();},[]);
 const filtered=useMemo(()=>{const term=query.trim().toLocaleLowerCase();return schemes.filter(s=>{if(reviewOnly&&(!s.next_review_at||Date.parse(s.next_review_at)>Date.now()))return false;return !term||[s.title_en,s.slug,s.source_name,s.government_scope,s.category].filter(Boolean).join(' ').toLocaleLowerCase().includes(term);});},[schemes,query,reviewOnly]);
 const update=(key:keyof FormState,value:string)=>setForm(prev=>({...prev,[key]:value}));
 const edit=(row:GovernmentSchemeRow)=>{setForm(toForm(row));setShowForm(true);};
 const save=async(event:React.FormEvent)=>{event.preventDefault();setSaving(true);try{
  const verifiedAt=form.verified_date?new Date(form.verified_date+'T12:00:00+05:00').toISOString():null;
  const nextReview=form.next_review_date?new Date(form.next_review_date+'T12:00:00+05:00').toISOString():null;
  await upsertGovernmentScheme({id:form.id||undefined,slug:form.slug,title_en:form.title_en,title_ur:form.title_ur||null,summary_en:form.summary_en||null,summary_ur:form.summary_ur||null,
   government_scope:form.government_scope as GovernmentSchemeRow['government_scope'],category:form.category as GovernmentSchemeRow['category'],benefit_type:form.benefit_type as GovernmentSchemeRow['benefit_type'],
   benefit_details:form.benefit_details,eligibility_text:form.eligibility_text,required_documents:form.required_documents.split('\n').map(x=>x.trim()).filter(Boolean),
   application_steps:form.application_steps||null,fees_and_repayment:form.fees_and_repayment||null,official_apply_url:form.official_apply_url||null,
   source_name:form.source_name||null,source_url:form.source_url||null,source_document_url:form.source_document_url||null,
   intake_status:form.intake_status as GovernmentSchemeRow['intake_status'],application_open_at:form.application_open_at||null,deadline_at:form.deadline_at||null,
   status:form.status as GovernmentSchemeRow['status'],verified_at:verifiedAt,next_review_at:nextReview,published_at:form.published_at,created_by:form.created_by},actorId);
  showToast('Government scheme saved.','success');setShowForm(false);setForm(blank());await reload();
 }catch(error){showToast(error instanceof Error?error.message:'Scheme could not be saved.','error');}finally{setSaving(false);}};
 const review=async(report:GovernmentSchemeReportRow)=>{try{await markGovernmentSchemeReportReviewed(report.id,actorId,reviewNote[report.id]||'');showToast('Report marked as reviewed.','success');await reload();}catch(error){showToast(error instanceof Error?error.message:'Report could not be updated.','error');}};
 return <div className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold">Government Schemes</h2><p className="text-sm text-on-surface-variant">Manage Punjab and Federal programme information, verify official sources and review public corrections.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>void reload()} leftIcon={<RefreshCw className="w-4 h-4"/>}>Refresh</Button><Button size="sm" onClick={()=>{setForm(blank());setShowForm(true);}} leftIcon={<Plus className="w-4 h-4"/>}>Add scheme</Button></div></div>
  <Card className="p-4 space-y-2"><div className="flex items-center gap-2 font-bold"><ShieldAlert className="w-5 h-5 text-amber-600"/>Publishing safety</div><p className="text-xs text-on-surface-variant">Only publish when the official source and verification date are recorded. Keep intake “Not confirmed” unless the current application window is independently verified. Never collect CNIC, OTP, bank details or application documents on Hello Sadiqabad.</p></Card>
  {showForm&&<Card className="p-4 space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold">{form.id?'Edit scheme':'New scheme'}</h3><Button size="sm" variant="ghost" onClick={()=>setShowForm(false)}>Close</Button></div>
   <form onSubmit={save} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Field label="English title" value={form.title_en} onChange={v=>update('title_en',v)} required/><Field label="Urdu title" value={form.title_ur} onChange={v=>update('title_ur',v)}/><Field label="URL slug" value={form.slug} onChange={v=>update('slug',v)} required/><Choice label="Government level" value={form.government_scope} onChange={v=>update('government_scope',v)} options={scopeOptions}/><Choice label="Category" value={form.category} onChange={v=>update('category',v)} options={categoryOptions}/><Choice label="Benefit type" value={form.benefit_type} onChange={v=>update('benefit_type',v)} options={benefitOptions}/></div>
    <Area label="English summary (20–800 chars)" value={form.summary_en} onChange={v=>update('summary_en',v)}/><Area label="Urdu summary" value={form.summary_ur} onChange={v=>update('summary_ur',v)}/>
    <Area label="Benefits / financial terms" value={form.benefit_details} onChange={v=>update('benefit_details',v)} required/><Area label="Eligibility criteria" value={form.eligibility_text} onChange={v=>update('eligibility_text',v)} required/>
    <Area label="Documents / information to prepare (one per line)" value={form.required_documents} onChange={v=>update('required_documents',v)}/><Area label="Application steps / official process" value={form.application_steps} onChange={v=>update('application_steps',v)}/><Area label="Fees, markup and repayment details" value={form.fees_and_repayment} onChange={v=>update('fees_and_repayment',v)}/>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Field label="Official source name" value={form.source_name} onChange={v=>update('source_name',v)}/><Field label="Official source URL (HTTPS)" value={form.source_url} onChange={v=>update('source_url',v)}/><Field label="Official source document URL" value={form.source_document_url} onChange={v=>update('source_document_url',v)}/><Field label="Official application portal URL" value={form.official_apply_url} onChange={v=>update('official_apply_url',v)} required={form.intake_status==='open'}/><Choice label="Current intake status" value={form.intake_status} onChange={v=>update('intake_status',v)} options={intakeOptions}/><Choice label="Publication" value={form.status} onChange={v=>update('status',v)} options={ [['draft','Draft — private'],['published','Published — public'],['archived','Archived — private']]}/><Field label="Application opens" type="date" value={form.application_open_at} onChange={v=>update('application_open_at',v)}/><Field label="Application deadline" type="date" value={form.deadline_at} onChange={v=>update('deadline_at',v)}/><Field label="Last verified date" type="date" value={form.verified_date} onChange={v=>update('verified_date',v)}/><Field label="Next review date" type="date" value={form.next_review_date} onChange={v=>update('next_review_date',v)} required={form.intake_status==='open'}/></div>
    <div className="flex justify-end"><Button type="submit" disabled={saving} leftIcon={<Save className="w-4 h-4"/>}>{saving?'Saving…':'Save scheme'}</Button></div>
   </form>
  </Card>}
  <Card className="p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Scheme records ({schemes.length})</h3><div className="flex flex-wrap gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search schemes" className="h-9 max-w-xs rounded-xl border border-outline-variant bg-surface px-3 text-sm"/><Button size="sm" variant={reviewOnly?"primary":"outline"} onClick={()=>setReviewOnly(v=>!v)} leftIcon={<Clock3 className="w-4 h-4"/>}>Needs re-verification</Button></div></div>
   {loading?<p className="text-sm text-on-surface-variant">Loading schemes…</p>:filtered.length===0?<p className="text-sm text-on-surface-variant">No schemes match this search.</p>:<div className="space-y-2">{filtered.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/50 p-3"><div className="min-w-0"><p className="font-semibold">{row.title_en}</p><p className="text-xs text-on-surface-variant">{row.government_scope.toUpperCase()} · {row.category} · {row.intake_status} · {row.status}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>edit(row)}>Edit</Button><a href={'/government-schemes/'+row.slug} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Preview <ExternalLink className="w-3 h-3"/></a></div></div>)}</div>}
  </Card>
  <Card className="p-4 space-y-3"><div className="flex items-center justify-between"><h3 className="font-bold">Public correction reports ({reports.length})</h3><Badge variant={reports.length?'warning':'secondary'}>{reports.length} pending</Badge></div>
   {reports.length===0?<p className="text-sm text-on-surface-variant">No pending reports.</p>:reports.map(report=><div key={report.id} className="space-y-2 border-t border-outline-variant/50 pt-3"><div><p className="font-semibold text-sm">{report.scheme?.title_en||'Government scheme'} — {reasonLabel[report.reason]||report.reason}</p><p className="text-xs text-on-surface-variant">{new Date(report.created_at).toLocaleString('en-PK',{timeZone:'Asia/Karachi'})}</p>{report.note&&<p className="mt-1 text-sm">{report.note}</p>}</div><div className="flex flex-col sm:flex-row gap-2"><input value={reviewNote[report.id]||''} onChange={e=>setReviewNote(prev=>({...prev,[report.id]:e.target.value}))} maxLength={500} placeholder="Internal review note (optional)" className="h-9 flex-1 rounded-xl border border-outline-variant bg-surface px-3 text-sm"/><Button size="sm" onClick={()=>void review(report)} leftIcon={<Clock3 className="w-4 h-4"/>}>Mark reviewed</Button></div></div>)}
  </Card>
 </div>;
}
