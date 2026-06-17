import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Maximum session age: 24 hours (in milliseconds)
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if session is too old (older than MAX_SESSION_AGE_MS)
function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  
  // Check if the session has an issued_at timestamp
  const issuedAt = session.expires_at 
    ? (session.expires_at * 1000) - (session.expires_in || 3600) * 1000
    : null;
  
  if (!issuedAt) {
    // Fallback: check the token's iat claim
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const tokenIssuedAt = payload.iat * 1000;
      return Date.now() - tokenIssuedAt > MAX_SESSION_AGE_MS;
    } catch {
      return false; // Can't determine, let it through
    }
  }
  
  return Date.now() - issuedAt > MAX_SESSION_AGE_MS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Then try to sign out from Supabase (ignore errors if session already expired)
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Session might already be invalid, that's fine - silent fail in production
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Check if returning session is too old
        if (newSession && isSessionExpired(newSession)) {
          // Session is too old, force logout
          await signOut();
          setLoading(false);
          return;
        }
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      // Check if existing session is too old
      if (existingSession && isSessionExpired(existingSession)) {
        // Session is too old, force logout
        await signOut();
        setLoading(false);
        return;
      }
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
