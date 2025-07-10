const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');

    // Test 2: Check if tables exist
    console.log('\n2. Checking if tables exist...');
    
    const tables = ['courses', 'modules', 'lessons', 'assignments'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' does not exist or is not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }

    // Test 3: Check table schemas
    console.log('\n3. Checking table schemas...');
    
    // Check courses table
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .limit(1);
      
      if (!error && courses.length > 0) {
        console.log('✅ Courses table schema:', Object.keys(courses[0]));
      }
    } catch (err) {
      console.log('❌ Error checking courses schema:', err.message);
    }

    // Check modules table
    try {
      const { data: modules, error } = await supabase
        .from('modules')
        .select('*')
        .limit(1);
      
      if (!error && modules.length > 0) {
        console.log('✅ Modules table schema:', Object.keys(modules[0]));
      }
    } catch (err) {
      console.log('❌ Error checking modules schema:', err.message);
    }

    // Check lessons table
    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .limit(1);
      
      if (!error && lessons.length > 0) {
        console.log('✅ Lessons table schema:', Object.keys(lessons[0]));
      }
    } catch (err) {
      console.log('❌ Error checking lessons schema:', err.message);
    }

    // Check assignments table
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .limit(1);
      
      if (!error && assignments.length > 0) {
        console.log('✅ Assignments table schema:', Object.keys(assignments[0]));
      }
    } catch (err) {
      console.log('❌ Error checking assignments schema:', err.message);
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabaseConnection(); 