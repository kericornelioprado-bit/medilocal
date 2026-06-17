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
        <div className="flex items-start gap-2 rounded-lg border border-[var(--warn)]/30 bg-[var(--warn)]/5 p-3 text-sm">
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
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span className="text-warn">
            Los nombres de medicamentos pueden no ser exactos. Verifica contra
            la receta original antes de tomar cualquier decisión.
          </span>
        </div>
      )}

      {medicamentos.map((m, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
        >
          <h3 className="font-display text-lg font-semibold text-ink mb-3">
            {m.nombre}
          </h3>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted mb-0.5">
                Para qué sirve
              </dt>
              <dd className="text-ink">{m.para_que}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wider text-muted mb-0.5">
                Cómo tomarlo
              </dt>
              <dd className="text-ink">{m.como_tomar}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wider text-muted mb-0.5">
                Duración
              </dt>
              <dd className="text-ink">{m.duracion}</dd>
            </div>

            {m.nota && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted mb-0.5">
                  Precaución
                </dt>
                <dd className="text-warn">{m.nota}</dd>
              </div>
            )}
          </dl>
        </div>
      ))}

      {indicaciones.length > 0 && (
        <div className="pt-1">
          <h4 className="text-xs uppercase tracking-wider text-muted mb-2">
            Indicaciones adicionales
          </h4>
          <ul className="space-y-1 text-sm text-muted">
            {indicaciones.map((ind, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-muted" />
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
