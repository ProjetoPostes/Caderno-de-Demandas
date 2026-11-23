import { useDebounce } from "@/hooks/useDebounce";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SimpleTablePage, type SortDir } from "@/components/tables/SimpleTablePage";
import { useObras, useObraOsCounts, useTranchesCaderno } from "@/hooks/useTabelasOperacionais";
import type { Obra } from "@/types/database";

const PAGE_SIZE = 20;
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
          { field: "tranche", label: "Tranche", options: tranchesOpcoes ?? [] },
          { field: "analise_obra", label: "Analise" },
          { field: "cadastro_enbpar", label: "EnbPar" },
          { field: "etapa", label: "Etapa" },
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
