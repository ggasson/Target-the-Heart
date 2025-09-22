import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function productionEnumCheck() {
  console.log('🔍 PRODUCTION DATABASE ENUM CHECK...\n');
  
  try {
    // Check what DATABASE_URL we're actually connecting to
    console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    // Get the exact enum values from production database
    console.log('📊 Production enum values:');
    const enumValues = await sql`
      SELECT enumlabel, enumsortorder
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'prayer_category'
      ORDER BY e.enumsortorder;
    `;
    
    console.log('prayer_category enum in production:');
    enumValues.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.enumlabel}" (order: ${row.enumsortorder})`);
    });
    
    // Try each enum value directly
    console.log('\n🧪 Testing each enum value directly:');
    for (const enumRow of enumValues) {
      try {
        const testResult = await sql`SELECT ${enumRow.enumlabel}::prayer_category as test_value`;
        console.log(`✅ "${enumRow.enumlabel}": WORKS`);
      } catch (error) {
        console.log(`❌ "${enumRow.enumlabel}": FAILS - ${error.message}`);
      }
    }
    
    // Test the specific value that's failing
    console.log('\n🎯 Testing "health_healing" specifically:');
    try {
      const healthTest = await sql`SELECT 'health_healing'::prayer_category as test_value`;
      console.log(`✅ "health_healing" direct cast: ${healthTest[0].test_value}`);
    } catch (error) {
      console.log(`❌ "health_healing" direct cast FAILED: ${error.message}`);
    }
    
    // Check for any hidden characters or encoding issues
    console.log('\n🔍 Checking for encoding issues:');
    const rawEnumData = await sql`
      SELECT 
        enumlabel,
        length(enumlabel) as char_length,
        octet_length(enumlabel) as byte_length,
        ascii(substring(enumlabel from 1 for 1)) as first_char_ascii
      FROM pg_type t 
      JOIN pg_enum e on t.oid = e.enumtypid  
      WHERE t.typname = 'prayer_category'
      AND enumlabel = 'health_healing';
    `;
    
    if (rawEnumData.length > 0) {
      console.log('health_healing enum analysis:', rawEnumData[0]);
    } else {
      console.log('❌ "health_healing" not found in enum!');
    }
    
    // Check if there are multiple prayer_category enums
    console.log('\n🔍 Checking for multiple prayer_category types:');
    const multipleEnums = await sql`
      SELECT 
        t.typname,
        t.oid,
        n.nspname as schema_name,
        COUNT(e.enumlabel) as value_count
      FROM pg_type t 
      LEFT JOIN pg_enum e on t.oid = e.enumtypid  
      LEFT JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE t.typname LIKE '%prayer%'
      GROUP BY t.typname, t.oid, n.nspname
      ORDER BY t.typname;
    `;
    
    console.log('Prayer-related types in database:');
    multipleEnums.forEach(type => {
      console.log(`  ${type.schema_name}.${type.typname} (OID: ${type.oid}) - ${type.value_count} values`);
    });
    
  } catch (error) {
    console.error('❌ Production check failed:', error);
  } finally {
    await sql.end();
  }
}

productionEnumCheck();
