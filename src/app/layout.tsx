import type { Metadata } from "next";
import "./globals.css";
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: "Questionnaire Builder",
  description: "Build and share questionnaires",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html >
  );
}
