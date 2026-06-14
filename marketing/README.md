# Third-Party Risk — "Infinite Drawing" (ProcessUnity)

A hand-sketch–style marketing artifact illustrating that third-party risk is a
**continuous program** spanning **every risk domain**, not a once-a-year project.

## Files
- `third-party-risk-infinite-drawing.svg` — source, editable vector (text + colors)
- `third-party-risk-infinite-drawing.png` — rendered preview (1700px wide)

## The idea
- **Center:** an infinity (∞) loop = the never-ending TPRM lifecycle
  (Onboard → Assess → Score → Monitor → Remediate → Reassess → …).
- **Around it:** the different *aspects* of third-party risk radiating out as a
  brainstorm constellation — Cybersecurity, Data Privacy, Financial, Operational,
  Compliance/Regulatory, Reputational, Geopolitical, ESG, plus Concentration,
  4th/Nth-party, and Business Continuity.
- **Brand:** ProcessUnity lockup (top-right), navy/teal/amber palette.

## Editing
The SVG uses a handwriting font stack (Bradley Hand / Segoe Print / Comic Sans /
Marker Felt) that renders as a sketch on devices that have those fonts and falls
back to sans-serif elsewhere. Edit text/colors directly in the SVG.

Re-render the PNG with:

```bash
python3 -c "import cairosvg; cairosvg.svg2png(url='third-party-risk-infinite-drawing.svg', write_to='third-party-risk-infinite-drawing.png', output_width=1700)"
```

> Concept/marketing draft. Not affiliated with or approved by ProcessUnity; brand
> elements are illustrative placeholders for layout purposes.
