const mqtt = require("mqtt");

const MQTT_BROKER = "mqtt://157.245.204.46:1883";
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log("Connected to MQTT broker");
});

const MQTTService = {
  publish(topic, message) {
    client.publish(topic, JSON.stringify(message), (err) => {
      if (err) {
        console.error("Failed to publish message:", err);
      } else {
        console.log(`Published to ${topic}:`, message);
      }
    });
  },
};

module.exports = MQTTService;
