const db = require('../config/db');

const Wallet = {
    findByUserId: async (userId) => {
        const [rows] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
        // If wallet doesn't exist, create it
        if (rows.length === 0) {
            await db.query('INSERT INTO wallets (user_id, balance) VALUES (?, 0)', [userId]);
            const [newRows] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
            return newRows[0];
        }
        return rows[0];
    },

    updateBalance: async (userId, amount) => {
        const [result] = await db.query(
            'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
            [amount, userId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Wallet;
