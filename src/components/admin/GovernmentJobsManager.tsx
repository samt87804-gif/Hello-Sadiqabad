import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Clock3, Copy, ExternalLink, Pencil, Plus, RefreshCw, Save, X } from 'lucide-react';
import { fetchAllGovernmentJobsAdmin, upsertGovernmentJob } from '../../lib/api';
import { getGovernmentJobDisplayStatus, getPakistanToday, slugifyGovernmentJobTitle } from '../../lib/governmentJobs';
import type { GovernmentJobRow } from '../../types/database';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { getSupabaseClient } from '../../lib/supabase';

type FormState = {
 id:string; title_en:string; title_ur:string; summary_en:string; summary_ur:string; slug:string; department_name:string; department_scope:string; job_type:string;
 scale_or_grade:string; vacancy_count:string; location_text:string; districts:string; sadiqabad_relevance:string;
 qualification_text:string; experience_text:string; age_text:string; domicile_text:string; gender_or_quota_text:string;
 other_eligibility_text:string; application_steps:string; application_fee_text:string; apply_url:string;
 advertisement_url:string; official_case_number:string; application_open_at:string; deadline_at:string; status:string;
 source_name:string; source_url:string; source_document_url:string; image_url:string; verified_date:string; next_review_date:string;
 source_verified:boolean; published_at:string|null; created_by:string|null;
};
function blankForm():FormState {
 return {id:'',title_en:'',title_ur:'',summary_en:'',summary_ur:'',slug:'',department_name:'',department_scope:'punjab',job_type:'regular',scale_or_grade:'',
  vacancy_count:'',location_text:'',districts:'',sadiqabad_relevance:'unknown',qualification_text:'',experience_text:'',age_text:'',
  domicile_text:'',gender_or_quota_text:'',other_eligibility_text:'',application_steps:'',application_fee_text:'',apply_url:'',
  advertisement_url:'',official_case_number:'',application_open_at:'',deadline_at:'',status:'draft',source_name:'',source_url:'',
  source_document_url:'',image_url:'',verified_date:'',next_review_date:'',source_verified:false,published_at:null,created_by:null};
}
function toForm(job:GovernmentJobRow):FormState {
 return {...blankForm(),id:job.id,title_en:job.title_en,title_ur:job.title_ur??'',summary_en:job.summary_en??'',summary_ur:job.summary_ur??'',slug:job.slug,department_name:job.department_name,
  department_scope:job.department_scope,job_type:job.job_type,scale_or_grade:job.scale_or_grade??'',
  vacancy_count:job.vacancy_count===null?'':String(job.vacancy_count),location_text:job.location_text,districts:(job.districts??[]).join(', '),
  sadiqabad_relevance:job.sadiqabad_relevance===true?'yes':job.sadiqabad_relevance===false?'no':'unknown',
  qualification_text:job.qualification_text,experience_text:job.experience_text??'',age_text:job.age_text??'',domicile_text:job.domicile_text??'',
  gender_or_quota_text:job.gender_or_quota_text??'',other_eligibility_text:job.other_eligibility_text??'',application_steps:job.application_steps??'',
  application_fee_text:job.application_fee_text??'',apply_url:job.apply_url??'',advertisement_url:job.advertisement_url??'',
  official_case_number:job.official_case_number??'',application_open_at:job.application_open_at??'',deadline_at:job.deadline_at??'',
  status:job.status,source_name:job.source_name??'',source_url:job.source_url??'',source_document_url:job.source_document_url??'',image_url:job.image_url??'',
  verified_date:job.verified_at?job.verified_at.slice(0,10):'',next_review_date:job.next_review_at?job.next_review_at.slice(0,10):'',
  source_verified:Boolean(job.verified_at),published_at:job.published_at,created_by:job.created_by};
}
function Field({label,value,onChange,type='text',required=false}:{label:string;value:string;onChange:(value:string)=>void;type?:string;required?:boolean}) {
 return <label className="block min-w-0 space-y-1"><span className="text-xs font-semibold text-on-surface">{label}{required?' *':''}</span>
  <input type={type} required={required} value={value} onChange={event=>onChange(event.target.value)}
   className="h-10 w-full min-w-0 rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary"/></label>;
}
function TextAreaField({label,value,onChange,required=false}:{label:string;value:string;onChange:(value:string)=>void;required?:boolean}) {
 return <label className="block min-w-0 space-y-1"><span className="text-xs font-semibold text-on-surface">{label}{required?' *':''}</span>
  <textarea required={required} rows={3} value={value} onChange={event=>onChange(event.target.value)}
   className="w-full min-w-0 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary"/></label>;
}

export function GovernmentJobsManager({actorId}:{actorId:string}) {
 const {showToast}=useToast();
 const [jobs,setJobs]=useState<GovernmentJobRow[]>([]);
 const [form,setForm]=useState<FormState>(blankForm());
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [imageUploading,setImageUploading]=useState(false);
 const [showForm,setShowForm]=useState(false);
 const [query,setQuery]=useState('');
 const [reviewOnly,setReviewOnly]=useState(false);
 const reload=async()=>{
  setLoading(true);
  try{setJobs(await fetchAllGovernmentJobsAdmin());}
  catch(error){showToast(error instanceof Error?error.message:'Government jobs could not be loaded.','error');}
  finally{setLoading(false);}
 };
 useEffect(()=>{void reload();},[]);
 const filtered=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase();
  return jobs.filter(job=>{
   if(reviewOnly&&(!job.next_review_at||Date.parse(job.next_review_at)>Date.now()))return false;
   return !term||[job.title_en,job.department_name,job.location_text,job.slug,job.official_case_number].filter(Boolean).join(' ').toLocaleLowerCase().includes(term);
  });
 },[jobs,query,reviewOnly]);
 const update=(key:keyof FormState,value:string|boolean)=>setForm(previous=>({...previous,[key]:value}));
 const startNew=()=>{setForm(blankForm());setShowForm(true);};
 const edit=(job:GovernmentJobRow)=>{setForm(toForm(job));setShowForm(true);};
 const duplicate=(job:GovernmentJobRow)=>{
  const copy=toForm(job);copy.id='';copy.slug=job.slug+'-copy';copy.status='draft';copy.source_verified=false;
  copy.verified_date='';copy.published_at=null;copy.created_by=null;setForm(copy);setShowForm(true);
 };
 const uploadJobImage=async(file:File|null)=>{
  if(!file)return;
  const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
  const extension=extensions[file.type];
  if(!extension){showToast('Upload a JPG, PNG, WebP or AVIF image.','error');return;}
  if(file.size>5*1024*1024){showToast('Job poster must be 5 MB or smaller.','error');return;}
  const client=getSupabaseClient();
  if(!client){showToast('Image upload requires the live database.','error');return;}
  setImageUploading(true);
  try{
   const path='government-jobs/'+actorId+'/'+crypto.randomUUID()+'.'+extension;
   const {data,error}=await client.storage.from('Hello Sadiqabad').upload(path,file,{cacheControl:'3600',contentType:file.type,upsert:false});
   if(error)throw error;
   const {data:publicData}=client.storage.from('Hello Sadiqabad').getPublicUrl(data.path);
   update('image_url',publicData.publicUrl);
   showToast('Job image uploaded. Save the job to keep the image linked.','success');
  }catch(error){showToast(error instanceof Error?error.message:'Job image could not be uploaded.','error');}
  finally{setImageUploading(false);}
 };
 const save=async(event:React.FormEvent)=>{
  event.preventDefault();setSaving(true);
  try{
   const verifiedAt=form.source_verified&&form.verified_date?new Date(form.verified_date+'T12:00:00+05:00').toISOString():null;
   const nextReviewAt=form.next_review_date?new Date(form.next_review_date+'T12:00:00+05:00').toISOString():null;
   await upsertGovernmentJob({
    ...(form.id?{id:form.id}:{}),slug:form.slug.trim()||slugifyGovernmentJobTitle(form.title_en),title_en:form.title_en.trim(),
    title_ur:form.title_ur.trim()||null,summary_en:form.summary_en.trim()||null,summary_ur:form.summary_ur.trim()||null,department_name:form.department_name.trim(),
    department_scope:form.department_scope as GovernmentJobRow['department_scope'],job_type:form.job_type as GovernmentJobRow['job_type'],
    scale_or_grade:form.scale_or_grade.trim()||null,vacancy_count:form.vacancy_count.trim()?Number(form.vacancy_count):null,
    location_text:form.location_text.trim(),districts:form.districts.split(',').map(value=>value.trim()).filter(Boolean),
    sadiqabad_relevance:form.sadiqabad_relevance==='yes'?true:form.sadiqabad_relevance==='no'?false:null,
    qualification_text:form.qualification_text.trim(),experience_text:form.experience_text.trim()||null,age_text:form.age_text.trim()||null,
    domicile_text:form.domicile_text.trim()||null,gender_or_quota_text:form.gender_or_quota_text.trim()||null,
    other_eligibility_text:form.other_eligibility_text.trim()||null,application_steps:form.application_steps.trim()||null,
    application_fee_text:form.application_fee_text.trim()||null,apply_url:form.apply_url.trim()||null,
    advertisement_url:form.advertisement_url.trim()||null,official_case_number:form.official_case_number.trim()||null,
    application_open_at:form.application_open_at||null,deadline_at:form.deadline_at||null,status:form.status as GovernmentJobRow['status'],
    source_name:form.source_name.trim()||null,source_url:form.source_url.trim()||null,
    source_document_url:form.source_document_url.trim()||null,image_url:form.image_url.trim()||null,verified_at:verifiedAt,next_review_at:nextReviewAt,
    published_at:form.status==='draft'?null:(form.published_at??undefined),created_by:form.created_by??actorId,
   },actorId);
   showToast(form.status==='published'?'Government job published.':'Government job saved.','success');
   setShowForm(false);setForm(blankForm());await reload();
  }catch(error){showToast(error instanceof Error?error.message:'Government job could not be saved.','error');}
  finally{setSaving(false);}
 };
 const changeStatus=async(job:GovernmentJobRow,status:GovernmentJobRow['status'])=>{
  try{await upsertGovernmentJob({...job,status,updated_by:actorId},actorId);showToast('Job status updated.','success');await reload();}
  catch(error){showToast(error instanceof Error?error.message:'Job status could not be updated.','error');}
 };
 const today=getPakistanToday();
 return <div className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold flex items-center gap-2"><BriefcaseBusiness className="w-5 h-5 text-primary"/>Government Jobs Manager</h2>
   <p className="mt-1 text-xs text-on-surface-variant">Create drafts, verify official advertisements, publish and maintain job status. Every change is audited.</p></div>
   <Button onClick={startNew} leftIcon={<Plus className="w-4 h-4"/>}>Add Government Job</Button></div>
  {showForm&&<Card className="p-4 sm:p-5 space-y-4">
   <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{form.id?'Edit Government Job':'New Government Job Draft'}</h3>
    <Button size="sm" variant="outline" onClick={()=>setShowForm(false)} leftIcon={<X className="w-4 h-4"/>}>Close</Button></div>
   {jobs.some(existing=>existing.id!==form.id&&((form.official_case_number.trim()&&existing.official_case_number?.trim().toLowerCase()===form.official_case_number.trim().toLowerCase())||(form.title_en.trim().length>4&&existing.title_en.trim().toLowerCase()===form.title_en.trim().toLowerCase()&&existing.department_name.trim().toLowerCase()===form.department_name.trim().toLowerCase())))&&<p role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-on-surface">Possible duplicate: another record has the same advertisement number or matching title and department. Check the existing record before publishing.</p>}
   <form onSubmit={save} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
     <Field label="Job title (English)" value={form.title_en} required onChange={value=>setForm(previous=>({...previous,title_en:value,slug:previous.slug||slugifyGovernmentJobTitle(value)}))}/>
     <Field label="Job title (Urdu, optional)" value={form.title_ur} onChange={value=>update('title_ur',value)}/>
     <TextAreaField label="English summary (required before publish)" value={form.summary_en} onChange={value=>update('summary_en',value)}/>
     <TextAreaField label="Urdu summary (optional)" value={form.summary_ur} onChange={value=>update('summary_ur',value)}/>
     <Field label="URL slug" value={form.slug} required onChange={value=>update('slug',value.toLowerCase())}/>
     <Field label="Department / authority" value={form.department_name} required onChange={value=>update('department_name',value)}/>
     <label className="block space-y-1"><span className="text-xs font-semibold">Government level *</span><select value={form.department_scope} onChange={event=>update('department_scope',event.target.value)} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="punjab">Punjab Government</option><option value="federal">Federal Government</option><option value="other">Other (verified local relevance only)</option></select></label>
     <label className="block space-y-1"><span className="text-xs font-semibold">Job type *</span><select value={form.job_type} onChange={event=>update('job_type',event.target.value)} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="regular">Regular</option><option value="contract">Contract</option><option value="project">Project</option><option value="internship">Internship</option><option value="temporary">Temporary</option><option value="other">Other</option></select></label>
     <Field label="Scale / grade" value={form.scale_or_grade} onChange={value=>update('scale_or_grade',value)}/>
     <Field label="Vacancies" value={form.vacancy_count} type="number" onChange={value=>update('vacancy_count',value)}/>
     <Field label="Work location" value={form.location_text} required onChange={value=>update('location_text',value)}/>
     <Field label="Districts (comma separated)" value={form.districts} onChange={value=>update('districts',value)}/>
     <label className="block space-y-1"><span className="text-xs font-semibold">Sadiqabad / RYK eligibility</span><select value={form.sadiqabad_relevance} onChange={event=>update('sadiqabad_relevance',event.target.value)} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="unknown">Not confirmed</option><option value="yes">Yes — advertisement confirms</option><option value="no">No — advertisement excludes</option></select></label>
     <Field label="Application opens" value={form.application_open_at} type="date" onChange={value=>update('application_open_at',value)}/>
     <Field label="Closing date" value={form.deadline_at} type="date" onChange={value=>update('deadline_at',value)}/>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
     <TextAreaField label="Minimum qualification" value={form.qualification_text} required onChange={value=>update('qualification_text',value)}/>
     <TextAreaField label="Experience" value={form.experience_text} onChange={value=>update('experience_text',value)}/>
     <TextAreaField label="Age / relaxation" value={form.age_text} onChange={value=>update('age_text',value)}/>
     <TextAreaField label="Domicile requirements" value={form.domicile_text} onChange={value=>update('domicile_text',value)}/>
     <TextAreaField label="Gender / quota" value={form.gender_or_quota_text} onChange={value=>update('gender_or_quota_text',value)}/>
     <TextAreaField label="Other eligibility conditions" value={form.other_eligibility_text} onChange={value=>update('other_eligibility_text',value)}/>
     <TextAreaField label="Application steps" value={form.application_steps} onChange={value=>update('application_steps',value)}/>
     <TextAreaField label="Application fee / payment instructions" value={form.application_fee_text} onChange={value=>update('application_fee_text',value)}/>
    </div>
    <div className="space-y-3 rounded-xl border border-outline-variant/40 p-3">
     <h4 className="text-sm font-bold">Job poster / image (optional)</h4>
     <p className="text-xs text-on-surface-variant">Upload a JPG, PNG, WebP or AVIF image (maximum 5 MB). You can save without an image and add one later.</p>
     <label className="block space-y-1"><span className="text-xs font-semibold">Choose job poster</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={imageUploading} onChange={event=>{void uploadJobImage(event.target.files?.[0]??null);event.currentTarget.value="";}} className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-on-primary"/></label>
     {imageUploading&&<p className="text-xs text-on-surface-variant">Uploading image…</p>}
     {form.image_url&&<div className="flex flex-wrap items-center gap-3"><img src={form.image_url} alt="Job poster preview" className="h-28 w-40 rounded-xl border border-outline-variant object-contain bg-surface"/><div className="space-y-2"><p className="text-xs text-on-surface-variant break-all">Image uploaded. Save this job to link it.</p><Button type="button" size="sm" variant="outline" onClick={()=>update("image_url","")}>Remove image</Button></div></div>}
    </div>
    <div className="space-y-3 rounded-xl border border-outline-variant/40 p-3"><h4 className="text-sm font-bold">Official source verification</h4>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Source / department name" value={form.source_name} onChange={value=>update('source_name',value)}/>
      <Field label="Official source page URL (HTTPS)" value={form.source_url} onChange={value=>update('source_url',value)}/>
      <Field label="Official advertisement URL (HTTPS)" value={form.advertisement_url} onChange={value=>update('advertisement_url',value)}/>
      <Field label="Official source document URL (HTTPS)" value={form.source_document_url} onChange={value=>update('source_document_url',value)}/>
      <Field label="Official application URL (HTTPS)" value={form.apply_url} onChange={value=>update('apply_url',value)}/>
      <Field label="Case / advertisement number" value={form.official_case_number} onChange={value=>update('official_case_number',value)}/>
      <Field label="Verified date" value={form.verified_date} type="date" onChange={value=>update('verified_date',value)}/>
      <Field label="Next review date" value={form.next_review_date} type="date" onChange={value=>update('next_review_date',value)}/>
     </div>
     <label className="flex items-start gap-2 text-xs text-on-surface-variant"><input type="checkbox" checked={form.source_verified} onChange={event=>update('source_verified',event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary"/>
      <span>I personally checked that the source is an official government/department channel and rechecked the eligibility and deadline against the original advertisement. Required before publishing.</span></label>
     <p className="text-[11px] text-on-surface-variant">Do not use shortened URLs. Hello Sadiqabad stores links only; unpublished PDFs are not uploaded to the public Storage bucket.</p>
    </div>
    <label className="block space-y-1"><span className="text-xs font-semibold">Editorial status</span><select value={form.status} onChange={event=>update('status',event.target.value)} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm"><option value="draft">Draft (Admin only)</option><option value="published">Published (public)</option><option value="closed">Closed (archive)</option><option value="expired">Expired (archive)</option><option value="cancelled">Cancelled (hidden)</option></select></label>
    <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/40 pt-3"><Button type="button" variant="outline" onClick={()=>setShowForm(false)}>Cancel</Button><Button type="submit" disabled={saving||imageUploading} leftIcon={<Save className="w-4 h-4"/>}>{saving?'Saving…':form.status==='published'?'Save & Publish':'Save Draft / Status'}</Button></div>
   </form>
  </Card>}
  <div className="flex flex-wrap items-center gap-2"><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search jobs, department, location or case number" className="h-10 min-w-[220px] flex-1 rounded-xl border border-outline-variant bg-surface px-3 text-sm"/>
   <Button size="sm" variant={reviewOnly?'primary':'outline'} onClick={()=>setReviewOnly(value=>!value)} leftIcon={<Clock3 className="w-3.5 h-3.5"/>}>Needs re-verification</Button>
   <Button size="sm" variant="outline" onClick={()=>void reload()} leftIcon={<RefreshCw className="w-3.5 h-3.5"/>}>Refresh</Button></div>
  {loading?<Card className="p-6 text-sm text-on-surface-variant">Loading government jobs…</Card>:filtered.length===0?<Card className="p-6 text-sm text-on-surface-variant">No government job records match this view. Add a draft to get started.</Card>:
   <div className="space-y-3">{filtered.map(job=>{
    const status=job.status==='draft'?'Draft':getGovernmentJobDisplayStatus(job);
    const needsReview=Boolean(job.next_review_at&&Date.parse(job.next_review_at)<=Date.now());
    return <Card key={job.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div className="min-w-0 space-y-1">
     <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-sm text-on-surface">{job.title_en}</h3><Badge variant={job.status==='draft'?'secondary':needsReview?'warning':'primary'}>{String(status).replace('_',' ')}</Badge>{needsReview&&<Badge variant="warning">Re-verify</Badge>}</div>
     <p className="text-xs text-on-surface-variant">{job.department_name} · {job.department_scope} · {job.location_text}</p>
     <p className="text-xs text-on-surface-variant">Closing: {job.deadline_at||'Not set'} · Verified: {job.verified_at?job.verified_at.slice(0,10):'Not verified'} · Updated: {job.updated_at.slice(0,10)}</p>
     {job.source_url&&<a href={job.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-primary underline break-all">Official source <ExternalLink className="inline w-3 h-3"/></a>}
    </div><div className="flex flex-wrap items-center gap-2 shrink-0">
     <Button size="sm" variant="outline" onClick={()=>edit(job)} leftIcon={<Pencil className="w-3.5 h-3.5"/>}>Edit</Button>
     <Button size="sm" variant="outline" onClick={()=>duplicate(job)} leftIcon={<Copy className="w-3.5 h-3.5"/>}>Duplicate</Button>
     {job.status==='draft'&&<Button size="sm" onClick={()=>edit({...job,status:'published'})}>Review & Publish</Button>}
     {job.status==='published'&&<Button size="sm" variant="outline" onClick={()=>void changeStatus(job,'closed')}>Close</Button>}
     {job.status!=='cancelled'&&job.status!=='draft'&&<Button size="sm" variant="outline" onClick={()=>void changeStatus(job,'cancelled')}>Cancel listing</Button>}
    </div></Card>;
   })}</div>}
  <p className="text-[11px] text-on-surface-variant">Pakistan date today: {today}. Closing Soon is derived from the deadline; date-only deadlines remain open through the end of that day in Pakistan time. Cancelled records are hidden from public pages.</p>
 </div>;
}
