const { body, validationResult } = require('express-validator');
const authService = require('./auth.service');

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const tokens = await authService.refreshTokens(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // Stateless JWT — client discards token.
  // Future: add token to Redis blacklist for strict invalidation.
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, getMe, loginValidation };
