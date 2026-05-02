// routes/video.js
const express = require('express');
const r1 = express.Router();
const { protect } = require('../middleware/auth');
const { videoController: vc } = require('../controllers/otherControllers');
r1.use(protect);
r1.post('/create-room', vc.createRoom);
r1.get('/token/:appointmentId', vc.getRoomToken);
module.exports = r1;
