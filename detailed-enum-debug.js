import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function detailedEnumDebug() {
  console.log('🔍 DETAILED enum debugging...\n');
  
  try {
    // Get ALL enum types that contain 'prayer_category'
    const allPrayerEnums = await sql`
      SELECT 
        t.typname as enum_name,
        t.oid,
        n.nspname as schema_name,
        e.enumlabel as enum_value,
        e.enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname LIKE '%prayer%' OR t.typname LIKE '%category%'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    console.log('📊 ALL prayer/category related enums:');
    allPrayerEnums.forEach(row => {
      console.log(`  ${row.schema_name}.${row.enum_name} (OID: ${row.oid}): "${row.enum_value}"`);
    });
    
    // Check prayer_requests table structure
    console.log('\n🔍 Checking prayer_requests table structure...');
    const tableInfo = await sql`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'prayer_requests' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 prayer_requests columns:');
    tableInfo.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name}) default: ${col.column_default}`);
    });
    
    // Try to insert a test value
    console.log('\n🧪 Testing direct enum insertion...');
    try {
      const testResult = await sql`
        SELECT 'health_healing'::prayer_category as test_value;
      `;
      console.log('✅ Direct enum cast works:', testResult[0].test_value);
    } catch (enumError) {
      console.error('❌ Direct enum cast failed:', enumError.message);
    }
    
    // Check for any constraints
    console.log('\n🔍 Checking constraints on prayer_requests...');
    const constraints = await sql`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        consrc as constraint_source
      FROM pg_constraint 
      WHERE conrelid = 'prayer_requests'::regclass;
    `;
    
    console.log('🔒 Constraints:');
    constraints.forEach(con => {
      console.log(`  ${con.constraint_name} (${con.constraint_type}): ${con.constraint_source}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

detailedEnumDebug();
