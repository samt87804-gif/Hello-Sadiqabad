import { onRequestGovernmentSocialPreview } from '../_shared/governmentSocialPreview.js';

export async function onRequest(context) {
  return onRequestGovernmentSocialPreview(context, {
    table: 'government_schemes',
    select: 'slug,title_en,title_ur,summary_en,summary_ur,benefit_details,source_name,image_url',
    statusFilter: 'eq.published',
    pathPrefix: '/government-schemes/',
    toContent: (scheme) => ({
      title: scheme.title_en || scheme.title_ur || 'Government Scheme',
      description: [scheme.summary_en || scheme.summary_ur || scheme.benefit_details, scheme.source_name].filter(Boolean).join(' · '),
      imageAlt: scheme.title_en || scheme.title_ur || 'Official government scheme poster',
    }),
  });
}
