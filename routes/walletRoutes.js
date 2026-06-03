const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// Public route for IPN callback (NowPayments sends this)
router.post('/ipn', walletController.handleIPN);

// Protected routes
router.get('/balance', protect, walletController.getBalance);
router.post('/deposit', protect, walletController.createPayment);

module.exports = router;
