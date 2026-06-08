const { Router } = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { login, refresh, logout, getMe, loginValidation } = require('./auth.controller');

const router = Router();

// POST /api/auth/login
router.post('/login', loginValidation, login);

// POST /api/auth/refresh
router.post('/refresh', refresh);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

module.exports = router;
