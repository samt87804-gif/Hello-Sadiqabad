const SITE_ORIGIN = 'https://hellosadiqabad.com';
const CRAWLER = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterest|googlebot|google-inspectiontool|googleother|bingbot|skypeuripreview/i;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}
function setMeta(html, attribute, name, value) {
  const pattern = new RegExp('<meta\\b(?=[^>]*\\b' + attribute + '\\s*=\\s*["\\x27]' + name + '["\\x27])[^>]*>', 'i');
  const tag = '<meta ' + attribute + '="' + escapeHtml(name) + '" content="' + escapeHtml(value) + '" />';
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\\/head>/i, tag + '\\n</head>');
}
export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET' || !CRAWLER.test(String(request.headers.get('user-agent') || ''))) return context.next();
  const page = await context.next();
  if (!page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;
  try {
    const html = await page.clone().text();
    let output = /<title>[\\s\\S]*?<\\/title>/i.test(html)
      ? html.replace(/<title>[\\s\\S]*?<\\/title>/i, '<title>SDK Jobs — Local Vacancies in Sadiqabad | Hello Sadiqabad</title>')
      : html.replace(/<head[^>]*>/i, (head) => head + '<title>SDK Jobs — Local Vacancies in Sadiqabad | Hello Sadiqabad</title>');
    const description = 'Browse reviewed local vacancies in Sadiqabad. Employer identity stays private. Contact Hello Sadiqabad through the approved recruitment WhatsApp channel.';
    const canonical = SITE_ORIGIN + '/sdk-jobs';
    const tags = [
      ['name','description',description],['name','robots','index,follow,max-image-preview:large'],
      ['property','og:title','SDK Jobs — Local Vacancies in Sadiqabad | Hello Sadiqabad'],
      ['property','og:description',description],['property','og:type','website'],
      ['property','og:site_name','Hello Sadiqabad'],['property','og:url',canonical],
      ['property','og:image',SITE_ORIGIN + '/site-logo.png'],
      ['name','twitter:card','summary_large_image'],
      ['name','twitter:title','SDK Jobs — Local Vacancies in Sadiqabad | Hello Sadiqabad'],
      ['name','twitter:description',description],['name','twitter:image',SITE_ORIGIN + '/site-logo.png'],
    ];
    for (const [attribute,name,value] of tags) output = setMeta(output,attribute,name,value);
    const canonicalTag = '<link rel="canonical" href="' + escapeHtml(canonical) + '" />';
    const canonicalPattern = /<link\\b(?=[^>]*\\brel\\s*=\\s*["']canonical["'])[^>]*>/i;
    output = canonicalPattern.test(output) ? output.replace(canonicalPattern,canonicalTag) : output.replace(/<\\/head>/i,canonicalTag + '\\n</head>');
    const headers = new Headers(page.headers);
    headers.delete('content-length'); headers.delete('content-encoding'); headers.delete('etag');
    headers.set('cache-control','public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    headers.set('x-content-type-options','nosniff');
    return new Response(output,{status:page.status,statusText:page.statusText,headers});
  } catch {
    return page;
  }
}
