const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getEquipmentListings,
  createEquipment,
  bookEquipment,
  updateBookingStatus,
  getMyBookings,
  recommendEquipment
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', getEquipmentListings);
router.get('/recommend', recommendEquipment);
router.get('/my/bookings', protect, getMyBookings);
router.post('/', protect, upload.single('image'), createEquipment);
router.post('/:id/book', protect, bookEquipment);
router.patch('/bookings/:id/status', protect, updateBookingStatus);

module.exports = router;
