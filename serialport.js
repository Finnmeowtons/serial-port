const { SerialPort, ReadlineParser } = require("serialport");
const mqtt = require("mqtt");

const MQTT_BROKER = "mqtt://157.245.204.46:1883"; // Change this if using a remote broker
const MQTT_TOPIC = "sms/data";

// Connect to MQTT broker (no authentication)
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log("Connected to MQTT broker");
});

const baudRate = 9600;
const port = new SerialPort({ path: "COM5", baudRate: baudRate });

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
  console.log("Serial Port Opened");

  // Enable SMS text mode
  port.write("AT+CMGF=1\r");

  // Set SIM900 to notify when an SMS is received
  port.write('AT+CNMI=2,2,0,0,0\r');
});

parser.on("data", (data) => {
  console.log("Received Data:", data);

  // If we receive an SMS notification, extract the message index
  if (data.includes("+CMTI:")) {
    const match = data.match(/\+CMTI: "SM",(\d+)/);
    if (match) {
      const index = match[1];
      console.log(`Reading SMS from index: ${index}`);
      port.write(`AT+CMGR=${index}\r`); // Read SMS at the given index
    }
  }

  // Publish received data to MQTT
  client.publish(MQTT_TOPIC, data);
});
