import { onRequestGovernmentSocialPreview } from '../_shared/governmentSocialPreview.js';

export async function onRequest(context) {
  return onRequestGovernmentSocialPreview(context, {
    table: 'government_jobs',
    select: 'slug,title_en,title_ur,summary_en,summary_ur,department_name,location_text,image_url',
    statusFilter: 'in.(published,closed,expired)',
    pathPrefix: '/government-jobs/',
    toContent: (job) => ({
      title: job.title_en || job.title_ur || 'Government Job',
      description: [job.summary_en, job.summary_ur, job.department_name, job.location_text].filter(Boolean).join(' · '),
      imageAlt: job.title_en || job.title_ur || 'Official government job poster',
    }),
  });
}
