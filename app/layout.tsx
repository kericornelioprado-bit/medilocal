import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediClaro — Entiende tus estudios médicos",
  description:
    "Sube una foto de tu estudio de laboratorio o receta y recibe una explicación clara en español. Herramienta informativa con inteligencia artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bricolageGrotesque.variable} ${inter.variable} h-full antialiased font-body`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
