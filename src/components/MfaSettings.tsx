import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react";
import { useMfa, MfaFactor } from "@/hooks/useMfa";
import { MfaEnrollDialog } from "@/components/MfaEnrollDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function MfaSettings() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<MfaFactor | null>(null);
  const { listFactors, unenroll, isLoading } = useMfa();

  const loadFactors = async () => {
    setIsLoadingFactors(true);
    const data = await listFactors();
    setFactors(data);
    setIsLoadingFactors(false);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleUnenroll = async () => {
    if (!factorToDelete) return;

    const success = await unenroll(factorToDelete.id);
    if (success) {
      toast.success("2FA desativado com sucesso");
      loadFactors();
    } else {
      toast.error("Erro ao desativar 2FA");
    }
    setFactorToDelete(null);
  };

  const verifiedFactors = factors.filter((f) => f.status === "verified");
  const hasActiveMfa = verifiedFactors.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de 2 Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingFactors ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasActiveMfa ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    2FA Ativado
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sua conta está protegida com autenticação de dois fatores.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Dispositivos Configurados</p>
                {verifiedFactors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {factor.friendly_name || "Autenticador TOTP"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Adicionado em{" "}
                          {new Date(factor.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFactorToDelete(factor)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                <ShieldOff className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium">2FA Desativado</p>
                  <p className="text-sm text-muted-foreground">
                    Recomendamos ativar para maior segurança da sua conta.
                  </p>
                </div>
              </div>
              <Button onClick={() => setEnrollDialogOpen(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Ativar 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <MfaEnrollDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        onSuccess={loadFactors}
      />

      <AlertDialog open={!!factorToDelete} onOpenChange={() => setFactorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar 2FA?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá a autenticação de dois fatores da sua conta. Você poderá
              configurar novamente a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnenroll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar 2FA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
