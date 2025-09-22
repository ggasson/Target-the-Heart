import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function addUniqueConstraint() {
  try {
    console.log('🔍 Checking existing constraints on meeting_rsvps table...');
    
    // Check existing constraints
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'meeting_rsvps' 
      AND constraint_type = 'UNIQUE';
    `;
    
    console.log('📋 Current unique constraints on meeting_rsvps:');
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
    // Check if we need to add the constraint
    const hasMeetingUserConstraint = constraints.some(c => 
      c.constraint_name.includes('meeting_id') && c.constraint_name.includes('user_id')
    );
    
    if (!hasMeetingUserConstraint) {
      console.log('🔧 Adding unique constraint on (meeting_id, user_id)...');
      await sql`
        ALTER TABLE meeting_rsvps 
        ADD CONSTRAINT meeting_rsvps_meeting_id_user_id_unique 
        UNIQUE (meeting_id, user_id);
      `;
      console.log('✅ Unique constraint added successfully!');
    } else {
      console.log('✅ Unique constraint already exists!');
    }
    
  } catch (error) {
    console.error('❌ Error checking/adding unique constraint:', error);
  } finally {
    await sql.end();
  }
}

addUniqueConstraint();
