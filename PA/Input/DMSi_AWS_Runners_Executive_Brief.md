# DMSi AWS CI/CD Environment -- Executive Brief

**Date:** March 15, 2026  
**Author:** SecDevOps Architecture  
**Status:** Draft -- For Executive Decision  
**Companion To:** DMSi Self-Hosted GitHub Actions Runners Implementation Specification  

---

## What We Are Proposing

Build an automated software delivery environment in AWS. Connect it to the DMSi production servers at Tierpoint through a private, encrypted network link.

**AWS handles builds and automation. Tierpoint stays as the production environment.**

This gives DMSi a controlled, auditable, and repeatable way to deploy changes. Today, deployments are manual and depend on a single person.

---

## Why This Matters Now

| Current Reality | Business Risk |
|---|---|
| One person manages all deployments | If that person is unavailable, deployments stop |
| Infrastructure changes happen ad-hoc by individuals | Configuration differences between servers cause outages |
| 66% of engineering time is unplanned work | No capacity for improvement without automation |
| No automated testing before deployment | Bugs reach production and are found by customers |
| No audit trail for infrastructure changes | SOC 2 compliance gap |

---

## The Approach: Start Small, Prove the Pattern

The first pipeline automates nginx configuration deployments. Nginx is the web server that routes network traffic at Tierpoint.

This is low-risk, fast to build, and proves every component:

- Private network connectivity to Tierpoint.
- Automated validation before deployment.
- Human approval required before any change goes live.
- Full logging and audit trail.

Once proven, this pipeline becomes the template. All future pipelines copy its pattern. This reduces risk and speeds delivery.

**Pipeline build order after nginx:** Application builds, automated tests, application deployments, monitoring automation.

---

## Timeline

| Milestone | Target | Outcome |
|---|---|---|
| Discovery complete | Week 2 | Tierpoint network questions answered, blockers removed |
| Nginx pipeline working | Week 4 (30 days) | First automated deployment to Tierpoint proven |
| Pipelines hardened for production | Week 8 (60 days) | Security controls, audit logging, build pipelines in progress |
| Full CI/CD operational | Week 12 (90 days) | Automated builds, tests, and deployments running |

---

## Cost

| Category | Monthly Estimate |
|---|---|
| AWS infrastructure (runners, network, storage) | $827 - $1,977 |
| Budget ceiling requested | $5,000 |

Costs are low because automation servers only run during active jobs. They shut down when idle. The estimate includes room for the future monitoring platform.

**One-time cost to verify:** Progress OpenEdge may require a separate license for a build server. This needs confirmation.

---

## Staffing Reality

Two critical roles are vacant: Cloud Engineer and Monitoring/SRE.

| Current State | Risk |
|---|---|
| Dynamo provides interim cloud and SRE coverage | Work continues but depends on external contract |
| No permanent cloud or SRE staff on DMSi team | Long-term operations are not sustainable without hires |

**Recommendation:** Begin recruiting both roles immediately. Target onboarding by Week 8 so Dynamo can transfer knowledge to permanent staff.

---

## Decisions Needed

The following items require executive approval before work begins.

| Decision | Options | Impact if Delayed |
|---|---|---|
| Approve AWS budget (up to $5,000/month) | Approve / Reject | Cannot start |
| Approve private network link to Tierpoint | Approve / Reject | Cannot start |
| Approve Cloud Engineer and SRE hiring | Approve / Reject | Dynamo dependency continues indefinitely |
| Confirm Dynamo interim engagement scope | Approve / Reject | Unclear accountability during implementation |
| Approve engineering team time (12 weeks) | Approve / Reject | Cannot start |
| Confirm Progress OpenEdge build license | Approve / Reject | Application build pipelines blocked |

---

## Top Risks

| Risk | What Happens | How We Address It |
|---|---|---|
| Tierpoint delays VPN approval | Project cannot start | Begin conversations in Week 1 |
| Open roles stay unfilled | Permanent Dynamo dependency | Recruit during Phase 0 |
| Team too busy with unplanned work | No capacity for implementation | Protect dedicated time, start with small scope |
| Progress build tools need separate license | Cost increase, possible delay | Verify with Progress licensing early |

---

## What Success Looks Like

**At 30 days:** An nginx configuration change is deployed to Tierpoint through an automated pipeline with human approval and a full audit log.

**At 90 days:** Application code builds automatically on every change. Tests run on every pull request. Deployments to Tierpoint require approval but execute automatically. All activity is logged and SOC 2 auditable. Monthly AWS cost is under $5,000.

---

## Key Terms

| Term | Plain Language |
|---|---|
| CI/CD | Automating the build, test, and deploy process |
| Self-hosted runner | A server DMSi owns that executes automation jobs |
| VPN | An encrypted private connection between two locations |
| Nginx | A web server that routes network traffic |
| SOC 2 | A security standard for protecting customer data |
| Reference pipeline | The first pipeline, used as a template for all others |

---

*Full technical details are in the companion document: DMSi Self-Hosted GitHub Actions Runners Implementation Specification.*
