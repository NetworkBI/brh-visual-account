import { useEffect, useRef, useState } from "react";

export function MascotIntro({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setEnded(true);
  }, []);

  return (
    <div className={"relative " + (className ?? "")}>
      {/* halo externo amplo (atmosfera) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -m-16 rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), transparent 72%)",
        }}
      />
      {/* moldura escura para garantir contraste do mascote em qualquer tema */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[28%] ring-1 ring-primary/30 shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, color-mix(in oklab, var(--primary) 18%, #0a0a0a) 0%, #050505 70%)",
        }}
      />
      {/* brilho interno sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[28%]"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, color-mix(in oklab, var(--primary) 35%, transparent) 0%, transparent 55%)",
          mixBlendMode: "screen",
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
          className="relative h-full w-full rounded-[28%] object-contain"
        />
      )}
      {ended && (
        <img
          src="/mascote-final.jpg"
          alt="Mascote BR Hunter"
          width={1920}
          height={1080}
          className="relative h-full w-full rounded-[28%] object-contain"
        />
      )}
    </div>
  );
}
