import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import bg from "@/assets/hunter-bg.jpg";
import { solicitarTrocaSenha } from "@/lib/senha.functions";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
});
type FormInput = z.infer<typeof schema>;

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => pageMeta({
    path: "/esqueci-senha",
    title: "Recuperar senha — Grupo BR Hunter",
    description: "Solicite ao administrador a redefinição da sua senha de acesso ao sistema do Grupo BR Hunter.",
  }),
  component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const fnSolicitar = useServerFn(solicitarTrocaSenha);
  const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormInput) => {
    setSubmitting(true);
    try {
      await fnSolicitar({ data: { email: values.email } });
      setSent(true);
      toast.success("Solicitação enviada ao administrador");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar solicitação");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src={bg} alt="" width={640} height={640} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-secondary/70" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-primary-foreground">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Recupere o<br /><span className="text-white">acesso ao sistema</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Informe o e-mail corporativo cadastrado e enviaremos um link para você redefinir sua senha.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logo} alt="Grupo BR Hunter" width={640} height={640} className="h-20 w-auto" />
            <h1 className="mt-4 font-display text-2xl font-bold">Esqueci minha senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">Solicite a redefinição ao administrador</p>
          </div>

          {sent ? (
            <div className="space-y-5">
              <div className="rounded-md border border-border bg-muted/50 p-4 text-sm">
                Sua solicitação foi enviada. Um administrador (ADM ou MASTER) irá analisar e aprovar. Quando aprovado, basta fazer login que você será direcionado automaticamente para definir uma nova senha.
              </div>

              <Button type="button" onClick={() => navigate({ to: "/login" })} className="w-full">
                Voltar ao login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">E-MAIL CORPORATIVO</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="seu.email@brhunter.com.br" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Enviando..." : "Solicitar redefinição"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">Voltar ao login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
