begin;

create table if not exists public.contabilidad_diaria_jornadas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  fecha date not null,
  municipio text not null check (btrim(municipio) <> ''),
  coordinador text not null check (btrim(coordinador) <> ''),
  estado text not null default 'borrador'
    check (estado in ('borrador', 'pendiente_de_validacion', 'cerrada', 'validada')),
  total_ingresos numeric(14,2) not null default 0 check (total_ingresos >= 0),
  total_deduccion numeric(14,2) not null default 0 check (total_deduccion >= 0),
  total_egresos numeric(14,2) not null default 0 check (total_egresos >= 0),
  saldo_inicial numeric(14,2) not null default 0 check (saldo_inicial >= 0),
  saldo_final numeric(14,2) not null default 0,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por uuid not null references auth.users(id),
  actualizado_por uuid not null references auth.users(id),
  cerrada_en timestamptz,
  cerrada_por uuid references auth.users(id),
  validada_en timestamptz,
  validada_por uuid references auth.users(id),
  unique (tenant_id, fecha)
);

create index if not exists contabilidad_diaria_tenant_estado_fecha
  on public.contabilidad_diaria_jornadas (tenant_id, estado, fecha desc);
create index if not exists contabilidad_diaria_tenant_actualizacion
  on public.contabilidad_diaria_jornadas (tenant_id, actualizado_en desc);

create table if not exists public.contabilidad_diaria_afiliaciones (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  jornada_id uuid not null references public.contabilidad_diaria_jornadas(id) on delete cascade,
  orden integer not null check (orden > 0),
  asesor text not null default '',
  rol text not null default 'PROMOTOR',
  aff numeric(14,2) not null default 0 check (aff >= 0),
  rec_abono numeric(14,2) not null default 0 check (rec_abono >= 0),
  almuerzo numeric(14,2) not null default 0 check (almuerzo >= 0),
  cena numeric(14,2) not null default 0 check (cena >= 0),
  urbano numeric(14,2) not null default 0 check (urbano >= 0),
  vereda numeric(14,2) not null default 0 check (vereda >= 0),
  adic numeric(14,2) not null default 0 check (adic >= 0),
  ganado numeric(14,2) not null default 0 check (ganado >= 0),
  recaudo_neto numeric(14,2) not null default 0 check (recaudo_neto >= 0),
  prestamo numeric(14,2) not null default 0 check (prestamo >= 0),
  unique (jornada_id, orden)
);

create index if not exists contabilidad_diaria_afiliaciones_tenant_jornada
  on public.contabilidad_diaria_afiliaciones (tenant_id, jornada_id, orden);

create table if not exists public.contabilidad_diaria_gastos (
  jornada_id uuid primary key references public.contabilidad_diaria_jornadas(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  comida_coor numeric(14,2) not null default 0 check (comida_coor >= 0),
  desayunos numeric(14,2) not null default 0 check (desayunos >= 0),
  almuerzos numeric(14,2) not null default 0 check (almuerzos >= 0),
  cenas_ganadas numeric(14,2) not null default 0 check (cenas_ganadas >= 0),
  cenas_prestadas numeric(14,2) not null default 0 check (cenas_prestadas >= 0),
  hotel numeric(14,2) not null default 0 check (hotel >= 0),
  trans_urbano numeric(14,2) not null default 0 check (trans_urbano >= 0),
  trans_vereda numeric(14,2) not null default 0 check (trans_vereda >= 0),
  varios numeric(14,2) not null default 0 check (varios >= 0),
  consignaciones numeric(14,2) not null default 0 check (consignaciones >= 0),
  abonos_ganados numeric(14,2) not null default 0 check (abonos_ganados >= 0),
  giros numeric(14,2) not null default 0 check (giros >= 0),
  recaudo_base numeric(14,2) not null default 0 check (recaudo_base >= 0),
  abonos_adic numeric(14,2) not null default 0 check (abonos_adic >= 0),
  extras jsonb not null default '[]'::jsonb check (jsonb_typeof(extras) = 'array')
);

create index if not exists contabilidad_diaria_gastos_tenant_jornada
  on public.contabilidad_diaria_gastos (tenant_id, jornada_id);

create table if not exists public.contabilidad_diaria_auditoria (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  jornada_id uuid not null references public.contabilidad_diaria_jornadas(id) on delete cascade,
  usuario_id uuid references auth.users(id),
  accion text not null check (accion in ('crear', 'actualizar', 'enviar_a_validacion', 'cerrar', 'validar')),
  estado_anterior text,
  estado_nuevo text not null,
  antes jsonb,
  despues jsonb not null,
  ocurrido_en timestamptz not null default now()
);

create index if not exists contabilidad_diaria_auditoria_tenant_fecha
  on public.contabilidad_diaria_auditoria (tenant_id, ocurrido_en desc);
create index if not exists contabilidad_diaria_auditoria_jornada
  on public.contabilidad_diaria_auditoria (tenant_id, jornada_id, ocurrido_en desc);

alter table public.contabilidad_diaria_jornadas enable row level security;
alter table public.contabilidad_diaria_afiliaciones enable row level security;
alter table public.contabilidad_diaria_gastos enable row level security;
alter table public.contabilidad_diaria_auditoria enable row level security;

drop policy if exists contabilidad_diaria_jornadas_lectura_empresa on public.contabilidad_diaria_jornadas;
create policy contabilidad_diaria_jornadas_lectura_empresa
  on public.contabilidad_diaria_jornadas for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and (
      (select private.has_role(array['Administrador', 'Ejecutivo']::text[]))
      or (creado_por = auth.uid() and (select private.has_role(array['Coordinador']::text[])))
    )
  );

drop policy if exists contabilidad_diaria_afiliaciones_lectura_empresa on public.contabilidad_diaria_afiliaciones;
create policy contabilidad_diaria_afiliaciones_lectura_empresa
  on public.contabilidad_diaria_afiliaciones for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and exists (
      select 1 from public.contabilidad_diaria_jornadas j
      where j.id = jornada_id
        and j.tenant_id = tenant_id
        and (
          (select private.has_role(array['Administrador', 'Ejecutivo']::text[]))
          or (j.creado_por = auth.uid() and (select private.has_role(array['Coordinador']::text[])))
        )
    )
  );

drop policy if exists contabilidad_diaria_gastos_lectura_empresa on public.contabilidad_diaria_gastos;
create policy contabilidad_diaria_gastos_lectura_empresa
  on public.contabilidad_diaria_gastos for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and exists (
      select 1 from public.contabilidad_diaria_jornadas j
      where j.id = jornada_id
        and j.tenant_id = tenant_id
        and (
          (select private.has_role(array['Administrador', 'Ejecutivo']::text[]))
          or (j.creado_por = auth.uid() and (select private.has_role(array['Coordinador']::text[])))
        )
    )
  );

drop policy if exists contabilidad_diaria_auditoria_lectura_admin on public.contabilidad_diaria_auditoria;
create policy contabilidad_diaria_auditoria_lectura_admin
  on public.contabilidad_diaria_auditoria for select to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and (select private.has_role(array['Administrador', 'Ejecutivo']::text[]))
  );

revoke all on public.contabilidad_diaria_jornadas,
  public.contabilidad_diaria_afiliaciones,
  public.contabilidad_diaria_gastos,
  public.contabilidad_diaria_auditoria
  from anon, authenticated;

create or replace function public.contabilidad_diaria_listar()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := (select private.current_tenant_id());
  v_data jsonb;
begin
  if auth.uid() is null or not (select private.has_role(array['Administrador', 'Ejecutivo', 'Coordinador']::text[])) then
    raise exception 'No tienes permisos para consultar las jornadas.';
  end if;
  if v_tenant is null then raise exception 'El perfil no está asociado a una empresa.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', j.id,
    'fecha', to_char(j.fecha, 'YYYY-MM-DD'),
    'municipio', j.municipio,
    'coordinador', j.coordinador,
    'estado', j.estado,
    'actualizadoEn', j.actualizado_en,
    'totales', jsonb_build_object(
      'totalIngresos', j.total_ingresos,
      'totalDeduccion', j.total_deduccion,
      'totalEgresos', j.total_egresos,
      'saldoInicial', j.saldo_inicial,
      'saldoFinal', j.saldo_final
    )
  ) order by j.fecha desc, j.actualizado_en desc), '[]'::jsonb)
    into v_data
  from public.contabilidad_diaria_jornadas j
  where j.tenant_id = v_tenant
    and (
      (select private.has_role(array['Administrador', 'Ejecutivo']::text[]))
      or j.creado_por = auth.uid()
    );

  return v_data;
end;
$$;

create or replace function public.contabilidad_diaria_obtener(p_fecha date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := (select private.current_tenant_id());
  v_jornada public.contabilidad_diaria_jornadas%rowtype;
begin
  if auth.uid() is null or not (select private.has_role(array['Administrador', 'Ejecutivo', 'Coordinador']::text[])) then
    raise exception 'No tienes permisos para consultar la jornada.';
  end if;
  if v_tenant is null then raise exception 'El perfil no está asociado a una empresa.'; end if;

  select * into v_jornada
  from public.contabilidad_diaria_jornadas j
  where j.tenant_id = v_tenant
    and j.fecha = p_fecha
    and (
      (select private.has_role(array['Administrador', 'Ejecutivo']::text[]))
      or j.creado_por = auth.uid()
    );
  if not found then return null; end if;

  return v_jornada.payload || jsonb_build_object(
    'id', v_jornada.id,
    'fecha', to_char(v_jornada.fecha, 'YYYY-MM-DD'),
    'municipio', v_jornada.municipio,
    'coordinador', v_jornada.coordinador,
    'estado', v_jornada.estado,
    'sincronizado', true,
    'actualizadoEn', v_jornada.actualizado_en,
    'revision', v_jornada.revision,
    'totales', jsonb_build_object(
      'totalIngresos', v_jornada.total_ingresos,
      'totalDeduccion', v_jornada.total_deduccion,
      'totalEgresos', v_jornada.total_egresos,
      'saldoInicial', v_jornada.saldo_inicial,
      'saldoFinal', v_jornada.saldo_final
    )
  );
end;
$$;

create or replace function public.contabilidad_diaria_guardar(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := (select private.current_tenant_id());
  v_usuario uuid := auth.uid();
  v_fecha date;
  v_jornada public.contabilidad_diaria_jornadas%rowtype;
  v_antes jsonb;
  v_gastos jsonb;
  v_detalle jsonb;
  v_afiliaciones jsonb;
  v_extras jsonb;
  v_totales jsonb;
  v_payload jsonb;
  v_ingresos numeric(14,2);
  v_deduccion numeric(14,2);
  v_egresos numeric(14,2);
  v_saldo_inicial numeric(14,2);
  v_saldo_final numeric(14,2);
  v_accion text;
  v_item jsonb;
  v_index integer := 0;
begin
  if v_usuario is null or not (select private.has_role(array['Coordinador']::text[])) then
    raise exception 'Solo un coordinador puede guardar una jornada.';
  end if;
  if v_tenant is null then raise exception 'El perfil no está asociado a una empresa.'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'El contenido de la jornada no es válido.';
  end if;

  v_fecha := nullif(btrim(p_payload->>'fecha'), '')::date;
  if v_fecha is null then raise exception 'La fecha de la jornada es obligatoria.'; end if;
  if nullif(btrim(p_payload->>'municipio'), '') is null then raise exception 'El municipio es obligatorio.'; end if;
  if nullif(btrim(p_payload->>'coordinador'), '') is null then raise exception 'El coordinador es obligatorio.'; end if;

  v_gastos := coalesce(p_payload->'gastos', '{}'::jsonb);
  v_detalle := coalesce(p_payload->'detalle', '{}'::jsonb);
  v_afiliaciones := coalesce(p_payload->'afiliaciones', '[]'::jsonb);
  v_extras := coalesce(v_gastos->'extra', '[]'::jsonb);
  if jsonb_typeof(v_gastos) <> 'object' or jsonb_typeof(v_detalle) <> 'object'
      or jsonb_typeof(v_afiliaciones) <> 'array' or jsonb_typeof(v_extras) <> 'array' then
    raise exception 'La estructura de gastos, afiliaciones o detalle no es válida.';
  end if;
  if jsonb_array_length(v_afiliaciones) > 500 or jsonb_array_length(v_extras) > 200 then
    raise exception 'La jornada excede el máximo de filas permitido.';
  end if;

  v_ingresos :=
    coalesce(nullif(v_gastos->>'recaudoBase', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'abonosAdic', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'giros', '')::numeric, 0);
  v_deduccion :=
    coalesce(nullif(v_gastos->>'consignaciones', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'abonosGanados', '')::numeric, 0);
  v_egresos :=
    coalesce(nullif(v_gastos->>'comidaCoor', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'desayunos', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'almuerzos', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'cenasGanadas', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'cenasPrestadas', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'hotel', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'transUrbano', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'transVereda', '')::numeric, 0)
    + coalesce(nullif(v_gastos->>'varios', '')::numeric, 0);
  select v_egresos + coalesce(sum(coalesce(nullif(x.value->>'monto', '')::numeric, 0)), 0)
    into v_egresos
    from jsonb_array_elements(v_extras) as x(value);
  v_saldo_inicial := coalesce(nullif(p_payload->'totales'->>'saldoInicial', '')::numeric, 0);
  if v_ingresos < 0 or v_deduccion < 0 or v_egresos < 0 or v_saldo_inicial < 0 then
    raise exception 'Los montos de ingresos, egresos, deducciones y saldo inicial no pueden ser negativos.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_extras) as x(value)
    where coalesce(nullif(x.value->>'monto', '')::numeric, 0) < 0
  ) then
    raise exception 'Los gastos adicionales no pueden ser negativos.';
  end if;
  v_saldo_final := v_saldo_inicial + v_ingresos - v_deduccion - v_egresos;
  v_totales := coalesce(p_payload->'totales', '{}'::jsonb) || jsonb_build_object(
    'totalIngresos', v_ingresos,
    'totalDeduccion', v_deduccion,
    'totalEgresos', v_egresos,
    'saldoInicial', v_saldo_inicial,
    'saldoFinal', v_saldo_final
  );
  v_payload := p_payload || jsonb_build_object(
    'fecha', to_char(v_fecha, 'YYYY-MM-DD'),
    'municipio', btrim(p_payload->>'municipio'),
    'coordinador', btrim(p_payload->>'coordinador'),
    'sincronizado', true,
    'totales', v_totales
  );

  select * into v_jornada
  from public.contabilidad_diaria_jornadas j
  where j.tenant_id = v_tenant and j.fecha = v_fecha
  for update;

  if found then
    if v_jornada.creado_por <> v_usuario then
      raise exception 'Esta fecha ya tiene una jornada creada por otro coordinador.';
    end if;
    v_antes := v_jornada.payload || jsonb_build_object('estado', v_jornada.estado, 'id', v_jornada.id);
    v_accion := 'actualizar';
    update public.contabilidad_diaria_jornadas
      set municipio = btrim(p_payload->>'municipio'),
          coordinador = btrim(p_payload->>'coordinador'),
          estado = 'borrador',
          total_ingresos = v_ingresos,
          total_deduccion = v_deduccion,
          total_egresos = v_egresos,
          saldo_inicial = v_saldo_inicial,
          saldo_final = v_saldo_final,
          payload = v_payload || jsonb_build_object('estado', 'borrador'),
          revision = revision + 1,
          actualizado_en = now(),
          actualizado_por = v_usuario,
          cerrada_en = null,
          cerrada_por = null,
          validada_en = null,
          validada_por = null
      where id = v_jornada.id
      returning * into v_jornada;
  else
    v_accion := 'crear';
    insert into public.contabilidad_diaria_jornadas (
      tenant_id, fecha, municipio, coordinador, estado, total_ingresos,
      total_deduccion, total_egresos, saldo_inicial, saldo_final, payload,
      creado_por, actualizado_por
    ) values (
      v_tenant, v_fecha, btrim(p_payload->>'municipio'), btrim(p_payload->>'coordinador'),
      'borrador', v_ingresos, v_deduccion, v_egresos, v_saldo_inicial, v_saldo_final,
      v_payload || jsonb_build_object('estado', 'borrador'), v_usuario, v_usuario
    ) returning * into v_jornada;
  end if;

  delete from public.contabilidad_diaria_afiliaciones
  where tenant_id = v_tenant and jornada_id = v_jornada.id;
  for v_item in select value from jsonb_array_elements(v_afiliaciones)
  loop
    v_index := v_index + 1;
    insert into public.contabilidad_diaria_afiliaciones (
      tenant_id, jornada_id, orden, asesor, rol, aff, rec_abono, almuerzo, cena,
      urbano, vereda, adic, ganado, recaudo_neto, prestamo
    ) values (
      v_tenant, v_jornada.id, v_index,
      coalesce(v_item->>'asesor', ''), coalesce(v_item->>'rol', 'PROMOTOR'),
      coalesce(nullif(v_item->>'aff', '')::numeric, 0),
      coalesce(nullif(v_item->>'recAbono', '')::numeric, 0),
      coalesce(nullif(v_item->>'almuerzo', '')::numeric, 0),
      coalesce(nullif(v_item->>'cena', '')::numeric, 0),
      coalesce(nullif(v_item->>'urbano', '')::numeric, 0),
      coalesce(nullif(v_item->>'vereda', '')::numeric, 0),
      coalesce(nullif(v_item->>'adic', '')::numeric, 0),
      coalesce(nullif(v_item->>'ganado', '')::numeric, 0),
      coalesce(nullif(v_item->>'recaudoNeto', '')::numeric, 0),
      coalesce(nullif(v_item->>'prestamo', '')::numeric, 0)
    );
  end loop;

  insert into public.contabilidad_diaria_gastos (
    jornada_id, tenant_id, comida_coor, desayunos, almuerzos, cenas_ganadas,
    cenas_prestadas, hotel, trans_urbano, trans_vereda, varios, consignaciones,
    abonos_ganados, giros, recaudo_base, abonos_adic, extras
  ) values (
    v_jornada.id, v_tenant,
    coalesce(nullif(v_gastos->>'comidaCoor', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'desayunos', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'almuerzos', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'cenasGanadas', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'cenasPrestadas', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'hotel', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'transUrbano', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'transVereda', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'varios', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'consignaciones', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'abonosGanados', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'giros', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'recaudoBase', '')::numeric, 0),
    coalesce(nullif(v_gastos->>'abonosAdic', '')::numeric, 0),
    v_extras
  )
  on conflict (jornada_id) do update set
    tenant_id = excluded.tenant_id,
    comida_coor = excluded.comida_coor,
    desayunos = excluded.desayunos,
    almuerzos = excluded.almuerzos,
    cenas_ganadas = excluded.cenas_ganadas,
    cenas_prestadas = excluded.cenas_prestadas,
    hotel = excluded.hotel,
    trans_urbano = excluded.trans_urbano,
    trans_vereda = excluded.trans_vereda,
    varios = excluded.varios,
    consignaciones = excluded.consignaciones,
    abonos_ganados = excluded.abonos_ganados,
    giros = excluded.giros,
    recaudo_base = excluded.recaudo_base,
    abonos_adic = excluded.abonos_adic,
    extras = excluded.extras;

  insert into public.contabilidad_diaria_auditoria (
    tenant_id, jornada_id, usuario_id, accion, estado_anterior, estado_nuevo, antes, despues
  ) values (
    v_tenant, v_jornada.id, v_usuario, v_accion,
    case when v_antes is null then null else v_antes->>'estado' end,
    'borrador', v_antes, v_jornada.payload || jsonb_build_object('estado', 'borrador', 'id', v_jornada.id)
  );

  return v_jornada.payload || jsonb_build_object(
    'id', v_jornada.id,
    'estado', v_jornada.estado,
    'sincronizado', true,
    'actualizadoEn', v_jornada.actualizado_en,
    'revision', v_jornada.revision
  );
end;
$$;

create or replace function public.contabilidad_diaria_cambiar_estado(p_id uuid, p_estado text)
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
  v_accion text;
begin
  if v_usuario is null or v_tenant is null then raise exception 'Inicia sesión con un perfil asociado a una empresa.'; end if;
  select * into v_jornada
  from public.contabilidad_diaria_jornadas j
  where j.id = p_id and j.tenant_id = v_tenant
  for update;
  if not found then raise exception 'No se encontró la jornada solicitada.'; end if;

  v_antes := v_jornada.payload || jsonb_build_object('estado', v_jornada.estado, 'id', v_jornada.id);
  if p_estado in ('pendiente_de_validacion', 'cerrada') then
    if not (select private.has_role(array['Coordinador']::text[]))
        or v_jornada.creado_por <> v_usuario then
      raise exception 'Solo el coordinador creador puede enviar o cerrar esta jornada.';
    end if;
    if p_estado = 'pendiente_de_validacion' and v_jornada.estado <> 'borrador' then
      raise exception 'Solo se puede enviar a validación una jornada en borrador.';
    end if;
    if p_estado = 'cerrada' and v_jornada.estado <> 'pendiente_de_validacion' then
      raise exception 'Primero debes enviar la jornada a validación.';
    end if;
    v_accion := case when p_estado = 'cerrada' then 'cerrar' else 'enviar_a_validacion' end;
  elsif p_estado = 'validada' then
    if not (select private.has_role(array['Administrador']::text[])) then
      raise exception 'Solo administración puede validar el cierre.';
    end if;
    if v_jornada.estado <> 'cerrada' then
      raise exception 'Solo se puede validar una jornada cerrada.';
    end if;
    v_accion := 'validar';
  else
    raise exception 'El cambio de estado solicitado no está permitido.';
  end if;

  update public.contabilidad_diaria_jornadas
    set estado = p_estado,
        payload = payload || jsonb_build_object('estado', p_estado),
        actualizado_en = now(),
        actualizado_por = v_usuario,
        cerrada_en = case when p_estado = 'cerrada' then now() when p_estado = 'validada' then cerrada_en else null end,
        cerrada_por = case when p_estado = 'cerrada' then v_usuario when p_estado = 'validada' then cerrada_por else null end,
        validada_en = case when p_estado = 'validada' then now() else null end,
        validada_por = case when p_estado = 'validada' then v_usuario else null end
    where id = v_jornada.id
    returning * into v_jornada;

  insert into public.contabilidad_diaria_auditoria (
    tenant_id, jornada_id, usuario_id, accion, estado_anterior, estado_nuevo, antes, despues
  ) values (
    v_tenant, v_jornada.id, v_usuario, v_accion, v_antes->>'estado', v_jornada.estado,
    v_antes, v_jornada.payload || jsonb_build_object('id', v_jornada.id)
  );

  return jsonb_build_object(
    'ok', true, 'id', v_jornada.id, 'estado', v_jornada.estado,
    'actualizadoEn', v_jornada.actualizado_en
  );
end;
$$;

create or replace function public.contabilidad_diaria_resumen()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tenant uuid := (select private.current_tenant_id());
  v_totales jsonb;
  v_estados jsonb;
  v_meses jsonb;
begin
  if auth.uid() is null or not (select private.has_role(array['Administrador', 'Ejecutivo']::text[])) then
    raise exception 'Solo administración puede consultar el resumen de contabilidad.';
  end if;
  if v_tenant is null then raise exception 'El perfil no está asociado a una empresa.'; end if;

  select jsonb_build_object(
    'jornadas', count(*),
    'ingresos', coalesce(sum(total_ingresos), 0),
    'deducciones', coalesce(sum(total_deduccion), 0),
    'egresos', coalesce(sum(total_egresos), 0),
    'saldo_final', coalesce(sum(saldo_final), 0)
  ) into v_totales
  from public.contabilidad_diaria_jornadas
  where tenant_id = v_tenant;

  select coalesce(jsonb_object_agg(estado, cantidad), '{}'::jsonb)
    into v_estados
  from (
    select estado, count(*) as cantidad
    from public.contabilidad_diaria_jornadas
    where tenant_id = v_tenant
    group by estado
  ) s;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.mes), '[]'::jsonb)
    into v_meses
  from (
    select to_char(date_trunc('month', fecha), 'YYYY-MM') as mes,
      count(*) as jornadas,
      sum(total_ingresos) as ingresos,
      sum(total_egresos) as egresos,
      sum(saldo_final) as saldo_final
    from public.contabilidad_diaria_jornadas
    where tenant_id = v_tenant
      and fecha >= date_trunc('month', current_date - interval '11 months')::date
    group by date_trunc('month', fecha)
  ) m;

  return jsonb_build_object('ok', true, 'totales', v_totales, 'estados', v_estados, 'meses', v_meses);
end;
$$;

revoke all on function public.contabilidad_diaria_listar(),
  public.contabilidad_diaria_obtener(date),
  public.contabilidad_diaria_guardar(jsonb),
  public.contabilidad_diaria_cambiar_estado(uuid, text),
  public.contabilidad_diaria_resumen()
  from public, anon;
grant execute on function public.contabilidad_diaria_listar(),
  public.contabilidad_diaria_obtener(date),
  public.contabilidad_diaria_guardar(jsonb),
  public.contabilidad_diaria_cambiar_estado(uuid, text),
  public.contabilidad_diaria_resumen()
  to authenticated;

commit;
