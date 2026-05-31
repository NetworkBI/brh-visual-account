import { useEffect, useRef, useState } from "react";

export function MascotIntro({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setEnded(true);
  }, []);

  // Máscara radial: borda do vídeo desaparece suavemente no fundo,
  // preservando o destaque do mascote no centro.
  const fadeMask =
    "radial-gradient(ellipse at center, #000 52%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0) 88%)";

  return (
    <div className={"relative " + (className ?? "")}>
      {/* Halo quente atrás do mascote — funde com o fundo da home */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -m-16 rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), color-mix(in oklab, var(--primary) 18%, transparent) 55%, transparent 78%)",
        }}
      />
      {/* Vinheta interna para suavizar transição vídeo↔fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, color-mix(in oklab, var(--background) 85%, transparent) 92%)",
        }}
      />
      {!ended && (
        <video
          ref={videoRef}
          src="/mascote-intro.mp4"
          poster="/mascote-final.jpg"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setEnded(true)}
          aria-label="Animação de boas-vindas do mascote BR Hunter"
          className="relative h-full w-full object-contain mix-blend-screen dark:mix-blend-screen"
          style={{
            WebkitMaskImage: fadeMask,
            maskImage: fadeMask,
          }}
        />
      )}
      {ended && (
        <img
          src="/mascote-final.jpg"
          alt="Mascote BR Hunter"
          width={1920}
          height={1080}
          className="relative h-full w-full object-contain mix-blend-screen"
          style={{
            WebkitMaskImage: fadeMask,
            maskImage: fadeMask,
          }}
        />
      )}
    </div>
  );
}
