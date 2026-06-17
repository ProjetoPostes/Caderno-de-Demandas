import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CopyableInput } from "@/components/CopyableInput";
import { Demanda } from "@/types/database";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, AlertTriangle } from "lucide-react";

interface DemandaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demanda: Demanda | null;
  onStatusChange: (demandaId: string, newStatus: string) => void;
  /** If true, the parent handles confirmation — skip internal AlertDialog */
  skipConfirmation?: boolean;
}

const PRIORIDADE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Baixa": "outline",
  "Normal": "secondary",
  "Alta": "default",
  "Urgente": "destructive",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Pendente": "outline",
  "Em Andamento": "secondary",
  "Concluída": "default",
  "Cancelada": "destructive",
};

export function DemandaDetailDialog({ open, onOpenChange, demanda, onStatusChange, skipConfirmation = false }: DemandaDetailDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  if (!demanda) return null;

  const prazoDate = demanda.prazo_execucao ? new Date(demanda.prazo_execucao) : null;
  const isAtrasada = prazoDate && isPast(prazoDate) && !isToday(prazoDate) && demanda.status !== "Concluída";

  const handleStatusSelect = (value: string) => {
    if (skipConfirmation) {
      onStatusChange(demanda.id, value);
    } else {
      setPendingStatus(value);
      setConfirmOpen(true);
    }
  };

  const handleConfirmStatus = () => {
    if (pendingStatus) {
      onStatusChange(demanda.id, pendingStatus);
    }
    setConfirmOpen(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {isAtrasada && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {demanda.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Status e Prioridade */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={STATUS_COLORS[demanda.status ?? "Pendente"]}>
                  {demanda.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Prioridade:</span>
                <Badge variant={PRIORIDADE_COLORS[demanda.prioridade ?? "Normal"]}>
                  {demanda.prioridade}
                </Badge>
              </div>
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tipo</Label>
                <CopyableInput value={demanda.tipo} />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Prazo de Execução</Label>
                <div className={`flex items-center gap-2 p-2 rounded border ${isAtrasada ? "border-destructive bg-destructive/10" : "border-input bg-muted"}`}>
                  <Calendar className={`h-4 w-4 ${isAtrasada ? "text-destructive" : "text-muted-foreground"}`} />
                  <span className={isAtrasada ? "text-destructive font-medium" : ""}>
                    {prazoDate ? format(prazoDate, "dd/MM/yyyy", { locale: ptBR }) : "Sem prazo"}
                  </span>
                  {isAtrasada && <span className="text-xs text-destructive">(Atrasada)</span>}
                </div>
              </div>
            </div>

            {/* Tipo de Demanda e Tipo de Carta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Tipo de Demanda</Label>
                <CopyableInput value={demanda.tipo_demanda ?? "Análise"} />
              </div>
              {demanda.tipo_demanda === "Envio de carta" && demanda.tipo_carta && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tipo de Carta</Label>
                  <CopyableInput value={demanda.tipo_carta} />
                </div>
              )}
            </div>

            {/* Descrição */}
            {demanda.descricao && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Descrição</Label>
                <CopyableInput value={demanda.descricao} multiline rows={4} />
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Criada em: {format(new Date(demanda.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Atualizada em: {format(new Date(demanda.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium">Alterar Status:</span>
                <Select
                  value={demanda.status ?? "Pendente"}
                  onValueChange={handleStatusSelect}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração de Status</AlertDialogTitle>
            <AlertDialogDescription>
              Você está alterando o status da demanda <strong>"{demanda.titulo}"</strong> de <strong>{demanda.status ?? "Pendente"}</strong> para <strong>{pendingStatus}</strong>. As alterações refletirão nas informações contidas no banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
