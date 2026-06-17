import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { useMfa } from "@/hooks/useMfa";

interface MfaVerifyDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MfaVerifyDialog({ open, onSuccess, onCancel }: MfaVerifyDialogProps) {
  const [code, setCode] = useState("");
  const { isLoading, error, verifyMfa, clearError } = useMfa();

  useEffect(() => {
    if (!open) {
      setCode("");
      clearError();
    }
  }, [open, clearError]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    clearError();
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;

    const success = await verifyMfa(code);
    if (success) {
      onSuccess();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6 && !isLoading) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificação de 2 Fatores
          </DialogTitle>
          <DialogDescription>
            Digite o código do seu aplicativo autenticador para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
            <Input
              id="mfa-code"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
