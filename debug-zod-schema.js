import { insertPrayerRequestSchema } from './shared/schema.ts';

async function debugZodSchema() {
  console.log('🔍 Testing Zod schema validation for prayer categories...\n');
  
  const testData = {
    title: "Test Prayer",
    description: "Test description",
    category: "health_healing", // This is what frontend sends
    authorId: "test-user-id",
    groupId: "test-group-id"
  };
  
  console.log('📤 Testing data:', testData);
  
  try {
    const result = insertPrayerRequestSchema.parse(testData);
    console.log('✅ Zod validation passed:', result);
  } catch (error) {
    console.error('❌ Zod validation failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    
    if (error.errors) {
      console.error('\nDetailed errors:');
      error.errors.forEach((err, i) => {
        console.error(`  ${i + 1}. Path: ${err.path.join('.')} - ${err.message}`);
        if (err.received) console.error(`     Received: ${err.received}`);
        if (err.expected) console.error(`     Expected: ${err.expected}`);
      });
    }
  }
  
  // Test all prayer categories
  console.log('\n🧪 Testing all prayer categories...');
  const categories = ["health_healing", "family_relationships", "work_career", "spiritual_growth", "financial_provision", "other"];
  
  for (const category of categories) {
    try {
      const testResult = insertPrayerRequestSchema.parse({
        ...testData,
        category
      });
      console.log(`✅ ${category}: PASS`);
    } catch (error) {
      console.log(`❌ ${category}: FAIL - ${error.message}`);
    }
  }
}

debugZodSchema();
