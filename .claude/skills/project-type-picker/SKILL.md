---
name: project-type-picker
description: Selects the correct project type for any design or deliverable artifact in this hackathon. Use whenever starting a design phase, opening Claude Design, or when asked to "make", "design", or "build" any visual or document artifact and the type isn't already fixed. Also use before generating anything visual, to route to the design-standards skill afterward.
---

# Project Type Picker

Choose exactly one from: **Slides · Prototype · Wireframe · Document · Animation · Software design · Web design · Résumé · 3D object · Research · HTML email · Color + type pairing · Diagram · Flier**

## Decision rules — first match wins

1. **The shipped hackathon product itself → Web design.** A multi-page, responsive, role-based application UI. This is the default and the ~90% case. Don't overthink it.
2. **Exploring screen structure before committing to a visual direction, or adapting the ODOO wireframe → Wireframe.** Use when the question is "what goes on this screen", not "what does it look like".
3. **A clickable demo of one flow, ahead of implementation → Prototype.** Rare here: we have a real codebase, so building the real thing usually costs the same and is worth more to a reviewer.
4. **Transactional/notification email templates (Resend + React Email) → HTML email.**
5. **Architecture diagrams, ERDs, flow charts for docs or reviewers → Diagram.** High value at hour 20 — a reviewer who can see the architecture asks better questions and scores higher.
6. **The final demo deck → Slides.** Hour 20–22, not before.
7. **A printed one-page handout → Flier.** Only if the event actually wants one.
8. **Establishing the token system alone → Color + type pairing**, then feed the result into Web design.
9. **Résumé · 3D object · Animation · Research · Document · Software design →** only on explicit request. Never for the core build. (Note: "Software design" means design *of* software artifacts, not writing the app — the app is Web design.)

## Output format

```
TYPE:   <one of the fourteen>
WHY:    <one line, tied to this specific problem statement>
LATER:  <secondary types you'll produce, and when>
```

Then hand off to the **design-standards** skill before generating anything visual. Type selection decides the container; design-standards decides whether what goes in it looks designed or generated.

## Anti-pattern

Picking Prototype or Slides for the product because they feel more "design-y". The product is Web design. Slides come at hour 20. Anything else during the build window is time not spent on the thing being judged.
