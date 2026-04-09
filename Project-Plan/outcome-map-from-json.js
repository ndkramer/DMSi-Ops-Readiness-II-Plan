/**
 * Shared helpers for capability Outcome Map HTML pages: load *-outcomes.json (with optional
 * embedded #*-outcomes-fallback for file://) and normalize timeline rows for rendering.
 */
(function (global) {
  'use strict';

  function fetchJsonPreferFile(url, fallbackElId) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return Promise.reject(new Error('HTTP ' + r.status));
        return r.json();
      })
      .catch(function () {
        var el = fallbackElId && document.getElementById(fallbackElId);
        if (!el || !String(el.textContent || '').trim()) {
          return Promise.reject(new Error('fallback missing'));
        }
        return JSON.parse(el.textContent.trim());
      });
  }

  function parseAnchorDate(anchor) {
    var parts = String(anchor || '').split('-');
    if (parts.length !== 3) return new Date(2026, 2, 16);
    var y = parseInt(parts[0], 10);
    var mo = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    return new Date(y, mo, d);
  }

  function buildPaOutcomes(data) {
    var grid = data.outcome_map || {};
    var totalWeeks = grid.total_weeks || 34;
    var startDate = parseAnchorDate(grid.week_1_anchor || '2026-03-16');

    var weekDates = {};
    for (var w = 1; w <= totalWeeks; w++) {
      var d = new Date(startDate);
      d.setDate(d.getDate() + (w - 1) * 7);
      var endD = new Date(d);
      endD.setDate(endD.getDate() + 4);
      weekDates[w] = {
        start: d.getMonth() + 1 + '/' + d.getDate(),
        end: endD.getMonth() + 1 + '/' + endD.getDate(),
        month: d.toLocaleString('en-US', { month: 'short' })
      };
    }

    function dateRange(startWk, endWk) {
      if (!weekDates[startWk] || !weekDates[endWk]) return '';
      return weekDates[startWk].start + ' - ' + weekDates[endWk].end;
    }

    function paMapNameFromTitle(title) {
      if (!title) return '';
      return String(title).replace(/^\[PA-OC-\d{2}\]\s+/i, '').trim() || title;
    }

    var rows = (data.outcomes || []).map(function (o) {
      var t = o.timeline || {};
      var start = t.start != null ? t.start : 0;
      var end = t.end != null ? t.end : 0;
      var dates = t.dates_label;
      if (dates == null || dates === '') {
        if (start > 0 && end > 0) dates = dateRange(start, end);
        else dates = 'Trigger-activated';
      }
      var row = {
        id: o.id,
        name: t.map_title || paMapNameFromTitle(o.title),
        cat: t.cat || t.category || 'Baseline',
        start: start,
        end: end,
        deps: t.deps || [],
        risk: t.risk || '',
        deliverables: t.deliverables != null ? t.deliverables : 0,
        milestone: t.milestone || '',
        status: (o.status != null && o.status !== '') ? o.status : (t.status || ''),
        dates: dates,
        detail: t.detail || ''
      };
      if (t.conditional && typeof t.conditional === 'object') {
        row.conditional = t.conditional;
      }
      if (t.placeholder_text) row.placeholder_text = t.placeholder_text;
      return row;
    });

    return {
      outcomes: rows,
      totalWeeks: totalWeeks,
      projectStart: startDate,
      weekDates: weekDates
    };
  }

  function buildWmPayload(data) {
    var grid = data.outcome_map || {};
    var outcomes = (data.outcomes || []).map(function (o) {
      return {
        id: o.id,
        name: o.title || o.name,
        cat: o.cat,
        start: o.start,
        end: o.end,
        deps: o.deps || [],
        risk: o.risk || '',
        deliverables: o.deliverables,
        milestone: o.milestone || '',
        status: o.status || '',
        dateRange: o.date_range || o.dateRange || '',
        detail: o.detail || ''
      };
    });
    return {
      outcomes: outcomes,
      columnLabels: grid.column_labels || [],
      deadlineColumn: grid.deadline_column != null ? grid.deadline_column : 15,
      dependencyFlow: data.dependency_flow || null
    };
  }

  function buildViPayload(data) {
    var grid = data.outcome_map || {};
    var outcomes = (data.outcomes || []).map(function (o) {
      return {
        id: o.id,
        name: o.title || o.name,
        cat: o.cat,
        start: o.start,
        end: o.end,
        deps: o.deps || [],
        risk: o.risk || '',
        deliverables: o.deliverables,
        milestone: o.milestone || '',
        status: o.status || '',
        dateRange: o.date_range || o.dateRange || '',
        detail: o.detail || ''
      };
    });
    return {
      outcomes: outcomes,
      columnLabels: grid.column_labels || [],
      trackStart: grid.track_start ? parseAnchorDate(grid.track_start) : new Date(2026, 2, 1),
      trackEnd: grid.track_end ? parseAnchorDate(grid.track_end) : new Date(2026, 10, 1)
    };
  }

  function buildWbPayload(data) {
    var grid = data.outcome_map || {};
    return {
      outcomes: (data.outcomes || []).map(function (o) {
        return {
          id: o.id,
          name: o.name || o.title || '',
          cat: o.cat,
          start: o.start,
          end: o.end,
          deps: o.deps || [],
          risk: o.risk || '',
          deliverables: o.deliverables,
          dateRange: o.date_range || o.dateRange || '',
          detail: o.detail || ''
        };
      }),
      totalColumns: grid.total_columns || 18
    };
  }

  global.OutcomeMapFromJson = {
    fetchJsonPreferFile: fetchJsonPreferFile,
    buildPaOutcomes: buildPaOutcomes,
    buildWmPayload: buildWmPayload,
    buildViPayload: buildViPayload,
    buildWbPayload: buildWbPayload,
    parseAnchorDate: parseAnchorDate
  };
})(typeof window !== 'undefined' ? window : this);
