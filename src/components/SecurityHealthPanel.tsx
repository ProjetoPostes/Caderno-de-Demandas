import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ShieldCheck, ShieldAlert, RefreshCw, Database, Lock, FileCheck } from "lucide-react";
import { checkSecurityHealth } from "@/hooks/useSecurityRpc";

export function SecurityHealthPanel() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["security-health"],
    queryFn: checkSecurityHealth,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Verificando saúde do sistema...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || data?.allowed === false) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data?.error || "Apenas administradores podem visualizar o painel de segurança."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = data?.metrics;
  const isHealthy = data?.status === "healthy";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Saúde de Segurança
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real das configurações de segurança
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="flex items-center gap-3">
          <Badge variant={isHealthy ? "default" : "destructive"} className="text-sm py-1 px-3">
            {isHealthy ? (
              <>
                <ShieldCheck className="h-4 w-4 mr-1" />
                Sistema Saudável
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 mr-1" />
                Problemas Detectados
              </>
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Última verificação: {data?.checked_at ? new Date(data.checked_at).toLocaleString("pt-BR") : "N/A"}
          </span>
        </div>

        {/* Métricas */}
        {metrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Database}
              title="Tabelas com RLS"
              value={metrics.tables_with_rls}
              description="Tabelas protegidas"
              status="success"
            />
            <MetricCard
              icon={Lock}
              title="Políticas RLS"
              value={metrics.total_policies}
              description="Regras de acesso ativas"
              status="success"
            />
            <MetricCard
              icon={Shield}
              title="Função has_role"
              value={metrics.has_role_function ? "Ativa" : "Inativa"}
              description="Validação de papéis"
              status={metrics.has_role_function ? "success" : "error"}
            />
            <MetricCard
              icon={FileCheck}
              title="Auditoria"
              value={metrics.audit_logging ? "Ativa" : "Inativa"}
              description="Registro de ações"
              status={metrics.audit_logging ? "success" : "error"}
            />
          </div>
        )}

        {/* Info adicional */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Funções RPC de Segurança</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">validate_user_access</Badge>
            <Badge variant="outline">secure_delete_record</Badge>
            <Badge variant="outline">check_security_health</Badge>
            <Badge variant="outline">log_audit_action</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  description: string;
  status: "success" | "warning" | "error";
}

function MetricCard({ icon: Icon, title, value, description, status }: MetricCardProps) {
  const statusColors = {
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    error: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${statusColors[status]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
