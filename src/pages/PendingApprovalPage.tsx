import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Mail } from "lucide-react";

export default function PendingApprovalPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <CardTitle className="text-xl">Aguardando Aprovação</CardTitle>
          <CardDescription className="text-base">
            Sua conta foi criada com sucesso, mas ainda não possui permissões de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Um administrador precisa aprovar seu acesso ao sistema. Você receberá uma notificação quando sua conta for
              liberada.
            </p>
            {user?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Entre em contato com:</span>
                <span className="font-medium">{user?.user_metadata?.full_name}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
            </p>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
