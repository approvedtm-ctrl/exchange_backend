const db = require('../config/db');

const Deposit = {
    create: async (depositData) => {
        const { user_id, payment_id, order_id, amount, currency, status, payment_data } = depositData;
        const [result] = await db.query(
            'INSERT INTO deposits (user_id, payment_id, order_id, amount, currency, status, payment_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, payment_id, order_id, amount, currency, status, JSON.stringify(payment_data)]
        );
        return result.insertId;
    },

    findByPaymentId: async (paymentId) => {
        const [rows] = await db.query('SELECT * FROM deposits WHERE payment_id = ?', [paymentId]);
        return rows[0];
    },

    updateStatus: async (paymentId, status, payment_data) => {
        await db.query(
            'UPDATE deposits SET status = ?, payment_data = ? WHERE payment_id = ?',
            [status, JSON.stringify(payment_data), paymentId]
        );
        return true;
    }
};

module.exports = Deposit;
