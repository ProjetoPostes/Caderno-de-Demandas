import { supabase } from "@/integrations/supabase/client";

interface AccessValidation {
  allowed: boolean;
  reason: string;
  user_id?: string;
  roles?: string[];
  table?: string;
  operation?: string;
}

interface SecureDeleteResult {
  success: boolean;
  error?: string;
  validated?: boolean;
  deleted_by?: string;
  table?: string;
  record_id?: string;
}

interface SoftDeleteResult {
  success: boolean;
  error?: string;
  deleted_by?: string;
  deleted_at?: string;
  table?: string;
  record_id?: string;
}

interface SecurityHealthResult {
  status?: string;
  checked_at?: string;
  checked_by?: string;
  metrics?: {
    tables_with_rls: number;
    total_policies: number;
    has_role_function: boolean;
    audit_logging: boolean;
  };
  allowed?: boolean;
  error?: string;
}

interface OperadorValidation {
  valid: boolean;
  error?: string;
  operador_id?: string;
  operador_name?: string;
}

export async function validateAccess(
  tableName: string,
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
  recordId?: string
): Promise<AccessValidation> {
  const { data, error } = await supabase.rpc("validate_user_access", {
    p_table_name: tableName,
    p_operation: operation,
    p_record_id: recordId || null,
  });

  if (error) {
    return {
      allowed: false,
      reason: error.message,
    };
  }

  return data as unknown as AccessValidation;
}

export async function secureDelete(
  tableName: string,
  recordId: string
): Promise<SecureDeleteResult> {
  const { data, error } = await supabase.rpc("secure_delete_record", {
    p_table_name: tableName,
    p_record_id: recordId,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return data as unknown as SecureDeleteResult;
}

export async function softDelete(
  tableName: string,
  recordId: string
): Promise<SoftDeleteResult> {
  const { data, error } = await supabase.rpc("soft_delete_record", {
    p_table_name: tableName,
    p_record_id: recordId,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return data as unknown as SoftDeleteResult;
}

export async function checkSecurityHealth(): Promise<SecurityHealthResult> {
  const { data, error } = await supabase.rpc("check_security_health");

  if (error) {
    return {
      allowed: false,
      error: error.message,
    };
  }

  return data as unknown as SecurityHealthResult;
}

export async function validateOperadorAssignment(
  operadorId: string
): Promise<OperadorValidation> {
  const { data, error } = await supabase.rpc("validate_operador_assignment", {
    p_operador_id: operadorId,
  });

  if (error) {
    return {
      valid: false,
      error: error.message,
    };
  }

  return data as unknown as OperadorValidation;
}

export function useSecurityRpc() {
  return {
    validateAccess,
    secureDelete,
    softDelete,
    checkSecurityHealth,
    validateOperadorAssignment,
  };
}
