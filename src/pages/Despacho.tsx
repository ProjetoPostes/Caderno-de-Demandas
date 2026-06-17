import { useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pencil, Search, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CopyableInput } from "@/components/CopyableInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { maskCpf } from "@/lib/cpfMask";
import { getTratativaStyle } from "@/lib/tratativaStyle";
import { useClienteDuplicatas } from "@/hooks/useClienteDuplicatas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ITEMS_PER_PAGE = 15;

const formSchema = z.object({
  numos: z.coerce.number(),
  dias_para_despacho: z.coerce.number().nullable(),
  inconsistencia: z.coerce.number().nullable(),
  nomelcd: z.string().nullable(),
  regional: z.string().nullable(),
  nomecli: z.string().nullable(),
  numcpf: z.string().nullable(),
  dth_nascimento: z.string().nullable(),
  responsavel: z.string().nullable(),
  tratativa: z.string().nullable(),
  motivo_da_improcedencia: z.string().nullable(),
  base: z.string().nullable(),
  familia: z.string().nullable(),
  telefone: z.string().nullable(),
  email: z.string().nullable(),
  complemento: z.string().nullable(),
  dsclgr_os: z.string().nullable(),
  criterio: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

const TRATATIVAS = ["Pendente", "Transformada", "Impedida", "Levantamento", "Cancelada", "Executada", "Redirecionada"];

const CRITERIOS = [
  "Cadastro Único",
  "Programas do Governo",
  "Indígenas",
  "Quilombolas",
  "Assentamentos Rurais",
  "Escolas",
  "Espaços Coletivos",
  "Não se enquadra",
];

const RESPONSAVEIS = ["Sarah", "Raquel", "Lucas", "Gustavo"];

// Campos editáveis: inconsistencia, responsavel, tratativa, motivo_da_improcedencia, familia, criterio
const EDITABLE_FIELDS = ["inconsistencia", "responsavel", "tratativa", "motivo_da_improcedencia", "familia", "criterio"];

export default function Despacho() {
  const [showConcluidas, setShowConcluidas] = useState(false);
  const { data, isLoading, updateDespacho } = useDespacho(showConcluidas);
  const [search, setSearch] = useState("");
  const [filterDias, setFilterDias] = useState<string>("all");
  const [filterTratativa, setFilterTratativa] = useState<string>("all");
  const [filterBase, setFilterBase] = useState<string>("all");
  const [filterFamilia, setFilterFamilia] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DespachoType | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof DespachoType | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const watchedCpf = selectedItem?.numcpf;
  const watchedNumos = selectedItem?.numos;
  const { despachoOS, cadernoOS, hasDuplicatas } = useClienteDuplicatas(watchedCpf, watchedNumos);

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

    if (!showConcluidas) {
      result = result.filter((item) => !item.concluida);
    }

    if (filterDias !== "all") {
      const days = parseInt(filterDias);
      result = result.filter((item) => (item.dias_para_despacho ?? 0) >= days);
    }

    if (filterTratativa !== "all") {
      result = result.filter((item) => item.tratativa === filterTratativa);
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
  }, [data, search, filterDias, filterTratativa, filterBase, filterFamilia, filterDataInicio, filterDataFim, sortColumn, sortDirection]);

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

  const handleEdit = (item: DespachoType) => {
    setSelectedItem(item);
    form.reset({
      numos: item.numos,
      dias_para_despacho: item.dias_para_despacho,
      inconsistencia: item.inconsistencia,
      nomelcd: item.nomelcd,
      regional: item.regional,
      nomecli: item.nomecli,
      numcpf: item.numcpf,
      dth_nascimento: item.dth_nascimento,
      responsavel: item.responsavel,
      tratativa: item.tratativa,
      motivo_da_improcedencia: item.motivo_da_improcedencia,
      base: item.base,
      familia: item.familia,
      telefone: item.telefone,
      email: item.email,
      complemento: item.complemento,
      dsclgr_os: item.dsclgr_os,
      criterio: item.criterio,
    });
    setEditDrawerOpen(true);
  };

  const onSubmit = (formData: FormData) => {
    if (selectedItem) {
      // Enviar apenas os campos editáveis
      updateDespacho({
        id: selectedItem.id,
        inconsistencia: formData.inconsistencia,
        responsavel: formData.responsavel,
        tratativa: formData.tratativa,
        motivo_da_improcedencia: formData.motivo_da_improcedencia,
        familia: formData.familia,
        criterio: formData.criterio,
      });
      setEditDrawerOpen(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilterDias("all");
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

  const isEditable = (fieldName: string) => EDITABLE_FIELDS.includes(fieldName);

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
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filtros</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-concluidas"
                  checked={showConcluidas}
                  onCheckedChange={setShowConcluidas}
                />
                <Label htmlFor="show-concluidas">Mostrar concluídas</Label>
              </div>
            </div>
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
              <Select value={filterDias} onValueChange={setFilterDias}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Dias p/ Despacho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Dias</SelectItem>
                  <SelectItem value="5">≥ 5 dias</SelectItem>
                  <SelectItem value="10">≥ 10 dias</SelectItem>
                  <SelectItem value="15">≥ 15 dias</SelectItem>
                  <SelectItem value="20">≥ 20 dias</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTratativa} onValueChange={setFilterTratativa}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tratativa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {tratativas.map((t) => (
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
                placeholder="Data Início"
                title="Modificado a partir de"
              />
              <Input
                type="date"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
                className="w-[150px]"
                placeholder="Data Fim"
                title="Modificado até"
              />
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="flex-1">
          <CardContent className="p-0">
            <ScrollArea className="w-full h-[calc(100vh-200px)]">
              <div className="min-w-[1600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Ações</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("numos")}>
                        NUMOS {sortColumn === "numos" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("dias_para_despacho")}>
                        Dias p/ Despacho {sortColumn === "dias_para_despacho" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Inconsistência</TableHead>
                      <TableHead>LCD</TableHead>
                      <TableHead>Regional</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("nomecli")}>
                        Nome Cliente {sortColumn === "nomecli" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Base 5311</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Tratativa</TableHead>
                      <TableHead>Motivo Improcedência</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Família</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Complemento</TableHead>
                      <TableHead>Logradouro</TableHead>
                      <TableHead>Critério</TableHead>
                      <TableHead>Concluída</TableHead>
                      <TableHead>Data Conclusão</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("updated_at")}>
                        Modificado em {sortColumn === "updated_at" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={22} className="text-center text-muted-foreground py-8">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4" />
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
                          <TableCell className="max-w-[200px] truncate">{item.nomecli ?? "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{maskCpf(item.numcpf)}</TableCell>
                          <TableCell>
                            {item.in_base_5311 ? (
                              <Badge variant="destructive">SIM</Badge>
                            ) : (
                              <Badge variant="outline">NÃO</Badge>
                            )}
                          </TableCell>
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
                          <TableCell className="text-xs">{item.complemento ?? "-"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{item.dsclgr_os ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.criterio ?? "-"}</TableCell>
                          <TableCell className="text-xs">{item.concluida ? "Sim" : "Não"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {item.data_conclusao ? format(new Date(item.data_conclusao), "dd/MM/yyyy") : "-"}
                          </TableCell>
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
      </div>

      {/* Edit Drawer */}
      <Sheet open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Editar Despacho</SheetTitle>
            <SheetDescription>
              Campos editáveis: Inconsistência, Responsável, Tratativa, Motivo Improcedência, Família e Critério
            </SheetDescription>
          </SheetHeader>
          {hasDuplicatas && (
            <Alert variant="default" className="mt-3 flex-shrink-0 border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-700 dark:text-yellow-400">Cliente com outras OS</AlertTitle>
              <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-400">
                {despachoOS.length > 0 && (
                  <span>
                    {despachoOS.length} OS no Despacho (NUMOS: {despachoOS.join(", ")})
                  </span>
                )}
                {despachoOS.length > 0 && cadernoOS.length > 0 && " • "}
                {cadernoOS.length > 0 && (
                  <span>
                    {cadernoOS.length} OS no Caderno (NUMOS: {cadernoOS.join(", ")})
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          <ScrollArea className="flex-1 min-h-0 pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                  <FormLabel>Número OS</FormLabel>
                  <CopyableInput value={String(form.getValues("numos") ?? "")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>Dias p/ Despacho</FormLabel>
                    <CopyableInput value={String(form.getValues("dias_para_despacho") ?? "")} />
                  </div>
                  <FormField control={form.control} name="inconsistencia" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inconsistência</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          inputMode="numeric"
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d+$/.test(val)) {
                              field.onChange(val === "" ? null : Number(val));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-2">
                  <FormLabel>Nome LCD</FormLabel>
                  <CopyableInput value={form.getValues("nomelcd") ?? ""} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>Regional</FormLabel>
                    <CopyableInput value={form.getValues("regional") ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Base</FormLabel>
                    <CopyableInput value={form.getValues("base") ?? ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Nome do Cliente</FormLabel>
                  <CopyableInput value={form.getValues("nomecli") ?? ""} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>CPF</FormLabel>
                    <CopyableInput value={form.getValues("numcpf") ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Data Nascimento</FormLabel>
                    <CopyableInput value={form.getValues("dth_nascimento") ?? ""} />
                  </div>
                </div>

                {/* Campos somente leitura - Telefone, Email, Complemento, Descrição OS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormLabel>Telefone</FormLabel>
                    <CopyableInput value={form.getValues("telefone") ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>E-mail</FormLabel>
                    <CopyableInput value={form.getValues("email") ?? ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Complemento</FormLabel>
                  <CopyableInput value={form.getValues("complemento") ?? ""} />
                </div>

                <div className="space-y-2">
                  <FormLabel>Descrição OS</FormLabel>
                  <CopyableInput value={form.getValues("dsclgr_os") ?? ""} multiline rows={3} />
                </div>

                {/* Campos Editáveis - destacados */}
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Campos Editáveis</CardTitle>
                    <CardDescription className="text-xs">Apenas estes campos podem ser alterados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="responsavel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESPONSAVEIS.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="tratativa" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tratativa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRATATIVAS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="motivo_da_improcedencia" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo da Improcedência</FormLabel>
                        <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="familia" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Família</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="criterio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Critério</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o critério" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CRITERIOS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>


                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Salvar</Button>
                  <Button type="button" variant="outline" onClick={() => setEditDrawerOpen(false)}>Cancelar</Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
