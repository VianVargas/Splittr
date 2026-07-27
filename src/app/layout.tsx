import type { Metadata } from "next";
import "./globals.css";
import favicon from "@/asset/img/Splittr Logo.png";

export const metadata: Metadata = {
  title: "Splittr",
  description: "Split bills on Stellar Testnet",
  icons: [{ rel: "icon", url: favicon.src }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
