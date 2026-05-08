import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCondominios() {
  return useQuery({
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
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, primeiro_nome, segundo_nome, email");
      if (error) throw error;
      return data;
    },
  });
}

export function usePrestacoes() {
  return useQuery({
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
