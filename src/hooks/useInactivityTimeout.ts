import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes (1 hour)
const WARNING_BEFORE_LOGOUT_MS = 5 * 60 * 1000; // Warning 5 minutes before logout
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function useInactivityTimeout() {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    toast.error("Sessão expirada", {
      description: "Você foi desconectado por inatividade.",
    });
    await signOut();
  }, [signOut, clearTimers]);

  const showWarning = useCallback(() => {
    toast.warning("Sessão expirando", {
      description: "Sua sessão expirará em 5 minutos por inatividade. Mova o mouse para continuar.",
      duration: 15000,
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, clearTimers, handleLogout, showWarning]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Start the timer
    resetTimer();

    // Add activity listeners
    const handleActivity = () => {
      // Only reset if we've been inactive for at least 1 second
      // This prevents excessive timer resets
      if (Date.now() - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetTimer, clearTimers]);

  return { resetTimer };
}
