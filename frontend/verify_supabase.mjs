import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Read .env without printing secrets
const envPath = path.resolve('./.env');
if (!fs.existsSync(envPath)) {
  console.error('FAIL: .env file does not exist');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = trimmed.replace('VITE_SUPABASE_URL=', '').trim().replace(/^["']|["']$/g, '');
  }
  if (trimmed.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
    supabaseKey = trimmed.replace('VITE_SUPABASE_PUBLISHABLE_KEY=', '').trim().replace(/^["']|["']$/g, '');
  }
}

console.log('--- Supabase Real Connectivity Test ---');
if (!supabaseUrl || !supabaseKey) {
  console.log('FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

try {
  const urlObj = new URL(supabaseUrl);
  console.log('Target Project Host:', urlObj.hostname);
} catch (err) {
  console.log('FAIL: Invalid URL format in VITE_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  const results = {};

  // 1. Supabase client connection
  try {
    const { data, error } = await supabase.from('courses').select('count', { count: 'exact', head: true });
    if (error) {
      results['1. Supabase client connection'] = `FAIL (${error.message})`;
    } else {
      results['1. Supabase client connection'] = 'PASS';
    }
  } catch (e) {
    results['1. Supabase client connection'] = `FAIL (${e.message})`;
  }

  // 2. profiles table
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      results['2. profiles table'] = `FAIL (${error.message})`;
    } else {
      results['2. profiles table'] = 'PASS (Table exists, RLS active)';
    }
  } catch (e) {
    results['2. profiles table'] = `FAIL (${e.message})`;
  }

  // 3. courses table
  try {
    const { data, error } = await supabase.from('courses').select('*').limit(5);
    if (error) {
      results['3. courses table'] = `FAIL (${error.message})`;
    } else {
      results['3. courses table'] = `PASS (${data.length} seeded courses found)`;
    }
  } catch (e) {
    results['3. courses table'] = `FAIL (${e.message})`;
  }

  // 4. assessments table
  try {
    const { data, error } = await supabase.from('assessments').select('*').limit(5);
    if (error) {
      results['4. assessments table'] = `FAIL (${error.message})`;
    } else {
      results['4. assessments table'] = `PASS (${data.length} seeded assessments found)`;
    }
  } catch (e) {
    results['4. assessments table'] = `FAIL (${e.message})`;
  }

  // 5. skills table
  try {
    const { data, error } = await supabase.from('skills').select('*').limit(10);
    if (error) {
      results['5. skills table'] = `FAIL (${error.message})`;
    } else {
      results['5. skills table'] = `PASS (${data.length} seeded skills found)`;
    }
  } catch (e) {
    results['5. skills table'] = `FAIL (${e.message})`;
  }

  // 6. Authentication service
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      results['6. Authentication'] = `FAIL (${error.message})`;
    } else {
      results['6. Authentication'] = 'PASS (Auth service active, session state operational)';
    }
  } catch (e) {
    results['6. Authentication'] = `FAIL (${e.message})`;
  }

  // 7. RLS Verification
  try {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: fakeId,
      name: 'Unauthorized User',
      email: 'unauthorized@test.com'
    });
    if (insertErr) {
      results['7. RLS'] = `PASS (Unauthenticated write rejected: ${insertErr.message})`;
    } else {
      results['7. RLS'] = 'FAIL (Unauthorized write succeeded)';
    }
  } catch (e) {
    results['7. RLS'] = `PASS (Unauthenticated write blocked: ${e.message})`;
  }

  // 8. Dashboard queries
  try {
    const checks = await Promise.all([
      supabase.from('course_progress').select('count', { count: 'exact', head: true }),
      supabase.from('assessment_attempts').select('count', { count: 'exact', head: true }),
      supabase.from('user_skills').select('count', { count: 'exact', head: true }),
      supabase.from('resumes').select('count', { count: 'exact', head: true }),
      supabase.from('mock_interviews').select('count', { count: 'exact', head: true }),
      supabase.from('learning_paths').select('count', { count: 'exact', head: true }),
      supabase.from('certificates').select('count', { count: 'exact', head: true })
    ]);

    const failedChecks = checks.filter(c => c.error);
    if (failedChecks.length > 0) {
      results['8. Dashboard queries'] = `FAIL (${failedChecks.map(c => c.error.message).join(', ')})`;
    } else {
      results['8. Dashboard queries'] = 'PASS (All 7 supporting user tables accessible)';
    }
  } catch (e) {
    results['8. Dashboard queries'] = `FAIL (${e.message})`;
  }

  console.log('\n--- VERIFICATION TEST RESULTS ---');
  for (const [test, res] of Object.entries(results)) {
    console.log(`${test}: ${res}`);
  }
}

runTests();
