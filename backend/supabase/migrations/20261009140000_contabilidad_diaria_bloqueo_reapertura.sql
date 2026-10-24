begin;

alter table public.contabilidad_diaria_auditoria
  drop constraint if exists contabilidad_diaria_auditoria_accion_check;

alter table public.contabilidad_diaria_auditoria
  add constraint contabilidad_diaria_auditoria_accion_check
  check (accion in ('crear', 'actualizar', 'enviar_a_validacion', 'cerrar', 'validar', 'reabrir'));

create or replace function private.proteger_contabilidad_cerrada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.estado in ('cerrada', 'validada') then
    if not (select private.has_role(array['Administrador']::text[])) then
      raise exception 'La jornada está cerrada. Solo administración puede reabrirla para edición.';
    end if;
    if new.estado not in ('borrador', 'validada') or new.estado = old.estado then
      raise exception 'Una jornada cerrada solo puede reabrirse por administración o validarse.';
    end if;
    if (to_jsonb(new) - array[
      'estado', 'payload', 'actualizado_en', 'actualizado_por',
      'cerrada_en', 'cerrada_por', 'validada_en', 'validada_por'
    ]) is distinct from (to_jsonb(old) - array[
      'estado', 'payload', 'actualizado_en', 'actualizado_por',
      'cerrada_en', 'cerrada_por', 'validada_en', 'validada_por'
    ]) or (new.payload - 'estado') is distinct from (old.payload - 'estado') then
      raise exception 'Los datos de una jornada cerrada no se pueden modificar durante el cambio de estado.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.proteger_contabilidad_cerrada() from public, anon, authenticated;

drop trigger if exists contabilidad_diaria_bloquear_cerradas
  on public.contabilidad_diaria_jornadas;
create trigger contabilidad_diaria_bloquear_cerradas
  before update on public.contabilidad_diaria_jornadas
  for each row execute function private.proteger_contabilidad_cerrada();

create or replace function public.contabilidad_diaria_reabrir(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := (select private.current_tenant_id());
  v_usuario uuid := auth.uid();
  v_jornada public.contabilidad_diaria_jornadas%rowtype;
  v_antes jsonb;
begin
  if v_usuario is null or v_tenant is null then
    raise exception 'Inicia sesión con un perfil asociado a una empresa.';
  end if;
  if not (select private.has_role(array['Administrador']::text[])) then
    raise exception 'Solo un Administrador puede reabrir una jornada.';
  end if;

  select * into v_jornada
  from public.contabilidad_diaria_jornadas j
  where j.id = p_id and j.tenant_id = v_tenant
  for update;
  if not found then raise exception 'No se encontró la jornada solicitada.'; end if;
  if v_jornada.estado not in ('cerrada', 'validada') then
    raise exception 'Solo se puede reabrir una jornada cerrada o validada.';
  end if;

  v_antes := v_jornada.payload || jsonb_build_object('estado', v_jornada.estado, 'id', v_jornada.id);

  update public.contabilidad_diaria_jornadas
    set estado = 'borrador',
        payload = payload || jsonb_build_object('estado', 'borrador'),
        actualizado_en = now(),
        actualizado_por = v_usuario,
        cerrada_en = null,
        cerrada_por = null,
        validada_en = null,
        validada_por = null
    where id = v_jornada.id
    returning * into v_jornada;

  insert into public.contabilidad_diaria_auditoria (
    tenant_id, jornada_id, usuario_id, accion, estado_anterior, estado_nuevo, antes, despues
  ) values (
    v_tenant, v_jornada.id, v_usuario, 'reabrir', v_antes->>'estado', 'borrador',
    v_antes, v_jornada.payload || jsonb_build_object('id', v_jornada.id)
  );

  return jsonb_build_object(
    'ok', true,
    'id', v_jornada.id,
    'estado', v_jornada.estado,
    'actualizadoEn', v_jornada.actualizado_en
  );
end;
$$;

revoke all on function public.contabilidad_diaria_reabrir(uuid) from public, anon;
grant execute on function public.contabilidad_diaria_reabrir(uuid) to authenticated;

commit;
