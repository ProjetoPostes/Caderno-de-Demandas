import { useState, useMemo } from "react";
import { Building2, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleTablePage, type SortDir } from "@/components/tables/SimpleTablePage";
import { useObras, useObraOsCounts, useObraOsList } from "@/hooks/useTabelasOperacionais";
import type { Obra } from "@/types/database";

const PAGE_SIZE = 20;
const DESCRICAO_INICIAL = "CONSTRUÇÃO DE 3736M DE REDE MT MONOFÁSICA COM INSTALAÇÃO DE 01 TRANSFORMADOR DE 15 KVA EM RDR 19,9 KW";

function formatarData(valor: string | null | undefined) {
  if (!valor) return "—";
  const data = new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleDateString("pt-BR");
}

function rotuloResultado(resultado: string | null) {
  if (resultado === "aprovado") return "Aprovado";
  if (resultado === "reprovado") return "Não aprovado";
  return "Pendente";
}

function varianteResultado(resultado: string | null): "default" | "destructive" | "secondary" {
  if (resultado === "aprovado") return "default";
  if (resultado === "reprovado") return "destructive";
  return "secondary";
}

export default function ObrasPage({ standalone = false }: { standalone?: boolean }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState("num_obra");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useObras({ page, pageSize: PAGE_SIZE, search, sortField, sortDir, filters });
  const rows = data?.rows ?? [];
  const idObras = useMemo(() => rows.map((o) => o.id_obra), [rows]);
  const { data: counts } = useObraOsCounts(idObras);

  const [selected, setSelected] = useState<Obra | null>(null);
  const { data: osList, isLoading: loadingOsList } = useObraOsList(selected?.id_obra ?? null);
  const primeiraOs = osList?.[0];

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
        columnFilters={[
          { field: "num_obra", label: "Num Obra" },
          { field: "status", label: "Status" },
        ]}
        filterValues={filters}
        onFilterChange={(f, v) => { setFilters((p) => ({ ...p, [f]: v })); setPage(1); }}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={(f, d) => { setSortField(f); setSortDir(d); }}
        onClear={() => { setSearch(""); setFilters({}); setPage(1); }}
        onRowClick={(o) => setSelected(o)}
        rowKey={(o) => o.id_obra}
        columns={[
          { header: "Num Obra", sortField: "num_obra", className: "text-xs", cell: (o) => <span className="font-mono text-xs">{o.num_obra ?? "-"}</span> },
          { header: "Status", sortField: "status", className: "text-xs", cell: (o) => <Badge variant="outline" className="text-xs">{o.status ?? "-"}</Badge> },
          { header: "SIGCO", sortField: "sigco", className: "text-xs", cell: (o) => <span className="text-xs">{o.sigco ?? "-"}</span> },
          { header: "OSs", className: "text-xs text-center", cell: (o) => (
            <div className="text-center">
              <Badge variant={(counts?.[o.id_obra] ?? 0) > 0 ? "default" : "outline"} className="text-xs">
                {counts?.[o.id_obra] ?? 0}
              </Badge>
            </div>
          )},
        ]}
      />

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-12">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Detalhes da obra
            </DialogTitle>
            <DialogDescription>Informações consolidadas da obra e dos clientes vinculados.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-82px)]">
            <div className="space-y-6 p-6">
              <section className="grid gap-x-8 gap-y-3 border-b pb-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Nº Obra</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{selected?.num_obra ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Tranche</p>
                  <p className="mt-1 text-sm font-medium">{primeiraOs?.tranche ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Nome envolvido</p>
                  <p className="mt-1 text-sm font-medium">{primeiraOs?.cliente?.nome ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Município</p>
                  <p className="mt-1 text-sm font-medium">{primeiraOs?.localidade?.municipio ?? primeiraOs?.localidade?.nome_lcd ?? "—"}</p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Informações da obra</h3>
                <div className="grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Status", selected?.status ?? "Indefinido"],
                    ["Data Início", formatarData(primeiraOs?.datasol)],
                    ["Data de Fim", formatarData(primeiraOs?.datatertrab)],
                    ["Valor orçado", "—"],
                    ["Valor realizado", "—"],
                  ].map(([label, value], index) => (
                    <div key={label} className={`min-h-16 bg-muted/30 p-3 ${index > 0 ? "border-t sm:border-l sm:border-t-0" : ""}`}>
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Descrição da obra</h3>
                <div className="rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">
                  {DESCRICAO_INICIAL}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <Users className="h-4 w-4" /> Clientes
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {loadingOsList ? "Carregando..." : `${osList?.length ?? 0} vinculado(s)`}
                  </span>
                </div>
                <div className="overflow-hidden rounded-md border">
                  {loadingOsList ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs uppercase">Cliente</TableHead>
                          <TableHead className="w-48 text-xs uppercase">Status validação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(osList ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="py-8 text-center text-xs text-muted-foreground">
                              Nenhum cliente vinculado a esta obra
                            </TableCell>
                          </TableRow>
                        ) : (
                          (osList ?? []).map((os) => (
                            <TableRow key={os.id_os}>
                              <TableCell className="text-sm font-medium">{os.cliente?.nome ?? "Cliente não informado"}</TableCell>
                              <TableCell>
                                <Badge variant={varianteResultado(os.resultado_analise)} className="whitespace-nowrap">
                                  {rotuloResultado(os.resultado_analise)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
