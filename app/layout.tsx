import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ClientProviders } from "@/src/providers/client-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pregnancy Plate Planner - Gestational Diabetes Meal Planning",
  description:
    "Manage gestational diabetes with personalized meal plans, glucose tracking, and expert nutrition guidance for a healthy pregnancy.",
  keywords:
    "gestational diabetes, meal planning, pregnancy nutrition, glucose tracking, GD diet",
  authors: [{ name: "Pregnancy Plate Planner" }],
  openGraph: {
    title: "Pregnancy Plate Planner",
    description: "Your partner in managing gestational diabetes",
    url: "https://app.pregnancyplateplanner.com",
    siteName: "Pregnancy Plate Planner",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-50 text-neutral-900`}>
        <ClientProviders>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-white border-t border-neutral-200 mt-12">
            <div className="container py-8">
              <p className="text-center text-sm text-neutral-600">
                © 2025 Pregnancy Plate Planner. Always consult your healthcare
                provider.
              </p>
            </div>
          </footer>
        </ClientProviders>
      </body>
    </html>
  );
}
