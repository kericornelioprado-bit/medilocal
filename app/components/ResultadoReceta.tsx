"use client";

import { useEffect, useState } from "react";

interface Medicamento {
  nombre: string;
  para_que: string;
  como_tomar: string;
  duracion: string;
  nota: string;
}

function CardAnimation({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 120 + 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

export default function ResultadoReceta({
  medicamentos,
  indicaciones,
  confianza,
}: {
  medicamentos: Medicamento[];
  indicaciones: string[];
  confianza: "alta" | "media" | "baja";
}) {
  return (
    <div className="space-y-4">
      {(confianza === "media" || confianza === "baja") && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warn/20 bg-warn/5 p-4 animate-slide-up">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-warn"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span className="text-sm text-warn">
            Los nombres de medicamentos pueden no ser exactos. Verifica contra
            la receta original antes de tomar cualquier decisión.
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1 animate-slide-up">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted/70">
          {medicamentos.length === 1
            ? "1 medicamento"
            : `${medicamentos.length} medicamentos`}
        </h3>
      </div>

      {medicamentos.map((m, i) => (
        <CardAnimation key={i} index={i}>
          <div className="group rounded-2xl border border-border bg-surface p-5 card-hover">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <span className="font-display text-sm font-bold">
                  {m.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-semibold text-ink">
                  {m.nombre}
                </h3>
                <p className="text-xs text-muted leading-relaxed mt-0.5">{m.para_que}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--bg)] p-3.5">
                <dt className="mb-1 text-xs font-medium text-muted flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cómo tomarlo
                </dt>
                <dd className="text-ink font-medium leading-relaxed">{m.como_tomar}</dd>
              </div>
              <div className="rounded-xl bg-[var(--bg)] p-3.5">
                <dt className="mb-1 text-xs font-medium text-muted flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Duración
                </dt>
                <dd className="text-ink font-medium">{m.duracion}</dd>
              </div>
              {m.nota && (
                <div className="rounded-xl border border-warn/15 bg-warn/5 p-3.5 sm:col-span-2">
                  <dt className="mb-1 text-xs font-semibold text-warn flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Precaución
                  </dt>
                  <dd className="text-sm text-warn/90 leading-relaxed">{m.nota}</dd>
                </div>
              )}
            </dl>
          </div>
        </CardAnimation>
      ))}

      {indicaciones.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-[var(--bg)]/50 px-4 py-3 animate-slide-up">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/60">
            Indicaciones adicionales
          </h4>
          <ul className="space-y-1.5">
            {indicaciones.map((ind, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted"
              >
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}