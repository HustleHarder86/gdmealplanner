import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarNavigation from "@/components/SidebarNavigation";
import MainContent from "@/components/MainContent";
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
          <div className="min-h-screen">
            <SidebarNavigation />
            <MainContent>
              {children}
            </MainContent>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
