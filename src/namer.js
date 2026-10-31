/*
 * ipc-land-pattern-namer - naming engine
 * Works in the browser (window.IPCNamer) and in Node (require).
 * No dependencies. All dimensions in millimetres.
 *
 *   const namer = IPCNamer.create(IPC7351B);
 *   namer.build('QFN', { pitch: 0.5, bodyW: 5, bodyL: 5, height: 1, pinQty: 32 },
 *               { thermalPad: true })
 *   -> { ok: true, name: 'QFN50P500X500X100-33N', parts: [...], warnings: [], errors: [] }
 *
 * A dimension may be a number (already nominal / max) or { min, max } straight
 * from the datasheet; the field's `use` decides nominal (average) or maximum.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IPCNamer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EPS = 1e-9;

  function isBlank(v) {
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  }

  // -------------------------------------------------------------- formatting
  function hundredths(mm) { return String(Math.round(mm * 100 + EPS)); }
  function chipDigits(mm) {
    const s = String(Math.round(mm * 10 + EPS));
    return s.length < 2 ? '0' + s : s;
  }

  function formatValue(value, fmt) {
    switch (fmt) {
      case 'h': return hundredths(value);
      case 'c': return chipDigits(value);
      case 'i': return String(Math.round(value));
      case 'u': return String(value).trim().toUpperCase().replace(/\s+/g, '');
      case 's': return String(value).trim().replace(/\s+/g, '');
      default: throw new Error('Unknown format ' + fmt);
    }
  }

  // -------------------------------------------------------------- template
  // Returns list of tokens: {lit} | {field, fmt} | {group: [tokens]}
  function parseTemplate(tpl) {
    const out = [];
    let i = 0;
    let stack = [out];
    while (i < tpl.length) {
      const ch = tpl[i];
      if (ch === '[') {
        const g = { group: [] };
        stack[stack.length - 1].push(g);
        stack.push(g.group);
        i++;
      } else if (ch === ']') {
        if (stack.length < 2) throw new Error('Unbalanced ] in template ' + tpl);
        stack.pop();
        i++;
      } else if (ch === '{') {
        const end = tpl.indexOf('}', i);
        const [field, fmt] = tpl.slice(i + 1, end).split(':');
        stack[stack.length - 1].push({ field, fmt: fmt || 's' });
        i = end + 1;
      } else {
        let j = i;
        while (j < tpl.length && '[]{'.indexOf(tpl[j]) < 0) j++;
        stack[stack.length - 1].push({ lit: tpl.slice(i, j) });
        i = j;
      }
    }
    if (stack.length !== 1) throw new Error('Unbalanced [ in template ' + tpl);
    return out;
  }

  function templateFields(tokens, acc) {
    acc = acc || [];
    tokens.forEach(t => {
      if (t.field) acc.push(t.field);
      if (t.group) templateFields(t.group, acc);
    });
    return acc;
  }

  // -------------------------------------------------------------- engine
  function create(rules) {
    const cache = {};

    function family(id) {
      const f = rules.families[id];
      if (!f) throw new Error('Unknown family ' + id);
      if (!cache[id]) cache[id] = parseTemplate(f.template);
      return f;
    }

    function fieldDef(fam, key) {
      return (fam.extraFields && fam.extraFields[key]) || rules.fields[key] || { label: key };
    }

    function isOptional(fam, key) {
      const def = fieldDef(fam, key);
      return !!def.optional || (fam.optionalFields || []).indexOf(key) >= 0;
    }

    // number | {min,max} | string -> resolved value
    function resolve(def, raw, errors, label) {
      if (isBlank(raw)) return undefined;
      if (def.type === 'select' || def.type === 'text') return String(raw).trim();
      let v;
      if (typeof raw === 'object') {
        const mn = isBlank(raw.min) ? undefined : Number(raw.min);
        const mx = isBlank(raw.max) ? undefined : Number(raw.max);
        if (mn === undefined && mx === undefined) return undefined;
        if ((mn !== undefined && isNaN(mn)) || (mx !== undefined && isNaN(mx))) {
          errors.push(label + ': not a number'); return undefined;
        }
        if (mn !== undefined && mx !== undefined && mn > mx) {
          errors.push(label + ': min is larger than max'); return undefined;
        }
        if (def.use === 'max') v = mx !== undefined ? mx : mn;
        else v = (mn !== undefined && mx !== undefined) ? (mn + mx) / 2 : (mn !== undefined ? mn : mx);
      } else {
        v = Number(raw);
        if (isNaN(v)) { errors.push(label + ': not a number'); return undefined; }
      }
      if (def.type === 'int') {
        if (!Number.isInteger(v)) errors.push(label + ': must be a whole number');
      }
      if (v <= 0) errors.push(label + ': must be greater than 0');
      return v;
    }

    function render(tokens, values, parts, fam) {
      let s = '';
      for (const t of tokens) {
        if (t.lit !== undefined) {
          s += t.lit;
          parts.push({ text: t.lit, label: 'separator' });
        } else if (t.field) {
          const txt = formatValue(values[t.field], t.fmt);
          s += txt;
          parts.push({ text: txt, label: fieldDef(fam, t.field).label, field: t.field });
        } else if (t.group) {
          const need = templateFields(t.group);
          if (need.every(k => !isBlank(values[k]))) s += render(t.group, values, parts, fam);
        }
      }
      return s;
    }

    /**
     * options:
     *   suffix      density 'M' | 'N' | 'L' (SMD, default N), level 'A' | 'B' | 'C' (THT, default B),
     *               '' to leave out
     *   general     '_HS' | '_BEC' | '_SGD' | '_213' (only where the family allows it)
     *   thermalPad  true -> pin quantity + 1 (QFN / SON families)
     *   pinMode     'normal' | 'hidden' | 'deleted'   packagePins: number
     *   reverse     true -> 'R' after the pin quantity
     *   variant     'A' | 'B' | 'AA' ... alternate component / JEDEC identifier
     */
    function build(familyId, inputs, options) {
      inputs = inputs || {};
      options = options || {};
      const errors = [];
      const warnings = [];
      let fam;
      try { fam = family(familyId); } catch (e) { return { ok: false, errors: [e.message], warnings, parts: [] }; }
      const tokens = cache[familyId];

      // resolve fields
      const values = {};
      for (const key of fam.fields) {
        const def = fieldDef(fam, key);
        const v = resolve(def, inputs[key], errors, def.label);
        if (v === undefined && !isOptional(fam, key)) errors.push(def.label + ': required');
        values[key] = v;
      }
      validateSelects(fam, values, errors);

      checkGeometry(fam, values, warnings);
      if (errors.length) return { ok: false, errors, warnings, parts: [] };

      const parts = [];
      let name = render(tokens, values, parts, fam);

      // general suffix (_HS, _BEC ...)
      if (options.general) {
        if ((fam.suffixes || []).indexOf(options.general) < 0) {
          warnings.push(options.general + ' is not defined for ' + fam.name + ' - ignored');
        } else {
          name += options.general;
          parts.push({ text: options.general, label: 'general suffix' });
        }
      }

      // pin quantity (SMD style "-qty")
      if (fam.qty) {
        let qty = values.pinQty;
        if (fam.thermal && options.thermalPad) qty += 1;
        let q = String(qty);
        if (options.pinMode === 'hidden' || options.pinMode === 'deleted') {
          const pk = Number(options.packagePins);
          if (!Number.isInteger(pk) || pk <= qty) {
            return { ok: false, errors: ['Package pin count must be a whole number larger than the used pin count'], warnings, parts: [] };
          }
          q = options.pinMode === 'hidden' ? qty + '_' + pk : pk + '_' + qty;
        }
        if (options.reverse) q += 'R';
        name += '-' + q;
        parts.push({ text: '-' + q, label: 'pin quantity' + (fam.thermal && options.thermalPad ? ' (incl. thermal pad)' : '') });
      }

      // alternate / JEDEC variant
      if (options.variant) {
        const v = String(options.variant).trim().toUpperCase();
        if (!/^[A-Z]{1,2}$/.test(v)) warnings.push('Variant should be A, B or a JEDEC identifier like AA');
        name += v;
        parts.push({ text: v, label: 'alternate / variant' });
      }

      // density or fabrication level
      const mode = fam.suffix || (fam.kind === 'THT' ? 'level' : 'density');
      let suf = options.suffix;
      if (suf === undefined) suf = mode === 'density' ? 'N' : mode === 'level' ? 'B' : '';
      suf = String(suf).trim().toUpperCase();
      if (mode === 'none' && suf) {
        warnings.push(fam.name + ' names take no density/level suffix - ignored');
        suf = '';
      }
      if (mode === 'density' && suf && 'MNL'.indexOf(suf) < 0) warnings.push('Density suffix should be M, N or L');
      if (mode === 'level' && suf && 'ABCP'.indexOf(suf) < 0) warnings.push('Fabrication level should be A, B or C');
      if (suf) {
        name += suf;
        parts.push({ text: suf, label: mode === 'level' ? 'fabrication level' : 'density level' });
      }

      return {
        ok: true,
        name,
        parts,
        warnings,
        errors: [],
        record: { convention: rules.id, family: familyId, values, options, name }
      };
    }

    // checks select fields against their option list
    function validateSelects(fam, values, errors) {
      for (const key of fam.fields) {
        const d = fieldDef(fam, key);
        if (d.type === 'select' && !isBlank(values[key])) {
          const ok = d.options.some(o => o[0].toUpperCase() === String(values[key]).toUpperCase());
          if (!ok) errors.push(d.label + ': must be one of ' + d.options.map(o => o[0]).join(', '));
        }
      }
    }

    function checkGeometry(fam, v, warnings) {
      if (v.bodyW !== undefined && v.leadSpan !== undefined && fam.prefix !== 'SOD' && fam.prefix !== 'SODFL' && v.bodyW >= v.leadSpan) {
        warnings.push('Body width is not smaller than lead span - check you did not enter E1 as E');
      }
      if (v.pitch !== undefined && v.pitch > 10) warnings.push('Pitch above 10 mm - check the units (mm expected)');
      if (v.height !== undefined && v.height > 50) warnings.push('Height above 50 mm - check the units (mm expected)');
      if (v.cols !== undefined && v.rows !== undefined && v.pinQty !== undefined && v.pinQty > v.cols * v.rows) {
        warnings.push('Pin quantity is larger than columns x rows');
      }
      if (v.rows !== undefined && v.pinsPerRow !== undefined && v.pinQty !== undefined && v.pinQty > v.rows * v.pinsPerRow) {
        warnings.push('Pin quantity is larger than rows x pins per row');
      }
      if (v.hole !== undefined && v.land !== undefined && v.land <= v.hole && v.plating === 'P') {
        warnings.push('Plated land is not larger than the hole');
      }
    }

    function listFamilies() {
      return Object.keys(rules.families).map(id => {
        const f = rules.families[id];
        return { id, name: f.name, group: f.group, kind: f.kind, prefix: f.prefix };
      });
    }

    function describe(familyId) {
      const fam = family(familyId);
      return {
        id: familyId,
        name: fam.name,
        group: fam.group,
        kind: fam.kind,
        template: fam.template,
        qty: !!fam.qty,
        thermal: !!fam.thermal,
        suffixes: fam.suffixes || [],
        suffixMode: fam.suffix || (fam.kind === 'THT' ? 'level' : 'density'),
        note: fam.note || '',
        fields: fam.fields.map(key => Object.assign({ key, optional: isOptional(fam, key) }, fieldDef(fam, key)))
      };
    }

    return { build, listFamilies, describe, rules };
  }

  return { create, formatValue, parseTemplate };
});
