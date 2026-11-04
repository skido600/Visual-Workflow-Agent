import type { Metadata } from "next";
import AppShell from "../../component/AppShell";
import { ReactQueryProvider } from "../context/TansackQuery";

export const metadata: Metadata = {
  title: "AppName",
  description: "Search and history",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <AppShell>{children}</AppShell>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
