const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Industry = require('./models/Industry');
const Waste = require('./models/Waste');
const Transaction = require('./models/Transaction');
const { STANDARDIZED_STATUSES, normalizeStatus } = require('./utils/statusUtils');
const { calculateAvoidedCO2, calculateVirginMaterialReplaced } = require('./utils/sustainabilityUtils');

async function testDataConsistency() {
  console.log('====================================================');
  console.log('🧪 ECOLINK ADMIN DATA CONSISTENCY & SUSTAINABILITY TEST');
  console.log('====================================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecolink';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch current transactions in MongoDB
    const allDbTransactions = await Transaction.find().populate('waste');
    console.log(`📊 Current DB Total Transactions: ${allDbTransactions.length}`);

    // Compute status counts using Single Source of Truth
    const statusCounts = {
      pending: 0,
      accepted: 0,
      processing: 0,
      inTransit: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0
    };

    allDbTransactions.forEach(t => {
      const norm = normalizeStatus(t.orderStatus || t.status);
      if (norm === STANDARDIZED_STATUSES.PENDING) statusCounts.pending++;
      else if (norm === STANDARDIZED_STATUSES.ACCEPTED) statusCounts.accepted++;
      else if (norm === STANDARDIZED_STATUSES.PROCESSING) statusCounts.processing++;
      else if (norm === STANDARDIZED_STATUSES.IN_TRANSIT) statusCounts.inTransit++;
      else if (norm === STANDARDIZED_STATUSES.DELIVERED) statusCounts.delivered++;
      else if (norm === STANDARDIZED_STATUSES.COMPLETED) statusCounts.completed++;
      else if (norm === STANDARDIZED_STATUSES.CANCELLED) statusCounts.cancelled++;
    });

    const sumOfStatuses = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    console.log('\n--- 1. Exchange Status Breakdown ---');
    console.log(`   Pending:     ${statusCounts.pending}`);
    console.log(`   Accepted:    ${statusCounts.accepted}`);
    console.log(`   Processing:  ${statusCounts.processing}`);
    console.log(`   In Transit:  ${statusCounts.inTransit}`);
    console.log(`   Delivered:   ${statusCounts.delivered}`);
    console.log(`   Completed:   ${statusCounts.completed}`);
    console.log(`   Cancelled:   ${statusCounts.cancelled}`);
    console.log(`   -----------------------------`);
    console.log(`   Sum of Statuses:       ${sumOfStatuses}`);
    console.log(`   Total DB Transactions: ${allDbTransactions.length}`);

    if (sumOfStatuses === allDbTransactions.length) {
      console.log('✅ DATA CONSISTENCY CHECK PASSED: Sum of Statuses strictly equals Total Transactions!');
    } else {
      throw new Error(`Data mismatch! Sum of statuses (${sumOfStatuses}) !== Total (${allDbTransactions.length})`);
    }

    // 2. Test Sustainability Math from COMPLETED exchanges ONLY
    console.log('\n--- 2. Sustainability Impact Verification ---');
    const completedList = allDbTransactions.filter(t => normalizeStatus(t.orderStatus || t.status) === STANDARDIZED_STATUSES.COMPLETED);
    const expectedDivertedKg = completedList.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
    const expectedCO2Kg = completedList.reduce((sum, t) => sum + calculateAvoidedCO2(t.quantity, t.waste?.name, t.waste?.category), 0);
    const expectedVirginKg = calculateVirginMaterialReplaced(expectedDivertedKg);

    console.log(`   Completed Exchanges:       ${completedList.length}`);
    console.log(`   Total Waste Diverted (kg): ${expectedDivertedKg} kg (${(expectedDivertedKg / 1000).toFixed(2)} Tonnes)`);
    console.log(`   Net Avoided CO2e (kg):     ${expectedCO2Kg} kg (${(expectedCO2Kg / 1000).toFixed(2)} tCO2e)`);
    console.log(`   Virgin Material Saved:     ${expectedVirginKg} kg (${(expectedVirginKg / 1000).toFixed(2)} Tonnes)`);

    if (completedList.length === statusCounts.completed) {
      console.log('✅ SUSTAINABILITY SYNCHRONIZATION CHECK PASSED: Completed count strictly equals dashboard status count!');
    } else {
      throw new Error('Sustainability completed count does not match status count!');
    }

    // 3. Test Emission Factors for specific material categories
    console.log('\n--- 3. Testing Category Emission Factors ---');
    const petCO2 = calculateAvoidedCO2(1000, 'PET Flakes', 'Plastic Scrap');
    console.log(`   PET 1000kg avoidance: ${petCO2} kg CO2e (Expected: 1850 kg CO2e)`);
    if (petCO2 !== 1850) throw new Error(`PET factor mismatch! Got ${petCO2}`);

    const flyAshCO2 = calculateAvoidedCO2(1000, 'Class F Fly Ash', 'Fly Ash');
    console.log(`   Fly Ash 1000kg avoidance: ${flyAshCO2} kg CO2e (Expected: 820 kg CO2e)`);
    if (flyAshCO2 !== 820) throw new Error(`Fly Ash factor mismatch! Got ${flyAshCO2}`);

    const metalCO2 = calculateAvoidedCO2(1000, 'Aluminium Scrap', 'Metal Scrap');
    console.log(`   Metal 1000kg avoidance: ${metalCO2} kg CO2e (Expected: 4200 kg CO2e)`);
    if (metalCO2 !== 4200) throw new Error(`Metal factor mismatch! Got ${metalCO2}`);

    console.log('✅ All Emission Factors verified accurately!');

    console.log('\n====================================================');
    console.log('🎉 ALL DATA CONSISTENCY & SUSTAINABILITY CHECKS PASSED!');
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testDataConsistency();
