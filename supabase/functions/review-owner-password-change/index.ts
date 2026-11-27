import { createClient } from "npm:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL"), key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if(!url||!key)throw new Error("Missing Supabase service configuration");
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=(Deno.env.get("ALLOWED_ORIGINS")??"https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173").split(",").map(v=>v.trim());
function reply(req:Request,data:unknown,status=200){const o=req.headers.get("origin")??"";if(o&&!origins.includes(o))return Response.json({ok:false,error:"Origin not allowed"},{status:403});return Response.json(data,{status,headers:{"Access-Control-Allow-Origin":o||origins[0],"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin","Cache-Control":"no-store"}});}
Deno.serve(async(req:Request)=>{if(req.method==="OPTIONS")return reply(req,{ok:true});if(req.method!=="POST")return reply(req,{ok:false,error:"Method not allowed"},405);
try{
 const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"");
 if(!token)return reply(req,{ok:false,error:"Unauthorized"},401);
 const {data:user,error:userError}=await db.auth.getUser(token);
 if(userError||!user.user)return reply(req,{ok:false,error:"Unauthorized"},401);
 const {data:actor,error:actorError}=await db.from("profiles").select("role,is_active").eq("id",user.user.id).maybeSingle();
 if(actorError||actor?.role!=="super_admin"||actor.is_active!==true)return reply(req,{ok:false,error:"Super Admin permission required"},403);
 const body=await req.json().catch(()=>null) as Record<string,unknown>|null;
 const id=typeof body?.request_id==="string"?body.request_id:"";
 const decision=body?.decision;
 const note=typeof body?.admin_note==="string"?body.admin_note.trim().slice(0,1000):null;
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approve","reject"].includes(String(decision)))return reply(req,{ok:false,error:"Invalid review request"},400);
 const {data:request,error:readError}=await db.from("owner_password_change_requests").select("id,user_id,status").eq("id",id).maybeSingle();
 if(readError||!request||!request.user_id)return reply(req,{ok:false,error:"Password-change request not found"},404);
 if(request.status!=="pending")return reply(req,{ok:false,error:"This request has already been reviewed"},409);
 const {data:owner,error:ownerError}=await db.from("profiles").select("role,is_active").eq("id",request.user_id).maybeSingle();
 if(ownerError||owner?.role!=="owner"||owner.is_active!==true)return reply(req,{ok:false,error:"The requesting account is not an active Owner"},409);
 const now=new Date().toISOString();
 const patch=decision==="approve"
  ?{status:"approved",reviewed_by:user.user.id,reviewed_at:now,expires_at:new Date(Date.now()+30*60*1000).toISOString(),admin_note:note,updated_at:now}
  :{status:"rejected",reviewed_by:user.user.id,reviewed_at:now,admin_note:note,updated_at:now};
 const {data:changed,error:updateError}=await db.from("owner_password_change_requests").update(patch).eq("id",id).eq("status","pending").select("id,status,expires_at").maybeSingle();
 if(updateError)throw updateError;
 if(!changed)return reply(req,{ok:false,error:"This request was already reviewed"},409);
 await db.from("audit_logs").insert({actor_id:user.user.id,action:"owner_password_change."+decision,entity:"owner_password_change_requests",entity_id:id,details:{owner_user_id:request.user_id,expires_at:changed.expires_at??null,admin_note:note}});
 return reply(req,{ok:true,status:changed.status,expires_at:changed.expires_at??null});
}catch(error){return reply(req,{ok:false,error:error instanceof Error?error.message:"Password-change review failed"},400);}
});