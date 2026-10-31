# IPC Land Pattern Namer

Free, open-source tool that builds **IPC-7351B / IPC-7251 land pattern (footprint) names** from datasheet dimensions.

Pick the component family, type the min/max values from the datasheet, and get the name, for example:

| Part | Name |
|---|---|
| 0603 (1608 metric) resistor | `RESC1608X55N` |
| SOIC-8 | `SOIC127P600X175-8N` |
| QFN-32 5×5 with thermal pad | `QFN50P500X500X100-33N` |
| DIP-14 | `DIP762W52P254L1905H508Q14B` |
| 2×10 vertical header | `HDRV20W64P254_2X10_2540X254X838B` |

**Use it online:** https://kartikeyanmurugan.github.io/ipc-land-pattern-namer/
**Use it offline:** download the repo and open `index.html` – no install, no internet needed.

## Site features

* Search packages by type (QFN, SOIC, 0603, header …)
* Name shown as labelled segments so you can see where each number comes from
* **Copy link to this part** – a link that reopens the same family and values (handy for reviews and chat)
* Recent names kept in your browser; JSON download for footprint generators
* Like button, visit count and share buttons (LinkedIn, WhatsApp, X)
* Naming guides for QFN, SOIC/SOP, chip parts and SOT, light/dark theme

The site is built from `tools/build-site.py` (shared header, footer and guides) – edit `tools/partials.py` for header/footer changes.

Visits and likes use the free public counter at abacus.jasoncameron.dev. Only a number is stored – no cookies, no personal data. If the counter is unreachable the tool still works and the numbers are simply hidden.

## What it covers

* **SMD** – chip & molded parts, MELF, SOD, chip arrays, oscillators, SOIC / SOP / SOJ / SOT / TO, QFP / PLCC, QFN / SON / DFN / LCC, BGA / LGA / CGA, fiducials and test points
* **Through-hole** – axial / radial R, C, L, D, DIP, SIP, PGA, headers, mounting holes, test points, jumpers
* **Non-standard** – `PREFIX_ManufacturerPart` names and connectors
* Density level (M / N / L), fabrication level (A / B / C), thermal pad, hidden / deleted / reversed pins, `_HS` `_BEC` `_SGD` `_213`
* Min/max entry: spans and body sizes use the **nominal**, heights and lead widths use the **maximum**
* Input checks (for example: body width entered as lead span)
* Download a **JSON record** of the part for footprint generators and library checks

## Formatting rules used

| Value | Rule | Example |
|---|---|---|
| Pitch, spans, body, height | mm × 100, rounded, no leading zeros | 1.27 → `127`, 0.50 → `50` |
| Chip body (RESC, CAPC …) | one digit each side of the decimal point | 1.6 × 0.8 → `1608` |
| Pin quantity | after a dash | `-8` |
| Last letter | density M / N / L (SMD), fabrication level A / B / C (through-hole), none for BGA | `N`, `B` |

## Use the engine in your own tools

```js
const rules = require('./rules/ipc-7351b.js');
const namer = require('./src/namer.js').create(rules);

namer.build('QFN', { pitch: 0.5, bodyW: 5, bodyL: 5, height: { min: 0.8, max: 1.0 }, pinQty: 32 },
            { thermalPad: true }).name;   // 'QFN50P500X500X100-33N'
```

`rules/ipc-7351b.json` is the same rule table as plain JSON (regenerate with `npm run export-json`) for Python, SKILL or any other language.

## Tests

```
node test/run-tests.js
```

Every worked example from the naming convention summary is a test, plus a build of every family and the input checks. All must pass before a change is merged.

## Source and accuracy

* Rules follow the public **IPC-7351B naming convention summary (PCB Matrix, 2009)**. This project describes the naming rules in its own data format and does not reproduce the IPC standard.
* **IPC-7351C was never released.** The current IPC document is **IPC-7352 (2023)**. A separate IPC-7352 rule profile is planned; the engine is built so profiles can be switched.
* Known issues in the 2009 summary are listed in `rules/ipc-7351b.js` (`knownSourceIssues`) and on the web page.
* Not affiliated with or endorsed by IPC. Always confirm names against your own library standard.

## Found a wrong name?

Open an issue with: the family, the datasheet values you typed, the name you got, and the name you expected (with the source). Corrections become new tests so they never come back.

## Roadmap

* v0.2 – decode mode (paste a name, get the dimensions back); package-code shortcuts (0603, SOIC-8, QFN-32 5x5)
* v0.3 – IPC-7352 profile; more families from user feedback
* v1.0 – frozen rules, full test coverage

## License

MIT – free for personal and commercial use.
