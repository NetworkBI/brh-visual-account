import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { FileText, Users, Building2, Settings, ArrowRight } from "lucide-react";
import mascot from "@/assets/mascot.png";
import homeBg from "@/assets/home-bg.jpg";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/home")({
  head: () => pageMeta({
    path: "/home",
    title: "Início — Grupo BR Hunter",
    description: "Central de controle operacional do Grupo BR Hunter: acesse prestações, usuários, condomínios e configurações.",
  }),
  component: () => <AppShell><HomePage /></AppShell>,
});

const SHORTCUTS = [
  { to: "/dashboard", label: "Prestação de Contas", desc: "Acompanhe lançamentos, processos e indicadores do mês.", icon: FileText },
  { to: "/usuarios", label: "Usuários", desc: "Gerencie acessos, papéis e redefinição de senhas.", icon: Users },
  { to: "/condominios", label: "Condomínios", desc: "Cadastre e edite os condomínios atendidos.", icon: Building2 },
  { to: "/configuracoes", label: "Configurações", desc: "Preferências do sistema, tema e histórico.", icon: Settings },
] as const;

function HomePage() {
  const { user } = useAuth();
  const nome = user?.email?.split("@")[0] ?? "operador";

  return (
    <div className="relative -m-6 lg:-m-8 min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Fundo com textura */}
      <img src={homeBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-40" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-[#7a1418]/20" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(192,40,46,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(192,40,46,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 lg:py-14">
        {/* Hero */}
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#a01c22] font-semibold">Grupo BR Hunter</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Bem-vindo, <span className="text-[#a01c22]">{nome}</span>.
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Sua central de controle operacional. Escolha um módulo abaixo ou utilize o menu lateral para iniciar os fluxos do sistema.
            </p>
          </div>
          <div className="relative justify-self-center lg:justify-self-end">
            <div aria-hidden="true" className="absolute inset-0 -m-6 rounded-full bg-gradient-radial from-[#c0282e]/30 via-transparent to-transparent blur-2xl" />
            <img src={mascot} alt="Mascote BR Hunter" className="relative h-56 w-56 object-contain drop-shadow-[0_20px_35px_rgba(192,40,46,0.45)] sm:h-64 sm:w-64" />
          </div>
        </div>

        {/* Shortcuts */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#a01c22]/60 hover:shadow-lg hover:shadow-[#7a1418]/10"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#a01c22] to-[#7a1418] text-white shadow">
                <s.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-base font-bold">{s.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-[#a01c22] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
