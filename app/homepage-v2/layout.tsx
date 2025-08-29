import { Metadata } from "next";
import { Poppins, Domine, Bitter } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const domine = Domine({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-domine',
});

const bitter = Bitter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bitter',
});

export const metadata: Metadata = {
  title: "Control Gestational Diabetes with Expert Meal Plans | Pregnancy Plate Planner",
  description: "Expert-designed meal plans for gestational diabetes management. Join 10,000+ moms managing GD successfully with personalized meal plans, grocery lists, and blood sugar tracking.",
  keywords: "gestational diabetes, meal plans, pregnancy nutrition, GD management, blood sugar control, pregnancy meal planner",
  openGraph: {
    title: "Control Your Gestational Diabetes with Tailored Meal Plans",
    description: "Expert-designed meal plans created by registered dietitians to help manage blood sugar during pregnancy.",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pregnancy Plate Planner - Gestational Diabetes Meal Plans"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Control Your Gestational Diabetes with Tailored Meal Plans",
    description: "Expert-designed meal plans for managing gestational diabetes during pregnancy."
  }
};

export default function HomepageV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return a fragment with font variables to avoid layout conflicts
  return <div className={`${poppins.variable} ${domine.variable} ${bitter.variable}`}>{children}</div>;
}