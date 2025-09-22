import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function checkAllEnums() {
  console.log('🔍 Checking all enum definitions in database...\n');
  
  try {
    // Get all enum types in the database
    const enums = await sql`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value,
        e.enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    // Group by enum name
    const enumsByName = {};
    enums.forEach(row => {
      if (!enumsByName[row.enum_name]) {
        enumsByName[row.enum_name] = [];
      }
      enumsByName[row.enum_name].push(row.enum_value);
    });
    
    console.log('📊 Database enum values:');
    Object.entries(enumsByName).forEach(([name, values]) => {
      console.log(`\n${name}:`);
      values.forEach(value => console.log(`  - "${value}"`));
    });
    
    console.log('\n🔍 Schema enum definitions:');
    console.log('\ngroup_audience: ["men_only", "women_only", "coed"]');
    console.log('group_purpose: ["prayer", "bible_study", "fellowship", "youth", "marriage_couples", "recovery_healing", "outreach_service", "other"]');
    console.log('membership_status: ["pending", "approved", "rejected"]');
    console.log('member_role: ["member", "admin", "moderator"]');
    console.log('prayer_status: ["active", "answered", "closed"]');
    console.log('prayer_category: ["health_healing", "family_relationships", "work_career", "spiritual_growth", "financial_provision", "other"]');
    console.log('message_status: ["pending", "approved", "rejected"]');
    console.log('meeting_status: ["scheduled", "cancelled", "completed"]');
    console.log('rsvp_status: ["yes", "no", "maybe"]');
    console.log('notification_type: ["meeting_reminder", "prayer_request", "rsvp_reminder", "meeting_update", "general"]');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkAllEnums();
