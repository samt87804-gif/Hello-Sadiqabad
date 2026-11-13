import { createClient } from "npm:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL")!;
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=(Deno.env.get("ALLOWED_ORIGINS")??"https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000").split(",").map(x=>x.trim()).filter(Boolean);
function cors(req:Request){const origin=req.headers.get("origin")??"";if(origin&&!allowed.includes(origin))return null;return {"Access-Control-Allow-Origin":origin||allowed[0]||"https://hellosadiqabad.com","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};}
function reply(req:Request,data:unknown,status=200){const h=cors(req);if(!h)return new Response(JSON.stringify({ok:false,error:"Origin not allowed"}),{status:403,headers:{"Content-Type":"application/json"}});return new Response(JSON.stringify(data),{status,headers:{...h,"Content-Type":"application/json"}});}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return reply(req,{ok:true});if(req.method!=="POST")return reply(req,{ok:false,error:"Method not allowed"},405);
let b:any={};try{b=await req.json();}catch{}
const {data:limited,error:limitError}=await db.rpc("check_rate_limit",{p_key:"track:"+String(b.session_id??"anonymous"),p_limit:300,p_window_seconds:3600});if(limitError||limited!==true)return reply(req,{ok:false,error:"Rate limit exceeded"},429);
if(b.event_type==="search"){const query=String(b.query??"").trim().slice(0,120);const count=Number(b.results_count);if(query.length<1||!Number.isInteger(count)||count<0||count>100000||JSON.stringify(b.filters??{}).length>2048)return reply(req,{ok:false,error:"Invalid search event"},400);const {error}=await db.from("search_logs").insert({query,filters:b.filters&&typeof b.filters==="object"?b.filters:{},results_count:count});if(error)return reply(req,{ok:false,error:"Could not log search"},400);return reply(req,{ok:true});}
if(b.event_type==="ad_impression"&&typeof b.ad_id==="string"){await db.rpc("increment_ad_stat",{p_ad_id:b.ad_id,p_stat:"impression"});return reply(req,{ok:true});}
const types=["view","call","whatsapp","directions","share","search_appearance"];if(!types.includes(b.event_type)||typeof b.business_id!=="string")return reply(req,{ok:false,error:"Invalid event"},400);
const {data:biz}=await db.from("businesses").select("id").eq("id",b.business_id).eq("status","published").single();if(!biz)return reply(req,{ok:true});
const {error}=await db.from("business_events").insert({business_id:b.business_id,event_type:b.event_type,ad_id:b.ad_id??null,session_id:String(b.session_id??crypto.randomUUID()).slice(0,100)});if(error)return reply(req,{ok:false,error:"Could not track event"},400);
const {error:statError}=await db.rpc("increment_business_stat",{b_id:b.business_id,stat:b.event_type});if(statError)return reply(req,{ok:false,error:"Could not update business stats"},500);
if(b.ad_id&&typeof b.ad_id==="string")await db.rpc("increment_ad_stat",{p_ad_id:b.ad_id,p_stat:"click"});
return reply(req,{ok:true});
});