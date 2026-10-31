// Golden tests: every worked example must reproduce exactly.
// Run: node test/run-tests.js
'use strict';
const rules = require('../rules/ipc-7351b.js');
const IPCNamer = require('../src/namer.js');
const namer = IPCNamer.create(rules);

let pass = 0;
let fail = 0;
function check(label, got, expect) {
  if (got === expect) { pass++; }
  else { fail++; console.log('FAIL ' + label + '\n     got:    ' + got + '\n     expect: ' + expect); }
}

// 1. worked examples
for (const ex of rules.examples) {
  const r = namer.build(ex.family, ex.in, ex.opt);
  check(`${ex.family} (${ex.source})`, r.ok ? r.name : 'ERROR ' + r.errors.join('; '), ex.expect);
}

// 2. formatting rules
check('pitch 0.4', IPCNamer.formatValue(0.4, 'h'), '40');
check('lead width 0.635 rounds half up', IPCNamer.formatValue(0.635, 'h'), '64');
check('1.005 rounds half up', IPCNamer.formatValue(1.005, 'h'), '101');
check('chip 0.8', IPCNamer.formatValue(0.8, 'c'), '08');
check('chip 3.2', IPCNamer.formatValue(3.2, 'c'), '32');
check('chip 1.25 drops second decimal (0805 = 2012)', IPCNamer.formatValue(1.25, 'c'), '12');
check('chip 1.6 float safe', IPCNamer.formatValue(1.6, 'c'), '16');
check('chip 0.6', IPCNamer.formatValue(0.6, 'c'), '06');

// 3. min/max resolution: nominal for spans, maximum for height
const mm = namer.build('SOIC', { leadSpan: { min: 5.8, max: 6.2 }, height: { min: 1.35, max: 1.75 }, pinQty: 8 });
check('SOIC from min/max', mm.name, 'SOIC127P600X175-8N');

// 4. every family template parses and builds from dummy values
for (const f of namer.listFamilies()) {
  const d = namer.describe(f.id);
  const inp = {};
  for (const fld of d.fields) {
    if (fld.optional) continue;
    if (fld.type === 'select') inp[fld.key] = fld.options[0][0];
    else if (fld.type === 'text') inp[fld.key] = 'X1';
    else if (fld.type === 'int') inp[fld.key] = 4;
    else inp[fld.key] = 1.0;
  }
  if (d.fields.some(x => x.key === 'pinQty')) inp.pinQty = 4;
  const r = namer.build(f.id, inp);
  check('family builds: ' + f.id, r.ok, true);
}

// 5. errors are reported, not thrown
const bad = namer.build('QFN', { pitch: 0.5, bodyW: 5, bodyL: 5, height: -1 });
check('negative height rejected', bad.ok, false);
check('missing pin qty reported', bad.errors.some(e => /Pin quantity: required/.test(e)), true);
check('unknown family', namer.build('NOPE', {}).ok, false);
const warn = namer.build('SOP', { pitch: 0.65, leadSpan: 4.4, bodyW: 6.4, height: 1.2, pinQty: 20 });
check('hidden pins need larger package', namer.build('SOP', { pitch: 0.65, leadSpan: 6.4, height: 1.2, pinQty: 20 }, { pinMode: 'hidden', packagePins: 16 }).ok, false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
