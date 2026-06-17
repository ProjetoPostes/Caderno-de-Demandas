import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MfaFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
}

export interface EnrollmentData {
  id: string;
  type: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface AuthLevel {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
}

export function useMfa() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthLevel = useCallback(async (): Promise<AuthLevel | null> => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      return {
        currentLevel: data.currentLevel,
        nextLevel: data.nextLevel,
      };
    } catch (err) {
      console.error("Error getting auth level:", err);
      return null;
    }
  }, []);

  const listFactors = useCallback(async (): Promise<MfaFactor[]> => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data.totp.map((f) => ({
        id: f.id,
        friendly_name: f.friendly_name,
        factor_type: f.factor_type,
        status: f.status,
        created_at: f.created_at,
        updated_at: f.updated_at,
      }));
    } catch (err) {
      console.error("Error listing factors:", err);
      return [];
    }
  }, []);

  const enrollTotp = useCallback(async (friendlyName?: string): Promise<EnrollmentData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Sistema Operacional",
        friendlyName: friendlyName || "Autenticador TOTP",
      });
      
      if (error) throw error;
      return data as EnrollmentData;
    } catch (err: any) {
      console.error("Error enrolling TOTP:", err);
      setError(err.message || "Erro ao configurar 2FA");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyEnrollment = useCallback(async (factorId: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;
      return true;
    } catch (err: any) {
      console.error("Error verifying enrollment:", err);
      setError(err.message || "Código inválido");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMfa = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const verifiedFactor = factors.totp.find((f) => f.status === "verified");
      if (!verifiedFactor) {
        throw new Error("Nenhum fator 2FA encontrado");
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });
      
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;
      return true;
    } catch (err: any) {
      console.error("Error verifying MFA:", err);
      setError(err.message || "Código inválido");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unenroll = useCallback(async (factorId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Error unenrolling:", err);
      setError(err.message || "Erro ao desativar 2FA");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requiresMfa = useCallback(async (): Promise<boolean> => {
    const authLevel = await getAuthLevel();
    if (!authLevel) return false;
    
    // User has MFA configured (nextLevel is aal2) but current session is only aal1
    return authLevel.currentLevel === "aal1" && authLevel.nextLevel === "aal2";
  }, [getAuthLevel]);

  const hasMfaEnabled = useCallback(async (): Promise<boolean> => {
    const factors = await listFactors();
    return factors.some((f) => f.status === "verified");
  }, [listFactors]);

  return {
    isLoading,
    error,
    getAuthLevel,
    listFactors,
    enrollTotp,
    verifyEnrollment,
    verifyMfa,
    unenroll,
    requiresMfa,
    hasMfaEnabled,
    clearError: () => setError(null),
  };
}
