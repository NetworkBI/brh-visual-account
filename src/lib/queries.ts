import { useQuery } from "@tanstack/react-query";
import { getCondominios, getProfiles, getAllProfiles, getPrestacoes, getEventos } from "./db.functions";

const STALE = 60_000;

export function useCondominios() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["condominios"],
    queryFn: async () => {
      return getCondominios();
    },
  });
}

export function useProfiles() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["profiles", "padrao"],
    queryFn: async () => {
      const data = await getProfiles();
      return data ?? [];
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["profiles", "todos"],
    queryFn: async () => {
      const data = await getAllProfiles();
      return data ?? [];
    },
  });
}

export function usePrestacoes() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["prestacoes"],
    queryFn: async () => {
      return getPrestacoes();
    },
  });
}

export function useEventos() {
  return useQuery({
    staleTime: STALE,
    queryKey: ["eventos"],
    queryFn: async () => {
      return getEventos();
    },
  });
}
