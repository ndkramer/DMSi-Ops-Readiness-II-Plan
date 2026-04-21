/**
 * Live GitHub org Project (v2) → stalled/blocked by planning outcome (WM-OC-03, …).
 * Same org/project/labels as Stalled-Blocked/Stalled-Blocked-rpt.html; uses Lambda /github-proxy when hosted on *.lambda-url.*.on.aws.
 *
 * Exposes window.GithubStallLive: resolveGithubToken, fetchStallByOutcomeMap.
 * Token order: ?github_token= / ?gh_token=, localStorage dmsiStalledBlockedGithubPat, optional same-origin JSON (tokenFileUrl).
 */
(function (global) {
  'use strict';

  var CONFIG = {
    orgLogin: 'DynamoLLC-Hub',
    projectNumber: 1,
    labelNames: ['stalled', 'blocked']
  };

  var GITHUB_PAT_STORAGE_KEY = 'dmsiStalledBlockedGithubPat';
  var EXAMPLE_TOKEN_PLACEHOLDER = 'PASTE_YOUR_GITHUB_PAT_HERE_CLASSIC_OR_FINE_GRAINED';

  var GRAPHQL = [
    'query OrgProjectItems($org: String!, $projectNumber: Int!, $cursor: String) {',
    '  organization(login: $org) {',
    '    projectV2(number: $projectNumber) {',
    '      title',
    '      items(first: 50, after: $cursor) {',
    '        pageInfo { hasNextPage endCursor }',
    '        nodes {',
    '          id',
    '          content {',
    '            __typename',
    '            ... on Issue {',
    '              title',
    '              number',
    '              url',
    '              repository { name nameWithOwner }',
    '              labels(first: 30) { nodes { name } }',
    '            }',
    '            ... on PullRequest {',
    '              title',
    '              number',
    '              url',
    '              repository { name nameWithOwner }',
    '              labels(first: 30) { nodes { name } }',
    '            }',
    '            ... on DraftIssue { title }',
    '          }',
    '        }',
    '      }',
    '    }',
    '  }',
    '}'
  ].join('\n');

  var PREFIX_MAP = { wm: 'WM', vi: 'VI', pa: 'PA', wb: 'WB' };
  var LABEL_OC_RE = /^(wm|vi|pa|wb)-oc-(\d+)(\.\d+)?$/i;
  var TITLE_BRACKET_RE = /\[([A-Za-z]{2}-OC-\d+(?:\.\d+)?)\]/g;

  function isLambdaFunctionUrlHost() {
    try {
      var h = (global.location.hostname || '').toLowerCase();
      return h.indexOf('lambda-url') >= 0 || h.endsWith('.on.aws') || h.indexOf('.lambda-url.') >= 0;
    } catch (e) {
      return false;
    }
  }

  function useGithubProxy() {
    try {
      if (global.location.protocol === 'file:') return false;
      var q = new URLSearchParams(global.location.search || '');
      if (q.get('github_proxy') === '0') return false;
      if (q.get('github_proxy') === '1') return isLambdaFunctionUrlHost();
      return isLambdaFunctionUrlHost();
    } catch (e) {
      return false;
    }
  }

  function safePageOrigin() {
    try {
      var href = global.location.href;
      if (href && href.indexOf('http') === 0) {
        var u = new URL(href);
        if (u.origin && u.origin !== 'null') return u.origin;
      }
    } catch (e) { /* ignore */ }
    try {
      var o = global.location.origin;
      if (o && o !== 'null') return o;
    } catch (e2) { /* ignore */ }
    return '';
  }

  function withLambdaGate(url) {
    try {
      var q = new URLSearchParams(global.location.search || '');
      var t = q.get('token');
      if (!t) return url;
      var sep = url.indexOf('?') >= 0 ? '&' : '?';
      return url + sep + 'token=' + encodeURIComponent(t);
    } catch (e) {
      return url;
    }
  }

  function parseGithubJsonResponse(res, context) {
    return res.text().then(function (text) {
      var trimmed = (text || '').trim();
      if (!trimmed) {
        throw new Error((context || 'Request') + ': empty body (HTTP ' + res.status + ').');
      }
      if (trimmed.charAt(0) === '<') {
        throw new Error(
          (context || 'Request') + ' returned HTML (HTTP ' + res.status + '). For Lambda add ?token= gate if required.'
        );
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error((context || 'Request') + ': bad JSON (HTTP ' + res.status + ').');
      }
    });
  }

  function githubGraphqlFetch(token, query, variables) {
    var origin = safePageOrigin();
    if (useGithubProxy() && !origin) {
      return Promise.reject(
        new Error(
          'GitHub proxy: cannot resolve page origin; use full Lambda URL (*.on.aws) in iframe src or open in a new tab.'
        )
      );
    }
    var url = useGithubProxy()
      ? withLambdaGate((origin || '') + '/github-proxy/graphql')
      : 'https://api.github.com/graphql';
    var headers = { 'Content-Type': 'application/json' };
    var body;
    if (useGithubProxy()) {
      body = JSON.stringify({ query: query, variables: variables, github_token: token });
    } else {
      headers['Authorization'] = 'Bearer ' + token;
      body = JSON.stringify({ query: query, variables: variables });
    }
    return fetch(url, { method: 'POST', headers: headers, body: body });
  }

  function getTokenFromQuery() {
    try {
      var q = new URLSearchParams(global.location.search || '');
      var t = q.get('github_token') || q.get('gh_token');
      return t ? String(t).trim() : null;
    } catch (e) {
      return null;
    }
  }

  function getStoredGithubToken() {
    try {
      var t = global.localStorage.getItem(GITHUB_PAT_STORAGE_KEY);
      return t ? String(t).trim() : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {{ tokenFileUrl?: string }} opts - Optional absolute URL to Stalled-Blocked-github-token.local.json (same origin).
   * @returns {Promise<string|null>}
   */
  function resolveGithubToken(opts) {
    var fromQ = getTokenFromQuery() || getStoredGithubToken();
    if (fromQ) return Promise.resolve(fromQ);
    var fileUrl = opts && opts.tokenFileUrl;
    if (!fileUrl || global.location.protocol === 'file:') return Promise.resolve(null);
    return fetch(fileUrl, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        var raw = data && (data.github_token || data.gh_token || data.token);
        raw = raw ? String(raw).trim() : '';
        if (!raw || raw === EXAMPLE_TOKEN_PLACEHOLDER) return null;
        return raw;
      })
      .catch(function () {
        return null;
      });
  }

  function labelMatchesStalledBlocked(labelNodes) {
    var want = {};
    CONFIG.labelNames.forEach(function (n) {
      want[n.toLowerCase()] = true;
    });
    return labelNodes.some(function (l) {
      return want[(l.name || '').toLowerCase()];
    });
  }

  function stallKindFromLabels(labelNodes) {
    var names = labelNodes.map(function (l) {
      return (l.name || '').toLowerCase();
    });
    if (names.indexOf('blocked') >= 0) return 'blocked';
    if (names.indexOf('stalled') >= 0) return 'stalled';
    return null;
  }

  function rollupOutcomeId(id) {
    var u = id.toUpperCase();
    var m = u.match(/^([A-Z]{2}-OC-\d+)/);
    return m ? m[0] : null;
  }

  function outcomeIdsFromLabels(labelNodes) {
    var out = {};
    for (var i = 0; i < labelNodes.length; i++) {
      var name = (labelNodes[i].name || '').trim();
      var m = name.match(LABEL_OC_RE);
      if (!m) continue;
      var cap = PREFIX_MAP[m[1].toLowerCase()];
      if (!cap) continue;
      var rolled = rollupOutcomeId(cap + '-OC-' + m[2]);
      if (rolled) out[rolled] = true;
    }
    return Object.keys(out);
  }

  function outcomeIdsFromTitle(title) {
    var out = {};
    var t = title || '';
    TITLE_BRACKET_RE.lastIndex = 0;
    var m;
    while ((m = TITLE_BRACKET_RE.exec(t)) !== null) {
      var rolled = rollupOutcomeId(m[1]);
      if (rolled && /^(WM|VI|PA|WB)-OC-\d+$/.test(rolled)) out[rolled] = true;
    }
    return Object.keys(out);
  }

  function collectOutcomeIds(labelNodes, title) {
    var set = {};
    outcomeIdsFromLabels(labelNodes).forEach(function (id) {
      set[id] = true;
    });
    outcomeIdsFromTitle(title).forEach(function (id) {
      set[id] = true;
    });
    return Object.keys(set);
  }

  function fetchAllProjectItems(token) {
    var allNodes = [];

    function page(cursor) {
      return githubGraphqlFetch(token, GRAPHQL, {
        org: CONFIG.orgLogin,
        projectNumber: CONFIG.projectNumber,
        cursor: cursor
      })
        .then(function (res) {
          return parseGithubJsonResponse(res, 'GitHub GraphQL');
        })
        .then(function (json) {
          if (json.errors && json.errors.length) {
            throw new Error(json.errors.map(function (e) { return e.message; }).join('; '));
          }
          var org = json.data && json.data.organization;
          if (!org || !org.projectV2) {
            throw new Error(
              'GitHub project not found: org ' + CONFIG.orgLogin + ' project #' + CONFIG.projectNumber +
                ' (token scopes / SSO / classic vs new project).'
            );
          }
          var conn = org.projectV2.items;
          if (conn && conn.nodes) {
            conn.nodes.forEach(function (n) {
              allNodes.push(n);
            });
          }
          if (conn && conn.pageInfo && conn.pageInfo.hasNextPage) {
            return page(conn.pageInfo.endCursor);
          }
          return allNodes;
        });
    }

    return page(null);
  }

  function buildByOutcomeMap(nodes) {
    var byOutcome = {};
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var c = n.content;
      if (!c || c.__typename === 'DraftIssue') continue;
      if (c.__typename !== 'Issue' && c.__typename !== 'PullRequest') continue;
      var labelNodes = (c.labels && c.labels.nodes) || [];
      if (!labelMatchesStalledBlocked(labelNodes)) continue;
      var kind = stallKindFromLabels(labelNodes);
      if (!kind) continue;
      var oids = collectOutcomeIds(labelNodes, c.title);
      if (!oids.length) continue;
      var entry = {
        number: c.number,
        title: c.title,
        url: c.url,
        repository: c.repository ? { nameWithOwner: c.repository.nameWithOwner } : undefined
      };
      for (var j = 0; j < oids.length; j++) {
        var oid = oids[j];
        if (!byOutcome[oid]) byOutcome[oid] = { stalled: [], blocked: [] };
        byOutcome[oid][kind].push(entry);
      }
    }
    return byOutcome;
  }

  /**
   * @param {string} token - GitHub PAT
   * @returns {Promise<Record<string, { stalled: object[], blocked: object[] }>>}
   */
  function fetchStallByOutcomeMap(token) {
    if (!token || !String(token).trim()) return Promise.resolve({});
    return fetchAllProjectItems(String(token).trim()).then(function (nodes) {
      return buildByOutcomeMap(nodes);
    });
  }

  /**
   * Build href to the Stalled-Blocked report HTML with deep-link query params (repo/issue or issue_url) and token passthrough from the current page.
   * @param {{ number?: number, url?: string, repository?: { nameWithOwner?: string } }} entry
   * @param {string} reportPath - e.g. '../../Project-Plan/Stalled-Blocked/Stalled-Blocked-rpt.html'
   * @returns {string}
   */
  function buildStalledBlockedReportUrl(entry, reportPath) {
    reportPath = reportPath || 'Stalled-Blocked/Stalled-Blocked-rpt.html';
    var p = new URLSearchParams();
    try {
      var cur = new URLSearchParams(
        typeof global.location !== 'undefined' && global.location.search ? global.location.search : ''
      );
      var tok = cur.get('token');
      var gh = cur.get('github_token') || cur.get('gh_token');
      if (tok) p.set('token', tok);
      if (gh) p.set('github_token', gh);
    } catch (e) {
      /* ignore */
    }
    if (entry) {
      var repo = entry.repository && entry.repository.nameWithOwner;
      var num = entry.number;
      if (repo && num != null && String(num) !== '') {
        p.set('repo', repo);
        p.set('issue', String(num));
      } else if (entry.url) {
        p.set('issue_url', entry.url);
      }
    }
    var qs = p.toString();
    if (!qs) return reportPath;
    var sep = reportPath.indexOf('?') >= 0 ? '&' : '?';
    return reportPath + sep + qs;
  }

  global.GithubStallLive = {
    CONFIG: CONFIG,
    resolveGithubToken: resolveGithubToken,
    fetchStallByOutcomeMap: fetchStallByOutcomeMap,
    buildStalledBlockedReportUrl: buildStalledBlockedReportUrl,
    GITHUB_PAT_STORAGE_KEY: GITHUB_PAT_STORAGE_KEY
  };
})(typeof window !== 'undefined' ? window : this);
