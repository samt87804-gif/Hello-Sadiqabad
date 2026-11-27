import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, EyeOff, Mail, MapPin, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { BUSINESS_APPROVAL_FIELD_GROUPS, buildBusinessFieldDecisions, countApprovedCoreFields, shouldActivateDirectOwner, shouldProcessOwnerInvitation } from '../../lib/businessApproval';
import type { AreaRow, CategoryRow } from '../../types/database';
import { Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/FormFields';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { useToast } from '../ui/Toast';

type FieldStatus = 'pending_review' | 'approved_published' | 'rejected' | 'unpublished';
type MediaStatus = 'pending_review' | 'approved_pending_promotion' | 'approved_published' | 'removal_requested' | 'rejected' | 'unpublished';

interface FieldReview {
  id: string;
  submission_id: string;
  field_key: string;
  field_value: unknown;
  status: FieldStatus;
  admin_note: string | null;
}

interface BusinessMedia {
  id: string;
  submission_id: string | null;
  business_id: string | null;
  media_field: 'logo' | 'cover' | 'gallery';
  storage_path: string;
  status: MediaStatus;
  created_at: string;
  admin_note: string | null;
  preview_url?: string;
}

interface BusinessSubmission {
  id: string;
  payload: Record<string, unknown>;
  contact_name: string | null;
  contact_phone: string | null;
  submitted_by: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  business_id: string | null;
}

interface PasswordChangeRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'consumed' | 'expired';
  requested_at: string;
}

interface LinkedOwnerRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string | null;
  business_id: string | null;
  submission_id: string;
  direct_auth_user_id: string | null;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  invitation_requested: boolean;
  invitation_status: 'not_requested' | 'waiting_for_business' | 'pending' | 'processing' | 'sent' | 'failed';
  invitation_attempts: number;
  invitation_last_error: string | null;
  invitation_sent_at: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  name_en: 'Business Name (English)',
  name_ur: 'Business Name (Urdu)',
  category_id: 'Category',
  area_id: 'Area',
  phone_primary: 'Primary Phone',
  whatsapp: 'WhatsApp Number',
  address_en: 'Address (English)',
  address_ur: 'Address (Urdu)',
  landmark_en: 'Nearby Landmark (English)',
  landmark_ur: 'Nearby Landmark (Urdu)',
  map_url: 'Google Maps Location',
  opening_hours: 'Opening Hours',
  description_en: 'Description (English)',
  description_ur: 'Description (Urdu)',
  services_en: 'Facilities / Services',
  services_ur: 'Facilities / Services (Urdu)',
};

function formatValue(value: unknown, fieldKey: string, categories: CategoryRow[], areas: AreaRow[]): string {
  if (value === null || value === undefined || value === '') return '—';
  if (fieldKey === 'category_id' && typeof value === 'string') {
    return categories.find((item) => item.id === value)?.name_en ?? value;
  }
  if (fieldKey === 'area_id' && typeof value === 'string') {
    return areas.find((item) => item.id === value)?.name_en ?? value;
  }
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (fieldKey === 'opening_hours' && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([day, hours]) => `${day}: ${typeof hours === 'string' ? hours : JSON.stringify(hours)}`)
      .join('\n');
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export function BusinessFieldReviewQueue({
  categories = [],
  areas = [],
}: {
  categories?: CategoryRow[];
  areas?: AreaRow[];
}) {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [fields, setFields] = useState<FieldReview[]>([]);
  const [media, setMedia] = useState<BusinessMedia[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<LinkedOwnerRequest[]>([]);
  const [passwordChangeRequests, setPasswordChangeRequests] = useState<PasswordChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyMediaId, setBusyMediaId] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [approvedFieldKeys, setApprovedFieldKeys] = useState<string[]>([]);
  const [rejectedFieldReasons, setRejectedFieldReasons] = useState<Record<string, string>>({});
  const [unpublishFieldKeys, setUnpublishFieldKeys] = useState<string[]>([]);
  const [approvedMediaIds, setApprovedMediaIds] = useState<string[]>([]);
  const [rejectedMediaIds, setRejectedMediaIds] = useState<string[]>([]);
  const [unpublishMediaIds, setUnpublishMediaIds] = useState<string[]>([]);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [initialInviteChecked, setInitialInviteChecked] = useState(false);
  const [ownerIdentityVerified, setOwnerIdentityVerified] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [initialAdminNote, setInitialAdminNote] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  const fieldsBySubmission = useMemo(() => {
    const grouped = new Map<string, FieldReview[]>();
    for (const field of fields) {
      const current = grouped.get(field.submission_id) ?? [];
      current.push(field);
      grouped.set(field.submission_id, current);
    }
    return grouped;
  }, [fields]);

  const mediaBySubmission = useMemo(() => {
    const grouped = new Map<string, BusinessMedia[]>();
    for (const asset of media) {
      if (!asset.submission_id) continue;
      const current = grouped.get(asset.submission_id) ?? [];
      current.push(asset);
      grouped.set(asset.submission_id, current);
    }
    return grouped;
  }, [media]);

  const ownerRequestBySubmission = useMemo(
    () => new Map(ownerRequests.map((request) => [request.submission_id, request])),
    [ownerRequests]
  );

  const activeSubmission = submissions.find((item) => item.id === activeSubmissionId) ?? null;
  const activeFields = activeSubmissionId
    ? (fieldsBySubmission.get(activeSubmissionId) ?? []).filter((field) => field.field_key !== 'owner_name')
    : [];
  const activeMedia = activeSubmissionId ? (mediaBySubmission.get(activeSubmissionId) ?? []) : [];
  const activeOwnerRequest = activeSubmissionId ? ownerRequestBySubmission.get(activeSubmissionId) ?? null : null;

  const activeApprovedCore = countApprovedCoreFields(
    activeFields,
    approvedFieldKeys,
    unpublishFieldKeys
  );
  const activeCoreReady = activeApprovedCore === 5;
  const allPendingMediaDecided = activeMedia.every((asset) =>
    asset.status !== 'pending_review' || approvedMediaIds.includes(asset.id) || rejectedMediaIds.includes(asset.id)
  );

  const hasUnsavedChanges =
    approvedFieldKeys.length > 0 ||
    Object.keys(rejectedFieldReasons).length > 0 ||
    unpublishFieldKeys.length > 0 ||
    approvedMediaIds.some((id) => activeMedia.find((asset) => asset.id === id)?.status === 'pending_review') ||
    rejectedMediaIds.length > 0 ||
    unpublishMediaIds.length > 0 ||
    inviteChecked !== initialInviteChecked ||
    adminNote.trim() !== initialAdminNote.trim();

  const reload = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoadError('Supabase connection is unavailable. Check the connection and retry.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    setLoadWarning('');
    try {
      const { data: rows, error: submissionError } = await client.from('submissions')
        .select('id,payload,contact_name,contact_phone,submitted_by,status,created_at,business_id')
        .eq('type', 'new_business')
        .in('status', ['new', 'in_review', 'done'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (submissionError) throw submissionError;
      const ids = (rows ?? []).map((row) => row.id);

      const [reviewResult, mediaResult, ownerResult, privateNotesResult, passwordRequestResult] = await Promise.all([
        ids.length
          ? client.from('business_field_reviews')
            .select('id,submission_id,field_key,field_value,status,admin_note')
            .in('submission_id', ids)
            .order('field_key')
          : Promise.resolve({ data: [], error: null }),
        client.from('business_media_assets')
          .select('id,submission_id,business_id,media_field,storage_path,status,created_at,admin_note')
          .in('status', ['pending_review', 'approved_pending_promotion', 'approved_published', 'removal_requested', 'unpublished'])
          .order('created_at', { ascending: false })
          .limit(200),
        ids.length
          ? client.from('owner_registration_requests')
            .select('id,full_name,email,phone,business_name,business_id,submission_id,direct_auth_user_id,status,invitation_requested,invitation_status,invitation_attempts,invitation_last_error,invitation_sent_at')
            .in('submission_id', ids)
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? client.rpc('admin_submission_private_notes', { p_submission_ids: ids })
          : Promise.resolve({ data: [], error: null }),
        client.from('owner_password_change_requests')
          .select('id,user_id,status,requested_at')
          .eq('status', 'pending')
          .order('requested_at', { ascending: true })
          .limit(50),
      ]);
      if (reviewResult.error) throw reviewResult.error;

      const optionalWarnings: string[] = [];
      if (mediaResult.error) optionalWarnings.push('Business image records could not be loaded; request cards are still available.');
      if (ownerResult.error) optionalWarnings.push('Linked Owner invitation details could not be loaded; invitation actions may be unavailable.');
      if (privateNotesResult.error) optionalWarnings.push('Private Admin notes could not be loaded; no note content is being displayed.');
      if (passwordRequestResult.error) optionalWarnings.push('Owner password-change requests could not be loaded.');

      const mediaAssets = mediaResult.error ? [] : (mediaResult.data ?? []) as BusinessMedia[];
      const mediaPaths = mediaAssets.map((asset) => asset.storage_path);
      let signedRows: Array<{ path: string; signedUrl?: string | null }> = [];
      if (mediaPaths.length) {
        const { data, error } = await client.storage.from('hs-pending-business-media').createSignedUrls(mediaPaths, 900);
        if (error) optionalWarnings.push('Private image previews could not be loaded; request cards remain available.');
        else signedRows = (data ?? []) as Array<{ path: string; signedUrl?: string | null }>;
      }
      const signedUrlByPath = new Map(
        (signedRows ?? []).flatMap((item) => item.signedUrl ? [[item.path, item.signedUrl] as const] : [])
      );

      const privateNoteBySubmission = new Map(
        ((privateNotesResult.error ? [] : privateNotesResult.data ?? []) as Array<{ submission_id: string; admin_note: string | null }>)
          .map((item) => [item.submission_id, item.admin_note] as const)
      );
      const candidateRows = (rows ?? []).map((row) => ({
        ...row,
        admin_note: privateNoteBySubmission.get(row.id) ?? null,
      })) as BusinessSubmission[];
      const fieldRows = (reviewResult.data ?? []) as FieldReview[];
      const linkedOwnerRows = (ownerResult.error ? [] : ownerResult.data ?? []) as LinkedOwnerRequest[];
      const activeRows = candidateRows.filter((submission) => {
        if (submission.status === 'new' || submission.status === 'in_review') return true;
        if (submission.status !== 'done') return false;
        const hasOutstandingMedia = mediaAssets.some((asset) =>
          asset.submission_id === submission.id && ['pending_review', 'approved_pending_promotion'].includes(asset.status)
        );
        const invitation = linkedOwnerRows.find((item) => item.submission_id === submission.id);
        const hasOutstandingInvitation = Boolean(
          invitation?.invitation_requested && invitation.invitation_status !== 'sent'
        );
        const hasOutstandingDirectActivation = Boolean(
          invitation?.direct_auth_user_id && ['pending', 'processing'].includes(invitation.status)
        );
        return hasOutstandingMedia || hasOutstandingInvitation || hasOutstandingDirectActivation;
      });
      const activeIds = new Set(activeRows.map((submission) => submission.id));
      setSubmissions(activeRows);
      setFields(fieldRows.filter((field) => activeIds.has(field.submission_id)));
      setMedia(mediaAssets.map((asset) => ({
        ...asset,
        preview_url: signedUrlByPath.get(asset.storage_path) ?? undefined,
      })));
      setOwnerRequests(linkedOwnerRows.filter((item) => activeIds.has(item.submission_id)));
      setPasswordChangeRequests((passwordRequestResult.error ? [] : passwordRequestResult.data ?? []) as PasswordChangeRequest[]);
      setLoadWarning(optionalWarnings.join(' '));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load business field reviews.';
      setLoadError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void reload(); }, [reload]);

  const openReview = (submission: BusinessSubmission) => {
    const ownerRequest = ownerRequestBySubmission.get(submission.id);
    setActiveSubmissionId(submission.id);
    setApprovedFieldKeys([]);
    setRejectedFieldReasons({});
    setUnpublishFieldKeys([]);
    setApprovedMediaIds((mediaBySubmission.get(submission.id) ?? [])
      .filter((asset) => asset.status === 'approved_pending_promotion')
      .map((asset) => asset.id));
    setRejectedMediaIds([]);
    setUnpublishMediaIds([]);
    setInviteChecked(Boolean(ownerRequest?.invitation_requested || ownerRequest?.invitation_status === 'sent'));
    setInitialInviteChecked(Boolean(ownerRequest?.invitation_requested || ownerRequest?.invitation_status === 'sent'));
    setOwnerIdentityVerified(false);
    setAdminNote('');
    setInitialAdminNote('');
    setConfirmClose(false);
  };

  const closeReview = () => {
    if (hasUnsavedChanges) {
      setConfirmClose(true);
      return;
    }
    setActiveSubmissionId(null);
  };

  const toggleFieldApproval = (fieldKey: string, checked: boolean) => {
    setRejectedFieldReasons((current) => {
      const next = { ...current };
      delete next[fieldKey];
      return next;
    });
    setApprovedFieldKeys((current) => checked
      ? [...new Set([...current, fieldKey])]
      : current.filter((key) => key !== fieldKey));
  };

  const selectAllFields = (fieldKeys: string[]) => {
    const eligible = activeFields.filter((field) =>
      fieldKeys.includes(field.field_key) &&
      ['pending_review', 'unpublished'].includes(field.status) &&
      !(field.field_key === 'whatsapp' && !activeSubmission?.business_id)
    ).map((field) => field.field_key);
    setRejectedFieldReasons({});
    setApprovedFieldKeys((current) => [...new Set([...current, ...eligible])]);
  };

  const clearAllFields = () => {
    setApprovedFieldKeys([]);
    setRejectedFieldReasons({});
    setUnpublishFieldKeys([]);
    setApprovedMediaIds([]);
    setRejectedMediaIds([]);
    setUnpublishMediaIds([]);
  };

  const selectAllRequest = () => {
    selectAllFields(activeFields.map((field) => field.field_key));
    setApprovedMediaIds((current) => [...new Set([
      ...current,
      ...activeMedia.filter((asset) => asset.status === 'pending_review').map((asset) => asset.id),
    ])]);
  };

  const toggleFieldReject = (fieldKey: string) => {
    setApprovedFieldKeys((current) => current.filter((key) => key !== fieldKey));
    setRejectedFieldReasons((current) => {
      if (Object.prototype.hasOwnProperty.call(current, fieldKey)) {
        const next = { ...current };
        delete next[fieldKey];
        return next;
      }
      return { ...current, [fieldKey]: '' };
    });
  };

  const toggleMediaApproval = (assetId: string, checked: boolean) => {
    setRejectedMediaIds((current) => current.filter((id) => id !== assetId));
    setApprovedMediaIds((current) => checked
      ? [...new Set([...current, assetId])]
      : current.filter((id) => id !== assetId));
  };

  const toggleMediaReject = (assetId: string) => {
    setApprovedMediaIds((current) => current.filter((id) => id !== assetId));
    setRejectedMediaIds((current) => current.includes(assetId)
      ? current.filter((id) => id !== assetId)
      : [...current, assetId]);
  };

  const reviewPasswordChangeRequest = async (requestId: string, decision: 'approve' | 'reject') => {
    const client = getSupabaseClient();
    if (!client) return;
    setBusy(true);
    try {
      const { data, error } = await client.functions.invoke('review-owner-password-change', {
        body: { request_id: requestId, decision },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Password-change request could not be reviewed.');
      showToast(decision === 'approve'
        ? 'Password change approved. Owner has 30 minutes to set the new password.'
        : 'Password change request rejected.', 'success');
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Password-change review failed.', 'error');
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const retryInvitation = async () => {
    const client = getSupabaseClient();
    if (!client || !activeOwnerRequest) return;
    setBusy(true);
    try {
      const { data, error } = await client.functions.invoke('send-business-owner-invitation', {
        body: { request_id: activeOwnerRequest.id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Owner invitation could not be processed.');
      showToast(data.status === 'waiting_for_business'
        ? 'Owner invitation is saved and will wait until the business is publishable.'
        : 'Owner invitation processed successfully.', 'success');
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Owner invitation failed.', 'error');
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const saveApproval = async () => {
    const client = getSupabaseClient();
    if (!client || !activeSubmission) return;
    const emptyReject = Object.entries(rejectedFieldReasons).find(([, reason]) => !reason.trim());
    if (emptyReject) {
      showToast(`Add a rejection reason for ${FIELD_LABELS[emptyReject[0]] ?? emptyReject[0]}.`, 'error');
      return;
    }

    setBusy(true);
    const partialErrors: string[] = [];
    let invitationWaiting = false;
    let ownerActivated = false;
    let mediaReviewFailed = false;
    const failedMediaIds = new Set<string>();
    let result: Record<string, unknown> | null = null;
    try {
      const decisions = buildBusinessFieldDecisions(
        activeFields,
        approvedFieldKeys,
        rejectedFieldReasons,
        unpublishFieldKeys
      );
      const needsFieldSave = decisions.length > 0 || inviteChecked !== initialInviteChecked || adminNote.trim() !== initialAdminNote.trim();
      if (needsFieldSave && activeSubmission.status === 'done') {
        throw new Error('This registration review is complete. Use the invitation or image retry controls for remaining follow-up work.');
      }
      result = {
        business_id: activeSubmission.business_id,
        core_ready: activeCoreReady,
        invitation_status: activeOwnerRequest?.invitation_status ?? 'not_requested',
      };
      if (needsFieldSave) {
        const { data, error } = await client.rpc('review_business_submission_fields', {
          p_submission_id: activeSubmission.id,
          p_decisions: decisions,
          p_admin_note: adminNote.trim() || null,
          p_request_owner_invitation: inviteChecked,
        });
        if (error) throw error;
        result = (data ?? {}) as Record<string, unknown>;
        const deferredFields = Array.isArray(result.deferred_fields)
          ? result.deferred_fields.filter((value): value is string => typeof value === 'string')
          : [];
        if (deferredFields.length) {
          partialErrors.push(deferredFields.map((key) => key === 'whatsapp'
            ? 'WhatsApp remains pending until the business plan includes this feature.'
            : `${FIELD_LABELS[key] ?? key} was deferred until the business is published.`).join(' · '));
        }
      }

      const mediaActions = [
        ...activeMedia
          .filter((asset) => approvedMediaIds.includes(asset.id) &&
            ['pending_review', 'approved_pending_promotion'].includes(asset.status))
          .map((asset) => ({ assetId: asset.id, action: 'approved_published' as const })),
        ...activeMedia
          .filter((asset) => rejectedMediaIds.includes(asset.id) &&
            ['pending_review', 'approved_pending_promotion'].includes(asset.status))
          .map((asset) => ({ assetId: asset.id, action: 'rejected' as const })),
        ...activeMedia
          .filter((asset) => unpublishMediaIds.includes(asset.id) && asset.status === 'approved_published')
          .map((asset) => ({ assetId: asset.id, action: 'unpublished' as const })),
      ];

      for (const mediaAction of mediaActions) {
        try {
          const { data: mediaResult, error: mediaError } = await client.functions.invoke('review-business-media', {
            body: { asset_id: mediaAction.assetId, action: mediaAction.action, admin_note: adminNote.trim() || null },
          });
          if (mediaError) throw mediaError;
          if (!mediaResult?.ok) throw new Error(mediaResult?.error || 'Image review failed');
        } catch (error) {
          mediaReviewFailed = true;
          failedMediaIds.add(mediaAction.assetId);
          partialErrors.push(error instanceof Error ? error.message : 'An image review could not be completed.');
        }
      }

      const pendingMediaCount = activeMedia.filter((asset) =>
        asset.status === 'pending_review' &&
        (!mediaActions.some((action) => action.assetId === asset.id) || failedMediaIds.has(asset.id))
      ).length;

      if (activeOwnerRequest?.direct_auth_user_id && ownerIdentityVerified) {
        const canActivate = shouldActivateDirectOwner({
          directAuthUserId: activeOwnerRequest.direct_auth_user_id,
          identityVerified: ownerIdentityVerified,
          coreReady: result.core_ready === true,
          businessId: typeof result.business_id === 'string' ? result.business_id : activeSubmission.business_id,
          pendingMediaCount: mediaReviewFailed ? Math.max(1, pendingMediaCount) : pendingMediaCount,
        });
        if (canActivate) {
          try {
            const { data: activationResult, error: activationError } = await client.functions.invoke('activate-direct-owner', {
              body: { request_id: activeOwnerRequest.id, identity_verified: true },
            });
            if (activationError) throw activationError;
            if (!activationResult?.ok || activationResult.owner_linked !== true || activationResult.account_active !== true) {
              throw new Error(activationResult?.error || 'Owner activation and business linking could not be verified.');
            }
            ownerActivated = true;
            setOwnerIdentityVerified(false);
          } catch (error) {
            partialErrors.push(error instanceof Error ? error.message : 'Owner activation and business linking need a retry.');
          }
        } else if (result.core_ready !== true || !(typeof result.business_id === 'string' || activeSubmission.business_id)) {
          partialErrors.push('Owner account remains inactive until all five required business fields are approved and the business is published.');
        } else if (pendingMediaCount > 0 || mediaReviewFailed) {
          partialErrors.push('Owner account remains inactive until every submitted image has a completed Admin decision.');
        }
      }

      const invitationStatus = String(result.invitation_status ?? 'not_requested');
      if (inviteChecked && activeOwnerRequest && shouldProcessOwnerInvitation(
        invitationStatus,
        typeof result.business_id === 'string' ? result.business_id : activeSubmission.business_id,
        result.core_ready === true
      )) {
        try {
          const { data: inviteResult, error: inviteError } = await client.functions.invoke('send-business-owner-invitation', {
            body: { request_id: activeOwnerRequest.id },
          });
          if (inviteError) throw inviteError;
          if (!inviteResult?.ok) throw new Error(inviteResult?.error || 'Owner invitation failed');
          if (inviteResult.status === 'waiting_for_business') invitationWaiting = true;
        } catch (error) {
          partialErrors.push(error instanceof Error ? error.message : 'Owner invitation could not be sent.');
        }
      }

      setApprovedFieldKeys([]);
      setRejectedFieldReasons({});
      setUnpublishFieldKeys([]);
      setApprovedMediaIds([]);
      setRejectedMediaIds([]);
      setUnpublishMediaIds([]);
      setInitialInviteChecked(inviteChecked);
      setInitialAdminNote(adminNote);
      await reload();

      if (partialErrors.length) {
        showToast(`${ownerActivated ? 'Business published and Owner activated/linked. ' : 'Field decisions saved. '}Some follow-up actions need attention: ${partialErrors.join(' · ')}`, 'error');
      } else if (invitationWaiting || (inviteChecked && result.invitation_status === 'waiting_for_business')) {
        showToast('Field decisions saved. Owner invitation is queued until the minimum public business information is complete.', 'success');
        setActiveSubmissionId(null);
      } else {
        showToast(ownerActivated
          ? 'Business approved and published. Owner account activated and this business linked automatically. The Owner can now sign in with the password chosen on Add Business.'
          : 'Business review saved. Selected fields and follow-up actions have been processed.', 'success');
        setActiveSubmissionId(null);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Business review could not be saved.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reviewOtherMedia = async (assetId: string, action: 'approved_published' | 'rejected' | 'unpublished') => {
    const client = getSupabaseClient();
    if (!client) return;
    setBusyMediaId(assetId);
    try {
      const { data, error } = await client.functions.invoke('review-business-media', {
        body: { asset_id: assetId, action },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Media review failed.');
      showToast(data.status === 'approved_pending_promotion'
        ? 'Image approved; it will publish when the business is ready.'
        : 'Business image review saved.', 'success');
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not review business image.', 'error');
    } finally {
      setBusyMediaId('');
    }
  };

  const visibleOtherMedia = media.filter((asset) =>
    !asset.submission_id || !submissions.some((submission) => submission.id === asset.submission_id)
  );

  const fieldGroups = BUSINESS_APPROVAL_FIELD_GROUPS.map((group) => ({
    ...group,
    items: activeFields.filter((field) => (group.fields as readonly string[]).includes(field.field_key)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface">Business Field Approval</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            One request card, one review popup and one Save Approval action. Unselected fields stay pending.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
      </div>

      {loadError && (
        <Card className="p-4 border border-error/30 bg-error/5 space-y-2" role="alert">
          <div className="flex items-center gap-2 text-sm font-semibold text-error"><AlertCircle className="w-4 h-4" />Business requests could not be fully loaded</div>
          <p className="text-xs text-on-surface-variant">{loadError}</p>
          <div><Button size="sm" variant="outline" onClick={() => void reload()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Retry loading requests</Button></div>
        </Card>
      )}
      {loadWarning && (
        <Card className="p-3 border border-warning/30 bg-warning/5 text-xs text-on-surface-variant" role="status">{loadWarning}</Card>
      )}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Owner Password-Change Approvals</h3>
            <p className="text-[11px] text-on-surface-variant">Approve or reject Owner requests. New passwords are never visible to Admin.</p>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">{passwordChangeRequests.length} pending</span>
        </div>
        {passwordChangeRequests.length === 0 ? (
          <p className="text-xs text-on-surface-variant">No Owner password-change requests are waiting.</p>
        ) : passwordChangeRequests.map((request) => (
          <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-surface-container-low p-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface break-all">Owner account: {request.user_id}</p>
              <p className="text-[11px] text-on-surface-variant">Requested {new Date(request.requested_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" disabled={busy} loading={busy} onClick={() => void reviewPasswordChangeRequest(request.id, 'approve')}>Approve</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void reviewPasswordChangeRequest(request.id, 'reject')}>Reject</Button>
            </div>
          </div>
        ))}
      </Card>
      {loading ? (
        <Card className="p-6 text-sm text-on-surface-variant">Loading business requests…</Card>
      ) : loadError && submissions.length === 0 ? null : submissions.length === 0 ? (
        <Card className="p-6 text-sm text-on-surface-variant">No new Business Registration requests are waiting for review.</Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const submissionFields = (fieldsBySubmission.get(submission.id) ?? []).filter((field) => field.field_key !== 'owner_name');
            const pendingCount = submissionFields.filter((field) => field.status === 'pending_review').length;
            const approvedCount = submissionFields.filter((field) => field.status === 'approved_published').length;
            const rejectedCount = submissionFields.filter((field) => field.status === 'rejected').length;
            const submissionMedia = mediaBySubmission.get(submission.id) ?? [];
            const mediaCount = submissionMedia.length;
            const ownerRequest = ownerRequestBySubmission.get(submission.id);
            const categoryId = submission.payload.category_id;
            const areaId = submission.payload.area_id;
            const category = categories.find((item) => item.id === categoryId);
            const area = areas.find((item) => item.id === areaId);
            return (
              <Card key={submission.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-bold text-on-surface break-words">{String(submission.payload.name_en ?? 'New business')}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                      <span>Request ID: {submission.id.slice(0, 8)}</span>
                      <span>Submitted by {submission.contact_name || 'Public visitor'}</span>
                      <span>{new Date(submission.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-on-surface-variant">
                      <span>{category?.name_en ?? 'Category pending'}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{area?.name_en ?? 'Area pending'}</span>
                      <span>{submissionFields.length} submitted fields</span>
                      <span>{pendingCount} pending</span>
                      <span>{approvedCount} approved</span>
                      <span>{rejectedCount} rejected</span>
                      <span>{mediaCount} images</span>
                    </div>
                    {submissionMedia.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {submissionMedia.slice(0, 2).map((asset) => (
                          <div key={asset.id} className="w-14 h-12 rounded-lg border border-outline-variant/40 bg-surface-container-low overflow-hidden flex items-center justify-center">
                            {asset.preview_url
                              ? <img src={asset.preview_url} alt={asset.media_field === 'logo' ? 'Submitted logo thumbnail' : 'Submitted cover thumbnail'} className="w-full h-full object-contain" />
                              : <span className="text-[9px] text-on-surface-variant">No preview</span>}
                          </div>
                        ))}
                        {submissionMedia.length > 2 && <span className="text-[10px] text-on-surface-variant">+{submissionMedia.length - 2} more</span>}
                      </div>
                    )}
                    {ownerRequest && (
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Owner invitation: {statusLabel(ownerRequest.invitation_status)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-secondary-container text-on-secondary-container inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3" /> {submission.status}
                    </span>
                    <Button size="sm" onClick={() => openReview(submission)}>View Details</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {visibleOtherMedia.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Other Business Image Changes</h3>
            <p className="text-xs text-on-surface-variant">Existing Owner image replacements and older media records remain in this separate review list.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleOtherMedia.map((asset) => (
              <Card key={asset.id} className="p-4 space-y-3">
                {asset.preview_url
                  ? <img src={asset.preview_url} alt={asset.media_field === 'logo' ? 'Business logo preview' : asset.media_field === 'cover' ? 'Business cover preview' : 'Business gallery photo preview'} className="w-full h-40 object-contain rounded-xl bg-surface-container-low" />
                  : <div className="h-40 rounded-xl bg-surface-container-low flex items-center justify-center text-xs text-on-surface-variant">Private image preview unavailable</div>}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold capitalize">{asset.media_field} · {statusLabel(asset.status)}</p>
                  <span className="text-[10px] text-on-surface-variant">{new Date(asset.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['pending_review', 'approved_pending_promotion'].includes(asset.status) && (
                    <Button size="sm" loading={busyMediaId === asset.id} disabled={Boolean(busyMediaId)} onClick={() => void reviewOtherMedia(asset.id, 'approved_published')} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>Approve / Retry Publish</Button>
                  )}
                  {['pending_review', 'approved_pending_promotion'].includes(asset.status) && (
                    <Button size="sm" variant="danger" disabled={Boolean(busyMediaId)} onClick={() => void reviewOtherMedia(asset.id, 'rejected')} leftIcon={<XCircle className="w-3.5 h-3.5" />}>Reject</Button>
                  )}
                  {asset.status === 'approved_published' && (
                    <Button size="sm" variant="outline" disabled={Boolean(busyMediaId)} onClick={() => void reviewOtherMedia(asset.id, 'unpublished')} leftIcon={<EyeOff className="w-3.5 h-3.5" />}>Unpublish</Button>
                  )}
                  {asset.status === 'removal_requested' && (
                    <Button size="sm" variant="danger" disabled={Boolean(busyMediaId)} onClick={() => void reviewOtherMedia(asset.id, 'unpublished')} leftIcon={<EyeOff className="w-3.5 h-3.5" />}>Approve Owner removal</Button>
                  )}
                </div>
                {asset.media_field === 'cover' && <p className="text-[11px] text-on-surface-variant">Cover publication is subject to the business plan entitlement.</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={Boolean(activeSubmission)}
        onClose={closeReview}
        title={activeSubmission ? `Review Business Request — ${String(activeSubmission.payload.name_en ?? 'New Business')}` : 'Review Business Request'}
        maxWidthClass="max-w-5xl"
      >
        {activeSubmission && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{activeApprovedCore}/5 minimum public fields approved</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {activeCoreReady
                    ? 'Minimum public information is complete. Saving can publish the business.'
                    : 'Selected fields will be saved, but the business stays private until all five required fields are approved.'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" disabled={activeSubmission.status === 'done'} onClick={selectAllRequest}>Select All</Button>
                <Button size="sm" variant="outline" onClick={clearAllFields}>Clear All</Button>
              </div>
            </div>

            <section className="rounded-xl border border-outline-variant/40 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm">Approve Public Fields</h3>
                <span className="text-xs text-on-surface-variant">{approvedFieldKeys.length} new approvals selected</span>
              </div>
              {fieldGroups.map((group) => (
                <details key={group.key} open className="rounded-xl border border-outline-variant/30">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-3 py-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">{group.title}</span>
                    <span className="text-[10px] text-on-surface-variant">{group.items.length} fields · tap to collapse</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-2">
                    <div className="flex items-center justify-end gap-3 border-b border-outline-variant/30 pb-2">
                      <button type="button" disabled={activeSubmission.status === 'done'} className="text-[11px] font-semibold text-primary disabled:opacity-40" onClick={() => selectAllFields(group.items.map((field) => field.field_key))}>Select section</button>
                      <button type="button" disabled={activeSubmission.status === 'done'} className="text-[11px] font-semibold text-on-surface-variant disabled:opacity-40" onClick={() => {
                        const keys = group.items.map((field) => field.field_key);
                        setApprovedFieldKeys((current) => current.filter((key) => !keys.includes(key)));
                        setRejectedFieldReasons((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !keys.includes(key))));
                        setUnpublishFieldKeys((current) => current.filter((key) => !keys.includes(key)));
                      }}>Clear section</button>
                    </div>
                    {group.items.map((field) => {
                      const alreadyApproved = field.status === 'approved_published';
                      const rejected = field.status === 'rejected';
                      const disabledWhatsApp = field.field_key === 'whatsapp' && !activeSubmission.business_id;
                      const checked = alreadyApproved || approvedFieldKeys.includes(field.field_key);
                      const rejectReason = rejectedFieldReasons[field.field_key];
                      return (
                        <div key={field.id} className="rounded-xl bg-surface-container-low/70 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start gap-2 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                                checked={checked}
                                disabled={activeSubmission.status === 'done' || alreadyApproved || rejected || disabledWhatsApp}
                                onChange={(event) => toggleFieldApproval(field.field_key, event.target.checked)}
                              />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-on-surface">{FIELD_LABELS[field.field_key] ?? field.field_key}</span>
                                <span className="block text-sm text-on-surface-variant whitespace-pre-wrap break-words mt-1">{formatValue(field.field_value, field.field_key, categories, areas)}</span>
                              </span>
                            </label>
                            <span className="text-[10px] text-on-surface-variant capitalize whitespace-nowrap">{statusLabel(field.status)}</span>
                          </div>
                          {disabledWhatsApp && <p className="text-[11px] text-on-surface-variant">WhatsApp can be reviewed after the business exists and its plan entitlement is checked.</p>}
                          {alreadyApproved && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-success inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Already approved and published</span>
                              {activeSubmission.business_id && activeSubmission.status !== 'done' && (
                                <button type="button" className="text-[11px] font-semibold text-error" onClick={() => setUnpublishFieldKeys((current) => current.includes(field.field_key) ? current.filter((key) => key !== field.field_key) : [...current, field.field_key])}>
                                  {unpublishFieldKeys.includes(field.field_key) ? 'Cancel unpublish' : 'Unpublish'}
                                </button>
                              )}
                            </div>
                          )}
                          {!activeSubmission || activeSubmission.status !== 'done' ? (!alreadyApproved && !rejected && !disabledWhatsApp && (
                            <div className="flex items-center justify-between gap-2">
                              <button type="button" className="text-[11px] font-semibold text-error" onClick={() => toggleFieldReject(field.field_key)}>
                                {rejectReason !== undefined ? 'Cancel rejection' : 'Reject this field'}
                              </button>
                              {field.status === 'unpublished' && <span className="text-[10px] text-warning">Previously unpublished</span>}
                            </div>
                          )) : null}
                          {rejectReason !== undefined && (
                            <Textarea rows={2} value={rejectReason} onChange={(event) => setRejectedFieldReasons((current) => ({ ...current, [field.field_key]: event.target.value }))} placeholder="Required rejection reason" />
                          )}
                          {unpublishFieldKeys.includes(field.field_key) && <p className="text-[11px] text-error">This field will be removed from the public listing when saved.</p>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </section>

            <section className="rounded-xl border border-outline-variant/40 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-bold text-sm">Business Images</h3>
                  <span className="text-xs text-on-surface-variant">{activeMedia.length} submitted image(s)</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-[11px] font-semibold text-primary" onClick={() => setApprovedMediaIds((current) => [...new Set([...current, ...activeMedia.filter((asset) => asset.status === 'pending_review').map((asset) => asset.id)])])}>Select images</button>
                  <button type="button" className="text-[11px] font-semibold text-on-surface-variant" onClick={() => setApprovedMediaIds((current) => current.filter((id) => !activeMedia.some((asset) => asset.id === id && asset.status === 'pending_review')))}>Clear image selections</button>
                </div>
              </div>
              {activeMedia.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No logo, cover or gallery images were submitted with this request.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeMedia.map((asset) => {
                    const rejected = rejectedMediaIds.includes(asset.id);
                    return (
                      <div key={asset.id} className="rounded-xl bg-surface-container-low/70 p-3 space-y-2">
                        {asset.preview_url
                          ? <img src={asset.preview_url} alt={asset.media_field === 'logo' ? 'Submitted business logo' : asset.media_field === 'cover' ? 'Submitted business cover' : 'Submitted business gallery photo'} className="w-full h-36 object-contain rounded-lg bg-surface-container-lowest" />
                          : <div className="h-36 rounded-lg bg-surface-container-lowest flex items-center justify-center text-xs text-on-surface-variant">Private image preview unavailable</div>}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold capitalize">{asset.media_field}</span>
                          <span className="text-[10px] text-on-surface-variant">{statusLabel(asset.status)}</span>
                        </div>
                        {asset.status === 'pending_review' && (
                          <label className="flex items-center gap-2 text-xs font-semibold">
                            <input type="checkbox" className="h-4 w-4 accent-primary" checked={approvedMediaIds.includes(asset.id)} disabled={rejected} onChange={(event) => toggleMediaApproval(asset.id, event.target.checked)} />
                            Approve image for publication
                          </label>
                        )}
                        {asset.status === 'approved_pending_promotion' && (
                          <p className="text-[11px] text-warning">Approved. It will be promoted after the business is public and plan rules allow it.</p>
                        )}
                        {asset.status === 'approved_published' && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-success">Public image</span>
                            <button type="button" className="text-[11px] font-semibold text-error" onClick={() => setUnpublishMediaIds((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id])}>
                              {unpublishMediaIds.includes(asset.id) ? 'Cancel unpublish' : 'Unpublish'}
                            </button>
                          </div>
                        )}
                        {['pending_review', 'approved_pending_promotion'].includes(asset.status) && (
                          <button type="button" className="text-[11px] font-semibold text-error" onClick={() => toggleMediaReject(asset.id)}>
                            {rejected ? 'Cancel image rejection' : 'Reject image'}
                          </button>
                        )}
                        {rejected && <p className="text-[11px] text-error">This image will be rejected and removed from private pending storage.</p>}
                        {unpublishMediaIds.includes(asset.id) && <p className="text-[11px] text-error">This image will be removed from the public listing.</p>}
                        {asset.media_field === 'cover' && <p className="text-[10px] text-on-surface-variant">Cover promotion requires a Basic or Premium plan.</p>}{asset.media_field === 'gallery' && <p className="text-[10px] text-on-surface-variant">Gallery photos count toward the business plan photo limit.</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant/40 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">Private Owner Information</h3>
                <span className="text-[10px] font-semibold text-on-surface-variant">Admin only · never public</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-[11px] text-on-surface-variant">Owner Name</p><p className="font-semibold">{String(activeSubmission.payload.owner_name ?? activeOwnerRequest?.full_name ?? 'Not provided')}</p></div>
                <div><p className="text-[11px] text-on-surface-variant">Owner Gmail</p><p className="font-semibold break-all">{activeOwnerRequest?.email ?? 'No linked invitation email'}</p></div>
                <div><p className="text-[11px] text-on-surface-variant">Owner Phone</p><p className="font-semibold">{activeOwnerRequest?.phone ?? activeSubmission.contact_phone ?? 'Not provided'}</p></div>
                <div><p className="text-[11px] text-on-surface-variant">Existing authenticated submitter</p><p className="font-semibold">{activeSubmission.submitted_by ? 'Yes — account already exists' : 'No — invitation may be required'}</p></div>
              </div>
              {activeOwnerRequest ? (
                <div className="space-y-2 border-t border-outline-variant/30 pt-3">
                  {activeOwnerRequest.direct_auth_user_id ? (
                    <>
                      {activeOwnerRequest.status === 'approved' ? (
                        <p className="text-xs text-success">Owner registration is approved. The Owner account is active and this business is linked to it.</p>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-warning">Direct Owner account created — inactive until identity/authority verification and final approval</p>
                          <p className="text-[11px] text-on-surface-variant">No invitation email is sent. The applicant chose the password on the public form. Email ownership has not been verified, so independently verify the applicant before approval.</p>
                          <label className="flex items-start gap-2 text-xs font-semibold">
                            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={ownerIdentityVerified} onChange={(event) => setOwnerIdentityVerified(event.target.checked)} />
                            <span>I independently verified this applicant’s identity and authority. When checked, Save Approval will also activate the Owner account and link this business automatically once all required fields and image decisions are complete.</span>
                          </label>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="flex items-start gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-primary"
                          checked={inviteChecked}
                          disabled={activeOwnerRequest.invitation_status === 'sent' || activeSubmission.status === 'done'}
                          onChange={(event) => setInviteChecked(event.target.checked)}
                        />
                        <span>Send Owner Invitation Link</span>
                      </label>
                      <p className="text-[11px] text-on-surface-variant">Legacy registration: the Owner sets their own password through the secure email link.</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold">Invitation status: {statusLabel(activeOwnerRequest.invitation_status)}</span>
                        <span className="text-on-surface-variant">Attempts: {activeOwnerRequest.invitation_attempts}</span>
                      </div>
                      {activeOwnerRequest.invitation_last_error && <p className="text-xs text-error">{activeOwnerRequest.invitation_last_error}</p>}
                      {['pending', 'failed', 'processing'].includes(activeOwnerRequest.invitation_status) && activeSubmission.business_id && activeCoreReady && (
                        <Button size="sm" variant="outline" loading={busy} disabled={busy} onClick={() => void retryInvitation()} leftIcon={<Mail className="w-3.5 h-3.5" />}>{activeOwnerRequest.invitation_status === 'processing' ? 'Check / Retry Owner Invitation' : 'Retry Owner Invitation'}</Button>
                      )}
                      {activeOwnerRequest.invitation_status === 'sent' && <p className="text-xs text-success">Invitation was processed and this Owner is linked to the reviewed business.</p>}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant border-t border-outline-variant/30 pt-3">
                  No separate invitation record exists. If this submission belongs to an already authenticated Owner, their account association is handled by the existing owner identity.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant/40 p-3 space-y-2">
              <h3 className="font-bold text-sm">Public Listing Preview</h3>
              <p className="text-[11px] text-on-surface-variant">Only fields already approved or selected in this popup are included in this preview.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeFields.filter((field) =>
                  (field.status === 'approved_published' && !unpublishFieldKeys.includes(field.field_key)) || approvedFieldKeys.includes(field.field_key)
                ).map((field) => (
                  <div key={field.id} className="rounded-lg bg-surface-container-low p-2">
                    <p className="text-[10px] font-bold text-on-surface-variant">{FIELD_LABELS[field.field_key] ?? field.field_key}</p>
                    <p className="text-xs text-on-surface break-words">{formatValue(field.field_value, field.field_key, categories, areas)}</p>
                  </div>
                ))}
                {activeApprovedCore === 0 && <p className="text-xs text-on-surface-variant">No public fields have been approved yet.</p>}
              </div>
              {!activeCoreReady && <p className="text-xs font-semibold text-warning">Not public yet — {5 - activeApprovedCore} required field(s) still need approval.</p>}
            </section>

            <section className="space-y-2">
              <label className="text-xs font-bold text-on-surface" htmlFor="business-review-admin-note">Add Private Admin Note</label>
              {activeSubmission.admin_note && <p className="text-xs text-on-surface-variant whitespace-pre-wrap rounded-lg bg-surface-container-low p-2">Previous note: {activeSubmission.admin_note}</p>}
              <Textarea id="business-review-admin-note" rows={3} disabled={activeSubmission.status === 'done'} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Add an internal note — never shown publicly" />
            </section>

            <div className="sticky bottom-0 -mx-4 sm:-mx-5 px-4 sm:px-5 py-3 bg-surface-container-lowest border-t border-outline-variant/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xs text-on-surface-variant">
                <p>Selected field decisions: {approvedFieldKeys.length + Object.keys(rejectedFieldReasons).length + unpublishFieldKeys.length}</p>
                <p>Owner invitation: {inviteChecked ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="md" variant="outline" disabled={busy} onClick={closeReview}>Cancel</Button>
                <Button size="md" loading={busy} disabled={busy} onClick={() => void saveApproval()}>{activeOwnerRequest?.direct_auth_user_id && ownerIdentityVerified && activeCoreReady && allPendingMediaDecided ? 'Approve Business & Activate Owner' : 'Save Approval'}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          setActiveSubmissionId(null);
        }}
        title="Discard unsaved review decisions?"
        message="Your field selections, image decisions, invitation choice and Admin note have not been saved."
        confirmLabel="Discard Changes"
        destructive
      />
    </div>
  );
}
