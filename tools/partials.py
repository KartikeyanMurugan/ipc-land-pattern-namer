"""Shared header, footer and icons. Used by tools/build-site.py for every page."""

REPO = 'https://github.com/KartikeyanMurugan/ipc-land-pattern-namer'
LINKEDIN = 'https://www.linkedin.com/in/karthikeyanmurugan1/'
GITHUB_USER = 'https://github.com/KartikeyanMurugan'
VERSION = '0.5.0'

ICON = {
    'github': '<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
    'linkedin': '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    'whatsapp': '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6z"/><path fill="currentColor" d="M8.7 7.3c.3-.3.8-.3 1 .1l1 1.5c.2.3.2.7-.1 1l-.6.6c.6 1.3 1.6 2.3 2.9 2.9l.6-.6c.3-.3.7-.3 1-.1l1.5 1c.4.2.4.7.1 1l-.8.8c-.6.6-1.4.7-2.1.4a9.6 9.6 0 0 1-5.2-5.2c-.3-.7-.2-1.5.4-2.1z"/></svg>',
    'x': '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/></svg>',
    'share': '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></g></svg>',
    'link': '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.3-3.3a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.3 3.3a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1"/></g></svg>',
    'heart': '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.5 1.1 4.3 2.6h2.6C14.1 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>',
    'moon': '<svg class="ic ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg>',
    'sun': '<svg class="ic ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></g></svg>',
}

LOGO = ('<svg width="36" height="36" viewBox="0 0 34 34" aria-hidden="true"><rect x="1" y="1" width="32" height="32" rx="7" fill="#14532d"/>'
        '<rect x="6" y="11" width="7" height="12" rx="1.5" fill="#b25f17"/><rect x="21" y="11" width="7" height="12" rx="1.5" fill="#b25f17"/>'
        '<rect x="12" y="15" width="10" height="4" fill="#f2f5ef" opacity=".85"/></svg>')


def header(prefix, active):
    """prefix: '' for root pages, '../' for guides. active: 'tool' | 'guides'."""
    def cur(name):
        return ' aria-current="page"' if name == active else ''
    return f'''<!-- header:start -->
<a class="skip" href="#main">Skip to the tool</a>
<header class="site-head" id="siteHead">
  <div class="wrap">
    <a class="brand" href="{prefix or './'}">
      {LOGO}
      <span><b>IPC Land Pattern Namer</b><small>Footprint names for PCB designers</small></span>
    </a>
    <nav class="top" aria-label="Main">
      <a class="nav hide-sm" href="{prefix or './'}"{cur('tool')}>Tool</a>
      <a class="nav hide-sm" href="{prefix}guides/"{cur('guides')}>Guides</a>
      <a class="nav hide-sm" href="{REPO}/discussions" target="_blank" rel="noopener">Community</a>
      <button class="icon-btn theme-btn" id="themeBtn" type="button" aria-label="Switch to dark theme" title="Switch theme">{ICON['moon']}{ICON['sun']}</button>
      <a class="icon-btn btn" href="{REPO}" target="_blank" rel="noopener" aria-label="Source code on GitHub" title="Source code on GitHub">{ICON['github']}</a>
    </nav>
  </div>
</header>
<!-- header:end -->'''


def footer(prefix):
    return f'''<!-- footer:start -->
<footer class="site-foot">
  <div class="wrap cols">
    <div class="foot-brand">
      <a class="brand" href="{prefix or './'}">{LOGO}<span><b>IPC Land Pattern Namer</b><small>Free and open source</small></span></a>
      <p>Type the datasheet dimensions, get the IPC-7351B land pattern name. Made by a PCB designer for library engineers and designers.</p>
      <div class="socials">
        <a href="{LINKEDIN}" target="_blank" rel="noopener" aria-label="Karthikeyan Murugan on LinkedIn" title="LinkedIn">{ICON['linkedin']}</a>
        <a href="{GITHUB_USER}" target="_blank" rel="noopener" aria-label="Karthikeyan Murugan on GitHub" title="GitHub">{ICON['github']}</a>
      </div>
    </div>
    <div>
      <h3>Tool</h3>
      <ul>
        <li><a href="{prefix or './'}">Name builder</a></li>
        <li><a href="{prefix}#rules">Naming rules</a></li>
        <li><a href="{prefix}guides/">Guides</a></li>
      </ul>
    </div>
    <div>
      <h3>Community</h3>
      <ul>
        <li><a href="{REPO}/discussions" target="_blank" rel="noopener">Discussions</a></li>
        <li><a href="{REPO}/issues/new?template=wrong-name.yml" target="_blank" rel="noopener">Report a wrong name</a></li>
        <li><a href="{REPO}/discussions/new?category=ideas" target="_blank" rel="noopener">Request a package</a></li>
      </ul>
    </div>
    <div>
      <h3>Project</h3>
      <ul>
        <li><a href="{REPO}" target="_blank" rel="noopener">Source code</a></li>
        <li><a href="{REPO}#roadmap" target="_blank" rel="noopener">Roadmap</a></li>
        <li><a href="{REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT licence</a></li>
      </ul>
    </div>
  </div>
  <div class="foot-bottom">
    <div class="wrap">
      <span>© 2026 Karthikeyan Murugan. Version {VERSION}.</span>
      <span>Not affiliated with or endorsed by IPC. Always confirm names against your own library standard.</span>
    </div>
  </div>
</footer>
<!-- footer:end -->'''
