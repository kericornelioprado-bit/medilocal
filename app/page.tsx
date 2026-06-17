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
    alta: { dot: "bg-ok", label: "Confianza alta" },
    media: { dot: "bg-warn", label: "Confianza media" },
    baja: { dot: "bg-alert", label: "Confianza baja" },
  };
  const c = config[confianza];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-ink">
      <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
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

  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="w-full max-w-[720px] px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            MediClaro
          </h1>
          <p className="mt-2 text-muted max-w-md mx-auto">
            Sube una foto de tu estudio de laboratorio o receta y recibe una
            explicación clara en español.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-muted">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-muted"
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

        {/* Dropzone / Input */}
        {state !== "success" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragging
                ? "border-primary bg-[var(--primary-soft)]"
                : "border-border bg-surface"
            }`}
          >
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
              <div className="flex flex-col items-center gap-3">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="max-h-48 rounded-lg object-contain shadow-md"
                />
                <p className="text-sm text-muted">{fileName}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="text-xs text-muted underline hover:text-ink transition-colors"
                >
                  Elegir otra imagen
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="h-10 w-10 text-muted"
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
                <p className="text-sm text-muted">
                  Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted/70">
                  JPEG, PNG o WebP. Máximo 5 MB.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analyze button / Loader */}
        {state === "loading" && <PhaseLoader />}

        {state !== "success" && state !== "loading" && (
          <div className="mt-4 flex flex-col items-center">
            <button
              onClick={handleAnalyze}
              disabled={!preview}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Analizar documento
            </button>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="mt-6 rounded-xl border border-[var(--alert)]/30 bg-[var(--alert)]/5 p-4 text-center">
            <p className="text-sm text-ink">{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-3 text-sm font-medium text-primary underline hover:opacity-80 transition-opacity"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Success: Results */}
        {state === "success" && result && (
          <div
            className="mt-6 space-y-6 motion-safe:animate-[fadeIn_350ms_ease-out]"
            style={
              {
                "--tw-enter-opacity": "0",
                "--tw-enter-translate-y": "8px",
              } as React.CSSProperties
            }
          >
            {/* Result header: common to all types */}
            <div className="flex items-center gap-4">
              {preview && (
                <img
                  src={preview}
                  alt="Documento analizado"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover shadow-sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted mb-0.5">
                  {tipoDocLabel[result.tipo_documento] ?? result.tipo_documento}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink truncate">
                  {result.titulo}
                </h2>
                <div className="mt-1">{chipConfianza(result.confianza)}</div>
              </div>
              <button
                onClick={reset}
                className="shrink-0 text-sm font-medium text-primary underline hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Nuevo análisis
              </button>
            </div>

            {/* Resumen */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="text-xs uppercase tracking-wider text-muted mb-2">
                Resumen
              </h3>
              <p className="text-sm leading-relaxed text-ink">
                {result.resumen}
              </p>
            </div>

            {/* Type-specific results */}
            {result.tipo_documento === "laboratorio" &&
              result.estudios &&
              result.estudios.length > 0 && (
                <ResultadoLaboratorio estudios={result.estudios} />
              )}

            {result.tipo_documento === "receta" &&
              result.medicamentos &&
              result.medicamentos.length > 0 && (
                <ResultadoReceta
                  medicamentos={result.medicamentos}
                  indicaciones={result.indicaciones_adicionales ?? []}
                  confianza={result.confianza}
                />
              )}

            {result.tipo_documento === "otro" && (
              <ResultadoOtro resumen={result.resumen} onReset={reset} />
            )}

            {/* Descargo */}
            <p className="text-xs text-muted italic px-1">{result.descargo}</p>
          </div>
        )}

        {/* History */}
        {historyLoaded && history.length > 0 && state === "idle" && (
          <div className="mt-12">
            <h2 className="text-xs uppercase tracking-wider text-muted mb-3">
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
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <img
                    src={entry.preview}
                    alt="Miniatura"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {entry.result.titulo}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(entry.timestamp).toLocaleString("es")}
                    </p>
                  </div>
                  {chipConfianza(entry.result.confianza)}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
