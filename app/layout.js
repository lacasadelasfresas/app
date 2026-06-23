import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthLayout from './AuthLayout'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "La Casa de las Fresas",
  description: "Dashboard - Centro de Mando",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthLayout>
          {children}
        </AuthLayout>
      </body>
    </html>
  );
}