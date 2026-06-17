import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { AppRole } from "@/types/database";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ children, allowedRoles, redirectTo }: RoleProtectedRouteProps) {
  const { roles, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se o usuário não tem nenhum role, redireciona para página de aprovação pendente
  if (roles.length === 0) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Se allowedRoles foi especificado, verifica se o usuário tem algum dos roles permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = roles.some((role) => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      return <Navigate to={redirectTo || "/"} replace />;
    }
  }

  return <>{children}</>;
}
