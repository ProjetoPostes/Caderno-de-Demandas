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
- Priority modal correction fields use transient React state only; coordinate editability is centralized in a tested helper to enforce editing only when validation is false.
