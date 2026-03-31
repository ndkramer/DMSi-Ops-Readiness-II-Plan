# DMSi Engagement: What We Have Learned
**March 2026 | For Steering Committee Use**

The following captures the significant findings that have shaped our understanding of the DMSi environment and the engagement itself. These are not status updates. They are the things we did not fully know at the start that now inform how we are sequencing the work.

---

## Technical: What We Found Inside the Environment

**The immediate pain is not the software. It is the environment around it.**

The most consequential finding from early discovery is that the incidents driving the most customer impact have been caused by misconfigurations and configuration drift in the runtime environment: database parameters, app server settings, NGINX configuration, reporting server settings, and integration parameters. Bryan and Andy estimated that environment configuration problems account for 70 to 80 percent of the operational noise engineering deals with daily. This finding directly reshaped the Pipeline Automation scope to prioritize customer environment configuration earlier in the sequence, rather than treating tooling configuration as the first target. Contributing factors include the absence of a post-deployment review process, lack of automated change release best practices, use of shared service accounts, and no systematic linking of change requests to deployment and incident IDs. *(Source: WSA Pipeline Automation Planning Session — Bryan and Andy)*

Real examples: a reporting server configured for 10 parallel reports kept reverting to a default of 2 with no explanation, impacting customers. An NGINX typo during an environment setup went unnoticed until a reboot, breaking all APIs for that customer. These are not edge cases. They are the pattern. *(Source: WSA Pipeline Automation Planning Session)*

**The monitoring system was amplifying the outages it was supposed to catch.**

A significant discovery is that DMSi's existing monitoring configuration may be contributing to incidents rather than purely detecting them. Intensive post-incident database queries triggered by monitoring may amplify the very outages engineering is trying to resolve. This is a dynamic that warrants further exploration — tooling like Dynatrace can identify offending scripts and help confirm or rule out the pattern. It is important to note that this has not yet been proven; significant monitoring analysis and root cause investigation has not been completed. Alert rationalization remains a prerequisite for additional monitoring layers regardless of this finding's outcome. *(Source: WSA Visibility Infrastructure Planning Session)*

**Lack of server access is a recurring blocker on delivery.**

A meaningful number of stalled work items trace back to the Dynamo team not having direct server access. This forces reliance on DMSi team members to provide hands-on assistance, introducing scheduling dependencies and delays that compound across workstreams. This is not a capability gap on either side; it is a structural access constraint that needs to be resolved to maintain delivery velocity.

---

## Delivery: What We Learned About How to Run This Engagement

**Discovery conversations materially changed the plan before execution began.**

The original Pipeline Automation scope targeted engineering tooling configuration as the first priority. Conversations with Bryan and Andy surfaced that the real leverage point was customer runtime environments, which carry ten times the impact. This is a direct illustration of why discovery matters: the highest-value work was not visible from the outside. Scope changes made before work begins are cheap. Scope changes made mid-execution are expensive. 

**Milestone outcomes were defined before the constraint model and capability map existed. This created gaps between what was promised and what is achievable on the original timeline.**

Several M2 deliverables have proven more difficult to achieve than the original milestone framing suggested. This is not a failure of execution; it reflects a sequencing reality common to complex engagements: milestones were written before the full picture of constraints, dependencies, and internal resource availability was visible. Three examples illustrate the pattern.

*Engineering work management and prioritization:* The original milestone did not account for the configuration changes required in ConnectWise 360. Because 360 is an internal DMSi product, modifications require DMSi internal resources and must compete for prioritization against other DMSi efforts. Dynamo has passed requirements to DMSi and is awaiting prioritization. A decision is expected by April 1.


*Expanded baseline metric data collected:* It wa s originally thought determined that data collection depended on system access to Elastic, CheckMK, and other monitoring tools. When that was thought to be impossible due to access, a significant manual data collection was required.  This is a direct instance of the server access constraint documented separately in the Technical section of this brief.

*Engineering Scorecard operational:* The scorecard requires live monitoring data or as its input specifically, PagerDuty Stage 1 data flowing and stable. This dependency was not documented in the original milestone plan. The path to getting this deliverable back on track runs through PagerDuty Stage 1 completion, which is actively in progress.

The through-line across all three: dependencies on internal DMSi resources, tooling access, and prerequisite data flows were not fully visible when the milestone language was written. The engagement is now operating from a more grounded constraint model, which improves sequencing precision going forward.


**Some decisions require deliberation. Treating them like routine choices creates risk.**

The Dynatrace deployment model (SaaS vs. Managed) is an example of a decision that is difficult to reverse once made. Its implications touch OpenEdge compatibility, data residency, cost structure, and long-term observability strategy. The engagement is designed to give this decision the analysis it requires before committing. The failure mode to avoid is making this choice under time pressure before the relevant constraints are fully understood. *(Source: Decision Log D-01; WSA Visibility Infrastructure Planning Session)*

**Stabilization must come before scaling. Complexity added to an unstable foundation does not stick.**

The sequencing of the engagement is deliberate. Alert rationalization before monitoring expansion. Config-as-code for the highest-pain environments before tackling the full scope. Visibility infrastructure before CI/CD automation. This order was not arbitrary. It reflects a consistent pattern: improvements layered onto an environment still generating 584+ weekly alerts and consuming 70 percent of engineering capacity in reactive work are absorbed by the noise before they can take hold. *(Source: Current State Assessment, November 2025; Root Cause Analysis, November 2025)*


**Communication channels between Dynamo and DMSi have been too narrow, and governance has not been formally implemented.**

Early in the engagement, communication was limited to a small number of individuals on each side, creating bottlenecks that slowed information flow, delayed decisions, and prevented the Dynamo team from building the broader working relationships needed to execute across workstreams. The Dynamo team has only recently begun establishing direct working relationships with their DMSi counterparts at the capability level.

A governance structure was established at the start of the engagement but was never formally implemented. The Sprint Demo cadence has since been introduced and is a step in the right direction. It is recommended that a formalized planning cadence be established across both teams, with clear expectations, defined deliverable accountability, and consistent governance touchpoints. This will reduce dependence on individual communication paths and create a more resilient delivery structure as the engagement scales into later milestones.

---

*Dynamo Confidential | For Steering Committee Use*
