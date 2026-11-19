import { useState, useEffect } from "react";
import { useClientesRpc, useRegionaisClientes, type Cliente } from "@/hooks/useClientesBase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyableInput } from "@/components/CopyableInput";
import { Loader2, Search, X, Users, Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { maskCpf } from "@/lib/cpfMask";

const ITEMS_PER_PAGE = 20;

type SortField = "nome" | "cpf" | "os_pendentes";

export default function ClientesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: regionais = [] } = useRegionaisClientes();
  const { data, isLoading, isFetching } = useClientesRpc({
    search,
    regional: filterRegional === "all" ? "" : filterRegional,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    sortField,
    sortDir,
  });

  const clientes = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilterRegional("all");
    setCurrentPage(1);
  };

  const handleViewCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes (filtrados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Com OS no Caderno (página)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {clientes.filter((c) => c.qtdOsCaderno > 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Com OS no Despacho (página)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {clientes.filter((c) => c.qtdOsDespacho > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por CPF, Nome ou E-mail..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={filterRegional}
                onValueChange={(v) => {
                  setFilterRegional(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Regionais</SelectItem>
                  {regionais.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-xs">Ações</TableHead>
                  <TableHead className="text-xs">
                    <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("cpf")}>
                      CPF <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">
                    <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("nome")}>
                      Nome <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs text-center">
                    <button type="button" className="flex items-center gap-1 mx-auto" onClick={() => toggleSort("os_pendentes")}>
                      OS Pendentes <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => {
                    const totalPend = cliente.qtdOsCaderno + cliente.qtdOsDespacho;
                    return (
                      <TableRow
                        key={cliente.cpf || cliente.nome}
                        className="cursor-pointer"
                        onClick={() => handleViewCliente(cliente)}
                      >
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewCliente(cliente); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{maskCpf(cliente.cpf)}</TableCell>
                        <TableCell className="font-medium text-xs">{cliente.nome}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={totalPend > 0 ? "default" : "outline"} className="text-xs">
                            {totalPend}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {total > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0} a {Math.min(currentPage * ITEMS_PER_PAGE, total)} de {total} clientes
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
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>

          {selectedCliente && (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Client Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">CPF</Label>
                      <CopyableInput value={selectedCliente.cpf} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nome</Label>
                      <CopyableInput value={selectedCliente.nome} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">E-mail</Label>
                      <CopyableInput value={selectedCliente.email} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Telefone</Label>
                      <CopyableInput value={selectedCliente.telefone} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Regional</Label>
                      <CopyableInput value={selectedCliente.regional} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Base 5311</Label>
                      <div>
                        {selectedCliente.inBase5311 ? (
                          <Badge variant="destructive">SIM — Cliente prioritário</Badge>
                        ) : (
                          <Badge variant="outline">NÃO</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* OS Tabs */}
              <Tabs defaultValue="caderno" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="caderno">
                    Caderno ({selectedCliente.osCaderno.length})
                  </TabsTrigger>
                  <TabsTrigger value="despacho">
                    Despacho ({selectedCliente.osDespacho.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="caderno" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NUMOS</TableHead>
                          <TableHead>Num Obra</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Controle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCliente.osCaderno.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Nenhuma OS no Caderno
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedCliente.osCaderno.map((os) => (
                            <TableRow key={os.numos}>
                              <TableCell className="font-mono">{os.numos}</TableCell>
                              <TableCell className="font-mono">{os.numobra ?? "-"}</TableCell>
                              <TableCell>{os.status ?? "-"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{os.controle_os ?? "-"}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="despacho" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NUMOS</TableHead>
                          <TableHead>Tratativa</TableHead>
                          <TableHead>Dias p/ Despacho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCliente.osDespacho.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              Nenhuma OS no Despacho
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedCliente.osDespacho.map((os) => (
                            <TableRow key={os.numos}>
                              <TableCell className="font-mono">{os.numos}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{os.tratativa ?? "-"}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={(os.dias_para_despacho ?? 0) > 15 ? "destructive" : "outline"}>
                                  {os.dias_para_despacho ?? 0} dias
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
