async function test() {
  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  console.log('--- 1. Testing Admin Login with tuda2k4@gmail.com / 123456 ---');
  const res1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'tuda2k4@gmail.com', password: '123456' })
  });
  const data1 = await res1.json();
  assert(res1.status === 200, `Status is 200 (got ${res1.status})`);
  assert(data1.success === true, 'Success is true');
  assert(data1.isAdmin === true, 'isAdmin is true');
  assert(typeof data1.token === 'string' && data1.token.length > 10, 'Admin token returned');
  const adminToken = data1.token;

  console.log('--- 2. Verifying Admin Session Token via /api/auth/status ---');
  const res2 = await fetch(`${BASE_URL}/api/auth/status`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const data2 = await res2.json();
  assert(res2.status === 200, `Status is 200 (got ${res2.status})`);
  assert(data2.isLoggedInAdmin === true, 'isLoggedInAdmin is true');
  assert(data2.adminUser?.email === 'tuda2k4@gmail.com', `adminUser.email is tuda2k4@gmail.com (got ${data2.adminUser?.email})`);

  console.log('--- 3. Testing Protected Admin Endpoint /api/admin/stats with Admin Token ---');
  const res3 = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const data3 = await res3.json();
  assert(res3.status === 200, `Status is 200 (got ${res3.status})`);
  assert(typeof data3.totalLessons === 'number', `Total lessons returned (${data3.totalLessons})`);

  console.log('--- 4. Testing Regular Learner Login (mai.phuong@congsochuyennghiep.vn) ---');
  const res4 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'mai.phuong@congsochuyennghiep.vn', password: 'MatKhau@123' })
  });
  const data4 = await res4.json();
  assert(res4.status === 200, `Status is 200 (got ${res4.status})`);
  assert(data4.success === true, 'Success is true');
  assert(data4.isAdmin === false, 'isAdmin is false');
  assert(data4.token === null, 'Admin token is null');

  console.log('--- 5. Testing Protected Admin Endpoint without Token ---');
  const res5 = await fetch(`${BASE_URL}/api/admin/stats`);
  assert(res5.status === 401, `Status is 401 Unauthorized (got ${res5.status})`);

  console.log('--- 6. Testing /api/auth/admin-login rejection for Regular Learner ---');
  const res6 = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'mai.phuong@congsochuyennghiep.vn', password: 'MatKhau@123' })
  });
  const data6 = await res6.json();
  assert(res6.status === 403, `Status is 403 Forbidden for learner (got ${res6.status})`);

  console.log('--- 7. Testing Wrong Password Rejection ---');
  const res7 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'tuda2k4@gmail.com', password: 'sai_mat_khau_123' })
  });
  assert(res7.status === 401, `Status is 401 Unauthorized for wrong password (got ${res7.status})`);

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

test().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
