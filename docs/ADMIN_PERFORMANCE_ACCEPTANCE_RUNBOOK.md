# Admin Business & Data Quality — Browser Acceptance Runbook

This runbook completes the remaining authenticated browser evidence for Phase 1 of the Final Product Expansion Master Plan. It does not replace CI, code review, or the existing permission/RLS controls.

## Preconditions

- Use the canonical production site: https://hellosadiqabad.com
- Sign in with an existing authorized Admin account. Do not share credentials, session cookies, access tokens, or private customer data.
- Use a representative desktop browser first, then repeat the smoke checks on a mobile viewport/device.
- Record browser/version, viewport, approximate network conditions, date/time (Pakistan time), and the Admin role/permission set. Redact personal identifiers.
- Do not create, edit, approve, reject, delete, export or upload real production records solely for this test. Use read-only navigation/search/filter/page controls. If a write-action roundtrip is needed, obtain approval for a clearly identified disposable fixture and its cleanup first.

## Browser timing capture

Open DevTools → Console while signed in and paste:

```js
window.__hsAdminPerf = (() => {
  const marks = [];
  const start = (label) => {
    performance.mark(`hs:${label}:start`);
    marks.push(label);
  };
  const end = (label) => {
    performance.mark(`hs:${label}:end`);
    try {
      performance.measure(`hs:${label}`, `hs:${label}:start`, `hs:${label}:end`);
    } catch {}
    const entry = performance.getEntriesByName(`hs:${label}`).at(-1);
    console.table(entry ? [{ action: label, duration_ms: Math.round(entry.duration * 10) / 10 }] : []);
    return entry?.duration ?? null;
  };
  const report = () => {
    const nav = performance.getEntriesByType('navigation').at(-1);
    const resources = performance.getEntriesByType('resource');
    const supabase = resources.filter((r) => /supabase\.(co|in)/i.test(r.name));
    const report = {
      url: location.href,
      navigation_domContentLoaded_ms: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      navigation_load_ms: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      resource_count: resources.length,
      supabase_resource_count: supabase.length,
      supabase_transfer_bytes: supabase.reduce((n, r) => n + (r.transferSize || 0), 0),
      largest_resources: resources.slice().sort((a, b) => b.duration - a.duration).slice(0, 10)
        .map((r) => ({ name: r.name.split('?')[0].slice(-100), duration_ms: Math.round(r.duration), transfer_bytes: r.transferSize || 0 }))
    };
    console.log(report);
    return report;
  };
  return { start, end, report };
})();
```

For each route, start a measurement immediately before selecting the Admin navigation item, then end it as soon as the route's primary list/filter controls are usable:

```js
__hsAdminPerf.start('businesses-cold');
// Select Businesses in the Admin navigation and wait until the list/filter controls are usable.
__hsAdminPerf.end('businesses-cold');
__hsAdminPerf.report();
```

Repeat after navigating away and back for warm-cache measurements. Repeat the same sequence for Data Quality. Record at least three runs per route; report median values rather than the single fastest run. The timing above is a manual click-to-usable measurement; it is not a synthetic lab score.

## Required desktop checks

- [ ] Businesses cold open and warm revisit; record click-to-usable duration for each run.
- [ ] Data Quality cold open and warm revisit; record click-to-usable duration for each run.
- [ ] Business search by name/phone/area; clear search; confirm result count and page reset.
- [ ] Business status/category/featured filters; confirm combinations and no stale page.
- [ ] Navigate between 50-item pages; confirm no duplicate or missing rows at page boundaries.
- [ ] Select all filtered businesses and clear selection without submitting a bulk action.
- [ ] Open a business detail/edit modal and close it without saving; confirm the selected business is correct.
- [ ] Data Quality category/status filters and 50-item pagination; confirm issue counts and page reset.
- [ ] Confirm CSV export remains complete only if an approved, non-sensitive export test is available; do not download personal data for this smoke test.
- [ ] Check loading, empty and retry/error UI using a safe test condition; do not induce production writes or alter permissions.

## Required mobile checks

- [ ] Open Businesses and Data Quality at a representative 390px-wide viewport.
- [ ] Confirm no horizontal overflow and all primary controls remain reachable.
- [ ] Search, filters and pagination remain usable.
- [ ] Business detail/edit modal opens and closes without accidental save.
- [ ] No console errors or uncaught promise rejections during the smoke test.

## Permission and privacy checks

- [ ] Confirm the signed-in Admin sees only the tabs/actions allowed by their assigned permissions.
- [ ] Confirm a role without the relevant permission cannot open protected Admin content/actions. Prefer an existing least-privilege test account; do not change a live user's role just for testing.
- [ ] Confirm private owner contact details are not shown in public pages or public metadata.
- [ ] Confirm no Admin/Owner data is placed in browser local storage or the public offline snapshot.
- [ ] Confirm read errors are visible/retryable and do not silently substitute demo records.

## Evidence record

Record the following in the Admin Performance Optimization Plan before marking Phase 1 accepted:

| Field | Result |
|---|---|
| Test date/time (Pakistan) | |
| Browser/version | |
| Desktop viewport/device | |
| Mobile viewport/device | |
| Admin role and relevant permissions (no email/name) | |
| Business cold-open runs (ms) | |
| Business warm-open runs (ms) | |
| Data Quality cold-open runs (ms) | |
| Data Quality warm-open runs (ms) | |
| Search/filter/pagination result | |
| Detail/modal result | |
| Permission/error/retry result | |
| Console errors | |
| Reviewer notes / unresolved issues | |

Phase 1 remains **in progress / not accepted** until the evidence above is captured and reviewed. Do not invent timings or mark checks complete based only on source review, CI, deployment, or an anonymous browser session.
