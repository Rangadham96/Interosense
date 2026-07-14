---
name: Science Progression Engine
description: How next-exercise recommendations work — deterministic, not random, based on which body systems were just trained.
---

# Science Progression Engine

The `SCIENCE_PROGRESSION` constant in `app/exercise/[id].tsx` maps each exercise category to:
- `category`: the scientifically optimal next category to train
- `bridge`: a plain-language explanation of WHY this next category follows

**Progression chain (simplified):**
heartbeat -> bodyScanning -> tension -> movement -> bodyScanning (cycle)
breathing -> heartbeat
exposure -> breathing (always: amygdala activation needs vagal downregulation)
gut -> breathing (vagus nerve connection)
temperature -> bodyScanning
nervousSystem -> breathing
traumaInformed -> temperature

**Why:** Random recommendations broke the science narrative. Users need to see that the sequence matters, not just that exercises exist.

**How to apply:** Whenever adding new exercise categories, add them to SCIENCE_PROGRESSION with a justified next category. All science terms in bridge text and reflection text must include plain-language parentheticals on first mention.
