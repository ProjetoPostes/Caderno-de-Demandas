import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCheck, UserX, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { AppRole } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingUser {
  user_id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
  hasRole: boolean;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: "operador", label: "Operador" },
  { value: "operador_chefe", label: "Operador Chefe" },
  { value: "consultor", label: "Consultor" },
  { value: "admin", label: "Administrador" },
];

export default function UserApprovalPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id");

      if (rolesError) throw rolesError;

      const usersWithRoles = new Set(userRoles?.map(r => r.user_id) || []);

      // Filter to only users without roles
      const pending = (profiles || [])
        .map(p => ({
          ...p,
          hasRole: usersWithRoles.has(p.user_id)
        }))
        .filter(p => !p.hasRole);

      setPendingUsers(pending);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Erro ao carregar usuários pendentes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const role = selectedRoles[userId];
    if (!role) {
      toast.error("Selecione uma função para o usuário");
      return;
    }

    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Acesso Aprovado",
        message: `Seu acesso ao sistema foi aprovado! Você agora possui o papel de ${ROLES.find(r => r.value === role)?.label}.`,
        type: "approval",
      });

      toast.success("Usuário aprovado com sucesso!");
      fetchPendingUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Erro ao aprovar usuário");
    } finally {
      setProcessingId(null);
    }
  };

  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aprovação de Usuários
          </h2>
          <p className="text-sm text-muted-foreground">
            Aprove novos usuários e atribua suas permissões
          </p>
        </div>
        <Button variant="outline" onClick={fetchPendingUsers} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários Pendentes ({pendingUsers.length})
          </CardTitle>
          <CardDescription>
            Estes usuários se cadastraram mas ainda não possuem permissões de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário pendente de aprovação</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      {user.full_name || "Sem nome"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.username || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedRoles[user.user_id] || ""}
                        onValueChange={(value) => 
                          setSelectedRoles(prev => ({ ...prev, [user.user_id]: value as AppRole }))
                        }
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.user_id)}
                        disabled={processingId === user.user_id || !selectedRoles[user.user_id]}
                      >
                        {processingId === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aprovar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
