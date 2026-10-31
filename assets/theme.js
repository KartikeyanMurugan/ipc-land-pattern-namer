// Light / dark theme button shared by all pages.
(function () {
  'use strict';
  var btn = document.getElementById('themeBtn');
  var lbl = document.getElementById('themeLbl');
  if (!btn) return;
  function effective() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function sync() { if (lbl) lbl.textContent = effective() === 'dark' ? 'Light' : 'Dark'; }
  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('ipcNamerTheme', next); } catch (e) {}
    sync();
  });
  sync();
})();
