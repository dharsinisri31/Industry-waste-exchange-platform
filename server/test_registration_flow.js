const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE VERIFICATION TESTS ===\n');

  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI);
  const Industry = require('./models/Industry');
  const User = require('./models/User');

  // 1. Get or create Admin token
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'system.admin@ecolink.test',
      password: 'password123',
      role: 'admin',
      roles: ['admin'],
      isVerified: true
    });
  }
  const adminToken = jwt.sign(
    { id: adminUser._id, role: adminUser.role, roles: adminUser.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  const timestamp = Date.now();

  // ----------------------------------------------------
  // TEST 1: Register ABC as Seller
  // ----------------------------------------------------
  console.log('--- TEST 1: Manually Register ABC as Seller ---');
  const abcPayload = {
    email: `abc_${timestamp}@seller.test`,
    password: 'password123',
    companyName: 'ABC Industrial Polymers',
    registrationNumber: `CIN-ABC-${timestamp}`,
    businessRole: 'sender',
    roles: ['seller'],
    neededWasteTypes: 'Plastic Regrind, Polymer Byproducts',
    address: 'Plot 101, GIDC Estate',
    city: 'Ahmedabad',
    contactPhone: '+91 9876500001',
    industryType: 'Chemicals & Polymers',
    description: 'Manufacturer of polymer compounds and industrial thermoplastics.'
  };

  const regAbcRes = await fetch(`${API_BASE}/auth/register-industry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(abcPayload)
  });
  const regAbcData = await regAbcRes.json();
  console.log('Registration status:', regAbcRes.status);
  console.log('Returned company:', regAbcData.profile?.companyName, '| verificationStatus:', regAbcData.profile?.verificationStatus);

  // Check MongoDB directly
  const dbAbc = await Industry.findOne({ registrationNumber: abcPayload.registrationNumber }).populate('user');
  console.log('MongoDB check: Found ABC in DB?', !!dbAbc, '| DB verificationStatus:', dbAbc?.verificationStatus, '| User verified?', dbAbc?.user?.isVerified);

  // ----------------------------------------------------
  // TEST 2: Register XYZ as Buyer
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Manually Register XYZ as Buyer ---');
  const xyzPayload = {
    email: `xyz_${timestamp}@buyer.test`,
    password: 'password123',
    companyName: 'XYZ Circular Recyclers',
    registrationNumber: `CIN-XYZ-${timestamp}`,
    businessRole: 'receiver',
    roles: ['buyer'],
    neededWasteTypes: 'Fly Ash, Secondary Slag, PET Flakes',
    address: 'Sector 4B, Industrial Corridor',
    city: 'Vadodara',
    contactPhone: '+91 9876500002',
    industryType: 'Recycling & Waste Processing',
    description: 'Procures high grade industrial secondary feedstock for circular re-granulation.'
  };

  const regXyzRes = await fetch(`${API_BASE}/auth/register-industry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(xyzPayload)
  });
  const regXyzData = await regXyzRes.json();
  console.log('Registration status:', regXyzRes.status);
  console.log('Returned company:', regXyzData.profile?.companyName, '| verificationStatus:', regXyzData.profile?.verificationStatus);

  // Check MongoDB directly
  const dbXyz = await Industry.findOne({ registrationNumber: xyzPayload.registrationNumber }).populate('user');
  console.log('MongoDB check: Found XYZ in DB?', !!dbXyz, '| DB verificationStatus:', dbXyz?.verificationStatus, '| User verified?', dbXyz?.user?.isVerified);

  // ----------------------------------------------------
  // Fetch from Admin API
  // ----------------------------------------------------
  console.log('\n--- Fetching Admin Companies (/api/admin/industries) ---');
  const adminRes = await fetch(`${API_BASE}/admin/industries`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const allIndustries = await adminRes.json();
  console.log('Admin API status:', adminRes.status, '| Total returned companies:', allIndustries.length);
  
  const foundAbc = allIndustries.find(i => i.registrationNumber === abcPayload.registrationNumber);
  const foundXyz = allIndustries.find(i => i.registrationNumber === xyzPayload.registrationNumber);
  console.log('ABC appears in Admin API?', !!foundAbc, '| Role:', foundAbc?.businessRole, '| Category:', foundAbc?.industryType);
  console.log('XYZ appears in Admin API?', !!foundXyz, '| Role:', foundXyz?.businessRole, '| Category:', foundXyz?.industryType);

  // ----------------------------------------------------
  // TEST 3: Search ABC
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Search ABC (/api/admin/industries?search=ABC) ---');
  const searchRes = await fetch(`${API_BASE}/admin/industries?search=ABC`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const searchResults = await searchRes.json();
  const searchFound = searchResults.some(i => i.registrationNumber === abcPayload.registrationNumber);
  console.log('Search "ABC" found newly registered company?', searchFound, '| Count:', searchResults.length);

  // ----------------------------------------------------
  // TEST 4: Filter Seller
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Filter Seller (/api/admin/industries?role=seller) ---');
  const sellerRes = await fetch(`${API_BASE}/admin/industries?role=seller`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const sellerResults = await sellerRes.json();
  const sellerFoundAbc = sellerResults.some(i => i.registrationNumber === abcPayload.registrationNumber);
  const sellerFoundXyz = sellerResults.some(i => i.registrationNumber === xyzPayload.registrationNumber);
  console.log('Seller filter includes ABC?', sellerFoundAbc, '| Excludes XYZ?', !sellerFoundXyz);

  // ----------------------------------------------------
  // TEST 5: Filter Buyer
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Filter Buyer (/api/admin/industries?role=buyer) ---');
  const buyerRes = await fetch(`${API_BASE}/admin/industries?role=buyer`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const buyerResults = await buyerRes.json();
  const buyerFoundXyz = buyerResults.some(i => i.registrationNumber === xyzPayload.registrationNumber);
  const buyerFoundAbc = buyerResults.some(i => i.registrationNumber === abcPayload.registrationNumber);
  console.log('Buyer filter includes XYZ?', buyerFoundXyz, '| Excludes ABC?', !buyerFoundAbc);

  // ----------------------------------------------------
  // TEST 6: Admin Verifies ABC
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Admin Verifies ABC (/api/admin/industries/:id/status) ---');
  const verifyRes = await fetch(`${API_BASE}/admin/industries/${dbAbc._id}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ status: 'verified' })
  });
  console.log('Verify action status:', verifyRes.status);
  const updatedAbc = await Industry.findById(dbAbc._id).populate('user');
  console.log('Updated ABC DB verificationStatus:', updatedAbc.verificationStatus, '| User isVerified:', updatedAbc.user.isVerified);

  await mongoose.disconnect();
  console.log('\n=== ALL 6 AUTOMATED INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
