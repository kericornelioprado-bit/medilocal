"use client";

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
  { dot: string; label: string }
> = {
  normal: { dot: "bg-ok", label: "Normal" },
  bajo: { dot: "bg-warn", label: "Bajo" },
  alto: { dot: "bg-alert", label: "Alto" },
  desconocido: { dot: "bg-muted", label: "Sin rango" },
};

export default function ResultadoLaboratorio({
  estudios,
}: {
  estudios: Estudio[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[var(--bg)]">
            <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
              Estudio
            </th>
            <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
              Valor
            </th>
            <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
              Unidad
            </th>
            <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider hidden sm:table-cell">
              Rango ref.
            </th>
            <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {estudios.map((e, i) => (
            <tr
              key={i}
              className="group transition-colors hover:bg-[var(--primary-soft)]/30"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{e.nombre}</div>
                <div className="text-xs text-muted mt-0.5">
                  {e.que_significa}
                </div>
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink">
                {e.valor}
              </td>
              <td className="px-4 py-3 text-muted">{e.unidad}</td>
              <td className="px-4 py-3 text-muted hidden sm:table-cell">
                {e.rango_referencia || "—"}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${estadoConfig[e.estado].dot}`}
                  />
                  {estadoConfig[e.estado].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
