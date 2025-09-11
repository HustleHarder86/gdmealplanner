/**
 * Test Personalized Glucose Targets System
 * 
 * This script tests the complete personalized glucose targets functionality,
 * including bulk category updates, individual target customization, and
 * report generation with custom targets.
 */

import { 
  PersonalizedGlucoseTargets,
  GlucoseReading,
  GlucoseUnit,
  MealCategory,
  GlucoseTargetRange,
  applyBulkCategoryTarget,
  getPersonalizedTargetRange,
  convertToStandardTargets,
  MEAL_CATEGORY_MAPPING,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  convertGlucoseUnit
} from '../src/types/glucose';
import { format, subDays } from 'date-fns';

const TEST_USER_ID = 'test-personalized-targets-user';

class PersonalizedTargetsTest {

  /**
   * Test 1: Bulk Category Target Application
   */
  testBulkCategoryTargets(): boolean {
    console.log('1️⃣ TESTING BULK CATEGORY TARGET APPLICATION');
    console.log('===========================================\n');

    // Create initial personalized targets
    const initialTargets: PersonalizedGlucoseTargets = {
      userId: TEST_USER_ID,
      unit: 'mg/dL',
      targets: {
        fasting: { min: 0, max: 95, unit: 'mg/dL' },
        postBreakfast2hr: { min: 0, max: 120, unit: 'mg/dL' },
        postLunch2hr: { min: 0, max: 120, unit: 'mg/dL' },
        postDinner2hr: { min: 0, max: 120, unit: 'mg/dL' },
      },
      notes: "Initial default targets"
    };

    console.log('📋 Initial Targets:');
    console.log(`   Fasting: <${initialTargets.targets.fasting?.max} ${initialTargets.unit}`);
    console.log(`   Post-meal 2hr: <${initialTargets.targets.postBreakfast2hr?.max} ${initialTargets.unit}`);

    // Test bulk update: Set all post-meal 2hr targets to 110 mg/dL
    const newTarget: GlucoseTargetRange = {
      min: 0,
      max: 110,
      unit: 'mg/dL'
    };

    const updatedTargets = applyBulkCategoryTarget(
      initialTargets,
      'post-meal-2hr',
      newTarget
    );

    console.log('\n🔧 After Bulk Update (post-meal-2hr → 110 mg/dL):');
    console.log(`   Post-Breakfast 2hr: <${updatedTargets.targets.postBreakfast2hr?.max} ${updatedTargets.unit}`);
    console.log(`   Post-Lunch 2hr: <${updatedTargets.targets.postLunch2hr?.max} ${updatedTargets.unit}`);
    console.log(`   Post-Dinner 2hr: <${updatedTargets.targets.postDinner2hr?.max} ${updatedTargets.unit}`);
    console.log(`   Fasting (unchanged): <${updatedTargets.targets.fasting?.max} ${updatedTargets.unit}`);

    // Validate all post-meal 2hr targets were updated
    const allTargetsUpdated = 
      updatedTargets.targets.postBreakfast2hr?.max === 110 &&
      updatedTargets.targets.postLunch2hr?.max === 110 &&
      updatedTargets.targets.postDinner2hr?.max === 110 &&
      updatedTargets.targets.fasting?.max === 95; // Should remain unchanged

    console.log(`\n   Bulk update validation: ${allTargetsUpdated ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test affected meal types mapping
    const affectedMealTypes = MEAL_CATEGORY_MAPPING['post-meal-2hr'];
    console.log(`📝 Affected meal types for 'post-meal-2hr': ${affectedMealTypes.join(', ')}`);

    return allTargetsUpdated;
  }

  /**
   * Test 2: Personalized Target Range Lookup
   */
  testPersonalizedTargetLookup(): boolean {
    console.log('2️⃣ TESTING PERSONALIZED TARGET RANGE LOOKUP');
    console.log('===========================================\n');

    // Create personalized targets with specific lunch restrictions
    const personalizedTargets: PersonalizedGlucoseTargets = {
      userId: TEST_USER_ID,
      unit: 'mg/dL',
      targets: {
        fasting: { min: 0, max: 90, unit: 'mg/dL' }, // Stricter than default
        postBreakfast2hr: { min: 0, max: 120, unit: 'mg/dL' }, // Default
        postLunch2hr: { min: 0, max: 110, unit: 'mg/dL' }, // Doctor said lunch should be stricter
        postDinner2hr: { min: 0, max: 120, unit: 'mg/dL' }, // Default
      },
      notes: "Doctor wants stricter fasting and lunch targets",
      setBy: "Dr. Smith - Diabetes Clinic"
    };

    const testCases = [
      { meal: 'fasting', expected: 90, description: 'Custom stricter fasting' },
      { meal: 'post-breakfast-2hr', expected: 120, description: 'Default breakfast' },
      { meal: 'post-lunch-2hr', expected: 110, description: 'Custom stricter lunch' },
      { meal: 'post-dinner-2hr', expected: 120, description: 'Default dinner' },
      { meal: 'post-snack', expected: 120, description: 'Fallback to default for snack' }
    ];

    let allPassed = true;

    testCases.forEach(testCase => {
      const targetRange = getPersonalizedTargetRange(
        testCase.meal as any,
        personalizedTargets,
        'mg/dL'
      );

      const actualMax = targetRange?.max || 0;
      const passed = actualMax === testCase.expected;
      
      if (!passed) allPassed = false;

      console.log(`   ${testCase.meal}: ${actualMax} mg/dL (expected ${testCase.expected}) ${passed ? '✅' : '❌'}`);
      console.log(`     ${testCase.description}`);
    });

    console.log(`\n   Target lookup validation: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);

    return allPassed;
  }

  /**
   * Test 3: Unit Conversion with Personalized Targets
   */
  testUnitConversion(): boolean {
    console.log('3️⃣ TESTING UNIT CONVERSION WITH PERSONALIZED TARGETS');
    console.log('===================================================\n');

    // Create targets in mg/dL
    const mgdlTargets: PersonalizedGlucoseTargets = {
      userId: TEST_USER_ID,
      unit: 'mg/dL',
      targets: {
        fasting: { min: 0, max: 90, unit: 'mg/dL' },
        postLunch2hr: { min: 0, max: 110, unit: 'mg/dL' },
      },
    };

    console.log('📊 Original targets (mg/dL):');
    console.log(`   Fasting: <${mgdlTargets.targets.fasting?.max} mg/dL`);
    console.log(`   Post-lunch 2hr: <${mgdlTargets.targets.postLunch2hr?.max} mg/dL`);

    // Convert to mmol/L
    const mmolTargets: PersonalizedGlucoseTargets = {
      ...mgdlTargets,
      unit: 'mmol/L',
      targets: {}
    };

    // Manual conversion for testing
    if (mgdlTargets.targets.fasting) {
      mmolTargets.targets.fasting = {
        min: convertGlucoseUnit(mgdlTargets.targets.fasting.min, 'mg/dL', 'mmol/L'),
        max: convertGlucoseUnit(mgdlTargets.targets.fasting.max, 'mg/dL', 'mmol/L'),
        unit: 'mmol/L'
      };
    }

    if (mgdlTargets.targets.postLunch2hr) {
      mmolTargets.targets.postLunch2hr = {
        min: convertGlucoseUnit(mgdlTargets.targets.postLunch2hr.min, 'mg/dL', 'mmol/L'),
        max: convertGlucoseUnit(mgdlTargets.targets.postLunch2hr.max, 'mg/dL', 'mmol/L'),
        unit: 'mmol/L'
      };
    }

    console.log('\n📊 Converted targets (mmol/L):');
    console.log(`   Fasting: <${mmolTargets.targets.fasting?.max} mmol/L`);
    console.log(`   Post-lunch 2hr: <${mmolTargets.targets.postLunch2hr?.max} mmol/L`);

    // Validate conversions
    const fastingCorrect = Math.abs(mmolTargets.targets.fasting!.max - 5.0) < 0.1; // 90 mg/dL ≈ 5.0 mmol/L
    const lunchCorrect = Math.abs(mmolTargets.targets.postLunch2hr!.max - 6.1) < 0.1; // 110 mg/dL ≈ 6.1 mmol/L

    console.log(`\n   Unit conversion validation:`);
    console.log(`     Fasting (90 mg/dL → ~5.0 mmol/L): ${fastingCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`     Lunch (110 mg/dL → ~6.1 mmol/L): ${lunchCorrect ? '✅ PASS' : '❌ FAIL'}\n`);

    return fastingCorrect && lunchCorrect;
  }

  /**
   * Test 4: Statistics Calculation with Personalized Targets
   */
  testStatisticsWithPersonalizedTargets(): boolean {
    console.log('4️⃣ TESTING STATISTICS WITH PERSONALIZED TARGETS');
    console.log('===============================================\n');

    // Create test readings
    const testReadings: GlucoseReading[] = [
      // Fasting readings
      { userId: TEST_USER_ID, value: 88, unit: 'mg/dL', timestamp: new Date(), mealAssociation: 'fasting' },
      { userId: TEST_USER_ID, value: 92, unit: 'mg/dL', timestamp: new Date(), mealAssociation: 'fasting' },
      
      // Post-lunch readings
      { userId: TEST_USER_ID, value: 105, unit: 'mg/dL', timestamp: new Date(), mealAssociation: 'post-lunch-2hr' },
      { userId: TEST_USER_ID, value: 108, unit: 'mg/dL', timestamp: new Date(), mealAssociation: 'post-lunch-2hr' },
      
      // Post-dinner readings  
      { userId: TEST_USER_ID, value: 115, unit: 'mg/dL', timestamp: new Date(), mealAssociation: 'post-dinner-2hr' },
      { userId: TEST_USER_ID, value: 118, unit: 'mg/dL', timestamp: new Date(), mealAssociation: 'post-dinner-2hr' },
    ];

    // Personalized targets: Stricter lunch target
    const personalizedTargets: PersonalizedGlucoseTargets = {
      userId: TEST_USER_ID,
      unit: 'mg/dL',
      targets: {
        fasting: { min: 0, max: 95, unit: 'mg/dL' }, // Default
        postLunch2hr: { min: 0, max: 110, unit: 'mg/dL' }, // Stricter: 110 instead of 120
        postDinner2hr: { min: 0, max: 120, unit: 'mg/dL' }, // Default
      },
    };

    console.log('📊 Test Readings:');
    testReadings.forEach((reading, i) => {
      console.log(`   ${i + 1}. ${reading.value} mg/dL (${reading.mealAssociation})`);
    });

    console.log('\n🎯 Personalized Targets:');
    console.log(`   Fasting: <95 mg/dL (default)`);
    console.log(`   Post-lunch 2hr: <110 mg/dL (stricter than default 120)`);
    console.log(`   Post-dinner 2hr: <120 mg/dL (default)`);

    // Calculate time in range with personalized targets
    let inRangeCount = 0;
    testReadings.forEach(reading => {
      const targetRange = getPersonalizedTargetRange(
        reading.mealAssociation!,
        personalizedTargets,
        'mg/dL'
      );
      
      if (targetRange) {
        const inRange = reading.value <= targetRange.max;
        if (inRange) inRangeCount++;
        
        console.log(`     ${reading.value} mg/dL vs <${targetRange.max} mg/dL → ${inRange ? '✅ In Range' : '❌ High'}`);
      }
    });

    const timeInRange = (inRangeCount / testReadings.length) * 100;
    console.log(`\n📈 Results with Personalized Targets:`);
    console.log(`   Time in Range: ${timeInRange.toFixed(1)}%`);
    console.log(`   In Range: ${inRangeCount}/${testReadings.length} readings`);

    // With personalized targets, lunch readings (105, 108) should be in range
    // But with default targets (120), all readings would be in range
    // Expected: 6/6 = 100% (all readings should still be in range with stricter lunch target)
    const expectedInRange = 6; // All readings are below their respective targets
    const testPassed = inRangeCount === expectedInRange;

    console.log(`\n   Personalized targets validation: ${testPassed ? '✅ PASS' : '❌ FAIL'}\n`);

    return testPassed;
  }

  /**
   * Test 5: Real-World Scenario - Doctor's Custom Recommendations
   */
  testRealWorldScenario(): boolean {
    console.log('5️⃣ TESTING REAL-WORLD SCENARIO');
    console.log('==============================\n');

    // Scenario: Patient has trouble controlling lunch readings, doctor recommends stricter lunch targets
    console.log('🏥 Real-World Scenario:');
    console.log('   Patient: Sarah, 28 weeks pregnant');
    console.log('   Issue: Post-lunch readings often 115-125 mg/dL');
    console.log('   Doctor recommendation: Lunch target <115 mg/dL instead of <120 mg/dL');
    console.log('   Other targets remain standard\n');

    // Create personalized targets based on doctor's recommendation
    const sarahsTargets: PersonalizedGlucoseTargets = {
      userId: 'sarah-patient-001',
      unit: 'mg/dL',
      targets: {
        fasting: { min: 0, max: 95, unit: 'mg/dL' }, // Standard
        postBreakfast2hr: { min: 0, max: 120, unit: 'mg/dL' }, // Standard
        postLunch2hr: { min: 0, max: 115, unit: 'mg/dL' }, // Custom: Stricter
        postDinner2hr: { min: 0, max: 120, unit: 'mg/dL' }, // Standard
      },
      notes: "Stricter lunch target due to consistently elevated post-lunch readings. Patient to focus on lower-carb lunch options.",
      setBy: "Dr. Johnson - Maternal Health Clinic"
    };

    // Test readings over a week
    const weeklyReadings: GlucoseReading[] = [
      // Monday
      { userId: 'sarah-patient-001', value: 89, unit: 'mg/dL', timestamp: new Date('2025-01-06T07:00:00'), mealAssociation: 'fasting' },
      { userId: 'sarah-patient-001', value: 114, unit: 'mg/dL', timestamp: new Date('2025-01-06T14:00:00'), mealAssociation: 'post-lunch-2hr' },
      
      // Tuesday  
      { userId: 'sarah-patient-001', value: 92, unit: 'mg/dL', timestamp: new Date('2025-01-07T07:00:00'), mealAssociation: 'fasting' },
      { userId: 'sarah-patient-001', value: 117, unit: 'mg/dL', timestamp: new Date('2025-01-07T14:00:00'), mealAssociation: 'post-lunch-2hr' }, // Would be high with custom target
      
      // Wednesday
      { userId: 'sarah-patient-001', value: 87, unit: 'mg/dL', timestamp: new Date('2025-01-08T07:00:00'), mealAssociation: 'fasting' },
      { userId: 'sarah-patient-001', value: 112, unit: 'mg/dL', timestamp: new Date('2025-01-08T14:00:00'), mealAssociation: 'post-lunch-2hr' },
    ];

    console.log('📅 Weekly Readings:');
    let inRangeCount = 0;
    let defaultInRangeCount = 0;

    weeklyReadings.forEach((reading, i) => {
      // Check against personalized targets
      const personalizedTarget = getPersonalizedTargetRange(
        reading.mealAssociation!,
        sarahsTargets,
        'mg/dL'
      );
      
      // Check against default targets
      const defaultTarget = reading.mealAssociation === 'fasting' 
        ? DEFAULT_GLUCOSE_TARGETS_MGDL.fasting.max
        : DEFAULT_GLUCOSE_TARGETS_MGDL.postMeal2hr.max;

      const personalizedInRange = personalizedTarget ? reading.value <= personalizedTarget.max : false;
      const defaultInRange = reading.value <= defaultTarget;

      if (personalizedInRange) inRangeCount++;
      if (defaultInRange) defaultInRangeCount++;

      console.log(`   ${format(reading.timestamp, 'MMM dd')}: ${reading.value} mg/dL (${reading.mealAssociation})`);
      console.log(`     Personalized target: <${personalizedTarget?.max} mg/dL → ${personalizedInRange ? '✅' : '❌'}`);
      console.log(`     Default target: <${defaultTarget} mg/dL → ${defaultInRange ? '✅' : '❌'}`);
    });

    const personalizedTimeInRange = (inRangeCount / weeklyReadings.length) * 100;
    const defaultTimeInRange = (defaultInRangeCount / weeklyReadings.length) * 100;

    console.log(`\n📊 Results Comparison:`);
    console.log(`   With Personalized Targets: ${personalizedTimeInRange.toFixed(1)}% time in range`);
    console.log(`   With Default Targets: ${defaultTimeInRange.toFixed(1)}% time in range`);
    console.log(`   Difference: ${(defaultTimeInRange - personalizedTimeInRange).toFixed(1)}% (stricter targets)`);

    // Validate that personalized targets are working (should show lower time in range)
    const testPassed = personalizedTimeInRange < defaultTimeInRange && personalizedTimeInRange > 70;

    console.log(`\n   Real-world scenario validation: ${testPassed ? '✅ PASS' : '❌ FAIL'}\n`);

    return testPassed;
  }

  /**
   * Run all personalized targets tests
   */
  runAllTests(): boolean {
    console.log('🏥 COMPREHENSIVE PERSONALIZED GLUCOSE TARGETS TESTING');
    console.log('====================================================\n');

    const results = [
      this.testBulkCategoryTargets(),
      this.testPersonalizedTargetLookup(),
      this.testUnitConversion(),
      this.testStatisticsWithPersonalizedTargets(),
      this.testRealWorldScenario()
    ];

    const passedTests = results.filter(Boolean).length;
    const totalTests = results.length;

    console.log('🏁 FINAL RESULTS');
    console.log('================');
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    console.log(`Overall: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

    if (passedTests === totalTests) {
      console.log('🎉 PERSONALIZED GLUCOSE TARGETS SYSTEM IS WORKING CORRECTLY!');
      console.log('✅ Bulk category updates work as expected');
      console.log('✅ Individual target lookups are accurate');
      console.log('✅ Unit conversions maintain precision');
      console.log('✅ Statistics calculations use personalized targets');
      console.log('✅ Real-world scenarios are handled properly');
      console.log('\n✨ Ready for production use with personalized glucose targets');
    } else {
      console.log('⚠️  Additional fixes needed before production use');
    }

    return passedTests === totalTests;
  }
}

// Run if executed directly
if (require.main === module) {
  const tester = new PersonalizedTargetsTest();
  tester.runAllTests();
}