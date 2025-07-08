import { NextResponse } from "next/server";

export async function GET() {
  const firebaseAdminKey = process.env.FIREBASE_ADMIN_KEY;

  if (!firebaseAdminKey) {
    return NextResponse.json({ error: "FIREBASE_ADMIN_KEY not found" });
  }

  // Check the first and last characters
  const firstChar = firebaseAdminKey[0];
  const lastChar = firebaseAdminKey[firebaseAdminKey.length - 1];
  const first50 = firebaseAdminKey.substring(0, 50);
  const last50 = firebaseAdminKey.substring(firebaseAdminKey.length - 50);

  // Try to parse it
  let parseError = null;
  let parsed = null;
  try {
    parsed = JSON.parse(firebaseAdminKey);
  } catch (e) {
    parseError = e instanceof Error ? e.message : "Unknown error";
  }

  // Check if it needs cleaning
  let cleanedFirstChar = null;
  let cleanedLastChar = null;
  let cleanedParseError = null;
  let cleanedParsed = null;

  let cleaned = firebaseAdminKey.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
    cleanedFirstChar = cleaned[0];
    cleanedLastChar = cleaned[cleaned.length - 1];

    try {
      cleanedParsed = JSON.parse(cleaned);
    } catch (e) {
      cleanedParseError = e instanceof Error ? e.message : "Unknown error";
    }
  }

  return NextResponse.json({
    original: {
      length: firebaseAdminKey.length,
      firstChar,
      lastChar,
      first50: first50.replace(/\n/g, "\\n"),
      last50: last50.replace(/\n/g, "\\n"),
      parseError,
      parsedSuccessfully: !!parsed,
    },
    cleaned:
      cleaned !== firebaseAdminKey
        ? {
            length: cleaned.length,
            firstChar: cleanedFirstChar,
            lastChar: cleanedLastChar,
            parseError: cleanedParseError,
            parsedSuccessfully: !!cleanedParsed,
          }
        : null,
  });
}
