// Fix RSVP enum in Neon database
import postgres from 'postgres';

const NEON_DB_URL = 'postgresql://neondb_owner:npg_2PGLSyHBsDU9@ep-billowing-salad-a9ha2x2i-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = postgres(NEON_DB_URL);

async function fixNeonRsvpEnum() {
  console.log('🔧 FIXING RSVP ENUM IN NEON DATABASE...\n');
  
  try {
    // Check current RSVP enum values
    console.log('🔍 Current RSVP enum values in Neon:');
    const currentEnum = await sql`
      SELECT enumlabel, enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'rsvp_status'
      ORDER BY e.enumsortorder;
    `;
    
    currentEnum.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.enumlabel}"`);
    });
    
    // Check if any RSVPs exist
    const existingRsvps = await sql`SELECT COUNT(*) as count FROM meeting_rsvps`;
    console.log(`\n📊 Found ${existingRsvps[0].count} existing RSVPs`);
    
    if (existingRsvps[0].count > 0) {
      console.log('⚠️  There are existing RSVPs. Need to handle carefully...');
      
      // Update existing RSVP values to new enum values
      console.log('\n🔄 Updating existing RSVP values...');
      
      // Convert old values to new values
      const conversions = [
        { from: 'yes', to: 'attending' },
        { from: 'no', to: 'not_attending' },
        { from: 'maybe', to: 'maybe' }
      ];
      
      // First convert to text
      await sql`ALTER TABLE meeting_rsvps ALTER COLUMN status TYPE text`;
      console.log('  ✅ Converted status column to text');
      
      for (const conversion of conversions) {
        const updateResult = await sql`
          UPDATE meeting_rsvps 
          SET status = ${conversion.to} 
          WHERE status = ${conversion.from}
        `;
        console.log(`  ✅ Updated ${conversion.from} → ${conversion.to}`);
      }
    } else {
      console.log('✅ No existing RSVPs, safe to recreate enum');
      
      // Convert column to text temporarily
      await sql`ALTER TABLE meeting_rsvps ALTER COLUMN status TYPE text`;
    }
    
    console.log('\n🔧 Recreating RSVP enum...');
    
    // Drop old enum
    await sql`DROP TYPE IF EXISTS rsvp_status CASCADE`;
    console.log('  ✅ Old enum dropped');
    
    // Create new enum with correct values
    await sql`
      CREATE TYPE rsvp_status AS ENUM (
        'attending',
        'not_attending',
        'maybe'
      )
    `;
    console.log('  ✅ New enum created');
    
    // Convert column back to enum
    await sql`ALTER TABLE meeting_rsvps ALTER COLUMN status TYPE rsvp_status USING status::rsvp_status`;
    console.log('  ✅ Column converted back to enum');
    
    // Set default
    await sql`ALTER TABLE meeting_rsvps ALTER COLUMN status SET DEFAULT 'attending'::rsvp_status`;
    console.log('  ✅ Default value set');
    
    // Test the new enum
    console.log('\n🧪 Testing new RSVP enum...');
    const testValues = ['attending', 'not_attending', 'maybe'];
    
    for (const value of testValues) {
      const result = await sql`SELECT ${value}::rsvp_status as test_value`;
      console.log(`  ✅ ${value}: ${result[0].test_value}`);
    }
    
    console.log('\n🎉 RSVP ENUM FIXED SUCCESSFULLY! 🎉');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await sql.end();
  }
}

fixNeonRsvpEnum();
