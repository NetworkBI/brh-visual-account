import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE = 60_000;

export function useCondominios() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["condominios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("condominios").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["profiles", "padrao"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "padrao");
      if (rolesError) throw rolesError;
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("public_profiles")
        .select("id, primeiro_nome, segundo_nome")
        .in("id", ids)
        .order("primeiro_nome");
      if (error) throw error;
      return data;
    },
  });
}

export function usePrestacoes() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["prestacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestacoes")
        .select("*, condominios(nome)")
        .order("data_evento", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useEventos() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prestacao_eventos")
        .select("*, prestacoes(mes, condominios(nome))")
        .order("data_ocorrido", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
