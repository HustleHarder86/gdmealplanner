import { NextResponse } from "next/server";

export async function GET() {
  const privateKey = process.env.private_key || "";
  
  // Safely check private key format without exposing it
  const diagnostics = {
    privateKey: {
      exists: !!privateKey,
      length: privateKey.length,
      startsWithBegin: privateKey.includes("-----BEGIN"),
      endsWithEnd: privateKey.includes("-----END"),
      hasNewlines: privateKey.includes('\n'),
      hasEscapedNewlines: privateKey.includes('\\n'),
      hasLiteralBackslashN: privateKey.includes('\\\\n'),
      firstChars: privateKey.substring(0, 10).replace(/[A-Za-z0-9]/g, 'X'),
      lastChars: privateKey.substring(privateKey.length - 10).replace(/[A-Za-z0-9]/g, 'X'),
      lineCount: privateKey.split(/\\n|\n/).length,
    },
    otherVars: {
      hasProjectId: !!process.env.project_id,
      hasClientEmail: !!process.env.client_email,
      projectId: process.env.project_id,
      clientEmail: process.env.client_email,
    },
    recommendations: [] as string[],
  };

  // Add recommendations based on diagnostics
  if (!diagnostics.privateKey.hasNewlines && diagnostics.privateKey.hasEscapedNewlines) {
    diagnostics.recommendations.push("Private key has escaped newlines (\\n) but no actual newlines. This needs to be fixed.");
  }
  
  if (!diagnostics.privateKey.startsWithBegin) {
    diagnostics.recommendations.push("Private key should start with '-----BEGIN PRIVATE KEY-----'");
  }
  
  if (!diagnostics.privateKey.endsWithEnd) {
    diagnostics.recommendations.push("Private key should end with '-----END PRIVATE KEY-----'");
  }
  
  if (diagnostics.privateKey.lineCount < 20) {
    diagnostics.recommendations.push("Private key seems too short. It should have many lines (usually 25-30).");
  }

  return NextResponse.json(diagnostics);
}