import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, Search, X, Users, Eye, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { maskCpf, formatCpf } from "@/lib/cpfMask";

const ITEMS_PER_PAGE = 20;

export default function ClientesConsulta() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
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
    sortField: "nome",
    sortDir: "asc",
  });

  const clientes = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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
              <h1 className="text-xl font-bold text-primary">Clientes</h1>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes (filtrados)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes no Caderno (página)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {clientes.filter((c) => c.qtdOsCaderno > 0).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes no Despacho (página)</CardTitle>
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
        <Card className="flex-1 min-h-0 flex flex-col">
          <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Ações</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Regional</TableHead>
                  <TableHead className="text-center">OS Caderno</TableHead>
                  <TableHead className="text-center">OS Despacho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.cpf || cliente.nome}>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleViewCliente(cliente)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{maskCpf(cliente.cpf)}</TableCell>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell className="text-xs">{cliente.email ?? "-"}</TableCell>
                      <TableCell className="text-xs">{cliente.telefone ?? "-"}</TableCell>
                      <TableCell>{cliente.regional ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cliente.qtdOsCaderno > 0 ? "default" : "outline"}>
                          {cliente.qtdOsCaderno}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cliente.qtdOsDespacho > 0 ? "secondary" : "outline"}>
                          {cliente.qtdOsDespacho}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
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
      </main>

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
                      <CopyableInput value={formatCpf(selectedCliente.cpf)} />
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
    </div>
  );
}
