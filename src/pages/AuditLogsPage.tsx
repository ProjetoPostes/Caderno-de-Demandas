import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, Eye, ChevronLeft, ChevronRight, X, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  username: string | null;
}

const ITEMS_PER_PAGE = 20;

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  INSERT: { label: "Criação", variant: "default" },
  UPDATE: { label: "Atualização", variant: "secondary" },
  DELETE: { label: "Exclusão", variant: "destructive" },
  SOFT_DELETE: { label: "Exclusão Suave", variant: "destructive" },
};

const tableLabels: Record<string, string> = {
  caderno: "Caderno",
  despacho: "Despacho",
  demandas: "Demandas",
  profiles: "Perfis",
  user_roles: "Papéis de Usuário",
};

// Lista de campos sensíveis que devem ser mascarados no cliente (redundância)
const SENSITIVE_FIELDS = ["numcpf", "email", "telefone", "numtel", "numtel2", "dth_nascimento"];

const maskSensitiveValue = (key: string, value: unknown): string => {
  if (!SENSITIVE_FIELDS.includes(key)) {
    return typeof value === "object" ? JSON.stringify(value) : String(value ?? "-");
  }
  // Máscaras para campos sensíveis
  if (key === "numcpf") return "***.***.***-**";
  if (key === "email") return "***@***";
  if (key === "telefone" || key === "numtel" || key === "numtel2") return "(**) *****-****";
  if (key === "dth_nascimento") return "**/**/****";
  return "***";
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch audit logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Fetch profiles for user names
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username");
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Create a map of user_id to name
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => {
      map.set(p.user_id, p.full_name || p.username || "Usuário desconhecido");
    });
    return map;
  }, [profiles]);

  // Get unique tables from logs
  const uniqueTables = useMemo(() => {
    const tables = new Set(logs.map((log) => log.table_name));
    return Array.from(tables).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        search === "" ||
        log.table_name.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.record_id && log.record_id.toLowerCase().includes(search.toLowerCase())) ||
        userMap.get(log.user_id)?.toLowerCase().includes(search.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
      
      return matchesSearch && matchesAction && matchesTable;
    });
  }, [logs, search, actionFilter, tableFilter, userMap]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setTableFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = search !== "" || actionFilter !== "all" || tableFilter !== "all";

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  const renderJsonDiff = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    if (!oldData && !newData) return <p className="text-muted-foreground">Sem dados disponíveis</p>;

    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    const changedKeys = Array.from(allKeys).filter((key) => {
      const oldVal = oldData?.[key];
      const newVal = newData?.[key];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });

    if (changedKeys.length === 0 && oldData && newData) {
      return <p className="text-muted-foreground">Nenhuma alteração detectada</p>;
    }

    return (
      <div className="space-y-2">
        {changedKeys.map((key) => {
          const oldVal = oldData?.[key];
          const newVal = newData?.[key];
          
          // Skip internal fields
          if (["id", "created_at", "updated_at"].includes(key)) return null;

          return (
            <div key={key} className="rounded border p-2 text-sm">
              <span className="font-medium text-foreground">{key}:</span>
              <div className="mt-1 space-y-1">
                {oldVal !== undefined && (
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 bg-destructive/10 text-destructive">
                      Anterior
                    </Badge>
                    <span className="break-all text-muted-foreground">
                      {maskSensitiveValue(key, oldVal)}
                    </span>
                  </div>
                )}
                {newVal !== undefined && (
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary">
                      Novo
                    </Badge>
                    <span className="break-all">
                      {maskSensitiveValue(key, newVal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (logsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Logs de Auditoria</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tabela, ação, usuário..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange();
                }}
                className="pl-8"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="SOFT_DELETE">Exclusão Suave</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={tableFilter}
              onValueChange={(value) => {
                setTableFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tabelas</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {tableLabels[table] || table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data/Hora</TableHead>
                  <TableHead className="w-[150px]">Usuário</TableHead>
                  <TableHead className="w-[100px]">Ação</TableHead>
                  <TableHead className="w-[120px]">Tabela</TableHead>
                  <TableHead className="w-[200px]">Registro</TableHead>
                  <TableHead className="w-[80px]">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {hasActiveFilters ? "Nenhum log encontrado com os filtros aplicados" : "Nenhum log de auditoria registrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {userMap.get(log.user_id) || "Desconhecido"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionLabels[log.action]?.variant || "outline"}>
                          {actionLabels[log.action]?.label || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tableLabels[log.table_name] || log.table_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {log.record_id || "-"}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Log</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Data/Hora:</span>
                                    <p className="font-mono">{formatDate(selectedLog.created_at)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Usuário:</span>
                                    <p>{userMap.get(selectedLog.user_id) || "Desconhecido"}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Ação:</span>
                                    <p>
                                      <Badge variant={actionLabels[selectedLog.action]?.variant || "outline"}>
                                        {actionLabels[selectedLog.action]?.label || selectedLog.action}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Tabela:</span>
                                    <p>{tableLabels[selectedLog.table_name] || selectedLog.table_name}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">ID do Registro:</span>
                                    <p className="font-mono text-xs">{selectedLog.record_id || "-"}</p>
                                  </div>
                                  {selectedLog.ip_address && (
                                    <div>
                                      <span className="text-muted-foreground">IP:</span>
                                      <p className="font-mono text-xs">{selectedLog.ip_address}</p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-sm">Alterações:</span>
                                  <div className="mt-2">
                                    {renderJsonDiff(
                                      selectedLog.old_data as Record<string, unknown> | null,
                                      selectedLog.new_data as Record<string, unknown> | null
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex items-center justify-between px-4 py-3 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredLogs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} a{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} de {filteredLogs.length}
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
  );
}
