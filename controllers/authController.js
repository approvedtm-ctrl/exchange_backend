const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    try {
        const { email, password, username, fullname } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userId = await User.create({
            email,
            password: hashedPassword,
            username,
            fullname
        });

        // Generate token
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: userId, email, username, fullname }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password for comparison
        const user = await User.findWithPasswordByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    signup,
    login
};
