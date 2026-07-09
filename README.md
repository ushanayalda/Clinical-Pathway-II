# Clinical Pathway Case 001 v2.2

A static, data-driven prototype for a guided clinical station run.

## What changed

- Six clinical beats instead of twelve mechanical station screens.
- Safe reasoning guide at every clinical turn.
- Urgent transfer occurs immediately after the danger threshold, before the remaining focused assessment.
- One action per clinical beat. No reveal-then-continue double step.
- Three core Review stages instead of ten compulsory stages.
- Optional what-if and detailed examiner views remain available after the attempt.
- Blind repeat hides the reasoning guide and doctor lines.
- Home, Library and Journey use one clear next action.

## Run

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Checks

```bash
node --check app.js
python3 -m json.tool data/cases/case-001.prototype.json > /dev/null
```

## Scope

- Case 001 only.
- No voice recognition or scoring.
- No automatic clinical scoring.
- Clinical, source, accessibility, renderer, audio and release statuses remain HOLD.

## Final QA evidence

- `FINAL_QA_SUMMARY.md`
- `qa/INTERNAL_QA_REPORT.md`
- `qa/SECOND_AUDIT_REPORT.md`
