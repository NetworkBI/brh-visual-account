import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyRole, loginUser } from "./db.functions";

export type AppRole = "master" | "adm" | "padrao";

interface AuthCtx {
  user: any | null;
  session: any | null;
  loading: boolean;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signInWithPassword: async () => ({ error: null }),
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("brh_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
    setLoading(false);
  }, []);

  const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await loginUser({ data: { email, password } });
      if (res && res.session) {
        localStorage.setItem("brh_session", JSON.stringify(res.session));
        setSession(res.session);
        return { error: null };
      }
      return { error: new Error("Falha no login: Resposta inválida") };
    } catch (err: any) {
      return { error: new Error(err.message || "Erro desconhecido") };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("brh_session");
    setSession(null);
  };

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signInWithPassword,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export function useUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole> => {
      const role = await getMyRole();
      return role as AppRole;
    },
  });
}

export const isMaster = (r?: AppRole | null) => r === "master";
export const canManageUsers = (r?: AppRole | null) => r === "master" || r === "adm";
export const canEditAnyPrestacao = (r?: AppRole | null) => r === "master" || r === "adm";
export const canPromoteToMaster = (r?: AppRole | null) => r === "master";

export function roleLabel(r: AppRole) {
  return r === "master" ? "MASTER" : r === "adm" ? "ADM" : "PADRÃO";
}
