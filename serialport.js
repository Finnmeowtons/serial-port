const { SerialPort, ReadlineParser } = require("serialport");
const mqtt = require("mqtt");

const MQTT_BROKER = "mqtt://157.245.204.46:1883";
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log("Connected to MQTT broker");
});

const baudRate = 9600;
const port = new SerialPort({ path: "COM4", baudRate: baudRate });

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
  console.log("Serial Port Opened");

  port.write("AT+CMGD=1,4\r"); // Delete messages
  port.write("AT+CMGF=1\r"); // Enable SMS text mode
  // port.write(`AT+CMGD=1,4\r`);
  port.write('AT+CNMI=2,2,0,0,0\r'); // Notify when an SMS is received
});

let readingSMS = false;
let smsContent = "";


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
      smsLines = [];  // Reset message storage
    }
    return;
  }

  if (readingSMS) {
    console.log("data", data)
    if (data.startsWith("+CMGR:")) return;

    if (data === "OK") {
      readingSMS = false;
      smsMessage = smsLines.join("").substring(9).replace(/'/g, '"').trim(); // Merge the lines

  if (!smsMessage.startsWith("{")) smsMessage = "{" + smsMessage; // Ensure it starts with '{'
  if (!smsMessage.endsWith("}")) smsMessage = smsMessage + "}"; // Ensure it ends with '}'

      processSMS(smsMessage);
      smsLines = [];
    } else {
      smsLines.push(data); // Store the message lines
    }
  }
});

function processSMS(message) {
  console.log("Processing SMS:", message);

  try {
    // Attempt to parse the SMS message as JSON
    console.log("EYO:", message);
    const jsonData = JSON.parse(message);
    console.log("JSON:", jsonData);
    const topic = "stick/state";
    client.publish(topic, JSON.stringify(jsonData));
    console.log(`Published to ${topic}: ${jsonData}`);

    console.log("Deleting processed SMS...");
    port.write(`AT+CMGD=1,4\r`); // Delete the processed SMS
  } catch (error) {
    console.error("Failed to parse SMS as JSON. Falling back to regex parsing.");
    // fallbackRegexParsing(message);
    
    port.write(`AT+CMGD=1,4\r`); // Delete the processed SMS
  }
}

// Fallback function for non-JSON messages
function fallbackRegexParsing(message) {
  const gpsRegex = /GPS:\s*LONGITUDE:\s*([\d.-]+),\s*LATITUDE:\s*([\d.-]+)/i;
  const match = gpsRegex.exec(message);

  if (match) {
    const longitude = match[1];
    const latitude = match[2];
    const gpsValue = `${longitude}, ${latitude}`;

    client.publish("component/gps", gpsValue);
    console.log(`Published to component/gps: ${gpsValue}`);
  }

  const regex = /(BATTERY|WET|OBSTACLE):\s*([\w\d.]+)/gi;
  let additionalMatch;
  
  while ((additionalMatch = regex.exec(message)) !== null) {
    const key = additionalMatch[1].toLowerCase();
    const value = additionalMatch[2];

    client.publish(`component/${key}`, value);
    console.log(`Published to component/${key}: ${value}`);
  }

  
  console.log("Deleting processed SMS...");
  port.write(`AT+CMGD=1,4\r`);  // Delete the processed SMS
}
