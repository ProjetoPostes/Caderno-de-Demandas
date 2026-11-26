-- KPIs de Prioritários respeitando busca e filtros da tela (somente leitura, respeita RLS).
CREATE OR REPLACE FUNCTION public.get_kpis_prioritarios_filtrados(
  p_busca text DEFAULT NULL,
  p_filtros jsonb DEFAULT '{}'::jsonb,
  p_num_obra text DEFAULT NULL
)
RETURNS TABLE(total bigint, com_tranche bigint, check_po bigint, impedimento bigint)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_where text := 'TRUE';
  v_campo text;
  v_valor text;
  v_busca text := nullif(btrim(coalesce(p_busca, '')), '');
BEGIN
  IF v_busca IS NOT NULL THEN
    v_where := v_where || format(
      ' AND (p.nome ILIKE %1$L OR p.cpf_corrigido ILIKE %1$L OR p.observacao ILIKE %1$L)',
      '%' || v_busca || '%');
  END IF;

  FOR v_campo, v_valor IN SELECT key, value FROM jsonb_each_text(coalesce(p_filtros, '{}'::jsonb)) LOOP
    CONTINUE WHEN v_valor IS NULL OR v_valor = '' OR v_campo = 'obra';
    -- só aceita colunas reais da tabela
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'prioritario' AND column_name = v_campo);
    v_where := v_where || CASE v_valor
      WHEN '__COLUMN_NULL__'   THEN format(' AND p.%I IS NULL', v_campo)
      WHEN '__COLUMN_EMPTY__'  THEN format(' AND p.%I::text = %L', v_campo, '')
      WHEN '__COLUMN_FILLED__' THEN format(' AND p.%1$I IS NOT NULL AND p.%1$I::text <> %2$L', v_campo, '')
      WHEN '__COLUMN_BLANK__'  THEN format(' AND (p.%1$I IS NULL OR p.%1$I::text = %2$L)', v_campo, '')
      ELSE format(' AND p.%I::text = %L', v_campo, v_valor)
    END;
  END LOOP;

  IF nullif(btrim(coalesce(p_num_obra, '')), '') IS NOT NULL THEN
    v_where := v_where || format($f$
      AND EXISTS (
        SELECT 1 FROM caderno c
        JOIN obra o ON o.id_obra = c.id_obra
        LEFT JOIN cliente cl ON cl.id_cliente = c.id_cliente
        WHERE c.deleted_at IS NULL AND o.num_obra::text = %L
          AND (p.id_cliente = c.id_cliente
               OR (p.id_cliente IS NULL
                   AND regexp_replace(coalesce(cl.cpf, ''), '\D', '', 'g') <> ''
                   AND regexp_replace(coalesce(p.cpf_corrigido, ''), '\D', '', 'g')
                       = regexp_replace(coalesce(cl.cpf, ''), '\D', '', 'g'))))$f$,
      btrim(p_num_obra));
  END IF;

  RETURN QUERY EXECUTE
    'SELECT count(*),
            count(*) FILTER (WHERE p.tranche IS NOT NULL),
            count(*) FILTER (WHERE p.check_po IS NOT NULL AND p.check_po::text <> ''''),
            count(*) FILTER (WHERE p.motivo_impedimento IS NOT NULL AND p.motivo_impedimento <> '''')
       FROM prioritario p WHERE ' || v_where;
END;
$$;

REVOKE ALL ON FUNCTION public.get_kpis_prioritarios_filtrados(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_kpis_prioritarios_filtrados(text, jsonb, text) TO authenticated;
