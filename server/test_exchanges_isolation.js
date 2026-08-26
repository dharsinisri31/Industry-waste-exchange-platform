const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Industry = require('./models/Industry');
const Waste = require('./models/Waste');
const Transaction = require('./models/Transaction');
const BuyerRequirement = require('./models/BuyerRequirement');
const Notification = require('./models/Notification');
const { getMyExchanges, getExchangeById, submitPartnerRating } = require('./controllers/traceabilityController');

async function runExchangesTest() {
  console.log('===========================================================');
  console.log('🧪 ECOLINK EXCHANGES & DETAILS LIFECYCLE VERIFICATION TEST');
  console.log('===========================================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecolink';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const timestamp = Date.now();

    const createMockReqRes = (user, body = {}, params = {}, query = {}) => {
      let statusCode = 200;
      let responseData = null;

      const req = { user, body, params, query };
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        }
      };

      return { req, res, getStatus: () => statusCode, getData: () => responseData };
    };

    // =========================================================================
    // TEST 1 — New Buyer A with 0 Requirements, 0 Exchanges
    // =========================================================================
    console.log('\n--- Test 1: New Buyer A with 0 Exchanges ---');
    const buyerUserA = await User.create({
      email: `buyer_a_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'industry_user',
      roles: ['buyer']
    });

    const buyerIndustryA = await Industry.create({
      user: buyerUserA._id,
      companyName: `Alpha Circular Polymers Ltd ${timestamp}`,
      registrationNumber: `REG-BUY-A-${timestamp}`,
      businessRole: 'receiver',
      roles: ['buyer'],
      industryType: 'Polymer Recycling',
      address: '10 SIPCOT Phase I',
      city: 'Hosur',
      location: { type: 'Point', coordinates: [77.8253, 12.7409] }
    });

    const mockExchanges1 = createMockReqRes(buyerUserA);
    await getMyExchanges(mockExchanges1.req, mockExchanges1.res);
    const exResult1 = mockExchanges1.getData();

    console.log(`✅ Buyer A Exchanges Count: ${exResult1.count}`);
    if (exResult1.count === 0 && exResult1.exchanges.length === 0) {
      console.log('✅ PASS: Fresh Buyer A sees strictly 0 exchanges (No fake demo exchanges!)');
    } else {
      throw new Error(`FAIL: Buyer A saw ${exResult1.count} unexpected exchanges!`);
    }

    // =========================================================================
    // TEST 2 — Buyer A Creates Requirement (Still 0 Exchanges)
    // =========================================================================
    console.log('\n--- Test 2: Buyer A Creates Material Requirement ---');
    await BuyerRequirement.create({
      buyer: buyerUserA._id,
      material: 'PET Plastic Scrap',
      category: 'Plastic Scrap',
      quantity: 500,
      unit: 'kg',
      frequency: 'Monthly',
      maxPrice: 50,
      minPurity: 95,
      address: buyerIndustryA.address,
      city: buyerIndustryA.city,
      location: buyerIndustryA.location,
      status: 'active'
    });

    const mockExchanges2 = createMockReqRes(buyerUserA);
    await getMyExchanges(mockExchanges2.req, mockExchanges2.res);
    const exResult2 = mockExchanges2.getData();

    if (exResult2.count === 0) {
      console.log('✅ PASS: After posting requirement, Exchanges list is STILL cleanly 0.');
    } else {
      throw new Error('FAIL: Requirement creation prematurely generated an exchange!');
    }

    // =========================================================================
    // TEST 3 — Five Sellers Match (Recommendations Only)
    // =========================================================================
    console.log('\n--- Test 3: Multiple Sellers Matched (Recommendations only, not confirmed exchanges) ---');
    const sellers = [];
    for (let i = 1; i <= 5; i++) {
      const sUser = await User.create({
        email: `seller_${i}_${timestamp}@ecolink.test`,
        password: 'password123',
        role: 'industry_user',
        roles: ['seller']
      });
      const sInd = await Industry.create({
        user: sUser._id,
        companyName: `Seller Plant ${String.fromCharCode(64 + i)} ${timestamp}`,
        registrationNumber: `REG-SEL-${i}-${timestamp}`,
        businessRole: 'sender',
        roles: ['seller'],
        industryType: 'Manufacturing Byproducts',
        address: `${i * 10} Industrial Corridor`,
        city: 'Salem',
        location: { type: 'Point', coordinates: [78.1460, 11.6643] }
      });
      const sWaste = await Waste.create({
        uploader: sUser._id,
        name: `PET Flakes Batch ${String.fromCharCode(64 + i)}`,
        category: 'Plastic Scrap',
        quantity: 1000,
        unit: 'kg',
        price: 40 + i,
        address: sInd.address,
        city: sInd.city,
        location: sInd.location,
        status: 'available'
      });
      sellers.push({ user: sUser, industry: sInd, waste: sWaste });
    }

    console.log(`✅ 5 Candidate Sellers registered & listed waste: [Seller A, B, C, D, E]`);
    
    // Check Buyer A exchanges again
    const mockExchanges3 = createMockReqRes(buyerUserA);
    await getMyExchanges(mockExchanges3.req, mockExchanges3.res);
    const exResult3 = mockExchanges3.getData();

    if (exResult3.count === 0) {
      console.log('✅ PASS: Matching sellers does NOT create exchanges. Count is still 0.');
    } else {
      throw new Error('FAIL: Matched sellers caused automatic exchange creation!');
    }

    // =========================================================================
    // TEST 4 — Buyer A Selects Seller C and Sends Request
    // =========================================================================
    console.log('\n--- Test 4: Buyer A selects Seller C only and sends Exchange Request ---');
    const chosenSeller = sellers[2]; // Seller C
    const exchangeId = `EXC-${timestamp.toString().slice(-4)}`;
    
    const newExchange = await Transaction.create({
      exchangeId,
      orderId: exchangeId,
      batchId: `BATCH-PET-${timestamp.toString().slice(-4)}`,
      waste: chosenSeller.waste._id,
      seller: chosenSeller.user._id,
      buyer: buyerUserA._id,
      quantity: 500,
      unit: 'kg',
      unitPrice: chosenSeller.waste.price,
      wasteCost: 500 * chosenSeller.waste.price,
      transportCost: 1800,
      totalPrice: 500 * chosenSeller.waste.price + 1800,
      orderStatus: 'Order Placed',
      status: 'order_placed',
      timeline: [
        {
          stage: 'Order Placed',
          title: 'Exchange Request Sent by Buyer',
          description: `Direct request initiated for 500 kg PET.`,
          timestamp: new Date(),
          actor: buyerIndustryA.companyName
        }
      ]
    });

    // Notify Seller C only
    await Notification.create({
      user: chosenSeller.user._id,
      recipient: chosenSeller.user._id,
      type: 'order',
      title: '📦 New Exchange Request Received',
      message: `Buyer "${buyerIndustryA.companyName}" requested 500 kg PET.`,
      link: `/exchange/${exchangeId}`
    });

    console.log(`✅ Exchange Request created: #${exchangeId}`);

    // Verify notifications: Seller C has notification, Seller A and B have 0
    const notifsSellerC = await Notification.find({ user: chosenSeller.user._id });
    const notifsSellerA = await Notification.find({ user: sellers[0].user._id });
    const notifsSellerB = await Notification.find({ user: sellers[1].user._id });

    if (notifsSellerC.length >= 1 && notifsSellerA.length === 0 && notifsSellerB.length === 0) {
      console.log('✅ PASS: Only selected Seller C received the exchange request notification!');
    } else {
      throw new Error('FAIL: Notification isolation failed across matched sellers!');
    }

    // =========================================================================
    // TEST 5 — Seller C Accepts EXC-1001
    // =========================================================================
    console.log('\n--- Test 5: Seller C Accepts Exchange EXC-1001 ---');
    newExchange.orderStatus = 'Seller Accepted';
    newExchange.status = 'accepted';
    newExchange.timeline.push({
      stage: 'Seller Accepted',
      title: 'Seller Confirmed Exchange',
      description: `Confirmed packaging and supply allocation.`,
      timestamp: new Date(),
      actor: chosenSeller.industry.companyName
    });
    await newExchange.save();

    // Check Buyer A exchanges
    const mockCheckBuyerA = createMockReqRes(buyerUserA);
    await getMyExchanges(mockCheckBuyerA.req, mockCheckBuyerA.res);
    const buyerARes = mockCheckBuyerA.getData();

    // Check Seller C exchanges
    const mockCheckSellerC = createMockReqRes(chosenSeller.user);
    await getMyExchanges(mockCheckSellerC.req, mockCheckSellerC.res);
    const sellerCRes = mockCheckSellerC.getData();

    // Check unselected Seller A exchanges
    const mockCheckSellerA = createMockReqRes(sellers[0].user);
    await getMyExchanges(mockCheckSellerA.req, mockCheckSellerA.res);
    const sellerARes = mockCheckSellerA.getData();

    if (buyerARes.count === 1 && sellerCRes.count === 1 && sellerARes.count === 0) {
      console.log('✅ PASS: Buyer A and Seller C see EXC-1001. Unselected Seller A sees 0 exchanges!');
      console.log(`   Buyer A sees Partner: "${buyerARes.exchanges[0].partnerName}" (Role: ${buyerARes.exchanges[0].roleInExchange})`);
      console.log(`   Seller C sees Partner: "${sellerCRes.exchanges[0].partnerName}" (Role: ${sellerCRes.exchanges[0].roleInExchange})`);
    } else {
      throw new Error('FAIL: Exchange visibility isolation failed!');
    }

    // =========================================================================
    // TEST 6 — Exchange Details Inspection for Buyer A & Seller C
    // =========================================================================
    console.log('\n--- Test 6: Exchange Details Page Verification ---');
    const mockDetailBuyerA = createMockReqRes(buyerUserA, {}, { id: exchangeId });
    await getExchangeById(mockDetailBuyerA.req, mockDetailBuyerA.res);
    const buyerDetail = mockDetailBuyerA.getData();

    if (buyerDetail.success && buyerDetail.exchange.exchangeId === exchangeId) {
      console.log(`✅ PASS: Buyer A retrieved Exchange Details for #${exchangeId}`);
      console.log(`   Material: ${buyerDetail.exchange.waste?.name}`);
      console.log(`   Status: ${buyerDetail.exchange.orderStatus}`);
      console.log(`   Timeline Events: ${buyerDetail.exchange.timeline.length} recorded events`);
    } else {
      throw new Error('FAIL: Buyer A failed to load exchange details!');
    }

    // =========================================================================
    // TEST 7 — Unauthorized Access by Unrelated Buyer B
    // =========================================================================
    console.log('\n--- Test 7: Unauthorized Access Check for Unrelated Buyer B ---');
    const unrelatedBuyerUserB = await User.create({
      email: `unrelated_buyer_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'industry_user',
      roles: ['buyer']
    });

    const mockDetailUnauth = createMockReqRes(unrelatedBuyerUserB, {}, { id: exchangeId });
    await getExchangeById(mockDetailUnauth.req, mockDetailUnauth.res);
    
    console.log(`✅ Unauthorized Access Response Status: ${mockDetailUnauth.getStatus()} | Message: ${mockDetailUnauth.getData()?.message}`);

    if (mockDetailUnauth.getStatus() === 403) {
      console.log('✅ PASS: Unrelated Buyer B was rejected with 403 Forbidden! Cannot view other companies\' exchanges.');
    } else {
      throw new Error('FAIL: Security check failed! Unrelated company was allowed access.');
    }

    // =========================================================================
    // TEST 8 — Complete Lifecycle & Rating
    // =========================================================================
    console.log('\n--- Test 8: Complete Lifecycle & Partner Trust Rating ---');
    newExchange.orderStatus = 'Completed';
    newExchange.status = 'completed';
    newExchange.completedAt = new Date();
    await newExchange.save();

    const ratingMock = createMockReqRes(buyerUserA, {
      role: 'buyer',
      materialQuality: 5,
      quantityAccuracy: 5,
      communication: 5,
      deliveryReliability: 5,
      overall: 5,
      comment: 'Top grade polymer flakes. Exceptional purity!'
    }, { id: exchangeId });

    await submitPartnerRating(ratingMock.req, ratingMock.res);

    if (ratingMock.getStatus() === 200) {
      console.log('✅ PASS: Partner trust rating submitted and recorded for completed exchange.');
    } else {
      throw new Error('FAIL: Partner rating submission failed!');
    }

    console.log('\n===========================================================');
    console.log('🎉 ALL EXCHANGES & LIFECYCLE TESTS PASSED WITH 100% SUCCESS!');
    console.log('===========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Exchanges test failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runExchangesTest();
