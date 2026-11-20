import test from 'node:test';
import assert from 'node:assert/strict';
import {getGovernmentJobDisplayStatus,getPakistanToday,isSafeGovernmentJobUrl,slugifyGovernmentJobTitle} from './governmentJobs';

test('Pakistan date uses Asia/Karachi calendar day',()=>{
 assert.equal(getPakistanToday(new Date('2026-11-20T20:30:00.000Z')),'2026-11-21');
});
test('job status derives expiry and closing-soon from Pakistan date',()=>{
 const job={status:'published' as const,deadline_at:'2026-11-27'};
 assert.equal(getGovernmentJobDisplayStatus(job,'2026-11-20'),'closing_soon');
 assert.equal(getGovernmentJobDisplayStatus({...job,application_open_at:'2026-11-22'},'2026-11-20'),'upcoming');
 assert.equal(getGovernmentJobDisplayStatus(job,'2026-11-27'),'closing_soon');
 assert.equal(getGovernmentJobDisplayStatus(job,'2026-11-28'),'expired');
 assert.equal(getGovernmentJobDisplayStatus({...job,deadline_at:null},'2026-11-20'),'open');
 assert.equal(getGovernmentJobDisplayStatus({...job,status:'closed'},'2026-11-20'),'closed');
 assert.equal(getGovernmentJobDisplayStatus({...job,status:'expired'},'2026-11-20'),'expired');
 assert.equal(getGovernmentJobDisplayStatus({...job,status:'cancelled'},'2026-11-20'),'cancelled');
});
test('official URLs must use HTTPS and cannot use known shorteners',()=>{
 assert.equal(isSafeGovernmentJobUrl('https://jobs.punjab.gov.pk/'),true);
 assert.equal(isSafeGovernmentJobUrl('https://www.njp.gov.pk/'),true);
 assert.equal(isSafeGovernmentJobUrl('http://jobs.punjab.gov.pk/'),false);
 assert.equal(isSafeGovernmentJobUrl('javascript:alert(1)'),false);
 assert.equal(isSafeGovernmentJobUrl('https://bit.ly/abc'),false);
 assert.equal(isSafeGovernmentJobUrl('https://sub.t.co/abc'),false);
 assert.equal(isSafeGovernmentJobUrl('https://user:pass@example.gov.pk/'),false);
 assert.equal(isSafeGovernmentJobUrl(null),true);
});
test('job slugs are normalized and URL-safe',()=>{
 assert.equal(slugifyGovernmentJobTitle('Assistant Director (BS-17) — Punjab'),'assistant-director-bs-17-punjab');
 assert.equal(slugifyGovernmentJobTitle('  Multiple   Spaces  '),'multiple-spaces');
 assert.equal(slugifyGovernmentJobTitle(''),'');
});
