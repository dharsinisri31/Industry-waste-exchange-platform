const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Industry = require('./models/Industry');
const Admin = require('./models/Admin');

const TEST_PORT = 5088;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runDashboardBugFixVerification() {
  console.log('=== Starting Dashboard Blank Screen Bug Fix Verification ===');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecolink';
  await mongoose.connect(mongoUri);
  console.log('[DB] Connected to MongoDB.');

  const app = require('./App');
  const server = app.listen(TEST_PORT, () => {
    console.log(`[Server] Bug fix test server running on port ${TEST_PORT}`);
  });

  try {
    // 1. Setup Seller Account
    await User.deleteOne({ email: 'test_seller@ecolink.com' });
    await Industry.deleteOne({ companyName: 'Test Seller Industry' });
    
    const sellerUser = await User.create({
      email: 'test_seller@ecolink.com',
      password: 'password123',
      role: 'industry_user',
      isVerified: true
    });
    const sellerProfile = await Industry.create({
      user: sellerUser._id,
      companyName: 'Test Seller Industry',
      registrationNumber: 'REG-TEST-001',
      businessRole: 'sender',
      contactPhone: '+91-9876543210',
      address: '123 Producer Way',
      city: 'Coimbatore',
      location: { type: 'Point', coordinates: [76.9558, 11.0168] },
      industryType: 'Metallurgy'
    });

    // 2. Setup Buyer Account
    await User.deleteOne({ email: 'test_buyer@ecolink.com' });
    await Industry.deleteOne({ companyName: 'Test Buyer Industry' });

    const buyerUser = await User.create({
      email: 'test_buyer@ecolink.com',
      password: 'password123',
      role: 'industry_user',
      isVerified: true
    });
    const buyerProfile = await Industry.create({
      user: buyerUser._id,
      companyName: 'Test Buyer Industry',
      registrationNumber: 'REG-TEST-002',
      businessRole: 'receiver',
      contactPhone: '+91-9876543211',
      address: '456 Recycler Way',
      city: 'Tiruppur',
      location: { type: 'Point', coordinates: [77.3411, 11.1085] },
      industryType: 'Plastic Recycling'
    });

    // 3. Setup Admin Account
    await User.deleteOne({ email: 'test_admin@ecolink.com' });
    await Admin.deleteOne({ fullName: 'Test Platform Admin' });

    const adminUser = await User.create({
      email: 'test_admin@ecolink.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });
    const adminProfile = await Admin.create({
      user: adminUser._id,
      fullName: 'Test Platform Admin',
      phone: '+91-9876543210'
    });

    console.log('✓ All 3 test accounts seeded successfully.');

    // 4. Test Seller Login & Canonical Role
    const sellerLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test_seller@ecolink.com',
      password: 'password123'
    });
    console.log('✓ Seller Login Succeeded:', {
      role: sellerLogin.data.user.role,
      canonicalRole: sellerLogin.data.user.canonicalRole,
      name: sellerLogin.data.user.name,
      industryId: sellerLogin.data.user.industryId
    });
    if (sellerLogin.data.user.canonicalRole !== 'SELLER') {
      throw new Error(`Expected canonicalRole SELLER, got ${sellerLogin.data.user.canonicalRole}`);
    }

    // 5. Test Seller Dashboard API
    const sellerAuth = { headers: { Authorization: `Bearer ${sellerLogin.data.accessToken}` } };
    const sellerDash = await axios.get(`${BASE_URL}/api/industry/dashboard`, sellerAuth);
    console.log('✓ Seller Dashboard Data API:', {
      uploadedWasteCount: sellerDash.data.metrics.uploadedWasteCount,
      carbonSaved: sellerDash.data.metrics.carbonSaved,
      revenue: sellerDash.data.metrics.revenue,
      nearbyCount: sellerDash.data.nearbyIndustries.length
    });

    // 6. Test Buyer Login & Canonical Role
    const buyerLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test_buyer@ecolink.com',
      password: 'password123'
    });
    console.log('✓ Buyer Login Succeeded:', {
      role: buyerLogin.data.user.role,
      canonicalRole: buyerLogin.data.user.canonicalRole,
      name: buyerLogin.data.user.name
    });
    if (buyerLogin.data.user.canonicalRole !== 'BUYER') {
      throw new Error(`Expected canonicalRole BUYER, got ${buyerLogin.data.user.canonicalRole}`);
    }

    // 7. Test Admin Login & Canonical Role
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test_admin@ecolink.com',
      password: 'password123'
    });
    console.log('✓ Admin Login Succeeded:', {
      role: adminLogin.data.user.role,
      canonicalRole: adminLogin.data.user.canonicalRole
    });
    if (adminLogin.data.user.canonicalRole !== 'ADMIN') {
      throw new Error(`Expected canonicalRole ADMIN, got ${adminLogin.data.user.canonicalRole}`);
    }

    // 8. Test Admin Summary API
    const adminAuth = { headers: { Authorization: `Bearer ${adminLogin.data.accessToken}` } };
    const adminSummary = await axios.get(`${BASE_URL}/api/admin/summary`, adminAuth);
    console.log('✓ Admin Summary API Status:', adminSummary.status);

    console.log('=== ALL DASHBOARD BUG FIX VERIFICATION TESTS PASSED ===');
  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await User.deleteMany({ email: { $in: ['test_seller@ecolink.com', 'test_buyer@ecolink.com', 'test_admin@ecolink.com'] } });
    await Industry.deleteMany({ companyName: { $in: ['Test Seller Industry', 'Test Buyer Industry'] } });
    await Admin.deleteMany({ fullName: 'Test Platform Admin' });
    server.close();
    await mongoose.connection.close();
  }
}

runDashboardBugFixVerification();
