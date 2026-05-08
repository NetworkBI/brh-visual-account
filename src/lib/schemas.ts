import { z } from "zod";

// senha: mínimo 6 caracteres, ao menos 1 número, sem caractere especial (apenas letras e números)
export const senhaSchema = z
  .string()
  .min(6, "Mínimo de 6 caracteres")
  .regex(/^[A-Za-z0-9]+$/, "Não use caracteres especiais")
  .regex(/[0-9]/, "Inclua ao menos um número");

export const cadastroSchema = z.object({
  primeiro_nome: z.string().trim().min(1, "Obrigatório").max(60),
  segundo_nome: z.string().trim().min(1, "Obrigatório").max(60),
  data_nascimento: z.string().min(1, "Obrigatório"),
  email: z.string().trim().email("E-mail inválido").max(255),
  matricula: z.string().trim().max(40).optional().or(z.literal("")),
  senha: senhaSchema,
});
export type CadastroInput = z.infer<typeof cadastroSchema>;

export const loginSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const PROCESSOS = ["Doc/Recebimento", "Lançamento", "Montagem", "Data Fechamento"] as const;

export const prestacaoSchema = z.object({
  mes: z.string().min(1, "Obrigatório"),
  condominio_id: z.string().uuid("Selecione um condomínio"),
  processo: z.enum(PROCESSOS),
  data_evento: z.string().min(1, "Obrigatório"),
  usuario_responsavel: z.string().uuid("Selecione um responsável"),
  observacoes: z.string().max(1000).optional().or(z.literal("")),
});
export type PrestacaoInput = z.infer<typeof prestacaoSchema>;
