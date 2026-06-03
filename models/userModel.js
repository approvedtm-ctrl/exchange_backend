const db = require('../config/db');

const User = {
    findAll: async () => {
        const [rows] = await db.query('SELECT id, email, username, fullname, phone, profile_pic, created_at FROM users');
        return rows;
    },
    findById: async (id) => {
        const [rows] = await db.query('SELECT id, email, username, fullname, phone, profile_pic, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    },
    findWithPassword: async (id) => {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    },
    findWithPasswordByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },
    create: async (userData) => {
        const { email, password, username, fullname, phone, profile_pic } = userData;
        const [result] = await db.query(
            'INSERT INTO users (email, password, username, fullname, phone, profile_pic) VALUES (?, ?, ?, ?, ?, ?)',
            [email, password, username, fullname, phone, profile_pic]
        );
        return result.insertId;
    },
    update: async (id, userData) => {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(userData)) {
            // Only update if value is provided and not empty
            if (value !== undefined && value !== null && value !== '') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) return true;

        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(query, values);
        return true;
    },
    updatePassword: async (id, newPassword) => {
        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);
        return true;
    },
    delete: async (id) => {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    }
};

module.exports = User;
