import Sidebar from './Sidebar'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <div className="flex min-h-screen bg-[#fcf8f8]">
        <Sidebar />

        <div className="ml-[250px] w-full">
          {children}
        </div>
      </div>
    </body>
  </html>
)
}