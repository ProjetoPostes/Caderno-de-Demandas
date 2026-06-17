import { useState } from "react";
import { Caderno } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkEditCadernoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Caderno[];
  onBulkUpdate: (updates: Partial<Caderno>) => Promise<{ successCount: number; failedCount: number }>;
  isUpdating: boolean;
  onClearSelection: () => void;
}

interface FieldState {
  enabled: boolean;
  value: string;
}

const CONTROLE_OS_OPTIONS = ["Aberta", "Cancelada", "Executada", "Impedida"];
const TRANCHE_OPTIONS = ["T1", "T2", "T3", "T4", "T5"];

export function BulkEditCadernoDialog({
  open,
  onOpenChange,
  selectedItems,
  onBulkUpdate,
  isUpdating,
  onClearSelection,
}: BulkEditCadernoDialogProps) {
  const [fields, setFields] = useState<Record<string, FieldState>>({
    status: { enabled: false, value: "" },
    controle_os: { enabled: false, value: "" },
    responsavel: { enabled: false, value: "" },
    prioridade: { enabled: false, value: "" },
    tranche: { enabled: false, value: "" },
    tipo_carta_enviada: { enabled: false, value: "" },
    observacao: { enabled: false, value: "" },
    data_carta: { enabled: false, value: "" },
  });

  const updateField = (field: string, updates: Partial<FieldState>) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], ...updates },
    }));
  };

  const resetFields = () => {
    setFields({
      status: { enabled: false, value: "" },
      controle_os: { enabled: false, value: "" },
      responsavel: { enabled: false, value: "" },
      prioridade: { enabled: false, value: "" },
      tranche: { enabled: false, value: "" },
      tipo_carta_enviada: { enabled: false, value: "" },
      observacao: { enabled: false, value: "" },
      data_carta: { enabled: false, value: "" },
    });
  };

  const hasEnabledFields = Object.values(fields).some((f) => f.enabled);

  const handleApply = async () => {
    const updates: Partial<Caderno> = {};
    
    if (fields.status.enabled) updates.status = fields.status.value || null;
    if (fields.controle_os.enabled) updates.controle_os = fields.controle_os.value || null;
    if (fields.responsavel.enabled) updates.responsavel = fields.responsavel.value || null;
    if (fields.prioridade.enabled) updates.prioridade = fields.prioridade.value || null;
    if (fields.tranche.enabled) updates.tranche = fields.tranche.value || null;
    if (fields.tipo_carta_enviada.enabled) updates.tipo_carta_enviada = fields.tipo_carta_enviada.value || null;
    if (fields.observacao.enabled) updates.observacao = fields.observacao.value || null;
    if (fields.data_carta.enabled) updates.data_carta = fields.data_carta.value || null;

    const result = await onBulkUpdate(updates);
    
    if (result.successCount > 0 && result.failedCount === 0) {
      resetFields();
      onClearSelection();
      onOpenChange(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetFields();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar {selectedItems.length} registros
          </DialogTitle>
          <DialogDescription>
            Marque os campos que deseja alterar. Os valores serão aplicados a todos os registros selecionados.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            {/* Status */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-status"
                checked={fields.status.enabled}
                onCheckedChange={(checked) => updateField("status", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="status" className={!fields.status.enabled ? "text-muted-foreground" : ""}>
                  Status
                </Label>
                <Input
                  id="status"
                  value={fields.status.value}
                  onChange={(e) => updateField("status", { value: e.target.value })}
                  disabled={!fields.status.enabled}
                  placeholder="Status da OS"
                />
              </div>
            </div>

            {/* Controle OS */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-controle_os"
                checked={fields.controle_os.enabled}
                onCheckedChange={(checked) => updateField("controle_os", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="controle_os" className={!fields.controle_os.enabled ? "text-muted-foreground" : ""}>
                  Controle OS
                </Label>
                <Select
                  value={fields.controle_os.value}
                  onValueChange={(value) => updateField("controle_os", { value })}
                  disabled={!fields.controle_os.enabled}
                >
                  <SelectTrigger id="controle_os">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTROLE_OS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Responsável */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-responsavel"
                checked={fields.responsavel.enabled}
                onCheckedChange={(checked) => updateField("responsavel", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="responsavel" className={!fields.responsavel.enabled ? "text-muted-foreground" : ""}>
                  Responsável
                </Label>
                <Input
                  id="responsavel"
                  value={fields.responsavel.value}
                  onChange={(e) => updateField("responsavel", { value: e.target.value })}
                  disabled={!fields.responsavel.enabled}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            {/* Prioridade */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-prioridade"
                checked={fields.prioridade.enabled}
                onCheckedChange={(checked) => updateField("prioridade", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="prioridade" className={!fields.prioridade.enabled ? "text-muted-foreground" : ""}>
                  Prioridade
                </Label>
                <Input
                  id="prioridade"
                  value={fields.prioridade.value}
                  onChange={(e) => updateField("prioridade", { value: e.target.value })}
                  disabled={!fields.prioridade.enabled}
                  placeholder="Nível de prioridade"
                />
              </div>
            </div>

            {/* Tranche */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-tranche"
                checked={fields.tranche.enabled}
                onCheckedChange={(checked) => updateField("tranche", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="tranche" className={!fields.tranche.enabled ? "text-muted-foreground" : ""}>
                  Tranche
                </Label>
                <Select
                  value={fields.tranche.value}
                  onValueChange={(value) => updateField("tranche", { value })}
                  disabled={!fields.tranche.enabled}
                >
                  <SelectTrigger id="tranche">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANCHE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo Carta Enviada */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-tipo_carta_enviada"
                checked={fields.tipo_carta_enviada.enabled}
                onCheckedChange={(checked) => updateField("tipo_carta_enviada", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="tipo_carta_enviada" className={!fields.tipo_carta_enviada.enabled ? "text-muted-foreground" : ""}>
                  Tipo Carta Enviada
                </Label>
                <Input
                  id="tipo_carta_enviada"
                  value={fields.tipo_carta_enviada.value}
                  onChange={(e) => updateField("tipo_carta_enviada", { value: e.target.value })}
                  disabled={!fields.tipo_carta_enviada.enabled}
                  placeholder="Tipo de carta"
                />
              </div>
            </div>

            {/* Observação */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-observacao"
                checked={fields.observacao.enabled}
                onCheckedChange={(checked) => updateField("observacao", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="observacao" className={!fields.observacao.enabled ? "text-muted-foreground" : ""}>
                  Observação
                </Label>
                <Textarea
                  id="observacao"
                  value={fields.observacao.value}
                  onChange={(e) => updateField("observacao", { value: e.target.value })}
                  disabled={!fields.observacao.enabled}
                  placeholder="Observações..."
                  rows={3}
                />
              </div>
            </div>

            {/* Data Carta */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-data_carta"
                checked={fields.data_carta.enabled}
                onCheckedChange={(checked) => updateField("data_carta", { enabled: !!checked })}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="data_carta" className={!fields.data_carta.enabled ? "text-muted-foreground" : ""}>
                  Data Carta
                </Label>
                <Input
                  id="data_carta"
                  type="date"
                  value={fields.data_carta.value}
                  onChange={(e) => updateField("data_carta", { value: e.target.value })}
                  disabled={!fields.data_carta.enabled}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!hasEnabledFields || isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar a {selectedItems.length} registros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
