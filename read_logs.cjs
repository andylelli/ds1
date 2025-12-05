const fs = require('fs');
const db = JSON.parse(fs.readFileSync('sandbox_db.json', 'utf8'));
const logs = db.DropShipDB.AgentMemory;
console.log(JSON.stringify(logs.slice(-10), null, 2));
