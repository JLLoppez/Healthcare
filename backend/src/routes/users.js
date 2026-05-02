// routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const AppError = require('../utils/AppError');

router.use(protect);

router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.put('/profile', async (req, res, next) => {
  try {
    const disallowed = ['password', 'email', 'role', 'isActive'];
    disallowed.forEach(f => delete req.body[f]);
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/account', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
