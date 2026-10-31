# Validating names against real datasheets

The goal for v1.0: every common family is checked against real parts by a PCB designer.

## Add a case

1. Pick a real part and open its manufacturer datasheet (package drawing / dimension table).
2. Add an entry to `test/datasheet-cases.json`:

```json
{
  "part": "LM358DR",
  "manufacturer": "Texas Instruments",
  "package": "SOIC-8 (D)",
  "datasheet": "https://www.ti.com/lit/ds/symlink/lm358.pdf",
  "family": "SOIC",
  "values": { "leadSpan": { "min": 5.8, "max": 6.2 }, "height": { "max": 1.75 }, "pinQty": 8 },
  "options": {},
  "expected": "SOIC127P600X175-8N",
  "status": "to-verify",
  "checkedBy": ""
}
```

3. Copy the min / max values exactly as printed. Do not pre-calculate nominal values.
4. Write the **expected** name you would put in your library, independently of the tool.
5. When a designer has compared the table and the expected name, set `"status": "verified"` and `"checkedBy"` to their name.
6. Run `node test/run-tests.js`. Verified cases fail the build if the tool disagrees; `to-verify` cases are only reported.

## When the tool disagrees

- If the tool is wrong: open a "Wrong name" issue, fix the rule, keep the case as a regression test.
- If the expected name follows a company-specific rule: note it in the case and keep it out of the public rules.

Run `node tools/rule-report.js` afterwards to refresh `docs/RULES.md`.
