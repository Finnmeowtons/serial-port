const connection = require('../connection/connection');
const Device = require('../models/deviceModel');
const UserDevice = require('../models/userDeviceModel');

class DeviceController {
    static connectDevice(req, res) {
    const { name, phoneNumber, deviceNumber, password } = req.body;
    const imageFile = req.file;

    if (!phoneNumber || !deviceNumber || !password || !name) {
        const missingFields = [];
        if (!phoneNumber) missingFields.push('Phone number');
        if (!deviceNumber) missingFields.push('Device number');
        if (!password) missingFields.push('Password');
        if (!name) missingFields.push('Name');
        return res.status(400).json({ error: `Missing ${missingFields.join(', ')}.` });
    }

    const formattedPhoneNumber = DeviceController.formatPhoneNumber(phoneNumber);
    const formattedDeviceNumber = DeviceController.formatPhoneNumber(deviceNumber);

    // Step 1: Find user
    connection.query('SELECT id FROM users WHERE phone_number = ?', [formattedPhoneNumber], (err, userResults) => {
        if (err) return res.status(500).json({ error: 'Database error on user check' });
        if (userResults.length === 0) return res.status(404).json({ error: 'User not found.' });

        const userId = userResults[0].id;

        // Step 2: Find device
        connection.query('SELECT id, password FROM devices WHERE device_uid = ?', [formattedDeviceNumber], (err, deviceResults) => {
            if (err) return res.status(500).json({ error: 'Database error on device check' });
            if (deviceResults.length === 0) return res.status(404).json({ error: 'Device not found.' });

            const device = deviceResults[0];
            if (device.password !== password) {
                return res.status(401).json({ error: 'Incorrect device password.' });
            }

            // Step 3: Check if device is already linked to user
            connection.query(
                'SELECT * FROM user_devices WHERE user_id = ? AND device_id = ?',
                [userId, device.id],
                (err, linkResults) => {
                    if (err) return res.status(500).json({ error: 'Database error checking device link' });

                    if (linkResults.length > 0) {
                        return res.status(400).json({ error: 'Device is already connected to this user.' });
                    }

                    // Step 4: Insert into user_devices
                    const imagePath = imageFile ? `/uploads/${imageFile.filename}` : null;
                    connection.query(
                        'INSERT INTO user_devices (user_id, device_id, name, profile_picture_url) VALUES (?, ?, ?, ?)',
                        [userId, device.id, name, imagePath],
                        (err) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.status(200).json({
                                success: true,
                                message: 'Device successfully connected to user.',
                                image: imagePath,
                            });
                        }
                    );
                }
            );
        });
    });
}


    static editDevice(req, res) {
        const { id, name } = req.body; // id of user_devices row
        console.log(req.body);

        const imageFile = req.file;
        console.log(imageFile)
        if (!id || !name) {
            const missingFields = [];
            if (!id) missingFields.push('User Device ID');
            if (!name) missingFields.push('Name');
            return res.status(400).json({ error: `Missing ${missingFields.join(', ')}.` });
        }

        // Prepare the image path if provided
        const imagePath = imageFile ? `/uploads/${imageFile.filename}` : null;

        // Build query dynamically based on whether image is provided
        let query = 'UPDATE user_devices SET name = ?';
        const params = [name];

        if (imagePath) {
            query += ', profile_picture_url = ?';
            params.push(imagePath);
        }

        query += ' WHERE id = ?';
        params.push(id);

        connection.query(query, params, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User device not found.' });
            }

            res.status(200).json({
                success: true,
                message: 'Device successfully updated.',
                updatedImage: imagePath || undefined,
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
        const { id } = req.body;
        console.log(id);

        if (!id) {
            return res.status(400).json({ error: 'ID is required.' });
        }

        connection.query('DELETE FROM user_devices WHERE id = ?', [id], (err) => {
            if (err) {
                console.log("Error Deleting")
                return res.status(500).json({ error: 'Error removing device connection' });
            
            }


                console.log("disconnected successfully")
            res.status(200).json({ success: true, message: 'Device disconnected successfully.' });

        });
    }

}

module.exports = DeviceController;