// Writes rules/ipc-7351b.json so Python, SKILL or other tools can read the same rules.
// Run: node tools/export-json.js
'use strict';
const fs = require('fs');
const path = require('path');
const rules = require('../rules/ipc-7351b.js');
const out = path.join(__dirname, '..', 'rules', 'ipc-7351b.json');
fs.writeFileSync(out, JSON.stringify(rules, null, 2) + '\n');
console.log('wrote ' + out);
