begin;

create table if not exists public.gerencia_herramientas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  descripcion text not null check (char_length(btrim(descripcion)) between 1 and 1000),
  link text not null check (char_length(link) between 9 and 2048 and link ~ '^https://'),
  creado_por uuid not null default auth.uid() references auth.users(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists gerencia_herramientas_tenant_nombre_idx
  on public.gerencia_herramientas (tenant_id, nombre);

alter table public.gerencia_herramientas enable row level security;

revoke all on public.gerencia_herramientas from anon, authenticated;
grant select, insert, update, delete on public.gerencia_herramientas to authenticated;
grant all on public.gerencia_herramientas to service_role;

drop policy if exists gerencia_herramientas_admin_all
  on public.gerencia_herramientas;
create policy gerencia_herramientas_admin_all
  on public.gerencia_herramientas
  for all
  to authenticated
  using (
    tenant_id = (select private.current_tenant_id())
    and (select private.has_role(array['Administrador']::text[]))
  )
  with check (
    tenant_id = (select private.current_tenant_id())
    and (select private.has_role(array['Administrador']::text[]))
  );

commit;
