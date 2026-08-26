const mongoose = require('mongoose');
require('dotenv').config();
const { CANONICAL_CATEGORIES, normalizeCategory } = require('./constants/categories');

async function migrateDatabaseCategories() {
  console.log('=== NORMALIZING MONGODB DATABASE CATEGORIES ===\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const BuyerRequirement = require('./models/BuyerRequirement');
  const Waste = require('./models/Waste');

  // 1. Normalize all BuyerRequirement records
  const reqs = await BuyerRequirement.find({});
  console.log(`Found ${reqs.length} BuyerRequirement documents.`);
  let reqUpdated = 0;

  for (const r of reqs) {
    const oldCat = r.category;
    const newCat = normalizeCategory(oldCat, r.material);
    if (oldCat !== newCat || !CANONICAL_CATEGORIES.includes(oldCat)) {
      await BuyerRequirement.updateOne({ _id: r._id }, { $set: { category: newCat } });
      reqUpdated++;
      console.log(`  [BuyerRequirement] ${r.material}: "${oldCat}" -> "${newCat}"`);
    }
  }
  console.log(`Updated ${reqUpdated} BuyerRequirement documents.\n`);

  // 2. Normalize all Waste records
  const wastes = await Waste.find({});
  console.log(`Found ${wastes.length} Waste documents.`);
  let wasteUpdated = 0;

  for (const w of wastes) {
    const oldCat = w.category;
    const newCat = normalizeCategory(oldCat, w.name);
    if (oldCat !== newCat || !CANONICAL_CATEGORIES.includes(oldCat)) {
      await Waste.updateOne({ _id: w._id }, { $set: { category: newCat } });
      wasteUpdated++;
      console.log(`  [Waste] ${w.name}: "${oldCat}" -> "${newCat}"`);
    }
  }
  console.log(`Updated ${wasteUpdated} Waste documents.\n`);

  await mongoose.disconnect();
  console.log('=== DATABASE CATEGORY MIGRATION COMPLETE ===');
}

migrateDatabaseCategories().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
