const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAppointments, getAppointment, createAppointment,
  updateAppointmentStatus, rescheduleAppointment,
  addDoctorNotes, getUpcomingAppointments
} = require('../controllers/appointmentController');

router.use(protect);
router.get('/upcoming', getUpcomingAppointments);
router.get('/', getAppointments);
router.post('/', authorize('patient'), createAppointment);
router.get('/:id', getAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.put('/:id/reschedule', rescheduleAppointment);
router.patch('/:id/notes', authorize('doctor'), addDoctorNotes);

module.exports = router;
