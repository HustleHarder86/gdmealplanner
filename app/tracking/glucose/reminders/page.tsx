"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";

export default function GlucoseRemindersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-neutral-600">
            Checking authentication...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/tracking/glucose")}
            className="text-neutral-600 hover:text-neutral-800"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold">Glucose Reminders</h1>
            <p className="text-neutral-600 mt-1">
              Set reminders for blood glucose checks
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-lg p-8 shadow-sm text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-neutral-600 max-w-md mx-auto">
          The reminder feature will help you stay on track with regular glucose
          monitoring. You&apos;ll be able to set custom reminders for fasting
          readings, post-meal checks, and more.
        </p>
      </div>
    </div>
  );
}