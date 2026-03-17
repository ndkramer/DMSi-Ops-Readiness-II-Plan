# How to Create a Constraint-vs-Outcome Comparison

**Purpose:** Repeatable process for comparing a constraint (stage-gate) model to an outcome-based model for any capability. Used to determine whether both models can coexist or whether one should replace the other.

---

## Inputs Required

1. **Constraint model document** -- the stage-gate WBS (e.g., v2-pipeline_automation_WBS.docx). This is the model senior leadership sold to the client.
2. **Outcome model document** -- the outcome-based WSB (e.g., PP-WSB.md). This is the model the technical team uses to plan and commit to work.
3. **Brand guide** -- for consistent styling across HTML artifacts (brandguide.md).

---

## Step 1: Extract the Structure from Both Models

### From the constraint model, capture:

- Every stage (S0, S1, S2, etc.) with its name, timing, and confidence level
- Every work package within each stage (WP 0.1, WP 1.1, etc.)
- Exit gates and exit criteria per stage
- All decisions (D-01 through D-xx) and which stage they belong to
- All risks (R-xx) and which stage they belong to
- All open questions (Q-xx) and which decisions they feed
- Cross-workstream dependencies (CW-xx)
- Milestone alignment per stage (M3, M4, etc.)

### From the outcome model, capture:

- Every outcome (OC-01, OC-02, etc.) with its name, category (Baseline, Iterative, Conditional), and target date
- Every deliverable within each outcome
- Success criteria per outcome
- Dependencies between outcomes (must, should, contingent)
- Iteration policies for Iterative outcomes
- Trigger conditions for Conditional outcomes
- All decisions, risks, questions, and cross-workstream dependencies (these should be the same items, just attached to outcomes instead of stages)

---

## Step 2: Build the Mapping Table

Go stage by stage through the constraint model and determine which outcome(s) each stage maps to. There are five possible mapping types:

| Type | Meaning | Example |
|------|---------|---------|
| **1:1** | Stage maps directly to one outcome. Same scope, same work packages, same exit criteria. | S0 -> OC-01 |
| **SPLIT** | Stage maps to multiple outcomes because it contains work packages that serve different purposes or have different dependency chains. | S4 -> OC-05, OC-06, OC-07, OC-08 |
| **MERGED** | Multiple stages map to a single outcome because the outcome model treats them as one deliverable. | S7 + S8 -> OC-11 |
| **NEW** | An outcome exists in the outcome model that has no equivalent stage in the constraint model. | OC-12 (Fallback) |
| **ORPHAN** | A constraint stage exists with no outcome coverage. | (None found for Pipeline Automation) |

### How to determine the mapping type:

1. Start with the stage's work packages.
2. For each work package, find the outcome deliverable that covers the same scope.
3. If all work packages in a stage map to deliverables in a single outcome, it is **1:1**.
4. If work packages map to deliverables in different outcomes, it is **SPLIT**. Ask yourself: do these work packages serve different purposes? Do they have different dependency chains? Can one complete without the other? If yes to any, the split is justified.
5. If two or more stages' work packages all map to one outcome, it is **MERGED**. Ask yourself: does the constraint model separate these for timing reasons only, or do they genuinely serve different purposes? If it is just timing, the merge makes sense.
6. After mapping all stages, check if any outcomes have no stage source. These are **NEW**.
7. Check if any stages have no outcome coverage. These are **ORPHAN**.

---

## Step 3: Validate Shared Elements

Verify that the following elements are identical (or nearly identical) across both models. Differences here indicate a gap in one model or the other:

- **Decisions** -- same IDs, same owners, same required-by timing
- **Risks** -- same IDs, same severity, same mitigation approaches
- **Open questions** -- same IDs, same decision linkages
- **Cross-workstream dependencies** -- same CW items
- **Milestones** -- same milestone names and alignment

If something appears in one model but not the other, document it as a gap. For Pipeline Automation, both models shared all 13 decisions, all risks, all 11 questions, all 5 cross-workstream dependencies, and all milestones.

---

## Step 4: Analyze the Complications

For each non-1:1 mapping, document:

### For SPLITs:

- Which work packages went to which outcomes
- Whether the split enables parallel execution (this is usually the reason for the split)
- How status would roll up: when is the original stage "done" in terms of the new outcomes?
- Whether the split creates a reporting burden for the PM

### For MERGEs:

- Why the outcome model combined them (usually because one stage's scope is really a success criterion of another, not a separate deliverable)
- Whether leadership expects separate reporting on each merged stage
- How to report status for the individual stages using the merged outcome's data

### For NEW outcomes:

- What gap in the constraint model the new outcome addresses
- How to report on it if it triggers (since there is no stage equivalent)
- Whether it should be added to the constraint model retroactively

### For ORPHAN stages:

- What was lost and whether the outcome model needs a new outcome to cover it

---

## Step 5: Create the HTML Comparison Document

The HTML document serves as the visual artifact for leadership conversations. It should contain:

1. **Summary cards** -- headline numbers: how many stages map cleanly, how many are split, how many outcomes are new, how many stages are orphaned

2. **Mapping table** -- one row per stage showing: stage ID, stage name, mapping type (tag), outcome ID(s), outcome name(s), and mapping notes explaining the relationship

3. **Visual mapping diagram** (SVG) -- left column shows constraint stages, right column shows outcomes, connecting lines show the mapping:
   - Solid green lines for 1:1 mappings
   - Dashed orange lines for SPLITs
   - Purple lines for MERGEs
   - Red labels for NEW outcomes with no stage equivalent

4. **Key findings** -- 3 insight cards summarizing the major takeaways (what maps cleanly, what is complicated, what is low risk)

5. **Reporting translation table** -- for each stage, shows which outcome(s) provide status data and how complex the translation is

6. **Deep dive on complications** -- for each SPLIT or MERGE, a detailed breakdown of how the work packages map and what the PM needs to do differently

7. **Coverage analysis** -- two-column layout: stages fully covered by outcomes (left) and outcomes with no stage equivalent (right)

8. **Shared element verification** -- table confirming decisions, risks, questions, dependencies, and milestones are identical

### Styling

Use Dynamo brand styling from brandguide.md:

- Arial font throughout
- Header bar: #2B2B2B background, #76BE43 for brand accent
- Tables: #2B2B2B header, #F7F7F7 alternating rows, #CCCCCC borders
- Tag colors: green for 1:1, yellow/orange for SPLIT, purple for MERGED, red for NEW, gray for ORPHAN
- Callout boxes: #CCDDFF (info), #FFF3E0 (warning)

---

## Step 6: Create the Recommendation Document

The .md file provides the analysis and recommendation for leadership. Structure:

### Context paragraph

State the problem: leadership has one model, team needs another, the question is whether both can coexist.

### Three options with pros and cons:

**Option A: Keep Both Models**
- Pros: no disruption, mapping is clean, decisions/risks/milestones are shared, best of both worlds
- Cons: translation overhead (for each SPLIT), two documents to maintain, any NEW outcomes have no stage equivalent

**Option B: Outcome Model Only**
- Pros: one source of truth, exposes parallelism and iteration, handles conditional work explicitly, better for Jira
- Cons: leadership must accept a new model, client may need re-briefing, more items to track, less intuitive for executives

**Option C: Hybrid (Recommended)**
- Constraint model for client-facing artifacts (milestone reports, gate reviews)
- Outcome model for internal artifacts (sprint planning, Jira, team standups)
- PM owns the translation layer
- Rule of thumb: if the mapping has 70%+ of stages at 1:1, the hybrid works. Below that, the translation overhead may not be worth it.

### Summary comparison table

One row per evaluation criterion (leadership disruption, client disruption, translation overhead, team clarity, handles parallelism, handles iteration, handles fallback, dual maintenance, future-proof), one column per option.

---

## Step 7: Determine Whether the Mapping is Viable

Use this rubric to decide whether the hybrid approach works for a given capability:

| Condition | Viable? |
|-----------|---------|
| 70%+ of stages map 1:1 to outcomes | Yes -- hybrid works, low translation overhead |
| 50-70% of stages map 1:1 | Maybe -- depends on how complex the non-1:1 mappings are |
| Below 50% 1:1 mappings | No -- the models are too different, choose one |
| Multiple stages SPLIT into 3+ outcomes each | Risky -- aggregation burden for PM is high |
| Decisions/risks are different between models | No -- fundamental misalignment, reconcile first |
| Multiple ORPHAN stages (no outcome coverage) | No -- outcome model has gaps, fix before proceeding |

For Pipeline Automation, the result was 7 of 9 stages at 1:1 (78%), one SPLIT (S4 into 4 outcomes, manageable), one MERGE (S7+S8, cosmetic), and one NEW outcome (OC-12, safety net). This is well within the "viable" range.

---

## Adapting for Other Capabilities

When you run this process for another capability (e.g., Visibility Infrastructure, Work Management, Learning System):

1. Start with that capability's constraint model document
2. Create or reference that capability's outcome-based WSB
3. Follow Steps 1-7 above
4. The HTML and .md templates can be copied and adapted -- replace stage IDs, outcome IDs, mapping data, and findings
5. The recommendation may differ per capability -- some capabilities may have clean mappings, others may not. Let the data drive the recommendation.

---

## Files Produced for Pipeline Automation

| File | Purpose | Location |
|------|---------|----------|
| PP-Constraint-vs-Outcome-Map.html | Visual comparison with mapping table, SVG diagram, and reporting guide | Outcome Based/ |
| PP-Model-Recommendation.md | Pros/cons for three options with recommendation | Outcome Based/ |
| compare-models.md | This file -- repeatable process documentation | Outcome Based/ |
