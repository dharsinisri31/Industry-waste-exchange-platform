const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Industry = require('./models/Industry');
const Waste = require('./models/Waste');
const WasteResourcePassport = require('./models/WasteResourcePassport');
const WasteJourney = require('./models/WasteJourney');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-waste-exchange';

const sellersData = [
  {
    email: 'poc.seller01@example.com',
    phone: '9000000001',
    companyName: 'GreenPoly Industries',
    registrationNumber: 'REG-POC-SEL-01',
    industryType: 'Plastic Manufacturing',
    city: 'Coimbatore',
    address: 'Industrial Area, Coimbatore',
    location: [76.9558, 11.0168], // [lng, lat]
    waste: {
      name: 'Industrial PET Bottle Scrap',
      category: 'Plastic',
      subCategory: 'PET Flakes',
      quantity: 2000,
      unit: 'kg',
      price: 42,
      predictedPrice: 45,
      description: 'Clean washed post-industrial PET bottle scrap flakes.',
      imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80',
      purity: 94.5,
      contamination: 3.5,
      qualityGrade: 'Grade A'
    }
  },
  {
    email: 'poc.seller02@example.com',
    phone: '9000000002',
    companyName: 'Kongu Packaging Works',
    registrationNumber: 'REG-POC-SEL-02',
    industryType: 'Packaging',
    city: 'Tiruppur',
    address: 'Industrial Area, Tiruppur',
    location: [77.3411, 11.1085],
    waste: {
      name: 'HDPE Polymer Regrind',
      category: 'Plastic',
      subCategory: 'HDPE',
      quantity: 1500,
      unit: 'kg',
      price: 38,
      predictedPrice: 40,
      description: 'Sorted high-density polyethylene packaging regrind pellets.',
      imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      purity: 91.0,
      contamination: 5.0,
      qualityGrade: 'Grade B'
    }
  },
  {
    email: 'poc.seller03@example.com',
    phone: '9000000003',
    companyName: 'Erode Textile Processors',
    registrationNumber: 'REG-POC-SEL-03',
    industryType: 'Textile Manufacturing',
    city: 'Erode',
    address: 'Industrial Area, Erode',
    location: [77.7172, 11.3410],
    waste: {
      name: 'Cotton Fabric Trims & Clippings',
      category: 'Textile',
      subCategory: 'Textile Waste',
      quantity: 1200,
      unit: 'kg',
      price: 25,
      predictedPrice: 28,
      description: '100% pure cotton spinning drop and cutting waste from apparel production.',
      imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
      purity: 88.0,
      contamination: 6.0,
      qualityGrade: 'Grade B'
    }
  },
  {
    email: 'poc.seller04@example.com',
    phone: '9000000004',
    companyName: 'South Metal Components',
    registrationNumber: 'REG-POC-SEL-04',
    industryType: 'Engineering / Metal Manufacturing',
    city: 'Coimbatore',
    address: 'Industrial Area, Coimbatore',
    location: [76.9900, 11.0500],
    waste: {
      name: 'Aluminium Machining Turnings',
      category: 'Metal',
      subCategory: 'Aluminium Scrap',
      quantity: 2500,
      unit: 'kg',
      price: 160,
      predictedPrice: 168,
      description: 'High-purity aluminium turnings and manufacturing offcuts free of oil.',
      imageUrl: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80',
      purity: 96.0,
      contamination: 2.0,
      qualityGrade: 'Grade A'
    }
  },
  {
    email: 'poc.seller05@example.com',
    phone: '9000000005',
    companyName: 'Salem Glass Industries',
    registrationNumber: 'REG-POC-SEL-05',
    industryType: 'Glass Manufacturing',
    city: 'Salem',
    address: 'Industrial Area, Salem',
    location: [78.1460, 11.6643],
    waste: {
      name: 'Sorted Industrial Glass Cullet',
      category: 'Glass',
      subCategory: 'Glass Scrap',
      quantity: 1800,
      unit: 'kg',
      price: 12,
      predictedPrice: 14,
      description: 'Color-sorted industrial glass cullet for container re-melting.',
      imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=600&q=80',
      purity: 93.0,
      contamination: 4.0,
      qualityGrade: 'Grade A'
    }
  },
  {
    email: 'poc.seller06@example.com',
    phone: '9000000006',
    companyName: 'Tamil Paper Mills',
    registrationNumber: 'REG-POC-SEL-06',
    industryType: 'Paper & Pulp',
    city: 'Erode',
    address: 'Bhavani Road, Erode',
    location: [77.7200, 11.3500],
    waste: {
      name: 'Baled Corrugated Kraft Scrap',
      category: 'Paper',
      subCategory: 'Cardboard Scrap',
      quantity: 3500,
      unit: 'kg',
      price: 18,
      predictedPrice: 20,
      description: 'Baled corrugated packaging and industrial kraft trim waste.',
      imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      purity: 92.0,
      contamination: 4.5,
      qualityGrade: 'Grade A'
    }
  },
  {
    email: 'poc.seller07@example.com',
    phone: '9000000007',
    companyName: 'Neyveli Thermal Byproducts',
    registrationNumber: 'REG-POC-SEL-07',
    industryType: 'Power Generation',
    city: 'Salem',
    address: 'Power Plant Hub, Salem',
    location: [78.1300, 11.6400],
    waste: {
      name: 'Thermal Plant Fly Ash Grade I',
      category: 'Fly Ash',
      subCategory: 'Fly Ash',
      quantity: 8000,
      unit: 'kg',
      price: 3,
      predictedPrice: 3.5,
      description: 'Pozzolanic fly ash suitable for ready-mix concrete and cement blending.',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      purity: 95.0,
      contamination: 2.0,
      qualityGrade: 'Grade A'
    }
  },
  {
    email: 'poc.seller08@example.com',
    phone: '9000000008',
    companyName: 'Chennai Circuit Recyclers',
    registrationNumber: 'REG-POC-SEL-08',
    industryType: 'Electronics Manufacturing',
    city: 'Chennai',
    address: 'Ambattur Industrial Estate, Chennai',
    location: [80.1500, 13.0800],
    waste: {
      name: 'Segregated PCB & Electronic Scrap',
      category: 'E-Waste',
      subCategory: 'Printed Circuit Boards',
      quantity: 600,
      unit: 'kg',
      price: 85,
      predictedPrice: 90,
      description: 'Pre-sorted telecom and industrial printed circuit board scrap.',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
      purity: 90.0,
      contamination: 5.0,
      qualityGrade: 'Grade B'
    }
  }
];

const buyersData = [
  {
    email: 'poc.buyer01@example.com',
    phone: '9000000011',
    companyName: 'RePoly Manufacturing',
    registrationNumber: 'REG-POC-BUY-01',
    industryType: 'Recycled Plastic Manufacturing',
    city: 'Coimbatore',
    address: 'Industrial Area, Coimbatore',
    location: [76.9700, 11.0300],
    neededWasteTypes: 'PET, HDPE'
  },
  {
    email: 'poc.buyer02@example.com',
    phone: '9000000012',
    companyName: 'FuturePack Industries',
    registrationNumber: 'REG-POC-BUY-02',
    industryType: 'Sustainable Packaging',
    city: 'Tiruppur',
    address: 'Industrial Area, Tiruppur',
    location: [77.3500, 11.1200],
    neededWasteTypes: 'PET, HDPE, Paper'
  },
  {
    email: 'poc.buyer03@example.com',
    phone: '9000000013',
    companyName: 'Kongu Metal Recycling',
    registrationNumber: 'REG-POC-BUY-03',
    industryType: 'Metal Recycling',
    city: 'Coimbatore',
    address: 'Industrial Area, Coimbatore',
    location: [76.9800, 11.0700],
    neededWasteTypes: 'Aluminium, Steel, Copper'
  },
  {
    email: 'poc.buyer04@example.com',
    phone: '9000000014',
    companyName: 'EcoTextile Recyclers',
    registrationNumber: 'REG-POC-BUY-04',
    industryType: 'Textile Recycling',
    city: 'Erode',
    address: 'Industrial Area, Erode',
    location: [77.7300, 11.3500],
    neededWasteTypes: 'Textile, Cotton, Fabric Waste'
  },
  {
    email: 'poc.buyer05@example.com',
    phone: '9000000015',
    companyName: 'Salem Glass Recyclers',
    registrationNumber: 'REG-POC-BUY-05',
    industryType: 'Glass Recycling',
    city: 'Salem',
    address: 'Industrial Area, Salem',
    location: [78.1600, 11.6800],
    neededWasteTypes: 'Glass'
  }
];

const seedPOCData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for POC Seeding...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@12345', salt);

    // 1. Seed Sellers
    for (const seller of sellersData) {
      let user = await User.findOne({ email: seller.email });
      if (!user) {
        user = await User.create({
          email: seller.email,
          password: 'Test@12345',
          role: 'industry_user',
          isVerified: true
        });
      } else {
        user.isVerified = true;
        await user.save();
      }

      let profile = await Industry.findOne({ user: user._id });
      if (!profile) {
        profile = await Industry.create({
          user: user._id,
          companyName: seller.companyName,
          registrationNumber: seller.registrationNumber,
          businessRole: 'sender',
          contactPhone: seller.phone,
          industryType: seller.industryType,
          address: seller.address,
          city: seller.city,
          location: {
            type: 'Point',
            coordinates: seller.location
          }
        });
      } else {
        profile.companyName = seller.companyName;
        profile.businessRole = 'sender';
        profile.contactPhone = seller.phone;
        profile.industryType = seller.industryType;
        profile.address = seller.address;
        profile.city = seller.city;
        profile.location = { type: 'Point', coordinates: seller.location };
        await profile.save();
      }

      // Create / Update Waste Listing
      let waste = await Waste.findOne({ uploader: user._id, name: seller.waste.name });
      if (!waste) {
        waste = await Waste.create({
          uploader: user._id,
          name: seller.waste.name,
          category: seller.waste.category,
          subCategory: seller.waste.subCategory,
          quantity: seller.waste.quantity,
          unit: seller.waste.unit,
          price: seller.waste.price,
          predictedPrice: seller.waste.predictedPrice,
          description: seller.waste.description,
          imageUrl: seller.waste.imageUrl,
          address: seller.address,
          city: seller.city,
          location: {
            type: 'Point',
            coordinates: seller.location
          },
          status: 'available',
          purity: { estimated: seller.waste.purity },
          contamination: { percentage: seller.waste.contamination },
          qualityGrade: seller.waste.qualityGrade,
          recyclabilityScore: 90.0,
          recoveryYield: 92.0,
          aiConfidence: 0.94,
          verificationStatus: 'AI Estimated'
        });
      } else {
        waste.quantity = seller.waste.quantity;
        waste.price = seller.waste.price;
        waste.category = seller.waste.category;
        waste.subCategory = seller.waste.subCategory;
        waste.imageUrl = seller.waste.imageUrl;
        waste.status = 'available';
        waste.location = { type: 'Point', coordinates: seller.location };
        await waste.save();
      }

      // Generate Resource Passport if missing
      const passportId = `PASSPORT-POC-${seller.registrationNumber}`;
      let passport = await WasteResourcePassport.findOne({ passportId });
      if (!passport) {
        passport = await WasteResourcePassport.create({
          passportId,
          waste: waste._id,
          qrCodeData: `https://platform.industrialwaste.ai/passport/${passportId}`,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${passportId}`,
          material: seller.waste.category,
          subMaterial: seller.waste.subCategory,
          sourceIndustry: seller.companyName,
          category: seller.waste.category,
          quantity: seller.waste.quantity,
          unit: seller.waste.unit,
          purity: seller.waste.purity,
          contamination: seller.waste.contamination,
          qualityGrade: seller.waste.qualityGrade,
          damageScore: 0.5,
          recyclability: 90.0,
          recoveryYield: 92.0,
          estimatedValue: seller.waste.price * seller.waste.quantity,
          predictedPrice: seller.waste.predictedPrice * seller.waste.quantity,
          carbonSavingKg: seller.waste.quantity * 1.5,
          verificationStatus: 'AI Estimated'
        });
      }

      // Update waste with passportId
      waste.passportId = passportId;
      await waste.save();

      // Generate Waste Journey if missing
      let journey = await WasteJourney.findOne({ waste: waste._id });
      if (!journey) {
        journey = await WasteJourney.create({
          waste: waste._id,
          passportId,
          currentStatus: 'Listed',
          timeline: [
            { status: 'Generated', locationName: seller.city, notes: 'Waste generated during industrial production' },
            { status: 'Listed', locationName: seller.city, notes: 'Listed on AI Industrial Waste Exchange' },
            { status: 'AI Inspected', locationName: seller.city, notes: 'Computer Vision analysis complete' }
          ],
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${passportId}`
        });
      }
    }

    // 2. Seed Buyers
    for (const buyer of buyersData) {
      let user = await User.findOne({ email: buyer.email });
      if (!user) {
        user = await User.create({
          email: buyer.email,
          password: 'Test@12345',
          role: 'industry_user',
          isVerified: true
        });
      } else {
        user.isVerified = true;
        await user.save();
      }

      let profile = await Industry.findOne({ user: user._id });
      if (!profile) {
        profile = await Industry.create({
          user: user._id,
          companyName: buyer.companyName,
          registrationNumber: buyer.registrationNumber,
          businessRole: 'receiver',
          neededWasteTypes: buyer.neededWasteTypes,
          contactPhone: buyer.phone,
          industryType: buyer.industryType,
          address: buyer.address,
          city: buyer.city,
          location: {
            type: 'Point',
            coordinates: buyer.location
          }
        });
      } else {
        profile.companyName = buyer.companyName;
        profile.businessRole = 'receiver';
        profile.neededWasteTypes = buyer.neededWasteTypes;
        profile.contactPhone = buyer.phone;
        profile.industryType = buyer.industryType;
        profile.address = buyer.address;
        profile.city = buyer.city;
        profile.location = { type: 'Point', coordinates: buyer.location };
        await profile.save();
      }

      // Seed BuyerRequirement for Buyer
      const BuyerRequirement = require('./models/BuyerRequirement');
      let reqItem = await BuyerRequirement.findOne({ buyer: user._id });
      if (!reqItem) {
        await BuyerRequirement.create({
          buyer: user._id,
          companyProfile: profile._id,
          material: buyer.companyName.includes('RePoly') ? 'PET Plastic Scrap' : 'PET Plastic Scrap',
          category: 'Plastic Scrap',
          quantity: 500,
          unit: 'kg',
          minPurity: 95,
          maxPrice: 50,
          frequency: 'Monthly',
          address: buyer.address,
          city: buyer.city,
          location: { type: 'Point', coordinates: buyer.location },
          radiusKm: 100,
          application: 'Recycled polymer production & pelletizing',
          status: 'active'
        });
      }
    }

    // 3. Seed Equipment Listings
    const Equipment = require('./models/Equipment');
    const firstSellerUser = await User.findOne({ email: sellersData[0].email });
    if (firstSellerUser) {
      const initialMachinery = [
        {
          owner: firstSellerUser._id,
          title: '200-Ton Hydraulic Brick Press Unit',
          equipmentType: 'Hydraulic Press',
          description: 'High-pressure block molding machine suitable for fly ash geopolymer bricks.',
          hourlyRate: 45,
          dailyRate: 320,
          address: 'Industrial Area, Coimbatore',
          city: 'Coimbatore',
          location: { type: 'Point', coordinates: [76.9558, 11.0168] },
          status: 'available'
        },
        {
          owner: firstSellerUser._id,
          title: 'Dual-Shaft Heavy Polymer Shredder (15 HP)',
          equipmentType: 'Dual-Shaft Shredder',
          description: 'Industrial plastics shredder with 12mm screen mesh for HDPE and PET scrap.',
          hourlyRate: 35,
          dailyRate: 250,
          address: 'Industrial Area, Tiruppur',
          city: 'Tiruppur',
          location: { type: 'Point', coordinates: [77.3411, 11.1085] },
          status: 'available'
        },
        {
          owner: firstSellerUser._id,
          title: 'Twin-Screw Degassing Extruder & Granulator',
          equipmentType: 'Extruder & Pelletizer',
          description: 'High-capacity plastic granulator producing 3mm recycled pellets.',
          hourlyRate: 60,
          dailyRate: 450,
          address: 'Industrial Area, Erode',
          city: 'Erode',
          location: { type: 'Point', coordinates: [77.7172, 11.3410] },
          status: 'available'
        }
      ];

      for (const mach of initialMachinery) {
        let eq = await Equipment.findOne({ title: mach.title });
        if (!eq) {
          await Equipment.create(mach);
        }
      }
    }

    console.log('POC Data successfully seeded!');
    console.log('Sellers: ' + sellersData.length);
    console.log('Buyers: ' + buyersData.length);
    console.log('Waste Listings: ' + sellersData.length);
    console.log('Equipment Listings: 3');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding POC data:', err);
    process.exit(1);
  }
};

seedPOCData();

