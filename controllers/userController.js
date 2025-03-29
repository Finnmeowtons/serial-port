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
  
    const formattedNumber = UserController.formatPhoneNumber(phoneNumber);
  
    const query = `
    SELECT devices.device_number
    FROM user_devices
    JOIN devices ON user_devices.device_id = devices.id
    JOIN users ON user_devices.user_id = users.user_id
    WHERE users.phone_number = ?`;
  
    connection.query(query, [formattedNumber], (err, results) => {
      if (err) {
        console.error('Error fetching devices:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length === 0) {
        return res.status(202).json({ found: true }); 
      }
  
      res.json(results);
    });
  }
  
}

module.exports = UserController;
