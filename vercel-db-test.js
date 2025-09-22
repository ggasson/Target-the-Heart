// This script should be run with the ACTUAL Neon DATABASE_URL
// that Vercel is using in production

console.log('⚠️  IMPORTANT: This script needs to be run with the Neon DATABASE_URL');
console.log('⚠️  Get the DATABASE_URL from Vercel environment variables');
console.log('⚠️  Set it as: DATABASE_URL=your_neon_url node vercel-db-test.js');
console.log('');

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost')) {
  console.log('❌ This script is using a local database URL');
  console.log('🔍 Current DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  console.log('');
  console.log('To fix this:');
  console.log('1. Go to Vercel dashboard → Project → Settings → Environment Variables');
  console.log('2. Copy the DATABASE_URL value');
  console.log('3. Run: DATABASE_URL="your_neon_url" node vercel-db-test.js');
  process.exit(1);
}

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function vercelDbTest() {
  console.log('🔍 VERCEL/NEON DATABASE TEST...\n');
  
  try {
    console.log('🔍 Database URL preview:', process.env.DATABASE_URL.substring(0, 50) + '...');
    
    // Test connection
    const connectionTest = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check current enum
    const enumValues = await sql`
      SELECT enumlabel, enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'prayer_category'
      ORDER BY e.enumsortorder;
    `;
    
    console.log('\n📊 Current enum values in production:');
    enumValues.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.enumlabel}"`);
    });
    
    // Test the specific failing value
    console.log('\n🧪 Testing "health_healing":');
    try {
      const testResult = await sql`SELECT 'health_healing'::prayer_category as test_value`;
      console.log(`✅ "health_healing" works: ${testResult[0].test_value}`);
    } catch (error) {
      console.log(`❌ "health_healing" fails: ${error.message}`);
      
      // If it fails, try to fix it
      console.log('\n🔧 Attempting to fix enum...');
      
      await sql.begin(async sql => {
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE text`;
        await sql`DROP TYPE IF EXISTS prayer_category CASCADE`;
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
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category TYPE prayer_category USING category::prayer_category`;
        await sql`ALTER TABLE prayer_requests ALTER COLUMN category SET DEFAULT 'other'::prayer_category`;
      });
      
      console.log('✅ Enum recreated in production database');
      
      // Test again
      const retestResult = await sql`SELECT 'health_healing'::prayer_category as test_value`;
      console.log(`✅ Retest successful: ${retestResult[0].test_value}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

vercelDbTest();
