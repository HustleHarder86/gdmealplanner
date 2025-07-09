"use client";

import { RecipeProvider } from "@/src/providers/recipe-provider";
import { AuthProvider } from "@/src/contexts/AuthContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RecipeProvider>
        {children}
      </RecipeProvider>
    </AuthProvider>
  );
}