import { createClient } from "npm:@supabase/supabase-js@2";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
const allow=(Deno.env.get("ALLOWED_ORIGINS")??"https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000").split(",").map(s=>s.trim());
function response(req:Request,data:unknown,status=200){const o=req.headers.get("origin")??"";if(o&&!allow.includes(o))return Response.json({ok:false,error:"Origin not allowed"},{status:403});return Response.json(data,{status,headers:{"Access-Control-Allow-Origin":o||allow[0],"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});}
async function caller(req:Request){const t=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");if(!t)return null;const {data,error}=await db.auth.getUser(t);return error?null:data.user;}
async function canManage(uid:string){const {data:p}=await db.from("profiles").select("role,is_active").eq("id",uid).single();return p?.role==="super_admin"&&p.is_active===true;}

Deno.serve(async(req)=>{if(req.method==="OPTIONS")return response(req,{ok:true});if(req.method!=="POST")return response(req,{ok:false,error:"Method not allowed"},405);
const u=await caller(req);if(!u)return response(req,{ok:false,error:"Unauthorized"},401);if(!await canManage(u.id))return response(req,{ok:false,error:"Permission denied"},403);
let b:any={};try{b=await req.json();}catch{}const id=String(b.user_id??""),password=String(b.new_password??"");
if(!/^[0-9a-f-]{36}$/i.test(id)||password.length<8)return response(req,{ok:false,error:"Invalid reset details"},400);
const {error}=await db.auth.admin.updateUserById(id,{password});if(error)return response(req,{ok:false,error:error.message},400);
const {error:pe}=await db.from("profiles").update({must_change_password:true,updated_at:new Date().toISOString()}).eq("id",id);if(pe)return response(req,{ok:false,error:pe.message},400);
return response(req,{ok:true});
});