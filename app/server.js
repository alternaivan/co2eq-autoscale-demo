var http = require('http');
var https = require('https');
var os = require('os');

var totalrequests = 0;
var carbonIntensity = 0;
var lastCarbonUpdate = null;

// Configuration
const API_KEY = process.env.ELECTRICITY_MAPS_API_KEY || 'your-api-key';
const ZONE = process.env.ZONE || 'RS'; // Serbia
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL_MS || 60000; // 1 minute in milliseconds

// Function to fetch carbon intensity data
function fetchCarbonIntensity() {
  console.log('Fetching carbon intensity data...');
  
  // Get current datetime in ISO format
  const now = new Date();
  const datetime = now.toISOString().slice(0, 16).replace('T', '+').replace(':', '%3A');
  
  const url = `https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=${ZONE}`;
  
  const urlObj = require('url').parse(url);
  
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.path,
    method: 'GET',
    headers: {
      'auth-token': API_KEY,
      'User-Agent': 'Node.js Carbon Intensity Monitor'
    },
    // Add certificate options for environments with certificate issues
    rejectUnauthorized: false
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          carbonIntensity = response.carbonIntensity || 0;
          lastCarbonUpdate = new Date();
          console.log(`Carbon intensity updated: ${carbonIntensity} gCO2eq/kWh`);
        } else {
          console.error(`API request failed with status ${res.statusCode}: ${data}`);
        }
      } catch (error) {
        console.error('Error parsing API response:', error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error fetching carbon intensity:', error);
  });

  req.end();
}

// Initial fetch and set up periodic updates
fetchCarbonIntensity();
setInterval(fetchCarbonIntensity, UPDATE_INTERVAL);

http.createServer(function(request, response) {
  totalrequests += 1;

  if (request.url == "/metrics") {
    // Set the proper Content-Type header for Prometheus
    response.writeHead(200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
    });

    // Prometheus metrics format
    var metrics = "# HELP http_requests_total The amount of requests served by the server in total\n";
    metrics += "# TYPE http_requests_total counter\n";
    metrics += "http_requests_total " + totalrequests + "\n\n";
    
    metrics += "# HELP carbon_intensity_gco2_per_kwh Current carbon intensity in gCO2eq/kWh for zone " + ZONE + "\n";
    metrics += "# TYPE carbon_intensity_gco2_per_kwh gauge\n";
    metrics += "carbon_intensity_gco2_per_kwh{zone=\"" + ZONE + "\"} " + carbonIntensity + "\n\n";
    
    if (lastCarbonUpdate) {
      metrics += "# HELP carbon_intensity_last_update_timestamp Unix timestamp of last carbon intensity update\n";
      metrics += "# TYPE carbon_intensity_last_update_timestamp gauge\n";
      metrics += "carbon_intensity_last_update_timestamp " + Math.floor(lastCarbonUpdate.getTime() / 1000) + "\n";
    }

    response.end(metrics);
    return;
  }

  // For non-metrics requests
  response.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  response.end("Hello! My name is " + os.hostname() + ". I have served " + totalrequests + " requests so far.\n");
}).listen(8080, function() {
  console.log('Server running on port 8080');
  console.log('Metrics available at http://localhost:8080/metrics');
  console.log('Using ElectricityMaps API for zone:', ZONE);
  console.log('Carbon intensity will be updated every', UPDATE_INTERVAL / 60000, 'minutes');
});
