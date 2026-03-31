#!/usr/bin/env node
/**
 * Generates {filePrefix}-WBS-Jira-Import.json from the embedded WM outcome structure.
 * Paths and Jira roots default from dynamo-os.config.cjs (capabilities.WM) when the
 * planning toolkit is resolvable; otherwise falls back to legacy WSA/WM and WSA-2881/82.
 *
 * Usage: node Scripts/wm-wsb-to-jira-import.js
 */

const fs = require('fs');
const path = require('path');
const { resolvePlanningContext } = require('./planning-path-context');

function loadWmPlanningPaths() {
  const ctx = resolvePlanningContext();
  if (ctx && ctx.config.capabilities && ctx.config.capabilities.WM) {
    const wm = ctx.config.capabilities.WM;
    return {
      wmDir: ctx.getCapabilityFolder('WM'),
      rootKey: wm.jiraCapabilityRoot || 'WSA-2881',
      actionItemRootKey: wm.jiraActionItemRoot || 'WSA-2882',
      filePrefix: wm.filePrefix || 'WM',
    };
  }
  const { getCapabilityFolder } = require('./wbs-capability-folder');
  return {
    wmDir: getCapabilityFolder('WM'),
    rootKey: 'WSA-2881',
    actionItemRootKey: 'WSA-2882',
    filePrefix: 'WM',
  };
}

const _wmPaths = loadWmPlanningPaths();
const ROOT_KEY = _wmPaths.rootKey;
const ACTION_ITEM_ROOT_KEY = _wmPaths.actionItemRootKey;
const WM_FILE_PREFIX = _wmPaths.filePrefix;
const LABELS = 'work-management';
const COMPONENT = 'Work Management';
const DEFAULT_OWNER = 'Dynamo + Bryan + Andy';
const PRIORITY = 'Medium';
const STATUS = 'To Do';

function wi(issue_type, summary, description, parent, outcome_id, category, target, owner = DEFAULT_OWNER) {
  return {
    issue_type,
    summary,
    description: description || '',
    parent,
    labels: LABELS + (outcome_id ? ',' + outcome_id.toLowerCase() : ''),
    owner,
    priority: PRIORITY,
    outcome_id: outcome_id || '',
    category: category || '',
    target: target || '',
    status: STATUS,
    component: COMPONENT
  };
}

const outcomes = [
  { id: 'WM-OC-01', title: 'Current State Discovery Complete', category: 'Baseline', target: 'Weeks 1-2 (Feb 16 - Feb 27)' },
  { id: 'WM-OC-02', title: 'Operating Model and Process Design Complete', category: 'Baseline', target: 'Weeks 2-3 (Feb 23 - Mar 6)' },
  { id: 'WM-OC-03', title: 'Tool Selected and System Configured', category: 'Baseline', target: 'Weeks 3-5 (Mar 2 - Mar 20)' },
  { id: 'WM-OC-04', title: 'Existing Queue Dispositioned', category: 'Baseline', target: 'Weeks 4-6 (Mar 9 - Mar 27)' },
  { id: 'WM-OC-05', title: 'Initial Adoption Validated', category: 'Iterative', target: 'Weeks 5-9 (Mar 16 - Apr 17)' },
  { id: 'WM-OC-06', title: 'Full Category Coverage and Reactive Visibility', category: 'Iterative', target: 'Weeks 9-14 (Apr 13 - May 22)' },
  { id: 'WM-OC-07', title: 'Board Accuracy Validated', category: 'Iterative', target: 'Weeks 12-16 (May 4 - Jun 5)' },
  { id: 'WM-OC-08', title: 'Flow Metrics and Scorecard Operational', category: 'Baseline', target: 'Weeks 10-14 (Apr 20 - May 22)' },
  { id: 'WM-OC-09', title: 'Prioritization Drives Execution', category: 'Baseline', target: 'Weeks 14-18 (May 18 - Jun 19)' }
];

// Deliverables and sub-tasks extracted from WM-WBS.md. Each deliverable: { id, title, owner, tasks: [{ summary, description }] }
const deliverables = {
  'WM-OC-01': [
    { id: 'WM-OC-01.1', title: 'Discovery Sessions with Engineering Team', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Conduct interviews and shadowing sessions with engineering team members', description: '' },
      { summary: 'Frame engagement as "fix the system" not "evaluate the people"', description: '' },
      { summary: 'Establish trust that the work is about helping, not judging', description: '' },
      { summary: 'Document how work actually enters, flows through, and exits (or stalls in) the team', description: '' },
      { summary: 'Identify the routing function owner (Casora) and document the current single-point-of-failure pattern', description: '' }
    ]},
    { id: 'WM-OC-01.2', title: 'Workflow Mapping and Documentation', owner: 'Dynamo', tasks: [
      { summary: 'Map all work intake channels: 360 cases, email, Teams messages, hallway conversations, incident follow-up', description: '' },
      { summary: 'Document which channels produce visible work vs. invisible work', description: '' },
      { summary: 'Quantify the approximate split between planned and reactive work based on team interviews', description: '' },
      { summary: 'Identify the five structural gaps: no formal triage, push-based assignment, no WIP discipline, meaningless priority, no feedback loop to staffing', description: '' }
    ]},
    { id: 'WM-OC-01.3', title: '360 Case Evaluation', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Export and analyze the 559 open cases in 360', description: '' },
      { summary: 'Categorize by age, status, work type, and apparent relevance', description: '' },
      { summary: 'Identify patterns: how many are stale, how many are duplicates, how many represent real outstanding work', description: '' },
      { summary: 'Produce a disposition recommendation (feeds WM-OC-04)', description: '' }
    ]},
    { id: 'WM-OC-01.4', title: 'Current State Assessment Document', owner: 'Dynamo', tasks: [
      { summary: 'Consolidate findings into a single assessment document', description: '' },
      { summary: 'Document the five structural gaps with evidence from discovery', description: '' },
      { summary: 'Include the design criteria that the implementation must satisfy', description: '' },
      { summary: 'This document becomes the foundation for WM-OC-02 operating model design', description: '' }
    ]}
  ],
  'WM-OC-02': [
    { id: 'WM-OC-02.1', title: 'Workflow State Design', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Define mutually exclusive, collectively exhaustive status transitions', description: '' },
      { summary: 'Starting point from discovery: Submitted, Triaged, Queued, In Progress, Blocked, Complete, Deferred', description: '' },
      { summary: 'Critical distinction: Queued vs. In Progress (this is what makes WIP limits possible)', description: '' },
      { summary: 'Validate with Bryan and Andy that states reflect how work actually moves through the team', description: '' },
      { summary: 'Document transition rules (who can move items between states, what triggers each transition)', description: '' }
    ]},
    { id: 'WM-OC-02.2', title: 'Work Category Taxonomy and Product Attribution', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Define initial work categories: customer environment configuration, infrastructure/platform maintenance, tooling improvements, escalation follow-up, internal requests, improvement/automation projects', description: '' },
      { summary: 'Include break-fix as a category for counting purposes even though it follows a fast-track path', description: '' },
      { summary: 'Define product field (Agility, Framework, etc.) as a separate dimension from work type', description: '' },
      { summary: 'Product list drawn from existing 360 taxonomy, cleaned up if needed', description: '' },
      { summary: 'Sub-product granularity deferred until top-level data proves useful', description: '' },
      { summary: 'Define priority criteria that replace the current "71% Normal" meaningless priority model', description: '' }
    ]},
    { id: 'WM-OC-02.3', title: 'Mixed Pipeline and Side-Door Policy', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Design two-track triage path: planned/plannable work follows full triage flow; break-fix gets tagged and fast-tracked', description: '' },
      { summary: 'Break-fix standing agenda item at triage: "What came in as break-fix since last session?" -- tag, count, move on (target: 5 minutes)', description: '' },
      { summary: 'Design lightweight "capture after the fact" mechanism for side-door work', description: '' },
      { summary: 'Standing triage question: "What did you work on this week that isn\'t on the board?"', description: '' },
      { summary: 'Define the metric: planned vs. unplanned work ratio -- baseline measurement, not a performance target initially', description: '' }
    ]},
    { id: 'WM-OC-02.4', title: 'Triage Ceremony Design', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Define attendees: Bryan, Andy, and routing function owner (Casora)', description: '' },
      { summary: 'Initial cadence: twice weekly during adoption, moving to weekly once habit is formed', description: '' },
      { summary: 'Agenda: new submissions, break-fix fast-track, blocked items, aging items, side-door check', description: '' },
      { summary: 'Decision framework: accept into queue, defer with reason, or reject', description: '' },
      { summary: 'Key question at triage: "What does this displace, and is that the right trade?"', description: '' },
      { summary: 'Target: 30 minutes, hard stop. Define how decisions get communicated back to requesters', description: '' }
    ]},
    { id: 'WM-OC-02.5', title: 'WIP Limits and Capacity Allocation Model', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Set initial per-engineer WIP limits: 3-5 items in "In Progress" simultaneously', description: '' },
      { summary: 'Set team-level WIP visibility on the board', description: '' },
      { summary: 'Define capacity allocation starting point based on discovery data: reactive/unplanned 60-70%, planned work 20-30%, improvement work 10-15%', description: '' },
      { summary: 'Document that these are honest starting points, not aspirational targets', description: '' },
      { summary: 'Define pull model: engineers pull from prioritized queue when below WIP limit, not push-based assignment', description: '' },
      { summary: 'Within a priority band, engineers can influence sequencing for efficiency (batching similar work, leveraging context)', description: '' }
    ]},
    { id: 'WM-OC-02.6', title: 'Operating Agreement Document', owner: 'Dynamo', tasks: [
      { summary: 'One-page operating agreement consolidating all Phase 1 deliverables', description: '' },
      { summary: 'Reviewed and committed to by Bryan, Andy, and the engineering team', description: '' },
      { summary: 'This document is the configuration specification for WM-OC-03 (tool setup)', description: '' }
    ]}
  ],
  'WM-OC-03': [
    { id: 'WM-OC-03.1', title: 'Tool Evaluation Against Requirements', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Evaluate candidate tools against non-negotiable requirements from WM-OC-02', description: 'Simple intake, kanban visualization, WIP limits, flexible categorization, product field support, basic flow reporting, clear ownership with explicit status transitions.' },
      { summary: 'Evaluate nice-to-haves: intake forms, workload view per person, PagerDuty integration path, API access for Engineering Scorecard', description: '' },
      { summary: 'Candidate tools: Jira Service Management, GitHub Projects, Teamwork, monday.com (Kanban mode), Shortcut', description: '' },
      { summary: 'Resolve the relationship between the work management system and 360 (WM-D-04)', description: 'Does 360 remain intake with promotion, or does the new system replace 360 for engineering work?' }
    ]},
    { id: 'WM-OC-03.2', title: 'Tool Selection Decision', owner: 'Bryan + Andy + Brent', tasks: [
      { summary: 'Document the decision with rationale tied to operating agreement fit', description: '' },
      { summary: 'Include Brent in the decision for budget and strategic alignment', description: '' }
    ]},
    { id: 'WM-OC-03.3', title: 'System Configuration', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Board columns matching the agreed workflow states from WM-OC-02.1', description: '' },
      { summary: 'Work category field with categories from WM-OC-02.2', description: '' },
      { summary: 'Product field (Agility, Framework, etc.) from WM-OC-02.2', description: '' },
      { summary: 'Owner field (populated when an engineer pulls the item, not at triage)', description: '' },
      { summary: 'Submission date (automatic). Priority field with defined criteria from WM-OC-02.2', description: '' },
      { summary: 'Do NOT configure: custom fields beyond the above, complex automation rules, integrations beyond basic SSO, advanced reporting dashboards', description: '' }
    ]}
  ],
  'WM-OC-04': [
    { id: 'WM-OC-04.1', title: 'Queue Review and Categorization', owner: 'Dynamo + Bryan + Andy + Casora', tasks: [
      { summary: 'Review all 559 open cases with Bryan, Andy, and Casora', description: '' },
      { summary: 'Categorize each case: still relevant (migrate), can be closed (close in 360), needs investigation (flag for triage)', description: '' },
      { summary: 'Use the analysis from WM-OC-01.3 as the starting point', description: '' }
    ]},
    { id: 'WM-OC-04.2', title: 'Migration of Relevant Items', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Migrate "still relevant" items into the new system with minimal cleanup', description: '' },
      { summary: 'Apply work category and product tags from WM-OC-02 taxonomy', description: '' },
      { summary: 'Do not enrich beyond minimum fields -- the team will update items as they work them', description: '' }
    ]},
    { id: 'WM-OC-04.3', title: 'Stale Item Closure', owner: 'Bryan + Casora', tasks: [
      { summary: 'Close stale and resolved items in 360 with brief documented rationale', description: '' },
      { summary: 'Use the first 2-3 triage ceremonies to work through "needs investigation" items', description: '' }
    ]}
  ],
  'WM-OC-05': [
    { id: 'WM-OC-05.1', title: 'Team Orientation', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Walk the engineering team through the system: how to submit, how to pull from the queue, workflow states, WIP limits, what happens at triage', description: '' },
      { summary: 'Frame as "making your work visible" rather than "tracking your work"', description: '' },
      { summary: 'Dynamo co-facilitates the first 4-6 weeks of triage sessions', description: '' }
    ]},
    { id: 'WM-OC-05.2', title: 'Break-Fix and Side-Door Capture Established', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Break-fix cases arriving through 360 get tagged at triage and counted, not sequenced', description: '' },
      { summary: 'Engineers capture side-door work after the fact: what it was, roughly how long, tag indicating it came outside normal path', description: '' },
      { summary: 'Framed as "help us understand the real demand picture" not "justify your time"', description: '' },
      { summary: 'These two practices produce the data that makes the capacity allocation model honest', description: '' }
    ]},
    { id: 'WM-OC-05.3', title: 'First Category Adoption (Customer Environment Configuration)', owner: 'Bryan + Andy', tasks: [
      { summary: 'Start with highest-volume category: customer environment configuration (70-80% of noise per Bryan and Andy)', description: '' },
      { summary: 'Run the first 2-3 triage ceremonies focused on this category', description: '' },
      { summary: 'Let the team build the habit on contained scope before expanding in WM-OC-06', description: '' }
    ]},
    { id: 'WM-OC-05.4', title: 'First Triage Ceremonies', owner: 'Bryan + Andy + Casora', tasks: [
      { summary: 'Bryan (or Andy) facilitates; Dynamo co-facilitates first 4-6 weeks', description: '' },
      { summary: 'Walk through every new submission; make explicit accept/defer/reject decisions with rationale', description: '' },
      { summary: 'Check WIP limits against what engineers currently have in progress', description: '' },
      { summary: 'Review blocked items; keep to 30 minutes', description: '' },
      { summary: 'Even if only three new items, hold the meeting. The cadence is the muscle being built', description: '' }
    ]},
    { id: 'WM-OC-05.5', title: 'Adoption Measurement Report', owner: 'Dynamo', tasks: [
      { summary: 'Measure adoption indicators, NOT performance indicators during this phase', description: '' },
      { summary: 'Metrics: % of actual work captured (target: 80%+ within 60 days), average time from submission to triage, WIP limit adherence, board freshness, side-door capture rate, planned vs. reactive ratio (baseline only)', description: '' },
      { summary: 'Do NOT measure cycle time or throughput yet. Data won\'t be meaningful until at least one full cycle', description: '' }
    ]}
  ],
  'WM-OC-06': [
    { id: 'WM-OC-06.1', title: 'Remaining Work Category Adoption', owner: 'Bryan + Andy', tasks: [
      { summary: 'Extend beyond customer environment configuration to include: infrastructure/platform maintenance, tooling improvements, escalation follow-up, internal requests, improvement/automation projects', description: '' },
      { summary: 'By this point the team has muscle memory for intake, triage, and status updates, so extending is habit extension, not behavior change', description: '' }
    ]},
    { id: 'WM-OC-06.2', title: 'PagerDuty Integration for Reactive Work', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Connect PagerDuty incidents to the work management system', description: '' },
      { summary: 'PagerDuty still owns the incident lifecycle -- the integration creates work items when incidents resolve to capture follow-up work and time spent', description: '' },
      { summary: 'This replaces manual break-fix tagging from WM-OC-05.2 and improves data quality', description: '' },
      { summary: 'With several weeks of data, engineering leadership now has a real capacity ratio view', description: '' }
    ]},
    { id: 'WM-OC-06.3', title: 'Commitment Tier Implementation', owner: 'Dynamo + Bryan + Andy', tasks: [
      { summary: 'Introduce three commitment tiers: committed this cycle (small set, high confidence), targeted next (planned but could shift), backlog (acknowledged, not scheduled)', description: '' },
      { summary: 'Gives stakeholders a clear answer to "where does my request stand?" without status meetings', description: '' },
      { summary: 'Configure in the tool as board swimlanes, labels, or custom field depending on tool selected in WM-OC-03', description: '' }
    ]},
    { id: 'WM-OC-06.4', title: 'Triage Cadence Evaluation', owner: 'Bryan + Dynamo', tasks: [
      { summary: 'Evaluate whether twice-weekly can move to weekly', description: '' },
      { summary: 'Signals the team is ready: queue inflow predictable, mid-session expedites rare, team pulling from queue consistently, triage sessions finishing under 30 minutes', description: '' },
      { summary: 'If conditions aren\'t met, stay at twice weekly. Weekly is the target, not a deadline', description: '' }
    ]}
  ],
  'WM-OC-07': [
    { id: 'WM-OC-07.1', title: 'Board Freshness Monitoring', owner: 'Dynamo', tasks: [
      { summary: 'Implement automated or manual board freshness tracking: % of items with status update in last 5 business days', description: '' },
      { summary: 'Surface stale items at each triage ceremony', description: '' },
      { summary: 'Track freshness trend over time', description: '' }
    ]},
    { id: 'WM-OC-07.2', title: 'Staleness Detection and Correction Process', owner: 'Bryan + Dynamo', tasks: [
      { summary: 'Define what "stale" means (>5 business days without update is the starting threshold)', description: '' },
      { summary: 'Establish lightweight correction process: stale items flagged at triage, owner asked to update or explain', description: '' },
      { summary: 'If staleness persists for specific engineers, investigate whether the issue is habit, tool friction, or workload', description: '' }
    ]},
    { id: 'WM-OC-07.3', title: 'Board Trust Validation', owner: 'Bryan + Andy', tasks: [
      { summary: 'Informal validation: Bryan and Andy confirm the board reflects reality', description: '' },
      { summary: 'Check for shadow systems: spreadsheets, personal lists, or email threads that contain work information not on the board', description: '' },
      { summary: 'If shadow systems exist, determine why (friction, missing features, habit) and address root cause', description: '' }
    ]}
  ],
  'WM-OC-08': [
    { id: 'WM-OC-08.1', title: 'Flow Metrics Configuration', owner: 'Dynamo', tasks: [
      { summary: 'Configure cycle time, throughput, aging, and queue depth reporting in the selected tool', description: '' },
      { summary: 'Build views that show planned vs. reactive ratio by week, by engineer, by category', description: '' },
      { summary: 'Ensure metrics are accessible without requiring manual compilation', description: '' }
    ]},
    { id: 'WM-OC-08.2', title: 'Reference Estimates by Work Type', owner: 'Dynamo + Bryan', tasks: [
      { summary: 'Pull cycle time data by category after several months of categorized work has flowed through the system', description: '' },
      { summary: 'Identify clusters: customer environment builds average X hours, infrastructure tickets average Y days', description: '' },
      { summary: 'Document as reference ranges, not promises', description: '' },
      { summary: 'These baselines feed the capacity model for staffing conversations', description: '' }
    ]},
    { id: 'WM-OC-08.3', title: 'Scorecard Integration', owner: 'Dynamo + Bryan + Brent', tasks: [
      { summary: 'Connect flow metrics to the Engineering Scorecard (Workstream D alignment)', description: '' },
      { summary: 'Ensure Brent has access to capacity ratio view without attending operational ceremonies', description: '' },
      { summary: 'Metrics feed staffing conversations with numbers behind them, not qualitative assertions', description: '' }
    ]}
  ],
  'WM-OC-09': [
    { id: 'WM-OC-09.1', title: 'Prioritization Compliance Validation', owner: 'Bryan + Andy + Dynamo', tasks: [
      { summary: 'Observe patterns over 2-3 weeks: when priorities change in the system, does the team\'s actual work change?', description: '' },
      { summary: 'Measure side-door ratio trend: is invisible work declining?', description: '' },
      { summary: 'Validate that competing requests flow through triage, not around it', description: '' },
      { summary: 'Document any persistent bypasses and determine root cause', description: '' }
    ]},
    { id: 'WM-OC-09.2', title: 'Flow Retrospective Process', owner: 'Bryan + Dynamo', tasks: [
      { summary: 'Introduce biweekly or monthly retrospectives focused on flow', description: '' },
      { summary: 'Key question: "Where did work get stuck and why?" rather than "Did we finish everything?"', description: '' },
      { summary: 'This separates teams that stay disciplined from teams that regress', description: '' },
      { summary: 'Document the retrospective format for ongoing use after Dynamo engagement', description: '' }
    ]}
  ]
};

const workItems = [];
let epicCount = 0, storyCount = 0, subtaskCount = 0;

for (const oc of outcomes) {
  const epicSummary = `[${oc.id}] ${oc.title}`;
  workItems.push(wi('Epic', epicSummary, oc.title + '. ' + (oc.category ? 'Category: ' + oc.category + '. ' : '') + 'Target: ' + oc.target, ROOT_KEY, oc.id, oc.category, oc.target));
  epicCount++;

  const dels = deliverables[oc.id] || [];
  for (const d of dels) {
    const storySummary = `[${d.id}] ${d.title}`;
    workItems.push(wi('Story', storySummary, d.title, epicSummary, d.id, oc.category, oc.target, d.owner));
    storyCount++;

    let idx = 1;
    for (const t of d.tasks) {
      const subId = `${d.id}.${idx}`;
      workItems.push(wi('Sub-task', t.summary, t.description || '', storySummary, subId, '', '', d.owner));
      subtaskCount++;
      idx++;
    }
  }
}

// Action items: risks and decisions from WM-WBS (link to action item root WSA-2882)
const actionItems = [
  { issue_type: 'Action Item', summary: '[WM-R-01] Team provides "polished answers" rather than honest assessment', description: 'Risk: Team provides "polished answers" rather than honest assessment of how work actually flows. Mitigation: Frame as system improvement, not evaluation; demonstrate value through early quick wins.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-01', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-01', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-02] Discovery reveals more complexity than expected', description: 'Risk: Discovery reveals more complexity than expected (additional shadow systems, undocumented processes). Mitigation: Budget flexibility in weeks 1-2; document what is found and adjust operating model scope.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Low', item_id: 'WM-R-02', item_type: 'Risk', severity_or_type: 'LOW', related_outcome: 'WM-OC-01', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-03] Team over-designs the taxonomy', description: 'Risk: Team over-designs the taxonomy (too many categories, too many fields, too much granularity). Mitigation: Start minimal; iterate after 90 days of data.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-03', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-02', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-04] Disagreement on WIP limits stalls the operating model', description: 'Risk: Disagreement on WIP limits stalls the operating model. Mitigation: WIP limits will be wrong initially; set initial limits and agree to adjust based on data.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Low', item_id: 'WM-R-04', item_type: 'Risk', severity_or_type: 'LOW', related_outcome: 'WM-OC-02', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-05] Tool over-configuration during initial setup', description: 'Risk: Tool over-configuration during initial setup. Mitigation: Hard rule: no configuration beyond the operating agreement during setup. Iteration comes after adoption (WM-OC-06+).', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'High', item_id: 'WM-R-05', item_type: 'Risk', severity_or_type: 'HIGH', related_outcome: 'WM-OC-03', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-06] Tool selection delayed by stakeholder disagreement', description: 'Risk: Tool selection delayed by stakeholder disagreement or procurement process. Mitigation: Frame as fit-to-process; escalate to Brent if decision stalls beyond 1 week.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-06', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-03', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-07] 360 relationship question (WM-D-04) unresolved', description: 'Risk: 360 relationship question unresolved, creating confusion about where work lives. Mitigation: Resolve WM-D-04 before configuration begins.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-07', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-03', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-08] Queue cleanup consumes disproportionate energy', description: 'Risk: Queue cleanup consumes disproportionate energy if treated as a migration project. Mitigation: Triage the queue, don\'t migrate it wholesale. Timebox the review sessions.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-08', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-04', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-09] Adoption resistance', description: 'Risk: Adoption resistance. Team has operated without formal work management for a long time. Mitigation: Start with one category; frame as "making your work visible"; demonstrate value in first triage ceremonies.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'High', item_id: 'WM-R-09', item_type: 'Risk', severity_or_type: 'HIGH', related_outcome: 'WM-OC-05', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-10] Triage ceremony decay', description: 'Risk: Triage ceremony decay. Twice-weekly triage starts strong then gets skipped. Mitigation: Bryan owns the ceremony; Dynamo co-facilitates first 4-6 weeks.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Bryan', priority: 'High', item_id: 'WM-R-10', item_type: 'Risk', severity_or_type: 'HIGH', related_outcome: 'WM-OC-05', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-11] Side-door work capture is ignored', description: 'Risk: Side-door work capture is ignored because it feels like overhead. Mitigation: Frame as "two-minute entry that makes the capacity picture honest." Track capture rate as leading indicator.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-11', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-05', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-12] PagerDuty integration creates noise', description: 'Risk: PagerDuty integration creates noise -- auto-generated work items for trivial incidents. Mitigation: Configure integration with severity threshold; only P1/P2 incidents auto-create follow-up items initially.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-12', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-06', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-13] Commitment tier adoption adds complexity', description: 'Risk: Commitment tier adoption adds complexity that slows the team. Mitigation: Introduce tiers only after triage is running smoothly. If tiers create confusion, simplify to two tiers.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Low', item_id: 'WM-R-13', item_type: 'Risk', severity_or_type: 'LOW', related_outcome: 'WM-OC-06', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-14] Board accuracy erodes over time', description: 'Risk: Board accuracy erodes over time as initial enthusiasm fades. Mitigation: Make freshness a standing triage metric; Bryan reinforces as a team norm.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'High', item_id: 'WM-R-14', item_type: 'Risk', severity_or_type: 'HIGH', related_outcome: 'WM-OC-07', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-15] Shadow spreadsheets persist', description: 'Risk: Shadow spreadsheets persist because they serve a need the board doesn\'t. Mitigation: Investigate what shadow systems provide; add those features to the tool if justified.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-15', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-07', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-16] Measuring too early', description: 'Risk: Measuring too early -- pressure to show cycle time and throughput improvements before enough data exists. Mitigation: WM-M-2 success criteria focused on adoption metrics. Reference estimates require 90+ days of categorized data.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-16', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-08', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-17] Reference estimates create perception of "time tracking"', description: 'Risk: Reference estimates create a perception of "time tracking" and engineer pushback. Mitigation: Frame as team reference ranges from historical data, not individual performance measurement.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Low', item_id: 'WM-R-17', item_type: 'Risk', severity_or_type: 'LOW', related_outcome: 'WM-OC-08', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-18] System exists but doesn\'t govern', description: 'Risk: System exists but doesn\'t govern. Individual decisions still override the board. Mitigation: Bryan must enforce that priority changes go through the system. Brent reinforces at leadership level.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Bryan', priority: 'High', item_id: 'WM-R-18', item_type: 'Risk', severity_or_type: 'HIGH', related_outcome: 'WM-OC-09', required_by: '', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-R-19] Regression after Dynamo engagement ends', description: 'Risk: Regression after Dynamo engagement ends. Without external accountability, discipline fades. Mitigation: Build the retrospective habit before engagement ends. Flow metrics provide self-correcting signal.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Risk', owner: 'Dynamo', priority: 'Medium', item_id: 'WM-R-19', item_type: 'Risk', severity_or_type: 'MEDIUM', related_outcome: 'WM-OC-09', required_by: '', status: 'Open', component: COMPONENT },
  // Decisions
  { issue_type: 'Action Item', summary: '[WM-D-01] Routing function formalize into triage or Casora pre-screen?', description: 'Decision (TYPE 2): Does the routing function formalize into the triage ceremony, or does Casora\'s role continue as a pre-triage screening step? Owner: Bryan + Andy. Required By: WM-OC-02.4.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan + Andy', priority: 'Medium', item_id: 'WM-D-01', item_type: 'Decision', severity_or_type: 'TYPE 2', related_outcome: 'WM-OC-02', required_by: 'WM-OC-02.4', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-D-02] Triage group composition', description: 'Decision (TYPE 2): What is the right triage group? Bryan + Andy + routing function owner, or smaller? Owner: Bryan. Required By: WM-OC-02.4.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan', priority: 'Medium', item_id: 'WM-D-02', item_type: 'Decision', severity_or_type: 'TYPE 2', related_outcome: 'WM-OC-02', required_by: 'WM-OC-02.4', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-D-03] Progress Engineering in initial rollout or phased?', description: 'Decision (TYPE 2): Should Progress Engineering (Bob Dixon\'s side) be included in initial rollout or phased in after Systems Engineering adopts? Owner: Bryan + Brent. Required By: WM-OC-02.6.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan + Brent', priority: 'Medium', item_id: 'WM-D-03', item_type: 'Decision', severity_or_type: 'TYPE 2', related_outcome: 'WM-OC-02', required_by: 'WM-OC-02.6', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-D-04] Relationship between work management system and 360', description: 'Decision (TYPE 1): What is the relationship between the work management system and 360? Does 360 remain intake with promotion, or does the new system replace 360 for engineering work? Owner: Bryan + Andy + Brent. Required By: WM-OC-03.1.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan + Andy + Brent', priority: 'High', item_id: 'WM-D-04', item_type: 'Decision', severity_or_type: 'TYPE 1', related_outcome: 'WM-OC-03', required_by: 'WM-OC-03.1', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-D-05] Tool selection', description: 'Decision (TYPE 2): Tool selection (Jira, GitHub Projects, Teamwork, monday.com, Shortcut, or other). Owner: Bryan + Andy + Brent. Required By: WM-OC-03.2.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan + Andy + Brent', priority: 'Medium', item_id: 'WM-D-05', item_type: 'Decision', severity_or_type: 'TYPE 2', related_outcome: 'WM-OC-03', required_by: 'WM-OC-03.2', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-D-06] PagerDuty integration scope', description: 'Decision (TYPE 2): PagerDuty integration scope: all incidents or severity threshold? Owner: Bryan + Andy. Required By: WM-OC-06.2.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan + Andy', priority: 'Medium', item_id: 'WM-D-06', item_type: 'Decision', severity_or_type: 'TYPE 2', related_outcome: 'WM-OC-06', required_by: 'WM-OC-06.2', status: 'Open', component: COMPONENT },
  { issue_type: 'Action Item', summary: '[WM-D-07] Commitment tier model', description: 'Decision (TYPE 2): Commitment tier model: three tiers (committed/targeted/backlog) or two (committed/backlog)? Owner: Bryan. Required By: WM-OC-06.3.', link_to: ACTION_ITEM_ROOT_KEY, link_type: 'Related to', labels: 'Decision', owner: 'Bryan', priority: 'Medium', item_id: 'WM-D-07', item_type: 'Decision', severity_or_type: 'TYPE 2', related_outcome: 'WM-OC-06', required_by: 'WM-OC-06.3', status: 'Open', component: COMPONENT }
];

const payload = {
  metadata: {
    root_key: ROOT_KEY,
    label: 'Work Management',
    component: COMPONENT,
    action_item_root_key: ACTION_ITEM_ROOT_KEY,
    counts: {
      epics: epicCount,
      stories: storyCount,
      subtasks: subtaskCount,
      risks: 19,
      decisions: 7,
      total_work_items: epicCount + storyCount + subtaskCount,
      total_action_items: actionItems.length,
      grand_total: epicCount + storyCount + subtaskCount + actionItems.length
    },
    import_order: [
      `1. Import all items with issue_type = Epic (parent = ${ROOT_KEY})`,
      '2. Import all items with issue_type = Story (parent = their Epic summary)',
      '3. Import all items with issue_type = Sub-task (parent = their Story summary)',
      `4. Import Action Items -- link to ${ACTION_ITEM_ROOT_KEY} (action item root)`,
    ],
  },
  work_items: workItems,
  action_items: actionItems
};

const outDir = path.join(_wmPaths.wmDir, 'Output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, `${WM_FILE_PREFIX}-WBS-Jira-Import.json`);
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log('Wrote', outPath);
console.log('Counts: %d Epics, %d Stories, %d Sub-tasks, %d Action Items', epicCount, storyCount, subtaskCount, actionItems.length);
