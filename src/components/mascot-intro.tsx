import { useEffect, useRef, useState } from "react";

export function MascotIntro({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setEnded(true);
  }, []);

  // Máscara radial: borda do vídeo some no fundo, mascote permanece em destaque.
  const fadeMask =
    "radial-gradient(ellipse at center, #000 55%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0) 92%)";

  return (
    <div className={"relative " + (className ?? "")}>
      {/* Palco escuro: garante contraste do mascote em light e dark, e funde com a paleta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -m-8 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.18 0.02 25) 0%, oklch(0.18 0.02 25 / 0.85) 45%, oklch(0.18 0.02 25 / 0) 78%)",
        }}
      />
      {/* Halo quente da identidade visual */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -m-12 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)",
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
          className="relative h-full w-full object-contain mix-blend-screen"
          style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
        />
      )}
      {ended && (
        <img
          src="/mascote-final.jpg"
          alt="Mascote BR Hunter"
          width={1920}
          height={1080}
          className="relative h-full w-full object-contain mix-blend-screen"
          style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
        />
      )}
    </div>
  );
}
