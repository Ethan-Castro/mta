// Simple test script to check database connection and table
import { sql } from './lib/db.ts';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const healthCheck = await sql`SELECT 1 as test`;
    console.log('Health check:', healthCheck);
    
    // Test if cuny_campus_locations table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cuny_campus_locations'
      ) as exists
    `;
    console.log('Table exists:', tableExists);
    
    // Test querying the table
    const campuses = await sql`SELECT DISTINCT campus FROM cuny_campus_locations LIMIT 5`;
    console.log('Sample campuses:', campuses);
    
    // Test the exact query that's failing
    const testQuery = await sql.unsafe('SELECT DISTINCT campus FROM cuny_campus_locations LIMIT 5');
    console.log('Unsafe query result:', testQuery);
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();
