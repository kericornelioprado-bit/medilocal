"use client";

interface Medicamento {
  nombre: string;
  para_que: string;
  como_tomar: string;
  duracion: string;
  nota: string;
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
        <div className="flex items-start gap-2.5 rounded-xl border border-[var(--warn)]/20 bg-[var(--warn)]/5 p-4">
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span className="text-sm text-warn">
            Los nombres de medicamentos pueden no ser exactos. Verifica contra
            la receta original antes de tomar cualquier decisión.
          </span>
        </div>
      )}

      {medicamentos.map((m, i) => (
        <div
          key={i}
          className="group rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                {m.nombre}
              </h3>
              <p className="text-xs text-muted">{m.para_que}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="rounded-lg bg-[var(--bg)] px-3 py-2.5">
              <dt className="mb-0.5 text-xs font-medium text-muted">
                Cómo tomarlo
              </dt>
              <dd className="text-ink">{m.como_tomar}</dd>
            </div>
            <div className="rounded-lg bg-[var(--bg)] px-3 py-2.5">
              <dt className="mb-0.5 text-xs font-medium text-muted">
                Duración
              </dt>
              <dd className="text-ink">{m.duracion}</dd>
            </div>
            {m.nota && (
              <div className="rounded-lg bg-[var(--warn)]/5 border border-[var(--warn)]/10 px-3 py-2.5 sm:col-span-2">
                <dt className="mb-0.5 text-xs font-medium text-warn">
                  Precaución
                </dt>
                <dd className="text-sm text-warn">{m.nota}</dd>
              </div>
            )}
          </dl>
        </div>
      ))}

      {indicaciones.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-[var(--bg)]/50 px-4 py-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/60">
            Indicaciones adicionales
          </h4>
          <ul className="space-y-1.5">
            {indicaciones.map((ind, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted"
              >
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-muted/40" />
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
