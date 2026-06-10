import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talking Dev Playground",
  description: "A structured playground for Talking Dev AI experiments.",
};

function shouldSuppressHtmlHydrationWarning() {
  return process.env.NEXT_PUBLIC_SUPPRESS_HTML_HYDRATION_WARNING === "true";
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning={shouldSuppressHtmlHydrationWarning()}>
      <body>{children}</body>
    </html>
  );
}
