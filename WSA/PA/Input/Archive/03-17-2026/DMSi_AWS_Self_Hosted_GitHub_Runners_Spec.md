# DMSi Self-Hosted GitHub Actions Runners in AWS

## Implementation Specification

**Document Version:** 1.0  
**Date:** March 12, 2026  
**Author:** SecDevOps Architecture  
**Status:** Draft -- Pending Executive Approval  
**Classification:** Internal -- DMSi Engineering  

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Business Case](#2-business-case)
3. [Current State](#3-current-state)
4. [Target Architecture](#4-target-architecture)
5. [Network Connectivity](#5-network-connectivity)
6. [Security and Compliance](#6-security-and-compliance)
7. [Runner Configuration](#7-runner-configuration)
8. [Workload Definitions](#8-workload-definitions)
9. [Monitoring Infrastructure](#9-monitoring-infrastructure)
10. [Implementation Phases](#10-implementation-phases)
11. [Cost Estimates](#11-cost-estimates)
12. [Risk Register](#12-risk-register)
13. [Staffing Requirements](#13-staffing-requirements)
14. [Approval and Governance](#14-approval-and-governance)
15. [Success Criteria](#15-success-criteria)
16. [Appendices](#16-appendices)

---

## 1. Purpose

This document defines the plan to build a CI/CD environment in AWS.

The AWS environment will host self-hosted GitHub Actions runners. These runners will automate builds, tests, and deployments. The runners must communicate with DMSi servers at Tierpoint.

**Two environments will exist with distinct roles:**

| Environment | Role | Description |
|---|---|---|
| AWS | Build and Automation | Hosts runners, monitoring, and automation tools |
| Tierpoint | Operations | Hosts production DMSi Agility platform and databases |

This separation keeps production operations stable. Build and automation workloads run in AWS. Deployments to Tierpoint are controlled and auditable.

---

## 2. Business Case

### 2.1 Problem Statement

DMSi has three distinct deployment patterns today:

| Deployment Type | Frequency | Process |
|---|---|---|
| Major application releases | Every 8-12 weeks | Weekend maintenance windows, phased rollout |
| Application fix updates | Bi-weekly or more often as needed | Scheduled but reactive to bug reports |
| Infrastructure changes | Ad-hoc, driven by unplanned work | Manual, often one-off changes by individuals |

*Sources: DMSi Agility Platform Performance Analysis (Section 1.4), bryan-and-brent-conversation meeting notes.*

A single person manages the deployment process. This creates a single point of failure.

The engineering team spends 66% of its time on unplanned work. Only 33% of work is planned engineering effort. There is no automated build or test pipeline today.

### 2.2 What This Solves

| Problem | How This Plan Addresses It |
|---|---|
| Infrequent deployments | Automated pipelines enable more frequent, smaller releases |
| Manual deployment process | Runners execute repeatable, scripted deployments |
| Single point of failure (deployment) | Pipeline code is version-controlled and shared |
| No automated testing | Runners execute test suites on every code change |
| No build verification | Automated builds catch errors before deployment |
| Reactive operations | Monitoring in AWS enables earlier detection of issues |

### 2.3 What This Does Not Solve

This plan does not change the DMSi Agility application architecture. The Progress OpenEdge database constraints remain. Blue-green deployments are not possible with shared memory architecture. Zero-downtime deployments require application changes beyond this scope.

### 2.4 Pipeline Strategy: Start Small, Build the Pattern

This plan uses a phased approach to pipeline development. The first pipeline will deploy nginx configuration changes to Tierpoint. Nginx is a web server that handles network traffic routing.

This first pipeline is the **reference pipeline**. It proves the full path from code change to production deployment. It validates the VPN, runner, secrets, approvals, and logging. Once proven, it becomes the reusable template for all future pipelines.

**Pipeline Build Order:**

| Order | Pipeline | Depends On |
|---|---|---|
| 1 | Nginx configuration deployment (reference pipeline) | VPN, runner, secrets, approval gates |
| 2 | Progress OpenEdge builds | Reference pipeline pattern + Windows runner |
| 3 | Web application builds (A2W) | Reference pipeline pattern + build tooling |
| 4 | Automated test execution | Build pipelines |
| 5 | Infrastructure as Code (AWS) | Reference pipeline pattern |
| 6 | Monitoring automation | Reference pipeline pattern + platform selection |

Each new pipeline reuses the patterns proven in the nginx pipeline. This reduces risk and speeds delivery of later pipelines.

### 2.5 Expected Outcomes (90-Day Target)

- Nginx configuration pipeline fully operational (reference pipeline).
- Reference pipeline pattern documented and reusable.
- Secure private network between AWS and Tierpoint.
- Ephemeral runners operational with auto-scaling.
- Foundation for monitoring infrastructure in AWS.
- Progress OpenEdge and A2W build pipelines in progress.

---

## 3. Current State

### 3.1 GitHub Environment

- **Plan:** GitHub Enterprise Cloud.
- **Organization:** Existing organization with active repositories.
- **Actions Usage:** Limited. Current workflows update PagerDuty only.
- **Self-Hosted Runners:** None. All existing actions use GitHub-hosted runners.
- **Tierpoint Connectivity:** None from GitHub Actions today.

### 3.2 AWS Environment

- **Account Status:** Exists but mostly unused.
- **VPC:** Needs to be created or verified.
- **Private Connectivity to Tierpoint:** Does not exist. Must be established.
- **Services in Use:** Minimal. No production workloads.

### 3.3 Tierpoint Environment

- **Operating Systems:** Mix of Windows Server and Linux.
- **Platform:** DMSi Agility on Progress OpenEdge.
- **Delivery:** Users connect through Remote Desktop Protocol (RDP).
- **Database:** Multi-terabyte Progress OpenEdge with shared memory.
- **User Base:** 24,519+ active users (growing 18.6% annually).

### 3.4 Engineering Team

| Role | Person | Notes |
|---|---|---|
| Engineering Manager | Bryan Melvin | Incident ownership, strategic planning |
| Hosting Team Manager | Andy | Server and software management |
| Deployment Specialist | Callie | Release automation (single point of failure) |
| Monitoring / SRE | **Open Position** | Dynamo providing interim coverage |
| Progress Engineers | 4 engineers | Database maintenance, troubleshooting |
| Cloud Engineer | **Open Position** | Dynamo providing interim coverage |

**Key Constraint:** Two critical roles are currently vacant: Monitoring/SRE and Cloud Engineer. Dynamo is providing interim capabilities for both. Long-term hires for both positions are needed to sustain this plan.

---

## 4. Target Architecture

### 4.1 Architecture Overview

```
+--------------------------------------------+
|              GitHub Enterprise Cloud        |
|  +----------+  +----------+  +----------+  |
|  | Repo: IaC|  | Repo:    |  | Repo:    |  |
|  | Terraform|  | App Code |  | Monitor  |  |
|  +----+-----+  +----+-----+  +----+-----+  |
|       |              |              |        |
|       +------+-------+------+-------+       |
|              |              |                |
|         Workflow Triggers                    |
+------------- | ------------ | ---------------+
               |              |
+------------- v ------------ v ---------------+
|              AWS Account                      |
|  +------------------------------------------+|
|  |           VPC (Private)                   ||
|  |  +----------------+  +----------------+   ||
|  |  | Runner Subnet  |  | Monitor Subnet |   ||
|  |  | (Private)      |  | (Private)      |   ||
|  |  |                |  |                |   ||
|  |  | - Linux Runner |  | - Monitoring   |   ||
|  |  | - Windows      |  |   Platform     |   ||
|  |  |   Runner       |  | - Log Storage  |   ||
|  |  | - Runner       |  |                |   ||
|  |  |   Manager      |  |                |   ||
|  |  +-------+--------+  +-------+--------+   ||
|  |          |                    |            ||
|  |          +--------+-----------+            ||
|  |                   |                        ||
|  +------------------------------------------+||
|                      |                        |
|              Site-to-Site VPN                 |
|              or AWS Direct Connect            |
+----------------------|------------------------+
                       |
+----------------------v------------------------+
|             Tierpoint Data Center              |
|  +------------------------------------------+ |
|  |         DMSi Production Network           | |
|  |  +----------------+  +----------------+   | |
|  |  | Windows Servers|  | Linux Servers  |   | |
|  |  | (Agility, RDP) |  | (Services)     |   | |
|  |  +----------------+  +----------------+   | |
|  |  +----------------+                       | |
|  |  | Progress       |                       | |
|  |  | OpenEdge DB    |                       | |
|  |  +----------------+                       | |
|  +------------------------------------------+ |
+------------------------------------------------+
```

### 4.2 Design Principles

1. **Least Privilege.** Runners access only what they need.
2. **Private Networking Only.** No public internet paths to Tierpoint.
3. **Separation of Concerns.** AWS builds. Tierpoint operates.
4. **Runners Are Disposable.** Runners are replaced, not repaired.
5. **Everything as Code.** All infrastructure is version-controlled.
6. **Audit Everything.** All actions are logged and traceable.

---

## 5. Network Connectivity

### 5.1 Decision Required: VPN vs. Direct Connect

Private network connectivity between AWS and Tierpoint does not exist today. This is the first item to resolve. Two options are available.

**Option A: AWS Site-to-Site VPN**

| Attribute | Detail |
|---|---|
| Setup Time | 1-2 weeks |
| Monthly Cost | ~$36/month per VPN connection |
| Bandwidth | Up to 1.25 Gbps per tunnel |
| Encryption | IPSec with AES-256 |
| Redundancy | Two tunnels per connection (active/standby) |
| Requires at Tierpoint | VPN-capable firewall or router |

**Option B: AWS Direct Connect**

| Attribute | Detail |
|---|---|
| Setup Time | 4-8 weeks (carrier provisioning) |
| Monthly Cost | $200-$600/month for 1 Gbps port |
| Bandwidth | 1 Gbps or 10 Gbps dedicated |
| Encryption | Optional (MACsec or VPN overlay) |
| Redundancy | Requires two connections for failover |
| Requires at Tierpoint | Cross-connect at Tierpoint facility |

**Recommendation:** Start with Site-to-Site VPN for the proof of concept. The VPN is faster to set up and cheaper. It meets the bandwidth needs for CI/CD traffic. Evaluate Direct Connect later if bandwidth demands grow.

### 5.2 Action Required: Tierpoint Network Discovery

Before connectivity can be established, the following must be determined:

- [ ] What firewall or router does Tierpoint expose for VPN termination?
- [ ] What IP address ranges are used at Tierpoint?
- [ ] Are there existing firewall rules restricting inbound connections?
- [ ] Does DMSi's Tierpoint contract allow VPN connections to AWS?
- [ ] Who at Tierpoint is the network operations contact?

**This is a blocker.** No work on VPN setup can begin until these questions are answered.

### 5.3 AWS VPC Design

| Component | CIDR Range | Purpose |
|---|---|---|
| VPC | 10.100.0.0/16 | AWS CI/CD environment |
| Runner Subnet (Private) | 10.100.1.0/24 | GitHub Actions runners |
| Monitoring Subnet (Private) | 10.100.2.0/24 | Monitoring platform |
| Management Subnet (Private) | 10.100.3.0/24 | Bastion host and admin access |

**Note:** CIDR ranges must not overlap with Tierpoint IP ranges. The Tierpoint IP ranges must be confirmed before finalizing this design.

### 5.4 Firewall Rules (AWS to Tierpoint)

Only specific traffic will be permitted across the VPN.

| Source | Destination | Port | Protocol | Purpose |
|---|---|---|---|---|
| Runner Subnet | Tierpoint Deploy Targets | 22 | TCP | SSH for Linux deployments |
| Runner Subnet | Tierpoint Deploy Targets | 5986 | TCP | WinRM for Windows deployments |
| Runner Subnet | Tierpoint Deploy Targets | 443 | TCP | HTTPS for API-based deployments |
| Monitoring Subnet | Tierpoint Monitored Hosts | 443 | TCP | Monitoring agent communication |
| Monitoring Subnet | Tierpoint Monitored Hosts | 6556 | TCP | CheckMK agent (if selected) |
| Monitoring Subnet | Tierpoint Monitored Hosts | 9090 | TCP | Prometheus metrics (if selected) |

All other traffic between subnets is denied by default.

### 5.5 Firewall Rules (Runners to GitHub)

Runners must reach GitHub over the internet for job coordination.

| Source | Destination | Port | Protocol | Purpose |
|---|---|---|---|---|
| Runner Subnet | github.com | 443 | TCP | GitHub API and runner registration |
| Runner Subnet | *.actions.githubusercontent.com | 443 | TCP | Actions workflow downloads |
| Runner Subnet | ghcr.io | 443 | TCP | GitHub Container Registry |
| Runner Subnet | *.blob.core.windows.net | 443 | TCP | Actions artifact storage |

Runners reach the internet through a NAT Gateway. Runners have no public IP addresses.

---

## 6. Security and Compliance

### 6.1 SOC 2 Alignment

DMSi requires SOC 2 compliance. The following controls apply to this implementation.

| SOC 2 Trust Principle | How This Plan Addresses It |
|---|---|
| **Security** | Private subnets, encrypted VPN, least-privilege IAM |
| **Availability** | Auto-scaling runner groups, health monitoring |
| **Processing Integrity** | Immutable build artifacts, signed deployments |
| **Confidentiality** | Secrets stored in AWS Secrets Manager, not in code |
| **Privacy** | No customer data processed in AWS CI/CD environment |

### 6.2 Secrets Management

Secrets are credentials, API keys, and certificates. They must never appear in code or logs.

| Secret Type | Storage Location | Access Method |
|---|---|---|
| GitHub Personal Access Tokens | GitHub Organization Secrets | Workflow environment variables |
| AWS Access Keys | GitHub OIDC (no long-lived keys) | Assumed IAM roles per workflow |
| Tierpoint SSH Keys | AWS Secrets Manager | Retrieved at runtime by runner |
| Tierpoint WinRM Credentials | AWS Secrets Manager | Retrieved at runtime by runner |
| Database Connection Strings | AWS Secrets Manager | Retrieved at runtime by runner |
| Monitoring API Keys | AWS Secrets Manager | Retrieved at runtime by runner |

**Key Decision:** GitHub OIDC (OpenID Connect) will authenticate runners to AWS. This eliminates long-lived AWS access keys. Each workflow assumes a temporary role with limited permissions.

### 6.3 Runner Security Model

| Control | Implementation |
|---|---|
| Runner Isolation | Each job runs on a fresh instance or container |
| No Persistent Data | Runners are rebuilt after each job (ephemeral) |
| No Public IP | Runners sit in private subnets behind NAT |
| Network Segmentation | Runners cannot reach Tierpoint resources they do not need |
| Logging | All runner activity is logged to CloudWatch |
| Patching | Runner images are rebuilt weekly with latest patches |

### 6.4 Access Control

| Role | AWS Access | GitHub Access | Tierpoint Access |
|---|---|---|---|
| Cloud Engineer | Full AWS admin (MFA required) | Org admin | Network config only |
| Engineering Manager | Read-only AWS console | Org admin | No direct access |
| Deployment Specialist | No AWS console access | Repo write, workflow dispatch | Deploy target servers |
| Developers | No AWS console access | Repo write | No direct access |
| Runners (automated) | Scoped IAM role per workflow | Runner registration token | Deploy targets only |

### 6.5 Audit and Logging

| Log Source | Destination | Retention |
|---|---|---|
| AWS CloudTrail | S3 bucket (encrypted) | 1 year minimum |
| VPC Flow Logs | CloudWatch Logs | 90 days |
| Runner Job Logs | GitHub Actions (built-in) | 90 days (GitHub default) |
| Deployment Logs | S3 bucket (encrypted) | 1 year minimum |
| VPN Connection Logs | CloudWatch Logs | 90 days |

---

## 7. Runner Configuration

### 7.1 Runner Types Required

DMSi operates both Windows and Linux servers. The build tools differ between platforms. Two runner types are needed.

**Linux Runner**

| Attribute | Value |
|---|---|
| OS | Ubuntu 22.04 LTS |
| Instance Type | t3.large (2 vCPU, 8 GB RAM) |
| Storage | 100 GB SSD |
| Purpose | Terraform, scripts, monitoring automation, Linux deployments |
| Labels | `self-hosted`, `linux`, `dmsi` |

**Windows Runner**

| Attribute | Value |
|---|---|
| OS | Windows Server 2022 |
| Instance Type | t3.xlarge (4 vCPU, 16 GB RAM) |
| Storage | 200 GB SSD |
| Purpose | Progress OpenEdge builds, Windows deployments, A2W builds |
| Labels | `self-hosted`, `windows`, `dmsi`, `progress` |

### 7.2 Runner Lifecycle (Ephemeral Model)

Runners will be ephemeral. This means each runner handles one job, then is destroyed. A new runner is created for the next job. This prevents leftover files or credentials from leaking between jobs.

**Lifecycle:**

1. GitHub Actions workflow is triggered.
2. Runner manager detects a queued job.
3. Runner manager launches a new EC2 instance from a pre-built image.
4. The instance registers itself as a GitHub runner.
5. The instance picks up and executes the job.
6. The instance deregisters and terminates itself.

### 7.3 Runner Manager

A small, always-on management service coordinates runner creation and teardown.

**Recommended Tool:** [actions-runner-controller](https://github.com/actions/actions-runner-controller) or a lightweight Lambda-based scaler.

| Component | Implementation |
|---|---|
| Runner Manager Host | Single t3.small EC2 instance (or Lambda) |
| Scaling Logic | Monitors GitHub webhook for `workflow_job` events |
| Scale-Up | Launches EC2 instance when job is queued |
| Scale-Down | Terminates instance after job completes |
| Idle Runners | Zero when no jobs are running (cost savings) |
| Maximum Runners | 4 concurrent (adjustable) |

### 7.4 Runner Images (AMIs)

Pre-built Amazon Machine Images ensure fast startup. Runner images include all build tools pre-installed. Images are rebuilt weekly to include latest security patches.

**Linux Runner AMI Contents:**

- GitHub Actions runner agent
- Git, Docker, Terraform, AWS CLI
- Python, Node.js
- Ansible (for Tierpoint server configuration)
- SSH client and WinRM client
- Monitoring CLI tools

**Windows Runner AMI Contents:**

- GitHub Actions runner agent
- Git, AWS CLI
- Progress OpenEdge development tools
- .NET Framework and SDK
- PowerShell 7
- WinRM client

---

## 8. Workload Definitions

### 8.0 Pipeline Phasing Strategy

Pipelines are built in a deliberate order. The first pipeline (nginx) is the **reference pipeline**. It proves every component end to end. All later pipelines copy its proven patterns.

This approach has three benefits:

1. **Reduces risk.** Problems are found on a low-risk workload first.
2. **Builds confidence.** The team learns the tools on a simple use case.
3. **Speeds delivery.** Later pipelines reuse tested workflow patterns.

### 8.1 Nginx Configuration Deployment (Reference Pipeline)

This is the first pipeline built. It deploys nginx configuration changes to Linux servers at Tierpoint. Nginx manages web traffic routing and is a good first candidate because changes are small, testable, and reversible.

| Attribute | Detail |
|---|---|
| Runner Type | Linux |
| Trigger | Push to main branch or pull request |
| Repository | New repository for nginx configuration files |
| Steps (PR) | Checkout config, run syntax validation (nginx -t), report result |
| Steps (Deploy) | Checkout config, connect to Tierpoint over VPN, deploy config, reload nginx |
| Target | Linux servers running nginx at Tierpoint |
| Protocol | SSH |
| Approval | Requires manual approval in GitHub Actions before deployment |
| Rollback | Previous configuration stored in Git. Revert commit and redeploy. |
| Estimated Duration | Under 5 minutes |

**What This Pipeline Proves:**

| Component | Validated By This Pipeline |
|---|---|
| Self-hosted runner | Runner picks up and executes the job |
| VPN connectivity | Runner reaches Tierpoint server over VPN |
| Secrets management | SSH credentials retrieved from AWS Secrets Manager |
| Approval gates | Deploy step waits for human approval |
| Audit logging | Full job log captured in GitHub Actions and CloudWatch |
| Ephemeral runner lifecycle | Runner starts, executes, and terminates |
| Rollback process | Git revert triggers a clean redeployment |

**Reference Pipeline Workflow (Simplified):**

```
Pull Request Opened
    --> Runner starts
    --> Checkout nginx config from repo
    --> Run nginx -t (syntax check)
    --> Report pass/fail on pull request
    --> Runner terminates

Pull Request Merged to Main
    --> Runner starts
    --> Checkout nginx config from repo
    --> Wait for manual approval
    --> Connect to Tierpoint server via SSH over VPN
    --> Copy config files to server
    --> Run nginx -t on server (verify before reload)
    --> Reload nginx service
    --> Verify nginx is running
    --> Report success/failure
    --> Runner terminates
```

**Critical Control:** Deployments to Tierpoint always require manual approval. No automated deployment runs without a person confirming it.

### 8.2 Progress OpenEdge Builds (After Reference Pipeline)

| Attribute | Detail |
|---|---|
| Runner Type | Windows |
| Trigger | Push to main branch or pull request |
| Steps | Checkout code, compile .p and .r files, package artifacts |
| Output | Build artifact stored in GitHub Packages or S3 |
| Pattern Source | Reuses approval, secrets, and logging from reference pipeline |
| Estimated Duration | To be baselined after reference pipeline is complete |

### 8.3 Web Application Builds -- A2W (After Reference Pipeline)

| Attribute | Detail |
|---|---|
| Runner Type | Windows or Linux (depends on build tooling) |
| Trigger | Push to main branch or pull request |
| Steps | Checkout code, install dependencies, build, package |
| Output | Build artifact stored in GitHub Packages or S3 |
| Pattern Source | Reuses approval, secrets, and logging from reference pipeline |
| Estimated Duration | To be baselined after reference pipeline is complete |

### 8.4 Automated Tests (After Build Pipelines)

| Attribute | Detail |
|---|---|
| Runner Type | Matches the build runner type |
| Trigger | After successful build |
| Steps | Run unit tests, report results |
| Output | Test results published to GitHub pull request |
| Pattern Source | Reuses runner and reporting patterns from reference pipeline |
| Estimated Duration | To be baselined after build pipelines are complete |

### 8.5 Deployment to Tierpoint (After Reference Pipeline)

| Attribute | Detail |
|---|---|
| Runner Type | Linux (using Ansible or deployment scripts) |
| Trigger | Manual approval gate, then automated execution |
| Steps | Retrieve artifact, connect to Tierpoint over VPN, deploy |
| Target | Specific Windows or Linux servers at Tierpoint |
| Protocol | WinRM (Windows) or SSH (Linux) |
| Approval | Requires manual approval in GitHub Actions before execution |
| Pattern Source | Directly extends the nginx reference pipeline deployment pattern |

### 8.6 Infrastructure as Code (After Reference Pipeline)

| Attribute | Detail |
|---|---|
| Runner Type | Linux |
| Trigger | Push to infrastructure repository |
| Steps | Terraform plan (on pull request), Terraform apply (on merge) |
| Scope | AWS resources only (not Tierpoint infrastructure) |
| Approval | Terraform apply requires manual approval |
| Pattern Source | Reuses approval gates and logging from reference pipeline |

### 8.7 Monitoring Automation (After Platform Selection)

| Attribute | Detail |
|---|---|
| Runner Type | Linux |
| Trigger | Scheduled (cron) or on push to monitoring repository |
| Steps | Run health checks, update dashboards, sync alert rules |
| Scope | Monitoring platform configuration and data collection |
| Integration | PagerDuty (existing) and future monitoring platform |
| Pattern Source | Reuses runner, secrets, and VPN patterns from reference pipeline |

---

## 9. Monitoring Infrastructure

### 9.1 Current Status

The monitoring platform has not been selected. Candidates under evaluation include Dynatrace, CheckMK, and others. This section defines what the monitoring infrastructure in AWS must support regardless of the platform chosen.

### 9.2 AWS Monitoring Requirements

| Requirement | Detail |
|---|---|
| Hosting | Monitoring platform runs in the Monitoring Subnet in AWS |
| Connectivity | Must reach Tierpoint servers over VPN for data collection |
| Storage | Log and metric data stored in AWS (S3 or platform-native) |
| Alerting | Integrates with PagerDuty (already in use) |
| Dashboard | Accessible to engineering team through a web interface |

### 9.3 Separation of Concerns

| What Happens in AWS | What Happens at Tierpoint |
|---|---|
| Monitoring server or SaaS control plane runs here | Monitoring agents run on Tierpoint servers |
| Dashboards and alerting rules are managed here | Agents collect and send data to AWS |
| Log aggregation and storage happens here | No monitoring data is stored at Tierpoint |
| PagerDuty integration originates here | Agents are deployed via GitHub Actions runners |

### 9.4 Placeholder: Platform Selection

When the monitoring platform is selected, this section should be updated with:

- Agent deployment method for Windows and Linux.
- Network ports and protocols required.
- Storage sizing for log and metric retention.
- License costs.

---

## 10. Implementation Phases

### Phase 0: Discovery and Prerequisites (Week 1-2)

**Goal:** Answer open questions and remove blockers.

| Task | Owner | Deliverable |
|---|---|---|
| Confirm Tierpoint network details (see Section 5.2) | Engineering Manager | IP ranges, firewall model, VPN readiness |
| Verify AWS account access and permissions | Engineering Team | IAM admin access confirmed |
| Confirm GitHub Enterprise org admin access | Engineering Team | Ability to register self-hosted runners |
| Confirm Tierpoint contract allows VPN to AWS | Engineering Manager | Written confirmation from Tierpoint |
| Select Terraform or CloudFormation for IaC | Engineering Team | Decision documented |
| Establish IaC repository in GitHub | Engineering Team | Repository created with branch protection |

**Exit Criteria:** All blockers resolved. VPN setup can begin.

### Phase 1: Proof of Concept -- Nginx Reference Pipeline (Week 3-4)

**Goal:** Build the nginx reference pipeline end to end. One runner deploys one nginx config change to Tierpoint.

| Task | Owner | Deliverable |
|---|---|---|
| Deploy AWS VPC with subnets | Engineering Team | VPC live, subnets created via IaC |
| Establish Site-to-Site VPN to Tierpoint | Engineering Team + Tierpoint | VPN tunnel active, routing confirmed |
| Build Linux runner AMI | Engineering Team | AMI with runner agent and basic tools |
| Register one self-hosted runner | Engineering Team | Runner appears in GitHub org settings |
| Create nginx configuration repository | Engineering Team | Repo with current nginx configs and branch protection |
| Create nginx syntax validation workflow | Engineering Team | PR triggers nginx -t check on runner |
| Create nginx deployment workflow | Engineering Team | Merge triggers deploy with approval gate |
| Test full cycle: PR, validate, approve, deploy | Engineering Team | Nginx config change deployed to Tierpoint via pipeline |

**Exit Criteria:** A nginx configuration change flows from pull request through validation, approval, and deployment to a Tierpoint server. This is the proven reference pipeline.

**Proof of Concept Success Metric:** End-to-end nginx deployment verified within 30 days.

### Phase 2: Harden Reference Pipeline + Begin Build Pipelines (Week 5-8)

**Goal:** Harden the nginx reference pipeline for production use. Begin building additional pipelines using its patterns.

| Task | Owner | Deliverable |
|---|---|---|
| Implement ephemeral runner manager | Engineering Team | Auto-scaling runner creation and teardown |
| Implement GitHub OIDC for AWS authentication | Engineering Team | No long-lived AWS keys in use |
| Configure AWS Secrets Manager | Engineering Team | Tierpoint credentials stored securely |
| Set up CloudWatch logging | Engineering Team | Runner and VPN logs captured |
| Document reference pipeline patterns | Engineering Team | Reusable workflow templates and guide |
| Build Windows runner AMI with Progress tools | Engineering Team | AMI with OpenEdge, Git, runner agent |
| Create Progress OpenEdge build workflow | Engineering Team + Callie | Build workflow using reference pipeline patterns |
| Create A2W build workflow | Engineering Team | Build workflow using reference pipeline patterns |
| Create test execution workflow | Engineering Team | Tests run on pull requests |

**Exit Criteria:** Reference pipeline runs on ephemeral runners with production-grade security. Pattern documentation is complete. Build pipelines are in progress or functional.

### Phase 3: Deployment Automation (Week 9-12)

**Goal:** Automated deployments to Tierpoint with approval gates.

| Task | Owner | Deliverable |
|---|---|---|
| Create deployment workflow for Tierpoint (Linux) | Engineering Team | Ansible-based deployment with approval |
| Create deployment workflow for Tierpoint (Windows) | Engineering Team | WinRM-based deployment with approval |
| Implement deployment approval gates | Engineering Team | Manual approval required before deploy |
| Test rollback procedures | Engineering Team | Documented rollback steps verified |
| Harden firewall rules (remove any POC exceptions) | Engineering Team | Production-ready security groups |
| Deploy monitoring infrastructure placeholder | Engineering Team | Subnet and basic resources ready |
| Conduct SOC 2 control validation | Engineering Manager | Audit log review, access control check |
| Write operational runbook | Engineering Team | Step-by-step guide for common tasks |

**Exit Criteria:** Deployments to Tierpoint are automated, approved by a human, and logged. SOC 2 controls are documented and testable.

### Phase Summary Timeline

```
Week:  1   2   3   4   5   6   7   8   9  10  11  12
       |---Phase 0---|
                     |---Phase 1---|
                                   |------Phase 2------|
                                                       |------Phase 3------|
       |-- Discovery -|-- Nginx POC|--- Harden + Build -|--- Deploy + Harden |
```

**30-Day Milestone:** Phase 1 complete. Nginx reference pipeline deploys config to Tierpoint.  
**90-Day Milestone:** Phase 3 complete. Reference pipeline hardened. Additional pipelines operational.

---

## 11. Cost Estimates

### 11.1 Monthly AWS Costs (Steady State)

| Resource | Specification | Est. Monthly Cost |
|---|---|---|
| VPN Connection | 2 tunnels (active/standby) | $72 |
| NAT Gateway | Single AZ | $45 + data transfer |
| Runner Manager | t3.small (always on) | $15 |
| Linux Runners (ephemeral) | t3.large, ~4 hrs/day avg | $50-$100 |
| Windows Runners (ephemeral) | t3.xlarge, ~4 hrs/day avg | $100-$200 |
| Runner AMI Storage | 2 AMIs (Linux + Windows) | $10 |
| CloudWatch Logs | Estimated 50 GB/month | $25 |
| S3 (artifacts + audit logs) | Estimated 100 GB | $5 |
| Secrets Manager | 10-20 secrets | $5 |
| Monitoring Subnet Resources | Placeholder (platform TBD) | $500-$1,500 |
| **Total Estimated** | | **$827 - $1,977/month** |

### 11.2 Cost Notes

- Ephemeral runners reduce cost significantly. Runners are only running during active jobs.
- Windows instances cost more than Linux instances. Minimizing Windows runner use reduces cost.
- Monitoring platform costs depend on which platform is selected.
- Data transfer across VPN is billed at standard AWS egress rates.
- All estimates assume the under $5,000/month budget target.
- Estimate is well within budget even with monitoring platform costs.

### 11.3 One-Time Setup Costs

| Item | Estimate |
|---|---|
| Engineering time (12 weeks, internal) | Internal labor cost |
| Tierpoint VPN configuration (if billed) | Verify with Tierpoint contract |
| Progress OpenEdge license for build runner | Verify with Progress licensing |

**Action Required:** Confirm whether Progress OpenEdge requires a separate license for a build-only server. This could impact cost.

---

## 12. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Tierpoint blocks or delays VPN setup | Medium | High | Begin Tierpoint conversations in Week 1. Get written approval early. |
| R2 | Cloud engineer and SRE roles remain unfilled | High | High | Dynamo provides interim coverage. Prioritize both hires. |
| R2a | Dynamo interim engagement ends before hires are made | Medium | High | Begin recruiting in Phase 0. Document all Dynamo work in shared repos. |
| R3 | Progress OpenEdge build tools do not run in AWS | Medium | High | Test during Phase 1 POC. Identify licensing issues early. |
| R4 | VPN bandwidth is insufficient for large artifacts | Low | Medium | Monitor transfer times. Evaluate Direct Connect if needed. |
| R5 | Team capacity consumed by reactive work (66% today) | High | High | Protect dedicated time for POC. Limit scope to essentials. |
| R6 | CIDR range conflicts between AWS and Tierpoint | Low | Medium | Discover Tierpoint ranges before designing AWS VPC. |
| R7 | SOC 2 auditor flags gaps in runner controls | Medium | Medium | Build audit logging from day one. Use ephemeral runners. |
| R8 | Secrets exposed in workflow logs | Low | High | Use GitHub secret masking. No secrets in code. Regular audits. |
| R9 | Cost exceeds $5,000/month budget | Low | Medium | Ephemeral runners keep costs low. Monitor monthly spend. |
| R10 | Runner image builds break due to upstream changes | Medium | Low | Pin versions. Test AMI builds weekly in a separate workflow. |

---

## 13. Staffing Requirements

### 13.1 Roles and Responsibilities

| Role | Responsibility | Time Commitment |
|---|---|---|
| Engineering Manager (Bryan) | Tierpoint coordination, approvals, exec reporting | 4 hrs/week |
| Deployment Specialist (Callie) | Build pipeline design, workflow authoring | 12 hrs/week during Phase 2-3 |
| Dynamo (interim SRE/Cloud) | Monitoring subnet setup, AWS config, cloud engineering | As contracted during all phases |
| Engineering Team | IaC, VPC, VPN, runner configuration | 20 hrs/week during Phase 1-2 |
| Monitoring / SRE (open role) | Monitoring platform operations, agent deployment | Full-time once hired |
| Cloud Engineer (open role) | AWS operations, long-term maintenance | Full-time once hired |

### 13.2 Interim Coverage: Dynamo

Dynamo is providing interim Monitoring/SRE and Cloud Engineering capabilities. This covers the gap while permanent hires are made. Dynamo's involvement should include knowledge transfer to the engineering team. All work performed by Dynamo must be documented in shared repositories.

### 13.3 Hiring Priority: Two Open Roles

This plan depends on two permanent hires for long-term operations.

| Open Role | Why It Is Critical |
|---|---|
| Cloud Engineer | AWS infrastructure ownership and day-to-day operations |
| Monitoring / SRE | Monitoring platform operations and alert management |

Without these hires, DMSi depends on Dynamo indefinitely. The engineering team cannot absorb this work alongside the existing 66% reactive workload.

**Recommended:** Begin recruiting both roles during Phase 0. Target onboarding during Phase 2.

### 13.4 Knowledge Transfer Plan

| From | To | Knowledge Area |
|---|---|---|
| Callie | Engineering team | Deployment process, current scripts |
| Dynamo | Engineering team | AWS setup, monitoring config, cloud architecture |
| Dynamo | Cloud engineer (when hired) | AWS infrastructure, IaC, runner config |
| Dynamo | Monitoring/SRE (when hired) | Monitoring platform setup, agent deployment |

---

## 14. Approval and Governance

### 14.1 Approval Required

This plan requires executive leadership approval before implementation begins. The following items need approval.

| Item | Approver | Decision |
|---|---|---|
| AWS monthly budget (up to $5,000/month) | Executive Leadership | Approve / Reject |
| VPN connection to Tierpoint | Executive Leadership | Approve / Reject |
| Cloud engineer and SRE hiring priority | Executive Leadership | Approve / Reject |
| Dynamo interim engagement scope | Executive Leadership | Approve / Reject |
| Engineering team time allocation (12 weeks) | Executive Leadership | Approve / Reject |
| Progress OpenEdge license for build runner | Executive Leadership | Approve / Reject |

### 14.2 Decision Log

| Date | Decision | Decided By | Notes |
|---|---|---|---|
| | | | To be filled during implementation |

### 14.3 Change Control

Changes to the scope, budget, or timeline of this plan require written approval from executive leadership. Changes are documented in the Decision Log above.

---

## 15. Success Criteria

### 15.1 Phase 1 Success (30-Day Mark)

- [ ] VPN connection between AWS and Tierpoint is active.
- [ ] One self-hosted runner is registered in GitHub Enterprise.
- [ ] Nginx configuration repository exists with branch protection.
- [ ] Pull request triggers nginx syntax validation on the runner.
- [ ] Merge triggers deployment with manual approval gate.
- [ ] Nginx config change deploys to Tierpoint server through the pipeline.
- [ ] The runner reaches Tierpoint over the VPN (proven by deployment).
- [ ] All infrastructure is deployed through code (not manual clicks).

### 15.2 Phase 2 Success (60-Day Mark)

- [ ] Reference pipeline runs on ephemeral runners.
- [ ] No long-lived credentials exist in workflows or code.
- [ ] Reference pipeline patterns are documented as reusable templates.
- [ ] GitHub OIDC authentication is in place (no static AWS keys).
- [ ] All runner activity is logged and auditable.
- [ ] Progress OpenEdge build pipeline is functional or in progress.
- [ ] A2W build pipeline is functional or in progress.

### 15.3 Phase 3 Success (90-Day Mark)

- [ ] Progress OpenEdge code builds automatically on code push.
- [ ] Web application code builds automatically on code push.
- [ ] Automated tests run on every pull request.
- [ ] Deployment to Tierpoint executes through an approved workflow.
- [ ] Ephemeral runners scale up and down based on demand.
- [ ] Monthly AWS cost is under $5,000.
- [ ] Operational runbook is written and reviewed.
- [ ] SOC 2 controls are documented and validated.

### 15.4 Metrics to Track

| Metric | Baseline (Today) | 30-Day Target | 90-Day Target |
|---|---|---|---|
| Nginx config deployments via pipeline | 0 | 1+ per week | Standard practice |
| Automated builds per week | 0 | 0 (focus is nginx) | 10+ |
| Automated test runs per week | 0 | Nginx syntax checks | 10+ |
| Manual deployment steps (nginx) | All manual | Fully automated | Fully automated |
| Manual deployment steps (other) | All manual | All manual | 80% automated |
| Time from config commit to deployment | N/A | Under 10 minutes | Under 10 minutes |
| Secrets stored in code or scripts | Unknown | 0 | 0 |
| Pipelines using reference pattern | 0 | 1 (nginx) | 4+ |

---

## 16. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **AMI** | Amazon Machine Image. A saved copy of a server's setup used to launch new servers quickly. |
| **CI/CD** | Continuous Integration / Continuous Delivery. Automating the build, test, and deployment process. |
| **CIDR** | A notation for defining IP address ranges (example: 10.100.0.0/16). |
| **CloudTrail** | An AWS service that records all actions taken in the AWS account. |
| **CloudWatch** | An AWS service for collecting logs and performance data. |
| **Ephemeral Runner** | A runner that is created for one job and then destroyed. |
| **GitHub Actions** | GitHub's built-in automation tool for running workflows. |
| **IAM** | Identity and Access Management. AWS's access control system. |
| **IaC** | Infrastructure as Code. Managing servers and networks through code files. |
| **NAT Gateway** | A network device that lets private servers reach the internet without being reachable from the internet. |
| **Nginx** | A web server that routes network traffic. Used as the first pipeline target in this plan. |
| **OIDC** | OpenID Connect. A method for one service to prove its identity to another without sharing passwords. |
| **Reference Pipeline** | The first pipeline built (nginx). It proves all components and becomes the template for future pipelines. |
| **Self-Hosted Runner** | A server you own that runs GitHub Actions jobs instead of using GitHub's servers. |
| **Site-to-Site VPN** | An encrypted network connection between two locations over the internet. |
| **SOC 2** | A security compliance standard that audits how a company protects customer data. |
| **Terraform** | A tool for creating and managing cloud infrastructure through code files. |
| **VPC** | Virtual Private Cloud. A private, isolated network within AWS. |
| **WinRM** | Windows Remote Management. A protocol for managing Windows servers remotely. |

### Appendix B: Related DMSi Documents

| Document | Relevance |
|---|---|
| DMSi CI/CD DevOps Modernization Plan | Overall CI/CD strategy and constraints |
| DMSi CI/CD Project Spec | Project history and stakeholder context |
| Bryan's Engineering Vision | Technical direction and principles |
| DMSi 5-Week Emergency Roadmap | Operational stability context |
| DMSi Alert Rationalization Roadmap | Monitoring strategy alignment |

### Appendix C: Open Questions

| ID | Question | Status | Answer |
|---|---|---|---|
| Q1 | What are Tierpoint's IP address ranges? | Open | |
| Q2 | Does Tierpoint's firewall support IPSec VPN termination? | Open | |
| Q3 | Does the Tierpoint contract allow AWS VPN connections? | Open | |
| Q4 | Does Progress OpenEdge require a separate build license? | Open | |
| Q5 | Which monitoring platform will be selected? | Open | |
| Q6 | Are the cloud engineer and SRE hires approved and in progress? | Open | |
| Q8 | What is the scope and duration of the Dynamo interim engagement? | Open | |
| Q7 | What is the Tierpoint network operations contact? | Open | |

---

**Document End**

*This document will be updated as open questions are resolved and implementation progresses. All changes will be tracked in the Decision Log (Section 14.2).*
