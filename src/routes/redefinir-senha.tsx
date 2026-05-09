import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { senhaSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import bg from "@/assets/hunter-bg.jpg";

const schema = z
  .object({
    senha: senhaSchema,
    confirmar: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: "As senhas não coincidem",
    path: ["confirmar"],
  });
type FormInput = z.infer<typeof schema>;

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha — BR Hunter" }] }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Quando o usuário chega via link de recuperação, o Supabase dispara PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: FormInput) => {
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: values.senha });
    setSubmitting(false);
    if (error) {
      toast.error("Falha ao atualizar senha: " + error.message);
      return;
    }
    toast.success("Senha redefinida com sucesso!");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/40 to-secondary/70" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-primary-foreground">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Defina uma<br /><span className="text-white">nova senha</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/80">
            Mínimo de 6 caracteres, ao menos um número e sem caracteres especiais.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logo} alt="Grupo BR Hunter" className="h-20 w-auto" />
            <h1 className="mt-4 font-display text-2xl font-bold">Redefinir senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">Escolha sua nova senha de acesso</p>
          </div>

          {!ready ? (
            <div className="space-y-5">
              <div className="rounded-md border border-border bg-muted/50 p-4 text-sm">
                Link inválido ou expirado. Solicite um novo e-mail de recuperação para continuar.
              </div>
              <Button asChild className="w-full">
                <Link to="/esqueci-senha">Solicitar novo link</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-xs font-bold uppercase tracking-wider">NOVA SENHA</Label>
                <Input id="senha" type="password" autoComplete="new-password" {...register("senha")} />
                {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar" className="text-xs font-bold uppercase tracking-wider">CONFIRMAR SENHA</Label>
                <Input id="confirmar" type="password" autoComplete="new-password" {...register("confirmar")} />
                {errors.confirmar && <p className="text-xs text-destructive">{errors.confirmar.message}</p>}
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
