import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDemandas } from "@/hooks/useDemandas";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Calendar, Clock, CheckCircle, Filter } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Demanda } from "@/types/database";
import { Label } from "@/components/ui/label";
import { DemandaDetailDialog } from "@/components/DemandaDetailDialog";
import { cn } from "@/lib/utils";

const PRIORIDADE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Baixa": "outline",
  "Normal": "secondary",
  "Alta": "default",
  "Urgente": "destructive",
};

const STATUS_OPTIONS = ["Todas", "Pendente", "Em Andamento", "Concluída"];

export default function MinhasDemandasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { user } = useAuth();
  const { data: demandas, isLoading, updateDemanda, concluirDemanda } = useDemandas();
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
  const [selectedDemanda, setSelectedDemanda] = useState<Demanda | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(highlightId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: string } | null>(null);

  // Auto-open highlighted demanda
  useEffect(() => {
    if (highlightId && demandas.length > 0) {
      const demandaToHighlight = demandas.find(d => d.id === highlightId);
      if (demandaToHighlight) {
        setSelectedDemanda(demandaToHighlight);
        setDetailDialogOpen(true);
        // Clear highlight from URL after 3 seconds
        setTimeout(() => {
          setHighlightedId(null);
          setSearchParams({});
        }, 3000);
      }
    }
  }, [highlightId, demandas, setSearchParams]);

  // Filter demandas for current user
  const minhasDemandas = demandas.filter(d => d.operador_id === user?.id);
  
  // Apply status filter
  const demandasFiltradas = statusFilter === "Todas" 
    ? minhasDemandas 
    : minhasDemandas.filter(d => d.status === statusFilter);
  
  const demandasHoje = minhasDemandas.filter(d => 
    d.prazo_execucao && isToday(new Date(d.prazo_execucao)) && d.status !== "Concluída"
  );
  
  const demandasAmanha = minhasDemandas.filter(d => 
    d.prazo_execucao && isTomorrow(new Date(d.prazo_execucao)) && d.status !== "Concluída"
  );
  
  const demandasAtrasadas = minhasDemandas.filter(d => 
    d.prazo_execucao && isPast(new Date(d.prazo_execucao)) && !isToday(new Date(d.prazo_execucao)) && d.status !== "Concluída"
  );
  
  const demandasPendentes = minhasDemandas.filter(d => d.status === "Pendente" || d.status === "Em Andamento");
  const demandasConcluidas = minhasDemandas.filter(d => d.status === "Concluída");

  const handleStatusChange = (demandaId: string, newStatus: string) => {
    setPendingStatusChange({ id: demandaId, status: newStatus });
    setConfirmOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!pendingStatusChange) return;
    const { id, status } = pendingStatusChange;
    
    if (status === "Concluída") {
      const demanda = demandas.find(d => d.id === id);
      if (demanda) {
        concluirDemanda(demanda);
      }
    } else {
      updateDemanda({ id, status });
    }
    
    setConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handleOpenDetail = (demanda: Demanda) => {
    setSelectedDemanda(demanda);
    setDetailDialogOpen(true);
  };

  const DemandaCard = ({ demanda }: { demanda: Demanda }) => {
    const prazoDate = demanda.prazo_execucao ? new Date(demanda.prazo_execucao) : null;
    const isAtrasada = prazoDate && isPast(prazoDate) && !isToday(prazoDate) && demanda.status !== "Concluída";
    const isHighlighted = highlightedId === demanda.id;

    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isAtrasada && "border-destructive",
          isHighlighted && "ring-2 ring-primary ring-offset-2 animate-pulse"
        )}
        onClick={() => handleOpenDetail(demanda)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{demanda.titulo}</CardTitle>
              <CardDescription>{demanda.tipo}</CardDescription>
            </div>
            <Badge variant={PRIORIDADE_COLORS[demanda.prioridade ?? "Normal"]}>
              {demanda.prioridade}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {demanda.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2">{demanda.descricao}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            {prazoDate && (
              <div className={`flex items-center gap-1 ${isAtrasada ? "text-destructive" : "text-muted-foreground"}`}>
                <Calendar className="h-4 w-4" />
                {format(prazoDate, "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(demanda.created_at), "dd/MM", { locale: ptBR })}
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={demanda.status ?? "Pendente"}
              onValueChange={(value) => handleStatusChange(demanda.id, value)}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
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
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{demandasAtrasadas.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Para Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{demandasHoje.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demandasPendentes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{demandasConcluidas.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Demandas Atrasadas */}
        {demandasAtrasadas.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-destructive mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atrasadas ({demandasAtrasadas.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {demandasAtrasadas.map((demanda) => (
                <DemandaCard key={demanda.id} demanda={demanda} />
              ))}
            </div>
          </div>
        )}

        {/* Demandas de Hoje */}
        {demandasHoje.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Para Hoje ({demandasHoje.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {demandasHoje.map((demanda) => (
                <DemandaCard key={demanda.id} demanda={demanda} />
              ))}
            </div>
          </div>
        )}

        {/* Demandas de Amanhã */}
        {demandasAmanha.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Para Amanhã ({demandasAmanha.length})</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {demandasAmanha.map((demanda) => (
                <DemandaCard key={demanda.id} demanda={demanda} />
              ))}
            </div>
          </div>
        )}

        {/* Todas as Demandas com filtro */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Todas as Demandas ({minhasDemandas.length})</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="status-filter" className="text-sm text-muted-foreground">
                Filtrar por status:
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {minhasDemandas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Você não tem demandas atribuídas no momento.</p>
              </CardContent>
            </Card>
          ) : demandasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Nenhuma demanda encontrada com o status "{statusFilter}".</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {demandasFiltradas.map((demanda) => (
                <DemandaCard key={demanda.id} demanda={demanda} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <DemandaDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        demanda={selectedDemanda}
        onStatusChange={handleStatusChange}
        skipConfirmation
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatusChange && (() => {
                const demanda = demandas.find(d => d.id === pendingStatusChange.id);
                return demanda
                  ? <>Você está alterando o status da demanda <strong>"{demanda.titulo}"</strong> de <strong>{demanda.status ?? "Pendente"}</strong> para <strong>{pendingStatusChange.status}</strong>. As alterações refletirão nas informações contidas no banco de dados.</>
                  : "As alterações refletirão nas informações contidas no banco de dados.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
