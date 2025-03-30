const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const deviceController = require('./controllers/deviceController');

// Authentication
router.post('/auth', userController.signUpOrSignIn);
router.post('/confirm', userController.confirmUser);

// Get user's devices
router.post('/get-devices', userController.getUserDevices);

// Device
router.delete('/delete-device', deviceController.deleteDevice);
router.post('/connect-device', deviceController.connectDevice);

module.exports = router;
