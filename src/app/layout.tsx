import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../providers/Providers";

export const metadata: Metadata = {
  title: "ReeTrack Enterprise",
  description: "Manage your subscriptions and payments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
