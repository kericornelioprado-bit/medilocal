"use client";

export default function ResultadoOtro({
  resumen,
  onReset,
}: {
  resumen: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center animate-fade-in">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--primary-soft)]">
          <svg
            className="h-9 w-9 text-primary"
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
        </div>
      </div>
      <div className="max-w-sm">
        <h2 className="font-display text-lg font-semibold text-ink mb-2">
          No se encontró un documento médico
        </h2>
        <p className="text-sm leading-relaxed text-muted">{resumen}</p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
          />
        </svg>
        Probar con otra imagen
      </button>
    </div>
  );
}
