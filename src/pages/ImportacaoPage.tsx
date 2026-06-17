import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertTriangle } from "lucide-react";

export default function ImportacaoPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Redirect non-admin users
  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação de Dados
          </CardTitle>
          <CardDescription>
            Funcionalidade de importação em massa temporariamente desativada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20 mb-4">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Importação Desativada</h3>
            <p className="text-muted-foreground max-w-md">
              A funcionalidade de importação de dados via Excel para Caderno e Despacho foi 
              temporariamente desativada. As atualizações serão realizadas localmente pelo administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
