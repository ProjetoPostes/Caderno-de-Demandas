import { ReactNode } from "react";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

interface InactivityProviderProps {
  children: ReactNode;
}

export function InactivityProvider({ children }: InactivityProviderProps) {
  // Initialize the inactivity timeout hook
  useInactivityTimeout();
  
  return <>{children}</>;
}
