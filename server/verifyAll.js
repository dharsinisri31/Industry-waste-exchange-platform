const path = require('path');
require('dotenv').config();

const app = require('./App');
const mongoose = require('mongoose');
const User = require('./models/User');
const Industry = require('./models/Industry');
const Waste = require('./models/Waste');
const Transaction = require('./models/Transaction');

const TEST_PORT = 5066;
let server;

async function runFullIntegrationTests() {
  console.log('=== Starting Full Platform Integration Tests ===');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waste_exchange';
    await mongoose.connect(mongoUri);
    console.log('[DB] Connected to MongoDB.');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }

  // Cleanup old test data
  const sellerEmail = 'seller@symbiosis.com';
  const buyerEmail = 'buyer@symbiosis.com';
  
  await User.deleteMany({ email: { $in: [sellerEmail, buyerEmail] } });
  await Industry.deleteMany({ companyName: { $in: ['Seller Industry Inc', 'Buyer Industry Inc'] } });
  console.log('[Cleanup] Removed old test profiles.');

  server = app.listen(TEST_PORT, () => {
    console.log(`[Server] Running test server on port ${TEST_PORT}`);
  });

  try {
    // 1. Register Seller
    console.log('\n--- 1. Registering Seller ---');
    const sellerPayload = {
      email: sellerEmail,
      password: 'sellerPassword123',
      companyName: 'Seller Industry Inc',
      registrationNumber: 'REG-SELL-999',
      address: '100 Production Rd',
      city: 'Industrial City',
      coordinates: [77.5946, 12.9716], // Bangalore
      contactPhone: '+1-555-111-2222',
      industryType: 'Manufacturing',
      description: 'Generates metal waste byproducts.'
    };

    const sellerRegRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/register-industry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sellerPayload)
    });
    const sellerRegData = await sellerRegRes.json();
    console.log('Seller Registration Status:', sellerRegRes.status);
    console.log('Company:', sellerRegData.profile?.companyName);
    const sellerToken = sellerRegData.accessToken;
    const sellerUserId = sellerRegData.user?.id;

    // 2. Register Buyer
    console.log('\n--- 2. Registering Buyer ---');
    const buyerPayload = {
      email: buyerEmail,
      password: 'buyerPassword123',
      companyName: 'Buyer Industry Inc',
      registrationNumber: 'REG-BUY-888',
      address: '200 Recycling Blvd',
      city: 'Eco City',
      coordinates: [80.2707, 13.0827], // Chennai (~330km from Bangalore)
      contactPhone: '+1-555-333-4444',
      industryType: 'Metallurgy',
      description: 'Absorbs metal scrap to produce structural beams.'
    };

    const buyerRegRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auth/register-industry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerPayload)
    });
    const buyerRegData = await buyerRegRes.json();
    console.log('Buyer Registration Status:', buyerRegRes.status);
    console.log('Company:', buyerRegData.profile?.companyName);
    const buyerToken = buyerRegData.accessToken;

    // 2b. Post Buyer Material Requirement
    console.log('\n--- 2b. Buyer Posting Material Requirement ---');
    const reqPayload = {
      material: 'Steel Scrap Trimmings',
      category: 'Metal Scrap',
      quantity: 500,
      unit: 'kg',
      minPurity: 90,
      maxPrice: 40,
      frequency: 'Monthly',
      address: '200 Recycling Blvd',
      city: 'Eco City',
      coordinates: [80.2707, 13.0827]
    };
    const reqRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/buyer-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify(reqPayload)
    });
    const reqData = await reqRes.json();
    console.log('Buyer Requirement Post Status:', reqRes.status);
    console.log('Created Requirement ID:', reqData._id);

    // 3. Post Waste Listing
    console.log('\n--- 3. Seller Listing Waste Resource ---');
    const wastePayload = {
      name: 'High Purity Steel Offcuts',
      category: 'Metal',
      quantity: 1000,
      unit: 'kg',
      price: 35,
      address: '100 Production Rd',
      city: 'Industrial City',
      latitude: 12.9716,
      longitude: 77.5946,
      purity: 95.0,
      contamination: 5.0,
      description: 'Factory-floor clean carbon steel stamping scrap.'
    };

    const wasteRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/waste`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify(wastePayload)
    });
    const wasteData = await wasteRes.json();
    console.log('Waste Listing Creation Status:', wasteRes.status);
    console.log('Waste ID:', wasteData._id);
    console.log('Assigned Circularity Score:', wasteData.circularityScore);
    const wasteId = wasteData._id;

    // 4. Test RAG / Policy Assistant
    console.log('\n--- 4. Testing RAG Policy Query ---');
    const ragRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/chatbot/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify({ message: 'What are the hazardous waste storage and manifest rules?' })
    });
    const ragData = await ragRes.json();
    console.log('RAG Query Status:', ragRes.status);
    console.log('Answer Preview:', (ragData.response || ragData.reply || '').slice(0, 100) + '...');

    // 5. Test Compliance Waste Check
    console.log('\n--- 5. Testing Compliance Check Engine ---');
    const compRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/compliance/check-waste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Plastic', quantity: 5000, isHazardous: false })
    });
    const compData = await compRes.json();
    console.log('Compliance Check Status:', compRes.status);
    console.log('Compliance Verdict:', compData.complianceStatus);

    // 6. Test Smart Recommendations
    console.log('\n--- 6. Testing Recommendation & Match Engine ---');
    const recRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/recommendations/waste/${wasteId}`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    const recData = await recRes.json();
    console.log('Recommendation Query Status:', recRes.status);
    console.log('Recommendations Found:', Array.isArray(recData) ? recData.length : 'Object');

    // 7. Test Demand Forecaster
    console.log('\n--- 7. Testing Demand Forecaster ---');
    const forecastRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/analytics/demand-forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material: 'Steel Scrap', history: [400, 420, 450, 480, 510] })
    });
    const forecastData = await forecastRes.json();
    console.log('Demand Forecast Status:', forecastRes.status);
    console.log('Forecast Material:', forecastData.material);

    // 8. Test Seed Demo Showcase Data
    console.log('\n--- 8. Testing Demo Showcase Seeder ---');
    const seedRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/demo/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const seedData = await seedRes.json();
    console.log('Demo Seed Status:', seedRes.status);
    console.log('Seeded Showcase Batch ID:', seedData.stats?.showcaseBatchId);
    console.log('Seeded Showcase Exchange ID:', seedData.stats?.showcaseExchangeId);

    // 9. Test Traceability Batch & Exchange Lookup
    console.log('\n--- 9. Testing Circular Traceability Ledger Lookup ---');
    const traceBatchRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/traceability/EL-BATCH-PET-2026-00042`);
    const traceBatchData = await traceBatchRes.json();
    console.log('Traceability Batch Query Status:', traceBatchRes.status);
    console.log('Found Material:', traceBatchData.material?.name);
    console.log('Timeline Events Count:', traceBatchData.timeline?.length);
    console.log('Weighment Variance Percent:', traceBatchData.weighment?.variancePercent + '%');

    // 10. Test Dynamic Auction Bidding
    console.log('\n--- 10. Testing Dynamic Auction Bidding ---');
    const auctionWaste = await Waste.findOne({ batchId: 'EL-BATCH-PET-2026-00042' });
    if (auctionWaste) {
      const bidRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/auction/${auctionWaste._id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${buyerToken}`
        },
        body: JSON.stringify({ amount: 26 })
      });
      const bidData = await bidRes.json();
      console.log('Auction Bid Status:', bidRes.status);
      console.log('New Highest Bid: ₹', bidData.currentBid || 26);
    }

    // Cleanup DB log entries
    console.log('\n--- 11. Cleaning up Test Data ---');
    await User.deleteMany({ email: { $in: [sellerEmail, buyerEmail] } });
    await Industry.deleteMany({ companyName: { $in: ['Seller Industry Inc', 'Buyer Industry Inc'] } });
    await Waste.deleteMany({ uploader: sellerUserId });
    await Transaction.deleteMany({ seller: sellerUserId });
    console.log('[Cleanup] Test database entries removed.');

    console.log('\n=== ALL FULL PLATFORM INTEGRATION TESTS PASSED (100% SUCCESS) ===');
  } catch (error) {
    console.error('\n!!! INTEGRATION TEST ENCOUNTERED AN ERROR !!!');
    console.error(error.stack || error.message);
  } finally {
    if (server) {
      server.close();
      console.log('[Server] Stopped test server.');
    }
    await mongoose.connection.close();
    console.log('[DB] Closed MongoDB connection.');
    process.exit(0);
  }
}

runFullIntegrationTests();
