const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = require('./App');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=== RUNNING SELLER MY WASTE LISTINGS & MARKETPLACE FLOW TESTS ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const API_BASE = `http://localhost:${port}/api`;

  const User = require('./models/User');
  const Industry = require('./models/Industry');
  const Waste = require('./models/Waste');

  // Create temporary test image
  const dummyImgPath = path.join(__dirname, 'scratch_seller_test.jpg');
  fs.writeFileSync(dummyImgPath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xFF, 0xD9]));
  const fileBlob = new Blob([fs.readFileSync(dummyImgPath)], { type: 'image/jpeg' });

  // 1. Setup Seller A
  let sellerA = await User.findOne({ email: 'seller_a_test@ecolink.test' });
  if (!sellerA) {
    sellerA = await User.create({
      email: 'seller_a_test@ecolink.test',
      password: 'password123',
      role: 'industry_user',
      roles: ['seller'],
      isVerified: true
    });
  }
  let industryA = await Industry.findOne({ user: sellerA._id });
  if (!industryA) {
    industryA = await Industry.create({
      user: sellerA._id,
      companyName: 'Apex Polymers Corp (Seller A)',
      registrationNumber: 'CIN-APEX-001',
      businessRole: 'sender',
      roles: ['seller'],
      industryType: 'Chemicals & Polymers',
      city: 'Coimbatore',
      address: 'Plot 10, Industrial Estate',
      location: { type: 'Point', coordinates: [76.9558, 11.0168] },
      verificationStatus: 'Verified'
    });
  }
  const tokenA = jwt.sign(
    { id: sellerA._id, role: sellerA.role, roles: sellerA.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  // 2. Setup Seller B
  let sellerB = await User.findOne({ email: 'seller_b_test@ecolink.test' });
  if (!sellerB) {
    sellerB = await User.create({
      email: 'seller_b_test@ecolink.test',
      password: 'password123',
      role: 'industry_user',
      roles: ['seller'],
      isVerified: true
    });
  }
  let industryB = await Industry.findOne({ user: sellerB._id });
  if (!industryB) {
    industryB = await Industry.create({
      user: sellerB._id,
      companyName: 'Beta Plastics Ltd (Seller B)',
      registrationNumber: 'CIN-BETA-002',
      businessRole: 'sender',
      roles: ['seller'],
      industryType: 'Manufacturing',
      city: 'Salem',
      address: 'Plot 25, SIDCO Estate',
      location: { type: 'Point', coordinates: [78.1460, 11.6643] },
      verificationStatus: 'Verified'
    });
  }
  const tokenB = jwt.sign(
    { id: sellerB._id, role: sellerB.role, roles: sellerB.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  // 3. Setup Buyer
  let buyerUser = await User.findOne({ email: 'buyer_mkt_test@ecolink.test' });
  if (!buyerUser) {
    buyerUser = await User.create({
      email: 'buyer_mkt_test@ecolink.test',
      password: 'password123',
      role: 'industry_user',
      roles: ['buyer'],
      isVerified: true
    });
  }
  const buyerToken = jwt.sign(
    { id: buyerUser._id, role: buyerUser.role, roles: buyerUser.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  // 4. Setup Admin
  let adminUser = await User.findOne({ email: 'admin_test@ecolink.test' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'admin_test@ecolink.test',
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

  // Clean old test wastes for A & B
  await Waste.deleteMany({ uploader: { $in: [sellerA._id, sellerB._id] } });

  // ----------------------------------------------------
  // TEST 1: Seller A uploads PET Plastic Scrap
  // ----------------------------------------------------
  console.log('--- TEST 1: Seller A uploads PET Plastic Scrap ---');
  const formA = new FormData();
  formA.append('name', 'PET Flakes Batch Seller A');
  formA.append('category', 'Plastic');
  formA.append('quantity', '3000');
  formA.append('unit', 'kg');
  formA.append('price', '28');
  formA.append('pricingMode', 'fixed');
  formA.append('address', 'Plot 10, Industrial Estate');
  formA.append('city', 'Coimbatore');
  formA.append('image', fileBlob, 'pet_scrap_a.jpg');

  const resA = await fetch(`${API_BASE}/waste`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formA
  });
  const dataA = await resA.json();
  console.log('Seller A Upload Status:', resA.status, '| Waste ID:', dataA._id);
  console.log('Seller A Stored Image:', dataA.imageUrl);

  // ----------------------------------------------------
  // TEST 2: Seller B uploads HDPE Plastic Scrap
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Seller B uploads HDPE Plastic Scrap ---');
  const formB = new FormData();
  formB.append('name', 'HDPE Regrind Batch Seller B');
  formB.append('category', 'Plastic');
  formB.append('quantity', '5000');
  formB.append('unit', 'kg');
  formB.append('price', '32');
  formB.append('pricingMode', 'fixed');
  formB.append('address', 'Plot 25, SIDCO Estate');
  formB.append('city', 'Salem');
  formB.append('image', fileBlob, 'hdpe_scrap_b.jpg');

  const resB = await fetch(`${API_BASE}/waste`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` },
    body: formB
  });
  const dataB = await resB.json();
  console.log('Seller B Upload Status:', resB.status, '| Waste ID:', dataB._id);
  console.log('Seller B Stored Image:', dataB.imageUrl);

  // ----------------------------------------------------
  // TEST 3: Seller A queries "My Waste Listings" (GET /api/waste/my/listings)
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Seller A queries My Waste Listings ---');
  const myListingsResA = await fetch(`${API_BASE}/waste/my/listings`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const myListingsA = await myListingsResA.json();
  console.log('Seller A My Listings Count:', myListingsA.length);
  const sellerAIds = myListingsA.map(l => l._id.toString());
  const containsOwn = sellerAIds.includes(dataA._id.toString());
  const containsOther = sellerAIds.includes(dataB._id.toString());
  console.log('Contains Seller A item?', containsOwn);
  console.log('Contains Seller B item?', containsOther);

  if (!containsOwn || containsOther) {
    throw new Error('FAIL: Seller A My Listings data leakage or missing own listing!');
  }
  console.log('✅ PASS: Seller A sees ONLY their own uploaded waste stream.');

  // ----------------------------------------------------
  // TEST 4: Seller B queries "My Waste Listings" (GET /api/waste/my/listings)
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Seller B queries My Waste Listings ---');
  const myListingsResB = await fetch(`${API_BASE}/waste/my/listings`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const myListingsB = await myListingsResB.json();
  console.log('Seller B My Listings Count:', myListingsB.length);
  const sellerBIds = myListingsB.map(l => l._id.toString());
  console.log('Contains Seller B item?', sellerBIds.includes(dataB._id.toString()));
  console.log('Contains Seller A item?', sellerBIds.includes(dataA._id.toString()));

  if (!sellerBIds.includes(dataB._id.toString()) || sellerBIds.includes(dataA._id.toString())) {
    throw new Error('FAIL: Seller B My Listings data leakage or missing own listing!');
  }
  console.log('✅ PASS: Seller B sees ONLY their own uploaded waste stream.');

  // ----------------------------------------------------
  // TEST 5: Admin queries Waste Listings (Admin sees both A & B)
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Admin queries All Waste Listings ---');
  const adminRes = await fetch(`${API_BASE}/admin/waste-listings`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminData = await adminRes.json();
  const adminIds = adminData.map(l => l._id.toString());
  console.log('Admin total listings count:', adminData.length);
  console.log('Admin sees Seller A?', adminIds.includes(dataA._id.toString()));
  console.log('Admin sees Seller B?', adminIds.includes(dataB._id.toString()));

  if (!adminIds.includes(dataA._id.toString()) || !adminIds.includes(dataB._id.toString())) {
    throw new Error('FAIL: Admin cannot see all listings!');
  }
  console.log('✅ PASS: Admin views both Seller A and Seller B streams.');

  // ----------------------------------------------------
  // TEST 6: Approve both listings and test Buyer Marketplace
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Approve listings and test Buyer Marketplace ---');
  await Waste.updateOne({ _id: dataA._id }, { $set: { status: 'approved' } });
  await Waste.updateOne({ _id: dataB._id }, { $set: { status: 'approved' } });

  const mktRes = await fetch(`${API_BASE}/waste/marketplace`);
  const mktData = await mktRes.json();
  const mktIds = (mktData.listings || []).map(l => l._id.toString());
  console.log('Approved Marketplace total items:', mktIds.length);
  console.log('Approved Seller A in Marketplace?', mktIds.includes(dataA._id.toString()));
  console.log('Approved Seller B in Marketplace?', mktIds.includes(dataB._id.toString()));

  if (!mktIds.includes(dataA._id.toString()) || !mktIds.includes(dataB._id.toString())) {
    throw new Error('FAIL: Approved listings not visible in Marketplace!');
  }
  console.log('✅ PASS: Approved seller waste streams visible in Marketplace.');

  // Clean up
  await Waste.deleteMany({ _id: { $in: [dataA._id, dataB._id] } });
  await User.deleteMany({ _id: { $in: [sellerA._id, sellerB._id, buyerUser._id, adminUser._id] } });
  await Industry.deleteMany({ _id: { $in: [industryA._id, industryB._id] } });
  if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);

  server.close();
  await mongoose.disconnect();
  console.log('\n=== ALL SELLER LISTINGS FLOW TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
