const cloudinary = require('cloudinary').v2;

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.log('[Cloudinary] Missing configurations. Falling back to local image URLs.');
}

const uploadToCloudinary = async (filePath) => {
  if (!isConfigured) {
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'industrial_waste_exchange'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failure:', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  isConfigured
};
