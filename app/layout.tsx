import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportEvent",
  description: "A foundation for local cricket tournament management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
