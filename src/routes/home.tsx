import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { MascotIntro } from "@/components/mascot-intro";
import { useAuth } from "@/lib/auth";
import { FileText, Users, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/home")({
  head: () =>
    pageMeta({
      path: "/home",
      title: "Início — Grupo BR Hunter",
      description:
        "Central de controle operacional do Grupo BR Hunter: acesse prestações, usuários e condomínios.",
    }),
  component: () => (
    <SiteShell showHeaderLinks={false}>
      <HomePage />
    </SiteShell>
  ),
});

type Shortcut = {
  to: "/dashboard" | "/usuarios";
  label: string;
  desc: string;
  icon: typeof FileText;
};

const SHORTCUTS: Shortcut[] = [
  { to: "/dashboard", label: "Prestação de Contas", desc: "Acompanhe lançamentos, processos e indicadores do mês.", icon: FileText },
  { to: "/usuarios", label: "Usuários", desc: "Gerencie acessos, papéis e redefinição de senhas.", icon: Users },
];

function HomePage() {
  const { user } = useAuth();
  const nome = user?.email?.split("@")[0] ?? "operador";

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--primary) 50%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--primary) 50%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Hero card */}
      <section
        className="relative overflow-hidden rounded-2xl border border-border/60 p-6 sm:p-10"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-soft)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "var(--gradient-border)" }}
        />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Grupo BR Hunter
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Bem-vindo, <span className="text-primary">{nome}</span>.
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Sua central de controle operacional. Escolha um módulo abaixo para iniciar os fluxos do sistema.
            </p>
          </div>
          <div className="relative justify-self-center lg:justify-self-end">
            <MascotIntro className="h-72 w-72 sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
          </div>
        </div>
      </section>


      {/* Atalhos */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg sm:p-7"
          >
            <div
              className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white shadow-sm sm:h-24 sm:w-24"
            >
              <img
                src={logo}
                alt="Grupo BR Hunter"
                width={640}
                height={640}
                className="h-14 w-14 object-contain sm:h-16 sm:w-16"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                <s.icon className="h-3.5 w-3.5" />
                Módulo
              </div>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">{s.label}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-primary opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
