import type { Metadata } from "next";
import "./globals.css";
import ShellRootClient from "@/components/layout/ShellRootClient";

export const metadata: Metadata = {
  title: "Dar Salud",
  description: "Juego interactivo de DarSalud",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="overflow-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-main-gradient h-screen overflow-hidden flex flex-col font-sans text-white">
        <ShellRootClient>{children}</ShellRootClient>
      </body>
    </html>
  );
}
