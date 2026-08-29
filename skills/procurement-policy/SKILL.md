# Procurement Policy — Clearance Skill
# Loaded on-demand in sandbox when agent needs policy context

## Rules
- Single PO limit: $5,000 — above requires founder approval (human checkpoint)
- Monthly budget: $25,000 — warn at 80% ($20k)
- Blocked vendors: none currently
- Require 2 quotes for >$3,000
- All software purchases need security review tag

## How agent uses this
1. Extract invoice total in sandbox
2. Compare vs rules above via deferred tool loading — only load skill when total > 0
3. Cite exact line in Generative UI receipt

## Example citation
> Policy §2.1: Monthly budget $25k — this $4,200 invoice would bring you to 82% — approval required.
