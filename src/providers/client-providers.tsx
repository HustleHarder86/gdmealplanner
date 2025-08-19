"use client";

import { RecipeProvider } from "@/src/providers/recipe-provider";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { SidebarProvider } from "@/src/contexts/SidebarContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <RecipeProvider>
          {children}
        </RecipeProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}