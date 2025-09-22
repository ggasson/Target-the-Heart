import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function debugPrayerEnum() {
  console.log('🔍 Debugging prayer_category enum specifically...\n');
  
  try {
    // Get prayer_category enum values from database
    const prayerEnum = await sql`
      SELECT enumlabel as value, enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'prayer_category'
      ORDER BY e.enumsortorder;
    `;
    
    console.log('📊 Database prayer_category enum values:');
    prayerEnum.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.value}"`);
    });
    
    console.log('\n🔍 Frontend is sending: "health_healing"');
    console.log('🔍 Schema definition: ["health_healing", "family_relationships", "work_career", "spiritual_growth", "financial_provision", "other"]');
    
    // Check if health_healing exists
    const hasHealthHealing = prayerEnum.some(row => row.value === 'health_healing');
    console.log(`\n❓ Does "health_healing" exist in database? ${hasHealthHealing ? '✅ YES' : '❌ NO'}`);
    
    if (!hasHealthHealing) {
      console.log('\n🚨 MISMATCH DETECTED! Database enum does not contain "health_healing"');
      console.log('📝 Need to recreate the enum or update the database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

debugPrayerEnum();
