import { getSupabaseClient } from './supabase';

export interface SdkJobPublic {
  slug: string;
  title_en: string;
  title_ur: string | null;
  summary_en: string;
  summary_ur: string | null;
  description_en: string;
  description_ur: string | null;
  job_category: string;
  vacancy_count: number;
  job_type: string;
  area_name_en: string | null;
  area_name_ur: string | null;
  work_location_en: string | null;
  work_location_ur: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_disclosed: boolean;
  duties_en: string | null;
  duties_ur: string | null;
  qualifications_en: string | null;
  qualifications_ur: string | null;
  experience_en: string | null;
  experience_ur: string | null;
  working_hours_en: string | null;
  working_hours_ur: string | null;
  benefits_en: string | null;
  benefits_ur: string | null;
  closing_date: string | null;
  image_url: string | null;
  published_at: string;
}

export async function fetchPublishedSdkJobs(): Promise<SdkJobPublic[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('SDK Jobs are temporarily unavailable.');
  const { data, error } = await client.from('sdk_jobs_public').select('*').order('published_at', { ascending: false }).limit(500);
  if (error) throw error;
  return (data ?? []) as SdkJobPublic[];
}

export async function fetchPublishedSdkJobBySlug(slug: string): Promise<SdkJobPublic | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error('SDK Jobs are temporarily unavailable.');
  const { data, error } = await client.from('sdk_jobs_public').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return (data ?? null) as SdkJobPublic | null;
}
