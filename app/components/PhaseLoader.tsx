"use client";

import { useEffect, useState } from "react";

const fases = [
  { label: "Analizando imagen…", desc: "Visión artificial", icon: "eye" },
  { label: "Extrayendo datos…", desc: "OCR + estructura", icon: "list" },
  { label: "Redactando explicación…", desc: "NLP en español", icon: "pen" },
];

function IconPhase({
  phase,
  active,
  done,
}: {
  phase: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-500 ${
          active
            ? "scale-100 bg-primary/10 ring-1 ring-primary/20"
            : done
              ? "scale-100 bg-ok/10"
              : "scale-90 bg-transparent"
        }`}
      />
      {phase === "eye" && (
        <svg
          className={`relative h-5 w-5 transition-colors duration-300 ${
            done ? "text-ok" : active ? "text-primary" : "text-muted/40"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
      {phase === "list" && (
        <svg
          className={`relative h-5 w-5 transition-colors duration-300 ${
            done ? "text-ok" : active ? "text-primary" : "text-muted/40"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 5.25h.007v.008h-.007V12zM3.75 17.25h.007v.008H3.75v-.008z"
          />
        </svg>
      )}
      {phase === "pen" && (
        <svg
          className={`relative h-5 w-5 transition-colors duration-300 ${
            done ? "text-ok" : active ? "text-primary" : "text-muted/40"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
        </svg>
      )}
      {active && (
        <span className="absolute inset-0 rounded-xl motion-safe:animate-[pulseGlow_2s_ease-in-out_infinite]" />
      )}
    </div>
  );
}

export default function PhaseLoader() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(1), 1000);
    const t2 = setTimeout(() => setActive(2), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface p-8">
      {/* Scanning animation */}
      <div className="mx-auto mb-8 flex max-w-[280px] flex-col items-center">
        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl border border-border bg-[var(--bg)]">
          {/* Document outline */}
          <div className="absolute inset-4 rounded border-2 border-dashed border-muted/20" />
          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent motion-safe:animate-[scanLine_2s_ease-in-out_infinite]"
          />
          {/* Data lines shimmer */}
          <div className="absolute bottom-8 left-8 right-8 space-y-2">
            {[80, 55, 70, 40].map((w, i) => (
              <div
                key={i}
                className="relative h-1.5 overflow-hidden rounded-full bg-muted/10"
              >
                <div
                  className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-primary/30 to-transparent motion-safe:animate-[shimmer_1.5s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
                <div
                  className="h-full rounded-full bg-muted/10"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-center font-display text-sm font-medium text-ink">
          Leyendo tu documento…
        </p>
      </div>

      {/* Phase indicators */}
      <div className="space-y-1">
        {fases.map((fase, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500 ${
              active === i
                ? "bg-[var(--primary-soft)]/50"
                : i < active
                  ? ""
                  : ""
            }`}
          >
            <IconPhase
              phase={fase.icon}
              active={active === i}
              done={i < active}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium transition-colors duration-300 ${
                  i <= active ? "text-ink" : "text-muted/40"
                }`}
              >
                {fase.label}
              </p>
              <p
                className={`text-xs transition-colors duration-300 ${
                  i <= active ? "text-muted" : "text-muted/30"
                }`}
              >
                {fase.desc}
              </p>
            </div>
            {active === i && (
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
              </div>
            )}
            {i < active && (
              <svg
                className="h-4 w-4 text-ok"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
