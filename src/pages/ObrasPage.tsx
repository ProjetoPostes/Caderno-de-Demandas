import { useDebounce } from "@/hooks/useDebounce";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Wallet, Banknote, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResumoObras } from "@/hooks/useResumoObras";
import { SimpleTablePage, type SortDir } from "@/components/tables/SimpleTablePage";
import { useObras, useObraOsCounts, useTranchesCaderno } from "@/hooks/useTabelasOperacionais";
import type { Obra } from "@/types/database";

const PAGE_SIZE = 20;
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export default function ObrasPage({ standalone = false }: { standalone?: boolean }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState("num_obra");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const buscaAtraso = useDebounce(search, 350);
  const filtrosAtraso = useDebounce(filters, 350);

  const { data: tranchesOpcoes } = useTranchesCaderno();
  const { data, isLoading } = useObras({ page, pageSize: PAGE_SIZE, search: buscaAtraso, sortField, sortDir, filters: filtrosAtraso });
  const resumo = useResumoObras({ search: buscaAtraso, filters: filtrosAtraso });
  const atualizando = search !== buscaAtraso || filters !== filtrosAtraso || resumo.isFetching;
  const rows = data?.rows ?? [];
  const idObras = useMemo(() => rows.map((o) => o.id_obra), [rows]);
  const { data: counts } = useObraOsCounts(idObras);

  const navigate = useNavigate();

  return (
    <>
      <SimpleTablePage<Obra>
        standalone={standalone}
        title="Obras"
        subtitle="Tabela de obras"
        icon={<Building2 className="h-4 w-4" />}
        isLoading={isLoading}
        rows={rows}
        total={data?.total ?? 0}
        totalNosFiltros="obras"
        summary={
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy={atualizando}>
              {[
                { titulo: "Número de obras", valor: resumo.data?.numeroObras.toLocaleString("pt-BR"), Icone: Building2 },
                { titulo: "Valor orçado", valor: resumo.data && moeda.format(resumo.data.valorOrcado), Icone: Wallet },
                { titulo: "Valor realizado", valor: resumo.data && moeda.format(resumo.data.valorRealizado), Icone: Banknote },
              ].map(({ titulo, valor, Icone }) => (
                <Card key={titulo}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>{titulo}</span><Icone className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="mt-2 flex min-h-8 items-center gap-2 text-xl font-semibold tabular-nums break-all">
                      {atualizando ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-label="Atualizando totais" /> : resumo.isError ? "—" : valor ?? "—"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {resumo.isError && !atualizando && <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
              Não foi possível carregar os totais das obras.
              <Button variant="outline" size="sm" onClick={() => resumo.refetch()}>Tentar novamente</Button>
            </div>}
          </div>
        }
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por número ou status..."
        filterSource={{ tabela: "obra", chave: "id_obra", incluirVazios: false }}
        columnFilters={[
          { field: "num_obra", label: "Num Obra", type: "text" },
          { field: "status", label: "Status" },
          { field: "status_unificado", label: "Status unificado" },
          { field: "tranche", label: "Tranche", options: tranchesOpcoes ?? [] },
          { field: "analise_obra", label: "Analise" },
          { field: "cadastro_enbpar", label: "EnbPar" },
          { field: "etapa", label: "Etapa" },
          { field: "ods", label: "ODS", type: "text" },
          { field: "status_ods", label: "Status ODS" },
        ]}
        filterValues={filters}
        onFilterChange={(f, v) => { setFilters((p) => ({ ...p, [f]: v })); setPage(1); }}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={(f, d) => { setSortField(f); setSortDir(d); }}
        onClear={() => { setSearch(""); setFilters({}); setPage(1); }}
        onRowClick={(o) => navigate(`/obras/${o.id_obra}`)}
        rowKey={(o) => o.id_obra}
        columns={[
          { header: "Num Obra", sortField: "num_obra", className: "text-xs", cell: (o) => <span className="font-mono text-xs">{o.num_obra ?? "-"}</span> },
          { header: "Status", sortField: "status", className: "text-xs", cell: (o) => <Badge variant="outline" className="text-xs">{o.status ?? "-"}</Badge> },
          { header: "SIGCO", sortField: "sigco", className: "text-xs", cell: (o) => <span className="text-xs">{o.sigco ?? "-"}</span> },
          { header: "Analise", sortField: "analise_obra", className: "text-xs", cell: (o) => <span className="text-xs">{o.analise_obra ?? "-"}</span> },
          { header: "EnbPar", sortField: "cadastro_enbpar", className: "text-xs", cell: (o) => <span className="text-xs">{o.cadastro_enbpar ?? "-"}</span> },
          { header: "Etapa", sortField: "etapa", className: "text-xs", cell: (o) => <span className="text-xs">{o.etapa ?? "-"}</span> },
          { header: "ODS", sortField: "ods", className: "text-xs", cell: (o) => <span className="text-xs">{(o as Obra & { ods?: string | null }).ods ?? "-"}</span> },
          { header: "Status ODS", sortField: "status_ods", className: "text-xs", cell: (o) => <span className="text-xs">{(o as Obra & { status_ods?: string | null }).status_ods ?? "-"}</span> },
          { header: "OSs", className: "text-xs text-center", cell: (o) => (
            <div className="text-center">
              <Badge variant={(counts?.[o.id_obra] ?? 0) > 0 ? "default" : "outline"} className="text-xs">
                {counts?.[o.id_obra] ?? 0}
              </Badge>
            </div>
          )},
        ]}
      />

    </>
  );
}
