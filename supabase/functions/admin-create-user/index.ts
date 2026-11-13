import { createClient } from "npm:@supabase/supabase-js@2";
const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
const allow=(Deno.env.get("ALLOWED_ORIGINS")??"https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000").split(",").map(s=>s.trim());
function response(req:Request,data:unknown,status=200){const o=req.headers.get("origin")??"";if(o&&!allow.includes(o))return Response.json({ok:false,error:"Origin not allowed"},{status:403});return Response.json(data,{status,headers:{"Access-Control-Allow-Origin":o||allow[0],"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});}
async function caller(req:Request){const t=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");if(!t)return null;const {data,error}=await db.auth.getUser(t);return error?null:data.user;}
async function permission(uid:string){const {data:p}=await db.from("profiles").select("role,is_active").eq("id",uid).single();if(p?.role==="super_admin"&&p.is_active)return {allowed:true,root:true};if(p?.role!=="staff"||!p.is_active)return {allowed:false,root:false};const {data:s}=await db.from("staff_members").select("staff_types,permissions,is_active").eq("user_id",uid).single();if(!s?.is_active)return {allowed:false,root:false};const inferred=(s.staff_types??[]).includes("sales_onboarding");const override=s.permissions?.["owners.create"]??s.permissions?.["all"];return {allowed:override===true||(override!==false&&inferred),root:false};}
Deno.serve(async(req)=>{if(req.method==="OPTIONS")return response(req,{ok:true});if(req.method!=="POST")return response(req,{ok:false,error:"Method not allowed"},405);const u=await caller(req);if(!u)return response(req,{ok:false,error:"Unauthorized"},401);const p=await permission(u.id);if(!p.allowed)return response(req,{ok:false,error:"Permission denied"},403);let b:any={};try{b=await req.json();}catch{}
const email=String(b.email??"").trim().toLowerCase(),password=String(b.password??""),role=String(b.role??"owner");
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8||!["owner","staff","super_admin"].includes(role)||!String(b.full_name??"").trim())return response(req,{ok:false,error:"Invalid user details"},400);
if((role==="super_admin"||role==="staff")&&!p.root)return response(req,{ok:false,error:"Only a super admin can create staff or admin accounts"},403);
const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:String(b.full_name).trim()}});
if(error||!data.user)return response(req,{ok:false,error:error?.message??"Could not create account"},400);
const id=data.user.id;
const {error:pe}=await db.from("profiles").upsert({id,role,full_name:String(b.full_name).trim(),phone:typeof b.phone==="string"?b.phone:null,must_change_password:true});
if(pe)return response(req,{ok:false,error:pe.message},400);
if(role==="staff"){const {error:se}=await db.from("staff_members").upsert({user_id:id,staff_types:Array.isArray(b.staff_types)?b.staff_types:[],permissions:b.permissions??{},is_active:true});if(se)return response(req,{ok:false,error:se.message},400);}
if(typeof b.assign_business_id==="string"){const {error:be}=await db.from("businesses").update({owner_id:id}).eq("id",b.assign_business_id);if(be)return response(req,{ok:false,error:be.message},400);}
return response(req,{ok:true,data:{user_id:id}});
});