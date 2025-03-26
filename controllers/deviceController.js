const connection = require('../connection/connection');
const Device = require('../models/deviceModel');
const UserDevice = require('../models/userDeviceModel');

class DeviceController {
    static connectDevice(req, res) {
        const { phoneNumber, deviceNumber, password } = req.body;
        console.log(req.body);

        if (!phoneNumber || !deviceNumber || !password) {
            return res.status(400).json({ error: 'Phone number, device number, and password are required.' });
        }

        const formattedNumber = DeviceController.formatPhoneNumber(phoneNumber);
        console.log(`Phone: ${formattedNumber}`);

        connection.query('SELECT user_id FROM users WHERE phone_number = ?', [formattedNumber], (err, userResults) => {
            if (err) return res.status(500).json({ error: 'Database error on user check' });
            console.log("user results: " + JSON.stringify(userResults, null, 2))
            if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const userId = userResults[0].user_id;

            connection.query('SELECT id, password FROM devices WHERE device_number = ?', [deviceNumber], (err, deviceResults) => {
                if (err) return res.status(500).json({ error: 'Database error on device check' + err });
                console.log("device results: "+userResults)
                if (deviceResults.length === 0) {
                    return res.status(404).json({ error: 'Device not found.' });
                }

                const device = deviceResults[0];
                if (device.password !== password) {
                    return res.status(401).json({ error: 'Incorrect device password.' });
                }

                connection.query('INSERT IGNORE INTO user_devices (user_id, device_id) VALUES (?, ?)', [userId, device.id], (err) => {
                    if (err) return res.status(500).json({ error: err });
                    console.log(`Device connected. Phone: ${formattedNumber}, Device: ${deviceNumber}`);
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
}

module.exports = DeviceController;