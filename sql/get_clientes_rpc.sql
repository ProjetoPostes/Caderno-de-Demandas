-- =============================================================
-- RPC: public.get_clientes_rpc
-- Lista clientes unindo cliente + caderno + despacho no servidor,
-- com busca, filtro de regional, ordenação e paginação.
-- Retorna jsonb no formato { rows: [...], total: number }.
--
-- Como aplicar: cole este arquivo no SQL Editor do Supabase e execute.
-- =============================================================

create or replace function public.get_clientes_rpc(
  p_search text default null,
  p_regional text default null,
  p_page integer default 1,
  p_page_size integer default 20,
  p_sort_field text default 'nome',
  p_sort_dir text default 'asc'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_rows jsonb;
  v_total bigint;
  v_offset integer;
  v_search text;
  v_digits text;
begin
  v_offset := greatest(coalesce(p_page, 1) - 1, 0) * greatest(coalesce(p_page_size, 20), 1);
  v_search := nullif(btrim(coalesce(p_search, '')), '');
  v_digits := nullif(regexp_replace(coalesce(p_search, ''), '\D', '', 'g'), '');

  with cad as (
    select
      regexp_replace(c.numcpf, '\D', '', 'g') as cpf_key,
      count(*)::int as qtd_os_caderno,
      jsonb_agg(jsonb_build_object(
        'numos', c.numos,
        'numobra', c.numobra,
        'status', c.status,
        'controle_os', c.controle_os
      ) order by c.numos) as os_caderno,
      max(c.regional) as regional,
      max(c.nomecli) as nomecli,
      max(c.email) as email,
      max(c.numtel) as telefone,
      bool_or(coalesce(c.in_base_5311, false)) as in_base_5311
    from public.caderno c
    where c.deleted_at is null
      and nullif(regexp_replace(coalesce(c.numcpf, ''), '\D', '', 'g'), '') is not null
    group by 1
  ),
  des as (
    select
      regexp_replace(d.numcpf, '\D', '', 'g') as cpf_key,
      count(*)::int as qtd_os_despacho,
      jsonb_agg(jsonb_build_object(
        'numos', d.numos,
        'tratativa', d.tratativa,
        'dias_para_despacho', d.dias_para_despacho
      ) order by d.numos) as os_despacho,
      max(d.regional) as regional,
      max(d.nomecli) as nomecli,
      max(d.email) as email,
      max(d.telefone) as telefone,
      bool_or(coalesce(d.in_base_5311, false)) as in_base_5311
    from public.despacho d
    where d.deleted_at is null
      and nullif(regexp_replace(coalesce(d.numcpf, ''), '\D', '', 'g'), '') is not null
    group by 1
  ),
  chaves as (
    select regexp_replace(c.cpf, '\D', '', 'g') as cpf_key
    from public.cliente c
    where c.deleted_at is null
      and nullif(regexp_replace(coalesce(c.cpf, ''), '\D', '', 'g'), '') is not null
    union
    select cpf_key from cad
    union
    select cpf_key from des
  ),
  base as (
    select
      k.cpf_key,
      coalesce(cli.nome, cad.nomecli, des.nomecli, 'Sem nome') as nome,
      coalesce(cli.cpf, k.cpf_key) as cpf,
      coalesce(cli.email, cad.email, des.email) as email,
      coalesce(
        case
          when cli.telefone is not null then array_to_string(cli.telefone, ', ')
          else null
        end,
        cad.telefone,
        des.telefone
      ) as telefone,
      coalesce(cad.regional, des.regional) as regional,
      coalesce(cad.in_base_5311, des.in_base_5311, false) as in_base_5311,
      coalesce(cad.qtd_os_caderno, 0) as qtd_os_caderno,
      coalesce(des.qtd_os_despacho, 0) as qtd_os_despacho,
      coalesce(cad.os_caderno, '[]'::jsonb) as os_caderno,
      coalesce(des.os_despacho, '[]'::jsonb) as os_despacho
    from chaves k
    left join public.cliente cli
      on cli.deleted_at is null
     and regexp_replace(coalesce(cli.cpf, ''), '\D', '', 'g') = k.cpf_key
    left join cad on cad.cpf_key = k.cpf_key
    left join des on des.cpf_key = k.cpf_key
  ),
  filtrado as (
    select *
    from base b
    where (
      v_search is null
      or b.nome ilike '%' || v_search || '%'
      or coalesce(b.email, '') ilike '%' || v_search || '%'
      or (v_digits is not null and b.cpf_key like '%' || v_digits || '%')
    )
    and (p_regional is null or p_regional = '' or b.regional = p_regional)
  )
  select
    coalesce(jsonb_agg(t.row_data order by t.rn), '[]'::jsonb),
    (select count(*) from filtrado)
  into v_rows, v_total
  from (
    select
      row_number() over (
        order by
          case when p_sort_field = 'nome' and p_sort_dir <> 'desc' then f.nome end asc nulls last,
          case when p_sort_field = 'nome' and p_sort_dir = 'desc' then f.nome end desc nulls last,
          case when p_sort_field = 'cpf' and p_sort_dir <> 'desc' then f.cpf end asc nulls last,
          case when p_sort_field = 'cpf' and p_sort_dir = 'desc' then f.cpf end desc nulls last,
          case when p_sort_field = 'os_pendentes' and p_sort_dir <> 'desc' then f.qtd_os_caderno + f.qtd_os_despacho end asc nulls last,
          case when p_sort_field = 'os_pendentes' and p_sort_dir = 'desc' then f.qtd_os_caderno + f.qtd_os_despacho end desc nulls last,
          f.nome asc nulls last
      ) as rn,
      jsonb_build_object(
        'cpf', f.cpf,
        'nome', f.nome,
        'email', f.email,
        'telefone', f.telefone,
        'regional', f.regional,
        'in_base_5311', f.in_base_5311,
        'qtd_os_caderno', f.qtd_os_caderno,
        'qtd_os_despacho', f.qtd_os_despacho,
        'os_caderno', f.os_caderno,
        'os_despacho', f.os_despacho
      ) as row_data
    from filtrado f
    order by rn
    limit greatest(coalesce(p_page_size, 20), 1)
    offset v_offset
  ) t;

  return jsonb_build_object('rows', coalesce(v_rows, '[]'::jsonb), 'total', coalesce(v_total, 0));
end;
$$;

grant execute on function public.get_clientes_rpc(text, text, integer, integer, text, text) to authenticated;

-- Regionais distintas presentes em caderno/despacho (para o filtro da tela).
create or replace function public.get_regionais_clientes()
returns table(regional text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct r.regional
  from (
    select c.regional from public.caderno c where c.deleted_at is null
    union
    select d.regional from public.despacho d where d.deleted_at is null
  ) r
  where nullif(btrim(coalesce(r.regional, '')), '') is not null
  order by 1;
$$;

grant execute on function public.get_regionais_clientes() to authenticated;
