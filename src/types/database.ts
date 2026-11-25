export type UserRole = 'super_admin' | 'staff' | 'owner';

export type StaffType =
  | 'data_entry'
  | 'importer'
  | 'sales_onboarding'
  | 'listing_manager'
  | 'moderator'
  | 'support';

export type PermissionKey =
  | 'business.create'
  | 'business.edit_own'
  | 'business.publish'
  | 'import.run'
  | 'leads.manage'
  | 'owners.create'
  | 'tiers.manage'
  | 'ads.review'
  | 'moderation.review'
  | 'support.read'
  | 'analytics.view'
  | 'announcements.manage'
  | 'settings.manage'
  | 'government_jobs.manage'
  | 'government_schemes.manage';

export type PlanCode = 'free' | 'basic' | 'premium';

export type BusinessStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'rejected'
  | 'suspended'
  | 'archived';

export type EmergencyCategory =
  | 'rescue'
  | 'police'
  | 'fire'
  | 'ambulance'
  | 'hospital'
  | 'utility'
  | 'general'
  | 'government';

export type OfferStatus = 'active' | 'paused' | 'expired';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type InquiryStatus = 'new' | 'read' | 'handled';
export type SubmissionType =
  | 'new_business'
  | 'correction'
  | 'claim'
  | 'phone_suggestion'
  | 'report'
  | 'broken_image'
  | 'plan_upgrade'
  | 'owner_product'
  | 'owner_service'
  | 'owner_offer';
export type SubmissionStatus = 'new' | 'in_review' | 'done' | 'rejected';
export type BusinessEventType =
  | 'view'
  | 'call'
  | 'whatsapp'
  | 'directions'
  | 'share'
  | 'search_appearance';
export type NotificationType =
  | 'inquiry'
  | 'review'
  | 'listing_status'
  | 'plan_expiring'
  | 'claim'
  | 'general';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'paid'
  | 'converted'
  | 'dropped'
  | 'not_interested';
export type AdPlacement =
  | 'homepage_top'
  | 'search_sidebar'
  | 'category_banner'
  | 'popup'
  | 'emergency_banner'
  | 'authorities_banner';
export type AdStatus = 'pending' | 'active' | 'paused' | 'expired' | 'rejected';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface OpeningHourRange {
  open: string; // HH:mm
  close: string; // HH:mm
}

export type TimeRange = OpeningHourRange;

export type OpeningHoursJson = Partial<Record<DayKey, OpeningHourRange[]>> & {
  is_24_7?: boolean;
};

export interface CityRow {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  must_change_password: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OwnerPublicProfileRow {
  owner_id: string;
  display_name: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  is_public: boolean;
  show_name: boolean;
  show_photo: boolean;
  show_phone: boolean;
  show_email: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface StaffMemberRow {
  id: string;
  user_id: string;
  staff_types: StaffType[];
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  parent_id: string | null;
  icon: string;
  color: string;
  sort_order: number;
  synonyms: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AreaRow {
  id: string;
  city_id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  gallery: number;
  max_photos: number;
  videos: number;
  max_videos: number;
  social_links: number;
  offers: number;
  search_priority: number;
}

export interface PlanFeatures {
  whatsapp: boolean;
  cover: boolean;
  gallery: boolean;
  videos: boolean;
  social_links: boolean;
  offers: boolean;
  inquiry: boolean;
  verified_badge: boolean;
  qr: boolean;
  analytics_full: boolean;
}

export interface PlanRow {
  id: string;
  code: PlanCode;
  name_en: string;
  name_ur: string;
  limits: PlanLimits;
  features: PlanFeatures;
  price_note: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessRow {
  id: string;
  city_id: string;
  owner_id: string | null;
  name_en: string;
  name_ur: string | null;
  slug: string;
  category_id: string;
  area_id: string | null;
  address_en: string | null;
  address_ur: string | null;
  map_url: string | null;
  landmark_en: string | null;
  landmark_ur: string | null;
  lat: number | null;
  lng: number | null;
  phone_primary: string;
  phone_secondary: string | null;
  phone_normalized: string;
  whatsapp: string | null;
  email: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  description_en: string | null;
  description_ur: string | null;
  services_en: string[];
  services_ur: string[];
  logo_url: string | null;
  cover_url: string | null;
  owner_name: string | null;
  owner_photo_url: string | null;
  gallery_urls: string[];
  video_urls: string[];
  opening_hours: OpeningHoursJson | null;
  is_open_24h: boolean;
  home_delivery: boolean;
  established_year: number | null;
  status: BusinessStatus;
  rejection_reason: string | null;
  plan_code: PlanCode;
  plan_expires_at: string | null;
  is_verified: boolean;
  is_featured: boolean;
  tags: string[];
  meta_title_en: string | null;
  meta_description_en: string | null;
  rating_avg: number | null;
  rating_count: number;
  view_count: number;
  call_count: number;
  whatsapp_count: number;
  source: string | null;
  created_by: string | null;
  assigned_to: string | null;
  published_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingRow {
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_at?: string;
}

export interface EmergencyContactRow {
  id: string;
  city_id: string;
  name_en: string;
  name_ur: string;
  phone: string;
  category: EmergencyCategory;
  icon: string;
  sort_order: number;
  is_active: boolean;
  description_en?: string | null;
  description_ur?: string | null;
  whatsapp?: string | null;
  source_url?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type LocalAuthorityType = 'municipal' | 'police' | 'revenue' | 'district' | 'sanitation' | 'other';

export interface AuthorityProfileRow {
  id: string;
  city_id: string;
  slug: string;
  name_en: string;
  name_ur: string;
  photo_url: string | null;
  designation_en: string | null;
  designation_ur: string | null;
  organization_en: string | null;
  organization_ur: string | null;
  status_label_en: string | null;
  status_label_ur: string | null;
  authority_en: string | null;
  authority_ur: string | null;
  bio_en: string | null;
  bio_ur: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  business_ids: string[];
  show_status: boolean;
  show_organization: boolean;
  show_authority: boolean;
  show_bio: boolean;
  show_contact: boolean;
  show_businesses: boolean;
  source_url: string | null;
  verified_at: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalAuthorityRow {
  id: string;
  city_id: string;
  name_en: string;
  name_ur: string;
  authority_type: LocalAuthorityType;
  description_en: string | null;
  description_ur: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  address_en: string | null;
  address_ur: string | null;
  website_url: string | null;
  map_url: string | null;
  office_hours_en: string | null;
  office_hours_ur: string | null;
  source_url: string;
  verified_at: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  slug: string;
  title_en: string;
  title_ur: string;
  body_md_en: string;
  body_md_ur: string;
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ProductRow {
  id: string;
  business_id: string;
  name_en: string;
  name_ur: string | null;
  description_en: string | null;
  description_ur: string | null;
  price: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OfferRow {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  valid_from: string;
  valid_to: string;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  business_id: string;
  author_name: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  owner_reply: string | null;
  owner_reply_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryRow {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionRow {
  id: string;
  type: SubmissionType;
  business_id: string | null;
  payload: Record<string, unknown>;
  contact_name: string | null;
  contact_phone: string | null;
  submitted_by?: string | null;
  status: SubmissionStatus;
  assigned_to: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessEventRow {
  id: string;
  business_id: string;
  event_type: BusinessEventType;
  ad_id: string | null;
  session_id: string;
  created_at: string;
}

export interface DailyBusinessStatRow {
  business_id: string;
  stat_date: string;
  views: number;
  calls: number;
  whatsapp: number;
  directions: number;
  shares: number;
}

export interface SearchLogRow {
  id: string;
  query: string;
  filters: Record<string, unknown>;
  results_count: number;
  created_at: string;
}

export interface NewsArticleRow {
  id: string;
  slug: string;
  title_en: string;
  title_ur: string;
  excerpt_en: string;
  excerpt_ur: string;
  content_en: string;
  content_ur: string;
  cover_image_url: string | null;
  image_urls: string[];
  youtube_url: string | null;
  status: 'draft' | 'published';
  is_featured: boolean;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRow {
  id: string;
  title_en: string;
  title_ur: string;
  body_en: string;
  body_ur: string;
  link_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title_en: string;
  title_ur: string;
  body_en: string;
  body_ur: string;
  link_path: string | null;
  is_read: boolean;
  created_at: string;
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  category_text: string | null;
  area_text: string | null;
  address: string | null;
  status: LeadStatus;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  converted_business_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdRow {
  id: string;
  business_id: string;
  title: string;
  placement: AdPlacement;
  image_url: string;
  target_url: string | null;
  start_date: string;
  end_date: string;
  status: AdStatus;
  notes: string | null;
  impressions: number;
  clicks: number;
  created_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportBatchRow {
  id: string;
  filename: string;
  total_rows: number;
  imported_count: number;
  failed_count: number;
  errors: Array<{ row: number; reason: string }>;
  created_by: string | null;
  created_at: string;
}

export interface BusinessNoteRow {
  id: string;
  business_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

export interface MyPermissionsRpcResult {
  role: UserRole;
  is_active: boolean;
  staff_types: StaffType[];
  permissions: PermissionKey[];
}

export interface EdgeFunctionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export type GovernmentJobScope = 'punjab' | 'federal' | 'other';
export type GovernmentJobType = 'regular' | 'contract' | 'project' | 'internship' | 'temporary' | 'other';
export type GovernmentJobStatus = 'draft' | 'published' | 'closed' | 'expired' | 'cancelled';
export interface GovernmentJobRow {
 id:string; slug:string; title_en:string; title_ur:string|null; summary_en:string|null; summary_ur:string|null; department_name:string;
 department_scope:GovernmentJobScope; job_type:GovernmentJobType; scale_or_grade:string|null;
 vacancy_count:number|null; location_text:string; districts:string[]; sadiqabad_relevance:boolean|null;
 qualification_text:string; experience_text:string|null; age_text:string|null; domicile_text:string|null;
 gender_or_quota_text:string|null; other_eligibility_text:string|null; application_steps:string|null;
 application_fee_text:string|null; apply_url:string|null; advertisement_url:string|null; official_case_number:string|null;
 application_open_at:string|null; deadline_at:string|null; status:GovernmentJobStatus; published_at:string|null;
 source_name:string|null; source_url:string|null; source_document_url:string|null; image_url:string|null; verified_at:string|null;
 next_review_at:string|null; created_by:string|null; updated_by:string|null; published_by:string|null;
 created_at:string; updated_at:string;
}


export type GovernmentSchemeScope = 'punjab' | 'federal';
export type GovernmentSchemeCategory = 'housing' | 'business_finance' | 'agriculture' | 'education' | 'social_protection' | 'skills' | 'health' | 'other';
export type GovernmentSchemeBenefitType = 'grant' | 'loan' | 'cash_transfer' | 'subsidy' | 'training' | 'housing' | 'service' | 'other';
export type GovernmentSchemeIntakeStatus = 'unconfirmed' | 'upcoming' | 'open' | 'paused' | 'closed' | 'expired' | 'cancelled';
export type GovernmentSchemeStatus = 'draft' | 'published' | 'archived';
export type GovernmentSchemeReportReason = 'incorrect_information' | 'broken_official_link' | 'intake_status_changed' | 'other';

export interface GovernmentSchemeRow {
 id:string; slug:string; title_en:string; title_ur:string|null; summary_en:string|null; summary_ur:string|null;
 government_scope:GovernmentSchemeScope; category:GovernmentSchemeCategory; benefit_type:GovernmentSchemeBenefitType;
 benefit_details:string; eligibility_text:string; required_documents:string[]; application_steps:string|null; fees_and_repayment:string|null;
 official_apply_url:string|null; source_name:string|null; source_url:string|null; source_document_url:string|null;
 intake_status:GovernmentSchemeIntakeStatus; application_open_at:string|null; deadline_at:string|null;
 status:GovernmentSchemeStatus; published_at:string|null; verified_at:string|null; next_review_at:string|null;
 created_by:string|null; updated_by:string|null; published_by:string|null; created_at:string; updated_at:string;
}

export interface GovernmentSchemeReportRow {
 id:string; scheme_id:string; reason:GovernmentSchemeReportReason; note:string|null; report_hour:string;
 reviewed_at:string|null; reviewed_by:string|null; review_note:string|null; created_at:string;
 scheme?:{title_en:string;slug:string}|null;
}


export interface GovernmentSchemeRevisionRow {
 id:string; scheme_id:string; change_type:'INSERT'|'UPDATE'; previous_snapshot:Record<string,unknown>|null;
 new_snapshot:Record<string,unknown>; changed_by:string|null; changed_at:string;
}
