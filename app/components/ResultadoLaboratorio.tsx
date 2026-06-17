"use client";

import { useEffect, useRef, useState } from "react";

interface Estudio {
  nombre: string;
  valor: string;
  unidad: string;
  rango_referencia: string;
  estado: "normal" | "bajo" | "alto" | "desconocido";
  que_significa: string;
}

const estadoConfig: Record<
  Estudio["estado"],
  { dot: string; bg: string; label: string }
> = {
  normal: { dot: "bg-ok", bg: "bg-ok/5", label: "Normal" },
  bajo: { dot: "bg-warn", bg: "bg-warn/5", label: "Bajo" },
  alto: { dot: "bg-alert", bg: "bg-alert/5", label: "Alto" },
  desconocido: { dot: "bg-muted", bg: "bg-muted/5", label: "Sin rango" },
};

function AnimatedRow({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <tr
      ref={ref}
      className={`group transition-all duration-500 ${
        visible
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-2"
      }`}
    >
      {children}
    </tr>
  );
}

export default function ResultadoLaboratorio({
  estudios,
}: {
  estudios: Estudio[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-[var(--bg)]/70">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted/70">
                Estudio
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted/70">
                Valor
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted/70">
                Unidad
              </th>
              <th className="hidden px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted/70 sm:table-cell">
                Rango ref.
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted/70">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {estudios.map((e, i) => (
              <AnimatedRow key={i} delay={i * 80}>
                <td className="px-5 py-4">
                  <div className="font-medium text-ink">{e.nombre}</div>
                  <div className="mt-0.5 max-w-[200px] text-xs leading-relaxed text-muted">
                    {e.que_significa}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-block rounded-md bg-[var(--bg)] px-2.5 py-1 font-mono text-sm font-medium tabular-nums text-ink">
                    {e.valor}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted">{e.unidad}</td>
                <td className="hidden px-5 py-4 font-mono text-sm text-muted sm:table-cell">
                  {e.rango_referencia || "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${estadoConfig[e.estado].bg} border-border`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${estadoConfig[e.estado].dot}`}
                    />
                    {estadoConfig[e.estado].label}
                  </span>
                </td>
              </AnimatedRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
