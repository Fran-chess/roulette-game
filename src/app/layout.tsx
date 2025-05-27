import type { Metadata } from "next";
import "./globals.css";
import ShellRootClient from "@/components/layout/ShellRootClient";

// [modificación] Configuración PWA y metadatos optimizados
export const metadata: Metadata = {
  title: "DarSalud - Juego Interactivo",
  description: "Juego interactivo de DarSalud para tablets y TV con sincronización en tiempo real",
  manifest: "/manifest.json",
  themeColor: "#1e40af",
  applicationName: "DarSalud",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DarSalud",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
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
        {/* [modificación] Metadatos PWA adicionales */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        {/* [modificación] Link al manifest para PWA */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-main-gradient h-screen overflow-hidden flex flex-col font-sans text-white">
        <ShellRootClient>{children}</ShellRootClient>
      </body>
    </html>
  );
}
