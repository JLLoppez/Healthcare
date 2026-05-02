const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { prescriptionController: pc } = require('../controllers/otherControllers');
router.use(protect);
router.get('/', pc.getPrescriptions);
router.post('/', pc.createPrescription);
router.get('/:id', pc.getPrescription);
module.exports = router;
