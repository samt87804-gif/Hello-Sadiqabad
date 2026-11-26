
create or replace function private.reject_plan_receipt_mutation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  -- Preserve append-only financial fields while permitting FK-driven privacy cleanup
  -- when a linked business or Auth user is deleted.
  if tg_op='UPDATE'
     and (new.business_id is not distinct from old.business_id
          or (old.business_id is not null and new.business_id is null))
     and (new.owner_id is not distinct from old.owner_id
          or (old.owner_id is not null and new.owner_id is null))
     and (new.recorded_by is not distinct from old.recorded_by
          or (old.recorded_by is not null and new.recorded_by is null))
     and (to_jsonb(new)-array['business_id','owner_id','recorded_by'])
         = (to_jsonb(old)-array['business_id','owner_id','recorded_by']) then
    return new;
  end if;

  raise exception 'Financial receipt records are append-only';
end;
$$;
