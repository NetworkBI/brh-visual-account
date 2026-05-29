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
import loginBg from "@/assets/login-bg.jpg";

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
    if (!loading && user) navigate({ to: "/home" });
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
    navigate({ to: "/home" });
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.45)_0%,_rgba(0,0,0,0.8)_100%)]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white/95 shadow-[0_25px_80px_-15px_rgba(140,20,25,0.6)] ring-1 ring-white/20 backdrop-blur-xl">
        <div className="flex justify-center bg-gradient-to-r from-[#7a1418] via-[#a01c22] to-[#c0282e] px-8 py-5">
          <img src={logo} alt="BR Hunter" className="h-12 w-12 rounded-md bg-white/95 p-1 shadow-lg object-fill" />
        </div>
        <div className="bg-gradient-to-r from-[#7a1418] via-[#a01c22] to-[#c0282e] px-8 pb-5 text-center -mt-2">
          <h2 className="font-display text-xl font-bold text-white tracking-wide drop-shadow-sm">
            Controle Operacional
          </h2>
        </div>
        <div className="px-8 py-7">
          <h1 className="mb-5 text-center font-display text-lg font-bold text-[#a01c22]">Faça o seu login</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-center text-xs text-muted-foreground">Seu usuário ou e-mail</p>
              <div className="flex items-stretch overflow-hidden rounded-md border border-[#a01c22]/30 bg-[#a01c22]/5 focus-within:ring-2 focus-within:ring-[#a01c22]/50">
                <div className="flex w-11 items-center justify-center bg-gradient-to-b from-[#a01c22] to-[#7a1418] text-white">
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
              <div className="flex items-stretch overflow-hidden rounded-md border border-[#a01c22]/30 bg-[#a01c22]/5 focus-within:ring-2 focus-within:ring-[#a01c22]/50">
                <div className="flex w-11 items-center justify-center bg-gradient-to-b from-[#a01c22] to-[#7a1418] text-white">
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
                className="rounded-full bg-gradient-to-r from-[#a01c22] to-[#7a1418] px-8 text-white shadow-lg shadow-[#7a1418]/40 hover:from-[#7a1418] hover:to-[#5a0e12]"
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
