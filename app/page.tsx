"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import ResultadoLaboratorio from "./components/ResultadoLaboratorio";
import ResultadoReceta from "./components/ResultadoReceta";
import ResultadoOtro from "./components/ResultadoOtro";
import PhaseLoader from "./components/PhaseLoader";

type AnalysisState = "idle" | "loading" | "success" | "error";

interface Estudio {
  nombre: string;
  valor: string;
  unidad: string;
  rango_referencia: string;
  estado: "normal" | "bajo" | "alto" | "desconocido";
  que_significa: string;
}

interface Medicamento {
  nombre: string;
  para_que: string;
  como_tomar: string;
  duracion: string;
  nota: string;
}

interface AnalysisResult {
  tipo_documento: "laboratorio" | "receta" | "otro";
  titulo: string;
  resumen: string;
  confianza: "alta" | "media" | "baja";
  estudios?: Estudio[];
  medicamentos?: Medicamento[];
  indicaciones_adicionales?: string[];
  descargo: string;
}

interface HistoryEntry {
  result: AnalysisResult;
  preview: string;
  timestamp: number;
}

const HISTORY_KEY = "mediclaro_history_v2";
const MAX_HISTORY = 3;
const MAX_SIZE_BYTES = 1.5 * 1024 * 1024;

function chipConfianza(confianza: AnalysisResult["confianza"]) {
  const config = {
    alta: { dot: "bg-ok", label: "Confianza alta", width: "w-full" },
    media: { dot: "bg-warn", label: "Confianza media", width: "w-2/3" },
    baja: { dot: "bg-alert", label: "Confianza baja", width: "w-1/3" },
  };
  const c = config[confianza];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-1.5 w-14 overflow-hidden rounded-full bg-border">
        <span
          className={`h-full rounded-full ${c.dot} transition-all duration-700 ${c.width}`}
        />
      </span>
      <span className="text-xs font-medium text-muted">{c.label}</span>
    </span>
  );
}

function StepsSection() {
  const steps = [
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      ),
      title: "Sube tu documento",
      desc: "Toma una foto clara de tu estudio de laboratorio o receta médica.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
          />
        </svg>
      ),
      title: "La IA lo analiza",
      desc: "Visión artificial extrae los datos y el NLP genera una explicación en español.",
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          />
        </svg>
      ),
      title: "Entiende tus resultados",
      desc: "Recibe un resumen claro, con alertas si algo está fuera de rango.",
    },
  ];

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {steps.map((s, i) => (
        <div
          key={i}
          className="group rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="mb-3 inline-flex rounded-xl bg-[var(--primary-soft)] p-2.5 text-primary transition group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
            {s.icon}
          </div>
          <h3 className="mb-1 font-display text-sm font-semibold text-ink">
            {s.title}
          </h3>
          <p className="text-xs leading-relaxed text-muted">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<AnalysisState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore
    }
    setHistoryLoaded(true);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function saveToHistory(entry: HistoryEntry) {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  async function resizeImageIfNeeded(
    file: File,
  ): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const originalBase64 = dataUrl.split(",")[1];

        if (originalBase64.length * 0.75 <= MAX_SIZE_BYTES) {
          resolve({ base64: originalBase64, mimeType: file.type });
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1200;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          const outputType =
            file.type === "image/png" ? "image/png" : "image/jpeg";
          let dataUrlOut = canvas.toDataURL(outputType, quality);
          let compressed = dataUrlOut.split(",")[1];

          while (
            compressed.length * 0.75 > MAX_SIZE_BYTES &&
            quality > 0.3
          ) {
            quality -= 0.1;
            dataUrlOut = canvas.toDataURL(outputType, quality);
            compressed = dataUrlOut.split(",")[1];
          }

          resolve({ base64: compressed, mimeType: outputType });
        };
        img.onerror = reject;
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("El archivo debe ser una imagen (JPEG, PNG o WebP).");
      setState("error");
      return;
    }

    selectedFileRef.current = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setFileName(file.name);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleAnalyze = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file) {
      setErrorMsg("Selecciona una imagen primero.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const { base64, mimeType } = await resizeImageIfNeeded(file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error desconocido del servidor.");
      }

      setResult(data as AnalysisResult);
      setState("success");

      const previewSmall =
        preview ||
        (await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }));

      saveToHistory({
        result: data as AnalysisResult,
        preview: previewSmall,
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error inesperado.";
      setErrorMsg(message);
      setState("error");
    }
  }, [preview]);

  const reset = () => {
    setState("idle");
    setResult(null);
    setErrorMsg("");
    setPreview("");
    setFileName("");
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const tipoDocLabel: Record<string, string> = {
    laboratorio: "Estudio de laboratorio",
    receta: "Receta médica",
    otro: "Documento no médico",
  };

  const showIdleUI = state === "idle" || state === "error";

  return (
    <div className="flex flex-col flex-1 items-center">
      {/* Animated gradient */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-30 motion-safe:animate-[bgShift_15s_ease_infinite]"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, var(--primary-glow) 0%, transparent 50%), radial-gradient(circle at 70% 80%, var(--primary-glow) 0%, transparent 50%)",
          backgroundSize: "200% 200%",
        }}
      />

      <main className="w-full max-w-[720px] px-4 py-8 sm:py-14">
        {/* Hero */}
        {showIdleUI && (
          <div className="mb-10 text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 motion-safe:animate-[float_4s_ease-in-out_infinite]">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                />
              </svg>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              MediClaro
            </h1>
            <p className="mt-3 text-base text-muted max-w-md mx-auto leading-relaxed">
              Sube una foto de tu estudio de laboratorio o receta y obtén una
              explicación clara en español con inteligencia artificial.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-border/60 bg-surface/80 px-4 py-3 text-sm text-muted backdrop-blur-sm">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-muted/60"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <span>
            Esta herramienta es informativa y NO sustituye la consulta con un
            profesional de la salud.
          </span>
        </div>

        {/* Dropzone */}
        {state !== "success" && state !== "loading" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
              dragging
                ? "scale-[1.01] border-primary bg-primary/5 shadow-lg shadow-primary/10"
                : preview
                  ? "border-border/80 bg-surface"
                  : "border-border/60 bg-surface/60 hover:border-primary/30 hover:bg-surface"
            }`}
          >
            {/* Pulsing glow when empty */}
            {!preview && (
              <div className="pointer-events-none absolute inset-0 motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]" />
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            {preview ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="max-h-52 rounded-xl object-contain shadow-lg transition-transform group-hover:scale-[1.02]"
                />
                <p className="text-sm font-medium text-ink">{fileName}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="text-xs text-muted underline decoration-muted/40 underline-offset-2 transition hover:text-ink hover:decoration-ink/40"
                >
                  Elegir otra imagen
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-[var(--primary-soft)] p-4 text-primary transition-transform group-hover:scale-110">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    Arrastra tu imagen aquí o haz clic
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    JPEG, PNG o WebP — Máximo 5 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {state !== "success" && state !== "loading" && (
          <div className="mt-5 flex flex-col items-center">
            <button
              onClick={handleAnalyze}
              disabled={!preview}
              className={`inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                preview
                  ? "bg-primary shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                  : "cursor-not-allowed bg-muted/30 shadow-none"
              }`}
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
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
              Analizar documento
            </button>
          </div>
        )}

        {/* Loading */}
        {state === "loading" && <PhaseLoader />}

        {/* Error */}
        {state === "error" && (
          <div className="mt-6 animate-fade-in rounded-2xl border border-[var(--alert)]/20 bg-[var(--alert)]/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--alert)]/10">
              <svg
                className="h-5 w-5 text-alert"
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
            <p className="text-sm text-ink mb-3">{errorMsg}</p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:opacity-80"
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
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Success */}
        {state === "success" && result && (
          <div className="mt-6 space-y-5 animate-fade-in">
            {/* Result header */}
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
              {preview && (
                <img
                  src={preview}
                  alt="Documento analizado"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted mb-0.5">
                  {tipoDocLabel[result.tipo_documento] ??
                    result.tipo_documento}
                </p>
                <h2 className="font-display text-lg font-semibold text-ink truncate">
                  {result.titulo}
                </h2>
                <div className="mt-2">
                  {chipConfianza(result.confianza)}
                </div>
              </div>
              <button
                onClick={reset}
                className="shrink-0 rounded-lg bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Nuevo análisis
              </button>
            </div>

            {/* Resumen */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/70">
                Resumen
              </h3>
              <p className="text-sm leading-relaxed text-ink">
                {result.resumen}
              </p>
            </div>

            {/* Type-specific */}
            {result.tipo_documento === "laboratorio" &&
              result.estudios &&
              result.estudios.length > 0 && (
                <div className="animate-fade-in">
                  <ResultadoLaboratorio estudios={result.estudios} />
                </div>
              )}

            {result.tipo_documento === "receta" &&
              result.medicamentos &&
              result.medicamentos.length > 0 && (
                <div className="animate-fade-in">
                  <ResultadoReceta
                    medicamentos={result.medicamentos}
                    indicaciones={result.indicaciones_adicionales ?? []}
                    confianza={result.confianza}
                  />
                </div>
              )}

            {result.tipo_documento === "otro" && (
              <ResultadoOtro resumen={result.resumen} onReset={reset} />
            )}

            {/* Descargo */}
            <p className="text-center text-xs text-muted/60 italic">
              {result.descargo}
            </p>
          </div>
        )}

        {/* How it works — only on idle */}
        {state === "idle" && <StepsSection />}

        {/* History */}
        {historyLoaded && history.length > 0 && state === "idle" && (
          <div className="mt-12">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted/60">
              Análisis recientes
            </h2>
            <div className="space-y-2">
              {history.map((entry, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setResult(entry.result);
                    setPreview(entry.preview);
                    setState("success");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <img
                    src={entry.preview}
                    alt="Miniatura"
                    className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {entry.result.titulo}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(entry.timestamp).toLocaleString("es", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {chipConfianza(entry.result.confianza)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {showIdleUI && (
          <p className="mt-14 text-center text-xs text-muted/40">
            Hecho con fines educativos — Proyecto final de Inteligencia
            Artificial
          </p>
        )}
      </main>
    </div>
  );
}
