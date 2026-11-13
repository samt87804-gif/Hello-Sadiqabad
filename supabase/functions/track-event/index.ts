import { createClient } from "npm:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL")!;
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=(Deno.env.get("ALLOWED_ORIGINS")??"https://hellosadiqabad.com,http://localhost:3000").split(",").map(x=>x.trim()).filter(Boolean);
function cors(req:Request){const origin=req.headers.get("origin")??"";if(origin&&!allowed.includes(origin))return null;return {"Access-Control-Allow-Origin":origin||allowed[0]||"https://hellosadiqabad.com","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};}
function reply(req:Request,data:unknown,status=200){const h=cors(req);if(!h)return new Response(JSON.stringify({ok:false,error:"Origin not allowed"}),{status:403,headers:{"Content-Type":"application/json"}});return new Response(JSON.stringify(data),{status,headers:{...h,"Content-Type":"application/json"}});}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return reply(req,{ok:true});if(req.method!=="POST")return reply(req,{ok:false,error:"Method not allowed"},405);
let b:any={};try{b=await req.json();}catch{}
if(b.event_type==="ad_impression"&&typeof b.ad_id==="string"){const {data:ad}=await db.from("ads").select("impressions").eq("id",b.ad_id).single();if(ad)await db.from("ads").update({impressions:Number(ad.impressions??0)+1}).eq("id",b.ad_id);return reply(req,{ok:true});}
const types=["view","call","whatsapp","directions","share","search_appearance"];if(!types.includes(b.event_type)||typeof b.business_id!=="string")return reply(req,{ok:false,error:"Invalid event"},400);
const {data:limited,error:limitError}=await db.rpc("check_rate_limit",{p_key:"track:"+String(b.session_id??"anonymous"),p_limit:300,p_window_seconds:3600});if(limitError||limited!==true)return reply(req,{ok:false,error:"Rate limit exceeded"},429);
const {data:biz}=await db.from("businesses").select("id").eq("id",b.business_id).eq("status","published").single();if(!biz)return reply(req,{ok:true});
const {error}=await db.from("business_events").insert({business_id:b.business_id,event_type:b.event_type,ad_id:b.ad_id??null,session_id:String(b.session_id??crypto.randomUUID()).slice(0,100)});if(error)return reply(req,{ok:false,error:"Could not track event"},400);
const counters:any={view:"view_count",call:"call_count",whatsapp:"whatsapp_count"};if(counters[b.event_type]){const col=counters[b.event_type];const {data:r}=await db.from("businesses").select(col).eq("id",b.business_id).single();await db.from("businesses").update({[col]:Number((r as any)?.[col]??0)+1}).eq("id",b.business_id);}
const date=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Karachi"});const cols:any={view:"views",call:"calls",whatsapp:"whatsapp",directions:"directions",share:"shares"};if(cols[b.event_type]){const {data:r}=await db.from("daily_business_stats").select("*").eq("business_id",b.business_id).eq("stat_date",date).maybeSingle();const next:any={business_id:b.business_id,stat_date:date,views:r?.views??0,calls:r?.calls??0,whatsapp:r?.whatsapp??0,directions:r?.directions??0,shares:r?.shares??0};next[cols[b.event_type]]++;await db.from("daily_business_stats").upsert(next,{onConflict:"business_id,stat_date"});}
if(b.ad_id&&typeof b.ad_id==="string"){const {data:ad}=await db.from("ads").select("clicks").eq("id",b.ad_id).single();if(ad)await db.from("ads").update({clicks:Number(ad.clicks??0)+1}).eq("id",b.ad_id);}
return reply(req,{ok:true});
});