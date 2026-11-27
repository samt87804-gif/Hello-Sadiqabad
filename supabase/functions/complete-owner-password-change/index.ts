import { createClient } from "npm:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if(!url||!key)throw new Error("Missing Supabase service configuration");
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=(Deno.env.get("ALLOWED_ORIGINS")??"https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173").split(",").map(v=>v.trim());
function reply(req:Request,data:unknown,status=200){const o=req.headers.get("origin")??"";if(o&&!origins.includes(o))return Response.json({ok:false,error:"Origin not allowed"},{status:403});return Response.json(data,{status,headers:{"Access-Control-Allow-Origin":o||origins[0],"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Cache-Control":"no-store"}});}
Deno.serve(async(req:Request)=>{if(req.method==="OPTIONS")return reply(req,{ok:true});if(req.method!=="POST")return reply(req,{ok:false,error:"Method not allowed"},405);
let consumedId:string|null=null;
try{
 const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");
 if(!token)return reply(req,{ok:false,error:"Sign in to your Owner account first"},401);
 const {data:auth,error:authError}=await db.auth.getUser(token);
 if(authError||!auth.user)return reply(req,{ok:false,error:"Your session could not be verified"},401);
 const {data:profile,error:profileError}=await db.from("profiles").select("role,is_active").eq("id",auth.user.id).maybeSingle();
 if(profileError||profile?.role!=="owner"||profile.is_active!==true)return reply(req,{ok:false,error:"An active Owner account is required"},403);
 const body=await req.json().catch(()=>null) as Record<string,unknown>|null;
 const password=typeof body?.password==="string"?body.password:"";
 if(password.length<8||password.length>72)return reply(req,{ok:false,error:"Password must be between 8 and 72 characters"},400);
 const now=new Date().toISOString();
 const {data:approval,error:approvalError}=await db.from("owner_password_change_requests")
  .select("id,expires_at").eq("user_id",auth.user.id).eq("status","approved").gt("expires_at",now)
  .order("reviewed_at",{ascending:false}).limit(1).maybeSingle();
 if(approvalError||!approval)return reply(req,{ok:false,error:"No valid Admin-approved password change is available. Submit a request first."},403);
 const {data:consumed,error:consumeError}=await db.from("owner_password_change_requests")
  .update({status:"consumed",consumed_at:now,updated_at:now})
  .eq("id",approval.id).eq("status","approved").gt("expires_at",now)
  .select("id").maybeSingle();
 if(consumeError)throw consumeError;
 if(!consumed)return reply(req,{ok:false,error:"This approval has expired or has already been used"},409);
 consumedId=approval.id;
 const {error:updateError}=await db.auth.admin.updateUserById(auth.user.id,{password});
 if(updateError){
   await db.from("owner_password_change_requests").update({status:"approved",consumed_at:null,updated_at:new Date().toISOString()})
    .eq("id",approval.id).eq("status","consumed");
   consumedId=null;
   return reply(req,{ok:false,error:"Password could not be updated. Your approval remains available if it has not expired."},400);
 }
 await db.from("audit_logs").insert({actor_id:auth.user.id,action:"owner_password_change.completed",entity:"owner_password_change_requests",entity_id:approval.id,details:{owner_user_id:auth.user.id}});
 return reply(req,{ok:true});
}catch(error){return reply(req,{ok:false,error:error instanceof Error?error.message:"Password change failed"},400);}
});