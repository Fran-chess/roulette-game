import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dar Salud",
  description: "Juego interactivo de DarSalud",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gradientBackground =
    "bg-gradient-to-br from-[#00A9B7] via-[#007FAFB0] to-[#00529B]";
  const textOnDarkBase = "text-white"; // Color de texto base si quieres que todo herede blanco
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Ruleta de juego interactiva" />
      </head>
      <body className={`${gradientBackground} ${textOnDarkBase} min-h-screen flex flex-col font-sans`}>{children}</body>
    </html>
  );
}
