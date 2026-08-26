const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure dedicated local upload folder exists
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, 'doc-' + uniqueSuffix + path.extname(safeName));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf|doc|docx|txt|csv/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExtensions.test(ext)) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid document type. Allowed formats: PDF, DOC, DOCX, PNG, JPG, JPEG, CSV, TXT.'));
  }
};

const uploadDoc = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

const uploadDocMiddleware = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = uploadDoc.single(fieldName);
    singleUpload(req, res, function (err) {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
};

module.exports = uploadDocMiddleware;
