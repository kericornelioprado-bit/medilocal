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

const tipoDocMeta: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  laboratorio: {
    label: "Estudio de laboratorio",
    icon: "chart",
    color: "primary",
  },
  receta: {
    label: "Receta médica",
    icon: "pill",
    color: "ok",
  },
  otro: {
    label: "Documento no médico",
    icon: "doc",
    color: "warn",
  },
};

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

function TipoIcon({ tipo }: { tipo: string }) {
  const meta = tipoDocMeta[tipo];
  if (!meta) return null;

  const colorClass =
    meta.color === "primary"
      ? "bg-primary/10 text-primary"
      : meta.color === "ok"
        ? "bg-ok/10 text-ok"
        : "bg-warn/10 text-warn";

  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
      {tipo === "laboratorio" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )}
      {tipo === "receta" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )}
      {tipo === "otro" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )}
    </div>
  );
}

function StepsSection() {
  const steps = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
      title: "Sube tu documento",
      desc: "Toma una foto clara de tu estudio de laboratorio o receta médica.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      ),
      title: "La IA lo analiza",
      desc: "Visión artificial extrae los datos y el NLP genera una explicación en español.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      ),
      title: "Entiende tus resultados",
      desc: "Recibe un resumen claro, con alertas si algo está fuera de rango.",
    },
  ];

  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-3">
      {steps.map((s, i) => (
        <div
          key={i}
          className="group rounded-2xl border border-border bg-surface p-5 card-hover"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-[var(--primary-soft)] p-2.5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20">
              {s.icon}
            </div>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-xs font-bold text-muted">
              {i + 1}
            </span>
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
  const [copied, setCopied] = useState(false);

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
          const reader2 = new FileReader();
          reader2.onload = (e) => resolve(e.target?.result as string);
          reader2.readAsDataURL(file);
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
    setCopied(false);
    selectedFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyResults = async () => {
    if (!result) return;
    let text = `${result.titulo}\n\n${result.resumen}\n`;
    if (result.estudios) {
      text += "\nEstudios:\n";
      result.estudios.forEach((e) => {
        text += `- ${e.nombre}: ${e.valor} ${e.unidad} (${e.estado === "normal" ? "Normal" : e.estado === "alto" ? "Alto" : e.estado === "bajo" ? "Bajo" : "Sin rango"})\n`;
      });
    }
    if (result.medicamentos) {
      text += "\nMedicamentos:\n";
      result.medicamentos.forEach((m) => {
        text += `- ${m.nombre}: ${m.como_tomar}` + (m.duracion !== "No especificado" ? ` (${m.duracion})` : "") + "\n";
      });
    }
    text += `\n${result.descargo}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const showIdleUI = state === "idle" || state === "error";

  return (
    <div className="flex flex-col flex-1 items-center">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, var(--primary-glow) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, var(--primary-glow) 0%, transparent 60%)",
        }}
      />

      <main className="w-full max-w-[720px] px-4 py-8 sm:py-14">
        {showIdleUI && (
          <div className="mb-10 text-center animate-fade-in">
            <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 motion-safe:animate-[float_4s_ease-in-out_infinite]">
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
              <div className="absolute -inset-1 rounded-2xl bg-primary/20 motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]" />
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

        <div
          className={`mb-6 flex items-start gap-2.5 rounded-xl border border-border/60 glass-card px-4 py-3 text-sm text-muted transition-all duration-500 ${
            showIdleUI ? "animate-slide-down" : ""
          }`}
        >
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
            Esta herramienta es informativa y <strong>NO sustituye</strong> la consulta con un profesional de la salud.
          </span>
        </div>

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
                ? "scale-[1.01] border-primary bg-primary/5 shadow-xl shadow-primary/10"
                : preview
                  ? "border-primary/40 bg-surface"
                  : "border-border/60 bg-surface/60 hover:border-primary/30 hover:bg-surface"
            }`}
          >
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
                <div className="relative">
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="max-h-52 rounded-xl object-contain shadow-lg transition-transform group-hover:scale-[1.02]"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ok text-white shadow-md">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
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

        {state === "loading" && <PhaseLoader />}

        {state === "error" && (
          <div className="mt-6 animate-scale-in rounded-2xl border border-alert/20 bg-alert/5 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-alert/10">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-alert/10 px-4 py-2 text-sm font-medium text-alert transition hover:bg-alert/20 focus:outline-none focus:ring-2 focus:ring-alert focus:ring-offset-2"
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

        {state === "success" && result && (
          <div className="mt-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-4 rounded-2xl border border-border glass-card p-4">
              {preview && (
                <img
                  src={preview}
                  alt="Documento analizado"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <TipoIcon tipo={result.tipo_documento} />
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {tipoDocMeta[result.tipo_documento]?.label ??
                      result.tipo_documento}
                  </p>
                </div>
                <h2 className="font-display text-lg font-semibold text-ink truncate">
                  {result.titulo}
                </h2>
                <div className="mt-2">
                  {chipConfianza(result.confianza)}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={reset}
                  className="rounded-lg bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Nuevo análisis
                </button>
                <button
                  onClick={copyResults}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    copied
                      ? "border-ok/30 bg-ok/5 text-ok"
                      : "border-border bg-surface text-muted hover:border-primary/20 hover:text-ink"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0a.75.75 0 011.5 0v0a.75.75 0 01-.75.75H14.25h.008a.75.75 0 01-.75-.75v0m0 0H9.75m0 0H8.25" />
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 animate-slide-up">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/70 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Resumen
              </h3>
              <p className="text-sm leading-relaxed text-ink">
                {result.resumen}
              </p>
            </div>

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

            <p className="text-center text-xs text-muted/50 italic">
              {result.descargo}
            </p>
          </div>
        )}

        {state === "idle" && <StepsSection />}

        {historyLoaded && history.length > 0 && state === "idle" && (
          <div className="mt-12 animate-fade-in">
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
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left card-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <img
                    src={entry.preview}
                    alt="Miniatura"
                    className="h-12 w-12 shrink-0 rounded-lg object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TipoIcon tipo={entry.result.tipo_documento} />
                      <p className="text-sm font-medium text-ink truncate">
                        {entry.result.titulo}
                      </p>
                    </div>
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