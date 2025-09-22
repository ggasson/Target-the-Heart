import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function fixGuestCount() {
  console.log('🔧 Fixing guest_count column type...\n');
  
  try {
    // Check current type
    const columnInfo = await sql`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'meeting_rsvps' 
      AND column_name = 'guest_count';
    `;
    
    console.log('Current guest_count type:', columnInfo[0]);
    
    // First drop the default, then change type, then restore default
    await sql`ALTER TABLE meeting_rsvps ALTER COLUMN guest_count DROP DEFAULT;`;
    console.log('✅ Default dropped');
    
    await sql`
      ALTER TABLE meeting_rsvps 
      ALTER COLUMN guest_count 
      TYPE integer 
      USING guest_count::integer;
    `;
    console.log('✅ Type changed to integer');
    
    await sql`ALTER TABLE meeting_rsvps ALTER COLUMN guest_count SET DEFAULT 0;`;
    console.log('✅ Default restored');
    
    console.log('✅ guest_count converted to integer');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

fixGuestCount();
