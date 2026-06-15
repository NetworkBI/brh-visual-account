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
      const { data, error } = await supabase.rpc("get_usuarios_padrao");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["profiles", "todos"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_usuarios_todos");
      if (error) throw error;
      return data ?? [];
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
        .eq("ativo", true)
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
