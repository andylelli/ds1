import { spawn } from 'child_process';
import http from 'http';

console.log("Starting server...");
const server = spawn('node', ['dist/index.js'], { stdio: 'pipe' });

server.stdout.on('data', (data) => {
  console.log(`[Server]: ${data}`);
  if (data.toString().includes('Server running on port 3000')) {
    console.log("Server is ready. Triggering simulation...");
    triggerSimulation();
  }
});

server.stderr.on('data', (data) => {
  console.error(`[Server Error]: ${data}`);
});

function triggerSimulation() {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/simulation/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    console.log(`Simulation Triggered. Status: ${res.statusCode}`);
    res.on('data', (d) => {
      console.log(`Response: ${d}`);
    });
    
    // Wait a bit for logs to appear then exit
    setTimeout(() => {
      console.log("Stopping server...");
      server.kill();
      process.exit(0);
    }, 5000);
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    server.kill();
  });

  req.end();
}
