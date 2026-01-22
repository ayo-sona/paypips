import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
// import { OrganizationProvider } from "../contexts/OrganizationContext";

export const metadata: Metadata = {
  title: "Willow Enterprise",
  description: "Manage your subscriptions and payments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {/* <OrganizationProvider> */}
        <QueryProvider>{children}</QueryProvider>
        {/* </OrganizationProvider> */}
      </body>
    </html>
  );
}
