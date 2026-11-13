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
  | 'settings.manage';

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
  | 'general';

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
  | 'plan_upgrade';
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
  | 'popup';
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
  is_active: boolean;
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
  is_active: boolean;
  created_at: string;
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
