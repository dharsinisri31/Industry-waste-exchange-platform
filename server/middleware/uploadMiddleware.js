const upload = require('../config/multer');

const uploadImageMiddleware = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

module.exports = uploadImageMiddleware;
