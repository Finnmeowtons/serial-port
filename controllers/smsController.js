const { SerialPort, ReadlineParser } = require("serialport");

const baudRate = 9600;
const port = new SerialPort({ path: "COM3", baudRate: baudRate });

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
  console.log("Serial Port Opened");
  port.write("AT+CMGD=1,4\r"); // Delete messages
  port.write("AT+CMGF=1\r"); // Enable SMS text mode
  port.write('AT+CNMI=2,2,0,0,0\r'); // Notify when an SMS is received
});

let readingSMS = false;
let smsLines = [];

parser.on("data", (data) => {
  data = data.trim();
  console.log("Received Data:", data);

  if (data.includes("+CMTI:")) {
    const match = data.match(/\+CMTI: "SM",(\d+)/);
    if (match) {
      const index = match[1];
      console.log(`Reading SMS from index: ${index}`);
      port.write(`AT+CMGR=${index}\r`);
      readingSMS = true;
      smsLines = [];
    }
    return;
  }

  if (readingSMS) {
    if (data.startsWith("+CMGR:")) return;

    if (data === "OK") {
      readingSMS = false;
      let smsMessage = smsLines.join("").substring(9).replace(/'/g, '"').trim();

      if (!smsMessage.startsWith("{")) smsMessage = "{" + smsMessage;
      if (!smsMessage.endsWith("}")) smsMessage = smsMessage + "}";

      processSMS(smsMessage);
      smsLines = [];
    } else {
      smsLines.push(data);
    }
  }
});

async function sendSMS(phoneNumber, message) {
  return new Promise((resolve, reject) => {
    const command = `AT+CMGS="${phoneNumber}"\r`;
    let buffer = '';

    // Listen for modem data
    const onData = (data) => {
      const received = data.toString();
      buffer += received;

      if (received.includes('>')) {
        // Modem ready to receive message
        port.write(message + String.fromCharCode(26)); // Ctrl+Z
        console.log(`📤 Sending SMS to ${phoneNumber}: ${message}`);
      }

      if (received.includes('OK')) {
        console.log(`✅ SMS sent successfully to ${phoneNumber}`);
        port.off('data', onData); // Remove listener
        resolve();
      }

      if (received.includes('ERROR')) {
        console.error(`❌ Failed to send SMS to ${phoneNumber}`);
        port.off('data', onData);
        reject(new Error('SMS sending failed'));
      }
    };

    port.on('data', onData);
    port.write(command);
  });
}


function sendOTP(phoneNumber, otp, res) {
  const message = `WayFinder Verification Code: ${otp}

If you didn't request this code, please ignore this message. Never share it with anyone.`;

  const command = `AT+CMGS=\"${phoneNumber}\"\r`;

  port.write(command);

  setTimeout(() => {
    port.write(message + String.fromCharCode(26)); // Ctrl+Z to send SMS
    console.log(`Sent OTP to ${phoneNumber}: ${otp}`);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  }, 1000);
}


module.exports = { sendOTP, sendSMS };
