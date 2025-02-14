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
      smsContent = ""; 
    }
    return;
  }

  if (readingSMS) {
    if (data.startsWith("+CMGR:")) return;

    smsContent += data + " ";

    if (data === "OK") {
      readingSMS = false;
      processSMS(smsContent.trim());
      smsContent = "";
    }
  }
});

// Function to process and extract data from SMS
function processSMS(message) {
  console.log("Processing SMS:", message);

  const regex = /(BATTERY|GPS|WET|OBSTACLE):\s*([\w\d.]+)/gi;
  let match;

  while ((match = regex.exec(message)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2];

    let topic = `component/${key}`;
    client.publish(topic, value);
    console.log(`Published to ${topic}: ${value}`);
  }

  console.log("Deleting processed SMS...");
  port.write(`AT+CMGD=1,4\r`);
}
