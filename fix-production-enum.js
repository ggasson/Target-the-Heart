// Fixed script to connect to your Neon database and fix the enum
import postgres from 'postgres';

// Your Neon database URL
const NEON_DB_URL = 'postgresql://neondb_owner:npg_2PGLSyHBsDU9@ep-billowing-salad-a9ha2x2i-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = postgres(NEON_DB_URL);

async function fixProductionEnum() {
  console.log('🔧 FIXING PRODUCTION NEON DATABASE ENUM...\n');
  
  try {
    console.log('🔍 Connecting to Neon database...');
    
    // Test connection
    const connectionTest = await sql`SELECT 1 as test`;
    console.log('✅ Connected to Neon database successfully');
    
    // Check current enum
    console.log('\n📊 Checking current enum values...');
    const enumValues = await sql`
      SELECT enumlabel, enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'prayer_category'
      ORDER BY e.enumsortorder;
    `;
    
    console.log('Current prayer_category enum values:');
    enumValues.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.enumlabel}"`);
    });
    
    // Test the failing value
    console.log('\n🧪 Testing "health_healing" enum value...');
    try {
      const testResult = await sql`SELECT 'health_healing'::prayer_category as test_value`;
      console.log(`✅ "health_healing" works: ${testResult[0].test_value}`);
      console.log('🎉 The enum is actually working! The issue might be elsewhere.');
    } catch (error) {
      console.log(`❌ "health_healing" fails: ${error.message}`);
      
      console.log('\n🔧 Fixing the enum...');
      
      // Check if there are existing prayer requests
      const existingPrayers = await sql`SELECT COUNT(*) as count FROM prayer_requests`;
      console.log(`Found ${existingPrayers[0].count} existing prayer requests`);
      
      if (existingPrayers[0].count > 0) {
        console.log('⚠️  There are existing prayer requests. This is a more complex fix.');
        console.log('Please backup your data before proceeding.');
        return;
      }
      
      // Safe to recreate enum
      await sql.begin(async sql => {
        console.log('  🔄 Converting column to text...');
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE text`;
        
        console.log('  🗑️  Dropping old enum...');
        await sql`DROP TYPE IF EXISTS prayer_category CASCADE`;
        
        console.log('  ✨ Creating new enum...');
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
        
        console.log('  🔄 Converting column back to enum...');
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE prayer_category USING category::prayer_category`;
        
        console.log('  ⚙️  Setting default value...');
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category SET DEFAULT 'other'::prayer_category`;
        
        console.log('✅ Enum recreated successfully in transaction');
      });
      
      // Test again
      console.log('\n🧪 Testing fixed enum...');
      const retestResult = await sql`SELECT 'health_healing'::prayer_category as test_value`;
      console.log(`✅ Fix successful: ${retestResult[0].test_value}`);
    }
    
    // Test all enum values
    console.log('\n🧪 Testing all enum values...');
    const testValues = ['health_healing', 'family_relationships', 'work_career', 'spiritual_growth', 'financial_provision', 'other'];
    
    for (const value of testValues) {
      try {
        const result = await sql`SELECT ${sql(value)}::prayer_category as test_value`;
        console.log(`✅ ${value}: WORKS`);
      } catch (error) {
        console.log(`❌ ${value}: FAILS - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Production database enum fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await sql.end();
  }
}

fixProductionEnum();
