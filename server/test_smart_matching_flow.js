const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = require('./App');

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE SMART MATCHING FLOW TESTS ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const API_BASE = `http://localhost:${port}/api`;
  const Waste = require('./models/Waste');
  const BuyerRequirement = require('./models/BuyerRequirement');
  const User = require('./models/User');
  const Industry = require('./models/Industry');

  // Clean up any previous test entities
  await User.deleteMany({ email: { $in: ['abc_seller@smartmatch.test', 'xyz_buyer@smartmatch.test', 'incompat_seller@smartmatch.test'] } });
  await Industry.deleteMany({ companyName: { $in: ['ABC Polymers Corp', 'XYZ Circular Recyclers Ltd', 'Incompatible Sludge Co'] } });
  await Waste.deleteMany({ name: { $in: ['PET Plastic Scrap ABC', 'Incompatible Hazardous Sludge'] } });
  await BuyerRequirement.deleteMany({ material: 'PET Plastic Scrap XYZ' });

  // 1. Admin setup
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'system.admin@smartmatch.test',
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

  // ----------------------------------------------------
  // TEST 1: Register ABC as Seller without Waste Listing
  // ----------------------------------------------------
  console.log('--- TEST 1: Register ABC as Seller (No Waste Listing) ---');
  const abcUser = await User.create({
    email: 'abc_seller@smartmatch.test',
    password: 'password123',
    role: 'industry_user',
    roles: ['seller'],
    isVerified: true
  });
  const abcIndustry = await Industry.create({
    user: abcUser._id,
    companyName: 'ABC Polymers Corp',
    registrationNumber: 'CIN-ABC-9901',
    businessRole: 'sender',
    roles: ['seller'],
    industryType: 'Chemicals & Polymers',
    city: 'Coimbatore',
    address: 'Kurichi Industrial Estate',
    location: { type: 'Point', coordinates: [76.9558, 11.0168] },
    verificationStatus: 'Verified'
  });

  let res1 = await fetch(`${API_BASE}/admin/smart-matches`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  let matches1 = await res1.json();
  const abcInMatches1 = matches1.some(m => m.seller?.companyName === 'ABC Polymers Corp' || m.buyer?.companyName === 'ABC Polymers Corp');
  console.log('ABC registered as Seller without waste listing. ABC in Smart Matches?', abcInMatches1);
  if (abcInMatches1) throw new Error('FAIL: ABC appeared in Smart Matches without a Waste Listing!');
  console.log('✅ PASS: ABC does not appear in Smart Matching.');

  // ----------------------------------------------------
  // TEST 2: ABC creates Waste Listing (PET Plastic Scrap, 1000 kg, Coimbatore)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: ABC creates Waste Listing ---');
  const abcWaste = await Waste.create({
    uploader: abcUser._id,
    name: 'PET Plastic Scrap ABC',
    category: 'Plastic',
    quantity: 1000,
    unit: 'kg',
    price: 30,
    qualityGrade: 'Grade A',
    purity: { estimated: 95.0 },
    city: 'Coimbatore',
    address: 'Kurichi Industrial Estate',
    location: { type: 'Point', coordinates: [76.9558, 11.0168] },
    status: 'active'
  });
  console.log('ABC created active Waste Listing:', abcWaste._id, '| Name:', abcWaste.name);

  // ----------------------------------------------------
  // TEST 3: Register XYZ as Buyer without Material Requirement
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Register XYZ as Buyer (No Requirement) ---');
  const xyzUser = await User.create({
    email: 'xyz_buyer@smartmatch.test',
    password: 'password123',
    role: 'industry_user',
    roles: ['buyer'],
    isVerified: true
  });
  const xyzIndustry = await Industry.create({
    user: xyzUser._id,
    companyName: 'XYZ Circular Recyclers Ltd',
    registrationNumber: 'CIN-XYZ-8802',
    businessRole: 'receiver',
    roles: ['buyer'],
    industryType: 'Recycling & Waste Processing',
    city: 'Tiruppur',
    address: 'SIPCOT Industrial Park',
    location: { type: 'Point', coordinates: [77.3411, 11.1085] },
    verificationStatus: 'Verified'
  });

  let res3 = await fetch(`${API_BASE}/admin/smart-matches`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  let matches3 = await res3.json();
  const xyzInMatches3 = matches3.some(m => m.buyer?.companyName === 'XYZ Circular Recyclers Ltd');
  console.log('XYZ registered as Buyer without requirement. XYZ in Smart Matches?', xyzInMatches3);
  if (xyzInMatches3) throw new Error('FAIL: XYZ appeared in Smart Matches without a Material Requirement!');
  console.log('✅ PASS: XYZ does not appear in Smart Matching.');

  // ----------------------------------------------------
  // TEST 4: XYZ creates Material Requirement (PET Plastic Scrap, 500 kg, Tiruppur)
  // ----------------------------------------------------
  console.log('\n--- TEST 4: XYZ creates Material Requirement ---');
  const xyzReq = await BuyerRequirement.create({
    buyer: xyzUser._id,
    companyProfile: xyzIndustry._id,
    material: 'PET Plastic Scrap XYZ',
    category: 'Plastic',
    quantity: 500,
    unit: 'kg',
    maxPrice: 35,
    minPurity: 90.0,
    city: 'Tiruppur',
    address: 'SIPCOT Industrial Park',
    location: { type: 'Point', coordinates: [77.3411, 11.1085] },
    radiusKm: 150,
    status: 'active'
  });
  console.log('XYZ created active Requirement:', xyzReq._id, '| Material:', xyzReq.material);

  // ----------------------------------------------------
  // TEST 5: Smart Matching Engine evaluates ABC + XYZ
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Querying Smart Matching API for ABC + XYZ Match ---');
  let res5 = await fetch(`${API_BASE}/admin/smart-matches`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  let matches5 = await res5.json();
  console.log('Total Smart Matches returned from API:', matches5.length);

  const matchedPair = matches5.find(m => 
    m.seller?.companyName === 'ABC Polymers Corp' && 
    m.buyer?.companyName === 'XYZ Circular Recyclers Ltd'
  );

  console.log('Found ABC + XYZ Match in Smart Matching?', !!matchedPair);
  if (!matchedPair) throw new Error('FAIL: ABC + XYZ compatible match not found!');

  console.log('\n--- Match Data Verification ---');
  console.log('Material:', matchedPair.material);
  console.log('Overall Match Score:', matchedPair.overallScore + '%');
  console.log('Procuring Buyer:', matchedPair.buyer.companyName, `(${matchedPair.buyer.city})`);
  console.log('Matching Seller:', matchedPair.seller.companyName, `(${matchedPair.seller.city})`);
  console.log('Matched Quantity:', matchedPair.matchedQuantity);
  console.log('Transit Distance:', matchedPair.distanceKm);
  console.log('Breakdown:', matchedPair.breakdown);

  if (matchedPair.overallScore < 70) throw new Error('Expected high compatibility score for matching PET scrap!');

  // ----------------------------------------------------
  // TEST 6: Incompatible Seller Listing (Chemical Waste) vs XYZ Plastic Requirement
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Incompatible Seller Listing (Chemical Waste) ---');
  const incompatUser = await User.create({
    email: 'incompat_seller@smartmatch.test',
    password: 'password123',
    role: 'industry_user',
    roles: ['seller'],
    isVerified: true
  });
  const incompatIndustry = await Industry.create({
    user: incompatUser._id,
    companyName: 'Incompatible Sludge Co',
    registrationNumber: 'CIN-INCOMPAT-7703',
    businessRole: 'sender',
    roles: ['seller'],
    industryType: 'Chemicals & Polymers',
    address: 'Manali Industrial Area',
    city: 'Chennai',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    verificationStatus: 'Verified'
  });
  const incompatWaste = await Waste.create({
    uploader: incompatUser._id,
    name: 'Incompatible Hazardous Sludge',
    category: 'Chemical Waste',
    quantity: 8000,
    unit: 'kg',
    price: 90,
    qualityGrade: 'Grade D',
    purity: { estimated: 40.0 },
    city: 'Chennai',
    address: 'Manali Industrial Area',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
    status: 'active'
  });

  let res6 = await fetch(`${API_BASE}/admin/smart-matches`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  let matches6 = await res6.json();
  const incompatPair = matches6.find(m => 
    m.seller?.companyName === 'Incompatible Sludge Co' && 
    m.buyer?.companyName === 'XYZ Circular Recyclers Ltd'
  );
  console.log('Incompatible Sludge Co matched with XYZ Plastic Requirement?', !!incompatPair);
  if (incompatPair) throw new Error('FAIL: Incompatible stream was incorrectly matched!');
  console.log('✅ PASS: Incompatible streams are excluded from Smart Matching.');

  // Clean up
  await User.deleteMany({ _id: { $in: [abcUser._id, xyzUser._id, incompatUser._id] } });
  await Industry.deleteMany({ _id: { $in: [abcIndustry._id, xyzIndustry._id, incompatIndustry._id] } });
  await Waste.deleteMany({ _id: { $in: [abcWaste._id, incompatWaste._id] } });
  await BuyerRequirement.deleteMany({ _id: xyzReq._id });

  server.close();
  await mongoose.disconnect();
  console.log('\n=== ALL SMART MATCHING FLOW TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
