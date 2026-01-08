const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

// SMTP settings (admin only)
router.get('/smtp', auth, admin, settingsController.getSmtpSettings);
router.put('/smtp', auth, admin, settingsController.updateSmtpSettings);

module.exports = router;
