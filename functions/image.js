const ALLOWED_IMAGE_HOST = /(^|\.)googleusercontent\.com$/i;
const SUPABASE_STORAGE_HOST = "efwohfzqitevkuybnyif.supabase.co";
const SUPABASE_PUBLIC_BUCKET_PREFIX = "/storage/v1/object/public/Hello%20Sadiqabad/";
import { fetchWithTimeout } from './_shared/fetchWithTimeout.js';

export async function onRequestGet({request}) {
  const requestUrl=new URL(request.url),source=requestUrl.searchParams.get("url");
  if(!source)return new Response("Missing image URL",{status:400});
  let imageUrl;try{imageUrl=new URL(source);}catch{return new Response("Invalid image URL",{status:400});}
  const isGoogleImage=ALLOWED_IMAGE_HOST.test(imageUrl.hostname);
  const isSupabasePublicImage=imageUrl.hostname===SUPABASE_STORAGE_HOST&&imageUrl.pathname.startsWith(SUPABASE_PUBLIC_BUCKET_PREFIX);
  if(imageUrl.protocol!=="https:"||(!isGoogleImage&&!isSupabasePublicImage))return new Response("Image host is not allowed",{status:403});
  const cacheKey=new Request(requestUrl.origin+requestUrl.pathname+"?url="+encodeURIComponent(imageUrl.toString()));
  const cached=await caches.default.match(cacheKey);if(cached)return cached;
  let upstream;
  try{upstream=await fetchWithTimeout(imageUrl.toString(),{headers:{Accept:"image/avif,image/webp,image/apng,image/*,*/*;q=0.8",Referer:"https://www.google.com/maps/","User-Agent":"Mozilla/5.0 (compatible; HelloSadiqabadImageProxy/1.0)"},cf:{cacheEverything:true,cacheTtl:604800}},8000);}
  catch{return new Response("Unable to retrieve source image",{status:502});}
  const contentType=upstream.headers.get("content-type")||"";
  if(!upstream.ok||!contentType.toLowerCase().startsWith("image/"))return new Response("Source image is unavailable",{status:404});
  const response=new Response(upstream.body,{status:200,headers:{"Content-Type":contentType,"Cache-Control":"public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000","Access-Control-Allow-Origin":"*","X-Content-Type-Options":"nosniff"}});
  await caches.default.put(cacheKey,response.clone());return response;
}