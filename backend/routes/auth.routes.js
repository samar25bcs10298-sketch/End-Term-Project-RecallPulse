const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/auth.controller.js');
const protect = require('../middlewares/auth.middleware.js');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
