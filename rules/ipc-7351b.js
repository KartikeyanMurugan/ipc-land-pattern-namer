/*
 * IPC-7351B / IPC-7251 land pattern naming rules - data only.
 *
 * Written from the publicly circulated "IPC-7351B Naming Convention" summary
 * (PCB Matrix, 2009). This file describes the naming *rules* in our own data
 * format; it does not reproduce the IPC standard. Not affiliated with IPC.
 *
 * Template mini-language (see src/namer.js):
 *   {field:fmt}  value of a field, formatted
 *       h  mm x 100, rounded, no leading zeros      1.27 -> 127, 0.50 -> 50
 *       c  chip style: mm x 10, 2 digits            1.6 -> 16, 0.8 -> 08
 *       i  integer                                  32 -> 32
 *       u  text, upper case                         n -> N
 *       s  text as entered (spaces removed)
 *   [ ... ] optional group - left out when any field inside is empty
 *
 * Family keys:
 *   kind      SMD | THT | OTHER
 *   template  core of the name
 *   qty       true  -> "-<pin qty>" is appended (SMD rule)
 *   thermal   true  -> optional thermal pad adds 1 to the pin quantity
 *   suffixes  allowed general suffixes (_HS, _BEC ...)
 *   suffix    "density" (M/N/L), "level" (A/B/C fab level) or "none"
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IPC7351B = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- fields
  // use: "nom" -> nominal of min/max, "max" -> maximum (heights)
  const F = {
    pitch:       { label: 'Pitch', unit: 'mm', use: 'nom', help: 'Centre-to-centre distance between adjacent pins (e).' },
    pitchCol:    { label: 'Column pitch', unit: 'mm', use: 'nom' },
    pitchRow:    { label: 'Row pitch', unit: 'mm', use: 'nom' },
    leadSpan:    { label: 'Lead span (tip to tip)', unit: 'mm', use: 'nom', help: 'Outside of lead to outside of lead (E). NOT the body width (E1).' },
    leadSpan1:   { label: 'Lead span L1', unit: 'mm', use: 'nom', help: 'Lead tip to lead tip, first direction (D).' },
    leadSpan2:   { label: 'Lead span L2', unit: 'mm', use: 'nom', help: 'Lead tip to lead tip, second direction (E).' },
    bodyL:       { label: 'Body length', unit: 'mm', use: 'nom' },
    bodyW:       { label: 'Body width', unit: 'mm', use: 'nom' },
    bodyT:       { label: 'Body thickness', unit: 'mm', use: 'nom' },
    bodyDia:     { label: 'Body diameter', unit: 'mm', use: 'nom' },
    baseSize:    { label: 'Base body size', unit: 'mm', use: 'nom', help: 'Square base of the electrolytic capacitor.' },
    height:      { label: 'Height (max)', unit: 'mm', use: 'max', help: 'Maximum seated height above the board (A).' },
    pinQty:      { label: 'Pin quantity', unit: 'pins', type: 'int' },
    cols:        { label: 'Columns', unit: '', type: 'int' },
    rows:        { label: 'Rows', unit: '', type: 'int' },
    pinsPerRow:  { label: 'Pins per row', unit: '', type: 'int' },
    vias:        { label: 'Number of vias', unit: '', type: 'int', optional: true },
    leadWidth:   { label: 'Lead width / diameter (max)', unit: 'mm', use: 'max' },
    leadLength:  { label: 'Lead length (max)', unit: 'mm', use: 'max' },
    leadSpacing: { label: 'Lead spacing (hole to hole)', unit: 'mm', use: 'nom' },
    land:        { label: 'Land (pad) diameter', unit: 'mm', use: 'nom' },
    hole:        { label: 'Hole diameter', unit: 'mm', use: 'nom' },
    antipad:     { label: 'Anti-pad diameter', unit: 'mm', use: 'nom', optional: true },
    padSize:     { label: 'Pad size', unit: 'mm', use: 'nom' },
    padL:        { label: 'Pad length', unit: 'mm', use: 'nom' },
    padW:        { label: 'Pad width', unit: 'mm', use: 'nom' },
    maskSize:    { label: 'Solder mask opening', unit: 'mm', use: 'nom' },
    ballType:    { label: 'Ball type', type: 'select', options: [['C', 'C - collapsing'], ['N', 'N - non-collapsing']] },
    lgaType:     { label: 'Lead shape', type: 'select', options: [['C', 'C - circular'], ['S', 'S - square'], ['R', 'R - rectangular']] },
    plating:     { label: 'Plating', type: 'select', options: [['P', 'P - plated'], ['NP', 'NP - non-plated']] },
    part:        { label: 'Manufacturer part / series no.', type: 'text' },
    jedecNo:     { label: 'JEDEC number (e.g. 220)', type: 'text' }
  };

  // ---------------------------------------------------------------- helpers
  const chip = (prefix, name) => ({
    group: 'Chip & molded 2-terminal', name, kind: 'SMD', prefix,
    fields: ['bodyL', 'bodyW', 'height'],
    template: prefix + '{bodyL:c}{bodyW:c}X{height:h}'
  });
  const array = (prefix, name, group) => ({
    group: group || 'Chip arrays', name, kind: 'SMD', prefix, qty: true,
    fields: ['pitch', 'bodyL', 'bodyW', 'height', 'pinQty'],
    template: prefix + '{pitch:h}P{bodyL:h}X{bodyW:h}X{height:h}'
  });
  const bodyQty = (prefix, name, group) => ({
    group, name, kind: 'SMD', prefix, qty: true,
    fields: ['bodyL', 'bodyW', 'height', 'pinQty'],
    template: prefix + '{bodyL:h}X{bodyW:h}X{height:h}'
  });
  const gull2 = (prefix, name, extra) => Object.assign({
    group: 'Two-side leaded (SOIC / SOP / SOT / TO)', name, kind: 'SMD', prefix, qty: true,
    fields: ['pitch', 'leadSpan', 'height', 'pinQty'],
    template: prefix + '{pitch:h}P{leadSpan:h}X{height:h}'
  }, extra || {});
  const quad = (prefix, name) => ({
    group: 'Quad leaded (QFP / PLCC)', name, kind: 'SMD', prefix, qty: true,
    fields: ['pitch', 'leadSpan1', 'leadSpan2', 'height', 'pinQty'],
    template: prefix + '{pitch:h}P{leadSpan1:h}X{leadSpan2:h}X{height:h}'
  });
  const noLead = (prefix, name, thermal) => ({
    group: 'No-lead (QFN / SON / LCC)', name, kind: 'SMD', prefix, qty: true, thermal: !!thermal,
    fields: ['pitch', 'bodyW', 'bodyL', 'height', 'pinQty'],
    template: prefix + '{pitch:h}P{bodyW:h}X{bodyL:h}X{height:h}'
  });
  const axialD = (prefix, name) => ({
    group: 'Through-hole axial / radial', name, kind: 'THT', prefix, suffix: 'level',
    fields: ['leadSpacing', 'leadWidth', 'bodyL', 'bodyDia'],
    template: prefix + '{leadSpacing:h}W{leadWidth:h}L{bodyL:h}D{bodyDia:h}'
  });
  const axialR = (prefix, name) => ({
    group: 'Through-hole axial / radial', name, kind: 'THT', prefix, suffix: 'level',
    fields: ['leadSpacing', 'leadWidth', 'bodyL', 'bodyT', 'height'],
    template: prefix + '{leadSpacing:h}W{leadWidth:h}L{bodyL:h}T{bodyT:h}H{height:h}'
  });
  const radialD = (prefix, name) => ({
    group: 'Through-hole axial / radial', name, kind: 'THT', prefix, suffix: 'level',
    fields: ['leadSpacing', 'leadWidth', 'bodyDia', 'height'],
    template: prefix + '{leadSpacing:h}W{leadWidth:h}D{bodyDia:h}H{height:h}'
  });

  const TRANSISTOR_SUFFIXES = ['_BEC', '_SGD', '_213', '_HS'];

  // ---------------------------------------------------------------- families
  const families = {
    // ---- Chip & molded 2-terminal (body length/width one digit each side of the decimal)
    RESC: chip('RESC', 'Resistor, chip'),
    RESM: chip('RESM', 'Resistor, molded'),
    CAPC: chip('CAPC', 'Capacitor, chip, non-polarized'),
    CAPCP: chip('CAPCP', 'Capacitor, chip, polarized'),
    CAPCWR: chip('CAPCWR', 'Capacitor, chip, wire rectangle'),
    CAPM: chip('CAPM', 'Capacitor, molded, non-polarized'),
    CAPMP: chip('CAPMP', 'Capacitor, molded, polarized'),
    INDC: chip('INDC', 'Inductor, chip'),
    INDM: chip('INDM', 'Inductor, molded'),
    INDP: chip('INDP', 'Inductor, precision wire wound'),
    DIOC: chip('DIOC', 'Diode, chip'),
    DIOM: chip('DIOM', 'Diode, molded'),
    LEDM: chip('LEDM', 'LED, molded'),
    FUSM: chip('FUSM', 'Fuse, molded'),
    RESMELF: {
      group: 'Chip & molded 2-terminal', name: 'Resistor, MELF', kind: 'SMD', prefix: 'RESMELF',
      fields: ['bodyL', 'bodyDia'], template: 'RESMELF{bodyL:c}{bodyDia:c}'
    },
    DIOMELF: {
      group: 'Chip & molded 2-terminal', name: 'Diode, MELF', kind: 'SMD', prefix: 'DIOMELF',
      fields: ['bodyL', 'bodyDia'], template: 'DIOMELF{bodyL:c}{bodyDia:c}'
    },
    SOD: {
      group: 'Chip & molded 2-terminal', name: 'SOD diode (e.g. SOD-123)', kind: 'SMD', prefix: 'SOD',
      fields: ['leadSpan', 'bodyW', 'height'], template: 'SOD{leadSpan:c}{bodyW:c}X{height:h}'
    },
    SODFL: {
      group: 'Chip & molded 2-terminal', name: 'Small outline diode, flat lead', kind: 'SMD', prefix: 'SODFL',
      fields: ['leadSpan', 'bodyW', 'height'], template: 'SODFL{leadSpan:c}{bodyW:c}X{height:h}'
    },
    CAPAE: {
      group: 'Chip & molded 2-terminal', name: 'Capacitor, aluminium electrolytic', kind: 'SMD', prefix: 'CAPAE',
      fields: ['baseSize', 'height'], template: 'CAPAE{baseSize:h}X{height:h}'
    },
    XTAL: {
      group: 'Chip & molded 2-terminal', name: 'Crystal, 2 leads', kind: 'SMD', prefix: 'XTAL',
      fields: ['bodyL', 'bodyW', 'height'], template: 'XTAL{bodyL:h}X{bodyW:h}X{height:h}'
    },

    // ---- Chip arrays and oscillators
    CAPCAV: array('CAPCAV', 'Capacitor array, concave'),
    CAPCAF: array('CAPCAF', 'Capacitor array, flat'),
    INDCAV: array('INDCAV', 'Inductor array, concave'),
    INDCAF: array('INDCAF', 'Inductor array, flat'),
    RESCAV: array('RESCAV', 'Resistor array, concave'),
    RESCAXE: array('RESCAXE', 'Resistor array, convex, E-version'),
    RESCAXS: array('RESCAXS', 'Resistor array, convex, S-version'),
    RESCAF: array('RESCAF', 'Resistor array, flat'),
    OSCSC: array('OSCSC', 'Oscillator, side concave', 'Oscillators'),
    OSCJ: array('OSCJ', 'Oscillator, J-lead', 'Oscillators'),
    OSCL: array('OSCL', 'Oscillator, L-bend lead', 'Oscillators'),
    OSCCC: {
      group: 'Oscillators', name: 'Oscillator, corner concave', kind: 'SMD', prefix: 'OSCCC',
      fields: ['bodyL', 'bodyW', 'height'], template: 'OSCCC{bodyL:h}X{bodyW:h}X{height:h}'
    },
    DIOSC: bodyQty('DIOSC', 'Diode, side concave', 'Side concave'),
    LEDSC: bodyQty('LEDSC', 'LED, side concave', 'Side concave'),

    // ---- Two-side leaded
    SOIC: {
      group: 'Two-side leaded (SOIC / SOP / SOT / TO)', name: 'SOIC, 1.27 mm pitch', kind: 'SMD', prefix: 'SOIC',
      qty: true, fields: ['leadSpan', 'height', 'pinQty'], template: 'SOIC127P{leadSpan:h}X{height:h}'
    },
    SOP: gull2('SOP', 'Small outline package (SOP / SSOP / TSSOP)'),
    SOJ: gull2('SOJ', 'Small outline, J-lead'),
    SOT: gull2('SOT', 'SOT-23 / SOT-223 family', { suffixes: TRANSISTOR_SUFFIXES }),
    SOTFL: gull2('SOTFL', 'SOT, flat lead', { suffixes: TRANSISTOR_SUFFIXES }),
    TO: gull2('TO', 'TO, DPAK type (e.g. TO-252)', { suffixes: TRANSISTOR_SUFFIXES }),
    CFP: {
      group: 'Two-side leaded (SOIC / SOP / SOT / TO)', name: 'Ceramic flat package', kind: 'SMD', prefix: 'CFP',
      qty: true, fields: ['leadSpan', 'height', 'pinQty'], template: 'CFP127P{leadSpan:h}X{height:h}'
    },
    JEDEC_SOT: {
      group: 'Two-side leaded (SOIC / SOP / SOT / TO)', name: 'JEDEC fixed name (SOT89, SOT143 ...)', kind: 'SMD',
      prefix: '', suffix: 'none',
      fields: ['jedecName'], template: '{jedecName:u}',
      extraFields: { jedecName: { label: 'Package', type: 'select', options: [['SOT89', 'SOT89'], ['SOT143', 'SOT143'], ['SOT343', 'SOT343'], ['SOT143R', 'SOT143R (reverse)'], ['SOT343R', 'SOT343R (reverse)']] } }
    },

    // ---- Quad
    QFP: quad('QFP', 'Quad flat package'),
    CQFP: quad('CQFP', 'Ceramic quad flat package'),
    BQFP: quad('BQFP', 'QFP with bumper corners, pin 1 side'),
    BQFPC: quad('BQFPC', 'QFP with bumper corners, pin 1 centre'),
    PLCC: quad('PLCC', 'Plastic leaded chip carrier'),
    PLCCS: quad('PLCCS', 'PLCC socket, square'),

    // ---- No-lead
    QFN: noLead('QFN', 'Quad flat no-lead', true),
    PQFN: noLead('PQFN', 'Pull-back QFN', true),
    SON: noLead('SON', 'Small outline no-lead', true),
    PSON: noLead('PSON', 'Pull-back SON', true),
    LCC: noLead('LCC', 'Leadless ceramic chip carrier'),
    LCCS: noLead('LCCS', 'LCC, pin 1 on side'),
    DFN: bodyQty('DFN', 'Dual flat no-lead', 'No-lead (QFN / SON / LCC)'),

    // ---- Area arrays
    BGA: {
      group: 'Area array (BGA / LGA / CGA)', name: 'Ball grid array', kind: 'SMD', prefix: 'BGA', suffix: 'none',
      fields: ['pinQty', 'ballType', 'pitch', 'cols', 'rows', 'bodyL', 'bodyW', 'height'],
      template: 'BGA{pinQty:i}{ballType:u}{pitch:h}P{cols:i}X{rows:i}_{bodyL:h}X{bodyW:h}X{height:h}',
      note: 'BGA names carry no M/N/L suffix (nominal only).'
    },
    BGA_DUAL: {
      group: 'Area array (BGA / LGA / CGA)', name: 'Ball grid array, dual pitch', kind: 'SMD', prefix: 'BGA', suffix: 'none',
      fields: ['pinQty', 'ballType', 'pitchCol', 'pitchRow', 'cols', 'rows', 'bodyL', 'bodyW', 'height'],
      template: 'BGA{pinQty:i}{ballType:u}{pitchCol:h}X{pitchRow:h}P{cols:i}X{rows:i}_{bodyL:h}X{bodyW:h}X{height:h}'
    },
    BGAS: {
      group: 'Area array (BGA / LGA / CGA)', name: 'Ball grid array, staggered', kind: 'SMD', prefix: 'BGAS', suffix: 'none',
      fields: ['pinQty', 'ballType', 'pitch', 'cols', 'rows', 'bodyL', 'bodyW', 'height'],
      template: 'BGAS{pinQty:i}{ballType:u}{pitch:h}P{cols:i}X{rows:i}_{bodyL:h}X{bodyW:h}X{height:h}'
    },
    LGA: {
      group: 'Area array (BGA / LGA / CGA)', name: 'Land grid array', kind: 'SMD', prefix: 'LGA',
      fields: ['pinQty', 'lgaType', 'pitch', 'cols', 'rows', 'bodyL', 'bodyW', 'height'],
      template: 'LGA{pinQty:i}{lgaType:u}{pitch:h}P{cols:i}X{rows:i}_{bodyL:h}X{bodyW:h}X{height:h}'
    },
    CGA: {
      group: 'Area array (BGA / LGA / CGA)', name: 'Column grid array', kind: 'SMD', prefix: 'CGA', qty: true,
      fields: ['pitch', 'cols', 'rows', 'height', 'pinQty'],
      template: 'CGA{pitch:h}P{cols:i}X{rows:i}X{height:h}'
    },

    // ---- SMD non-standard with dimensions
    FID: {
      group: 'Fiducials & test points', name: 'Fiducial', kind: 'SMD', prefix: 'FID', suffix: 'none',
      fields: ['padSize', 'maskSize'], template: 'FID{padSize:h}X{maskSize:h}'
    },
    TP_SMD: {
      group: 'Fiducials & test points', name: 'Test point, round pad', kind: 'SMD', prefix: 'TP', suffix: 'none',
      fields: ['padSize'], template: 'TP{padSize:h}'
    },
    TPS_SMD: {
      group: 'Fiducials & test points', name: 'Test point, square pad', kind: 'SMD', prefix: 'TPS', suffix: 'none',
      fields: ['padSize'], template: 'TPS{padSize:h}'
    },
    TPR_SMD: {
      group: 'Fiducials & test points', name: 'Test point, rectangular pad', kind: 'SMD', prefix: 'TP', suffix: 'none',
      fields: ['padL', 'padW'], template: 'TP{padL:h}X{padW:h}'
    },

    // ---- Through-hole
    RESAD: axialD('RESAD', 'Resistor, axial, horizontal'),
    RESADV: axialD('RESADV', 'Resistor, axial, vertical'),
    RESAR: axialR('RESAR', 'Resistor, axial rectangular'),
    CAPAD: axialD('CAPAD', 'Capacitor, axial, horizontal'),
    CAPADV: axialD('CAPADV', 'Capacitor, axial, vertical'),
    CAPAR: axialR('CAPAR', 'Capacitor, axial rectangular'),
    CAPARV: axialR('CAPARV', 'Capacitor, axial rectangular, vertical'),
    CAPPAD: axialD('CAPPAD', 'Capacitor, polarized, axial'),
    CAPRD: radialD('CAPRD', 'Capacitor, radial, round body'),
    CAPPRD: radialD('CAPPRD', 'Capacitor, polarized, radial'),
    CAPRR: axialR('CAPRR', 'Capacitor, radial, rectangular'),
    CAPRB: axialR('CAPRB', 'Capacitor, radial, disk / button'),
    DIOAD: axialD('DIOAD', 'Diode, axial, horizontal'),
    DIOADV: axialD('DIOADV', 'Diode, axial, vertical'),
    INDAD: axialD('INDAD', 'Inductor, axial, horizontal'),
    INDADV: axialD('INDADV', 'Inductor, axial, vertical'),
    DIP: {
      group: 'Through-hole IC & connectors', name: 'Dual in-line package', kind: 'THT', prefix: 'DIP', suffix: 'level',
      fields: ['leadSpan', 'leadWidth', 'pitch', 'bodyL', 'height', 'pinQty'],
      template: 'DIP{leadSpan:h}W{leadWidth:h}P{pitch:h}L{bodyL:h}H{height:h}Q{pinQty:i}'
    },
    DIPS: {
      group: 'Through-hole IC & connectors', name: 'DIP socket', kind: 'THT', prefix: 'DIPS', suffix: 'level',
      fields: ['leadSpan', 'leadWidth', 'pitch', 'bodyL', 'height', 'pinQty'],
      template: 'DIPS{leadSpan:h}W{leadWidth:h}P{pitch:h}L{bodyL:h}H{height:h}Q{pinQty:i}'
    },
    SIP: {
      group: 'Through-hole IC & connectors', name: 'Single in-line package', kind: 'THT', prefix: 'SIP', suffix: 'level',
      fields: ['bodyW', 'leadWidth', 'pitch', 'bodyL', 'height', 'pinQty'],
      template: 'SIP{bodyW:h}W{leadWidth:h}P{pitch:h}L{bodyL:h}H{height:h}Q{pinQty:i}'
    },
    OSC_THT: {
      group: 'Through-hole IC & connectors', name: 'Oscillator, through-hole', kind: 'THT', prefix: 'OSC', suffix: 'level',
      fields: ['leadSpan', 'leadWidth', 'pitch', 'bodyL', 'height', 'pinQty'],
      template: 'OSC{leadSpan:h}W{leadWidth:h}P{pitch:h}L{bodyL:h}H{height:h}Q{pinQty:i}'
    },
    PGA: {
      group: 'Through-hole IC & connectors', name: 'Pin grid array', kind: 'THT', prefix: 'PGA', suffix: 'level',
      fields: ['pinQty', 'pitch', 'cols', 'rows', 'bodyL', 'bodyW', 'height'],
      template: 'PGA{pinQty:i}P{pitch:h}C{cols:i}R{rows:i}L{bodyL:h}X{bodyW:h}H{height:h}'
    },
    HDRV: {
      group: 'Through-hole IC & connectors', name: 'Header, vertical', kind: 'THT', prefix: 'HDRV', suffix: 'level',
      fields: ['pinQty', 'leadWidth', 'pitch', 'pitchCol', 'rows', 'pinsPerRow', 'bodyL', 'bodyT', 'height'],
      optionalFields: ['pitchCol'],
      template: 'HDRV{pinQty:i}W{leadWidth:h}P{pitch:h}[X{pitchCol:h}]_{rows:i}X{pinsPerRow:i}_{bodyL:h}X{bodyT:h}X{height:h}',
      note: 'Pitch = row pitch. Fill column pitch only when it differs.'
    },
    HDRRA: {
      group: 'Through-hole IC & connectors', name: 'Header, right angle', kind: 'THT', prefix: 'HDRRA', suffix: 'level',
      fields: ['pinQty', 'leadWidth', 'pitch', 'pitchCol', 'rows', 'pinsPerRow', 'bodyL', 'bodyT', 'height'],
      optionalFields: ['pitchCol'],
      template: 'HDRRA{pinQty:i}W{leadWidth:h}P{pitch:h}[X{pitchCol:h}]_{rows:i}X{pinsPerRow:i}_{bodyL:h}X{bodyT:h}X{height:h}'
    },
    JUMP: {
      group: 'Through-hole misc', name: 'Wire jumper', kind: 'THT', prefix: 'JUMP', suffix: 'level',
      fields: ['leadSpacing', 'leadWidth'], template: 'JUMP{leadSpacing:h}W{leadWidth:h}'
    },
    MTG: {
      group: 'Through-hole misc', name: 'Mounting hole', kind: 'THT', prefix: 'MTG', suffix: 'level',
      fields: ['plating', 'land', 'hole', 'vias', 'antipad'],
      template: 'MTG{plating:u}{land:h}H{hole:h}[V{vias:i}][Z{antipad:h}]',
      note: 'Give vias (V) or anti-pad (Z) when used; leave empty otherwise.'
    },
    TPC_THT: {
      group: 'Through-hole misc', name: 'Test point, round body', kind: 'THT', prefix: 'TPC', suffix: 'level',
      fields: ['leadWidth', 'bodyDia', 'height'], template: 'TPCW{leadWidth:h}D{bodyDia:h}H{height:h}'
    },
    TPR_THT: {
      group: 'Through-hole misc', name: 'Test point, square body', kind: 'THT', prefix: 'TPR', suffix: 'level',
      fields: ['leadWidth', 'bodyL', 'height'], template: 'TPRW{leadWidth:h}L{bodyL:h}H{height:h}'
    },
    TPRR_THT: {
      group: 'Through-hole misc', name: 'Test point, rectangular body + lead', kind: 'THT', prefix: 'TPR', suffix: 'level',
      fields: ['leadLength', 'leadWidth', 'bodyL', 'bodyT', 'height'],
      template: 'TPRW{leadLength:h}X{leadWidth:h}L{bodyL:h}T{bodyT:h}H{height:h}'
    },
    PAD_WIRE: {
      group: 'Through-hole misc', name: 'Wire pad', kind: 'THT', prefix: 'PAD', suffix: 'none',
      fields: ['leadWidth'], template: 'PAD{leadWidth:h}'
    },
    TO_JEDEC: {
      group: 'Through-hole misc', name: 'Transistor outline, JEDEC (TO-220 ...)', kind: 'THT', prefix: 'TO-', suffix: 'none',
      fields: ['jedecNo'], template: 'TO-{jedecNo:s}'
    },

    // ---- Manufacturer-part names (non-standard parts and connectors)
    MFR: {
      group: 'Non-standard (manufacturer part)', name: 'Non-standard part', kind: 'OTHER', prefix: '', suffix: 'none',
      fields: ['mfrPrefix', 'part', 'pinQtyOpt'],
      optionalFields: ['pinQtyOpt'],
      template: '{mfrPrefix:u}_{part:s}[-{pinQtyOpt:i}]',
      extraFields: {
        mfrPrefix: {
          label: 'Category', type: 'select', options: [
            ['AMP', 'AMP - amplifier'], ['BAT', 'BAT - battery'], ['CAP', 'CAP - capacitor, misc'], ['CAPV', 'CAPV - capacitor, variable'],
            ['CONV', 'CONV - converter'], ['DIO', 'DIO - diode, misc'], ['DIOB', 'DIOB - bridge rectifier'], ['FB', 'FB - ferrite bead'],
            ['FIL', 'FIL - filter'], ['FUSE', 'FUSE - fuse'], ['FUSER', 'FUSER - resettable fuse'], ['HSINK', 'HSINK - heat sink'],
            ['IND', 'IND - inductor, misc'], ['KEYPAD', 'KEYPAD - keypad'], ['LCD', 'LCD - display'], ['LED', 'LED - LED'],
            ['MIC', 'MIC - microphone'], ['MOV', 'MOV - MOV'], ['OPTO', 'OPTO - opto isolator'], ['OSC', 'OSC - oscillator'],
            ['PHODET', 'PHODET - photo detector'], ['REG', 'REG - regulator'], ['RELAY', 'RELAY - relay'], ['SHIELD', 'SHIELD - shield'],
            ['SPKR', 'SPKR - speaker'], ['STIF', 'STIF - stiffener'], ['SW', 'SW - switch'], ['THERM', 'THERM - thermistor'],
            ['TRANS', 'TRANS - transistor, custom'], ['TRIM', 'TRIM - trimmer / pot'], ['TUNER', 'TUNER - tuner'], ['TVS', 'TVS - TVS'],
            ['TVSP', 'TVSP - TVS, polarized'], ['VAR', 'VAR - varistor'], ['VCO', 'VCO - VCO'], ['VREG', 'VREG - regulator, custom'],
            ['XCVR', 'XCVR - transceiver'], ['XDCR', 'XDCR - transducer'], ['XFMR', 'XFMR - transformer'], ['XTAL', 'XTAL - crystal']
          ]
        },
        pinQtyOpt: { label: 'Pin quantity (optional)', type: 'int', optional: true }
      }
    },
    CONN: {
      group: 'Non-standard (manufacturer part)', name: 'Connector (manufacturer part)', kind: 'OTHER', prefix: '', suffix: 'none',
      fields: ['mfr', 'part'], template: '{mfr:u}_{part:s}',
      extraFields: {
        mfr: { label: 'Manufacturer', type: 'text', help: 'e.g. MOLEX, JST, SAMTEC, TYCO, HIROSE, AMPHENOL' }
      }
    }
  };

  // Worked examples - used by the test suite and the "try an example" button.
  // source: "pdf" = printed in the PCB Matrix 2009 summary, "derived" = built from its rules.
  const examples = [
    { family: 'SOD', in: { leadSpan: 3.7, bodyW: 1.7, height: 1.35 }, opt: { suffix: '' }, expect: 'SOD3717X135', source: 'pdf' },
    { family: 'SOT', in: { pitch: 2.30, leadSpan: 7.00, height: 1.80, pinQty: 4 }, opt: { suffix: '' }, expect: 'SOT230P700X180-4', source: 'pdf' },
    { family: 'TO', in: { pitch: 2.28, leadSpan: 9.70, height: 2.38, pinQty: 3 }, opt: { suffix: '' }, expect: 'TO228P970X238-3', source: 'pdf' },
    { family: 'TO', in: { pitch: 2.54, leadSpan: 10.55, height: 1.60, pinQty: 6 }, opt: { general: '_HS' }, expect: 'TO254P1055X160_HS-6N', source: 'pdf' },
    { family: 'SOT', in: { pitch: 0.95, leadSpan: 2.80, height: 1.60, pinQty: 3 }, opt: { general: '_BEC' }, expect: 'SOT95P280X160_BEC-3N', source: 'pdf' },
    { family: 'SOT', in: { pitch: 0.95, leadSpan: 2.80, height: 1.60, pinQty: 3 }, opt: { general: '_SGD' }, expect: 'SOT95P280X160_SGD-3N', source: 'pdf' },
    { family: 'SOT', in: { pitch: 0.95, leadSpan: 2.80, height: 1.60, pinQty: 3 }, opt: { general: '_213' }, expect: 'SOT95P280X160_213-3N', source: 'pdf' },
    { family: 'SOP', in: { pitch: 0.65, leadSpan: 6.40, height: 1.20, pinQty: 20 }, opt: { reverse: true }, expect: 'SOP65P640X120-20RN', source: 'derived' },
    { family: 'SOP', in: { pitch: 0.65, leadSpan: 6.40, height: 1.20, pinQty: 20 }, opt: { pinMode: 'hidden', packagePins: 24 }, expect: 'SOP65P640X120-20_24N', source: 'derived' },
    { family: 'SOP', in: { pitch: 0.65, leadSpan: 6.40, height: 1.20, pinQty: 20 }, opt: { pinMode: 'deleted', packagePins: 24 }, expect: 'SOP65P640X120-24_20N', source: 'derived' },
    { family: 'RESC', in: { bodyL: 1.6, bodyW: 0.8, height: 0.55 }, expect: 'RESC1608X55N', source: 'derived' },
    { family: 'CAPC', in: { bodyL: 1.0, bodyW: 0.5, height: 0.55 }, opt: { suffix: 'M' }, expect: 'CAPC1005X55M', source: 'derived' },
    { family: 'SOIC', in: { leadSpan: 6.00, height: 1.75, pinQty: 8 }, expect: 'SOIC127P600X175-8N', source: 'derived' },
    { family: 'QFN', in: { pitch: 0.50, bodyW: 5.00, bodyL: 5.00, height: 1.00, pinQty: 32 }, opt: { thermalPad: true }, expect: 'QFN50P500X500X100-33N', source: 'derived' },
    { family: 'QFP', in: { pitch: 0.50, leadSpan1: 9.00, leadSpan2: 9.00, height: 1.20, pinQty: 48 }, opt: { suffix: 'L' }, expect: 'QFP50P900X900X120-48L', source: 'derived' },
    { family: 'BGA', in: { pinQty: 100, ballType: 'C', pitch: 0.80, cols: 10, rows: 10, bodyL: 10.00, bodyW: 10.00, height: 1.40 }, expect: 'BGA100C80P10X10_1000X1000X140', source: 'derived' },
    { family: 'CAPAD', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'CAPAD800W52L600D150B', source: 'pdf' },
    { family: 'CAPAR', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyT: 0.50, height: 0.70 }, expect: 'CAPAR800W52L600T50H70B', source: 'pdf' },
    { family: 'CAPADV', in: { leadSpacing: 3.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'CAPADV300W52L600D150B', source: 'pdf' },
    { family: 'CAPARV', in: { leadSpacing: 3.00, leadWidth: 0.52, bodyL: 6.00, bodyT: 0.50, height: 0.70 }, expect: 'CAPARV300W52L600T50H70B', source: 'pdf' },
    { family: 'CAPRD', in: { leadSpacing: 2.00, leadWidth: 0.52, bodyDia: 3.00, height: 5.50 }, expect: 'CAPRD200W52D300H550B', source: 'pdf' },
    { family: 'CAPRR', in: { leadSpacing: 2.00, leadWidth: 0.52, bodyL: 0.50, bodyT: 0.70, height: 5.50 }, expect: 'CAPRR200W52L50T70H550B', source: 'pdf' },
    { family: 'CAPRB', in: { leadSpacing: 2.00, leadWidth: 0.52, bodyL: 0.50, bodyT: 0.70, height: 5.50 }, expect: 'CAPRB200W52L50T70H550B', source: 'pdf' },
    { family: 'CAPPAD', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'CAPPAD800W52L600D150B', source: 'pdf' },
    { family: 'CAPPRD', in: { leadSpacing: 2.00, leadWidth: 0.52, bodyDia: 3.00, height: 5.50 }, expect: 'CAPPRD200W52D300H550B', source: 'pdf' },
    { family: 'DIOAD', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'DIOAD800W52L600D150B', source: 'pdf' },
    { family: 'DIOADV', in: { leadSpacing: 3.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'DIOADV300W52L600D150B', source: 'pdf' },
    { family: 'INDAD', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'INDAD800W52L600D150B', source: 'pdf' },
    { family: 'INDADV', in: { leadSpacing: 3.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'INDADV300W52L600D150B', source: 'pdf' },
    { family: 'RESAD', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'RESAD800W52L600D150B', source: 'pdf' },
    { family: 'RESADV', in: { leadSpacing: 3.00, leadWidth: 0.52, bodyL: 6.00, bodyDia: 1.50 }, expect: 'RESADV300W52L600D150B', source: 'pdf' },
    { family: 'RESAR', in: { leadSpacing: 8.00, leadWidth: 0.52, bodyL: 6.00, bodyT: 0.50, height: 0.70 }, expect: 'RESAR800W52L600T50H70B', source: 'pdf' },
    { family: 'DIP', in: { leadSpan: 7.62, leadWidth: 0.52, pitch: 2.54, bodyL: 19.05, height: 5.08, pinQty: 14 }, expect: 'DIP762W52P254L1905H508Q14B', source: 'pdf' },
    { family: 'DIPS', in: { leadSpan: 7.62, leadWidth: 0.52, pitch: 2.54, bodyL: 19.05, height: 5.08, pinQty: 14 }, expect: 'DIPS762W52P254L1905H508Q14B', source: 'pdf' },
    { family: 'SIP', in: { bodyW: 1.50, leadWidth: 0.52, pitch: 2.54, bodyL: 19.05, height: 5.08, pinQty: 8 }, expect: 'SIP150W52P254L1905H508Q8B', source: 'pdf' },
    { family: 'PGA', in: { pinQty: 84, pitch: 2.54, cols: 10, rows: 10, bodyL: 25.00, bodyW: 25.00, height: 3.00 }, expect: 'PGA84P254C10R10L2500X2500H300B', source: 'pdf' },
    { family: 'HDRV', in: { pinQty: 20, leadWidth: 0.635, pitch: 2.54, rows: 2, pinsPerRow: 10, bodyL: 25.40, bodyT: 2.54, height: 8.38 }, opt: { suffix: 'P' }, expect: 'HDRV20W64P254_2X10_2540X254X838P', source: 'pdf' },
    { family: 'HDRRA', in: { pinQty: 20, leadWidth: 0.635, pitch: 2.54, rows: 2, pinsPerRow: 10, bodyL: 25.40, bodyT: 2.54, height: 5.08 }, opt: { suffix: 'P' }, expect: 'HDRRA20W64P254_2X10_2540X254X508P', source: 'pdf' },
    { family: 'HDRV', in: { pinQty: 50, leadWidth: 0.635, pitch: 2.54, rows: 3, pinsPerRow: 25, bodyL: 63.50, bodyT: 2.54, height: 8.38 }, opt: { suffix: 'P' }, expect: 'HDRV50W64P254_3X25_6350X254X838P', source: 'pdf' },
    { family: 'JUMP', in: { leadSpacing: 5.00, leadWidth: 0.52 }, expect: 'JUMP500W52B', source: 'pdf' },
    { family: 'MTG', in: { plating: 'NP', land: 8.70, hole: 3.85, vias: 6 }, opt: { suffix: 'P' }, expect: 'MTGNP870H385V6P', source: 'pdf' },
    { family: 'MTG', in: { plating: 'P', land: 7.35, hole: 3.85, antipad: 7.35 }, opt: { suffix: 'P' }, expect: 'MTGP735H385Z735P', source: 'pdf' },
    { family: 'MTG', in: { plating: 'P', land: 4.00, hole: 2.90, antipad: 4.00 }, opt: { suffix: 'P' }, expect: 'MTGP400H290Z400P', source: 'pdf' },
    { family: 'MTG', in: { plating: 'NP', land: 1.30, hole: 2.60, antipad: 1.30 }, opt: { suffix: 'P' }, expect: 'MTGNP130H260Z130P', source: 'pdf' },
    { family: 'TPC_THT', in: { leadWidth: 0.635, bodyDia: 2.54, height: 5.84 }, opt: { suffix: 'P' }, expect: 'TPCW64D254H584P', source: 'pdf' },
    { family: 'TPR_THT', in: { leadWidth: 0.635, bodyL: 2.54, height: 5.84 }, opt: { suffix: 'P' }, expect: 'TPRW64L254H584P', source: 'pdf' },
    { family: 'TPRR_THT', in: { leadLength: 1.57, leadWidth: 0.635, bodyL: 2.54, bodyT: 0.635, height: 3.30 }, opt: { suffix: 'P' }, expect: 'TPRW157X64L254T64H330P', source: 'pdf' },
    { family: 'PAD_WIRE', in: { leadWidth: 0.52 }, expect: 'PAD52', source: 'pdf' },
    { family: 'OSC_THT', in: { leadSpan: 7.62, leadWidth: 0.46, pitch: 7.62, bodyL: 13.20, height: 6.00, pinQty: 8 }, expect: 'OSC762W46P762L1320H600Q8B', source: 'pdf' },
    { family: 'OSC_THT', in: { leadSpan: 7.62, leadWidth: 0.53, pitch: 15.24, bodyL: 20.80, height: 5.08, pinQty: 14 }, expect: 'OSC762W53P1524L2080H508Q14B', source: 'pdf' },
    { family: 'TP_SMD', in: { padSize: 1.00 }, expect: 'TP100', source: 'pdf' },
    { family: 'MFR', in: { mfrPrefix: 'RELAY', part: 'G5V-1' }, expect: 'RELAY_G5V-1', source: 'derived' },
    { family: 'CONN', in: { mfr: 'molex', part: '53047-0410' }, expect: 'MOLEX_53047-0410', source: 'derived' }
  ];

  return {
    id: 'ipc-7351b',
    title: 'IPC-7351B / IPC-7251 (PCB Matrix 2009 summary)',
    fields: F,
    families,
    examples,
    knownSourceIssues: [
      'Summary lists the polarized axial capacitor as "CAPPA" but its example is "CAPPAD"; CAPPAD is used here.',
      'Summary lists the polarized radial capacitor as "CAPPR" but its example is "CAPPRD"; CAPPRD is used here.',
      'Several through-hole examples end in "P" while the notes define fabrication levels A/B/C; both are accepted.',
      'Height is taken as the maximum and spans/bodies as the nominal value - confirm against your library.'
    ]
  };
});
