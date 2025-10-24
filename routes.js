const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const deviceController = require('./controllers/deviceController');
const upload = require("./multer")

// Authentication
router.post('/auth', userController.signUpOrSignIn);
router.post('/confirm', userController.confirmUser);

// Get user's devices
router.post('/get-devices', userController.getUserDevices);

// Edit user's device
router.put('/edit-device',  upload.single("image"), deviceController.editDevice)

// Device
router.delete('/delete-device', deviceController.deleteDevice);
router.post("/connect-device", upload.single("image"), deviceController.connectDevice);

module.exports = router;
