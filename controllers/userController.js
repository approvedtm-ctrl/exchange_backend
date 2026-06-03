const User = require('../models/userModel');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { email, password, username, fullname, phone, profile_pic } = req.body;
        const userId = await User.create({ email, password, username, fullname, phone, profile_pic });
        res.status(201).json({ id: userId, email, username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, fullname, phone, profile_pic } = req.body;
        await User.update(req.params.id, { username, fullname, phone, profile_pic });
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findWithPassword(req.params.id);

        if (!user || user.password !== currentPassword) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        await User.updatePassword(req.params.id, newPassword);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        await User.delete(req.params.id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../Exchange/public/users_profile_pic');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload only images.'), false);
        }
    }
}).single('profile_pic');

const uploadProfilePic = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        try {
            // Get current user to check for existing profile pic
            const user = await User.findById(req.params.id);
            if (user && user.profile_pic) {
                const oldPicPath = path.join(__dirname, '../../Exchange/public', user.profile_pic);
                // Check if file exists and delete it
                if (fs.existsSync(oldPicPath)) {
                    fs.unlinkSync(oldPicPath);
                }
            }

            const profilePicUrl = `/users_profile_pic/${req.file.filename}`;
            await User.update(req.params.id, { profile_pic: profilePicUrl });
            res.json({
                message: 'Profile picture uploaded successfully',
                profile_pic: profilePicUrl
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateProfile,
    changePassword,
    deleteAccount,
    uploadProfilePic
};
