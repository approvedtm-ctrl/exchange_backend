const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateProfile);
router.put('/:id/password', userController.changePassword);
router.delete('/:id', userController.deleteAccount);
router.post('/:id/profile-pic', userController.uploadProfilePic);

module.exports = router;
