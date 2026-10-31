#!/usr/bin/env python3
"""Builds the site: shared header/footer/icons into index.html, and guides/*.html.
Run: python3 tools/build-site.py"""
import os
import re
import html
import sys
sys.path.insert(0, os.path.dirname(__file__))
from partials import header, footer, ICON

ROOT = os.path.join(os.path.dirname(__file__), '..')
SITE = 'https://kartikeyanmurugan.github.io/ipc-land-pattern-namer/'
REPO = 'https://github.com/KartikeyanMurugan/ipc-land-pattern-namer'
LINKEDIN = 'https://www.linkedin.com/in/karthikeyanmurugan1/'

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#14532d">
<script>try{{var t=localStorage.getItem('ipcNamerTheme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"></noscript>
<link rel="stylesheet" href="../assets/site.css">
{ld}
</head>
<body>
{header}
<main id="main">
'''

FOOT = '''</main>
{footer}
<script src="../assets/theme.js"></script>
</body>
</html>
'''


def page(slug, title, desc, body, ld_type='TechArticle'):
    url = SITE + 'guides/' + slug
    ld = ('<script type="application/ld+json">{"@context":"https://schema.org","@type":"%s",'
          '"headline":"%s","description":"%s","url":"%s",'
          '"author":{"@type":"Person","name":"Karthikeyan Murugan","url":"%s"}}</script>'
          % (ld_type, title.replace('"', ''), desc.replace('"', ''), url, LINKEDIN))
    out = HEAD.format(title=html.escape(title), desc=html.escape(desc), url=url, site=SITE, ld=ld, repo=REPO,
                      header=header('../', 'guides'))
    out += body + FOOT.format(footer=footer('../'))
    with open(os.path.join(ROOT, 'guides', slug or 'index.html'), 'w') as f:
        f.write(out)


def article(crumb, h1, lead, sections, family, example_note):
    return '''<div class="wrap crumbs"><a href="../">Tool</a> / <a href="./">Guides</a> / {crumb}</div>
<div class="wrap"><article class="guide">
  <h1>{h1}</h1>
  <p class="lead">{lead}</p>
  {sections}
  <div class="cta">
    <a class="btn" href="../#f={family}">Open the tool for this package</a>
    <a class="btn outline" href="./">All guides</a>
  </div>
  <p class="hint">{example_note}</p>
</article></div>
'''.format(crumb=crumb, h1=h1, lead=lead, sections=sections, family=family, example_note=example_note)


def mistake(title, text):
    return '<div class="mistake"><b>%s</b>%s</div>' % (title, text)


# ------------------------------------------------------------------ diagrams
QFN_SVG = '''<figure class="diagram"><svg viewBox="0 0 640 300" role="img" aria-label="QFN top and side view with pitch e, body width E, body length D and height A">
  <rect class="dg-fill" x="60" y="40" width="200" height="200" rx="6"/>
  <g class="dg-pad">
    <rect x="62" y="70" width="18" height="12"/><rect x="62" y="100" width="18" height="12"/><rect x="62" y="130" width="18" height="12"/><rect x="62" y="160" width="18" height="12"/><rect x="62" y="190" width="18" height="12"/>
    <rect x="240" y="70" width="18" height="12"/><rect x="240" y="100" width="18" height="12"/><rect x="240" y="130" width="18" height="12"/><rect x="240" y="160" width="18" height="12"/><rect x="240" y="190" width="18" height="12"/>
    <rect x="115" y="95" width="90" height="90" opacity=".75"/>
  </g>
  <circle cx="92" cy="58" r="5" class="dg-pad"/>
  <path class="dg-dim" d="M60 262 H260 M60 254 V270 M260 254 V270"/><text class="dg-txt" x="128" y="285">E (width)</text>
  <path class="dg-dim" d="M282 40 V240 M274 40 H290 M274 240 H290"/><text class="dg-txt" x="292" y="145">D</text>
  <path class="dg-dim" d="M40 76 V106 M32 76 H48 M32 106 H48"/><text class="dg-txt" x="18" y="96">e</text>
  <text class="dg-note" x="125" y="145">thermal pad</text>
  <rect class="dg-fill" x="380" y="150" width="200" height="34"/>
  <rect class="dg-pad" x="380" y="184" width="22" height="4"/><rect class="dg-pad" x="558" y="184" width="22" height="4"/>
  <path class="dg-dim" d="M600 150 V188 M592 150 H608 M592 188 H608"/><text class="dg-txt" x="612" y="174">A</text>
  <text class="dg-note" x="380" y="215">Side view: A = maximum height</text>
</svg><figcaption>QFN dimensions as most datasheets label them: e pitch, E body width, D body length, A height.</figcaption></figure>'''

SOIC_SVG = '''<figure class="diagram"><svg viewBox="0 0 640 300" role="img" aria-label="SOIC top view showing lead span E versus body width E1">
  <rect class="dg-fill" x="200" y="40" width="160" height="210" rx="4"/>
  <g class="dg-pad">
    <rect x="150" y="62" width="50" height="16"/><rect x="150" y="112" width="50" height="16"/><rect x="150" y="162" width="50" height="16"/><rect x="150" y="212" width="50" height="16"/>
    <rect x="360" y="62" width="50" height="16"/><rect x="360" y="112" width="50" height="16"/><rect x="360" y="162" width="50" height="16"/><rect x="360" y="212" width="50" height="16"/>
  </g>
  <circle cx="220" cy="60" r="6" class="dg-pad"/>
  <path class="dg-dim" d="M150 272 H410 M150 264 V280 M410 264 V280"/><text class="dg-txt" x="222" y="295">E – lead span (use this)</text>
  <path class="dg-dim" d="M200 22 H360 M200 14 V30 M360 14 V30"/><text class="dg-txt" x="220" y="12">E1 – body width (not this)</text>
  <path class="dg-dim" d="M128 70 V120 M120 70 H136 M120 120 H136"/><text class="dg-txt" x="108" y="100">e</text>
</svg><figcaption>The name uses E, measured from lead tip to lead tip. E1 is only the plastic body.</figcaption></figure>'''

CHIP_SVG = '''<figure class="diagram"><svg viewBox="0 0 640 230" role="img" aria-label="Chip component length L, width W and height T">
  <rect class="dg-fill" x="80" y="60" width="240" height="110"/>
  <rect class="dg-pad" x="80" y="60" width="44" height="110"/><rect class="dg-pad" x="276" y="60" width="44" height="110"/>
  <path class="dg-dim" d="M80 194 H320 M80 186 V202 M320 186 V202"/><text class="dg-txt" x="180" y="220">L</text>
  <path class="dg-dim" d="M342 60 V170 M334 60 H350 M334 170 H350"/><text class="dg-txt" x="354" y="120">W</text>
  <rect class="dg-fill" x="430" y="110" width="160" height="40"/>
  <rect class="dg-pad" x="430" y="110" width="28" height="40"/><rect class="dg-pad" x="562" y="110" width="28" height="40"/>
  <path class="dg-dim" d="M608 110 V150 M600 110 H616 M600 150 H616"/><text class="dg-txt" x="618" y="136">T</text>
  <text class="dg-note" x="440" y="180">side view – T max is the height</text>
</svg><figcaption>Chip parts: L length, W width, T thickness (height).</figcaption></figure>'''

SOT_SVG = '''<figure class="diagram"><svg viewBox="0 0 640 260" role="img" aria-label="SOT-23-5 top view with pitch e and lead span E">
  <rect class="dg-fill" x="200" y="70" width="200" height="110" rx="4"/>
  <g class="dg-pad">
    <rect x="222" y="180" width="20" height="40"/><rect x="290" y="180" width="20" height="40"/><rect x="358" y="180" width="20" height="40"/>
    <rect x="222" y="30" width="20" height="40"/><rect x="358" y="30" width="20" height="40"/>
  </g>
  <path class="dg-dim" d="M232 240 H300 M232 232 V248 M300 232 V248"/><text class="dg-txt" x="258" y="258">e</text>
  <path class="dg-dim" d="M232 14 H368 M232 6 V22 M368 6 V22"/><text class="dg-txt" x="270" y="16" dy="-2">e1 = 2 × e</text>
  <path class="dg-dim" d="M430 30 V220 M422 30 H438 M422 220 H438"/><text class="dg-txt" x="442" y="130">E</text>
  <text class="dg-note" x="442" y="150">lead span</text>
</svg><figcaption>SOT-23-5: the name uses the pin-to-pin pitch e (0.95 mm), not e1 (1.90 mm).</figcaption></figure>'''

# ------------------------------------------------------------------ pages
os.makedirs(os.path.join(ROOT, 'guides'), exist_ok=True)

qfn = article(
    'QFN, SON and DFN',
    'How to name a QFN footprint (IPC-7351B)',
    'QFN, SON and DFN names describe pitch, body size, height and pin count. The two things people get wrong are the order of the body dimensions and the thermal pad.',
    '''<h2>The formula</h2>
  <div class="formula">QFN + pitch P + body width X body length X height - pin count + density
    <small>QFN50P500X500X100-33N = 0.50 mm pitch, 5.00 × 5.00 mm body, 1.00 mm max height, 32 pins + thermal pad, nominal density</small></div>
  ''' + QFN_SVG + '''
  <h2>Step by step</h2>
  <ol>
    <li><b>Pitch</b> – e from the datasheet, × 100: 0.50 mm → <code>50P</code>, 0.40 mm → <code>40P</code>.</li>
    <li><b>Body width and length</b> – nominal values × 100, no leading zeros: 5.00 → <code>500</code>, 3.50 → <code>350</code>. Width comes first.</li>
    <li><b>Height</b> – the <em>maximum</em> A value × 100: 1.00 → <code>100</code>, 0.80 → <code>80</code>.</li>
    <li><b>Pin count</b> – signal pins, plus one if there is an exposed thermal pad: 32 + pad → <code>-33</code>.</li>
    <li><b>Density</b> – <code>N</code> nominal for most boards, <code>M</code> most material, <code>L</code> least material.</li>
  </ol>
  <p>SON (two-sided) uses the same pattern with the prefix <code>SON</code>. DFN uses body size and height without a pitch: <code>DFN300X300X80-8N</code>.</p>
  <h2>Common mistakes</h2>
  ''' + mistake('Forgetting the thermal pad', 'A 32-pin QFN with an exposed pad is <code>-33</code>, not <code>-32</code>. Two parts with and without a pad would otherwise get the same name.') + \
    mistake('Using typical height', 'Datasheets list A as min / nom / max. The name uses the maximum, because it is what limits clearance.') + \
    mistake('Leading zeros', 'Write <code>350</code>, not <code>0350</code>, and <code>80</code>, not <code>080</code>.'),
    'QFN', 'Values in mm. Check the result against your company library standard.')
page('qfn.html', 'How to name a QFN footprint (IPC-7351B) – QFN, SON, DFN',
     'Step-by-step IPC-7351B naming for QFN, SON and DFN footprints: pitch, body size, maximum height and the thermal pad in the pin count.', qfn)

soic = article(
    'SOIC and SOP',
    'How to name SOIC, SOP, SSOP and TSSOP footprints',
    'Gull-wing packages are named from pitch, lead span and height. Almost every wrong name comes from using the body width instead of the lead span.',
    '''<h2>The formula</h2>
  <div class="formula">SOIC127P + lead span X height - pin count + density
    <small>SOIC127P600X175-8N = 1.27 mm pitch SOIC, 6.00 mm lead span, 1.75 mm max height, 8 pins</small></div>
  <div class="formula" style="margin-top:10px">SOP + pitch P + lead span X height - pin count + density
    <small>SOP65P640X120-20N = 0.65 mm pitch (TSSOP-20), 6.40 mm lead span, 1.20 mm max height, 20 pins</small></div>
  ''' + SOIC_SVG + '''
  <h2>Step by step</h2>
  <ol>
    <li><b>Family</b> – 1.27 mm pitch parts use the fixed prefix <code>SOIC127P</code>. All other pitches (SSOP, TSSOP, MSOP) use <code>SOP</code> + pitch.</li>
    <li><b>Lead span</b> – E, lead tip to lead tip, nominal: 5.80–6.20 → 6.00 → <code>600</code>.</li>
    <li><b>Height</b> – A maximum: 1.75 → <code>175</code>.</li>
    <li><b>Pin count and density</b> – <code>-8N</code>.</li>
  </ol>
  <h2>Common mistakes</h2>
  ''' + mistake('E1 instead of E', 'A narrow SOIC body (E1) is about 3.9 mm, the lead span (E) about 6.0 mm. Using 3.90 gives <code>SOIC127P390…</code>, which describes a different footprint.') + \
    mistake('Nominal height', 'Use A max, not the typical value.') + \
    mistake('Wide-body parts', 'Wide SOIC-16 has a lead span near 10.3 mm: <code>SOIC127P1030X265-16N</code>. Same pin count, different name – that is the point.'),
    'SOIC', 'Values in mm. Check the result against your company library standard.')
page('soic-sop.html', 'How to name SOIC, SOP, SSOP and TSSOP footprints (IPC-7351B)',
     'IPC-7351B naming for SOIC and SOP family footprints: lead span E versus body width E1, maximum height, pitch and pin count.', soic)

chip = article(
    'Chip R, C, L',
    'How to name chip resistor, capacitor and inductor footprints',
    'Chip parts use a short name built from the metric body size and the maximum height. The size code is metric, not the imperial code printed in catalogues.',
    '''<h2>The formula</h2>
  <div class="formula">RESC / CAPC / INDC + length + width X height + density
    <small>RESC1608X55N = chip resistor, 1.6 × 0.8 mm body (0603 imperial), 0.55 mm max height</small></div>
  ''' + CHIP_SVG + '''
  <h2>Step by step</h2>
  <ol>
    <li><b>Prefix</b> – <code>RESC</code> resistor, <code>CAPC</code> capacitor, <code>CAPCP</code> polarized capacitor, <code>INDC</code> inductor, <code>DIOC</code> diode, <code>LEDM</code> molded LED.</li>
    <li><b>Length and width</b> – one digit each side of the decimal point: 1.6 → <code>16</code>, 0.8 → <code>08</code>, giving <code>1608</code>. Further digits are dropped: 1.25 → <code>12</code>.</li>
    <li><b>Height</b> – T maximum × 100: 0.55 → <code>55</code>, 0.90 → <code>90</code>.</li>
    <li><b>Density</b> – <code>N</code>, <code>M</code> or <code>L</code>.</li>
  </ol>
  <h2>Imperial to metric size codes</h2>
  <div class="table-wrap"><table class="rules">
    <thead><tr><th>Imperial</th><th>Metric body (mm)</th><th>Name size code</th></tr></thead>
    <tbody>
      <tr><td>0201</td><td>0.6 × 0.3</td><td><code>0603</code></td></tr>
      <tr><td>0402</td><td>1.0 × 0.5</td><td><code>1005</code></td></tr>
      <tr><td>0603</td><td>1.6 × 0.8</td><td><code>1608</code></td></tr>
      <tr><td>0805</td><td>2.0 × 1.25</td><td><code>2012</code></td></tr>
      <tr><td>1206</td><td>3.2 × 1.6</td><td><code>3216</code></td></tr>
      <tr><td>1210</td><td>3.2 × 2.5</td><td><code>3225</code></td></tr>
    </tbody>
  </table></div>
  <h2>Common mistakes</h2>
  ''' + mistake('Imperial code in the name', 'An 0603 resistor is <code>RESC1608…</code>. <code>RESC0603…</code> means a much smaller 0201 part.') + \
    mistake('One name for all capacitors', 'An 0603 MLCC can be 0.8 or 1.0 mm thick. Different heights give different names – <code>CAPC1608X90N</code> vs <code>CAPC1608X110N</code> – so the 3D model and placement height stay correct.') + \
    mistake('0805 size code', 'The width 1.25 mm becomes <code>12</code> – only one digit after the decimal point is kept – so 0805 is <code>2012</code>.'),
    'RESC', 'Values in mm. Check the result against your company library standard.')
page('chip.html', 'How to name chip resistor, capacitor and inductor footprints (IPC-7351B)',
     'IPC-7351B naming for chip R, C and L footprints, imperial to metric size codes (0603 = 1608) and why height is part of the name.', chip)

sot = article(
    'SOT-23 and SOT-223',
    'How to name SOT-23, SOT-23-5 and SOT-223 footprints',
    'SOT names use pitch, lead span and height. The catch is the pitch: when some pins are missing, use the pin-to-pin grid pitch, not the larger spacing.',
    '''<h2>The formula</h2>
  <div class="formula">SOT + pitch P + lead span X height - pin count + density
    <small>SOT95P280X145-5N = 0.95 mm pitch, 2.80 mm lead span, 1.45 mm max height, 5 pins</small></div>
  ''' + SOT_SVG + '''
  <h2>Step by step</h2>
  <ol>
    <li><b>Pitch</b> – e, the grid between neighbouring pin positions: 0.95 mm → <code>95P</code>. SOT-223 is 2.30 mm → <code>230P</code>.</li>
    <li><b>Lead span</b> – E, nominal, lead tip to lead tip.</li>
    <li><b>Height</b> – A maximum.</li>
    <li><b>Pin count</b> – count the tab of a SOT-223 as a pin: <code>-4</code>.</li>
    <li><b>Pin assignment (optional)</b> – transistors may add <code>_BEC</code>, <code>_SGD</code> or <code>_213</code> before the pin count, for example <code>SOT95P280X160_BEC-3N</code>.</li>
  </ol>
  <h2>Common mistakes</h2>
  ''' + mistake('Using e1', 'On SOT-23 the outer pins are 1.90 mm apart (e1). The name still uses 0.95 mm (e).') + \
    mistake('Same name for different pinouts', 'A BJT and a MOSFET in SOT-23 share pads but not pin functions. Add <code>_BEC</code> / <code>_SGD</code> when your library keeps them separate.') + \
    mistake('Height from the wrong column', 'Manufacturers differ (1.12, 1.30, 1.45 mm max). Use the part’s own datasheet, not a generic SOT-23 value.'),
    'SOT', 'Values in mm. Lead spans differ between manufacturers – always use the datasheet of the actual part.')
page('sot.html', 'How to name SOT-23, SOT-23-5 and SOT-223 footprints (IPC-7351B)',
     'IPC-7351B naming for SOT packages: which pitch to use when pins are missing, lead span, height and pin-assignment suffixes.', sot)

index = '''<div class="wrap crumbs"><a href="../">Tool</a> / Guides</div>
<div class="wrap page-head">
  <h1>Footprint naming guides</h1>
  <p>Short, practical guides to IPC-7351B land pattern names: which datasheet value goes where, and the mistakes that create duplicate or wrong footprints.</p>
</div>
<div class="wrap">
  <ul class="cards">
    <li><a href="qfn.html"><b>QFN, SON and DFN</b><span>Thermal pad in the pin count, and body width before length.</span><code>QFN50P500X500X100-33N</code></a></li>
    <li><a href="soic-sop.html"><b>SOIC, SOP, SSOP, TSSOP</b><span>Lead span E vs body width E1, the most common mistake.</span><code>SOIC127P600X175-8N</code></a></li>
    <li><a href="chip.html"><b>Chip resistors, capacitors, inductors</b><span>0603 imperial is 1608 metric, and height is the maximum.</span><code>RESC1608X55N</code></a></li>
    <li><a href="sot.html"><b>SOT-23, SOT-23-5, SOT-223</b><span>Which pitch to use when pins are not evenly spaced.</span><code>SOT95P280X145-5N</code></a></li>
  </ul>
  <p class="hint" style="margin-top:24px">Need a guide for another package? <a href="''' + REPO + '''/discussions/new?category=ideas" target="_blank" rel="noopener">Request it in Discussions</a>.</p>
</div>
'''
page('', 'Footprint naming guides – IPC-7351B land pattern names', 'Practical guides to IPC-7351B footprint names for QFN, SOIC, SOP, chip and SOT packages.', index, 'CollectionPage')
print('guides written')

# ------------------------------------------------------------------ index.html
p = os.path.join(ROOT, 'index.html')
with open(p) as f:
    s = f.read()
s = re.sub(r'<!-- header:start -->.*?<!-- header:end -->', lambda m: header('', 'tool'), s, flags=re.S)
s = re.sub(r'<!-- footer:start -->.*?<!-- footer:end -->', lambda m: footer(''), s, flags=re.S)
s = re.sub(r'@@(\w+)@@', lambda m: ICON[m.group(1)], s)
with open(p, 'w') as f:
    f.write(s)
print('index.html updated')
