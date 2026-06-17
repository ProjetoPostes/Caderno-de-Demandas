import { useState, useEffect, forwardRef } from "react";
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
import { toast } from "sonner";
import { Loader2, Shield, CheckCircle2, Smartphone, ShieldAlert } from "lucide-react";
import { useMfa, EnrollmentData } from "@/hooks/useMfa";
import { CopyableInput } from "@/components/CopyableInput";

interface MfaEnrollRequiredDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = "intro" | "scan" | "verify";

export const MfaEnrollRequiredDialog = forwardRef<HTMLDivElement, MfaEnrollRequiredDialogProps>(
  function MfaEnrollRequiredDialog({ open, onSuccess, onCancel }, ref) {
  const [step, setStep] = useState<Step>("intro");
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const { isLoading, error, enrollTotp, verifyEnrollment, clearError } = useMfa();

  useEffect(() => {
    if (!open) {
      setStep("intro");
      setEnrollmentData(null);
      setVerificationCode("");
      clearError();
    }
  }, [open, clearError]);

  const handleStartEnrollment = async () => {
    const data = await enrollTotp();
    if (data) {
      setEnrollmentData(data);
      setStep("scan");
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;

    const success = await verifyEnrollment(enrollmentData.id, verificationCode);
    if (success) {
      toast.success("2FA configurado com sucesso!", {
        description: "Agora você pode acessar o sistema.",
      });
      onSuccess();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
    clearError();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Configuração de 2FA Obrigatória
          </DialogTitle>
          <DialogDescription>
            {step === "intro" && "Sua função exige autenticação de dois fatores. Configure agora para continuar."}
            {step === "scan" && "Escaneie o código QR com seu aplicativo autenticador."}
            {step === "verify" && "Digite o código gerado pelo aplicativo para finalizar."}
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-amber-700 dark:text-amber-400">
                    2FA é obrigatório para sua conta
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O administrador configurou que sua função requer autenticação de dois fatores.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Aplicativos Recomendados</p>
                  <p className="text-sm text-muted-foreground">
                    Google Authenticator, Authy ou Microsoft Authenticator
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancelar Login
              </Button>
              <Button onClick={handleStartEnrollment} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "Configurar 2FA"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "scan" && enrollmentData && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg">
                <img
                  src={enrollmentData.totp.qr_code}
                  alt="QR Code para 2FA"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Não consegue escanear? Use o código manual:
              </Label>
              <CopyableInput value={enrollmentData.totp.secret} />
            </div>

            <Button onClick={() => setStep("verify")} className="w-full">
              Próximo: Verificar Código
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de 6 dígitos</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("scan")} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Ativar e Entrar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
