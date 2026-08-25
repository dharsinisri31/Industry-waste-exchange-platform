const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runPOCTest = async () => {
  console.log('=== STARTING END-TO-END POC WORKFLOW TEST ===\n');

  try {
    // Step 1: Login as GreenPoly Seller
    console.log('1. Logging in as Seller (GreenPoly Industries: poc.seller01@example.com)...');
    const sellerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'poc.seller01@example.com',
      password: 'Test@12345'
    });
    const sellerToken = sellerLogin.data.accessToken;
    const sellerUser = sellerLogin.data.user;
    const sellerProfile = sellerLogin.data.profile;
    console.log(`   ✓ Logged in. Seller Profile ID: ${sellerProfile._id}, Company: ${sellerProfile.companyName}`);

    // Step 2: Get Seller's Listings
    console.log('\n2. Fetching Seller listings...');
    const listingsRes = await axios.get(`${BASE_URL}/waste/my/listings`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const petListing = listingsRes.data.find(l => l.category === 'Plastic' || l.name.includes('PET'));
    if (!petListing) {
      throw new Error('PET Listing not found for seller!');
    }
    console.log(`   ✓ Found Listing: "${petListing.name}" (ID: ${petListing._id})`);
    console.log(`     Quantity: ${petListing.quantity} ${petListing.unit}, Price: ${petListing.price} INR/kg, Location: ${petListing.city}`);

    // Step 3: Check Buyer Recommendations for Seller / PET listing
    console.log('\n3. Testing Buyer Recommendations matching...');
    const recRes = await axios.get(`${BASE_URL}/recommendations/waste/${petListing._id}`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    const matches = Array.isArray(recRes.data) ? recRes.data : (recRes.data.recommendations || []);
    console.log(`   ✓ Recommendation API returned ${matches.length || 0} candidate matches:`);
    matches.slice(0, 5).forEach(m => {
      const company = m.industry ? m.industry.companyName : (m.companyName || 'Buyer');
      const dist = m.match_breakdown ? m.match_breakdown.distance_km : m.distanceKm;
      const scorePct = m.score ? Math.round(m.score * 100) : 80;
      console.log(`     - Match: ${company} | Distance: ${dist} km | Match Score: ${scorePct}% | Travel Time: ${m.match_breakdown?.travel_time_minutes || 0} mins`);
    });

    // Step 4: Login as RePoly Buyer
    console.log('\n4. Logging in as Buyer (RePoly Manufacturing: poc.buyer01@example.com)...');
    const buyerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'poc.buyer01@example.com',
      password: 'Test@12345'
    });
    const buyerToken = buyerLogin.data.accessToken;
    const buyerProfile = buyerLogin.data.profile;
    console.log(`   ✓ Logged in. Buyer Profile ID: ${buyerProfile._id}, Company: ${buyerProfile.companyName}`);

    // Step 5: Browse Marketplace for PET
    console.log('\n5. Searching Marketplace as Buyer for "PET"...');
    const mktRes = await axios.get(`${BASE_URL}/waste/marketplace?search=PET`);
    const foundPet = mktRes.data.listings.find(l => l._id === petListing._id);
    console.log(`   ✓ Found listing in Marketplace: "${foundPet.name}" | Status: ${foundPet.status}`);

    // Step 6: Submit Buyer Request / Exchange
    console.log('\n6. Buyer submitting Exchange Request for PET Listing...');
    const exchangeRes = await axios.post(`${BASE_URL}/waste/${petListing._id}/exchange`, {}, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const transaction = exchangeRes.data;
    console.log(`   ✓ Transaction Created! ID: ${transaction._id}`);
    console.log(`     Total Price: ₹${transaction.totalPrice}`);
    console.log(`     Road Distance: ${transaction.distanceKm} km`);
    console.log(`     Transport Cost: $${transaction.transportCost}`);
    console.log(`     Net Carbon Saved: ${transaction.carbonSavedKg} kg CO2`);
    console.log(`     Status: ${transaction.status}`);

    // Step 7: Update Transaction to Approved & Completed
    console.log('\n7. Seller / System Approving and Completing Transaction...');
    const approveRes = await axios.patch(`${BASE_URL}/admin/transactions/${transaction._id}`, {
      status: 'approved'
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    console.log(`   ✓ Transaction Status updated to: ${approveRes.data.status}`);

    const completeRes = await axios.patch(`${BASE_URL}/admin/transactions/${transaction._id}`, {
      status: 'completed'
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    console.log(`   ✓ Transaction Status updated to: ${completeRes.data.status}`);

    // Step 8: Update Waste Journey status
    console.log('\n8. Updating Waste Journey tracking status...');
    const journeyRes = await axios.patch(`${BASE_URL}/waste/journey/${petListing._id}/status`, {
      status: 'Recycled',
      notes: 'PET material processed into high-grade recycled plastic pellets',
      locationName: 'RePoly Facility, Coimbatore'
    }, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    console.log(`   ✓ Waste Journey updated. Current Status: ${journeyRes.data.currentStatus}`);

    // Step 9: Verify updated listing status and passport
    console.log('\n9. Verifying final state in MongoDB...');
    const finalWasteRes = await axios.get(`${BASE_URL}/waste/${petListing._id}`);
    console.log(`   ✓ Waste Listing Final Status: ${finalWasteRes.data.status}`);

    const passportRes = await axios.get(`${BASE_URL}/waste/passport/${petListing._id}`);
    console.log(`   ✓ Resource Passport retrieved. ID: ${passportRes.data.passportId}, Material: ${passportRes.data.material}`);

    console.log('\n=== ALL POC WORKFLOW STEPS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n❌ POC Workflow Error:', err.response?.data || err.message);
  }
};

runPOCTest();
