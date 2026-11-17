import type {
  OfflineArea,
  OfflineBusiness,
  OfflineCategory,
  OfflineEmergencyContact,
} from './offlineDirectory';
import type {
  AreaRow,
  CategoryRow,
  EmergencyContactRow,
} from '../types/database';
import type { BusinessPublicView } from '../types/directory';

/**
 * Rehydrates only the public fields saved by the offline allow-list.
 * Private/account fields are deliberately set to neutral values, never inferred.
 */
export function offlineBusinessToPublicView(source: OfflineBusiness): BusinessPublicView {
  const category = source.category ? offlineCategoryToRow(source.category) : null;
  const area = source.area ? offlineAreaToRow(source.area) : null;
  return {
    ...source,
    city_id: '',
    owner_id: null,
    phone_normalized: source.phone_primary,
    email: null,
    owner_name: null,
    owner_photo_url: null,
    rejection_reason: null,
    plan_expires_at: null,
    view_count: 0,
    call_count: 0,
    whatsapp_count: 0,
    source: 'offline_snapshot',
    created_by: null,
    assigned_to: null,
    published_at: source.created_at || null,
    claimed_at: null,
    category,
    area,
    plan: null,
  } as unknown as BusinessPublicView;
}

export function offlineCategoryToRow(source: OfflineCategory): CategoryRow {
  return {
    ...source,
    city_id: '',
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}

export function offlineAreaToRow(source: OfflineArea): AreaRow {
  return {
    ...source,
    city_id: '',
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}

export function offlineEmergencyContactToRow(source: OfflineEmergencyContact): EmergencyContactRow {
  return {
    ...source,
    city_id: '',
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}
