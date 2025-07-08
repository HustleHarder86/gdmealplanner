"use client";

import { useEffect, useState } from "react";
import { auth } from "@/src/lib/firebase/client";

export default function DebugFirebasePage() {
  const [config, setConfig] = useState<any>({});
  const [authStatus, setAuthStatus] = useState<string>("Checking...");

  useEffect(() => {
    // Get Firebase config (safely)
    const app = auth.app;
    const options = app.options;
    
    setConfig({
      apiKey: options.apiKey ? "✓ Set" : "✗ Missing",
      authDomain: options.authDomain || "✗ Missing",
      projectId: options.projectId || "✗ Missing",
      storageBucket: options.storageBucket || "✗ Missing",
      messagingSenderId: options.messagingSenderId ? "✓ Set" : "✗ Missing",
      appId: options.appId ? "✓ Set" : "✗ Missing",
    });

    // Test auth
    try {
      setAuthStatus("Auth initialized: " + (auth ? "✓" : "✗"));
    } catch (error: any) {
      setAuthStatus("Auth error: " + error.message);
    }
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Debug Info</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Configuration Status:</h2>
        <pre className="text-sm">{JSON.stringify(config, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold mb-2">Auth Status:</h2>
        <p>{authStatus}</p>
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Important:</h2>
        <p className="text-sm">If authDomain shows as missing or incorrect, password reset won't work.</p>
        <p className="text-sm mt-2">The authDomain should be: [your-project-id].firebaseapp.com</p>
      </div>
    </div>
  );
}