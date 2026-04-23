DMSi Pipeline Automation for Configuration

## About This Document

This is the detail companion to the Pipeline Automation for Configuration overview. The overview sets out the six-step plan, the access and information needed from DMSi, the decisions ahead, and next steps. This document provides the supporting detail: current state, why this matters in operational terms, the capability end to end, what changes for DMSi people, the full step-by-step plan with door types and stop conditions, and what comes after config as code.

## Where We Are Today

The PoC is a self-hosted runner on EC2, a second EC2 instance running NGINX, an Ansible playbook with a Jinja2 template, GitHub Actions wiring it together, and Terraform state in S3. Push to main rehydrates and applies. No SSH, no manual edits.

The PoC keeps runner and target both in AWS for simplicity. Production will not. DMSi hosts primarily on Tierpoint VMs, with other environments possible. The runner stays in AWS; targets live where they live; the runner reaches them through DMSi's existing Cloudflare connectivity layer. This is a new architectural dependency that the plan makes real in Step 1 and that DMSi's Cloudflare administrator needs to be aligned with early.

The PoC proves the pattern works. It does not yet prove DMSi has solved configuration drift. Drift control is a property of coverage, not mechanism. One application on the pipeline is not coverage. That is Step 2. Once the first DMSi NGINX environment is on the pipeline, additional environments come from new variable sets, not new pipelines.

## Why This Matters to DMSi: Three Operational Realities

**Configuration is one of the meaningful sources of pain.** Among the issues generating customer escalations and engineering toil are misconfigurations that happen during deployment, during maintenance, or silently between changes. Engineering leadership's estimate is that automating customer runtime environment configuration could resolve a meaningful share of the noise and pain engineering currently absorbs. That is the capacity that gets returned to product development, to A2W readiness, and to work that moves the business. Other sources of pain (architectural, application-level, customer-specific) are not addressed by this plan and remain on the table for separate work.

**The current deployment model is not auditable.** Configuration for customer environments today lives on a local network drive. There is no version control, no history, no reliable way to answer "what changed and when." When a reporting server silently reverts from ten parallel reports to two, nobody can explain how or when. When an NGINX typo takes down an environment after a reboot, the first evidence is the outage. The pipeline changes this. Every config change becomes a pull request with a reviewer, a history, and a diff.

**The concentration risk is material.** Today, deployments depend on specific individuals who carry the process in their heads or in personal notes. A single person owns NGINX deployment. A single person owns PASO provisioning. That pattern has kept DMSi running, but it means a single departure, a single vacation during an outage, or a single transcription error can become a customer incident. Pipeline automation turns that process into code. The knowledge moves from people to a system that can be reviewed, tested, and handed off.

None of this is theoretical. The examples have been happening in production and generating escalations. The question this plan answers is how DMSi gets from where it is today to a state where they cannot happen.

## The Capability, End to End

Before the stepwise plan, the shape of config as code when complete.

Every applicable DMSi application is deployed and configured through GitHub Actions, using Ansible playbooks parameterized by environment. Configuration lives in version control. Every change is a pull request with review. Drift is detected automatically because the pipeline runs in check mode on a schedule. Human admin access to production is reserved for named individuals whose roles require it, most commonly incident response. Break-glass exists, is documented, and is audited. Pipeline service accounts become the default path for production configuration change.

Getting there is a multi-quarter build, not a single project. It requires three kinds of work running in parallel: technical (the pipeline extending to new applications), organizational (the access policy change that completes the model), and behavioral (DMSi operators changing how they interact with production).

The plan below sequences those three tracks. It is designed so that each step produces a real operational benefit even if the next step never happens. None of the steps create technical debt that later steps are required to pay down.

Application code pipeline automation is the follow-on initiative. It uses the same foundation this plan builds.

## What Changes for Your People

This plan is a technical sequence, but the capability it builds requires behavioral change from the people who operate DMSi's environments. That change is the part most likely to go wrong if it is not planned for explicitly.

**Engineers who deploy configuration today.** The day-to-day change is that SSH to production for configuration changes goes away. Changes go through the repository. For engineers comfortable in their current workflow, this is friction before it becomes relief. Dynamo will partner on enablement: the first engineers onto the pipeline are supported hands-on, and the process is documented as they go so later adopters follow a proven path rather than inventing one.

**Engineering managers.** The oversight model changes. Instead of trusting individuals to hold the process in their heads, managers get a system they can inspect. Who changed what, when, reviewed by whom. This is an upgrade in visibility and also an upgrade in the expectation that oversight is used.

**Incident responders.** The retained-admin conversation in Step 6 is most consequential for this group. People who need real operational reach during incidents will keep it. The plan does not break incident response. It formalizes who has that reach and why.

**Operators outside engineering.** People who touch production for reasons other than engineering (for example, support making configuration adjustments for individual customers) need their workflows reviewed. Some move into the pipeline. Some become retained-admin. Some become break-glass cases. This is scoped as part of Step 3 and confirmed in Step 6.

The behavioral change is real but not large for most people. The discipline is that direct production configuration change becomes the exception, not the default. That is the cultural commitment that makes the technical plan worth executing.

## The Plan

### Step 1: Apply the Pipeline to DMSi NGINX Deployments

The PoC runs entirely in AWS. Step 1 moves the target side onto a DMSi NGINX environment (typically Tierpoint), keeps the runner in AWS, connects them through Cloudflare, and hardens the pipeline in parallel.

**Prerequisite:** The permissions in row 1 of "What Dynamo Needs from DMSi" in the overview document, including the Cloudflare Access policy.

**What happens:**

  - Identify the first DMSi NGINX environment to onboard. Non-production is the right starting point. Confirm it is reachable through Cloudflare today; if not, getting it there is a prerequisite.

  - Establish the runner identity in Cloudflare Access, scope it to the first target, and validate end-to-end reach before doing anything else.

  - Store the environment's NGINX configuration in the pipeline repository, organized so additional environments add as variable sets, not pipeline forks.

  - Harden the pipeline in parallel with onboarding, not after: branch protections and required reviews on main, CI lint and template-render validation on PRs, a non-prod staging path before production.

  - Move runner registration, Cloudflare Access token rotation, and on-target credential handling out of the PoC's manual steps into a documented operational pattern.

Once the first NGINX environment is running, additional ones are additive: new variable set, same Cloudflare Access pattern extended to the new target, merge.

**Door type:** 2-way.

**Effort:** Days to bring the first environment online once permissions and Cloudflare Access are in place; hardening runs alongside onboarding, not after it.

**Stop condition:** If adapting the PoC surfaces pattern-level problems (not configuration details), pause and revisit the PoC design.

### Step 2: Prove the Pipeline Controls Configuration Drift

Step 1 puts the pipeline in real use. Step 2 proves it works. Step 2 runs in parallel with Step 3.

A 30 to 60 day window starts once the first NGINX environment is on the pipeline. During the window:

  - All changes to managed NGINX hosts go through the pipeline. Zero SSH, zero manual edits.

  - A scheduled workflow runs Ansible in check mode daily and reports drift.

  - Every drift event is investigated. Either the change was made outside the pipeline (the failure we are hunting), or the pipeline is not authoritative.

**Proven looks like:** documented count of drift events with root cause; documented count of pipeline-applied changes; clear answer to whether the pipeline kept the hosts consistent.

The Implementation Options document records 30 to 45 minutes per engineer per week on manual drift checks plus 10 minutes per week reconciling unauthorized changes. Step 2's proof is what justifies eliminating that work for any future application. It is also a prerequisite for Step 6: until the pipeline is demonstrably authoritative, tightening human admin access is premature.

**Door type:** 2-way.

**Effort:** Small to set up, mostly elapsed time during the window. Engineering leadership is engaged on Step 3 during the same period so the window is not idle.

**Stop condition:** If at the end of the window the pipeline is not demonstrably authoritative, do not move to Step 4. Step 3 classification can remain on the shelf while the gap is fixed; the work is not lost.

### Step 3: Review and Classify DMSi's Applications

Step 3 runs in parallel with Step 2. The classification work does not depend on Step 2's evidence to produce a useful artifact; it depends on the application list and engineering leadership's attention.

**Prerequisite:** The application list in row 2 of "What Dynamo Needs from DMSi" in the overview document, provided two to three weeks into the Step 2 window.

**Output:** a classified inventory. The session adds, for each application:

  - Configuration change frequency (more or less than quarterly).

  - History of drift-related incidents or audit findings.

  - Reachability from the AWS runner through Cloudflare today, with a new policy, or not at all.

  - Whether the application is applicable to the pipeline at all. Some are legitimately excluded (hardware-bound, tightly licensed, outside Cloudflare's reach where integration cost exceeds benefit). Exclusions are documented with reason.

**Working classification:**

| Class | Description                                                                                                                    | Why it matters for sequencing                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| A     | Configuration-managed infrastructure (web servers, proxies, DNS, monitoring agents, firewall rules). Same shape as NGINX.      | Lowest effort. Pattern proven. New role, new template, runner pattern, Cloudflare Access policy extension.  |
| B     | Internal tooling and supporting services (dashboards, batch jobs, integration glue, container images).                         | Moderate. Often adds a build step before deployment.                                                        |
| C     | Customer-facing or revenue-adjacent applications outside OpenEdge (portals, marketing sites, API gateways, reporting).         | Highest value, highest risk. Needs approval gates and rollback discipline. Often already behind Cloudflare. |
| D     | Platform-constrained applications: OpenEdge, other licensed enterprise software, hardware-bound or outside Cloudflare's reach. | Often a dedicated runner. Some Class D systems may be excluded entirely, with reason documented.            |

The classification is a working framework. Final assignments and exclusions are confirmed in the working session.

**Door type:** 2-way.

**Effort:** With the list provided ahead of time, approximately 90 minutes plus follow-up. Without it, substantially longer.

**Stop condition:** If the inventory shows fewer than three applications worth onboarding, scope Step 4 accordingly.

### Step 4: Prioritize, Sequence, and Onboard

Step 3 produces the list. Step 4 puts it in order and starts onboarding.

**Prerequisite:** Step 2 validation complete. Step 4 does not begin until the pipeline is demonstrably authoritative. Onboarding can start with the first two or three Class A applications from Step 3 while the rest of the inventory is still being classified; the working session does not have to produce a complete inventory before the first onboarding begins.

**Ongoing prerequisite:** Configuration files and per-application access in row 3 of "What Dynamo Needs from DMSi" in the overview document. Onboarding stalls if either is missing.

**Criteria:**

1.  **Adaptation effort.** Class A next, Class B as the pipeline matures, Class C only after lower-risk applications validate the pattern. Class D case-by-case; OpenEdge handled separately under the Implementation Options plan.

2.  **Existing pain.** Applications that have caused drift-related incidents or audit findings jump the queue regardless of class.

3.  **Reuse leverage.** Group applications that can share a role, template, runner pool, or Cloudflare Access pattern.

4.  **Capacity.** Per the Implementation Options document, approximately 33 percent of engineering time is available for planned work. One application per OpenEdge cycle (8 to 10 weeks) is sustainable. Faster only if Step 2's proof is strong and applications share patterns. This assumption is sanity-checked in the Step 3 working session against current engineering load.

The sequence is set in the working session against the inventory.

| Cadence band                         | Capacity assumption                                        | Applications onboarded |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------- |
| First 90 days after Step 2 validates | One Class A application                                    | 1                      |
| Days 90 to 270                       | One per OpenEdge deployment cycle                          | 2 to 3                 |
| After Day 270                        | Class C as Option 2/3 patterns from the OpenEdge plan land | Variable               |

**Door type:** Per-application. Class A and B are 2-way. Class C is closer to 1-way (customer-facing applications develop pipeline dependencies that are expensive to unwind). This is why C waits.

**Effort:** Per-application, governed by class. Assumes timely provision of configuration files, Cloudflare Access policy extension, and on-target credentials.

**Stop condition:** If pipeline maintenance overhead approaches the time saved on drift checks, the platform is not earning its keep. Pause and consolidate.

### Step 5: Apply Least-Privilege Access as Applications Are Onboarded

Steps 1 through 4 grow the pipeline's reach. Step 5 ensures that reach is scoped tightly so the pipeline does not become a single high-privilege automation surface. This step runs alongside Step 4, not after. Every application gets least-privilege scoping at onboarding. Retrofitting later is harder.

**Four layers:**

5.  **AWS IAM** for runner and pipeline. Dedicated roles per pipeline or per application; only the AWS actions that pipeline needs; no wildcards. Terraform state access is similarly scoped.

6.  **Cloudflare Access policies** scoped per application. The runner identity is granted only the targets it needs for each application. A pipeline managing application X cannot reach application Y's hosts. Cross-application blast radius is bounded at the connectivity layer.

7.  **Per-application service accounts on target hosts.** Each pipeline uses a dedicated account on the target with permissions limited to that application's files, services, and configuration. Combined with layer 2, blast radius is bounded both in connectivity and in privilege.

8.  **Secrets handling.** Per Implementation Options Step 18: secrets never hardcoded; Vault passwords from a secrets manager. Implemented for every application onboarded under Step 4. Choice of secrets manager is a prerequisite decision.

**Door type:** 2-way. Choice of secrets manager is closer to 1-way once integrations are written.

**Effort:** Modest per-application addition to Step 4 work, plus one-time setup for the secrets manager, IAM scoping pattern, and Cloudflare Access policy template.

**Stop condition:** If a specific application cannot be brought under least-privilege without breaking it, surface it as a finding rather than abandoning the principle for that application.

### Step 6: Tighten Human Admin Access to Production Environments

Once the applicable DMSi systems are migrated under Steps 4 and 5, the pipeline is the default path for production configuration change. Step 6 recognizes that in policy: human admin access is tightened, removed for most staff and service accounts. Pipeline service accounts become the primary path.

The cutover is sequenced last on purpose. Tightening access before the pipeline can carry the operational load would break operations. Waiting until migration is complete means the pipeline is proven and the policy recognizes a reality rather than forcing one.

Step 6 preparation runs during Step 4. Retained-admin role definition, break-glass procedure design, staff notification planning, and monitoring setup are drafted while applications are being onboarded. This compresses the cutover from a months-long project at the end into a concentrated execution once migration clears.

**What changes at cutover:**

  - Admin access removed from staff and service accounts that do not require it. Applies across hosting environments and across access paths, including direct host access and Cloudflare Access policies that grant administrative reach.

  - Certain individuals retain admin access where their role requires it. Incident response is the clearest example: incident responders need a real operational path, not break-glass. Specific retained-admin roles and named individuals are defined by engineering leadership before cutover.

  - Break-glass exists for staff who do not normally have admin but need it in a defined emergency. Documented, audited, time-bounded. Cloudflare Access supports just-in-time policy elevation that fits this pattern.

  - Monitoring detects admin-level actions on production hosts and distinguishes pipeline service account actions (expected), retained-admin actions by named individuals (expected, attributable), and break-glass invocations (expected, logged, reviewed). Anything else is an alert.

  - Staff losing access are notified ahead of the change with time to surface workflows that depend on admin. Those workflows either move into the pipeline, move to retained-admin with justification, or become break-glass cases.

**Scope:** Production environments for migrated applications. Non-production (dev, test) retains human admin access for productivity. Excluded applications (per Step 3) are out of scope.

**Why "applicable DMSi systems" is the trigger:** Waiting for migration completion means one coherent cutover instead of staff operating under two simultaneous regimes for an extended period.

**Door type:** 1-way per environment. Individual retained-admin assignments can be reviewed; the policy itself is a standing commitment, and restoring broad admin access would be a security regression.

**Effort:** Preparation work draftable during Step 4 so the cutover itself is concentrated. Per-environment cutover windows.

**Stop condition:** If break-glass is invoked above an agreed threshold, or if the retained-admin list grows beyond what engineering leadership considers reasonable, the policy is not matching reality. Pause further cutovers and revisit pipeline coverage gaps.

## What DMSi Gets at Each Step

| Step | Operational outcome                                                                                                                                                                                                                                                                             | Evidence produced                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | DMSi NGINX configurations managed through code rather than manual SSH. New NGINX environments come from variable sets, not new manual provisioning.                                                                                                                                             | Working pipeline against real DMSi infrastructure. Documented Cloudflare Access policy for the runner.                       |
| 2    | Documented proof that pipeline-managed NGINX environments stay in their intended state.                                                                                                                                                                                                         | Drift report covering a defined window.                                                                                      |
| 3    | Classified inventory of DMSi applications. Applicable applications distinguished from excluded. Hosting environment and Cloudflare reachability captured per application.                                                                                                                       | The classified inventory, owned by engineering leadership.                                                                   |
| 4    | Applications onboarded in sequence at a sustainable cadence. Manual drift-check time eliminated per onboarded application.                                                                                                                                                                      | Per-application pipeline. DORA metrics where applicable.                                                                     |
| 5    | Every onboarded application operates under least-privilege service accounts, scoped IAM, and scoped Cloudflare Access policies from day one.                                                                                                                                                    | IAM policies, Cloudflare Access policy map, service account map, secrets manager integration.                                |
| 6    | Human admin access tightened to those whose roles require it, across all hosting environments and access paths under the pipeline. Pipeline service accounts become the default path for production configuration change. Drift from human sources outside the retained-admin set cannot occur. | Policy document, retained-admin list, break-glass procedure, monitoring across host audit trails and Cloudflare Access logs. |

## What Comes After Config as Code

Config as code is the intermediate goal of this plan. The follow-on initiative is pipeline automation for application code: using the same GitHub Actions, the same runner pool, the same Cloudflare connectivity layer, and the same operational patterns to build, test, and deploy application binaries rather than just configuration.

That work is known and sequenced after this one. The infrastructure Steps 1, 5, and much of Step 6 establish is intentionally built to carry both. Specifically:

  - The runner pool pattern in Step 1 scales to additional workload types.

  - The Cloudflare Access policy structure chosen in Step 4 accommodates application code deployment targets.

  - The least-privilege scoping in Step 5 extends to application deployment service accounts.

  - The admin access model in Step 6 already assumes pipeline service accounts are the default path for all production change, configuration and code alike.

OpenEdge, detailed in the Implementation Options document, is the major application code stream. Others follow from the Step 3 classifications. Naming this here so the config as code investment is understood as the foundation it is.
