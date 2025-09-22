// Test if RSVP enum fix worked (fresh connection)
import postgres from 'postgres';

const NEON_DB_URL = 'postgresql://neondb_owner:npg_2PGLSyHBsDU9@ep-billowing-salad-a9ha2x2i-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = postgres(NEON_DB_URL);

async function testRsvpFix() {
  console.log('🧪 TESTING RSVP ENUM FIX (Fresh Connection)...\n');
  
  try {
    // Test the RSVP enum values
    console.log('🔍 Testing RSVP enum values:');
    const testValues = ['attending', 'not_attending', 'maybe'];
    
    for (const value of testValues) {
      try {
        const result = await sql`SELECT ${value}::rsvp_status as test_value`;
        console.log(`  ✅ ${value}: ${result[0].test_value}`);
      } catch (error) {
        console.log(`  ❌ ${value}: ${error.message}`);
      }
    }
    
    // Check current enum in database
    console.log('\n🔍 Current RSVP enum values in database:');
    const enumValues = await sql`
      SELECT enumlabel, enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'rsvp_status'
      ORDER BY e.enumsortorder;
    `;
    
    enumValues.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.enumlabel}"`);
    });
    
    // Test creating an RSVP
    console.log('\n🧪 Testing RSVP creation...');
    
    // Create test user and meeting first
    const [testUser] = await sql`
      INSERT INTO users (email, first_name, last_name)
      VALUES ('rsvp-test-final@example.com', 'RSVP', 'Test')
      RETURNING *;
    `;
    
    const [testGroup] = await sql`
      INSERT INTO groups (name, description, admin_id)
      VALUES ('RSVP Test Group', 'Final RSVP test', ${testUser.id})
      RETURNING *;
    `;
    
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 1);
    
    const [testMeeting] = await sql`
      INSERT INTO meetings (title, description, group_id, meeting_date, created_by, status)
      VALUES ('RSVP Test Meeting', 'Testing RSVP', ${testGroup.id}, ${meetingDate.toISOString()}, ${testUser.id}, 'scheduled')
      RETURNING *;
    `;
    
    // Test RSVP with each status
    for (const status of testValues) {
      try {
        const [rsvp] = await sql`
          INSERT INTO meeting_rsvps (meeting_id, user_id, status, guest_count)
          VALUES (${testMeeting.id}, ${testUser.id}, ${status}, 0)
          ON CONFLICT (meeting_id, user_id) 
          DO UPDATE SET status = ${status}
          RETURNING *;
        `;
        console.log(`  ✅ RSVP created with ${status}: ${rsvp.id}`);
      } catch (error) {
        console.log(`  ❌ RSVP failed with ${status}: ${error.message}`);
      }
    }
    
    // Cleanup
    await sql`DELETE FROM meeting_rsvps WHERE meeting_id = ${testMeeting.id}`;
    await sql`DELETE FROM meetings WHERE id = ${testMeeting.id}`;
    await sql`DELETE FROM groups WHERE id = ${testGroup.id}`;
    await sql`DELETE FROM users WHERE id = ${testUser.id}`;
    
    console.log('\n🎉 RSVP enum test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

testRsvpFix();
