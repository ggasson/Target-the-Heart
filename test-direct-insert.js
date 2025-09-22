import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function testDirectInsert() {
  console.log('🧪 Testing direct prayer_requests insert...\n');
  
  try {
    // Test the exact same insert that Drizzle would do
    console.log('🔍 Step 1: Testing direct insert with health_healing...');
    
    const testPrayer = {
      title: 'Test Prayer',
      description: 'Test description', 
      category: 'health_healing',
      author_id: 'test-user-id',
      group_id: 'test-group-id'
    };
    
    console.log('Attempting insert with data:', testPrayer);
    
    const result = await sql`
      INSERT INTO prayer_requests (title, description, category, author_id, group_id)
      VALUES (${testPrayer.title}, ${testPrayer.description}, ${testPrayer.category}, ${testPrayer.author_id}, ${testPrayer.group_id})
      RETURNING *;
    `;
    
    console.log('✅ Insert successful:', result[0]);
    
    // Clean up the test record
    await sql`DELETE FROM prayer_requests WHERE id = ${result[0].id}`;
    console.log('🗑️ Test record cleaned up');
    
  } catch (error) {
    console.error('❌ Direct insert failed:', error.message);
    
    // Try with explicit casting
    console.log('\n🔄 Trying with explicit enum casting...');
    try {
      const result2 = await sql`
        INSERT INTO prayer_requests (title, description, category, author_id, group_id)
        VALUES ('Test Prayer 2', 'Test description 2', 'health_healing'::prayer_category, 'test-user-id-2', 'test-group-id-2')
        RETURNING *;
      `;
      
      console.log('✅ Insert with explicit casting successful:', result2[0]);
      
      // Clean up
      await sql`DELETE FROM prayer_requests WHERE id = ${result2[0].id}`;
      console.log('🗑️ Test record cleaned up');
      
    } catch (castError) {
      console.error('❌ Insert with explicit casting also failed:', castError.message);
    }
  }
  
  // Check what Drizzle might be doing differently
  console.log('\n🔍 Step 2: Testing various parameter formats...');
  
  const testFormats = [
    { name: 'Direct string', value: 'health_healing' },
    { name: 'Template literal', value: `health_healing` },
    { name: 'Explicit cast', value: sql`'health_healing'::prayer_category` },
  ];
  
  for (const format of testFormats) {
    try {
      console.log(`Testing ${format.name}...`);
      const testResult = await sql`SELECT ${format.value} as test_category`;
      console.log(`✅ ${format.name} works:`, testResult[0].test_category);
    } catch (formatError) {
      console.log(`❌ ${format.name} failed:`, formatError.message);
    }
  }
  
  // Test enum values that definitely exist
  console.log('\n🔍 Step 3: Testing with existing enum values from database...');
  
  try {
    const existingEnums = await sql`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'prayer_category'
      ORDER BY e.enumsortorder
      LIMIT 1;
    `;
    
    const firstEnum = existingEnums[0].enumlabel;
    console.log(`First enum value from database: "${firstEnum}"`);
    
    const insertTest = await sql`
      INSERT INTO prayer_requests (title, description, category, author_id, group_id)
      VALUES ('Test Enum', 'Testing first enum', ${firstEnum}, 'test-enum-user', 'test-enum-group')
      RETURNING *;
    `;
    
    console.log('✅ Insert with first enum successful:', insertTest[0]);
    
    // Clean up
    await sql`DELETE FROM prayer_requests WHERE id = ${insertTest[0].id}`;
    
  } catch (enumTestError) {
    console.error('❌ Even first enum failed:', enumTestError.message);
  } finally {
    await sql.end();
  }
}

testDirectInsert();
