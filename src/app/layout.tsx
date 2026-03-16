import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoadLab — K6 Load Testing",
  description: "Visual load testing with K6. Configure, run, and monitor your load tests from the browser.",
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
