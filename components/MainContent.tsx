"use client";

import { useSidebar } from "@/src/contexts/SidebarContext";

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isExpanded } = useSidebar();

  return (
    <main 
      className={`transition-all duration-300 ease-in-out ${
        isExpanded ? "lg:ml-64" : "lg:ml-16"
      }`}
    >
      <div className="pt-16 lg:pt-0">
        {children}
      </div>
      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="container py-8">
          <p className="text-center text-sm text-neutral-600">
            © 2025 Pregnancy Plate Planner. Always consult your healthcare
            provider.
          </p>
        </div>
      </footer>
    </main>
  );
}