import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDespacho } from "@/hooks/useDespacho";
import { Despacho as DespachoType } from "@/types/database";
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
import { Search, X, ChevronLeft, ChevronRight, Loader2, Eye, Home, Filter } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { maskCpf } from "@/lib/cpfMask";
import { getTratativaStyle } from "@/lib/tratativaStyle";

const ITEMS_PER_PAGE = 20;

export default function DespachoConsulta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialFilter = searchParams.get("filtro") || "all";
  
  const { data, isLoading } = useDespacho(true); // Show all including concluded
  const [search, setSearch] = useState("");
  const [filterTratativa, setFilterTratativa] = useState<string>(initialFilter);
  const [filterBase, setFilterBase] = useState<string>("all");
  const [filterFamilia, setFilterFamilia] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DespachoType | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof DespachoType | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

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

    if (filterTratativa !== "all") {
      if (filterTratativa === "Pendente") {
        result = result.filter((item) => item.tratativa === "Pendente");
      } else if (filterTratativa === "Inconsistencia") {
        result = result.filter((item) => (item.inconsistencia ?? 0) > 0);
      } else {
        result = result.filter((item) => item.tratativa === filterTratativa);
      }
    }

    if (filterBase !== "all") {
      result = result.filter((item) => item.base === filterBase);
    }

    if (filterFamilia !== "all") {
      result = result.filter((item) => item.familia === filterFamilia);
    }

    if (filterDataInicio) {
      const inicio = new Date(filterDataInicio);
      inicio.setHours(0, 0, 0, 0);
      result = result.filter((item) => new Date(item.updated_at) >= inicio);
    }

    if (filterDataFim) {
      const fim = new Date(filterDataFim);
      fim.setHours(23, 59, 59, 999);
      result = result.filter((item) => new Date(item.updated_at) <= fim);
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, filterTratativa, filterBase, filterFamilia, filterDataInicio, filterDataFim, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleSort = (column: keyof DespachoType) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleView = (item: DespachoType) => {
    setSelectedItem(item);
    setDetailDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterTratativa("all");
    setFilterBase("all");
    setFilterFamilia("all");
    setFilterDataInicio("");
    setFilterDataFim("");
    setCurrentPage(1);
  };

  const tratativas = [...new Set(data.map((d) => d.tratativa).filter(Boolean))];
  const bases = [...new Set(data.map((d) => d.base).filter(Boolean))];
  const familias = [...new Set(data.map((d) => d.familia).filter(Boolean))];

  const getFilterLabel = () => {
    if (filterTratativa === "Pendente") return "Pendentes";
    if (filterTratativa === "Inconsistencia") return "Com Inconsistência";
    if (filterTratativa !== "all") return filterTratativa;
    return "";
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
              <h1 className="text-xl font-bold text-primary">
                Despacho {getFilterLabel() && `– ${getFilterLabel()}`}
              </h1>
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
        {filterTratativa !== "all" && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <Badge variant="secondary" className="text-sm">
              Filtro ativo: {getFilterLabel()}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setFilterTratativa("all")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                  placeholder="Buscar por NUMOS, Nome ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterTratativa} onValueChange={setFilterTratativa}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Inconsistencia">Com Inconsistência</SelectItem>
                  {tratativas.filter(t => t !== "Pendente").map((t) => (
                    <SelectItem key={t} value={t!}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBase} onValueChange={setFilterBase}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {bases.map((b) => (
                    <SelectItem key={b} value={b!}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterFamilia} onValueChange={setFilterFamilia}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Família OS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {familias.map((f) => (
                    <SelectItem key={f} value={f!}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterDataInicio}
                onChange={(e) => setFilterDataInicio(e.target.value)}
                className="w-[150px]"
                title="Modificado a partir de"
              />
              <Input
                type="date"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
                className="w-[150px]"
                title="Modificado até"
              />
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="flex-1 min-h-0 flex flex-col">
          <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="w-full flex-1">
              <div className="min-w-[2000px]">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-background">
                    <TableRow>
                      <TableHead className="w-[50px] sticky left-0 bg-background z-30">Ações</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("numos")}>
                        NUMOS {sortColumn === "numos" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("dias_para_despacho")}>
                        Dias {sortColumn === "dias_para_despacho" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Incons</TableHead>
                      <TableHead>LCD</TableHead>
                      <TableHead>Regional</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("nomecli")}>
                        Cliente {sortColumn === "nomecli" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Tratativa</TableHead>
                      <TableHead>Motivo Improcedência</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Família</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Complemento</TableHead>
                      <TableHead>Endereço OS</TableHead>
                      <TableHead>Critério</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("updated_at")}>
                        Modificado em {sortColumn === "updated_at" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={20} className="text-center text-muted-foreground py-8">
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
                          <TableCell className="font-mono text-xs">{item.numos}</TableCell>
                          <TableCell>
                            <Badge variant={(item.dias_para_despacho ?? 0) > 15 ? "destructive" : (item.dias_para_despacho ?? 0) > 10 ? "secondary" : "outline"}>
                              {item.dias_para_despacho ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.inconsistencia ? "destructive" : "outline"}>
                              {item.inconsistencia ?? 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{item.nomelcd ?? "-"}</TableCell>
                          <TableCell>{item.regional ?? "-"}</TableCell>
                          <TableCell>{item.nomecli ?? "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{maskCpf(item.numcpf)}</TableCell>
                          <TableCell className="text-xs">{item.dth_nascimento ?? "-"}</TableCell>
                          <TableCell>{item.responsavel ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" style={getTratativaStyle(item.tratativa)}>
                              {item.tratativa ?? "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{item.motivo_da_improcedencia ?? "-"}</TableCell>
                          <TableCell>{item.base ?? "-"}</TableCell>
                          <TableCell>{item.familia ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.telefone ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.email ?? "-"}</TableCell>
                          <TableCell className="text-xs max-w-[100px] truncate">{item.complemento ?? "-"}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{item.dsclgr_os ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.criterio ?? "-"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(item.updated_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
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
                Mostrando {filteredData.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length} registros
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
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhes do Despacho</SheetTitle>
            <SheetDescription>Visualização somente leitura</SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">NUMOS</Label>
                    <p className="font-mono font-medium">{selectedItem.numos}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dias p/ Despacho</Label>
                    <p className="font-medium">{selectedItem.dias_para_despacho ?? "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Inconsistência</Label>
                    <p className="font-medium">{selectedItem.inconsistencia ?? "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tratativa</Label>
                    <Badge variant="secondary" style={getTratativaStyle(selectedItem.tratativa)}>
                      {selectedItem.tratativa}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{selectedItem.nomecli ?? "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">CPF</Label>
                    <p className="font-mono text-sm">{selectedItem.numcpf ?? "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Regional</Label>
                    <p className="font-medium">{selectedItem.regional ?? "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Endereço</Label>
                  <p className="font-medium">{selectedItem.dsclgr_os ?? "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Base</Label>
                    <p className="font-medium">{selectedItem.base ?? "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Família</Label>
                    <p className="font-medium">{selectedItem.familia ?? "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="font-medium">{selectedItem.responsavel ?? "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{selectedItem.telefone ?? "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">E-mail</Label>
                    <p className="font-medium text-sm">{selectedItem.email ?? "-"}</p>
                  </div>
                </div>
                {selectedItem.motivo_da_improcedencia && (
                  <div>
                    <Label className="text-muted-foreground">Motivo da Improcedência</Label>
                    <p className="font-medium">{selectedItem.motivo_da_improcedencia}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Modificado em</Label>
                  <p className="font-medium">{format(new Date(selectedItem.updated_at), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
