// Page logic for the name builder (index.html). Loaded with defer after rules, engine and theme.
(function () {
  'use strict';
  const SITE = 'https://kartikeyanmurugan.github.io/ipc-land-pattern-namer/';
  const COUNTER = 'https://abacus.jasoncameron.dev';
  const NS = 'kartikeyanmurugan-ipc-namer';
  const rules = window.IPC7351B;
  const namer = IPCNamer.create(rules);
  const $ = id => document.getElementById(id);
  let current = null;
  let last = null;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage off */ } }
  };
  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function toast(t) {
    const x = $('toast'); x.textContent = t; x.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => x.classList.remove('show'), 1600);
  }
  function copyText(t, msg) {
    const done = () => toast(msg);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, () => fallback());
    else fallback();
    function fallback() {
      const ta = el('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Select and copy: ' + t); }
      ta.remove();
    }
  }

  // ---------------- family list with search ----------------
  const families = namer.listFamilies();
  const keywords = {
    RESC: '0402 0603 0805 1206 1210 2512 resistor chip', CAPC: '0402 0603 0805 1206 mlcc capacitor chip',
    INDC: 'inductor chip 0603 0805', SOIC: 'so8 so-8 soic8 soic-8 soic14 soic16', SOP: 'ssop tssop msop sop',
    SOT: 'sot23 sot-23 sot223 sot-223 sot363 sc70', QFN: 'qfn mlf vqfn wqfn', QFP: 'lqfp tqfp qfp',
    BGA: 'bga fbga', HDRV: 'header pin header 2.54 berg', HDRRA: 'header right angle', MTG: 'mounting hole screw',
    TO: 'dpak d2pak to252 to263', DIP: 'dip pdip', CAPAE: 'electrolytic smd can', SOD: 'sod123 sod323 sod523'
  };
  // Three levels: mounting (SMD / through-hole / other) → package type (group) → family.
  // Typing in Search lists matches from every level; picking one sets mounting and type to match.
  const MOUNTS = [['SMD', 'SMD'], ['THT', 'Through-hole'], ['OTHER', 'Other']];
  const byId = {}; families.forEach(x => { byId[x.id] = x; });
  const groupsOf = k => [...new Set(families.filter(x => x.kind === k).map(x => x.group))];
  let mount = 'SMD';
  function shortGroup(g) { return g.replace(/^Through-hole /, '').replace(/^./, c => c.toUpperCase()); }
  function renderMount() {
    const box = $('mount'); box.innerHTML = '';
    MOUNTS.forEach(([k, label]) => {
      const n = families.filter(x => x.kind === k).length;
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': k === mount ? 'true' : 'false', 'data-k': k });
      b.textContent = label + ' '; b.appendChild(el('small', {}, String(n)));
      b.addEventListener('click', () => {
        if ($('search').value) $('search').value = '';
        mount = k; renderMount(); fillGroups(); fillFamilies(''); renderFields();
      });
      box.appendChild(b);
    });
  }
  function fillGroups(keep) {
    const sel = $('group'); sel.innerHTML = '';
    groupsOf(mount).forEach(g => {
      const n = families.filter(x => x.group === g).length;
      sel.appendChild(el('option', { value: g }, shortGroup(g) + '  (' + n + ')'));
    });
    if (keep) sel.value = keep;
  }
  function fillFamilies(filter) {
    const sel = $('family');
    const keep = sel.value;
    sel.innerHTML = '';
    const f = (filter || '').trim().toLowerCase();
    $('browse').classList.toggle('searching', !!f);
    $('group').disabled = !!f;
    if (!f) {
      families.filter(x => x.group === $('group').value)
        .forEach(x => sel.appendChild(el('option', { value: x.id }, x.name + (x.prefix ? '  (' + x.prefix + ')' : ''))));
      if ([...sel.options].some(o => o.value === keep)) sel.value = keep;
      return true;
    }
    const groups = {};
    families.forEach(x => {
      const hay = (x.name + ' ' + x.prefix + ' ' + x.id + ' ' + x.group + ' ' + (keywords[x.id] || '')).toLowerCase();
      if (!f.split(/\s+/).every(w => hay.indexOf(w) >= 0)) return;
      (groups[x.group] = groups[x.group] || []).push(x);
    });
    Object.keys(groups).forEach(g => {
      const og = el('optgroup', { label: g });
      groups[g].forEach(x => og.appendChild(el('option', { value: x.id }, x.name + (x.prefix ? '  (' + x.prefix + ')' : ''))));
      sel.appendChild(og);
    });
    if (!sel.options.length) {
      sel.appendChild(el('option', { value: '', disabled: '' }, 'No match – try another word'));
      return false;
    }
    if ([...sel.options].some(o => o.value === keep)) sel.value = keep;
    syncLevels(sel.value);
    return true;
  }
  // Show the mounting and package type of a family without changing the list
  function syncLevels(id) {
    const x = byId[id]; if (!x) return;
    if (x.kind !== mount) { mount = x.kind; renderMount(); }
    if ($('group').value !== x.group) fillGroups(x.group);
  }
  // Select one family from anywhere (quick start, history, links): clears search and sets all three levels
  function pick(id) {
    $('search').value = '';
    const x = byId[id]; if (!x) return;
    mount = x.kind; renderMount(); fillGroups(x.group); fillFamilies('');
    $('family').value = id;
  }
  $('group').addEventListener('change', () => { fillFamilies(''); renderFields(); });
  // Browsers open a dropdown list upwards when there is not enough room below it. On a mouse click,
  // scroll the page just enough first so the list opens downwards (phones show their own picker).
  ['group', 'family'].forEach(id => $(id).addEventListener('mousedown', () => {
    const sel = $(id);
    const need = Math.min(sel.options.length * 24 + 24, 420);
    const box = sel.getBoundingClientRect();
    const below = innerHeight - box.bottom;
    if (below >= need) return;
    const head = ($('siteHead') ? $('siteHead').offsetHeight : 64) + 16;
    const shift = Math.min(need - below, box.top - head);
    if (shift > 0) window.scrollTo({ top: scrollY + shift, behavior: 'instant' });
  }));
  $('search').addEventListener('input', () => {
    const before = $('family').value;
    const q = $('search').value.trim();
    if (!q) { syncLevels(before); fillFamilies(''); if (!$('family').value) $('family').selectedIndex = 0; if ($('family').value !== before) renderFields(); return; }
    if (fillFamilies(q) && $('family').value !== before) renderFields();
  });
  (rules.knownSourceIssues || []).forEach(t => $('issues').appendChild(el('li', {}, t)));

  // ---------------- form ----------------
  function renderFields() {
    if (!$('family').value) return;
    current = namer.describe($('family').value);
    $('famNote').textContent = current.note;
    renderFormula();
    const box = $('fields');
    box.innerHTML = '';
    current.fields.forEach(f => {
      box.appendChild(el('label', { class: 'f', for: 'in_' + f.key }, f.label));
      if (f.optional) box.lastChild.appendChild(el('span', { class: 'opt' }, '  (optional)'));
      if (f.type === 'select') {
        const s = el('select', { id: 'in_' + f.key, 'data-key': f.key });
        f.options.forEach(o => s.appendChild(el('option', { value: o[0] }, o[1])));
        box.appendChild(s);
      } else if (f.type === 'text' || f.type === 'int') {
        box.appendChild(el('input', { id: 'in_' + f.key, 'data-key': f.key, type: f.type === 'int' ? 'number' : 'text', step: '1', min: '1', inputmode: f.type === 'int' ? 'numeric' : 'text', autocomplete: 'off' }));
      } else {
        const mm = el('div', { class: 'minmax' });
        ['min', 'max'].forEach(part => {
          const c = el('div', { class: 'cell' });
          c.appendChild(el('input', { id: part === 'min' ? 'in_' + f.key : 'in_' + f.key + '_max', 'data-key': f.key, 'data-part': part, type: 'number', step: 'any', min: '0', inputmode: 'decimal', placeholder: part, 'aria-label': f.label + ' ' + part }));
          c.appendChild(el('span', {}, 'mm'));
          mm.appendChild(c);
        });
        box.appendChild(mm);
      }
      if (f.help) box.appendChild(el('p', { class: 'hint' }, f.help));
    });
    renderOptions();
    box.querySelectorAll('input,select').forEach(i => i.addEventListener('input', update));
    update();
  }

  function renderOptions() {
    const box = $('options');
    box.innerHTML = '';
    const grid = el('div', { class: 'opt-grid' });
    function field(id, label, node) { const w = el('div'); w.appendChild(el('label', { class: 'f', for: id }, label)); w.appendChild(node); grid.appendChild(w); }
    if (current.suffixMode !== 'none') {
      const s = el('select', { id: 'opt_suffix' });
      const opts = current.suffixMode === 'level'
        ? [['A', 'A – general'], ['B', 'B – moderate'], ['C', 'C – high'], ['', 'No letter']]
        : [['N', 'N – nominal'], ['M', 'M – most material'], ['L', 'L – least material'], ['', 'No letter']];
      opts.forEach(o => s.appendChild(el('option', { value: o[0] }, o[1])));
      s.value = current.suffixMode === 'level' ? 'B' : 'N';
      field('opt_suffix', current.suffixMode === 'level' ? 'Fabrication level' : 'Density level', s);
    }
    if (current.suffixes.length) {
      const s = el('select', { id: 'opt_general' });
      s.appendChild(el('option', { value: '' }, 'None'));
      current.suffixes.forEach(x => s.appendChild(el('option', { value: x }, x)));
      field('opt_general', 'Pin assignment / heat sink', s);
    }
    if (current.qty) {
      const s = el('select', { id: 'opt_pinmode' });
      [['normal', 'All pins present'], ['hidden', 'Hidden pins (-20_24)'], ['deleted', 'Deleted pins (-24_20)']].forEach(o => s.appendChild(el('option', { value: o[0] }, o[1])));
      field('opt_pinmode', 'Pins', s);
      field('opt_pkg', 'Package pin count', el('input', { id: 'opt_pkg', type: 'number', step: '1', min: '1', placeholder: 'Hidden / deleted only' }));
      field('opt_variant', 'Alternate / JEDEC variant', el('input', { id: 'opt_variant', type: 'text', maxlength: '2', placeholder: 'A, B, AA …', autocomplete: 'off' }));
    }
    box.appendChild(grid);
    const checks = el('div', { class: 'checks' });
    function check(id, text) { const l = el('label'); l.appendChild(el('input', { type: 'checkbox', id })); l.appendChild(document.createTextNode(text)); checks.appendChild(l); }
    if (current.thermal) check('opt_thermal', 'Has a thermal pad (adds one pin)');
    if (current.qty) check('opt_reverse', 'Reverse pin order (R)');
    if (checks.children.length) box.appendChild(checks);
    if (!grid.children.length && !checks.children.length) box.appendChild(el('p', { class: 'hint' }, 'This family has no options.'));
    box.querySelectorAll('input,select').forEach(i => i.addEventListener('input', update));
  }

  function readForm() {
    const inp = {};
    current.fields.forEach(f => {
      if (f.type === 'select' || f.type === 'text' || f.type === 'int') {
        const v = $('in_' + f.key).value;
        if (v !== '') inp[f.key] = f.type === 'int' ? Number(v) : v;
      } else {
        const a = $('in_' + f.key).value, b = $('in_' + f.key + '_max').value;
        if (a !== '' || b !== '') inp[f.key] = { min: a, max: b };
      }
    });
    const opt = {};
    if ($('opt_suffix')) opt.suffix = $('opt_suffix').value;
    if ($('opt_general') && $('opt_general').value) opt.general = $('opt_general').value;
    if ($('opt_thermal') && $('opt_thermal').checked) opt.thermalPad = true;
    if ($('opt_reverse') && $('opt_reverse').checked) opt.reverse = true;
    if ($('opt_pinmode') && $('opt_pinmode').value !== 'normal') { opt.pinMode = $('opt_pinmode').value; opt.packagePins = $('opt_pkg').value; }
    if ($('opt_variant') && $('opt_variant').value.trim()) opt.variant = $('opt_variant').value.trim();
    return { inp, opt };
  }

  function writeForm(inp, opt) {
    Object.entries(inp || {}).forEach(([k, v]) => {
      const f = current.fields.find(x => x.key === k);
      if (!f) return;
      if (f.type === 'select' || f.type === 'text' || f.type === 'int') $('in_' + k).value = v;
      else if (typeof v === 'object') { $('in_' + k).value = v.min || ''; $('in_' + k + '_max').value = v.max || ''; }
      else $('in_' + k).value = v;
    });
    opt = opt || {};
    if ($('opt_suffix') && opt.suffix !== undefined && [...$('opt_suffix').options].some(o => o.value === opt.suffix)) $('opt_suffix').value = opt.suffix;
    if ($('opt_general') && opt.general) $('opt_general').value = opt.general;
    if ($('opt_thermal')) $('opt_thermal').checked = !!opt.thermalPad;
    if ($('opt_reverse')) $('opt_reverse').checked = !!opt.reverse;
    if ($('opt_pinmode') && opt.pinMode) { $('opt_pinmode').value = opt.pinMode; $('opt_pkg').value = opt.packagePins || ''; }
    if ($('opt_variant') && opt.variant) $('opt_variant').value = opt.variant;
  }

  function update() {
    const { inp, opt } = readForm();
    const touched = Object.keys(inp).length > 0;
    const r = namer.build(current.id, inp, opt);
    last = r.ok ? { r, inp, opt } : null;
    const name = $('name');
    $('pads').innerHTML = '';
    $('msgs').innerHTML = '';
    if (r.ok) {
      name.textContent = r.name;
      name.className = 'name';
      r.parts.forEach(p => {
        const sep = p.label === 'separator';
        const d = el('div', { class: 'pad' + (sep ? ' sep' : '') });
        d.appendChild(el('b', {}, p.text));
        if (!sep) d.appendChild(el('i', {}, p.label.replace(/\s*\(.*\)/, '')));
        $('pads').appendChild(d);
      });
      $('mbarName').textContent = r.name;
      $('mbar').classList.add('show');
      document.body.classList.add('has-mbar');
    } else {
      name.textContent = touched ? 'Keep going – some values are still missing' : 'Fill in the dimensions to build the name';
      name.className = 'name empty';
      $('mbar').classList.remove('show');
      document.body.classList.remove('has-mbar');
      if (touched) msg('err', r.errors);
    }
    if (r.warnings && r.warnings.length) msg('warn', r.warnings);
    ['copy', 'link', 'json'].forEach(id => { $(id).disabled = !r.ok; });
  }
  function msg(kind, list) {
    const d = el('div', { class: 'msg ' + kind }), ul = el('ul');
    list.forEach(t => ul.appendChild(el('li', {}, t)));
    d.appendChild(ul); $('msgs').appendChild(d);
  }

  // ---------------- share link (state in the URL hash) ----------------
  function stateLink() {
    const s = { f: current.id, i: last.inp, o: last.opt };
    return SITE + '#p=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
  }
  function loadFromHash() {
    const fm = location.hash.match(/#f=([A-Z0-9_]+)/i);
    if (fm && namer.rules.families[fm[1].toUpperCase()]) {
      pick(fm[1].toUpperCase());
      renderFields();
      return true;
    }
    const m = location.hash.match(/#p=(.+)$/);
    if (!m) return false;
    try {
      const s = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
      if (!namer.rules.families[s.f]) return false;
      pick(s.f);
      renderFields();
      writeForm(s.i, s.o);
      update();
      return true;
    } catch (e) { return false; }
  }

  // ---------------- history ----------------
  function renderHistory() {
    const h = store.get('ipcNamerHistory', []);
    const ul = $('history'); ul.innerHTML = '';
    $('historyEmpty').hidden = h.length > 0;
    h.forEach(item => {
      const li = el('li');
      li.appendChild(el('code', {}, item.name));
      const b = el('button', { class: 'quiet' }, 'Open');
      b.addEventListener('click', () => {
        pick(item.f); renderFields(); writeForm(item.i, item.o); update();
        window.scrollTo({ top: 0 });
      });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function remember() {
    if (!last) return;
    const h = store.get('ipcNamerHistory', []).filter(x => x.name !== last.r.name);
    h.unshift({ name: last.r.name, f: current.id, i: last.inp, o: last.opt });
    store.set('ipcNamerHistory', h.slice(0, 8));
    renderHistory();
  }

  // ---------------- buttons ----------------
  function copyName() { if (!last) return; copyText(last.r.name, 'Copied ' + last.r.name); remember(); }
  $('copy').addEventListener('click', copyName);
  $('mbarCopy').addEventListener('click', copyName);
  $('link').addEventListener('click', () => { if (last) { copyText(stateLink(), 'Link copied – it reopens this part'); remember(); } });
  $('json').addEventListener('click', () => {
    if (!last) return;
    const blob = new Blob([JSON.stringify(last.r.record, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: last.r.name + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
    remember();
  });
  $('family').addEventListener('change', () => { history.replaceState(null, '', location.pathname); syncLevels($('family').value); renderFields(); });
  $('clear').addEventListener('click', () => { history.replaceState(null, '', location.pathname); renderFields(); });
  // human-readable formula: QFN [Pitch] P [Body width] X ... - [pins] [density]
  function renderFormula() {
    const box = $('tpl');
    box.innerHTML = '';
    box.appendChild(el('span', { class: 'lbl' }, 'Name ='));
    const short = { pitch: 'pitch', pitchCol: 'col pitch', pitchRow: 'row pitch', leadSpan: 'lead span', leadSpan1: 'span L1', leadSpan2: 'span L2',
      bodyL: 'length', bodyW: 'width', bodyT: 'thickness', bodyDia: 'diameter', baseSize: 'base', height: 'height', pinQty: 'pins',
      cols: 'cols', rows: 'rows', pinsPerRow: 'per row', leadWidth: 'lead W', leadLength: 'lead L', leadSpacing: 'spacing',
      land: 'land', hole: 'hole', antipad: 'anti-pad', vias: 'vias', padSize: 'pad', padL: 'pad L', padW: 'pad W', maskSize: 'mask',
      ballType: 'C/N', lgaType: 'C/S/R', plating: 'P/NP', part: 'part no.', mfr: 'maker', mfrPrefix: 'category', jedecNo: 'number',
      jedecName: 'package', pinQtyOpt: 'pins' };
    current.template.split(/(\{[^}]+\}|\[|\])/).forEach(tok => {
      if (!tok || tok === '[' || tok === ']') return;
      const m = tok.match(/^\{(\w+):\w\}$/);
      if (m) box.appendChild(el('span', { class: 'v' }, short[m[1]] || m[1]));
      else box.appendChild(el('span', { class: 't' }, tok));
    });
    if (current.qty) { box.appendChild(el('span', { class: 't' }, '-')); box.appendChild(el('span', { class: 'v' }, 'pins')); }
    if (current.suffixMode === 'density') box.appendChild(el('span', { class: 'v' }, 'M/N/L'));
    if (current.suffixMode === 'level') box.appendChild(el('span', { class: 'v' }, 'A/B/C'));
  }

  // quick start chips in the hero
  const QUICK = {
    qfn: { f: 'QFN', i: { pitch: 0.5, bodyW: 5, bodyL: 5, height: { min: 0.8, max: 1.0 }, pinQty: 32 }, o: { thermalPad: true } },
    soic: { f: 'SOIC', i: { leadSpan: { min: 5.8, max: 6.2 }, height: { min: 1.35, max: 1.75 }, pinQty: 8 }, o: {} },
    r0603: { f: 'RESC', i: { bodyL: { min: 1.5, max: 1.7 }, bodyW: { min: 0.7, max: 0.9 }, height: { min: 0.35, max: 0.55 } }, o: {} },
    sot5: { f: 'SOT', i: { pitch: 0.95, leadSpan: { min: 2.6, max: 3.0 }, height: { min: 0.9, max: 1.45 }, pinQty: 5 }, o: {} },
    hdr: { f: 'HDRV', i: { pinQty: 20, leadWidth: 0.635, pitch: 2.54, rows: 2, pinsPerRow: 10, bodyL: 25.4, bodyT: 5.08, height: 8.38 }, o: {} }
  };
  document.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const q = QUICK[b.getAttribute('data-quick')];
    pick(q.f); renderFields(); writeForm(q.i, q.o); update();
    document.querySelector('.tool').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  $('example').addEventListener('click', () => {
    let ex = rules.examples.find(e => e.family === $('family').value);
    if (!ex) { ex = rules.examples.find(e => e.family === 'QFN'); pick('QFN'); }
    renderFields();
    writeForm(ex.in, ex.opt);
    update();
  });

  // ---------------- share the site ----------------
  const shareText = 'Free tool: type datasheet dimensions, get the IPC-7351B footprint (land pattern) name.';
  $('shLinkedIn').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(SITE);
  $('shWhatsApp').href = 'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + SITE);
  $('shX').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(SITE);
  $('shCopy').addEventListener('click', () => copyText(SITE, 'Site link copied'));
  if (navigator.share) {
    $('shNative').hidden = false;
    $('shNative').addEventListener('click', () => navigator.share({ title: 'IPC Land Pattern Namer', text: shareText, url: SITE }).catch(() => {}));
  }
  // "Report a wrong name" links open the issue form already filled with this part
  document.querySelectorAll('a[href*="template=wrong-name"]').forEach(a => a.addEventListener('click', () => {
    const base = 'https://github.com/KartikeyanMurugan/ipc-land-pattern-namer/issues/new?template=wrong-name.yml';
    if (!last || !current) { a.href = base; return; }
    a.href = base + '&title=' + encodeURIComponent('Wrong name: ' + last.r.name) +
      '&family=' + encodeURIComponent(current.id) +
      '&values=' + encodeURIComponent(stateLink()) +
      '&got=' + encodeURIComponent(last.r.name);
  }));

  // ---------------- visits and likes (free public counter, no personal data) ----------------
  // Some browsers, ad blockers and office networks block counter sites. Each call gives up after
  // 4 s, and the numbers are simply not shown – the like button and sharing still work.
  const onSite = location.protocol.indexOf('http') === 0;
  function counter(path) {
    const ctl = ('AbortController' in window) ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), 4000);
    return fetch(COUNTER + path, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => { clearTimeout(t); if (typeof j.value !== 'number') throw new Error('bad'); return j.value; },
            e => { clearTimeout(t); throw e; });
  }
  function fmt(n) { return n.toLocaleString('en-IN'); }
  const later = fn => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200);
  if (onSite) later(() => {
    let counted = false;
    try { counted = sessionStorage.getItem('ipcNamerVisit') === '1'; } catch (e) {}
    counter((counted ? '/get/' : '/hit/') + NS + '/visits')
      .then(v => { $('visits').textContent = fmt(v); $('visitStat').hidden = false; try { sessionStorage.setItem('ipcNamerVisit', '1'); } catch (e) {} })
      .catch(() => { $('visitStat').hidden = true; });
    counter('/get/' + NS + '/likes').then(v => { $('likes').textContent = fmt(v); }).catch(() => { $('likes').textContent = ''; });
  });
  function setLiked(on) {
    $('like').classList.toggle('on', on);
    $('like').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('likeLabel').textContent = on ? 'Thanks for the like' : 'Useful? Like it';
  }
  setLiked(store.get('ipcNamerLiked', false));
  $('like').addEventListener('click', () => {
    if (store.get('ipcNamerLiked', false)) { toast('Already counted – thank you'); return; }
    store.set('ipcNamerLiked', true);
    setLiked(true);
    if (!onSite) return;
    counter('/hit/' + NS + '/likes').then(v => { $('likes').textContent = fmt(v); }).catch(() => {});
  });

  // ---------------- start ----------------
  renderHistory();
  if (!loadFromHash()) { pick('QFN'); renderFields(); }
  window.addEventListener('hashchange', () => { loadFromHash(); });
})();
