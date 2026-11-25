create or replace function public.audit_log_record()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  row_id text;
  v_details jsonb := jsonb_build_object('changed_at',now());
  v_changes jsonb;
  v_source text;
begin
  row_id := coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id');

  if tg_table_name='businesses'
     and tg_op='UPDATE'
     and auth.uid() is not null
     and coalesce(current_setting('app.business_field_review',true),'') <> 'true' then
    select coalesce(
      jsonb_object_agg(
        old_fields.key,
        jsonb_build_object('old',old_fields.value,'new',new_fields.value)
      ),
      '{}'::jsonb
    )
    into v_changes
    from jsonb_each(
      to_jsonb(old) - array[
        'owner_name','owner_photo_url','created_at','updated_at','phone_normalized',
        'view_count','call_count','whatsapp_count','review_count','rating_avg','rating_count'
      ]::text[]
    ) as old_fields(key,value)
    join jsonb_each(
      to_jsonb(new) - array[
        'owner_name','owner_photo_url','created_at','updated_at','phone_normalized',
        'view_count','call_count','whatsapp_count','review_count','rating_avg','rating_count'
      ]::text[]
    ) as new_fields(key,value) using (key)
    where old_fields.value is distinct from new_fields.value;

    if v_changes <> '{}'::jsonb then
      v_source := case
        when private.is_super_admin()
          or private.staff_has_permission('business.create')
          or private.staff_has_permission('business.publish')
        then 'admin_direct_edit'
        else 'authenticated_business_update'
      end;
      v_details := jsonb_build_object(
        'changed_at',now(),
        'source',v_source,
        'changes',v_changes
      );
    end if;
  end if;

  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
  values(auth.uid(),tg_op,tg_table_name,row_id,v_details);

  return coalesce(new,old);
end
$function$;
