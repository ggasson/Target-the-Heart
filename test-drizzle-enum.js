import 'dotenv/config';
import { db } from './server/db.js';
import { prayerRequests, users, groups } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testDrizzleEnum() {
  console.log('🧪 Testing Drizzle enum handling...\n');
  
  try {
    // First, let's create a test user and group
    console.log('🔍 Step 1: Creating test user and group...');
    
    const [testUser] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      })
      .returning();
    
    console.log('✅ Test user created:', testUser.id);
    
    const [testGroup] = await db
      .insert(groups)
      .values({
        name: 'Test Group',
        description: 'Test Description',
        adminId: testUser.id
      })
      .returning();
    
    console.log('✅ Test group created:', testGroup.id);
    
    // Now test the prayer request with enum
    console.log('\n🔍 Step 2: Testing prayer request with health_healing...');
    
    const testPrayerData = {
      title: 'Test Prayer',
      description: 'Test description',
      category: 'health_healing', // This should work
      authorId: testUser.id,
      groupId: testGroup.id
    };
    
    console.log('Attempting Drizzle insert with:', testPrayerData);
    
    const [newPrayer] = await db
      .insert(prayerRequests)
      .values(testPrayerData)
      .returning();
    
    console.log('✅ Drizzle insert successful:', newPrayer);
    
    // Test different categories
    console.log('\n🔍 Step 3: Testing all enum categories with Drizzle...');
    const categories = ['family_relationships', 'work_career', 'spiritual_growth', 'financial_provision', 'other'];
    
    for (const category of categories) {
      try {
        const [categoryPrayer] = await db
          .insert(prayerRequests)
          .values({
            title: `Test ${category}`,
            description: 'Test description',
            category,
            authorId: testUser.id,
            groupId: testGroup.id
          })
          .returning();
        
        console.log(`✅ ${category}: SUCCESS - ${categoryPrayer.id}`);
      } catch (categoryError) {
        console.log(`❌ ${category}: FAILED - ${categoryError.message}`);
      }
    }
    
    // Clean up
    console.log('\n🗑️ Cleaning up test data...');
    
    // Delete prayer requests
    await db.delete(prayerRequests).where(eq(prayerRequests.authorId, testUser.id));
    
    // Delete group
    await db.delete(groups).where(eq(groups.id, testGroup.id));
    
    // Delete user
    await db.delete(users).where(eq(users.id, testUser.id));
    
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Drizzle test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDrizzleEnum();
