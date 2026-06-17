import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ShieldAlert } from "lucide-react";
import { useMfaRequirements, AppRole } from "@/hooks/useMfaRequirements";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  operador_chefe: "Operador Chefe",
  operador: "Operador",
  consultor: "Consultor",
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "Acesso total ao sistema, incluindo gestão de usuários e configurações",
  operador_chefe: "Gerencia demandas e equipe de operadores",
  operador: "Executa tratativas operacionais no Caderno e Despacho",
  consultor: "Acesso somente leitura aos dados operacionais",
};

export function MfaRequirementsSettings() {
  const { requirements, isLoading, updateRequirement, isUpdating } = useMfaRequirements();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const enabledCount = requirements.filter((r) => r.required).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          2FA Obrigatório por Função
        </CardTitle>
        <CardDescription>
          Configure quais funções exigem autenticação de dois fatores. Usuários sem 2FA
          configurado não poderão fazer login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabledCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {enabledCount} função(ões) exige(m) 2FA. Usuários sem 2FA serão
              bloqueados no login.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className={`h-5 w-5 ${req.required ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">
                      {ROLE_LABELS[req.role]}
                    </Label>
                    {req.required && (
                      <Badge variant="default" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[req.role]}
                  </p>
                </div>
              </div>
              <Switch
                checked={req.required}
                onCheckedChange={(checked) =>
                  updateRequirement({ role: req.role, required: checked })
                }
                disabled={isUpdating}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
