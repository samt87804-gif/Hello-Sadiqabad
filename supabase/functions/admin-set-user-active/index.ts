import { createClient } from "npm:@supabase/supabase-js@2";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
const allow=(Deno.env.get("ALLOWED_ORIGINS")??"https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000").split(",").map(s=>s.trim());
function response(req:Request,data:unknown,status=200){const o=req.headers.get("origin")??"";if(o&&!allow.includes(o))return Response.json({ok:false,error:"Origin not allowed"},{status:403});return Response.json(data,{status,headers:{"Access-Control-Allow-Origin":o||allow[0],"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return response(req,{ok:true});if(req.method!=="POST")return response(req,{ok:false,error:"Method not allowed"},405);
const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");if(!token)return response(req,{ok:false,error:"Unauthorized"},401);
const {data:u,error:ue}=await db.auth.getUser(token);if(ue||!u.user)return response(req,{ok:false,error:"Unauthorized"},401);
const {data:actor}=await db.from("profiles").select("role,is_active").eq("id",u.user.id).single();if(actor?.role!=="super_admin"||!actor.is_active)return response(req,{ok:false,error:"Super admin only"},403);
let b:any={};try{b=await req.json();}catch{}const id=String(b.user_id??"");if(!/^[0-9a-f-]{36}$/i.test(id)||typeof b.is_active!=="boolean")return response(req,{ok:false,error:"Invalid account status"},400);
if(id===u.user.id)return response(req,{ok:false,error:"You cannot deactivate your own administrator account"},400);
const {data:target}=await db.from("profiles").select("role").eq("id",id).single();if(!target)return response(req,{ok:false,error:"User not found"},404);if(target.role==="super_admin")return response(req,{ok:false,error:"Another super admin cannot be disabled here"},403);
const {error}=await db.auth.admin.updateUserById(id,{ban_duration:b.is_active?"none":"876000h"});if(error)return response(req,{ok:false,error:error.message},400);
const {error:pe}=await db.from("profiles").update({is_active:b.is_active,updated_at:new Date().toISOString()}).eq("id",id);if(pe)return response(req,{ok:false,error:pe.message},400);
await db.from("staff_members").update({is_active:b.is_active,updated_at:new Date().toISOString()}).eq("user_id",id);
return response(req,{ok:true});
});