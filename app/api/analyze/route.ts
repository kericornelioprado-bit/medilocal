import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const SYSTEM_PROMPT = `Eres un asistente que ayuda a personas sin formación médica a entender sus
documentos de salud. Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON
con esta forma exacta. La rama del objeto depende de tipo_documento.

{
  "tipo_documento": "laboratorio" | "receta" | "otro",
  "titulo": string,
  "resumen": string,
  "confianza": "alta" | "media" | "baja",

  "estudios": [
    {
      "nombre": string,
      "valor": string,
      "unidad": string,
      "rango_referencia": string,
      "estado": "normal" | "bajo" | "alto" | "desconocido",
      "que_significa": string
    }
  ],

  "medicamentos": [
    {
      "nombre": string,
      "para_que": string,
      "como_tomar": string,
      "duracion": string,
      "nota": string
    }
  ],
  "indicaciones_adicionales": [string],

  "descargo": "Esta información es orientativa y no sustituye la valoración de un profesional de la salud."
}

REGLAS ESTRICTAS:
1. Clasifica primero tipo_documento:
   - Si hay valores numéricos con rangos de referencia → "laboratorio".
   - Si hay nombres de fármacos con posología (dosis, frecuencia) → "receta".
   - Si no es claramente ninguno → "otro".

2. Para "laboratorio":
   - "estudios" con TODOS los parámetros que aparezcan en la imagen.
   - "estado" solo si el rango de referencia aparece en la imagen o es un estándar médico establecido. Si no, usa "desconocido".
   - "que_significa": 1 frase breve en español explicando qué mide ese parámetro. Si no estás seguro, "Parámetro de laboratorio".
   - Para "receta": estudios y medicamentos van vacíos [].

3. Para "receta":
   - NO uses estados normal/alto/bajo. NO hay tabla de valores.
   - "medicamentos" con cada fármaco detectado.
   - "para_que": uso general en lenguaje claro. Si no hay certeza, pon EXACTAMENTE "No especificado".
   - "como_tomar": dosis y frecuencia tal como aparecen en la receta.
   - "duracion": duración del tratamiento o "No especificado".
   - "nota": precaución breve si la hay, o "" si no.
   - "indicaciones_adicionales": frases extra como "Cita de seguimiento en 2 meses" o [].
   - Para "laboratorio": medicamentos e indicaciones van vacíos [].

4. Para "otro":
   - estudios [], medicamentos [], indicaciones_adicionales [].
   - "titulo": "Documento no médico".
   - "resumen" explica qué se ve y sugiere subir un estudio o receta.

5. GENERAL:
   - "titulo": nombre descriptivo corto, como "Biometría hemática" o "Receta — Dermatología".
   - "resumen": 2-4 frases en español claro, sin diagnosticar ni alarmar.
   - "descargo" siempre con el texto exacto de arriba.
   - NUNCA recomiendes medicamentos, dosis ni cambios de tratamiento.
   - Si no puedes leer algo con claridad, indícalo con "No especificado" o "desconocido".
   - No inventes rangos de referencia que no aparezcan.`;

function cleanJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "No se recibió ninguna imagen." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Formato de imagen no soportado. Usa JPEG, PNG o WebP." },
        { status: 400 }
      );
    }

    const sizeInBytes = Math.ceil((imageBase64.length * 3) / 4);
    if (sizeInBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande. Máximo 5 MB." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Error de configuración del servidor." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                data: imageBase64,
                mimeType,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJsonFences(text));
    } catch {
      return NextResponse.json(
        {
          error: "No se pudo interpretar la respuesta del modelo. Intenta de nuevo.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error(
      "Error en analyze:",
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );

    const err = error as Record<string, unknown>;
    const message = String(err.message ?? err.statusText ?? "");
    const status = Number(err.status ?? err.code ?? 0);

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "Límite de uso alcanzado. Espera unos minutos e inténtalo de nuevo.",
        },
        { status: 429 }
      );
    }

    if (message.toLowerCase().includes("api key") || status === 403) {
      return NextResponse.json(
        { error: "Error de autenticación con el servicio de IA." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: message || "Error interno. Intenta de nuevo más tarde." },
      { status: 500 }
    );
  }
}
