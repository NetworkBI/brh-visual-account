import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import bg from "@/assets/hunter-bg.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — BR Hunter Prestação de Contas" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.nome,
      password: values.senha,
    });
    setSubmitting(false);
    if (error) { toast.error("Falha no login: " + error.message); return; }
    toast.success("Bem-vindo!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-secondary/70" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-primary-foreground">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Qualidade em<br /><span className="text-white">prestação de contas</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Sistema interno do Grupo BR Hunter para o controle e auditoria das prestações de contas dos condomínios.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logo} alt="Grupo BR Hunter" className="h-20 w-auto" />
            <h1 className="mt-4 font-display text-2xl font-bold">Acessar sistema</h1>
            <p className="mt-1 text-sm text-muted-foreground">Informe seus dados para continuar</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-wider">NOME</Label>
              <Input id="nome" type="email" autoComplete="email" placeholder="seu.email@brhunter.com.br" {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha" className="text-xs font-bold uppercase tracking-wider">SENHA</Label>
                <Link to="/esqueci-senha" className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <Input id="senha" type="password" autoComplete="current-password" {...register("senha")} />
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem cadastro?{" "}
              <Link to="/cadastro" className="font-semibold text-primary hover:underline">Cadastre-se</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
