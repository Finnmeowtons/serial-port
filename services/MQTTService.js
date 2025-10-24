const mqtt = require("mqtt");
const connection = require('../connection/connection');
const { sendSMS } = require('../controllers/smsController');
const NodeGeocoder = require('node-geocoder');

const MQTT_BROKER = "mqtt://localhost:1884";
const client = mqtt.connect(MQTT_BROKER);

// Configure geocoder (using OpenStreetMap)
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

// Track last geocode timestamp per device
const lastGeocodeTimestamps = {};

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  // Subscribe to all SOS and location topics
  client.subscribe(["wayfinder/device/+/sos", "wayfinder/device/+/location"], (err) => {
    if (err) console.error("Failed to subscribe to topics:", err);
    else console.log("Subscribed to SOS and location topics");
  });
});

client.on("message", async (topic, message) => {
  try {
    const payload = message.toString();

    // --- SOS handler ---
    if (topic.startsWith("wayfinder/device/") && topic.endsWith("/sos")) {
      const deviceUid = "+" + topic.split("/")[2];
      console.log(`🚨 SOS received from device: ${deviceUid}`);

      const getConnectionQuery = `
        SELECT ud.name AS user_name, u.phone_number, d.device_uid
        FROM user_devices ud
        JOIN users u ON u.id = ud.user_id
        JOIN devices d ON d.id = ud.device_id
        WHERE d.device_uid = ?`;

      connection.query(getConnectionQuery, [deviceUid], async (err, connectionResults) => {
        if (err) return console.error("❌ Error fetching user_devices:", err);
        if (connectionResults.length === 0) return console.warn(`⚠️ No linked users found for device ${deviceUid}`);

        for (const result of connectionResults) {
          const alertMessage = `ALERT: ${result.user_name} needs help! (Sent via WayFinder device ${result.device_uid})`;
          await sendSMS(result.phone_number, alertMessage);
          console.log(`📩 Sent SOS alert to ${result.phone_number}`);

          // Optional 3-second cooldown before sending the next SMS
          await new Promise((r) => setTimeout(r, 3000));
        }


        ;
      });
    }

    // --- Location handler ---
    else if (topic.startsWith("wayfinder/device/") && topic.endsWith("/location")) {
      const deviceUid = topic.split("/")[2];
      const now = Date.now();

      // Throttle geocoding to once every 10 seconds per device
      if (lastGeocodeTimestamps[deviceUid] && now - lastGeocodeTimestamps[deviceUid] < 3000) {
        return; // skip
      }

      lastGeocodeTimestamps[deviceUid] = now;

      // Parse location payload
      let lat, lng;
      try {
        const loc = JSON.parse(payload);
        lat = loc.latitude;
        lng = loc.longitude;
      } catch (err) {
        console.error("❌ Failed to parse location payload:", payload);
        return;
      }

      if (lat != null && lng != null) {
        const res = await geocoder.reverse({ lat, lon: lng });
        const geo = res[0];

        if (!geo) return;

        // Construct short address using structured fields
        const street = geo.streetName || "";
        const neighbourhood = geo.neighbourhood || "";
        const city = geo.city || "";

        // Only include non-empty parts
        const location = [street, neighbourhood, city].filter(s => s).join(", ");

        console.log(`📍 Device ${deviceUid} is at: ${location}`);

        // Publish geocode back to device
        const geocodeTopic = `wayfinder/device/${deviceUid}/geocode`;
        client.publish(geocodeTopic, JSON.stringify({ location }), (err) => {
          if (err) console.error("Failed to publish geocode:", err);
          else console.log(`✅ Published geocode to ${geocodeTopic}`);
        });
      }
    }

  } catch (err) {
    console.error("Error processing MQTT message:", err);
  }
});
