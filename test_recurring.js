const { RecurrenceEngine } = require('./static/js/data.js');

// Node cannot require browser-style module; instead create a small harness that loads the file
// We'll instead implement a minimal runner that imports the file content and evals RecurrenceEngine
const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, 'static/js/data.js'), 'utf8');

// Evaluate in a sandbox to extract RecurrenceEngine
const vm = require('vm');
const sandbox = { module: {}, console, require };
vm.createContext(sandbox);
vm.runInContext(code + '\nmodule.exports = { RecurrenceEngine };', sandbox);
const RE = sandbox.module.exports.RecurrenceEngine;

function assertEqual(a, b, msg) {
    if (a !== b) {
        console.error('ASSERT FAIL:', msg, a, '!==', b);
        process.exit(1);
    } else {
        console.log('ok:', msg, a);
    }
}

// Test cases
const taskBase = (startDate, frequency, interval=1, currentInstance=1) => ({
    recurrence: { enabled: true, startDate, frequency, interval, currentInstance }
});

// Weekly: 2026-05-20 -> 2026-05-27
assertEqual(RE.calculateNextInstance(taskBase('2026-05-20', 'weekly', 1, 2)), '2026-05-27', 'weekly next');
// Monthly: 2026-05-20 -> 2026-06-20
assertEqual(RE.calculateNextInstance(taskBase('2026-05-20', 'monthly', 1, 2)), '2026-06-20', 'monthly next');
// Yearly: 2026-05-20 -> 2027-05-20
assertEqual(RE.calculateNextInstance(taskBase('2026-05-20', 'yearly', 1, 2)), '2027-05-20', 'yearly next');
// Daily: 2026-05-20 -> 2026-05-21
assertEqual(RE.calculateNextInstance(taskBase('2026-05-20', 'daily', 1, 2)), '2026-05-21', 'daily next');

console.log('All recurrence tests passed');
