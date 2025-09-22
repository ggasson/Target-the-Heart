// Test direct INSERT into Neon database
import postgres from 'postgres';

const NEON_DB_URL = 'postgresql://neondb_owner:npg_2PGLSyHBsDU9@ep-billowing-salad-a9ha2x2i-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = postgres(NEON_DB_URL);

async function testNeonInsert() {
  console.log('🧪 TESTING DIRECT INSERT INTO NEON DATABASE...\n');
  
  try {
    // First, let's create a test user and group in Neon
    console.log('🔍 Step 1: Creating test user...');
    
    const [testUser] = await sql`
      INSERT INTO users (email, first_name, last_name)
      VALUES ('test-neon@example.com', 'Test', 'Neon')
      RETURNING id, email;
    `;
    
    console.log('✅ Test user created:', testUser);
    
    console.log('\n🔍 Step 2: Creating test group...');
    
    const [testGroup] = await sql`
      INSERT INTO groups (name, description, admin_id)
      VALUES ('Test Neon Group', 'Testing in Neon', ${testUser.id})
      RETURNING id, name;
    `;
    
    console.log('✅ Test group created:', testGroup);
    
    console.log('\n🔍 Step 3: Testing prayer request insert with health_healing...');
    
    // Test the exact INSERT that's failing
    const testData = {
      title: 'Test Prayer Neon',
      description: 'Testing in Neon database',
      category: 'health_healing',
      author_id: testUser.id,
      group_id: testGroup.id
    };
    
    console.log('Inserting prayer request:', testData);
    
    const [prayerResult] = await sql`
      INSERT INTO prayer_requests (title, description, category, author_id, group_id)
      VALUES (${testData.title}, ${testData.description}, ${testData.category}, ${testData.author_id}, ${testData.group_id})
      RETURNING *;
    `;
    
    console.log('✅ Prayer request created successfully:', {
      id: prayerResult.id,
      title: prayerResult.title,
      category: prayerResult.category
    });
    
    // Test other categories
    console.log('\n🔍 Step 4: Testing other categories...');
    const otherCategories = ['family_relationships', 'work_career', 'spiritual_growth', 'financial_provision', 'other'];
    
    for (const category of otherCategories) {
      try {
        const [categoryResult] = await sql`
          INSERT INTO prayer_requests (title, description, category, author_id, group_id)
          VALUES (${`Test ${category}`}, 'Testing category', ${category}, ${testUser.id}, ${testGroup.id})
          RETURNING id, category;
        `;
        console.log(`✅ ${category}: SUCCESS - ${categoryResult.id}`);
      } catch (categoryError) {
        console.log(`❌ ${category}: FAILED - ${categoryError.message}`);
      }
    }
    
    // Clean up
    console.log('\n🗑️ Cleaning up test data...');
    await sql`DELETE FROM prayer_requests WHERE author_id = ${testUser.id}`;
    await sql`DELETE FROM groups WHERE id = ${testGroup.id}`;
    await sql`DELETE FROM users WHERE id = ${testUser.id}`;
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await sql.end();
  }
}

testNeonInsert();
