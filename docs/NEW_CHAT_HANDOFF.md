# New Chat Handoff — Hello Sadiqabad Domain & SEO

Paste the message below into a new ChatGPT chat inside the **Hello Sadiqabad** Project. The full plan is in `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` in the GitHub repository. Read that file first and treat it as the source of truth.

---

## Copy this message into the new chat

We are continuing work on my existing project **Hello Sadiqabad**. Do not start from scratch. First inspect the GitHub repository and read:

- `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md` — main phased plan and current verified status.
- `PROJECT_ROADMAP.md` — existing application roadmap and outstanding work.
- `DEPLOYMENT.md` — production deployment instructions.
- Relevant existing security/roadmap documents only when needed.

### Live infrastructure
- GitHub: `samt87804-gif/Hello-Sadiqabad`
- Branch: `main`
- Website/canonical domain: https://hellosadiqabad.com
- Cloudflare Pages project: `hello-sadiqabad`
- Pages origin: `https://hello-sadiqabad-2bs.pages.dev`
- Cloudflare account: `1d6a40b5558a2326be1faf79c67e2c4a`
- Cloudflare zone: `047a89dfd18e46c356ed2ba3b473ee65`
- Supabase project ref: `efwohfzqitevkuybnyif`

Use the connected GitHub, Cloudflare and Supabase tools where available. Read the relevant plugin skills before working with those services. Never ask me for passwords, service-role keys or private credentials. Do not expose keys in code or chat.

### Work already completed (verify before changing)
- Cloudflare custom domain `hellosadiqabad.com` is active.
- SSL mode Full, Always Use HTTPS ON, minimum TLS 1.2.
- Automatic HTTPS Rewrites, HTTP/3 and Brotli ON.
- Pages production `VITE_SITE_URL` updated to `https://hellosadiqabad.com`; existing other variables preserved.
- Security headers updated in `public/_headers` (CSP, one-year HSTS, nosniff, SAMEORIGIN, strict-origin referrer policy, Permissions-Policy).
- Latest deployment for commit `a061a78018133d14da17a0ecaf8505537e4e024e` completed successfully.
- Supabase view `public.owner_public_profile_directory` was changed to `security_invoker=true` and verified. The Security Advisor's SECURITY DEFINER view finding cleared.
- Supabase leaked-password protection is still disabled and needs owner action.
- Supabase Auth Site URL/redirect URLs have NOT yet been configured.
- Google Search Console Domain property is NOT yet verified.
- Sitemap did not exist at the last audit; `/sitemap.xml` returned 404.
- `www.hellosadiqabad.com` was not configured as a Pages custom domain at the last audit.
- Do not claim Google indexing or rankings without Search Console evidence.

### My role (website owner)
I will do only the tasks that require my Google/Supabase dashboard or real-world owner participation:
1. In Supabase Auth URL Configuration set Site URL to `https://hellosadiqabad.com`.
2. Add allowed redirect URLs:
   - `https://hellosadiqabad.com/**`
   - `https://hellosadiqabad.com/reset-password`
   - `https://hellosadiqabad.com/change-password`
   Save and confirm when done.
3. Enable leaked-password protection in Supabase Auth password/security settings and confirm.
4. In Google Search Console create a **Domain** property for `hellosadiqabad.com`.
5. Copy the DNS TXT verification record Google gives me and send only that DNS record's name/value to ChatGPT. Never send my Google password.
6. After ChatGPT adds the TXT record in Cloudflare, I will click Verify in Search Console.
7. After sitemap is deployed, I will submit `https://hellosadiqabad.com/sitemap.xml` in Search Console → Sitemaps.
8. I will use URL Inspection on the homepage and important public URLs and request indexing once the final URLs are ready.
9. I will share Search Console reports/screenshots/exports when asked, and provide accurate local business information, official sources, corrections and authorized photos.
10. I will encourage genuine local businesses to claim their own eligible Google Business Profiles and share their directory pages naturally. I will not buy searches, clicks, reviews or backlinks.

### ChatGPT's role
You own the technical work:
- Read the master plan and continue at the first incomplete task.
- Work phase by phase, starting with Phase 0 remaining security/domain verification, then Phase 1 Technical SEO.
- Inspect code, live configuration, database schema/RLS/migrations before changing anything.
- Implement code, Cloudflare DNS/settings, Supabase changes supported by tools, sitemap, robots, canonical URLs, metadata, structured data, local SEO pages and technical fixes as laid out in the master plan.
- Preserve existing data. Never run destructive database changes without my explicit approval.
- Build, test, deploy and verify every phase before marking it complete.
- Update the master plan and project roadmap with evidence after each verified batch.
- Ask me only for steps that genuinely require my dashboard, Google verification, factual local knowledge or approval.
- Be transparent: distinguish completed, deployed, verified and waiting for my action. Never claim browser testing unless you performed it.
- Do not promise top rankings or a fixed time. Do not use fake searches, bots, click farms, fake reviews or purchased backlinks.

### Immediate next task
Read `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md`, verify current live settings (they may have changed), and continue the first unchecked Phase 0 technical verification task. Also tell me clearly to complete the Supabase Auth URL/password-protection tasks and Google Search Console Domain/TXT verification described above. Once Phase 0 is accepted, proceed to Phase 1 Technical SEO. Do not repeat completed work unnecessarily.
