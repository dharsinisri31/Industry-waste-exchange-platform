const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Industry = require('./models/Industry');
const Waste = require('./models/Waste');
const Transaction = require('./models/Transaction');
const BuyerRequirement = require('./models/BuyerRequirement');

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runAdminVerification() {
  console.log('=== Starting Admin Platform Control Center Verification ===');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecolink';
  await mongoose.connect(mongoUri);
  console.log('[DB] Connected to MongoDB.');

  const app = require('./App');
  const server = app.listen(TEST_PORT, () => {
    console.log(`[Server] Admin test server running on port ${TEST_PORT}`);
  });

  try {
    // 1. Create or ensure admin user
    let adminUser = await User.findOne({ email: 'admin_test@ecolink.com' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'admin_test@ecolink.com',
        password: 'password123',
        role: 'admin',
        isVerified: true
      });
    }

    // 2. Login as admin
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin_test@ecolink.com',
      password: 'password123'
    });
    const token = loginRes.data.accessToken;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✓ Admin Login Succeeded.');

    // 3. Test GET /api/admin/summary
    const summaryRes = await axios.get(`${BASE_URL}/api/admin/summary`, authHeaders);
    console.log('✓ Admin Summary API Status:', summaryRes.status);
    console.log('  Total Industries:', summaryRes.data.metrics.totalIndustries);
    console.log('  Active Listings:', summaryRes.data.metrics.activeListingsCount);
    console.log('  Transaction Value (₹):', summaryRes.data.metrics.totalTransactionValueInr);
    console.log('  Pending Verifications:', summaryRes.data.pendingActions.unverifiedIndustriesCount);

    // 4. Test GET /api/admin/industries
    const indRes = await axios.get(`${BASE_URL}/api/admin/industries`, authHeaders);
    console.log('✓ Admin Industries API Status:', indRes.status, `(${indRes.data.length} records)`);

    // 5. Test GET /api/admin/waste-listings
    const wasteRes = await axios.get(`${BASE_URL}/api/admin/waste-listings`, authHeaders);
    console.log('✓ Admin Waste Listings API Status:', wasteRes.status, `(${wasteRes.data.length} listings)`);

    // 6. Test GET /api/admin/knowledge-base
    const kbRes = await axios.get(`${BASE_URL}/api/admin/knowledge-base`, authHeaders);
    console.log('✓ Admin Knowledge Base API Status:', kbRes.status, `(${kbRes.data.totalDocuments} bundles, ${kbRes.data.totalChunks} chunks)`);

    // 7. Test GET /api/admin/settings
    const settingsRes = await axios.get(`${BASE_URL}/api/admin/settings`, authHeaders);
    console.log('✓ Admin Platform Settings API Status:', settingsRes.status, `(Medium truck rate: ₹${settingsRes.data.transportCostPerKm.mediumTruck}/km)`);

    console.log('=== ALL ADMIN CONTROL CENTER TESTS PASSED ===');
  } catch (err) {
    console.error('Admin test error:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    await User.deleteOne({ email: 'admin_test@ecolink.com' });
    server.close();
    await mongoose.connection.close();
  }
}

runAdminVerification();
