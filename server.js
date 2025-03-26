const express = require('express');
const app = express();

const routes = require('./routes');

require('./controllers/smsController'); // Initialize SMS listening
app.use(express.json());
app.use('/', routes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// const express = require("express");
// const { SerialPort, ReadlineParser } = require("serialport");

// const connection = require('./connection/connection');
// const mqtt = require("mqtt");

// const MQTT_BROKER = "mqtt://157.245.204.46:1883";
// const client = mqtt.connect(MQTT_BROKER);


// const app = express();
// app.use(express.json());

// client.on("connect", () => {
//   console.log("Connected to MQTT broker");
// });

// const baudRate = 9600;
// const port = new SerialPort({ path: "COM4", baudRate: baudRate });

// const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// port.on("open", () => {
//   console.log("Serial Port Opened");

//   port.write("AT+CMGD=1,4\r"); // Delete messages
//   port.write("AT+CMGF=1\r"); // Enable SMS text mode
//   // port.write(`AT+CMGD=1,4\r`);
//   port.write('AT+CNMI=2,2,0,0,0\r'); // Notify when an SMS is received
// });

// let readingSMS = false;
// let smsContent = "";


// parser.on("data", (data) => {
//   data = data.trim();
//   console.log("Received Data:", data);

//   if (data.includes("+CMTI:")) {
//     const match = data.match(/\+CMTI: "SM",(\d+)/);
//     if (match) {
//       const index = match[1];
//       console.log(`Reading SMS from index: ${index}`);
//       port.write(`AT+CMGR=${index}\r`); 
//       readingSMS = true;
//       smsLines = [];  // Reset message storage
//     }
//     return;
//   }

//   if (readingSMS) {
//     console.log("data", data)
//     if (data.startsWith("+CMGR:")) return;

//     if (data === "OK") {
//       readingSMS = false;
//       smsMessage = smsLines.join("").substring(9).replace(/'/g, '"').trim(); // Merge the lines

//   if (!smsMessage.startsWith("{")) smsMessage = "{" + smsMessage; // Ensure it starts with '{'
//   if (!smsMessage.endsWith("}")) smsMessage = smsMessage + "}"; // Ensure it ends with '}'

//       processSMS(smsMessage);
//       smsLines = [];
//     } else {
//       smsLines.push(data); // Store the message lines
//     }
//   }
// });

// function processSMS(message) {
//   console.log("Processing SMS:", message);

//   try {
//     // Attempt to parse the SMS message as JSON
//     console.log("EYO:", message);
//     const jsonData = JSON.parse(message);
//     console.log("JSON:", jsonData);
//     const topic = "stick/state";
//     client.publish(topic, JSON.stringify(jsonData));
//     console.log(`Published to ${topic}: ${jsonData}`);

//     console.log("Deleting processed SMS...");
//     port.write(`AT+CMGD=1,4\r`); // Delete the processed SMS
//   } catch (error) {
//     console.error("Failed to parse SMS as JSON.");
    
//     port.write(`AT+CMGD=1,4\r`); // Delete the processed SMS
//   }
// }

// function formatPhoneNumber(phoneNumber) {
//   if (phoneNumber.startsWith("0")) {
//     return `+63${phoneNumber.slice(1)}`;
//   } else if (phoneNumber.startsWith("9")) {
//     return `+63${phoneNumber}`;
//   } else if (!phoneNumber.startsWith("+")) {
//     return `+${phoneNumber}`;
//   }
//   return phoneNumber;
// }

// // Sign-in/Sign-up Endpoint
// app.post("/auth", (req, res) => {
//   const { phoneNumber, otp } = req.body;
//   console.log(phoneNumber, otp);
//   if (!phoneNumber || !otp) {
//     return res.status(400).json({ error: "Phone number and OTP are required" });
//   }

//   const formattedNumber = formatPhoneNumber(phoneNumber);
//   console.log(phoneNumber);
//   connection.query("SELECT * FROM users WHERE phone_number = ?", [formattedNumber], (err, results) => {
//     if (err) return res.status(500).json({ error: "Database error" });
    
//   console.log(results);
//     if (results.length === 0) {
//       // New user - Sign Up
//       connection.query("INSERT INTO users (phone_number) VALUES (?)", [formattedNumber], (err) => {
//         if (err) return res.status(500).json({ error: "Error signing up" });
//         sendOTP(formattedNumber, otp, res);
//       });
//     } else {
//       // Existing user - Sign In
//       sendOTP(formattedNumber, otp, res);
//     }
//   });
// });

// // Connect a user to a device
// app.post('/connect-device', (req, res) => {
//   const { phoneNumber, deviceNumber, password } = req.body;

//   if (!phoneNumber || !deviceNumber || !password) {
//     return res.status(400).json({ error: 'Phone number, device number, and password are required.' });
//   }

//   const formattedNumber = formatPhoneNumber(phoneNumber);

//   // Check if the user exists
//   connection.query('SELECT user_id FROM users WHERE phone_number = ?', [formattedNumber], (err, userResults) => {
//     if (err) return res.status(500).json({ error: 'Database error on user check' });

//     if (userResults.length === 0) {
//       return res.status(404).json({ error: 'User not found.' });
//     }

//     const userId = userResults[0].user_id;

//     // Check if the device exists and password matches
//     connection.query('SELECT id, password FROM devices WHERE device_number = ?', [deviceNumber], (err, deviceResults) => {
//       if (err) return res.status(500).json({ error: 'Database error on device check' });

//       if (deviceResults.length === 0) {
//         return res.status(404).json({ error: 'Device not found.' });
//       }

//       const device = deviceResults[0];
//       if (device.password !== password) {
//         return res.status(401).json({ error: 'Incorrect device password.' });
//       }

//       // Connect the user and device
//       connection.query('INSERT INTO user_devices (user_id, device_id) VALUES (?, ?)', [userId, device.id], (err) => {
//         if (err) return res.status(500).json({ error: err });

//         res.status(200).json({ success: true, message: 'Device successfully connected to user.' });
//       });
//     });
//   });
// });

// // Send OTP using SIM900
// function sendOTP(phoneNumber, otp, res) {
//   const message = `Your OTP is: ${otp}`;
//   const command = `AT+CMGS=\"${phoneNumber}\"\r`;

//   port.write(command);

//   setTimeout(() => {
//     port.write(message + String.fromCharCode(26)); // Ctrl+Z to send SMS
//     console.log(`Sent OTP to ${phoneNumber}: ${otp}`);
//     res.status(200).json({ success: true, message: "OTP sent successfully" });
//   }, 1000);
// }

// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });
