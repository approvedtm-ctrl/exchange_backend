const db = require('../config/db');

const User = {
    findAll: async () => {
        const [rows] = await db.query('SELECT * FROM users');
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    },
    create: async (userData) => {
        const { email, name } = userData;
        const [result] = await db.query('INSERT INTO users (email, name) VALUES (?, ?)', [email, name]);
        return result.insertId;
    }
};

module.exports = User;
