import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniCRM | Unified Inbox",
  description: "Omnichannel CRM for WhatsApp and Instagram",
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
