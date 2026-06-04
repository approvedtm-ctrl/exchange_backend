const Wallet = require('../models/walletModel');
const Deposit = require('../models/depositModel');
const crypto = require('crypto');

const PLISIO_API_URL = 'https://api.plisio.net/api/v1';

const verifyPlisioSignature = (postData, secretKey) => {
    const receivedHash = postData.verify_hash;
    const data = { ...postData };
    delete data.verify_hash;

    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
        .map(key => `${key}=${data[key]}`)
        .join('&');

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(queryString);
    const calculatedHash = hmac.digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(calculatedHash, 'hex'),
            Buffer.from(receivedHash, 'hex')
        );
    } catch (e) {
        return false;
    }
};

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
        const { amount, currency = 'USD' } = req.body;
        const userId = req.user.id;
        const orderId = `ORDER-${userId}-${Date.now()}`;

        const params = new URLSearchParams({
            api_key: process.env.PLISIO_API_KEY,
            order_number: orderId,
            order_name: `Deposit for User ${userId}`,
            amount: amount,
            currency: currency,
            source_currency: 'ETH_BASE',
            callback_url: `${process.env.BACKEND_URL}/api/wallet/ipn?json=true`,
            success_url: `${process.env.FRONTEND_URL}/wallet/success`,
            fail_url: `${process.env.FRONTEND_URL}/wallet/failed`,
            json: 'true'
        });

        console.log('Plisio Request Params:', params.toString());

        const response = await fetch(`${PLISIO_API_URL}/invoices/new?${params.toString()}`);
        const data = await response.json();

        console.log('Plisio Response:', JSON.stringify(data, null, 2));

        if (!response.ok || data.status !== 'success') {
            throw new Error(data.data?.message || 'Failed to create payment with Plisio');
        }

        const invoice = data.data;

        // Store deposit request in DB
        await Deposit.create({
            user_id: userId,
            payment_id: invoice.txn_id,
            order_id: orderId,
            amount,
            currency,
            status: invoice.status,
            payment_data: invoice
        });

        res.json({
            payment_id: invoice.txn_id,
            invoice_url: invoice.invoice_url,
            status: invoice.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const handleIPN = async (req, res) => {
    try {
        const secret = process.env.PLISIO_API_KEY;

        // Verify IPN signature
        if (secret && !verifyPlisioSignature(req.body, secret)) {
            return res.status(400).send('Invalid signature');
        }

        const { txn_id, status, amount, currency } = req.body;

        const deposit = await Deposit.findByPaymentId(txn_id);
        if (!deposit) {
            return res.status(404).json({ message: 'Deposit not found' });
        }

        // Only update if status changed
        if (deposit.status !== status) {
            await Deposit.updateStatus(txn_id, status, req.body);

            // If payment is completed or mismatch (partially paid), update user balance
            // Plisio statuses: completed, mismatch
            if (status === 'completed' || status === 'mismatch') {
                await Wallet.updateBalance(deposit.user_id, amount);
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
