import { NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";

// Spoonacular image CDN patterns
const SPOONACULAR_CDN = "https://spoonacular.com/recipeImages/";

function fixSpoonacularImageUrl(
  imageUrl: string | undefined,
  recipeId: string,
): string | undefined {
  if (!imageUrl) return undefined;

  // If it's already a working URL, keep it
  if (imageUrl.startsWith("https://") || imageUrl.startsWith("http://")) {
    return imageUrl;
  }

  // Extract Spoonacular ID from our recipe ID
  const spoonacularId = recipeId.replace("spoonacular-", "");

  // Common Spoonacular image patterns
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  // Try to construct a valid CDN URL
  for (const ext of imageExtensions) {
    if (imageUrl.includes(ext)) {
      // If it's just a filename, prepend the CDN URL
      if (!imageUrl.includes("/")) {
        return `${SPOONACULAR_CDN}${imageUrl}`;
      }
      // If it's a partial path, try to fix it
      if (imageUrl.includes("recipeImages/")) {
        return `https://spoonacular.com/${imageUrl}`;
      }
    }
  }

  // Default pattern for Spoonacular recipes
  return `${SPOONACULAR_CDN}${spoonacularId}-556x370.jpg`;
}

export async function POST() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();

    console.log("Starting image URL fix for Spoonacular recipes...");

    // Get all Spoonacular recipes
    const snapshot = await db
      .collection("recipes")
      .where("__name__", ">=", "spoonacular-")
      .where("__name__", "<", "spoonacular-\uf8ff")
      .get();

    console.log(`Found ${snapshot.size} Spoonacular recipes to check`);

    let fixedCount = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const currentImageUrl = data.imageUrl;
      const fixedImageUrl = fixSpoonacularImageUrl(currentImageUrl, doc.id);

      // Only update if the URL changed
      if (fixedImageUrl && fixedImageUrl !== currentImageUrl) {
        batch.update(doc.ref, { imageUrl: fixedImageUrl });
        fixedCount++;
        console.log(
          `Fixed image for ${doc.id}: ${currentImageUrl} -> ${fixedImageUrl}`,
        );
      }
    });

    if (fixedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} image URLs`,
      totalChecked: snapshot.size,
      fixed: fixedCount,
    });
  } catch (error) {
    console.error("Error fixing image URLs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix image URLs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to preview what would be fixed
export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();

    // Get a sample of recipes with potentially broken images
    const snapshot = await db
      .collection("recipes")
      .where("__name__", ">=", "spoonacular-")
      .where("__name__", "<", "spoonacular-\uf8ff")
      .limit(20)
      .get();

    const preview = snapshot.docs.map((doc) => {
      const data = doc.data();
      const currentImageUrl = data.imageUrl;
      const fixedImageUrl = fixSpoonacularImageUrl(currentImageUrl, doc.id);

      return {
        id: doc.id,
        title: data.title,
        currentImageUrl,
        fixedImageUrl,
        needsFix: fixedImageUrl !== currentImageUrl,
      };
    });

    const needsFixCount = preview.filter((p) => p.needsFix).length;

    return NextResponse.json({
      preview,
      sampleSize: preview.length,
      needsFixCount,
      message: `${needsFixCount} out of ${preview.length} sampled recipes may have broken images`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to preview image fixes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
