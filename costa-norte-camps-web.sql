-- Costa Norte · inscripciones al campamento Costa Verde desde la web
-- Las familias se inscriben en airmate.es/costanorte/surf-camps/ → llegan a cn_camp_inscritos (panel de Costa Norte).
-- Cuando toque, Costa Norte las pasa a Costa Verde desde el panel (exporta y marca «Pasado a Costa Verde»).
-- Se puede ejecutar varias veces.

alter table cn_camp_inscritos add column if not exists email text;
alter table cn_camp_inscritos add column if not exists origen text not null default 'panel';      -- panel / web / importado
alter table cn_camp_inscritos add column if not exists estado text not null default 'nuevo';      -- nuevo / confirmado / cancelado
alter table cn_camp_inscritos add column if not exists codigo text;
alter table cn_camp_inscritos add column if not exists consentimiento_at timestamptz;
alter table cn_camp_inscritos add column if not exists volcado_at timestamptz;                   -- cuándo se pasó a Costa Verde

do $$ begin
  alter table cn_camp_inscritos add constraint cn_camp_estado_ok check (estado in ('nuevo','confirmado','cancelado'));
exception when duplicate_object then null; end $$;

create unique index if not exists cn_camp_inscritos_codigo on cn_camp_inscritos (codigo) where codigo is not null;

-- Inscripción pública (la web no tiene acceso a la tabla; solo a esta función)
create or replace function cn_camp_inscribir(
  p_semana text, p_nombre text, p_edad int, p_nivel text, p_alergias text,
  p_tutor text, p_telefono text, p_email text, p_notas text, p_consentimiento boolean
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_cod text; v_tel text := regexp_replace(coalesce(p_telefono,''), '[^0-9+]', '', 'g');
begin
  if not coalesce(p_consentimiento, false) then raise exception 'Hace falta tu permiso para tratar los datos del menor.'; end if;
  if p_semana not in ('28 jun – 5 jul', '5 – 11 jul') then raise exception 'Elige una de las semanas del campamento.'; end if;
  if length(trim(coalesce(p_nombre,''))) < 2 or length(p_nombre) > 120 then raise exception 'Escribe el nombre del chaval o la chavala.'; end if;
  if p_edad is null or p_edad < 6 or p_edad > 17 then raise exception 'Revisa la edad.'; end if;
  if length(trim(coalesce(p_tutor,''))) < 2 or length(p_tutor) > 120 then raise exception 'Escribe el nombre de la madre, el padre o el tutor.'; end if;
  if length(v_tel) < 9 or length(v_tel) > 16 then raise exception 'Revisa el teléfono.'; end if;
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_email) > 160 then raise exception 'Revisa el email.'; end if;
  if p_nivel not in ('Nunca','Alguna vez','Se pone de pie','Ya surfea') then raise exception 'Elige el nivel de surf.'; end if;
  -- freno anti-abuso: como mucho 6 inscripciones al día desde el mismo teléfono
  if (select count(*) from cn_camp_inscritos where telefono = v_tel and created_at > now() - interval '1 day') >= 6 then
    raise exception 'Ya hemos recibido varias inscripciones con este teléfono. Llámanos al 609 282 963.';
  end if;
  loop
    v_cod := 'CV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from cn_camp_inscritos where codigo = v_cod);
  end loop;
  insert into cn_camp_inscritos (camp, semana, nombre, edad, nivel, alergias, tutor, telefono, email, notas, origen, estado, codigo, consentimiento_at)
  values ('costa-verde', p_semana, left(trim(p_nombre),120), p_edad, p_nivel, nullif(left(trim(coalesce(p_alergias,'')),300),''),
          left(trim(p_tutor),120), v_tel, lower(trim(p_email)), nullif(left(trim(coalesce(p_notas,'')),1000),''), 'web', 'nuevo', v_cod, now());
  return json_build_object('codigo', v_cod);
end $$;

revoke all on function cn_camp_inscribir(text,text,int,text,text,text,text,text,text,boolean) from public;
grant execute on function cn_camp_inscribir(text,text,int,text,text,text,text,text,text,boolean) to anon, authenticated;
