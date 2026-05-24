import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mad Libs for Adults",
  description: "Group-chat mad libs, but spicier. Claude writes; you fill in the blanks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="paper min-h-screen">{children}</body>
    </html>
  );
}
