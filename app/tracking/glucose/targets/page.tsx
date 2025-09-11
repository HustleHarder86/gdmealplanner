"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import GlucoseTargetsSettings from "@/src/components/glucose/GlucoseTargetsSettings";

export default function GlucoseTargetsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      {/* Header with Navigation */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/tracking/glucose")}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-4"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Glucose Tracking
        </button>
        
        <h1 className="text-2xl sm:text-3xl font-bold">Glucose Target Settings</h1>
        <p className="text-neutral-600 mt-1">
          Customize your glucose targets based on your doctor's recommendations
        </p>
      </div>

      {/* Settings Component */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6">
          <GlucoseTargetsSettings
            onTargetsUpdated={(targets) => {
              console.log("Targets updated:", targets);
              // Could show a success message or refresh other components
            }}
          />
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 space-y-6">
        
        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How Personalized Targets Work</h2>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <p>Your default targets follow standard gestational diabetes guidelines (fasting &lt;95 mg/dL, 2hr post-meal &lt;120 mg/dL)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <p>If your doctor recommends different targets, you can customize them here (e.g., stricter post-lunch targets)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <p>Your reports and statistics will automatically use your personalized targets for accurate assessments</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
              <p>Use bulk edit to quickly set all breakfast, lunch, or dinner targets to the same value</p>
            </div>
          </div>
        </div>

        {/* Common Scenarios */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">Common Personalization Scenarios</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-green-800">Stricter Morning Control</h3>
                <p className="text-sm text-green-700">Doctor recommends fasting &lt;90 mg/dL instead of &lt;95 mg/dL</p>
              </div>
              <div>
                <h3 className="font-medium text-green-800">Lunch-Specific Targets</h3>
                <p className="text-sm text-green-700">Different post-lunch targets due to work schedule or meal timing</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-green-800">Unit Preferences</h3>
                <p className="text-sm text-green-700">Switch between mg/dL (US) and mmol/L (Canada/International) as needed</p>
              </div>
              <div>
                <h3 className="font-medium text-green-800">Pregnancy Progression</h3>
                <p className="text-sm text-green-700">Targets may become stricter as pregnancy progresses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-3">Safety Guidelines</h2>
          <div className="space-y-2 text-amber-800">
            <p className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">⚠️</span>
              <span>Only modify targets based on your healthcare provider's explicit recommendations</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">⚠️</span>
              <span>The system will warn you if targets seem outside safe medical ranges</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">⚠️</span>
              <span>When in doubt, use the default targets which follow established medical guidelines</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">⚠️</span>
              <span>Always consult your healthcare provider before making significant changes</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}