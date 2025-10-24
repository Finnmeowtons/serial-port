const connection = require('../connection/connection');
const User = require('../models/userModel');
const tokenService = require('../services/tokenService');
const { sendOTP } = require('../controllers/smsController');

class UserController {
  static signUpOrSignIn(req, res) {
    const { phoneNumber, otp } = req.body;
    console.log(req.body);

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const formattedNumber = UserController.formatPhoneNumber(phoneNumber);
    console.log(`Phone: ${formattedNumber}`);

    connection.query('SELECT * FROM users WHERE phone_number = ?', [formattedNumber], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      console.log('User results:', results);

      if (results.length === 0) {
        connection.query('INSERT INTO users (phone_number) VALUES (?)', [formattedNumber], (err, insertResult) => {
          if (err) return res.status(500).json({ error: 'Error signing up' });
          console.log(`User signed up. Phone: ${formattedNumber}, ID: ${insertResult.insertId}`);
          sendOTP(formattedNumber, otp, res)
        });
      } else {
        console.log(`User signed in. Phone: ${formattedNumber}`);

        sendOTP(formattedNumber, otp, res)
      }
    });
  }

  static confirmUser(req, res) {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const formattedNumber = UserController.formatPhoneNumber(phoneNumber);

    connection.query('SELECT * FROM users WHERE phone_number = ?', [formattedNumber], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = results[0];
      const token = tokenService.generateToken(user.user_id, formattedNumber);
      console.log(`User confirmed. Token: ${token}`);
      res.json({ success: true, message: 'User confirmed successfully', token });
    });
  }

  static formatPhoneNumber(phoneNumber) {
    if (phoneNumber.startsWith('0')) return `+63${phoneNumber.slice(1)}`;
    if (phoneNumber.startsWith('9')) return `+63${phoneNumber}`;
    if (!phoneNumber.startsWith('+')) return `+${phoneNumber}`;
    return phoneNumber;
  }

 static getUserDevices(req, res) {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const formattedPhoneNumber = UserController.formatPhoneNumber(phoneNumber);
  console.log("Getting all registered devices for phone number:", formattedPhoneNumber);

  // Step 1: Find user_id by phone number
  const getUserQuery = `SELECT id FROM users WHERE phone_number = ?`;

  connection.query(getUserQuery, [formattedPhoneNumber], (err, userResults) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error (users)' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResults[0].id;

    // Step 2: Get all devices linked to that user_id
    const getDevicesQuery = `
      SELECT ud.id, d.device_uid, ud.name, ud.profile_picture_url
      FROM user_devices ud
      JOIN devices d ON ud.device_id = d.id
      WHERE ud.user_id = ?
    `;

    connection.query(getDevicesQuery, [userId], (err, deviceResults) => {
      if (err) {
        console.error('Error fetching devices:', err);
        return res.status(500).json({ error: 'Database error (devices)' });
      }

      // ✅ Return an empty array instead of message
      return res.status(200).json(deviceResults || []);
    });
  });
}




}

module.exports = UserController;
