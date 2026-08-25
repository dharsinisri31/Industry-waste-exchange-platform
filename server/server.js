require('dotenv').config();
const app = require('./App');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
  });
}).catch((error) => {
  console.error(`Failed to establish database connection: ${error.message}`);
  const server = app.listen(PORT, () => {
    console.log(`Server running in fallback mode on port ${PORT}`);
  });
});
