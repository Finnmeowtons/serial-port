const connection = require('../connection/connection');
const Device = require('../models/deviceModel');
const UserDevice = require('../models/userDeviceModel');

class DeviceController {
    static connectDevice(req, res) {
        const { phoneNumber, deviceNumber, password } = req.body;
        console.log(req.body);

        if (!phoneNumber || !deviceNumber || !password) {
            const missingFields = [];
            if (!phoneNumber) missingFields.push('Phone number');
            if (!deviceNumber) missingFields.push('Device number');
            if (!password) missingFields.push('Password');
          
            return res.status(400).json({ error: `Missing ${missingFields.join(', ')}.` });
          }
          

        const formattedPhoneNumber = DeviceController.formatPhoneNumber(phoneNumber);
        const formattedDeviceNumber = DeviceController.formatPhoneNumber(deviceNumber);
        
        console.log(`Phone: ${formattedPhoneNumber}`);
        console.log(`SELECT id FROM users WHERE phone_number =`,formattedPhoneNumber);

        connection.query('SELECT id FROM users WHERE phone_number = ?', [formattedPhoneNumber], (err, userResults) => {
            if (err) return res.status(500).json({ error: 'Database error on user check' });
            console.log("user results: " + JSON.stringify(userResults, null, 2))
            if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const userId = userResults[0].id;
            console.log("User ID: " + userId);
            connection.query('SELECT id, password FROM devices WHERE device_uid = ?', [formattedDeviceNumber], (err, deviceResults) => {
                if (err) return res.status(500).json({ error: 'Database error on device check' + err });
                console.log("device results: "+userResults)
                if (deviceResults.length === 0) {
                    return res.status(404).json({ error: 'Device not found.' });
                }

                const device = deviceResults[0];
                if (device.password !== password) {
                    return res.status(401).json({ error: 'Incorrect device password.' });
                }

                connection.query('INSERT INTO user_devices (user_id, device_id) VALUES (?, ?)', [userId, device.id], (err) => {
                    if (err) return res.status(500).json({ error: err });
                    console.log(`Device connected. Phone: ${formattedPhoneNumber}, Device: ${formattedDeviceNumber}`);
                    res.status(200).json({ success: true, message: 'Device successfully connected to user.' });
                });
            });
        });
    }

    static formatPhoneNumber(phoneNumber) {
        if (phoneNumber.startsWith('0')) return `+63${phoneNumber.slice(1)}`;
        if (phoneNumber.startsWith('9')) return `+63${phoneNumber}`;
        if (!phoneNumber.startsWith('+')) return `+${phoneNumber}`;
        return phoneNumber;
    }

    static deleteDevice(req, res) {
        console.log("deleteing")
        const { phoneNumber, deviceNumber } = req.body;
    
        if (!phoneNumber || !deviceNumber) {
            return res.status(400).json({ error: 'Phone number and device number are required.' });
        }
    
        const formattedPhoneNumber = DeviceController.formatPhoneNumber(phoneNumber);
        const formattedDeviceNumber = DeviceController.formatPhoneNumber(deviceNumber);
    
        connection.query('SELECT id FROM users WHERE phone_number = ?', [formattedPhoneNumber], (err, userResults) => {
            if (err) return res.status(500).json({ error: 'Database error on user check' });
            if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }
    
            const userId = userResults[0].id;
    
            connection.query('SELECT id FROM devices WHERE device_uid = ?', [formattedDeviceNumber], (err, deviceResults) => {
                if (err) return res.status(500).json({ error: 'Database error on device check' });
                if (deviceResults.length === 0) {
                    return res.status(404).json({ error: 'Device not found.' });
                }
    
                const deviceId = deviceResults[0].id;
    
                // Delete connection from user_devices table
                connection.query('DELETE FROM user_devices WHERE user_id = ? AND device_id = ?', [userId, deviceId], (err) => {
                    if (err) return res.status(500).json({ error: 'Error removing device connection' });
                    

                    res.status(200).json({ success: true, message: 'Device disconnected successfully.' });
                   
                });
            });
        });
    }
    
}

module.exports = DeviceController;