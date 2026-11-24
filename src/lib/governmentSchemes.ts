import { getSupabaseClient } from './supabase';
import { getActiveOfflineDirectorySnapshot } from './offlineDirectory';
import { isSafeGovernmentJobUrl } from './governmentJobs';
import type { GovernmentSchemeRow, GovernmentSchemeReportRow, GovernmentSchemeRevisionRow } from '../types/database';

const nowIso=()=>new Date().toISOString();

export async function fetchPublishedGovernmentSchemes():Promise<GovernmentSchemeRow[]>{
 if (typeof navigator !== 'undefined' && !navigator.onLine) {
  const snapshot=await getActiveOfflineDirectorySnapshot();
  return (snapshot?.public_content?.government_schemes ?? []) as unknown as GovernmentSchemeRow[];
 }
 const client=getSupabaseClient();if(!client)return [];
 const {data,error}=await client.from('government_schemes').select('*')
  .eq('status','published').not('published_at','is',null).lte('published_at',nowIso())
  .order('government_scope',{ascending:true}).order('category',{ascending:true}).order('updated_at',{ascending:false});
 if(error)throw error;return (data??[]) as GovernmentSchemeRow[];
}

export async function fetchPublishedGovernmentSchemeBySlug(slug:string):Promise<GovernmentSchemeRow|null>{
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 if (typeof navigator !== 'undefined' && !navigator.onLine) {
  const snapshot=await getActiveOfflineDirectorySnapshot();
  return ((snapshot?.public_content?.government_schemes ?? []) as unknown as GovernmentSchemeRow[]).find((scheme)=>scheme.slug===slug) ?? null;
 }
 const client=getSupabaseClient();if(!client)return null;
 const {data,error}=await client.from('government_schemes').select('*').eq('slug',slug).eq('status','published')
  .not('published_at','is',null).lte('published_at',nowIso()).maybeSingle();
 if(error)throw error;return (data as GovernmentSchemeRow|null)??null;
}

export async function fetchAllGovernmentSchemesAdmin():Promise<GovernmentSchemeRow[]>{
 const client=getSupabaseClient();if(!client)throw new Error('Government Schemes management requires the connected database.');
 const {data,error}=await client.from('government_schemes').select('*').order('updated_at',{ascending:false}).limit(500);
 if(error)throw error;return (data??[]) as GovernmentSchemeRow[];
}


export async function fetchGovernmentSchemeRevisions(schemeId:string):Promise<GovernmentSchemeRevisionRow[]>{
 const client=getSupabaseClient();if(!client)throw new Error('Government Schemes history requires the connected database.');
 const {data,error}=await client.from('government_scheme_revisions').select('*').eq('scheme_id',schemeId).order('changed_at',{ascending:false}).limit(25);
 if(error)throw error;return (data??[]) as GovernmentSchemeRevisionRow[];
}

export async function fetchGovernmentSchemeReports():Promise<GovernmentSchemeReportRow[]>{
 const client=getSupabaseClient();if(!client)throw new Error('Government Schemes reports require the connected database.');
 const {data,error}=await client.from('government_scheme_reports').select('*,scheme:government_schemes(title_en,slug)')
  .is('reviewed_at',null).order('created_at',{ascending:false}).limit(200);
 if(error)throw error;return (data??[]) as GovernmentSchemeReportRow[];
}

export async function upsertGovernmentScheme(
 scheme:Partial<GovernmentSchemeRow>&Pick<GovernmentSchemeRow,'slug'|'title_en'|'government_scope'|'category'|'benefit_type'|'benefit_details'|'eligibility_text'>,
 actorId:string,
):Promise<GovernmentSchemeRow>{
 const slug=scheme.slug.trim().toLowerCase();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Scheme slug must use lowercase letters, numbers and hyphens.');
 if(scheme.title_en.trim().length<3||scheme.title_en.trim().length>180)throw new Error('Scheme title must contain 3–180 characters.');
 if(scheme.summary_en&&scheme.summary_en.length>800)throw new Error('English summary must be 800 characters or fewer.');
 if(scheme.summary_ur&&scheme.summary_ur.length>800)throw new Error('Urdu summary must be 800 characters or fewer.');
 if(scheme.application_open_at&&scheme.deadline_at&&scheme.application_open_at>scheme.deadline_at)throw new Error('Application opening date cannot be after the deadline.');
 for(const [label,value] of [['official source URL',scheme.source_url],['official source document URL',scheme.source_document_url],['official application URL',scheme.official_apply_url]] as const){
  if(value&&!isSafeGovernmentJobUrl(value))throw new Error(label+' must be a valid HTTPS URL and cannot be a shortened link.');
 }
 const status=scheme.status??'draft';
 if(status==='published'){
  if(scheme.intake_status==='open'&&(!scheme.official_apply_url||!scheme.next_review_at))throw new Error('An open intake requires an official application URL and a next review date.');
  if(!scheme.summary_en?.trim()||scheme.summary_en.trim().length<20)throw new Error('Publishing requires an English summary of at least 20 characters.');
  if(!scheme.source_name?.trim()||!scheme.source_url?.trim()||!scheme.verified_at)throw new Error('Publishing requires an official source name, source URL and verified timestamp.');
 }
 const client=getSupabaseClient();if(!client)throw new Error('Government Schemes management requires the connected database.');
 const payload={...scheme,slug,title_en:scheme.title_en.trim(),title_ur:scheme.title_ur?.trim()||null,
  summary_en:scheme.summary_en?.trim()||null,summary_ur:scheme.summary_ur?.trim()||null,
  benefit_details:scheme.benefit_details.trim(),eligibility_text:scheme.eligibility_text.trim(),
  required_documents:(scheme.required_documents??[]).map(value=>value.trim()).filter(Boolean),
  application_steps:scheme.application_steps?.trim()||null,fees_and_repayment:scheme.fees_and_repayment?.trim()||null,
  source_name:scheme.source_name?.trim()||null,source_url:scheme.source_url?.trim()||null,
  source_document_url:scheme.source_document_url?.trim()||null,official_apply_url:scheme.official_apply_url?.trim()||null,
  status,published_at:status==='draft'?null:(scheme.published_at??nowIso()),
  published_by:status==='published'?(scheme.published_by??actorId):(scheme.published_by??null),
  created_by:scheme.created_by??actorId,updated_by:actorId,updated_at:nowIso()};
 const {data,error}=await client.from('government_schemes').upsert(payload).select('*').single();
 if(error)throw error;return data as GovernmentSchemeRow;
}

export async function submitGovernmentSchemeReport(schemeId:string,reason:GovernmentSchemeReportRow['reason']):Promise<void>{
 const client=getSupabaseClient();if(!client)throw new Error('Reporting requires an internet connection.');
 const {error}=await client.from('government_scheme_reports').insert({scheme_id:schemeId,reason});
 if(error&&error.code==='23505')throw new Error('A similar report for this scheme was already received in the current hour. Please try later.');
 if(error)throw error;
}

export async function markGovernmentSchemeReportReviewed(id:string,actorId:string,note:string):Promise<void>{
 const client=getSupabaseClient();if(!client)throw new Error('Government Schemes management requires the connected database.');
 const {error}=await client.from('government_scheme_reports').update({reviewed_at:nowIso(),reviewed_by:actorId,review_note:note.trim()||null}).eq('id',id);
 if(error)throw error;
}
