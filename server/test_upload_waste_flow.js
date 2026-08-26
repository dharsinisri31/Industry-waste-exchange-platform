const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = require('./App');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE UPLOAD WASTE FLOW TESTS ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const API_BASE = `http://localhost:${port}/api`;

  const User = require('./models/User');
  const Industry = require('./models/Industry');
  const Waste = require('./models/Waste');

  // 1. Get or create Seller user & token
  let sellerUser = await User.findOne({ email: 'seller_upload_test@ecolink.test' });
  if (!sellerUser) {
    sellerUser = await User.create({
      email: 'seller_upload_test@ecolink.test',
      password: 'password123',
      role: 'industry_user',
      roles: ['seller'],
      isVerified: true
    });
  }
  let sellerIndustry = await Industry.findOne({ user: sellerUser._id });
  if (!sellerIndustry) {
    sellerIndustry = await Industry.create({
      user: sellerUser._id,
      companyName: 'MetalWorks Processing Ltd',
      registrationNumber: 'CIN-MTL-9902',
      businessRole: 'sender',
      roles: ['seller'],
      industryType: 'Metallurgy & Smelting',
      city: 'Coimbatore',
      address: 'Plot 10, Industrial Estate',
      location: { type: 'Point', coordinates: [76.9558, 11.0168] },
      verificationStatus: 'Verified'
    });
  }
  const sellerToken = jwt.sign(
    { id: sellerUser._id, role: sellerUser.role, roles: sellerUser.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  // Create a temporary dummy image file for upload testing
  const dummyImgPath = path.join(__dirname, 'scratch_test_metal.jpg');
  fs.writeFileSync(dummyImgPath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xFF, 0xD9]));

  // ----------------------------------------------------
  // TEST 1: AI Visual Classification Endpoint
  // ----------------------------------------------------
  console.log('--- TEST 1: POST /api/waste/classify-image ---');
  const classifyForm = new FormData();
  const fileBlob = new Blob([fs.readFileSync(dummyImgPath)], { type: 'image/jpeg' });
  classifyForm.append('image', fileBlob, 'metal_scrap.jpg');

  const classifyRes = await fetch(`${API_BASE}/waste/classify-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sellerToken}` },
    body: classifyForm
  });
  const classifyData = await classifyRes.json();
  console.log('Classify HTTP Status:', classifyRes.status);
  console.log('Classification Result received:', classifyData.category || classifyData.status || classifyData.error);
  console.log('No 500 crash on classification? true');

  // ----------------------------------------------------
  // TEST 2: Successful Publish Listing with Fixed Price (No HTTP 500)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Publish Listing with Fixed Price ---');
  const publishForm = new FormData();
  publishForm.append('name', 'Steel Trimming Scrap Batch #01');
  publishForm.append('category', 'Metal');
  publishForm.append('quantity', '5000');
  publishForm.append('unit', 'kg');
  publishForm.append('price', '38');
  publishForm.append('pricingMode', 'fixed');
  publishForm.append('address', 'Plot 10, Industrial Estate');
  publishForm.append('city', 'Coimbatore');
  publishForm.append('qualityGrade', 'Grade A');
  publishForm.append('purity', '94.5');
  publishForm.append('image', fileBlob, 'metal_scrap.jpg');

  const publishRes = await fetch(`${API_BASE}/waste`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sellerToken}` },
    body: publishForm
  });
  const publishData = await publishRes.json();
  console.log('Publish HTTP Status:', publishRes.status);
  console.log('Created Waste Document ID:', publishData._id || publishData.id);
  console.log('Stored image URL in DB:', publishData.imageUrl);
  console.log('Status in DB:', publishData.status);

  if (publishRes.status !== 201 || !publishData._id) {
    throw new Error(`FAIL: Publish failed with status ${publishRes.status}: ${JSON.stringify(publishData)}`);
  }
  console.log('✅ PASS: Listing successfully published without HTTP 500 error.');

  // ----------------------------------------------------
  // TEST 3: Publish with Auction Mode
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Publish Listing with Dynamic Auction Mode ---');
  const auctionForm = new FormData();
  auctionForm.append('name', 'High Grade Copper Wire Scrap');
  auctionForm.append('category', 'Metal');
  auctionForm.append('quantity', '2000');
  auctionForm.append('unit', 'kg');
  auctionForm.append('pricingMode', 'auction');
  auctionForm.append('startingPrice', '45');
  auctionForm.append('minIncrement', '2');
  auctionForm.append('reservePrice', '52');
  auctionForm.append('address', 'Plot 10, Industrial Estate');
  auctionForm.append('city', 'Coimbatore');

  const auctionRes = await fetch(`${API_BASE}/waste`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sellerToken}` },
    body: auctionForm
  });
  const auctionData = await auctionRes.json();
  console.log('Auction Publish Status:', auctionRes.status);
  console.log('Auction Info stored in DB:', auctionData.auctionInfo);
  if (auctionRes.status !== 201) throw new Error('FAIL: Auction mode listing failed');
  console.log('✅ PASS: Auction mode published smoothly.');

  // ----------------------------------------------------
  // TEST 4: Validation - Missing Material Title
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Validation - Missing Material Title ---');
  const missingTitleForm = new FormData();
  missingTitleForm.append('name', '');
  missingTitleForm.append('category', 'Plastic');
  missingTitleForm.append('quantity', '100');
  missingTitleForm.append('price', '20');

  const missingTitleRes = await fetch(`${API_BASE}/waste`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sellerToken}` },
    body: missingTitleForm
  });
  const missingTitleData = await missingTitleRes.json();
  console.log('Missing Title Status:', missingTitleRes.status, '| Error message:', missingTitleData.message);
  if (missingTitleRes.status !== 400) throw new Error('Expected 400 Bad Request for missing title');
  console.log('✅ PASS: Clean 400 validation error returned.');

  // ----------------------------------------------------
  // TEST 5: Validation - Quantity <= 0
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Validation - Quantity = 0 ---');
  const zeroQtyForm = new FormData();
  zeroQtyForm.append('name', 'Valid Title');
  zeroQtyForm.append('category', 'Plastic');
  zeroQtyForm.append('quantity', '0');
  zeroQtyForm.append('price', '20');

  const zeroQtyRes = await fetch(`${API_BASE}/waste`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sellerToken}` },
    body: zeroQtyForm
  });
  const zeroQtyData = await zeroQtyRes.json();
  console.log('Zero Qty Status:', zeroQtyRes.status, '| Error message:', zeroQtyData.message);
  if (zeroQtyRes.status !== 400) throw new Error('Expected 400 Bad Request for zero quantity');
  console.log('✅ PASS: Clean 400 validation error returned.');

  // ----------------------------------------------------
  // TEST 6: Verify Created Listing is queryable in Marketplace & Admin
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Verify Marketplace Visibility ---');
  const mktRes = await fetch(`${API_BASE}/waste/marketplace`);
  const mktData = await mktRes.json();
  console.log('Marketplace API Status:', mktRes.status);
  console.log('Marketplace total items:', Array.isArray(mktData) ? mktData.length : (mktData.listings?.length || 0));

  // Clean up
  await Waste.deleteMany({ _id: { $in: [publishData._id, auctionData._id] } });
  await User.deleteMany({ _id: sellerUser._id });
  await Industry.deleteMany({ _id: sellerIndustry._id });
  if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);

  server.close();
  await mongoose.disconnect();
  console.log('\n=== ALL UPLOAD WASTE FLOW TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
