import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCaderno } from "@/hooks/useCaderno";
import { Caderno as CadernoType } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, ChevronLeft, ChevronRight, Loader2, Eye, Home, Filter, Download } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { exportToExcel } from "@/lib/excelUtils";
import { toast } from "sonner";
import { maskCpf } from "@/lib/cpfMask";
import { CopyableInput } from "@/components/CopyableInput";

const ITEMS_PER_PAGE = 20;

const PRIORIDADES = [
  { value: "Diretoria", label: "Diretoria" },
  { value: "Reclamações", label: "Reclamações" },
  { value: "Aneel / MME / Judicial", label: "Aneel / MME / Judicial" },
  { value: "Quilombolas", label: "Quilombolas" },
  { value: "Indígenas", label: "Indígenas" },
  { value: "Outros", label: "Outros" },
];

export default function CadernoConsulta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("modo") || "caderno"; // caderno, cartas, prioridade
  const initialPrioridade = searchParams.get("prioridade") || "all";
  const initialTipoCarta = searchParams.get("tipo_carta") || "all";
  
  const { data, isLoading } = useCaderno(1000);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [filterPrioridade, setFilterPrioridade] = useState<string>(initialPrioridade);
  const [filterTipoCarta, setFilterTipoCarta] = useState<string>(initialTipoCarta);
  const [filterTranche, setFilterTranche] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CadernoType | null>(null);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.numos.toString().includes(search) ||
          item.nomecli?.toLowerCase().includes(searchLower) ||
          item.numcpf?.includes(search)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((item) => item.status === filterStatus);
    }

    if (filterRegional !== "all") {
      result = result.filter((item) => item.regional === filterRegional);
    }

    if (filterTranche !== "all") {
      result = result.filter((item) => item.tranche === filterTranche);
    }

    // Priority filter
    if (filterPrioridade !== "all") {
      result = result.filter((item) => 
        item.prioridade?.toLowerCase().includes(filterPrioridade.toLowerCase())
      );
    }

    // Letter type filter
    if (filterTipoCarta !== "all") {
      result = result.filter((item) => item.tipo_carta_enviada === filterTipoCarta);
    }

    return result;
  }, [data, search, filterStatus, filterRegional, filterTranche, filterPrioridade, filterTipoCarta]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleView = (item: CadernoType) => {
    setSelectedItem(item);
    setDetailDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterRegional("all");
    setFilterPrioridade("all");
    setFilterTipoCarta("all");
    setFilterTranche("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      NUMOS: item.numos,
      NUMOBRA: item.numobra,
      STATUS: item.status,
      REGIONAL: item.regional,
      NOMECLI: item.nomecli,
      NUMCPF: item.numcpf,
      EMAIL: item.email,
      NUMTEL: item.numtel,
      RESPONSAVEL: item.responsavel,
      TRANCHE: item.tranche,
      PRIORIDADE: item.prioridade,
      TIPO_CARTA: item.tipo_carta_enviada,
    }));
    exportToExcel(exportData, "Caderno", `caderno_consulta_${new Date().toISOString().split("T")[0]}.xlsx`)
      .then(() => toast.success("Dados exportados com sucesso!"))
      .catch((err) => toast.error(`Erro ao exportar: ${err.message}`));
  };

  const statuses = [...new Set(data.map((d) => d.status).filter(Boolean))];
  const regionais = [...new Set(data.map((d) => d.regional).filter(Boolean))];
  const tranches = [...new Set(data.map((d) => d.tranche).filter(Boolean))];
  const tiposCartas = [...new Set(data.map((d) => d.tipo_carta_enviada).filter(Boolean))];

  const getTitle = () => {
    if (mode === "cartas") return "Caderno – Cartas";
    if (mode === "prioridade" && filterPrioridade !== "all") {
      return `Caderno – ${filterPrioridade}`;
    }
    return "Caderno";
  };

  const getActiveFilterLabel = () => {
    if (mode === "cartas" && filterTipoCarta !== "all") return `Tipo de Carta: ${filterTipoCarta}`;
    if (mode === "prioridade" && filterPrioridade !== "all") return `Prioridade: ${filterPrioridade}`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">{getTitle()}</h1>
              <span className="text-xs text-muted-foreground">Visualização somente leitura</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-4 space-y-4 overflow-auto min-h-0">
        {/* Active filter indicator */}
        {getActiveFilterLabel() && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <Badge variant="secondary" className="text-sm">
              {getActiveFilterLabel()}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => {
              setFilterPrioridade("all");
              setFilterTipoCarta("all");
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Priority quick filters for prioridade mode */}
        {mode === "prioridade" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prioridades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PRIORIDADES.map((p) => (
                  <Button
                    key={p.value}
                    variant={filterPrioridade === p.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterPrioridade(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
                <Button
                  variant={filterPrioridade === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPrioridade("all")}
                >
                  Todas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por OS, Nome ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s!}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRegional} onValueChange={setFilterRegional}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Regionais</SelectItem>
                  {regionais.map((r) => (
                    <SelectItem key={r} value={r!}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "cartas" && (
                <Select value={filterTipoCarta} onValueChange={setFilterTipoCarta}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de Carta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {tiposCartas.map((t) => (
                      <SelectItem key={t} value={t!}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={filterTranche} onValueChange={setFilterTranche}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tranche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Tranches</SelectItem>
                  {tranches.map((t) => (
                    <SelectItem key={t} value={t!}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="flex-1 min-h-0 flex flex-col">
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="w-full flex-1">
              <div className="min-w-[3000px]">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-background">
                    <TableRow>
                      <TableHead className="w-[50px] sticky left-0 bg-background z-30">Ações</TableHead>
                      <TableHead>NUMOS</TableHead>
                      <TableHead>Num Obra</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>LCD</TableHead>
                      <TableHead>Regional</TableHead>
                      <TableHead>Controle OS</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Nome Cliente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Telefone 2</TableHead>
                      <TableHead>Complemento</TableHead>
                      <TableHead>Endereço OS</TableHead>
                      <TableHead>Data Solicitação</TableHead>
                      <TableHead>Data Ter. Trab.</TableHead>
                      <TableHead>Data Impedimento</TableHead>
                      <TableHead>Motivo Improcedência</TableHead>
                      <TableHead>Pendência Obra</TableHead>
                      <TableHead>Critério</TableHead>
                      <TableHead>Tipo Carta</TableHead>
                      <TableHead>Base 5311</TableHead>
                      <TableHead>Tranche</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Empreiteira</TableHead>
                      <TableHead>Data Carta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={31} className="text-center text-muted-foreground py-8">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="sticky left-0 bg-background z-20">
                            <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono">{item.numos}</TableCell>
                          <TableCell className="font-mono">{item.numobra ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.status ?? "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{item.nomelcd ?? "-"}</TableCell>
                          <TableCell>{item.regional ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.controle_os ?? "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{item.origem ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.prazo ?? "-"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{item.nomecli ?? "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{maskCpf(item.numcpf)}</TableCell>
                          <TableCell className="text-xs">{item.dth_nascimento ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.email ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.numtel ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.numtel2 ?? "-"}</TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate">{item.complemento ?? "-"}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{item.dsclgr_os ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.datasol ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.datatertrab ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.dth_impedimento ?? "-"}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{item.motivo_improcedencia ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.pendencia_obra ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.criterio ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.tipo_carta_enviada ?? "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{item.base_5311 ?? "-"}</TableCell>
                          <TableCell>{item.tranche ?? "-"}</TableCell>
                          <TableCell>{item.responsavel ?? "-"}</TableCell>
                          <TableCell>
                            {item.prioridade && <Badge variant="default">{item.prioridade}</Badge>}
                            {!item.prioridade && "-"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate">{item.observacao ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.empreiteira ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.data_carta ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredData.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* View Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Detalhes do Caderno – OS {selectedItem?.numos}</SheetTitle>
            <SheetDescription>Visualização somente leitura. Clique no ícone para copiar.</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Identificação</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-muted-foreground">NUMOS</Label><CopyableInput value={String(selectedItem.numos)} /></div>
                    <div><Label className="text-xs text-muted-foreground">Num Obra</Label><CopyableInput value={selectedItem.numobra} /></div>
                    <div><Label className="text-xs text-muted-foreground">Status</Label><CopyableInput value={selectedItem.status} /></div>
                    <div><Label className="text-xs text-muted-foreground">Controle OS</Label><CopyableInput value={selectedItem.controle_os} /></div>
                    <div><Label className="text-xs text-muted-foreground">LCD</Label><CopyableInput value={selectedItem.nomelcd} /></div>
                    <div><Label className="text-xs text-muted-foreground">Regional</Label><CopyableInput value={selectedItem.regional} /></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">Nome</Label><CopyableInput value={selectedItem.nomecli} /></div>
                    <div><Label className="text-xs text-muted-foreground">CPF</Label><CopyableInput value={maskCpf(selectedItem.numcpf)} /></div>
                    <div><Label className="text-xs text-muted-foreground">Nascimento</Label><CopyableInput value={selectedItem.dth_nascimento} /></div>
                    <div><Label className="text-xs text-muted-foreground">Telefone</Label><CopyableInput value={selectedItem.numtel} /></div>
                    <div><Label className="text-xs text-muted-foreground">Telefone 2</Label><CopyableInput value={selectedItem.numtel2} /></div>
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">E-mail</Label><CopyableInput value={selectedItem.email} /></div>
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">Endereço OS</Label><CopyableInput value={selectedItem.dsclgr_os} /></div>
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">Complemento</Label><CopyableInput value={selectedItem.complemento} /></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tratativa</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-muted-foreground">Critério</Label><CopyableInput value={selectedItem.criterio} /></div>
                    <div><Label className="text-xs text-muted-foreground">Base 5311</Label><CopyableInput value={selectedItem.base_5311} /></div>
                    <div><Label className="text-xs text-muted-foreground">Tipo Carta Enviada</Label><CopyableInput value={selectedItem.tipo_carta_enviada} /></div>
                    <div><Label className="text-xs text-muted-foreground">Data Carta</Label><CopyableInput value={selectedItem.data_carta} /></div>
                    <div><Label className="text-xs text-muted-foreground">Tranche</Label><CopyableInput value={selectedItem.tranche} /></div>
                    <div><Label className="text-xs text-muted-foreground">Prioridade</Label><CopyableInput value={selectedItem.prioridade} /></div>
                    <div><Label className="text-xs text-muted-foreground">Responsável</Label><CopyableInput value={selectedItem.responsavel} /></div>
                    <div><Label className="text-xs text-muted-foreground">Empreiteira</Label><CopyableInput value={selectedItem.empreiteira} /></div>
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">Motivo Improcedência</Label><CopyableInput value={selectedItem.motivo_improcedencia} multiline /></div>
                    <div className="col-span-2"><Label className="text-xs text-muted-foreground">Observação</Label><CopyableInput value={selectedItem.observacao} multiline /></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Datas</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-muted-foreground">Data Solicitação</Label><CopyableInput value={selectedItem.datasol} /></div>
                    <div><Label className="text-xs text-muted-foreground">Data Ter. Trab.</Label><CopyableInput value={selectedItem.datatertrab} /></div>
                    <div><Label className="text-xs text-muted-foreground">Data Impedimento</Label><CopyableInput value={selectedItem.dth_impedimento} /></div>
                    <div><Label className="text-xs text-muted-foreground">Prazo</Label><CopyableInput value={selectedItem.prazo} /></div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
