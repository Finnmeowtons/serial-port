const mqtt = require("mqtt");

const MQTT_BROKER = "mqtt://157.245.204.46:1883"; // Change if needed
const MQTT_TOPIC = "sms/data";

// Connect to MQTT broker
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log("MQTT Server Connected");
  client.subscribe(MQTT_TOPIC, () => {
    console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
  });
});

client.on("message", (topic, message) => {
  console.log(`Received on ${topic}: ${message.toString()}`);
});
