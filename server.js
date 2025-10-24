const express = require('express');
const path = require('path');
const app = express();
const routes = require('./routes');

app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

require('./controllers/smsController');

// ✅ Start MQTT service so it subscribes and runs in the background
require('./services/MQTTService');
app.use('/', routes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
