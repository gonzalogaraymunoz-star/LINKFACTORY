import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINK Factory",
  description: "Biblioteca viva de productos gráficos, links, negocios y memoria.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="es"><body>{children}</body></html>;
}
