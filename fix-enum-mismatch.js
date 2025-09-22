import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function fixEnumMismatch() {
  console.log('🔧 Fixing prayer_category enum mismatch...\n');
  
  try {
    // First, let's check what the table actually expects
    console.log('🔍 Step 1: Checking current enum values in database...');
    const currentEnum = await sql`
      SELECT enumlabel as value
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'prayer_category'
      ORDER BY e.enumsortorder;
    `;
    
    console.log('Current enum values:');
    currentEnum.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.value}"`);
    });
    
    // Check if there are any existing prayer requests
    console.log('\n🔍 Step 2: Checking existing prayer requests...');
    const existingPrayers = await sql`
      SELECT id, category FROM prayer_requests LIMIT 5;
    `;
    
    console.log(`Found ${existingPrayers.length} existing prayer requests`);
    existingPrayers.forEach(prayer => {
      console.log(`  - ${prayer.id}: "${prayer.category}"`);
    });
    
    // Try to insert a test record with each enum value
    console.log('\n🧪 Step 3: Testing each enum value...');
    const testValues = ["health_healing", "family_relationships", "work_career", "spiritual_growth", "financial_provision", "other"];
    
    for (const category of testValues) {
      try {
        console.log(`Testing "${category}"...`);
        const testResult = await sql`
          SELECT '${sql(category)}'::prayer_category as test_category;
        `;
        console.log(`✅ "${category}" works: ${testResult[0].test_category}`);
      } catch (error) {
        console.log(`❌ "${category}" failed: ${error.message}`);
      }
    }
    
    // Check the prayer_requests table column definition
    console.log('\n🔍 Step 4: Checking prayer_requests table column...');
    const columnInfo = await sql`
      SELECT 
        column_name,
        data_type,
        udt_name,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'prayer_requests' 
      AND column_name = 'category';
    `;
    
    console.log('Category column info:');
    console.log(columnInfo[0]);
    
    // If health_healing doesn't work, we might need to recreate the enum
    console.log('\n🔧 Step 5: Attempting to fix enum if needed...');
    
    // Check if enum needs to be recreated
    try {
      await sql`SELECT 'health_healing'::prayer_category`;
      console.log('✅ health_healing works directly, issue might be elsewhere');
    } catch (enumError) {
      console.log('❌ health_healing fails, recreating enum...');
      
      // Start transaction to safely recreate enum
      await sql.begin(async sql => {
        // First, change the column to text temporarily
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE text`;
        
        // Drop the old enum
        await sql`DROP TYPE prayer_category CASCADE`;
        
        // Create new enum with correct values
        await sql`
          CREATE TYPE prayer_category AS ENUM (
            'health_healing',
            'family_relationships', 
            'work_career',
            'spiritual_growth',
            'financial_provision',
            'other'
          )
        `;
        
        // Change column back to enum type
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE prayer_category USING category::prayer_category`;
        
        // Set default value
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category SET DEFAULT 'other'::prayer_category`;
        
        console.log('✅ Enum recreated successfully');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

fixEnumMismatch();
