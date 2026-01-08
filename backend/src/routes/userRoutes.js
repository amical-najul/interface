const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const multer = require('multer');

// Multer config for memory storage (buffer for MinIO)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Admin Routes
router.get('/', auth, admin, userController.getAllUsers);
router.post('/', auth, admin, userController.createUser);
router.put('/:id', auth, admin, userController.updateUser);
router.delete('/:id', auth, admin, userController.deleteUser);

// Profile Routes (Authenticated User)
router.put('/profile/me', auth, userController.updateProfile);
router.post('/profile/avatar', auth, upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
