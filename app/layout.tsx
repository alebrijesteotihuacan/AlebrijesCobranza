import type { Metadata } from "next";
import { Inter, Bebas_Neue, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { themeScript } from "@/components/theme-toggle";
import { ServiceWorkerRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alebrijes Cobranza",
  description: "Sistema de cobranza mensual por WhatsApp para Club Alebrijes Oaxaca — Fuerzas Básicas Teotihuacán",
  manifest: "/manifest.json",
  themeColor: "#F47920",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alebrijes",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${inter.variable} ${bebasNeue.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply theme before paint to avoid FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* PWA theme color for mobile browsers */}
        <meta name="theme-color" content="#F47920" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/assets/alebrijes-escudo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/alebrijes-escudo.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          <ServiceWorkerRegister />
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
