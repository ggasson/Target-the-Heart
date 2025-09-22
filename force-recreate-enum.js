import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function forceRecreateEnum() {
  console.log('🔧 FORCE RECREATING prayer_category enum in production...\n');
  
  try {
    console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 80) + '...');
    
    console.log('🔄 Step 1: Backup existing prayer requests...');
    const existingPrayers = await sql`
      SELECT id, category FROM prayer_requests;
    `;
    console.log(`Found ${existingPrayers.length} existing prayer requests`);
    
    if (existingPrayers.length > 0) {
      console.log('⚠️  Cannot safely recreate enum with existing data');
      console.log('Existing prayer categories:');
      existingPrayers.forEach(prayer => {
        console.log(`  - ${prayer.id}: "${prayer.category}"`);
      });
      
      // Try to update the specific prayers to use valid enum values
      console.log('\n🔄 Attempting to fix existing prayer categories...');
      for (const prayer of existingPrayers) {
        try {
          if (prayer.category === 'health_healing') {
            // Try to verify it's actually valid
            await sql`UPDATE prayer_requests SET category = 'health_healing'::prayer_category WHERE id = ${prayer.id}`;
            console.log(`✅ Fixed prayer ${prayer.id}`);
          }
        } catch (updateError) {
          console.log(`❌ Failed to fix prayer ${prayer.id}: ${updateError.message}`);
        }
      }
      
      return;
    }
    
    console.log('\n🔄 Step 2: Safely recreating enum...');
    
    await sql.begin(async sql => {
      // Change column to text temporarily  
      console.log('  - Converting column to text...');
      await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE text`;
      
      // Drop and recreate enum
      console.log('  - Dropping old enum...');
      await sql`DROP TYPE IF EXISTS prayer_category CASCADE`;
      
      console.log('  - Creating new enum...');
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
      
      // Convert column back
      console.log('  - Converting column back to enum...');
      await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE prayer_category USING category::prayer_category`;
      
      // Set default
      console.log('  - Setting default value...');
      await sql`ALTER TABLE prayer_requests ALTER COLUMN category SET DEFAULT 'other'::prayer_category`;
      
      console.log('✅ Enum recreated successfully in transaction');
    });
    
    // Test the new enum
    console.log('\n🧪 Testing new enum...');
    const testResult = await sql`SELECT 'health_healing'::prayer_category as test_value`;
    console.log(`✅ Test successful: ${testResult[0].test_value}`);
    
  } catch (error) {
    console.error('❌ Force recreation failed:', error);
  } finally {
    await sql.end();
  }
}

forceRecreateEnum();
