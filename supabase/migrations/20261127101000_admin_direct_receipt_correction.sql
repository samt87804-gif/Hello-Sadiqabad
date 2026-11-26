-- Super Admin can directly correct/reverse a receipt while preserving the original row.
create or replace function public.admin_correct_plan_receipt(p_receipt_id uuid,p_corrected_amount_pkr numeric,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_receipt private.plan_receipts%rowtype; v_assignment private.plan_assignments%rowtype;
 v_current numeric(12,2); v_other numeric(12,2); v_delta numeric(12,2); v_adjustment uuid;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can correct receipts'; end if;
 if p_receipt_id is null or p_corrected_amount_pkr is null or p_corrected_amount_pkr<0 then raise exception 'Enter a valid corrected amount'; end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 5 and 1000 then raise exception 'A correction reason between 5 and 1000 characters is required'; end if;
 select * into v_receipt from private.plan_receipts where id=p_receipt_id for update;
 if not found then raise exception 'Receipt not found'; end if;
 select * into v_assignment from private.plan_assignments where id=v_receipt.assignment_id for update;
 select v_receipt.amount_pkr+coalesce(sum(delta_pkr),0) into v_current from private.plan_receipt_adjustments where receipt_id=v_receipt.id;
 v_current:=coalesce(v_current,v_receipt.amount_pkr);
 select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) into v_other
 from private.plan_receipts r left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
 where r.assignment_id=v_assignment.id and r.id<>v_receipt.id;
 if p_corrected_amount_pkr>v_assignment.agreed_fee_pkr-v_other then raise exception 'Corrected receipt would exceed remaining agreed plan fee'; end if;
 v_delta:=p_corrected_amount_pkr-v_current;
 if v_delta=0 then raise exception 'Corrected amount is unchanged'; end if;
 insert into private.plan_receipt_adjustments(receipt_id,assignment_id,delta_pkr,adjustment_type,reason,created_by)
 values(v_receipt.id,v_assignment.id,v_delta,case when p_corrected_amount_pkr=0 then 'reversal' else 'correction' end,btrim(p_reason),auth.uid())
 returning id into v_adjustment;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details)
 values(auth.uid(),case when p_corrected_amount_pkr=0 then 'plan_payment.receipt_reversed' else 'plan_payment.receipt_corrected' end,
 'plan_receipts',v_receipt.id::text,jsonb_build_object('adjustment_id',v_adjustment,'original_amount_pkr',v_receipt.amount_pkr,
 'previous_net_amount_pkr',v_current,'corrected_amount_pkr',p_corrected_amount_pkr,'delta_pkr',v_delta,'reason',btrim(p_reason)));
 return jsonb_build_object('receipt_id',v_receipt.id,'adjustment_id',v_adjustment,'original_amount_pkr',v_receipt.amount_pkr,
 'previous_net_amount_pkr',v_current,'corrected_amount_pkr',p_corrected_amount_pkr,'delta_pkr',v_delta);
end; $$;
revoke all on function public.admin_correct_plan_receipt(uuid,numeric,text) from public,anon;
grant execute on function public.admin_correct_plan_receipt(uuid,numeric,text) to authenticated;
