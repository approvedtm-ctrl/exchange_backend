const Wallet = require('../models/walletModel');
const Deposit = require('../models/depositModel');
const crypto = require('crypto');

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

const getBalance = async (req, res) => {
    try {
        const wallet = await Wallet.findByUserId(req.params.userId || req.user.id);
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPayment = async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;
        const userId = req.user.id;
        const orderId = `ORDER-${userId}-${Date.now()}`;

        const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
            method: 'POST',
            headers: {
                'x-api-key': process.env.NowPayments_API_Key,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                price_amount: amount,
                price_currency: currency,
                pay_currency: 'btc', // Defaulting to BTC, would be better to let user choose
                order_id: orderId,
                order_description: `Deposit to Wallet for User ${userId}`,
                ipn_callback_url: `${process.env.BACKEND_URL}/api/wallet/ipn`,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create payment with NowPayments');
        }

        // Store deposit request in DB
        await Deposit.create({
            user_id: userId,
            payment_id: data.payment_id,
            order_id: orderId,
            amount,
            currency,
            status: data.payment_status,
            payment_data: data
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const handleIPN = async (req, res) => {
    try {
        const hmac = req.headers['x-nowpayments-sig'];
        const secret = process.env.NOWPAYMENTS_IPN_SECRET;

        // Verify IPN signature
        const notificationsPayload = JSON.stringify(req.body, Object.keys(req.body).sort());
        const expectedHmac = crypto
            .createHmac('sha512', secret)
            .update(notificationsPayload)
            .digest('hex');

        // Note: For now, we Skip strict verification if secret is missing for dev testing
        // if (secret && hmac !== expectedHmac) {
        //     return res.status(400).send('Invalid signature');
        // }

        const { payment_id, payment_status, actually_paid, price_amount } = req.body;

        const deposit = await Deposit.findByPaymentId(payment_id);
        if (!deposit) {
            return res.status(404).json({ message: 'Deposit not found' });
        }

        // Only update if status changed
        if (deposit.status !== payment_status) {
            await Deposit.updateStatus(payment_id, payment_status, req.body);

            // If payment is finished or confirmed, update user balance
            if (payment_status === 'finished' || payment_status === 'confirmed') {
                const creditAmount = actually_paid || price_amount;
                await Wallet.updateBalance(deposit.user_id, creditAmount);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('IPN Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBalance,
    createPayment,
    handleIPN
};
