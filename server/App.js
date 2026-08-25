const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const corsOptions = require('./config/cors');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const wasteRoutes = require('./routes/wasteRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const transformationRoutes = require('./routes/transformationRoutes');
const gisRoutes = require('./routes/gisRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const industryRoutes = require('./routes/industryRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const sustainabilityRoutes = require('./routes/sustainabilityRoutes');
const knowledgeGraphRoutes = require('./routes/knowledgeGraphRoutes');
const buyerRequirementRoutes = require('./routes/buyerRequirementRoutes');
const traceabilityRoutes = require('./routes/traceabilityRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const demoSeedRoutes = require('./routes/demoSeedRoutes');

const app = express();

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Healthcheck
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'AI Industrial Waste Exchange Platform MERN Express Backend API' });
});

// REST API Handlers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/transformation', transformationRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/sustainability', sustainabilityRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/buyer-requirements', buyerRequirementRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/demo', demoSeedRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
