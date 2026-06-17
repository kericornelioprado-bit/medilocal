"use client";

export default function ResultadoOtro({
  resumen,
  onReset,
}: {
  resumen: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="rounded-full bg-[var(--primary-soft)] p-4">
        <svg
          className="h-8 w-8 text-primary"
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
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink mb-1">
          No se encontró un documento médico
        </h2>
        <p className="text-sm text-muted max-w-sm">{resumen}</p>
      </div>
      <button
        onClick={onReset}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Probar con otra imagen
      </button>
    </div>
  );
}
