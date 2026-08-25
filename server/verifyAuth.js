const path = require('path');
require('dotenv').config();

const app = require('./App');
const mongoose = require('mongoose');
const User = require('./models/User');
const Industry = require('./models/Industry');
const Admin = require('./models/Admin');

const TEST_PORT = 5055;
let server;

async function runTests() {
  console.log('=== Starting Authentication Module Integration Tests ===');

  // Connect to MongoDB
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waste_exchange';
    await mongoose.connect(mongoUri);
    console.log('[DB] Connected to MongoDB for testing.');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }

  // Clear existing test entries if they exist
  const testEmail = 'test_industry@company.com';
  const adminEmail = 'test_admin@company.com';
  await User.deleteOne({ email: testEmail });
  await User.deleteOne({ email: adminEmail });
  await Industry.deleteOne({ registrationNumber: 'REG-TEST-123' });
  await Admin.deleteOne({ fullName: 'Test Administrator' });
  console.log('[Cleanup] Cleared old test user profiles.');

  // Start Express HTTP Server
  server = app.listen(TEST_PORT, () => {
    console.log(`[Server] Running test server on port ${TEST_PORT}`);
  });

  try {
    // 1. Test Industry Registration
    console.log('\n--- 1. Testing Industry Registration ---');
    const registerPayload = {
      email: testEmail,
      password: 'securePassword123',
      companyName: 'Test Industry Inc',
      registrationNumber: 'REG-TEST-123',
      address: '456 Eco Avenue',
      city: 'Eco City',
      coordinates: [77.5946, 12.9716], // [lng, lat]
      contactPhone: '+1-555-987-6543',
      industryType: 'Chemical',
      description: 'Test waste producer'
    };

    const regResponse = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/register-industry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });

        const regData = await regResponse.json();
    console.log('Status:', regResponse.status);
    console.log('Response Role:', regData.user?.role);
    console.log('Response Company Name:', regData.profile?.companyName);
    
    if (regResponse.status !== 201 || regData.user?.role !== 'industry_user') {
      console.error('Detailed Server Error:', JSON.stringify(regData, null, 2));
      throw new Error('Industry registration failed');
    }
    console.log('Pass: Industry successfully registered and models linked.');

    // 2. Test Duplicate Registration Prevention
    console.log('\n--- 2. Testing Duplicate Registration Prevention ---');
    const dupResponse = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/register-industry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });

    const dupData = await dupResponse.json();
    console.log('Status:', dupResponse.status);
    console.log('Response Message:', dupData.message);
    if (dupResponse.status !== 400) {
      throw new Error('Allowed duplicate registration!');
    }
    console.log('Pass: Correctly blocked duplicate registration.');

    // 3. Test Invalid Credentials Login
    console.log('\n--- 3. Testing Login Failure ---');
    const loginFailRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'wrongPassword' })
    });
    console.log('Status:', loginFailRes.status);
    if (loginFailRes.status !== 401) {
      throw new Error('Allowed login with invalid credentials');
    }
    console.log('Pass: Correctly rejected invalid login.');

    // 4. Test Valid Login & Token Receipt
    console.log('\n--- 4. Testing Valid Login ---');
    const loginRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'securePassword123' })
    });

    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Access Token Received:', !!loginData.accessToken);
    console.log('Cookie Header Set:', loginRes.headers.get('set-cookie'));
    
    if (loginRes.status !== 200 || !loginData.accessToken) {
      throw new Error('Login failed');
    }
    console.log('Pass: Logged in and tokens returned.');

    const token = loginData.accessToken;

    // 5. Test Protected Route Access
    console.log('\n--- 5. Testing Protected Route (/api/auth/me) ---');
    const meRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const meData = await meRes.json();
    console.log('Status:', meRes.status);
    console.log('Session User Email:', meData.user?.email);
    console.log('Session Profile Company:', meData.profile?.companyName);
    if (meRes.status !== 200 || meData.user?.email !== testEmail) {
      throw new Error('Failed to retrieve current user session details');
    }
    console.log('Pass: Authenticated route accessed successfully.');

    // 6. Test Admin Registration and Secret Check
    console.log('\n--- 6. Testing Admin Registration ---');
    const adminPayload = {
      email: adminEmail,
      password: 'adminPassword123',
      fullName: 'Test Administrator',
      phone: '+1-555-111-2222',
      adminSecret: 'admin_secret_key_ideathon_2026'
    };

    const adminRegRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminPayload)
    });

    const adminRegData = await adminRegRes.json();
    console.log('Status:', adminRegRes.status);
    console.log('Admin Role:', adminRegData.user?.role);
    console.log('Admin Name:', adminRegData.profile?.fullName);
    if (adminRegRes.status !== 201 || adminRegData.user?.role !== 'admin') {
      throw new Error('Admin registration failed');
    }
    console.log('Pass: Admin profile registered and authenticated successfully.');

    // 7. Clean up database entries
    console.log('\n--- 7. Cleaning up DB logs ---');
    await User.deleteOne({ email: testEmail });
    await User.deleteOne({ email: adminEmail });
    await Industry.deleteOne({ registrationNumber: 'REG-TEST-123' });
    await Admin.deleteOne({ fullName: 'Test Administrator' });
    console.log('[Cleanup] Test database entries removed.');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n!!! TEST RUN ENCOUNTERED AN ERROR !!!');
    console.error(error.message);
  } finally {
    // Shutdown server and Mongoose connection
    if (server) {
      server.close();
      console.log('[Server] Stopped test server.');
    }
    await mongoose.connection.close();
    console.log('[DB] Closed MongoDB connection.');
    process.exit(0);
  }
}

runTests();
