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
  { dot: string; bg: string; text: string; label: string; border: string }
> = {
  normal: {
    dot: "bg-ok",
    bg: "bg-ok/8",
    text: "text-ok",
    label: "Normal",
    border: "border-ok/20",
  },
  bajo: {
    dot: "bg-warn",
    bg: "bg-warn/8",
    text: "text-warn",
    label: "Bajo",
    border: "border-warn/20",
  },
  alto: {
    dot: "bg-alert",
    bg: "bg-alert/8",
    text: "text-alert",
    label: "Alto",
    border: "border-alert/20",
  },
  desconocido: {
    dot: "bg-muted",
    bg: "bg-muted/8",
    text: "text-muted",
    label: "Sin rango",
    border: "border-muted/20",
  },
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
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      }`}
    >
      {children}
    </tr>
  );
}

function StatsBar({ estudios }: { estudios: Estudio[] }) {
  const counts = {
    normal: estudios.filter((e) => e.estado === "normal").length,
    bajo: estudios.filter((e) => e.estado === "bajo").length,
    alto: estudios.filter((e) => e.estado === "alto").length,
    desconocido: estudios.filter((e) => e.estado === "desconocido").length,
  };

  const total = estudios.length;
  const attentionNeeded = counts.alto + counts.bajo;

  return (
    <div className="flex flex-wrap items-center gap-3 animate-slide-up">
      <div className="flex items-center gap-1.5 rounded-full bg-ok/10 border border-ok/15 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-ok" />
        <span className="text-xs font-semibold text-ok">{counts.normal}</span>
        <span className="text-xs text-ok/70">normal</span>
      </div>
      {counts.bajo > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-warn/10 border border-warn/15 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-warn" />
          <span className="text-xs font-semibold text-warn">{counts.bajo}</span>
          <span className="text-xs text-warn/70">bajo</span>
        </div>
      )}
      {counts.alto > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-alert/10 border border-alert/15 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-alert" />
          <span className="text-xs font-semibold text-alert">{counts.alto}</span>
          <span className="text-xs text-alert/70">alto</span>
        </div>
      )}
      {counts.desconocido > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-muted/10 border border-muted/15 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-muted" />
          <span className="text-xs font-semibold text-muted">{counts.desconocido}</span>
          <span className="text-xs text-muted/70">sin rango</span>
        </div>
      )}
      <div className="ml-auto text-xs text-muted">
        {total} {total === 1 ? "estudio" : "estudios"}
        {attentionNeeded > 0 && (
          <span className="ml-1.5 font-medium text-warn">
            · {attentionNeeded} {attentionNeeded === 1 ? "requiere atención" : "requieren atención"}
          </span>
        )}
      </div>
    </div>
  );
}

function ExpandableRow({
  estudio,
  index,
}: {
  estudio: Estudio;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const config = estadoConfig[estudio.estado];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="group w-full text-left"
        type="button"
      >
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
            expanded
              ? `${config.bg} ${config.border} border`
              : "border border-border/50 bg-surface hover:border-border hover:bg-[var(--bg)]/50"
          }`}
        >
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200 ${
              expanded ? "scale-125" : ""
            } ${config.dot}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink text-sm truncate">
                {estudio.nombre}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">
              {estudio.valor}
            </span>
            <span className="text-xs text-muted">{estudio.unidad}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
            >
              {config.label}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
      </button>

      <div
        className={`expandable-content ${
          expanded ? "expanded" : "collapsed"
        } px-4`}
      >
        <div className="rounded-b-xl border-x border-b border-border/40 bg-surface/60 px-4 py-3">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            {estudio.rango_referencia && (
              <div>
                <span className="block text-xs text-muted">Rango de referencia</span>
                <span className="font-mono text-ink">{estudio.rango_referencia}</span>
              </div>
            )}
            {estudio.que_significa && (
              <div className={estudio.rango_referencia ? "sm:col-span-2" : "sm:col-span-3"}>
                <span className="block text-xs text-muted">¿Qué significa?</span>
                <span className="text-ink leading-relaxed">{estudio.que_significa}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopTable({ estudios }: { estudios: Estudio[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto scrollbar-thin">
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
            {estudios.map((e, i) => {
              const config = estadoConfig[e.estado];
              return (
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
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.border}`}
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${config.dot}`}
                      />
                      {config.label}
                    </span>
                  </td>
                </AnimatedRow>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileCards({ estudios }: { estudios: Estudio[] }) {
  return (
    <div className="space-y-2">
      {estudios.map((e, i) => (
        <ExpandableRow key={i} estudio={e} index={i} />
      ))}
    </div>
  );
}

export default function ResultadoLaboratorio({
  estudios,
}: {
  estudios: Estudio[];
}) {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-1">
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
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted/70">
          Resultados de laboratorio
        </h3>
      </div>

      <StatsBar estudios={estudios} />

      <div className="hidden sm:block">
        <DesktopTable estudios={estudios} />
      </div>
      <div className="sm:hidden">
        <MobileCards estudios={estudios} />
      </div>
    </div>
  );
}