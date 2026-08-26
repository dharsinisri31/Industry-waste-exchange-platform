const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Industry = require('./models/Industry');
const Waste = require('./models/Waste');
const Transaction = require('./models/Transaction');
const BuyerRequirement = require('./models/BuyerRequirement');
const { getUserDocuments, getUserExchangesWithChecklist, uploadDocument } = require('./controllers/documentController');

async function runDocumentsTest() {
  console.log('===========================================================');
  console.log('🧪 ECOLINK DOCUMENTS COMPANY ISOLATION & WORKFLOW TEST');
  console.log('===========================================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecolink';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const timestamp = Date.now();

    // Helper mock req/res
    const createMockReqRes = (user, body = {}, params = {}, query = {}, file = null) => {
      let statusCode = 200;
      let responseData = null;

      const req = { user, body, params, query, file };
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
    // TEST 1: Fresh Buyer A with 0 Exchanges, 0 Requirements, 0 Documents
    // =========================================================================
    console.log('\n--- 1. Testing Fresh Buyer A with No Exchanges ---');
    const buyerUserA = await User.create({
      email: `fresh_buyer_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'industry_user',
      roles: ['buyer']
    });

    const buyerIndustryA = await Industry.create({
      user: buyerUserA._id,
      companyName: `Fresh PolyRecycle Corp ${timestamp}`,
      registrationNumber: `REG-BUY-A-${timestamp}`,
      businessRole: 'receiver',
      roles: ['buyer'],
      industryType: 'Plastics & Polymers',
      address: '15 SIPCOT Phase II',
      city: 'Hosur',
      location: { type: 'Point', coordinates: [77.8253, 12.7409] }
    });

    const mock1 = createMockReqRes(buyerUserA);
    await getUserDocuments(mock1.req, mock1.res);
    const result1 = mock1.getData();

    console.log(`✅ Fresh Buyer A Document Count: ${result1.count}`);
    if (result1.count === 0 && result1.documents.length === 0) {
      console.log('✅ PASS: Fresh Buyer A has exactly 0 documents (No demo documents leaked!)');
    } else {
      throw new Error(`FAIL: Fresh Buyer A saw ${result1.count} documents!`);
    }

    // =========================================================================
    // TEST 2: Buyer A Creates Material Requirement (Still 0 Exchanges)
    // =========================================================================
    console.log('\n--- 2. Testing Buyer A Posts Material Requirement ---');
    await BuyerRequirement.create({
      buyer: buyerUserA._id,
      material: 'HDPE Granules Scrap',
      category: 'Plastic Scrap',
      quantity: 1200,
      unit: 'kg',
      frequency: 'Monthly',
      maxPrice: 60,
      minPurity: 96,
      address: buyerIndustryA.address,
      city: buyerIndustryA.city,
      location: buyerIndustryA.location,
      status: 'active'
    });

    const mock2 = createMockReqRes(buyerUserA);
    await getUserDocuments(mock2.req, mock2.res);
    const result2 = mock2.getData();

    if (result2.count === 0) {
      console.log('✅ PASS: After posting requirement, Documents page is STILL cleanly 0.');
    } else {
      throw new Error(`FAIL: Requirement creation prematurely generated documents!`);
    }

    // =========================================================================
    // TEST 3: Seller B Lists Waste (Still 0 Exchanges)
    // =========================================================================
    console.log('\n--- 3. Testing Seller B Lists Waste ---');
    const sellerUserB = await User.create({
      email: `seller_b_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'industry_user',
      roles: ['seller']
    });

    const sellerIndustryB = await Industry.create({
      user: sellerUserB._id,
      companyName: `Apex Extrusion Mills ${timestamp}`,
      registrationNumber: `REG-SEL-B-${timestamp}`,
      businessRole: 'sender',
      roles: ['seller'],
      industryType: 'Polymer Extrusions',
      address: '88 Highway Industrial Zone',
      city: 'Salem',
      location: { type: 'Point', coordinates: [78.1460, 11.6643] }
    });

    const sellerWasteB = await Waste.create({
      uploader: sellerUserB._id,
      name: 'Clean Virgin HDPE Scrap',
      category: 'Plastic Scrap',
      quantity: 1500,
      unit: 'kg',
      price: 55,
      address: sellerIndustryB.address,
      city: sellerIndustryB.city,
      location: sellerIndustryB.location,
      status: 'available'
    });

    const mock3 = createMockReqRes(buyerUserA);
    await getUserDocuments(mock3.req, mock3.res);
    const result3 = mock3.getData();

    if (result3.count === 0) {
      console.log('✅ PASS: After seller matching, Documents page is STILL cleanly 0.');
    } else {
      throw new Error(`FAIL: Seller listing prematurely generated documents!`);
    }

    // =========================================================================
    // TEST 4: Exchange EXC-1001 Created Between Buyer A and Seller B
    // =========================================================================
    console.log('\n--- 4. Testing Exchange Creation between Buyer A and Seller B ---');
    const exchangeId = `EXC-${timestamp.toString().slice(-4)}`;
    const exchangeOrder = await Transaction.create({
      exchangeId,
      orderId: exchangeId,
      batchId: `BATCH-HDPE-${timestamp.toString().slice(-4)}`,
      waste: sellerWasteB._id,
      seller: sellerUserB._id,
      buyer: buyerUserA._id,
      quantity: 1200,
      unit: 'kg',
      unitPrice: 55,
      wasteCost: 1200 * 55,
      transportCost: 2000,
      totalPrice: 1200 * 55 + 2000,
      orderStatus: 'Seller Accepted',
      status: 'accepted',
      documents: []
    });

    console.log(`✅ Exchange created: #${exchangeId}`);

    // Check checklist endpoint for Buyer A
    const mockChecklistA = createMockReqRes(buyerUserA);
    await getUserExchangesWithChecklist(mockChecklistA.req, mockChecklistA.res);
    const exResultA = mockChecklistA.getData();

    console.log(`✅ Buyer A Exchanges Count: ${exResultA.count}`);
    console.log(`   Checklist Items for Exchange #${exResultA.exchanges[0]?.exchangeId}: ${exResultA.exchanges[0]?.checklist?.length} items`);
    
    if (exResultA.count === 1 && exResultA.exchanges[0].checklist.length === 7) {
      console.log('✅ PASS: Exchange checklist correctly generated with 7 standard document items (all Pending).');
    } else {
      throw new Error('FAIL: Exchange checklist generation failed!');
    }

    // =========================================================================
    // TEST 5: Seller B Uploads Quality Report to EXC-1001
    // =========================================================================
    console.log('\n--- 5. Testing Seller B Uploads Quality Report ---');
    const uploadMock1 = createMockReqRes(sellerUserB, {
      exchangeId,
      docType: 'Quality Report',
      fileName: 'HDPE_Assay_Quality_GradeA.pdf',
      notes: '99.1% High Density Polyethylene assay certified.'
    });

    await uploadDocument(uploadMock1.req, uploadMock1.res);
    console.log(`✅ Upload Status: ${uploadMock1.getStatus()} | Message: ${uploadMock1.getData()?.message}`);

    if (uploadMock1.getStatus() === 201) {
      console.log('✅ PASS: Quality Report successfully uploaded by Seller B.');
    } else {
      throw new Error('FAIL: Document upload failed!');
    }

    // Verify Seller B sees 1 document
    const mockSellerDocs = createMockReqRes(sellerUserB);
    await getUserDocuments(mockSellerDocs.req, mockSellerDocs.res);
    const sellerDocsResult = mockSellerDocs.getData();

    // Verify Buyer A sees 1 document
    const mockBuyerDocs = createMockReqRes(buyerUserA);
    await getUserDocuments(mockBuyerDocs.req, mockBuyerDocs.res);
    const buyerDocsResult = mockBuyerDocs.getData();

    if (sellerDocsResult.count === 1 && buyerDocsResult.count === 1) {
      console.log('✅ PASS: Both authorized participants (Buyer A & Seller B) see the uploaded Quality Report!');
      console.log(`   Buyer A sees file: "${buyerDocsResult.documents[0].fileName}" (Partner: ${buyerDocsResult.documents[0].partnerCompany})`);
    } else {
      throw new Error('FAIL: Document visibility between exchange participants failed!');
    }

    // =========================================================================
    // TEST 6: Unrelated Buyer C and Unrelated Seller D Data Isolation
    // =========================================================================
    console.log('\n--- 6. Testing Strict Data Isolation for Unrelated Buyer C & Seller D ---');
    const buyerUserC = await User.create({
      email: `unrelated_buyer_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'industry_user',
      roles: ['buyer']
    });

    const sellerUserD = await User.create({
      email: `unrelated_seller_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'industry_user',
      roles: ['seller']
    });

    // Unrelated Buyer C fetches documents
    const mockBuyerC = createMockReqRes(buyerUserC);
    await getUserDocuments(mockBuyerC.req, mockBuyerC.res);
    const buyerCResult = mockBuyerC.getData();

    // Unrelated Seller D fetches documents
    const mockSellerD = createMockReqRes(sellerUserD);
    await getUserDocuments(mockSellerD.req, mockSellerD.res);
    const sellerDResult = mockSellerD.getData();

    if (buyerCResult.count === 0 && sellerDResult.count === 0) {
      console.log('✅ PASS: Unrelated Buyer C and Seller D see strictly 0 documents! No cross-company data leakage.');
    } else {
      throw new Error(`FAIL: Cross-company leakage! Buyer C saw ${buyerCResult.count}, Seller D saw ${sellerDResult.count}`);
    }

    // Unrelated Buyer C attempts unauthorized upload to Exchange EXC-1001
    const unauthorizedUpload = createMockReqRes(buyerUserC, {
      exchangeId,
      docType: 'Invoice',
      fileName: 'Hacker_Invoice.pdf'
    });

    await uploadDocument(unauthorizedUpload.req, unauthorizedUpload.res);
    console.log(`✅ Unauthorized Upload Status: ${unauthorizedUpload.getStatus()} | Message: ${unauthorizedUpload.getData()?.message}`);

    if (unauthorizedUpload.getStatus() === 403) {
      console.log('✅ PASS: Security validation rejected unauthorized upload attempt with 403 Forbidden!');
    } else {
      throw new Error('FAIL: Security check failed to reject unauthorized company upload!');
    }

    // =========================================================================
    // TEST 7: Buyer A Uploads Invoice
    // =========================================================================
    console.log('\n--- 7. Testing Buyer A Uploads Tax Invoice ---');
    const buyerUpload = createMockReqRes(buyerUserA, {
      exchangeId,
      docType: 'Invoice',
      fileName: `Tax_Invoice_${exchangeId}.pdf`,
      notes: 'GST tax invoice settled via simulated payment.'
    });

    await uploadDocument(buyerUpload.req, buyerUpload.res);

    const checkBuyerFinal = createMockReqRes(buyerUserA);
    await getUserDocuments(checkBuyerFinal.req, checkBuyerFinal.res);
    const buyerFinalResult = checkBuyerFinal.getData();

    const checkSellerFinal = createMockReqRes(sellerUserB);
    await getUserDocuments(checkSellerFinal.req, checkSellerFinal.res);
    const sellerFinalResult = checkSellerFinal.getData();

    const checkBuyerC = createMockReqRes(buyerUserC);
    await getUserDocuments(checkBuyerC.req, checkBuyerC.res);
    const buyerCFinal = checkBuyerC.getData();

    if (buyerFinalResult.count === 2 && sellerFinalResult.count === 2 && buyerCFinal.count === 0) {
      console.log('✅ PASS: Both participants now see 2 documents. Unrelated Buyer C still sees strictly 0 documents.');
    } else {
      throw new Error('FAIL: Document counts mismatch!');
    }

    // =========================================================================
    // TEST 8: Admin Platform Overview
    // =========================================================================
    console.log('\n--- 8. Testing Admin Monitoring ---');
    const adminUser = await User.create({
      email: `admin_${timestamp}@ecolink.test`,
      password: 'password123',
      role: 'admin',
      roles: ['admin']
    });

    const mockAdmin = createMockReqRes(adminUser);
    await getUserDocuments(mockAdmin.req, mockAdmin.res);
    const adminResult = mockAdmin.getData();

    if (adminResult.count >= 2) {
      console.log(`✅ PASS: Admin successfully monitors platform documents (Total in DB: ${adminResult.count}).`);
    } else {
      throw new Error('FAIL: Admin overview failed!');
    }

    console.log('\n===========================================================');
    console.log('🎉 ALL DOCUMENTS ISOLATION & PERMISSION CHECKS PASSED!');
    console.log('===========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Documents test failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runDocumentsTest();
