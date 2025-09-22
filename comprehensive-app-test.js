// Comprehensive Test Suite for Target The Heart App
import 'dotenv/config';
import postgres from 'postgres';

// Your Neon database URL
const NEON_DB_URL = 'postgresql://neondb_owner:npg_2PGLSyHBsDU9@ep-billowing-salad-a9ha2x2i-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = postgres(NEON_DB_URL);

// Your app URL (update this to your actual Vercel URL)
const APP_URL = 'https://target-the-heart.vercel.app'; // Update this!

class AppTester {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testResults = [];
  }

  async test(name, testFunction) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      await testFunction();
      console.log(`✅ PASS: ${name}`);
      this.passed++;
      this.testResults.push({ name, status: 'PASS' });
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.failed++;
      this.testResults.push({ name, status: 'FAIL', error: error.message });
    }
  }

  async apiRequest(method, endpoint, data = null, requireAuth = false) {
    const url = `${APP_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (requireAuth) {
      // For testing purposes, we'll skip auth for now
      // In a real test, you'd get a valid Firebase token
      options.headers['Authorization'] = 'Bearer test-token';
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url);
    return {
      status: response.status,
      data: response.status !== 204 ? await response.json() : null,
    };
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    console.log(`🏆 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
    }
    
    console.log('\n✅ PASSED TESTS:');
    this.testResults
      .filter(r => r.status === 'PASS')
      .forEach(result => {
        console.log(`  - ${result.name}`);
      });
  }
}

async function runAllTests() {
  const tester = new AppTester();
  let testUser, testGroup, testMeeting;

  console.log('🚀 STARTING COMPREHENSIVE APP TESTS...\n');
  console.log(`🌐 App URL: ${APP_URL}`);
  console.log(`🗄️ Database: Neon PostgreSQL`);

  // =============================================================================
  // 1. DATABASE TESTS
  // =============================================================================
  
  await tester.test('Database Connection', async () => {
    const result = await sql`SELECT 1 as test`;
    if (result[0].test !== 1) throw new Error('Connection failed');
  });

  await tester.test('All Enum Values - prayer_category', async () => {
    const categories = ['health_healing', 'family_relationships', 'work_career', 'spiritual_growth', 'financial_provision', 'other'];
    for (const category of categories) {
      const result = await sql`SELECT ${category}::prayer_category as test_value`;
      if (result[0].test_value !== category) throw new Error(`${category} failed`);
    }
  });

  await tester.test('All Enum Values - rsvp_status', async () => {
    const statuses = ['attending', 'not_attending', 'maybe'];
    for (const status of statuses) {
      const result = await sql`SELECT ${status}::rsvp_status as test_value`;
      if (result[0].test_value !== status) throw new Error(`${status} failed`);
    }
  });

  await tester.test('All Tables Exist', async () => {
    const tables = ['users', 'groups', 'group_memberships', 'prayer_requests', 'prayer_responses', 'chat_messages', 'meetings', 'meeting_rsvps', 'notifications', 'group_invitations'];
    for (const table of tables) {
      const result = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table})`;
      if (!result[0].exists) throw new Error(`Table ${table} does not exist`);
    }
  });

  // =============================================================================
  // 2. API ENDPOINT TESTS
  // =============================================================================

  await tester.test('Daily Verse API', async () => {
    const result = await tester.apiRequest('GET', '/api/daily-verse?q=John+3:16');
    if (result.status !== 200) throw new Error(`Status: ${result.status}`);
    if (!result.data.text) throw new Error('No verse text returned');
  });

  await tester.test('Debug Database Endpoint', async () => {
    const result = await tester.apiRequest('GET', '/api/debug/database');
    if (result.status !== 200) throw new Error(`Status: ${result.status}`);
    if (!result.data.success) throw new Error('Debug test failed');
  });

  // =============================================================================
  // 3. DATABASE CRUD OPERATIONS
  // =============================================================================

  await tester.test('Create Test User', async () => {
    const [user] = await sql`
      INSERT INTO users (email, first_name, last_name)
      VALUES ('comprehensive-test@example.com', 'Test', 'User')
      RETURNING *;
    `;
    testUser = user;
    if (!user.id) throw new Error('User creation failed');
  });

  await tester.test('Create Test Group', async () => {
    const [group] = await sql`
      INSERT INTO groups (name, description, admin_id)
      VALUES ('Comprehensive Test Group', 'Auto-generated test group', ${testUser.id})
      RETURNING *;
    `;
    testGroup = group;
    if (!group.id) throw new Error('Group creation failed');
  });

  await tester.test('Create Group Membership', async () => {
    const [membership] = await sql`
      INSERT INTO group_memberships (group_id, user_id, status, role)
      VALUES (${testGroup.id}, ${testUser.id}, 'approved', 'admin')
      RETURNING *;
    `;
    if (!membership.id) throw new Error('Membership creation failed');
  });

  await tester.test('Create Prayer Requests - All Categories', async () => {
    const categories = ['health_healing', 'family_relationships', 'work_career', 'spiritual_growth', 'financial_provision', 'other'];
    for (const category of categories) {
      const [prayer] = await sql`
        INSERT INTO prayer_requests (title, description, category, author_id, group_id)
        VALUES (${`Test ${category} Prayer`}, 'Comprehensive test prayer', ${category}, ${testUser.id}, ${testGroup.id})
        RETURNING *;
      `;
      if (!prayer.id) throw new Error(`Prayer creation failed for ${category}`);
    }
  });

  await tester.test('Create Test Meeting', async () => {
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 7); // Next week
    
    const [meeting] = await sql`
      INSERT INTO meetings (title, description, group_id, meeting_date, created_by, status)
      VALUES ('Test Meeting', 'Comprehensive test meeting', ${testGroup.id}, ${meetingDate.toISOString()}, ${testUser.id}, 'scheduled')
      RETURNING *;
    `;
    testMeeting = meeting;
    if (!meeting.id) throw new Error('Meeting creation failed');
  });

  await tester.test('Create Meeting RSVPs - All Statuses', async () => {
    const statuses = ['attending', 'not_attending', 'maybe'];
    for (let i = 0; i < statuses.length; i++) {
      // Create additional users for different RSVP statuses
      const [rsvpUser] = await sql`
        INSERT INTO users (email, first_name, last_name)
        VALUES (${`rsvp-test-${i}@example.com`}, ${`RSVP${i}`}, 'User')
        RETURNING *;
      `;
      
      const [rsvp] = await sql`
        INSERT INTO meeting_rsvps (meeting_id, user_id, status, guest_count)
        VALUES (${testMeeting.id}, ${rsvpUser.id}, ${statuses[i]}, ${i})
        RETURNING *;
      `;
      if (!rsvp.id) throw new Error(`RSVP creation failed for ${statuses[i]}`);
    }
  });

  await tester.test('Create Chat Message', async () => {
    const [message] = await sql`
      INSERT INTO chat_messages (group_id, user_id, content, message_type, status)
      VALUES (${testGroup.id}, ${testUser.id}, 'Test chat message', 'text', 'approved')
      RETURNING *;
    `;
    if (!message.id) throw new Error('Chat message creation failed');
  });

  await tester.test('Create Notification', async () => {
    const [notification] = await sql`
      INSERT INTO notifications (user_id, type, title, message, related_group_id)
      VALUES (${testUser.id}, 'general', 'Test Notification', 'Comprehensive test notification', ${testGroup.id})
      RETURNING *;
    `;
    if (!notification.id) throw new Error('Notification creation failed');
  });

  // =============================================================================
  // 4. COMPLEX QUERIES (Similar to app logic)
  // =============================================================================

  await tester.test('Get User Groups with Memberships', async () => {
    const result = await sql`
      SELECT g.*, gm.role, gm.status
      FROM groups g
      INNER JOIN group_memberships gm ON g.id = gm.group_id
      WHERE gm.user_id = ${testUser.id} AND gm.status = 'approved'
    `;
    if (result.length === 0) throw new Error('No groups found for user');
  });

  await tester.test('Get Group Prayer Requests with Authors', async () => {
    const result = await sql`
      SELECT pr.*, u.first_name, u.last_name
      FROM prayer_requests pr
      INNER JOIN users u ON pr.author_id = u.id
      WHERE pr.group_id = ${testGroup.id}
      ORDER BY pr.created_at DESC
    `;
    if (result.length === 0) throw new Error('No prayer requests found');
  });

  await tester.test('Get Meeting with RSVP Counts', async () => {
    const result = await sql`
      SELECT 
        m.*,
        COUNT(CASE WHEN mr.status = 'attending' THEN 1 END) as attending_count,
        COUNT(CASE WHEN mr.status = 'not_attending' THEN 1 END) as not_attending_count,
        COUNT(CASE WHEN mr.status = 'maybe' THEN 1 END) as maybe_count
      FROM meetings m
      LEFT JOIN meeting_rsvps mr ON m.id = mr.meeting_id
      WHERE m.id = ${testMeeting.id}
      GROUP BY m.id
    `;
    if (result.length === 0) throw new Error('Meeting with RSVP counts not found');
  });

  await tester.test('Get Upcoming Meetings', async () => {
    const now = new Date();
    const result = await sql`
      SELECT m.*, g.name as group_name
      FROM meetings m
      INNER JOIN groups g ON m.group_id = g.id
      INNER JOIN group_memberships gm ON g.id = gm.group_id
      WHERE gm.user_id = ${testUser.id}
        AND gm.status = 'approved'
        AND m.meeting_date >= ${now.toISOString()}
        AND m.status = 'scheduled'
      ORDER BY m.meeting_date ASC
    `;
    if (result.length === 0) throw new Error('No upcoming meetings found');
  });

  // =============================================================================
  // 5. CLEANUP
  // =============================================================================

  await tester.test('Cleanup Test Data', async () => {
    // Clean up in reverse order of dependencies
    await sql`DELETE FROM notifications WHERE user_id = ${testUser.id}`;
    await sql`DELETE FROM chat_messages WHERE group_id = ${testGroup.id}`;
    await sql`DELETE FROM meeting_rsvps WHERE meeting_id = ${testMeeting.id}`;
    await sql`DELETE FROM meetings WHERE group_id = ${testGroup.id}`;
    await sql`DELETE FROM prayer_responses WHERE prayer_request_id IN (
      SELECT id FROM prayer_requests WHERE group_id = ${testGroup.id}
    )`;
    await sql`DELETE FROM prayer_requests WHERE group_id = ${testGroup.id}`;
    await sql`DELETE FROM group_memberships WHERE group_id = ${testGroup.id}`;
    await sql`DELETE FROM groups WHERE id = ${testGroup.id}`;
    await sql`DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%rsvp-test%'`;
  });

  // =============================================================================
  // 6. FRONTEND TESTS (Basic connectivity)
  // =============================================================================

  await tester.test('Frontend App Loads', async () => {
    const response = await fetch(APP_URL);
    if (response.status !== 200) throw new Error(`Status: ${response.status}`);
    const html = await response.text();
    if (!html.includes('Target The Heart') && !html.includes('root')) {
      throw new Error('App HTML does not contain expected content');
    }
  });

  await tester.test('Static Assets Load', async () => {
    const response = await fetch(`${APP_URL}/target-symbol.png`);
    if (response.status !== 200) throw new Error(`Logo not found: ${response.status}`);
  });

  // Print final summary
  await sql.end();
  tester.printSummary();

  if (tester.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your app is working perfectly! 🎉');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
