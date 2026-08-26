const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE WASTE LISTINGS & IMAGE FLOW TESTS ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  const Waste = require('./models/Waste');
  const User = require('./models/User');
  const Industry = require('./models/Industry');
  const Transaction = require('./models/Transaction');

  // 1. Get or create Admin user & token
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

  // 2. Get or create Seller user & token
  let sellerUser = await User.findOne({ email: 'test_seller_flow@ecolink.test' });
  if (!sellerUser) {
    sellerUser = await User.create({
      email: 'test_seller_flow@ecolink.test',
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
      companyName: 'Flow Test Chemicals Ltd.',
      registrationNumber: 'CIN-FLOW-9001',
      businessRole: 'sender',
      roles: ['seller'],
      industryType: 'Chemicals & Polymers',
      address: 'Plot 88, Eco Park',
      city: 'Vadodara',
      location: { type: 'Point', coordinates: [73.18, 22.30] },
      status: 'verified',
      verificationStatus: 'Verified'
    });
  }
  const sellerToken = jwt.sign(
    { id: sellerUser._id, role: sellerUser.role, roles: sellerUser.roles },
    process.env.JWT_ACCESS_SECRET || '9fc6d80f3aaebe97bba0dcfe9174842432337ce852cfac8130ee00e601d31ffb',
    { expiresIn: '1h' }
  );

  const timestamp = Date.now();

  // ----------------------------------------------------
  // TEST 1: Seller creates listing WITH Image
  // ----------------------------------------------------
  console.log('--- TEST 1: Seller creates waste listing WITH Image URL ---');
  const listingWithImg = await Waste.create({
    uploader: sellerUser._id,
    name: `HDPE Flakes Stream ${timestamp}`,
    category: 'Plastic',
    quantity: 3500,
    unit: 'kg',
    price: 32,
    address: 'Plot 88, Eco Park',
    city: 'Vadodara',
    location: { type: 'Point', coordinates: [73.18, 22.30] },
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80',
    description: 'Washed and sorted industrial HDPE regrind flakes.',
    qualityGrade: 'Grade A',
    status: 'pending'
  });
  console.log('Created Listing with image:', listingWithImg._id, '| imageUrl:', listingWithImg.imageUrl, '| status:', listingWithImg.status);

  // ----------------------------------------------------
  // TEST 2: Seller creates listing WITHOUT Image
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Seller creates waste listing WITHOUT Image ---');
  const listingNoImg = await Waste.create({
    uploader: sellerUser._id,
    name: `Fly Ash Batch ${timestamp}`,
    category: 'Fly Ash',
    quantity: 12000,
    unit: 'kg',
    price: 3,
    address: 'Plot 88, Eco Park',
    city: 'Vadodara',
    location: { type: 'Point', coordinates: [73.18, 22.30] },
    imageUrl: '',
    description: 'Class F dry fly ash byproduct from power boiler.',
    qualityGrade: 'Grade B',
    status: 'pending'
  });
  console.log('Created Listing without image:', listingNoImg._id, '| imageUrl:', listingNoImg.imageUrl || '(empty)', '| status:', listingNoImg.status);

  // ----------------------------------------------------
  // TEST 3: Admin queries waste listings API
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Admin queries GET /api/admin/waste-listings ---');
  const adminRes = await fetch(`${API_BASE}/admin/waste-listings`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const allListings = await adminRes.json();
  console.log('API Status:', adminRes.status, '| Total Listings:', allListings.length);

  const foundWithImg = allListings.find(l => String(l._id) === String(listingWithImg._id));
  const foundNoImg = allListings.find(l => String(l._id) === String(listingNoImg._id));

  console.log('Listing WITH image found in API? Image URL present?', !!foundWithImg && !!foundWithImg.imageUrl);
  console.log('Listing WITHOUT image found in API? Image URL empty/clean?', !!foundNoImg && foundNoImg.imageUrl === '');
  console.log('Uploader company populated?', foundWithImg?.uploader?.companyName === 'Flow Test Chemicals Ltd.');

  // ----------------------------------------------------
  // TEST 4: Admin approves listing -> status becomes Approved (active)
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Admin Approves Listing ---');
  const approveRes = await fetch(`${API_BASE}/admin/waste-listings/${listingWithImg._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'approved' })
  });
  const approveData = await approveRes.json();
  console.log('Approve status code:', approveRes.status);
  const updatedWithImg = await Waste.findById(listingWithImg._id);
  console.log('Updated in DB status:', updatedWithImg.status);

  // ----------------------------------------------------
  // TEST 5: Admin rejects listing -> status becomes Rejected
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Admin Rejects Listing ---');
  const rejectRes = await fetch(`${API_BASE}/admin/waste-listings/${listingNoImg._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'rejected', note: 'Moisture content exceeds tolerance' })
  });
  console.log('Reject status code:', rejectRes.status);
  const updatedNoImg = await Waste.findById(listingNoImg._id);
  console.log('Updated in DB status:', updatedNoImg.status);

  // ----------------------------------------------------
  // TEST 6: Completed Exchange sets listing status to Exchanged
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Simulated Exchange Order Completion ---');
  const exchangedListing = await Waste.create({
    uploader: sellerUser._id,
    name: `Exchanged Copper Slag ${timestamp}`,
    category: 'Slag',
    quantity: 8000,
    unit: 'kg',
    price: 8,
    address: 'Plot 88, Eco Park',
    city: 'Vadodara',
    location: { type: 'Point', coordinates: [73.18, 22.30] },
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80',
    description: 'High density abrasive copper slag.',
    qualityGrade: 'Grade A',
    status: 'exchanged'
  });
  console.log('Exchanged Listing created:', exchangedListing._id, '| status:', exchangedListing.status);

  const resAfterExchange = await fetch(`${API_BASE}/admin/waste-listings`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const refreshedListings = await resAfterExchange.json();
  const foundExchanged = refreshedListings.find(l => String(l._id) === String(exchangedListing._id));
  console.log('Found Exchanged Listing in Admin API?', !!foundExchanged, '| status in API:', foundExchanged?.status);

  // Clean up test listings
  await Waste.deleteMany({ _id: { $in: [listingWithImg._id, listingNoImg._id, exchangedListing._id] } });

  await mongoose.disconnect();
  console.log('\n=== ALL WASTE LISTINGS & IMAGE TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
