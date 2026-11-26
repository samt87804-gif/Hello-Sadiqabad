update public.plans
set features=jsonb_set(coalesce(features,'{}'::jsonb),'{website_url}',to_jsonb(code<>'free'),true),
price_note=case code when 'basic' then 'Rs. 700 / month' when 'premium' then 'Rs. 1,500 / month' else price_note end,updated_at=now()
where code in ('free','basic','premium');
insert into public.site_settings(key,value,description,is_public) values ('plan_payment_methods',
'{"instructions_en":"Select your plan, transfer the exact monthly amount to one of the accounts below, then enter the transaction/reference number and confirm that payment has been made. Your plan changes only after Admin verifies the payment.","instructions_ur":"اپنا پلان منتخب کریں، نیچے دیے گئے اکاؤنٹ میں مکمل ماہانہ رقم جمع کروائیں، پھر ٹرانزیکشن/حوالہ نمبر درج کریں اور ادائیگی کی تصدیق کریں۔ ایڈمن کی تصدیق کے بعد ہی پلان تبدیل ہوگا۔","methods":{"jazzcash":{"label":"JazzCash","account_title":"Adeel Khalid","account_number":"03283212342","icon_url":null},"easypaisa":{"label":"Easypaisa","account_title":"Adeel Khalid","account_number":"03283212342","icon_url":null},"ubl":{"label":"UBL Bank Transfer","account_title":"Adil Khalid","account_number":"2318422716936","iban":"PK57UNIL0109000422716936","icon_url":null}}}'::jsonb,
'Public payment instructions and accounts for Owner Portal monthly plan payments',true) on conflict(key) do nothing;
create or replace function private.guard_plan_upgrade_approval() returns trigger language plpgsql security definer set search_path='' as $$
begin
if old.type='plan_upgrade' and old.status is distinct from new.status and new.status='done'
and current_setting('app.plan_upgrade_review',true) is distinct from 'true' then raise exception 'Plan upgrades must be approved through the payment verification workflow'; end if;
return new; end; $$;
drop trigger if exists submissions_guard_plan_upgrade_approval on public.submissions;
create trigger submissions_guard_plan_upgrade_approval before update of status on public.submissions for each row execute function private.guard_plan_upgrade_approval();
create or replace function public.submit_plan_upgrade_request(p_business_id uuid,p_requested_plan text,p_payment_method text,p_transaction_reference text,p_owner_confirmed_paid boolean,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=auth.uid(); v_business public.businesses%rowtype; v_current_plan text; v_amount integer; v_submission_id uuid;
begin
if v_owner is null then raise exception 'Please sign in with your active Owner account'; end if;
if not exists(select 1 from public.profiles p where p.id=v_owner and p.role='owner' and p.is_active=true) then raise exception 'An active Owner account is required'; end if;
if p_requested_plan is null or p_requested_plan not in ('basic','premium') then raise exception 'Choose Basic or Premium'; end if;
if p_payment_method is null or p_payment_method not in ('jazzcash','easypaisa','ubl') then raise exception 'Choose a valid payment method'; end if;
if p_transaction_reference is null or char_length(btrim(p_transaction_reference))<4 or char_length(btrim(p_transaction_reference))>120 then raise exception 'Enter the payment transaction/reference number'; end if;
if p_owner_confirmed_paid is distinct from true then raise exception 'Confirm that you have paid before sending the request'; end if;
if p_note is not null and char_length(p_note)>500 then raise exception 'Payment note is too long'; end if;
select * into v_business from public.businesses b where b.id=p_business_id and b.owner_id=v_owner for update;
if not found then raise exception 'This business is not linked to your Owner account'; end if;
v_current_plan:=private.effective_plan(p_business_id);
if v_current_plan='premium' and p_requested_plan='basic' then raise exception 'Your business already has Premium. Basic cannot replace Premium'; end if;
if not public.check_rate_limit('plan-upgrade:owner:'||v_owner::text,3,86400) then raise exception 'Too many plan requests. Please try again tomorrow'; end if;
if exists(select 1 from public.submissions s where s.business_id=p_business_id and s.type='plan_upgrade' and s.status in ('new','in_review')) then raise exception 'A plan payment request is already waiting for Admin review'; end if;
v_amount:=case p_requested_plan when 'basic' then 700 when 'premium' then 1500 end;
insert into public.submissions(type,business_id,payload,contact_name,contact_phone,submitted_by,status)
values('plan_upgrade',p_business_id,jsonb_build_object('requested_plan',p_requested_plan,'monthly_amount_pkr',v_amount,'payment_method',p_payment_method,'transaction_reference',btrim(p_transaction_reference),'payment_status','owner_reported_paid','owner_confirmed_paid',true,'payment_verified',false,'note',nullif(btrim(p_note),'')),null,null,v_owner,'new')
returning id into v_submission_id;
return jsonb_build_object('submission_id',v_submission_id,'status','new','requested_plan',p_requested_plan,'monthly_amount_pkr',v_amount);
end; $$;
create or replace function public.review_plan_upgrade_request(p_submission_id uuid,p_action text,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_submission public.submissions%rowtype; v_payload jsonb; v_business public.businesses%rowtype; v_target_plan text; v_amount integer; v_expiry timestamptz;
begin
if not private.staff_has_permission('moderation.review') then raise exception 'Permission denied'; end if;
if p_action is null or p_action not in ('approve','reject') then raise exception 'Choose approve or reject'; end if;
if p_admin_note is not null and char_length(p_admin_note)>1000 then raise exception 'Admin note is too long'; end if;
select * into v_submission from public.submissions s where s.id=p_submission_id and s.type='plan_upgrade' for update;
if not found or v_submission.status not in ('new','in_review') then raise exception 'Pending plan payment request not found'; end if;
v_payload:=v_submission.payload; v_target_plan:=v_payload->>'requested_plan';
v_amount:=case v_target_plan when 'basic' then 700 when 'premium' then 1500 else null end;
if v_amount is null or coalesce((v_payload->>'monthly_amount_pkr')::integer,0)<>v_amount or v_payload->>'payment_status'<>'owner_reported_paid' or coalesce(v_payload->>'transaction_reference','')='' or coalesce((v_payload->>'owner_confirmed_paid')::boolean,false) is not true then raise exception 'Payment information is incomplete or does not match the selected plan'; end if;
select * into v_business from public.businesses b where b.id=v_submission.business_id for update;
if not found or v_business.owner_id is distinct from v_submission.submitted_by then raise exception 'Business ownership changed; request needs manual review'; end if;
if p_action='approve' then
if private.effective_plan(v_business.id)='premium' and v_target_plan='basic' then raise exception 'A Basic request cannot replace an active Premium plan'; end if;
v_expiry:=greatest(now(),coalesce(v_business.plan_expires_at,now()))+interval '1 month';
update public.businesses set plan_code=v_target_plan,plan_expires_at=v_expiry,updated_at=now() where id=v_business.id;
v_payload:=v_payload||jsonb_build_object('payment_verified',true,'payment_verified_at',now(),'payment_verified_by',auth.uid(),'activated_at',now(),'plan_expires_at',v_expiry);
perform set_config('app.plan_upgrade_review','true',true);
update public.submissions set status='done',payload=v_payload,admin_note=nullif(btrim(p_admin_note),''),updated_at=now() where id=p_submission_id;
insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path,is_read,created_at)
values(v_submission.submitted_by,'general','Your '||upper(v_target_plan)||' plan is now active','آپ کا '||case v_target_plan when 'basic' then 'بیسک' else 'پریمیم' end||' پلان فعال ہو گیا ہے',
'Your payment has been verified. Your plan is active until '||to_char(v_expiry at time zone 'Asia/Karachi','DD Mon YYYY')||'.',
'آپ کی ادائیگی کی تصدیق ہو گئی ہے۔ آپ کا پلان مقررہ تاریخ تک فعال ہے۔','/owner/plan',false,now());
else
v_payload:=v_payload||jsonb_build_object('payment_verified',false,'payment_rejected_at',now(),'payment_rejected_by',auth.uid());
update public.submissions set status='rejected',payload=v_payload,admin_note=coalesce(nullif(btrim(p_admin_note),''),'Payment was not verified'),updated_at=now() where id=p_submission_id;
insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path,is_read,created_at)
values(v_submission.submitted_by,'general','Plan payment needs attention','پلان کی ادائیگی میں مسئلہ ہے',
coalesce(nullif(btrim(p_admin_note),''),'Your payment could not be verified. Please contact Hello Sadiqabad support before submitting a new request.'),
'آپ کی ادائیگی کی تصدیق نہیں ہو سکی۔ نئی درخواست بھیجنے سے پہلے ہیلپ ڈیسک سے رابطہ کریں۔','/owner/plan',false,now());
end if;
insert into public.audit_logs(actor_id,action,entity,entity_id,details)
values(auth.uid(),'plan_upgrade.payment_'||p_action,'submissions',p_submission_id::text,
jsonb_build_object('business_id',v_submission.business_id,'submitted_by',v_submission.submitted_by,'requested_plan',v_target_plan,'amount_pkr',v_amount,'payment_method',v_payload->>'payment_method','transaction_reference',v_payload->>'transaction_reference','plan_expires_at',case when p_action='approve' then v_expiry else null end));
return jsonb_build_object('submission_id',p_submission_id,'status',case when p_action='approve' then 'done' else 'rejected' end,'business_id',v_submission.business_id,'plan_expires_at',case when p_action='approve' then v_expiry else null end);
end; $$;
revoke all on function public.submit_plan_upgrade_request(uuid,text,text,text,boolean,text) from public,anon;
grant execute on function public.submit_plan_upgrade_request(uuid,text,text,text,boolean,text) to authenticated;
revoke all on function public.review_plan_upgrade_request(uuid,text,text) from public,anon;
grant execute on function public.review_plan_upgrade_request(uuid,text,text) to authenticated;
revoke all on function private.guard_plan_upgrade_approval() from public,anon,authenticated;
create or replace function public.enforce_business_plan_limits() returns trigger language plpgsql security definer set search_path='' as $$
declare plan_code text; limits jsonb; features jsonb; social_count int; website_changed boolean;
begin
if tg_op='UPDATE' and (to_jsonb(new)-array['owner_id','claimed_at','updated_at','logo_url'])=(to_jsonb(old)-array['owner_id','claimed_at','updated_at','logo_url']) then return new; end if;
if current_user='service_role' then return new; end if;
if auth.uid() is not null and (private.is_super_admin() or private.staff_has_permission('business.edit_own') or private.staff_has_permission('business.publish')) then return new; end if;
plan_code:=case when new.plan_expires_at is not null and new.plan_expires_at<now() then 'free' else new.plan_code end;
select p.limits,p.features into limits,features from public.plans p where p.code=plan_code;
if limits is null then raise exception 'Business plan is not configured'; end if;
if coalesce(array_length(new.gallery_urls,1),0)>coalesce((limits->>'max_photos')::int,0) then raise exception 'Your plan photo limit has been reached'; end if;
if coalesce(array_length(new.video_urls,1),0)>coalesce((limits->>'max_videos')::int,0) then raise exception 'Your plan video limit has been reached'; end if;
website_changed:=case when tg_op='INSERT' then new.website_url is not null else new.website_url is distinct from old.website_url end;
if website_changed and new.website_url is not null and coalesce((features->>'website_url')::boolean,false)=false then raise exception 'Website links are available on Basic and Premium plans'; end if;
social_count:=(case when website_changed and new.website_url is not null then 1 else 0 end)+(new.facebook_url is not null)::int+(new.instagram_url is not null)::int+(new.youtube_url is not null)::int+(new.tiktok_url is not null)::int;
if social_count>coalesce((limits->>'social_links')::int,0) then raise exception 'Your plan social link limit has been reached'; end if;
if new.whatsapp is not null and coalesce((features->>'whatsapp')::boolean,false)=false then raise exception 'WhatsApp is not included in your current plan'; end if;
if new.cover_url is not null and coalesce((features->>'cover')::boolean,false)=false then raise exception 'Cover images are not included in your current plan'; end if;
if coalesce(array_length(new.gallery_urls,1),0)>0 and coalesce((features->>'gallery')::boolean,false)=false then raise exception 'Photo galleries are not included in your current plan'; end if;
if coalesce(array_length(new.video_urls,1),0)>0 and coalesce((features->>'videos')::boolean,false)=false then raise exception 'Videos are not included in your current plan'; end if;
if social_count>0 and coalesce((features->>'social_links')::boolean,false)=false then raise exception 'Social links are not included in your current plan'; end if;
return new; end; $$;
