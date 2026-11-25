import { useDebounce } from "@/hooks/useDebounce";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { CellChip, CellPill } from "@/components/tables/CellPill";
import { SimpleTablePage, type SortDir } from "@/components/tables/SimpleTablePage";
import { corContagemOs, corPorValor, corSemantica } from "@/lib/obraCores";
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
        totalNosFiltros="obras"
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
          { header: "Num Obra", sortField: "num_obra", className: "px-3 py-3", cell: (o) => <CellChip value={o.num_obra} /> },
          { header: "Status", sortField: "status", className: "px-3 py-3", cell: (o) => <CellPill value={o.status} tone={corSemantica(o.status)} /> },
          { header: "SIGCO", sortField: "sigco", className: "px-3 py-3", cell: (o) => <CellChip value={o.sigco} /> },
          { header: "Analise", sortField: "analise_obra", className: "px-3 py-3", cell: (o) => <CellPill value={o.analise_obra} tone={corSemantica(o.analise_obra)} /> },
          { header: "EnbPar", sortField: "cadastro_enbpar", className: "px-3 py-3", cell: (o) => <CellPill value={o.cadastro_enbpar} tone={corSemantica(o.cadastro_enbpar)} /> },
          { header: "Etapa", sortField: "etapa", className: "px-3 py-3", cell: (o) => <CellPill value={o.etapa} tone={corSemantica(o.etapa)} /> },
          { header: "ODS", sortField: "ods", className: "px-3 py-3", cell: (o) => {
            const ods = (o as Obra & { ods?: string | null }).ods;
            return <CellPill value={ods} tone={corPorValor(ods)} />;
          } },
          { header: "Status ODS", sortField: "status_ods", className: "px-3 py-3", cell: (o) => {
            const statusOds = (o as Obra & { status_ods?: string | null }).status_ods;
            return <CellPill value={statusOds} tone={corSemantica(statusOds)} />;
          } },
          { header: "OSs", className: "px-3 py-3 text-center", cell: (o) => (
            <div className="flex justify-center">
              <CellPill value={counts?.[o.id_obra] ?? 0} tone={corContagemOs(counts?.[o.id_obra])} />
            </div>
          )},
        ]}
      />

    </>
  );
}
