-- Ejecutar en Supabase → SQL Editor (proyecto Airmate)
-- Añade el claim "business_slug" a los tokens que emite el sistema de login
-- real de Supabase (necesario porque los tokens "hechos a mano" ya no los
-- acepta el proyecto — solo confía en tokens firmados por Supabase mismo).

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  biz_slug text;
begin
  select raw_user_meta_data->>'business_slug' into biz_slug
  from auth.users where id = (event->>'user_id')::uuid;

  claims := event->'claims';
  if biz_slug is not null then
    claims := jsonb_set(claims, '{business_slug}', to_jsonb(biz_slug));
  end if;
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
