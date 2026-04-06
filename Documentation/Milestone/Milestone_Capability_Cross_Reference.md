# DMSi Phase 2: Milestone-to-Capability Cross-Reference

## Overview

This document maps the **Milestone Outcomes** (which govern invoicing) to capability stages across all five workstreams. The goal is to identify which capability stages must be complete to satisfy each milestone's exit criteria.

**Workstreams:**
- **A:** Platform Reliability (Work Management, Visibility Infrastructure, Proactive Detection, Pipeline Automation, Learning System)
- **B:** Customer Support Operating Model
- **C:** Support & Engineering Tooling Strategy
- **D:** Strategic Visibility

---

## Cross-Reference Matrix

### M2: Early Assessment (Targeted: Month 2)

| Milestone Deliverable | Workstream | Capability | Required Stage(s) |
|----------------------|------------|------------|-------------------|
| Engineering work management and prioritization process designed and implemented | A | Work Management | Stage 3 (System Configured and Ready) through Stage 4 (Team Using the System) |
| Engineering Scorecard operational | **D** | Strategic Visibility | **Stage 1 (Engineering Scorecard Live)** |
| Baseline metrics collected | A | Visibility Infrastructure | Stage 0 (Foundation and Plan Alignment) — discovery activity against existing tooling (CheckMK, Elastic, PagerDuty); does not require new infrastructure deployment |
| Deployment mapping begun (ride-alongs) | A | Pipeline Automation | Stage 0 (Access and Process Knowledge) |
| A2W/Frameworks telemetry strategy begun | A | Visibility Infrastructure | Stage 0 (Foundation and Plan Alignment) |

**Key Changes:** Engineering Scorecard maps to Workstream D. "Expanded baseline metric data collected" renamed to "Baseline metrics collected" and re-mapped to VI Stage 0 — this is a discovery activity against existing tooling, not a new infrastructure deployment. Added "Current state documentation" and "A2W/Frameworks telemetry strategy begun." VI Stage 3 (Data Flowing from All Sources) removed from M2; it has prerequisite infrastructure dependencies that are not achievable at Month 2..

---

### M3: Foundation (Targeted: Month 4)

| Milestone Deliverable | Workstream | Capability | Required Stage(s) |
|----------------------|------------|------------|-------------------|
| Tiered service designed for top customers | **B** | Support Operating Model | **Stage 2 (Service Level Definitions Complete)** |
| Support Scorecard operational | **D** | Strategic Visibility | **Stage 2 (Support Scorecard Live)** |
| Code-as-Config pipeline built (ready to deploy) | A | Pipeline Automation | Stage 4 (Config Pipeline Operational) |
| Observability documented | A | Learning System | Stage 1 (Platform Selected & Implementation Planned) |
| Deployment mapping & documentation complete | A | Pipeline Automation | Stage 1 (Config Inventory Complete) + Stage 2 (Migration Path Defined) |
| A2W/Frameworks telemetry strategy complete | A | Visibility Infrastructure | **Stage 1 (Telemetry Strategy Validated)** |

**Key Changes:**
- Tiered service now maps to Workstream B Stage 2
- Support Scorecard maps to Workstream D Stage 2
- "Code-as-Config pipeline built" updated to reflect "(ready to deploy)" qualifier
- A2W/Frameworks telemetry strategy complete now maps to Visibility Infrastructure Stage 1 (replaces old Proactive Detection Stage 0)

---

### M4: Operationalize Intelligence (Targeted: Month 8)

| Milestone Deliverable | Workstream | Capability | Required Stage(s) |
|----------------------|------------|------------|-------------------|
| Code-as-Config operational (≥80% compliance, 4 weeks) | A | Pipeline Automation | **Stage 5 (Config-as-Code Operational)** - exact match |
| Product pods live and meeting bi-weekly | **B** | Support Operating Model | **Stage 4 (Product Pods Active) + Stage 5 (Triad Coordination Operational)** |
| Actionable Executive metrics operational | **D** | Strategic Visibility | **Stage 3 (Executive Dashboard Operational)** |
| PagerDuty AIOps configured and deployed | A | Learning System | Stage 2 (Observability Platform Operational) |
| Monitoring platform decision complete | A | Learning System | Stage 1 (Platform Selected & Implementation Planned) |
| Workstream D, Strategic Visibility, complete | **D** | Strategic Visibility | **Stage 4 (Self-Service Adoption)** |

**Key Changes:**
- Product pods now explicitly maps to Workstream B Stages 4-5
- Executive metrics maps to Workstream D Stage 3
- M4 includes explicit Workstream D completion (Stage 4)

---

### M5: Support Excellence (Targeted: Month 12)

| Milestone Deliverable | Workstream | Capability | Required Stage(s) |
|----------------------|------------|------------|-------------------|
| Customer Support operating model fully operational | **B** | Support Operating Model | **Stage 5 (Triad Coordination Operational)** |
| Monitoring operational (MTTD ≤10 min) | A | Visibility Infrastructure | **Stage 8 (Proactive Operations Capability)** |
| CI/CD pipeline built | A | Pipeline Automation | Stage 7 (CI/CD Pipeline for Application Code) |

**Key Changes:**
- Support operating model completion explicitly maps to Workstream B Stage 5
- MTTD target now maps to Visibility Infrastructure Stage 8 (replaces old Proactive Detection Stage 6); stage name "Proactive Operations Capability" is preserved in the combined model

---

### M6: Modernized Release Management (Targeted: Month 16)

| Milestone Deliverable | Workstream | Capability | Required Stage(s) |
|----------------------|------------|------------|-------------------|
| CI/CD operational (≥80% compliance, 4 weeks) | A | Pipeline Automation | Stage 7 (CI/CD Pipeline for Application Code) - operational |
| Change Failure Rate (CFR) ≤15% | A | Pipeline Automation | **Stage 8 (Development Team Adoption)** - CFR target specified |
| Scripted deployments standard | A | Pipeline Automation | Stage 8 (Development Team Adoption) |

**No changes** - Pipeline Automation structure unchanged.

---

### M7: Completion (Targeted: Month 18)

| Milestone Deliverable | Workstream | Capability | Required Stage(s) |
|----------------------|------------|------------|-------------------|
| Automated remediation deployed for top incident types | A | Learning System | Stage 6 (Continuous Improvement Cycle Operating) - tertiary question |
| DORA metrics tracked, visible, and improving | A | Learning System | Stage 5 (Error Budgets Governing Decisions) + Pipeline Automation Stage 8 |

**No changes** - Learning System structure unchanged.

---

## Combined Visibility Infrastructure Capability (Revised)

Proactive Detection has been merged into Visibility Infrastructure as a single 10-stage capability (S0–S9). The combined model covers the full arc from tool access and telemetry strategy through proactive and predictive operations.

| Stage | Name |
|-------|------|
| 0 | Foundation and Plan Alignment |
| 1 | Telemetry Strategy Validated |
| 2 | Infrastructure Monitoring Modernized |
| 3 | Data Flowing from All Sources |
| 4 | External Availability Monitoring Operational |
| 5 | Application Telemetry Operational |
| 6 | Baselines Established and Data Quality Validated |
| 7 | Alerting Tuned, Persona Views Live, and Trusted |
| 8 | Proactive Operations Capability |
| 9 | Predictive Operations and Advanced Capabilities |

**Milestone mapping for Visibility Infrastructure:**
- M2 (baseline metrics): Stage 3
- M2 (telemetry strategy begun): Stage 0
- M3 (telemetry strategy complete): Stage 1
- M5 (MTTD ≤10 min): Stage 8

---

## Workstream B/C Dependencies

The revised maps make B→C dependencies explicit:

| B Stage | C Dependency |
|---------|--------------|
| B3 (Tiered Service Framework Active) | C3 (Implementation Plan Approved) - "This is a key gate for Workstream B. Tiered service configuration (B3) and pod routing (B4) depend on knowing what tool we're configuring." |
| B4 (Product Pods Active) | C4 (Deployment Complete) - Routing logic configured in incident management system |
| B5 (Triad Coordination Operational) | C5 (Optimization Active) - AI layer, dashboards, automation |

**Critical Path:** Workstream C Stage 3 (Implementation Plan Approved) is a blocking gate for Workstream B Stages 3-4. Tool selection must happen before tiered service configuration.

---

## Gap Analysis (Revised)

### Gaps Closed by Revised Maps

1. **MTTD Target** - Now explicitly addressed in Visibility Infrastructure Stage 8: "MTTD measured and improving"

2. **Support Operating Model** - Now has explicit capability map (Workstream B) with clear stage progression

3. **Strategic Visibility** - Now a separate workstream (D) with explicit scorecard progression

4. **Proactive Detection merged into Visibility Infrastructure** - Single 10-stage capability (S0–S9) replaces two overlapping capabilities; all milestone stage references updated accordingly

### Remaining Considerations

1. **M7 Automated Remediation** - Still positioned as tertiary in Learning System ("rarely automation candidates"). Milestone framing may need alignment.

2. **Workstream C Tooling Decision** - Stage 3 is a critical gate. If 360 enhancement vs. new platform decision delays, it blocks B3/B4 configuration.

3. **Dev Team Dependencies** - Proactive Detection Stage 3 and Pipeline Automation Stages 6-8 have explicit dev team dependencies marked with asterisks.

---

## Capability Stage Requirements by Milestone (Revised)

| Milestone | Work Mgmt (A) | Visibility Infra (A) | Pipeline (A) | Learning (A) | Support Model (B) | Tooling (C) | Strategic Vis (D) |
|-----------|---------------|----------------------|--------------|--------------|-------------------|-------------|-------------------|
| M2 | Stage 4 | Stage 0 | Stage 0 | - | - | - | **Stage 1** |
| M3 | - | Stage 1 | Stage 4 | Stage 1 | **Stage 2** | - | **Stage 2** |
| M4 | - | - | **Stage 5** | Stage 1-2 | **Stage 4-5** | Stage 3+ | **Stage 3-4** |
| M5 | - | **Stage 8** | Stage 7 | - | **Stage 5** | Stage 4-5 | - |
| M6 | - | - | **Stage 8** | - | - | - | - |
| M7 | - | - | - | **Stage 6** | - | - | - |

---

## Invoicing Implications (Revised)

1. **Workstream D is M4-gated** - The milestone explicitly includes "Workstream D, Strategic Visibility, complete" as an M4 deliverable. This is a hard dependency.

2. **Workstream B/C sequencing matters** - C3 (tool decision) gates B3/B4. If tool evaluation extends, the support operating model can't be fully configured.

3. **Proactive Detection is M5-critical** - The full 6-stage progression must complete for M5's MTTD target. Stage 3 has dev team dependencies.

4. **Strong alignment maintained** - Config-as-Code 80%/4 weeks (M4→Stage 5) and CFR ≤15% (M6→Stage 8) remain verbatim matches.
