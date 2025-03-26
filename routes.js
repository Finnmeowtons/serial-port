const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const deviceController = require('./controllers/deviceController');

// Authentication
router.post('/auth', userController.signUpOrSignIn);

// Get user's devices
router.post('/get-devices', userController.getUserDevices);

// Device
router.post('/connect-device', deviceController.connectDevice);

module.exports = router;
