const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = require('./App');

async function runTests() {
  console.log('=== RUNNING CANONICAL CATEGORY VALIDATION & NORMALIZATION TESTS ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const API_BASE = `http://localhost:${port}/api`;

  const User = require('./models/User');
  const Industry = require('./models/Industry');
  const BuyerRequirement = require('./models/BuyerRequirement');
  const Waste = require('./models/Waste');

  // Setup Buyer
  let buyer = await User.findOne({ email: 'buyer_category_test@ecolink.test' });
  if (!buyer) {
    buyer = await User.create({
      email: 'buyer_category_test@ecolink.test',
      password: 'password123',
      role: 'industry_user',
      roles: ['buyer'],
      isVerified: true
    });
  }
  const buyerToken = jwt.sign(
    { id: buyer._id, role: buyer.role, roles: buyer.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  // Setup Seller
  let seller = await User.findOne({ email: 'seller_category_test@ecolink.test' });
  if (!seller) {
    seller = await User.create({
      email: 'seller_category_test@ecolink.test',
      password: 'password123',
      role: 'industry_user',
      roles: ['seller'],
      isVerified: true
    });
  }
  const sellerToken = jwt.sign(
    { id: seller._id, role: seller.role, roles: seller.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  // Clean old test entries
  await BuyerRequirement.deleteMany({ buyer: buyer._id });
  await Waste.deleteMany({ uploader: seller._id });

  // -------------------------------------------------------------------------
  // TEST 1: The exact case from user: Material "Steel Scrap" with Category "Metal Scrap"
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Create Buyer Requirement (Steel Scrap, Metal Scrap) ---');
  const res1 = await fetch(`${API_BASE}/buyer-requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`
    },
    body: JSON.stringify({
      material: 'steel scrap',
      category: 'Metal Scrap',
      quantity: 100,
      unit: 'kg',
      maxPrice: 45,
      city: 'Tiruppur',
      address: 'Plot 4, Industrial Area'
    })
  });

  const data1 = await res1.json();
  console.log('Status:', res1.status, '| Stored category:', data1.category);
  if (res1.status !== 201 || data1.category !== 'Metal Scrap') {
    throw new Error(`FAIL: Requirement creation failed: ${JSON.stringify(data1)}`);
  }
  console.log('✅ PASS: Buyer Requirement created successfully without enum error.\n');

  // -------------------------------------------------------------------------
  // TEST 2: Legacy input: Category sent as "Steel" (Automatic Normalization test)
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Legacy input category "Steel" automatically normalizes ---');
  const res2 = await fetch(`${API_BASE}/buyer-requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`
    },
    body: JSON.stringify({
      material: 'steel scrap',
      category: 'Steel',
      quantity: 200,
      unit: 'kg',
      maxPrice: 45,
      city: 'Tiruppur',
      address: 'Plot 4, Industrial Area'
    })
  });

  const data2 = await res2.json();
  console.log('Status:', res2.status, '| Normalized to:', data2.category);
  if (res2.status !== 201 || data2.category !== 'Metal Scrap') {
    throw new Error(`FAIL: Legacy "Steel" was not normalized: ${JSON.stringify(data2)}`);
  }
  console.log('✅ PASS: Legacy category "Steel" automatically normalized to "Metal Scrap".\n');

  // -------------------------------------------------------------------------
  // TEST 3: Test all 15 Required Materials across canonical categories
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Testing 15 canonical materials and categories ---');
  const testMaterials = [
    { material: 'Steel Scrap', category: 'Metal Scrap' },
    { material: 'Aluminium Scrap', category: 'Metal Scrap' },
    { material: 'Copper Scrap', category: 'Metal Scrap' },
    { material: 'HDPE Plastic Scrap', category: 'Plastic / Polymers' },
    { material: 'PET Plastic Scrap', category: 'Plastic / Polymers' },
    { material: 'Corrugated Cardboard', category: 'Paper & Cardboard' },
    { material: 'Cotton Textile Waste', category: 'Textiles' },
    { material: 'Glass Cullet', category: 'Glass' },
    { material: 'Electronic Component Scrap', category: 'E-Waste' },
    { material: 'Rubber Production Scrap', category: 'Rubber' },
    { material: 'Wood Pallets / Sawdust', category: 'Wood & Biomass' },
    { material: 'Agricultural Fibre Waste', category: 'Agricultural Waste' },
    { material: 'Chemical Byproducts', category: 'Chemical Byproducts' },
    { material: 'Industrial Slag', category: 'Industrial Slag' },
    { material: 'Thermal Fly Ash', category: 'Thermal Fly Ash' }
  ];

  for (const item of testMaterials) {
    const res = await fetch(`${API_BASE}/buyer-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        material: item.material,
        category: item.category,
        quantity: 500,
        unit: 'kg',
        maxPrice: 50,
        city: 'Coimbatore',
        address: 'SIDCO Industrial Estate'
      })
    });
    const doc = await res.json();
    if (res.status !== 201 || doc.category !== item.category) {
      throw new Error(`FAIL on ${item.material}: Expected ${item.category}, got status ${res.status}: ${JSON.stringify(doc)}`);
    }
    console.log(`  ✓ Material: "${item.material}" -> Category: "${doc.category}"`);
  }
  console.log('✅ PASS: All 15 canonical materials & categories verified.\n');

  // Clean up
  await BuyerRequirement.deleteMany({ buyer: buyer._id });
  await User.deleteMany({ _id: { $in: [buyer._id, seller._id] } });

  server.close();
  await mongoose.disconnect();
  console.log('=== ALL CATEGORY TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
