/**
 * Dynamo-OS planning toolkit config (DMSI-Op-Readiness-II-Plan).
 * Validate: node ../dynamo-os/planning-toolkit/bin/cli.js config validate
 * (or npm link dynamo-os-planning-toolkit && dynamo-plan config validate)
 */
module.exports = {
  projectRoot: '.',
  capabilities: {
    PA: {
      diskPath: 'WSA/PA',
      filePrefix: 'PA',
      jiraCapabilityRoot: 'WSA-2656',
      jiraActionItemRoot: 'WSA-2657',
    },
    VI: {
      diskPath: 'WSA/VI',
      filePrefix: 'VI',
      jiraCapabilityRoot: 'WSA-508',
      jiraActionItemRoot: 'WSA-509',
    },
    WM: {
      diskPath: 'WSA/WM',
      filePrefix: 'WM',
      jiraCapabilityRoot: 'WSA-2881',
      jiraActionItemRoot: 'WSA-2882',
    },
    WB: {
      diskPath: 'WSB-WSC/WB',
      filePrefix: 'WB',
      jiraCapabilityRoot: 'WSA-TBD-WB-CAPABILITY',
      jiraActionItemRoot: 'WSA-TBD-WB-ACTION-ITEMS',
    },
  },
  jira: {
    envFile: '.cursor/.env',
    /** Emit `{cap}-kanban-jira-status.{json,js}` after export for these capabilities (PA-kanban.html). */
    kanbanFromExportFor: ['PA'],
  },
  gantt: {
    wbsPaths: ['WSA/WM/WM-WBS.md', 'WSA/VI/VI-WBS.md', 'WSA/PA/PA-WBS.md'],
    baseYear: 2026,
    output: 'Project-Plan/gantt-data.json',
    inlineHtml: 'Project-Plan/Combined-Outcome-Gantt.html',
  },
  capabilityMap: {
    state: 'Capability-map/capability-map-state.json',
    html: 'Capability-map/capability-map.html',
    wsbWscHtml: 'WSB-WSC/WSB-WSC-Outcome-Map.html',
    baseYear: 2026,
    outcomeHtml: {
      WM: 'WM-Outcome-Map.html',
      VI: 'VI-WSB-Outcome-Map.html',
      PA: 'PA-Outcome-map.html',
    },
  },
};
