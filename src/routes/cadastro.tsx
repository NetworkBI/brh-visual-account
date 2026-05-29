import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { cadastroSchema, type CadastroInput } from "@/lib/schemas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/cadastro")({
  head: () => pageMeta({
    path: "/cadastro",
    title: "Criar conta — Grupo BR Hunter",
    description: "Cadastre-se para acessar o sistema de prestação de contas do Grupo BR Hunter. Acesso restrito a operadores autorizados.",
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
  });

  const onSubmit = async (v: CadastroInput) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: v.email,
      password: v.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          primeiro_nome: v.primeiro_nome,
          segundo_nome: v.segundo_nome,
          data_nascimento: v.data_nascimento,
          matricula: v.matricula || null,
        },
      },
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cadastro criado! Você já pode entrar.");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-elegant">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="" className="h-16 w-auto" />
          <h1 className="mt-3 font-display text-2xl font-bold">Criar acesso</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre-se para acessar o sistema</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p">Primeiro nome *</Label>
            <Input id="p" {...register("primeiro_nome")} />
            {errors.primeiro_nome && <p className="text-xs text-destructive">{errors.primeiro_nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s">Segundo nome *</Label>
            <Input id="s" {...register("segundo_nome")} />
            {errors.segundo_nome && <p className="text-xs text-destructive">{errors.segundo_nome.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d">Data de nascimento *</Label>
            <Input id="d" type="date" {...register("data_nascimento")} />
            {errors.data_nascimento && <p className="text-xs text-destructive">{errors.data_nascimento.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m">Matrícula</Label>
            <Input id="m" {...register("matricula")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="e">E-mail corporativo *</Label>
            <Input id="e" type="email" {...register("email")} placeholder="nome@brhunter.com.br" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="se">Senha *</Label>
            <Input id="se" type="password" {...register("senha")} />
            <p className="text-[11px] text-muted-foreground">
              Mínimo 6 caracteres, ao menos 1 número, sem caracteres especiais.
            </p>
            {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
          </div>
          <div className="sm:col-span-2 mt-2 flex flex-col gap-3">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Cadastrando..." : "Criar acesso"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem cadastro?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
