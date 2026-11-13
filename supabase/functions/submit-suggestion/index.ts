import { createClient } from "npm:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL")!;
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=(Deno.env.get("ALLOWED_ORIGINS")??"https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000").split(",").map(x=>x.trim()).filter(Boolean);
function cors(req:Request){const origin=req.headers.get("origin")??"";if(origin&&!allowed.includes(origin))return null;return {"Access-Control-Allow-Origin":origin||allowed[0]||"https://hellosadiqabad.com","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};}
function reply(req:Request,data:unknown,status=200){const h=cors(req);if(!h)return new Response(JSON.stringify({ok:false,error:"Origin not allowed"}),{status:403,headers:{"Content-Type":"application/json"}});return new Response(JSON.stringify(data),{status,headers:{...h,"Content-Type":"application/json"}});}
async function limited(key:string,limit=5,seconds=3600){const {data,error}=await db.rpc("check_rate_limit",{p_key:key,p_limit:limit,p_window_seconds:seconds});return !error&&data===true;}
async function body(req:Request){try{return await req.json();}catch{return {};}}
function validString(x:unknown,min:number,max:number){return typeof x==="string"&&x.trim().length>=min&&x.trim().length<=max;}

Deno.serve(async(req)=>{if(req.method==="OPTIONS")return reply(req,{ok:true});if(req.method!=="POST")return reply(req,{ok:false,error:"Method not allowed"},405);
const b=await body(req);if(b.website_hp)return reply(req,{ok:true});const types=["new_business","correction","claim","phone_suggestion","report","broken_image"];
if(!types.includes(b.type)||!b.payload||typeof b.payload!=="object"||JSON.stringify(b.payload).length>8192)return reply(req,{ok:false,error:"Invalid submission"},400);
if(!await limited("suggestion:"+String(b.session_id??"anonymous"),5,3600))return reply(req,{ok:false,error:"Please try again later"},429);
const {data,error}=await db.from("submissions").insert({type:b.type,business_id:b.business_id??null,payload:b.payload,contact_name:typeof b.contact_name==="string"?b.contact_name.trim().slice(0,100):null,contact_phone:typeof b.contact_phone==="string"?b.contact_phone.trim().slice(0,30):null,status:"new"}).select().single();
if(error)return reply(req,{ok:false,error:"Could not submit request"},400);return reply(req,{ok:true,data});
});