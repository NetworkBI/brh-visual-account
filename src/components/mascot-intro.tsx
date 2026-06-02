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
      {/* glow radial atrás */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -m-10 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)" }}
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
        />
      )}
      {ended && (
        <img
          src="/mascote-final.jpg"
          alt="Mascote BR Hunter"
          width={1920}
          height={1080}
          className="relative h-full w-full object-contain mix-blend-screen"
        />
      )}
    </div>
  );
}
