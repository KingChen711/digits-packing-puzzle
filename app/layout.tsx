import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Digits Packing Puzzle",
    template: "%s | Digits Packing Puzzle",
  },
  description:
    "Interactive puzzle game where you arrange 7-segment display pieces on a board.",
  applicationName: "Digits Packing Puzzle",
  metadataBase: new URL("http://digits-packing-puzzle.vercel.app"),
  keywords: [
    "puzzle",
    "logic puzzle",
    "seven-segment",
    "7-segment",
    "digits",
    "packing puzzle",
    "brain teaser",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "Digits Packing Puzzle",
    description:
      "Arrange 7-segment digit pieces on a board to solve challenges.",
    siteName: "Digits Packing Puzzle",
  },
  twitter: {
    card: "summary",
    title: "Digits Packing Puzzle",
    description:
      "Arrange 7-segment digit pieces on a board to solve challenges.",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
