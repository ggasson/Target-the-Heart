// Quick Enum Test - Tests all enum-related functionality
import 'dotenv/config';
import postgres from 'postgres';

const NEON_DB_URL = 'postgresql://neondb_owner:npg_2PGLSyHBsDU9@ep-billowing-salad-a9ha2x2i-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = postgres(NEON_DB_URL);

async function quickEnumTest() {
  console.log('⚡ QUICK ENUM TEST - Testing all enum issues we fixed\n');
  
  let testUser, testGroup, testMeeting;
  
  try {
    // 1. Test Prayer Categories
    console.log('🔍 Testing Prayer Categories...');
    const prayerCategories = ['health_healing', 'family_relationships', 'work_career', 'spiritual_growth', 'financial_provision', 'other'];
    
    for (const category of prayerCategories) {
      const result = await sql`SELECT ${category}::prayer_category as test_value`;
      console.log(`  ✅ ${category}: ${result[0].test_value}`);
    }
    
    // 2. Test RSVP Statuses  
    console.log('\n🔍 Testing RSVP Statuses...');
    const rsvpStatuses = ['attending', 'not_attending', 'maybe'];
    
    for (const status of rsvpStatuses) {
      const result = await sql`SELECT ${status}::rsvp_status as test_value`;
      console.log(`  ✅ ${status}: ${result[0].test_value}`);
    }
    
    // 3. Create test data
    console.log('\n🔍 Creating test data...');
    
    const [user] = await sql`
      INSERT INTO users (email, first_name, last_name)
      VALUES ('enum-test@example.com', 'Enum', 'Test')
      RETURNING *;
    `;
    testUser = user;
    console.log(`  ✅ User created: ${user.id}`);
    
    const [group] = await sql`
      INSERT INTO groups (name, description, admin_id)
      VALUES ('Enum Test Group', 'Testing enums', ${user.id})
      RETURNING *;
    `;
    testGroup = group;
    console.log(`  ✅ Group created: ${group.id}`);
    
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 1);
    
    const [meeting] = await sql`
      INSERT INTO meetings (title, description, group_id, meeting_date, created_by, status)
      VALUES ('Enum Test Meeting', 'Testing meeting', ${group.id}, ${meetingDate.toISOString()}, ${user.id}, 'scheduled')
      RETURNING *;
    `;
    testMeeting = meeting;
    console.log(`  ✅ Meeting created: ${meeting.id}`);
    
    // 4. Test Prayer Request Creation with Each Category
    console.log('\n🔍 Testing Prayer Request Creation...');
    
    for (const category of prayerCategories) {
      const [prayer] = await sql`
        INSERT INTO prayer_requests (title, description, category, author_id, group_id)
        VALUES (${`Test ${category}`}, 'Testing enum category', ${category}, ${user.id}, ${group.id})
        RETURNING *;
      `;
      console.log(`  ✅ Prayer created with ${category}: ${prayer.id}`);
    }
    
    // 5. Test RSVP Creation with Each Status
    console.log('\n🔍 Testing RSVP Creation...');
    
    for (let i = 0; i < rsvpStatuses.length; i++) {
      const status = rsvpStatuses[i];
      
      // Create a user for each RSVP status
      const [rsvpUser] = await sql`
        INSERT INTO users (email, first_name, last_name)
        VALUES (${`rsvp-${status}@example.com`}, ${`RSVP`}, ${status})
        RETURNING *;
      `;
      
      const [rsvp] = await sql`
        INSERT INTO meeting_rsvps (meeting_id, user_id, status, guest_count)
        VALUES (${meeting.id}, ${rsvpUser.id}, ${status}, ${i})
        RETURNING *;
      `;
      console.log(`  ✅ RSVP created with ${status}: ${rsvp.id}`);
    }
    
    // 6. Test Complex Queries
    console.log('\n🔍 Testing Complex Queries...');
    
    // Prayer requests with categories
    const prayers = await sql`
      SELECT pr.*, u.first_name, u.last_name
      FROM prayer_requests pr
      INNER JOIN users u ON pr.author_id = u.id
      WHERE pr.group_id = ${group.id}
      ORDER BY pr.category
    `;
    console.log(`  ✅ Found ${prayers.length} prayer requests with categories`);
    
    // Meeting with RSVP counts
    const meetingWithRsvps = await sql`
      SELECT 
        m.*,
        COUNT(CASE WHEN mr.status = 'attending' THEN 1 END) as attending_count,
        COUNT(CASE WHEN mr.status = 'not_attending' THEN 1 END) as not_attending_count,
        COUNT(CASE WHEN mr.status = 'maybe' THEN 1 END) as maybe_count
      FROM meetings m
      LEFT JOIN meeting_rsvps mr ON m.id = mr.meeting_id
      WHERE m.id = ${meeting.id}
      GROUP BY m.id
    `;
    console.log(`  ✅ Meeting RSVP counts: attending=${meetingWithRsvps[0].attending_count}, not_attending=${meetingWithRsvps[0].not_attending_count}, maybe=${meetingWithRsvps[0].maybe_count}`);
    
    // 7. Cleanup
    console.log('\n🗑️ Cleaning up...');
    await sql`DELETE FROM meeting_rsvps WHERE meeting_id = ${meeting.id}`;
    await sql`DELETE FROM prayer_requests WHERE group_id = ${group.id}`;
    await sql`DELETE FROM meetings WHERE id = ${meeting.id}`;
    await sql`DELETE FROM groups WHERE id = ${group.id}`;
    await sql`DELETE FROM users WHERE email LIKE '%enum-test%' OR email LIKE '%rsvp-%'`;
    console.log('  ✅ Cleanup complete');
    
    console.log('\n🎉 ALL ENUM TESTS PASSED! 🎉');
    console.log('✅ Prayer categories work perfectly');
    console.log('✅ RSVP statuses work perfectly');
    console.log('✅ Database operations work perfectly');
    console.log('✅ Complex queries work perfectly');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    // Cleanup on failure
    if (testMeeting) {
      try {
        await sql`DELETE FROM meeting_rsvps WHERE meeting_id = ${testMeeting.id}`;
        await sql`DELETE FROM meetings WHERE id = ${testMeeting.id}`;
      } catch (cleanupError) {}
    }
    if (testGroup) {
      try {
        await sql`DELETE FROM prayer_requests WHERE group_id = ${testGroup.id}`;
        await sql`DELETE FROM groups WHERE id = ${testGroup.id}`;
      } catch (cleanupError) {}
    }
    if (testUser) {
      try {
        await sql`DELETE FROM users WHERE email LIKE '%enum-test%' OR email LIKE '%rsvp-%'`;
      } catch (cleanupError) {}
    }
  } finally {
    await sql.end();
  }
}

quickEnumTest();
