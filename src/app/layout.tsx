import type { Metadata, Viewport } from "next";
import "./globals.css";
// Temporarily disabled to fix roulette size issue
// import "./tablet-responsive.css";
// import "./tablet-fix.css";
import ShellRootClient from "@/components/layout/ShellRootClient";
import ReactQueryProvider from "@/lib/providers/ReactQueryProvider";

// [modificación] Configuración de viewport separada según Next.js 15
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e40af",
};

// [modificación] Configuración PWA y metadatos optimizados (sin viewport y themeColor)
export const metadata: Metadata = {
  title: "DarSalud - Juego Interactivo",
  description: "Juego interactivo de DarSalud para tablets y TV con sincronización en tiempo real",
  manifest: "/manifest.json",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full overflow-hidden">
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
      <body className="bg-main-gradient h-screen font-sans text-white">
        <ReactQueryProvider>
          <ShellRootClient>{children}</ShellRootClient>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
