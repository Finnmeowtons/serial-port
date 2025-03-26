const connection = require('../connection/connection');
const User = require('../models/userModel');
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

  static formatPhoneNumber(phoneNumber) {
    if (phoneNumber.startsWith('0')) return `+63${phoneNumber.slice(1)}`;
    if (phoneNumber.startsWith('9')) return `+63${phoneNumber}`;
    if (!phoneNumber.startsWith('+')) return `+${phoneNumber}`;
    return phoneNumber;
  }
}

module.exports = UserController;
