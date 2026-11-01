// Shared page behaviour: theme button and header shadow on scroll.
(function () {
  'use strict';
  var btn = document.getElementById('themeBtn');
  function effective() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function sync() {
    if (!btn) return;
    var label = effective() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('ipcNamerTheme', next); } catch (e) {}
      sync();
    });
    sync();
  }
  var head = document.getElementById('siteHead');
  if (head) {
    var onScroll = function () { head.classList.toggle('scrolled', window.scrollY > 4); };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    requestAnimationFrame(onScroll);
  }
})();
