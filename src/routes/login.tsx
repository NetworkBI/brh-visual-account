import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, KeyRound, ArrowRight } from "lucide-react";
import mascot from "@/assets/mascot.png";
import loginBg from "@/assets/login-bg.jpg";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => pageMeta({
    path: "/login",
    title: "Entrar — Grupo BR Hunter",
    description: "Acesse o sistema de controle de prestação de contas do Grupo BR Hunter com seu e-mail e senha.",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signInWithPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!loading && user) navigate({ to: "/home" });
  }, [user, loading, navigate]);

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    const { error } = await signInWithPassword({
      email: values.nome,
      password: values.senha,
    });
    if (error) {
      setSubmitting(false);
      toast.error("Falha no login: " + error.message);
      return;
    }
    // Verifica se há solicitação de troca de senha aprovada
    try {
      const { minhaSolicitacaoAprovada } = await import("@/lib/senha.functions");
      const sol = await minhaSolicitacaoAprovada();
      setSubmitting(false);
      if (sol) {
        toast.info("Defina sua nova senha");
        navigate({ to: "/redefinir-senha" });
        return;
      }
    } catch {
      setSubmitting(false);
    }
    toast.success("Bem-vindo!");
    navigate({ to: "/home" });
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Overlay clean */}
      <div aria-hidden="true" className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/30">
        {/* Header cinza escuro */}
        <div className="bg-[#3a3f4b] px-8 py-4 text-center">
          <h2 className="text-base font-bold text-white tracking-widest uppercase">
            Controle Operacional
          </h2>
        </div>

        {/* Corpo */}
        <div className="bg-white/90 backdrop-blur-md px-8 pt-8 pb-7 flex flex-col items-center gap-5">
          {/* Logo mascot centralizada */}
          <img
            src={mascot}
            alt="Grupo BR Hunter"
            className="h-32 w-32 object-contain drop-shadow-md"
          />

          <h1 className="text-lg font-bold text-[#3a3f4b] tracking-tight">
            Faça o seu login
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            {/* Campo e-mail */}
            <div className="space-y-1">
              <p className="text-center text-xs text-slate-400">Seu usuário ou e-mail</p>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-slate-400 transition">
                <div className="flex w-10 items-center justify-center bg-[#3a3f4b] text-white shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="nome"
                  type="email"
                  autoComplete="email"
                  aria-label="E-mail"
                  placeholder=""
                  className="flex-1 rounded-none border-0 bg-transparent text-slate-700 shadow-none focus-visible:ring-0 text-sm"
                  {...register("nome")}
                />
              </div>
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>

            {/* Campo senha */}
            <div className="space-y-1">
              <p className="text-center text-xs text-slate-400">Sua Senha</p>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-slate-400 transition">
                <div className="flex w-10 items-center justify-center bg-[#3a3f4b] text-white shrink-0">
                  <KeyRound className="h-4 w-4" />
                </div>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-label="Senha"
                  placeholder=""
                  className="flex-1 rounded-none border-0 bg-transparent text-slate-700 shadow-none focus-visible:ring-0 text-sm"
                  {...register("senha")}
                />
              </div>
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>

            {/* Botão */}
            <div className="flex justify-center pt-1">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#3a3f4b] hover:bg-[#2e333d] text-white px-10 shadow-lg transition"
              >
                {submitting ? "Entrando..." : "Entrar"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Links auxiliares */}
            <div className="flex flex-col items-center gap-1 pt-1 text-xs">
              <Link to="/esqueci-senha" className="font-medium text-slate-500 hover:text-[#a01c22] hover:underline transition">
                Esqueci minha senha
              </Link>
              <p className="text-slate-400">
                Acesso restrito. Solicite uma conta ao administrador.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
