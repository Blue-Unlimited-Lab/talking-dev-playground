import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talking Dev Playground",
  description: "A structured playground for Talking Dev AI experiments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
