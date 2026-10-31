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

// 6. strict validation - invalid input must never produce a name
check('Infinity rejected', namer.build('RESC', { bodyL: Infinity, bodyW: 0.8, height: 0.55 }).ok, false);
check('1e999 rejected', namer.build('RESC', { bodyL: '1e999', bodyW: 0.8, height: 0.55 }).ok, false);
check('min/max Infinity rejected', namer.build('RESC', { bodyL: { min: 1.5, max: 'Infinity' }, bodyW: 0.8, height: 0.55 }).ok, false);
check('bad density rejected', namer.build('RESC', { bodyL: 1.6, bodyW: 0.8, height: 0.55 }, { suffix: 'X' }).ok, false);
check('bad level rejected', namer.build('DIP', { leadSpan: 7.62, leadWidth: 0.52, pitch: 2.54, bodyL: 19.05, height: 5.08, pinQty: 14 }, { suffix: 'N' }).ok, false);
check('bad variant rejected', namer.build('SOP', { pitch: 0.65, leadSpan: 6.4, height: 1.2, pinQty: 20 }, { variant: 'A1' }).ok, false);
check('suffix on BGA rejected', namer.build('BGA', { pinQty: 100, ballType: 'C', pitch: 0.8, cols: 10, rows: 10, bodyL: 10, bodyW: 10, height: 1.4 }, { suffix: 'N' }).ok, false);
check('general suffix not allowed on QFN', namer.build('QFN', { pitch: 0.5, bodyW: 5, bodyL: 5, height: 1, pinQty: 32 }, { general: '_HS' }).ok, false);
check('valid variant accepted', namer.build('SOP', { pitch: 0.65, leadSpan: 6.4, height: 1.2, pinQty: 20 }, { variant: 'A' }).name, 'SOP65P640X120-20AN');

// 7. real datasheet cases (verified ones are hard failures, to-verify ones only report)
const ds = require('./datasheet-cases.json').cases;
let toVerify = 0;
for (const c of ds) {
  const r = namer.build(c.family, c.values, c.options);
  const got = r.ok ? r.name : 'ERROR ' + r.errors.join('; ');
  if (c.status === 'verified') check('datasheet ' + c.part, got, c.expected);
  else { toVerify++; if (got !== c.expected) console.log('NOTE to-verify ' + c.part + ': got ' + got + ', expected ' + c.expected); }
}
console.log(`datasheet cases: ${ds.length - toVerify} verified, ${toVerify} waiting for a designer check`);

// 8. every family names its source
for (const f of namer.listFamilies()) check('source for ' + f.id, !!rules.sources[rules.families[f.id].source], true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
