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
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-500 py-5 px-6">
          <h2 className="text-xl font-semibold text-white text-center tracking-wide">
            Controle Operacional
          </h2>
        </div>

        {/* Body */}
        <div className="bg-white/85 backdrop-blur-sm p-8">
          {/* Logo centralizada */}
          <div className="flex justify-center mb-4">
            <img
              src={mascot}
              alt="Grupo BR Hunter"
              className="h-16 object-contain"
            />
          </div>

          <h1 className="text-xl font-semibold text-slate-700 text-center mb-6">
            Faça o seu login
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo e-mail */}
            <div className="space-y-1">
              <p className="text-sm text-slate-500 text-center">Seu usuário ou e-mail</p>
              <div className="flex">
                <div className="bg-slate-600 rounded-l-lg flex items-center justify-center w-12">
                  <User className="h-5 w-5 text-white" />
                </div>
                <Input
                  id="nome"
                  type="email"
                  autoComplete="email"
                  aria-label="E-mail"
                  className="rounded-l-none border-slate-200 bg-slate-100 focus:bg-white"
                  {...register("nome")}
                />
              </div>
              {errors.nome && <p className="text-destructive text-xs text-center">{errors.nome.message}</p>}
            </div>

            {/* Campo senha */}
            <div className="space-y-1">
              <p className="text-sm text-slate-500 text-center">Sua Senha</p>
              <div className="flex">
                <div className="bg-slate-600 rounded-l-lg flex items-center justify-center w-12">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-label="Senha"
                  className="rounded-l-none border-slate-200 bg-slate-100 focus:bg-white"
                  {...register("senha")}
                />
              </div>
              {errors.senha && <p className="text-destructive text-xs text-center">{errors.senha.message}</p>}
            </div>

            {/* Botão */}
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-2 rounded-full flex items-center gap-2"
              >
                {submitting ? "Entrando..." : "Entrar"}
                <ArrowRight className="h-4 w-4" />
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
