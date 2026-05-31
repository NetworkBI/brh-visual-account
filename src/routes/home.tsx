import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { MascotIntro } from "@/components/mascot-intro";
import { useAuth } from "@/lib/auth";
import { FileText, Users, ArrowRight } from "lucide-react";
import brhLogo from "@/assets/brh-logo-full.png";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/home")({
  head: () =>
    pageMeta({
      path: "/home",
      title: "Início — Grupo BR Hunter",
      description:
        "Central de controle operacional do Grupo BR Hunter: acesse prestações e usuários.",
    }),
  component: () => (
    <SiteShell showHeaderLinks={false}>
      <HomePage />
    </SiteShell>
  ),
});

const SHORTCUTS = [
  {
    to: "/dashboard",
    label: "Prestação de Contas",
    desc: "Acompanhe lançamentos, processos e indicadores do mês.",
    icon: FileText,
  },
  {
    to: "/usuarios",
    label: "Usuários",
    desc: "Gerencie acessos, papéis e redefinição de senhas.",
    icon: Users,
  },
] as const;

function HomePage() {
  const { user } = useAuth();
  const nome = user?.email?.split("@")[0] ?? "operador";

  return (
    <div className="relative space-y-8">
      {/* Grade institucional sutil */}
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
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6 sm:p-10"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "var(--gradient-border)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-primary-soft)" }}
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
              Sua central de controle operacional. Escolha um módulo ao lado para iniciar os fluxos do sistema.
            </p>
          </div>
          <div className="relative justify-self-center lg:justify-self-end">
            <MascotIntro className="h-72 w-72 sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
          </div>
        </div>
      </section>

      {/* Logo institucional + atalhos */}
      <section
        className="relative overflow-hidden rounded-3xl border border-border/60 p-6 sm:p-10"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-soft)" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-50 blur-3xl"
          style={{ background: "var(--gradient-primary-soft)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 bottom-0 h-px"
          style={{ background: "var(--gradient-border)" }}
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Logo institucional à esquerda */}
          <div className="relative flex flex-col items-center justify-center lg:items-start">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 -m-10 rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)",
                }}
              />
              <img
                src={brhLogo}
                alt="Grupo BR Hunter"
                width={512}
                height={512}
                className="relative h-44 w-44 object-contain drop-shadow-[0_18px_30px_rgba(200,16,46,0.25)] sm:h-56 sm:w-56 lg:h-64 lg:w-64"
              />
            </div>
            <div className="mt-6 text-center lg:text-left">
              <p className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Grupo <span className="text-primary">BR Hunter</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Integridade, precisão e controle em cada operação.
              </p>
            </div>
          </div>

          {/* Cards alinhados à direita */}
          <div className="grid gap-4 sm:grid-cols-2">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="group relative overflow-hidden rounded-2xl border border-border/60 p-6 text-left transition hover:-translate-y-0.5 hover:border-primary/60"
                style={{
                  background: "var(--gradient-surface)",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  style={{ background: "var(--gradient-primary-soft)" }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{ background: "var(--gradient-border)" }}
                />
                <div className="relative">
                  <div
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground"
                    style={{
                      background: "var(--gradient-primary)",
                      boxShadow: "var(--shadow-glow)",
                    }}
                  >
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-lg font-bold">{s.label}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Acessar
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
