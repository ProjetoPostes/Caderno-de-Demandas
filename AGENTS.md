<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Operational detail views must derive display-only aggregates from existing Supabase records and must not persist placeholders, because the external schema is authoritative.
- OS analysis coordinate navigation and municipality lookup share a validated coordinate resolver using proj4 with WGS84 for UTM conversion; this prevents sending meter coordinates as latitude/longitude.
- `useObras` must delegate filtering, sorting and pagination to the existing `get_obras_filtradas` RPC; OS counts remain independent so selecting a tranche does not reduce a work's active OS total.
- Work summary cards share the list's RPC parameter builder and aggregate its complete filtered result, reading missing financial fields from existing work records; this keeps totals independent of the visible page without changing the external schema.
- Priority modal correction fields use transient React state only; coordinate editability is centralized in a tested helper to enforce editing only when validation is false.
- Operational column selectors use shared read-only, deterministically paginated distinct-value queries independent of the current page; preserve raw values for filtering, while work listing and counts retain their existing RPC contracts.
- Column filters explicitly marked as text must not participate in distinct-value queries; presence selectors use null/empty predicates instead of loading individual names to keep category queries small.
- Priority work filters resolve clients from active linked OS records before pagination, with CPF fallback only for missing client IDs; this preserves complete results without modifying the external schema.
- Work validation submissions use the explicit field whitelist in `src/lib/validacaoObra.ts` so display-only source fields cannot leak into updates.
- ODS fields in work validation use transient form state without extending the save whitelist, keeping interface-only edits separate from the existing update contract.
- Work quantitative catalogs and saved items use the shared `buscarTodos` reader with deterministic ordering to avoid truncation by the external API row limit.
- Additional themes inherit neutral base surfaces and override only semantic accent tokens and shared card/selection data-slot accents; light custom themes must not activate Tailwind dark variants or Sonner dark mode, and must not add per-user database preferences, so palette changes remain isolated from layout and base appearance.
- Surface color customization is theme-scoped browser presentation state via AppearanceProvider; pair overrides with tested WCAG AA foreground selection and keep contrast regression tests against global theme tokens to prevent unreadable colors.
- Sidebar imagery is a decorative theme-gated child inside the shared sidebar, with CSS-token overlay and contrast checks; this preserves desktop, collapsed and mobile navigation without duplicating layout or changing authentication.
