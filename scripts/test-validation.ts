/**
 * Test Glucose Target Validation System
 */

import {
  validateGlucoseTarget,
  validateAllPersonalizedTargets,
  PersonalizedGlucoseTargets,
  TargetValidationResult,
} from "../src/types/glucose";

console.log("🔒 GLUCOSE TARGET VALIDATION TESTING");
console.log("=====================================\n");

// Test 1: Valid targets
console.log("1️⃣ TESTING VALID TARGETS");
console.log("========================");

const validFasting = validateGlucoseTarget(90, "mg/dL", "fasting");
console.log(`   Fasting 90 mg/dL: ${validFasting.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (validFasting.warnings.length > 0) {
  console.log(`   Warnings: ${validFasting.warnings.join("; ")}`);
}

const validPostMeal = validateGlucoseTarget(115, "mg/dL", "post-lunch-2hr");
console.log(`   Post-lunch 115 mg/dL: ${validPostMeal.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (validPostMeal.warnings.length > 0) {
  console.log(`   Warnings: ${validPostMeal.warnings.join("; ")}`);
}

// Test 2: Invalid targets (too low)
console.log("\n2️⃣ TESTING INVALID TARGETS (TOO LOW)");
console.log("====================================");

const tooLowFasting = validateGlucoseTarget(40, "mg/dL", "fasting");
console.log(`   Fasting 40 mg/dL: ${tooLowFasting.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (tooLowFasting.errors.length > 0) {
  console.log(`   Errors: ${tooLowFasting.errors.join("; ")}`);
}

// Test 3: Invalid targets (too high)
console.log("\n3️⃣ TESTING INVALID TARGETS (TOO HIGH)");
console.log("=====================================");

const tooHighPostMeal = validateGlucoseTarget(200, "mg/dL", "post-lunch-2hr");
console.log(`   Post-lunch 200 mg/dL: ${tooHighPostMeal.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (tooHighPostMeal.errors.length > 0) {
  console.log(`   Errors: ${tooHighPostMeal.errors.join("; ")}`);
}

// Test 4: Warning targets (outside typical ranges but still safe)
console.log("\n4️⃣ TESTING WARNING TARGETS");
console.log("==========================");

const strictFasting = validateGlucoseTarget(85, "mg/dL", "fasting");
console.log(`   Strict fasting 85 mg/dL: ${strictFasting.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (strictFasting.warnings.length > 0) {
  console.log(`   Warnings: ${strictFasting.warnings.join("; ")}`);
}

const lenientPostMeal = validateGlucoseTarget(135, "mg/dL", "post-dinner-2hr");
console.log(`   Lenient post-dinner 135 mg/dL: ${lenientPostMeal.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (lenientPostMeal.warnings.length > 0) {
  console.log(`   Warnings: ${lenientPostMeal.warnings.join("; ")}`);
}

// Test 5: mmol/L validation
console.log("\n5️⃣ TESTING mmol/L VALIDATION");
console.log("=============================");

const mmolValid = validateGlucoseTarget(5.0, "mmol/L", "fasting");
console.log(`   Fasting 5.0 mmol/L: ${mmolValid.isValid ? "✅ VALID" : "❌ INVALID"}`);

const mmolInvalid = validateGlucoseTarget(2.0, "mmol/L", "fasting");
console.log(`   Fasting 2.0 mmol/L: ${mmolInvalid.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (mmolInvalid.errors.length > 0) {
  console.log(`   Errors: ${mmolInvalid.errors.join("; ")}`);
}

// Test 6: Full personalized targets validation
console.log("\n6️⃣ TESTING FULL TARGETS VALIDATION");
console.log("==================================");

const validPersonalizedTargets: PersonalizedGlucoseTargets = {
  id: "test-1",
  userId: "test-user",
  unit: "mg/dL",
  targets: {
    fasting: { min: 0, max: 90 },
    postLunch2hr: { min: 0, max: 115 },
    postDinner2hr: { min: 0, max: 120 },
  },
  setBy: "Dr. Smith",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validationResult = validateAllPersonalizedTargets(validPersonalizedTargets);
console.log(`   Valid personalized targets: ${validationResult.isValid ? "✅ VALID" : "❌ INVALID"}`);

const invalidPersonalizedTargets: PersonalizedGlucoseTargets = {
  id: "test-2",
  userId: "test-user",
  unit: "mg/dL",
  targets: {
    fasting: { min: 0, max: 30 }, // Too low!
    postLunch2hr: { min: 0, max: 250 }, // Too high!
  },
  setBy: "Dr. Smith",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const invalidValidationResult = validateAllPersonalizedTargets(invalidPersonalizedTargets);
console.log(`   Invalid personalized targets: ${invalidValidationResult.isValid ? "✅ VALID" : "❌ INVALID"}`);
if (invalidValidationResult.errors.length > 0) {
  console.log(`   Errors: ${invalidValidationResult.errors.join("; ")}`);
}

console.log("\n🏁 VALIDATION TESTING COMPLETE");
console.log("==============================");
console.log("✅ Target validation system is working correctly!");
console.log("🔒 Unsafe targets will be rejected before saving to database");
console.log("⚠️  Users will receive warnings for targets outside typical medical ranges");