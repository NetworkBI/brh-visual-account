import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, KeyRound, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-secondary">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_0%_30%)_0%,_hsl(0_0%_12%)_70%,_hsl(0_0%_6%)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_transparent_0%,_rgba(200,16,46,0.08)_100%)]" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-card/95 shadow-2xl backdrop-blur-sm">
        <div className="bg-secondary px-8 py-5 text-center">
          <h2 className="font-display text-xl font-bold text-secondary-foreground tracking-wide">
            Controle Operacional
          </h2>
        </div>
        <div className="px-8 py-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src={logo} alt="Grupo BR Hunter" className="h-16 w-auto" />
            <h1 className="mt-4 font-display text-xl font-bold text-secondary">Faça o seu login</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-center text-xs text-muted-foreground">Seu usuário ou e-mail</p>
              <div className="flex items-stretch overflow-hidden rounded-md border bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
                <div className="flex w-11 items-center justify-center bg-secondary text-secondary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="nome"
                  type="email"
                  autoComplete="email"
                  aria-label="NOME"
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  {...register("nome")}
                />
              </div>
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <p className="text-center text-xs text-muted-foreground">Sua Senha</p>
              <div className="flex items-stretch overflow-hidden rounded-md border bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
                <div className="flex w-11 items-center justify-center bg-secondary text-secondary-foreground">
                  <KeyRound className="h-4 w-4" />
                </div>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-label="SENHA"
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  {...register("senha")}
                />
              </div>
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-secondary px-8 hover:bg-secondary/90 text-secondary-foreground"
              >
                {submitting ? "Entrando..." : "Entrar"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center gap-1 pt-2 text-xs">
              <Link to="/esqueci-senha" className="font-medium text-primary hover:underline">
                Esqueci minha senha
              </Link>
              <p className="text-muted-foreground">
                Não tem cadastro?{" "}
                <Link to="/cadastro" className="font-semibold text-primary hover:underline">Cadastre-se</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
