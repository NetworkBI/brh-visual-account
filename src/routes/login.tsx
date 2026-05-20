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
import mascot from "@/assets/mascot.png";
import homeBg from "@/assets/home-bg.jpg";

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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Fundo texturizado */}
      <img src={homeBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      {/* Camadas de contraste / textura hexagonal */}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.85)_75%)]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "linear-gradient(rgba(200,16,46,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(200,16,46,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div aria-hidden="true" className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#c0282e]/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#7a1418]/30 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* Mascote em destaque com camadas de contraste na borda */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-0 -m-8 rounded-full bg-gradient-radial from-[#c0282e]/40 via-transparent to-transparent blur-2xl" />
            <div aria-hidden="true" className="absolute inset-0 -m-2 rounded-full ring-1 ring-white/10" />
            <img
              src={mascot}
              alt="BR Hunter — Mascote"
              className="relative h-72 w-72 animate-fade-in object-contain drop-shadow-[0_25px_45px_rgba(192,40,46,0.55)] sm:h-96 sm:w-96"
            />
          </div>
        </div>

        {/* Card de login */}
        <div className="w-full max-w-md justify-self-center overflow-hidden rounded-2xl bg-white/95 shadow-[0_25px_80px_-15px_rgba(140,20,25,0.7)] ring-1 ring-white/20 backdrop-blur-xl">
          <div className="bg-gradient-to-r from-[#7a1418] via-[#a01c22] to-[#c0282e] px-8 py-5 text-center">
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
    </div>
  );
}
