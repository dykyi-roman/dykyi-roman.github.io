/* ===== GitFlow Visualizer Engine ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

/* ===== Helpers ===== */
GFV.jira = function() { return 'JIRA-' + (Math.floor(Math.random() * 900) + 100); };

/* ===== State ===== */
GFV.state = {
    flow: 'classic',
    mode: null,
    running: false,
    paused: false,
    _pauseResolve: null,
    stepIndex: 0,
    stepDelay: 600,

    branches: 0,
    commits: 0,
    merges: 0,
    prs: 0,

    _flowSteps: null,
    _flowOptions: null
};

GFV._t = function(key, params, fallback) {
    return (window.I18N && I18N.t) ? I18N.t(key, params, fallback) : (fallback !== undefined ? fallback : '');
};

GFV._stepPrefix = function(n) {
    return GFV._t('ui.log.step', { n: n }, 'Step ' + n);
};

/* ===== Graph State (tracks SVG positions) ===== */
GFV.graph = {
    branches: {},
    commitX: 0,
    nextY: 40,
    svgWidth: 1100,
    svgHeight: 500,
    labelWidth: 150,
    branchSpacing: 100,
    commitSpacing: 70,
    commitRadius: 8
};

/* ===== Event Log ===== */
GFV.log = function(type, text) {
    var logEl = document.getElementById('event-log');
    if (!logEl) return;
    var now = new Date();
    var ts = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    var entry = document.createElement('div');
    entry.className = 'log-entry';

    var timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = ts;

    var typeSpan = document.createElement('span');
    typeSpan.className = 'log-type ' + type;
    var typeKey = (type || '').toUpperCase();
    typeSpan.textContent = GFV._t('ui.log.type.' + typeKey, null, typeKey);

    var textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(typeSpan);
    entry.appendChild(textSpan);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

GFV.clearLog = function() {
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

GFV.copyLog = function() {
    var logEl = document.getElementById('event-log');
    if (!logEl) return;
    var entries = logEl.querySelectorAll('.log-entry');
    var lines = Array.from(entries).map(function(e) {
        var time = e.querySelector('.log-time');
        var type = e.querySelector('.log-type');
        var text = e.querySelector('.log-text');
        return (time ? time.textContent : '') + ' ' + (type ? type.textContent : '') + ' ' + (text ? text.textContent : '');
    });
    navigator.clipboard.writeText(lines.join('\n')).then(function() {
        var btn = document.getElementById('btn-copy-log');
        if (!btn) return;
        btn.textContent = I18N.t('ui.btn.copied', null, 'Copied!');
        setTimeout(function() { btn.textContent = I18N.t('ui.btn.copy', null, 'Copy'); }, 1500);
    });
};

/* ===== Stats ===== */
GFV.updateStats = function() {
    var s = GFV.state;
    var el;
    el = document.getElementById('stat-branches');
    if (el) el.textContent = s.branches;
    el = document.getElementById('stat-commits');
    if (el) el.textContent = s.commits;
    el = document.getElementById('stat-merges');
    if (el) el.textContent = s.merges;
    el = document.getElementById('stat-prs');
    if (el) el.textContent = s.prs;
};

GFV.resetStats = function() {
    var s = GFV.state;
    s.branches = 0;
    s.commits = 0;
    s.merges = 0;
    s.prs = 0;
    s.stepIndex = 0;
    s.running = false;
    GFV.updateStats();
};

/* ===== Helpers ===== */
GFV.sleep = async function(ms) {
    await new Promise(function(r) { setTimeout(r, ms); });
    while (GFV.state.paused) {
        await new Promise(function(r) { GFV.state._pauseResolve = r; });
    }
};

GFV.pause = function() {
    GFV.state.paused = true;
};

GFV.resume = function() {
    GFV.state.paused = false;
    if (GFV.state._pauseResolve) {
        GFV.state._pauseResolve();
        GFV.state._pauseResolve = null;
    }
};

/* ===== SVG Namespace Helper ===== */
GFV._svgNS = 'http://www.w3.org/2000/svg';

GFV._createSVG = function(tag, attrs) {
    var el = document.createElementNS(GFV._svgNS, tag);
    if (attrs) {
        Object.keys(attrs).forEach(function(k) {
            el.setAttribute(k, attrs[k]);
        });
    }
    return el;
};

/* ===== Accent Colors ===== */
GFV.setAccentColors = function(flowId) {
    var root = document.documentElement.style;
    var themes = {
        classic:        { accent: '#89b4fa', bg: '#161830', light: '#1e2248' },
        github:         { accent: '#a6e3a1', bg: '#0d1f18', light: '#153024' },
        gitlab:         { accent: '#fab387', bg: '#1f150d', light: '#302015' },
        trunk:          { accent: '#cba6f7', bg: '#1a1630', light: '#241e48' },
        oneflow:        { accent: '#f9e2af', bg: '#1f1a0d', light: '#302615' },
        environment:    { accent: '#94e2d5', bg: '#0d1f1a', light: '#153025' },
        release:        { accent: '#f38ba8', bg: '#1f0d15', light: '#301520' },
        forking:        { accent: '#89dceb', bg: '#0d1a1f', light: '#152530' },
        'ship-show-ask':{ accent: '#eba0ac', bg: '#1f0d12', light: '#30151d' },
        scaled:         { accent: '#74c7ec', bg: '#0d1820', light: '#152535' },
        cherrypick:     { accent: '#f5c2e7', bg: '#1f0d1a', light: '#301524' }
    };
    var t = themes[flowId] || themes.classic;
    root.setProperty('--gfv-accent', t.accent);
    root.setProperty('--gfv-accent-bg', t.bg);
    root.setProperty('--gfv-accent-light', t.light);
};

/* ===== Branch Color Map ===== */
GFV.branchColors = {
    'main': '#a6e3a1',
    'master': '#a6e3a1',
    'develop': '#89b4fa',
    'feature': '#cba6f7',
    'feature/*': '#cba6f7',
    'release': '#f9e2af',
    'release/*': '#f9e2af',
    'hotfix': '#f38ba8',
    'hotfix/*': '#f38ba8',
    'fix': '#f38ba8',
    'fix/*': '#f38ba8',
    'staging': '#94e2d5',
    'production': '#fab387',
    'qa': '#89dceb',
    'team': '#74c7ec',
    'team/*': '#74c7ec',
    'program': '#eba0ac',
    'program/*': '#eba0ac',
    'upstream/main': '#a6e3a1',
    'origin/main': '#89b4fa'
};

GFV.getBranchColor = function(branchName) {
    if (GFV.branchColors[branchName]) return GFV.branchColors[branchName];
    var base = branchName.split('/')[0];
    if (GFV.branchColors[base + '/*']) return GFV.branchColors[base + '/*'];
    if (GFV.branchColors[base]) return GFV.branchColors[base];
    var colors = ['#cba6f7', '#89dceb', '#f5c2e7', '#74c7ec', '#eba0ac', '#94e2d5'];
    var hash = 0;
    for (var i = 0; i < branchName.length; i++) hash = ((hash << 5) - hash) + branchName.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
};

/* ===== Step Number Badge ===== */
GFV._addStepNumber = function(svg, x, y, num, tooltip) {
    var vizArea = document.querySelector('.viz-area');
    var g = GFV._createSVG('g', { class: 'gfv-step-num gfv-fade-in' });
    g.style.cursor = tooltip ? 'help' : 'default';

    /* Invisible hit area (larger than visible circle) to catch hover reliably */
    var hit = GFV._createSVG('circle', {
        cx: x, cy: y + 18, r: 18,
        fill: 'transparent', stroke: 'none', class: 'gfv-step-hit'
    });
    g.appendChild(hit);

    var bg = GFV._createSVG('circle', {
        cx: x, cy: y + 18, r: 11,
        fill: 'rgba(255,255,255,0.15)', stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 1.5
    });
    g.appendChild(bg);
    var txt = GFV._createSVG('text', {
        x: x, y: y + 18,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: 'rgba(255,255,255,0.75)', 'font-size': '12px', 'font-weight': 'bold',
        'pointer-events': 'none'
    });
    txt.textContent = num;
    g.appendChild(txt);

    if (tooltip) {
        g.addEventListener('mouseenter', function() {
            var old = document.querySelector('.gfv-tooltip');
            if (old) old.remove();

            var tip = document.createElement('div');
            tip.className = 'gfv-tooltip';
            tip.textContent = tooltip;
            document.body.appendChild(tip);

            var bbox = g.getBoundingClientRect();
            var tipW = tip.offsetWidth;
            var tipH = tip.offsetHeight;
            var left = bbox.left + bbox.width / 2 - tipW / 2;
            var top = bbox.top - tipH - 8;

            if (left < 4) left = 4;
            if (left + tipW > window.innerWidth - 4) left = window.innerWidth - tipW - 4;
            if (top < 4) top = bbox.bottom + 8;

            tip.style.left = left + 'px';
            tip.style.top = top + 'px';
            tip.classList.add('visible');
        });
        g.addEventListener('mouseleave', function() {
            var tip = document.querySelector('.gfv-tooltip');
            if (tip) tip.remove();
        });
    }

    svg.appendChild(g);
};

/* ===== Init Graph (SVG canvas setup) ===== */
GFV.initGraph = function(branchNames, options) {
    var svg = document.getElementById('gfv-canvas');
    if (!svg) return;
    svg.innerHTML = '';

    var g = GFV.graph;
    g.branches = {};
    g.commitX = g.labelWidth;
    g.nextY = 40;

    var opts = options || {};
    g.svgWidth = opts.width || 1100;
    g.svgHeight = opts.height || (40 + branchNames.length * g.branchSpacing + 40);
    g.labelWidth = opts.labelWidth || 150;
    g.commitSpacing = opts.commitSpacing || 70;

    svg.setAttribute('viewBox', '0 0 ' + g.svgWidth + ' ' + g.svgHeight);
    svg.setAttribute('height', g.svgHeight);

    branchNames.forEach(function(name) {
        var color = GFV.getBranchColor(name);
        var y = g.nextY;
        g.branches[name] = { y: y, color: color, commits: [], headX: g.labelWidth };
        g.nextY += g.branchSpacing;

        var line = GFV._createSVG('line', {
            x1: g.labelWidth, y1: y, x2: g.svgWidth - 20, y2: y,
            stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.25,
            class: 'gfv-branch-line'
        });
        svg.appendChild(line);

        var label = GFV._createSVG('text', {
            x: 10, y: y,
            class: 'gfv-branch-label',
            fill: color
        });
        label.textContent = name;
        svg.appendChild(label);
    });

    g.commitX = g.labelWidth + 40;
    return svg;
};

/* ===== Add Zone Separator (for forking workflow) ===== */
GFV.addZoneSeparator = function(yPos, label) {
    var svg = document.getElementById('gfv-canvas');
    if (!svg) return;
    var g = GFV.graph;

    var line = GFV._createSVG('line', {
        x1: 0, y1: yPos, x2: g.svgWidth, y2: yPos,
        class: 'gfv-zone-separator'
    });
    svg.appendChild(line);

    if (label) {
        var text = GFV._createSVG('text', {
            x: g.svgWidth / 2, y: yPos - 8,
            class: 'gfv-zone-label'
        });
        text.textContent = label;
        svg.appendChild(text);
    }
};

/* ===== Add Zone Label (right-aligned description for a branch row) ===== */
GFV.addZoneLabel = function(yPos, label) {
    var svg = document.getElementById('gfv-canvas');
    if (!svg) return;
    var g = GFV.graph;

    var badgeW = label.length * 7 + 16;
    var badgeH = 20;
    var bx = g.svgWidth - 14 - badgeW;
    var labelY = yPos - 20;
    var by = labelY - badgeH / 2;

    var rect = GFV._createSVG('rect', {
        x: bx, y: by,
        width: badgeW, height: badgeH,
        rx: 4, ry: 4,
        fill: 'rgba(255,255,255,0.08)',
        stroke: 'rgba(255,255,255,0.2)',
        'stroke-width': 1
    });
    svg.appendChild(rect);

    var text = GFV._createSVG('text', {
        x: bx + badgeW / 2, y: labelY,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: 'rgba(255,255,255,0.6)',
        'font-size': '11px',
        'font-weight': '600',
        'letter-spacing': '0.5px'
    });
    text.textContent = label;
    svg.appendChild(text);
};

/* ===== Add Commit ===== */
GFV.addCommit = function(branch, label) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var b = g.branches[branch];
    if (!svg || !b) return null;

    var x = g.commitX;
    var y = b.y;
    g.commitX += g.commitSpacing;
    b.headX = x;
    b.commits.push({ x: x, y: y });

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var circle = GFV._createSVG('circle', {
        cx: x, cy: y, r: g.commitRadius,
        fill: b.color, class: 'gfv-commit'
    });
    group.appendChild(circle);

    if (label) {
        var text = GFV._createSVG('text', {
            x: x, y: y - 14,
            class: 'gfv-commit-label',
            'text-anchor': 'middle'
        });
        text.textContent = label;
        group.appendChild(text);
    }

    svg.appendChild(group);
    GFV.state.commits++;
    GFV.updateStats();
    return { x: x, y: y };
};

/* ===== Add Branch (visual fork from parent) ===== */
GFV.addBranch = function(fromBranch, newBranch) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var from = g.branches[fromBranch];
    if (!svg || !from) return;

    var to = g.branches[newBranch];
    if (!to) return;

    var startX = from.headX || g.labelWidth;
    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var path = GFV._createSVG('path', {
        d: 'M ' + startX + ' ' + from.y + ' C ' +
            (startX + 30) + ' ' + from.y + ' ' +
            (startX + 30) + ' ' + to.y + ' ' +
            (startX + 50) + ' ' + to.y,
        stroke: to.color,
        'stroke-width': 2,
        fill: 'none',
        opacity: 0.6,
        class: 'gfv-merge-path'
    });
    group.appendChild(path);

    if (from.commits.length > 0) {
        var circle = GFV._createSVG('circle', {
            cx: startX, cy: from.y, r: 4,
            fill: from.color, class: 'gfv-commit'
        });
        group.appendChild(circle);
    }

    svg.appendChild(group);

    var curveEnd = startX + 50;
    to.headX = curveEnd;
    if (g.commitX < curveEnd + 40) {
        g.commitX = curveEnd + 40;
    }

    GFV.state.branches++;
    GFV.updateStats();
};

/* ===== Add Merge ===== */
GFV.addMerge = function(fromBranch, toBranch, label) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var from = g.branches[fromBranch];
    var to = g.branches[toBranch];
    if (!svg || !from || !to) return null;

    var x = g.commitX;
    var fromX = from.headX || (x - g.commitSpacing);
    g.commitX += g.commitSpacing;
    to.headX = x;
    to.commits.push({ x: x, y: to.y });

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var midX = (fromX + x) / 2;
    var path = GFV._createSVG('path', {
        d: 'M ' + fromX + ' ' + from.y + ' C ' +
            midX + ' ' + from.y + ' ' +
            midX + ' ' + to.y + ' ' +
            x + ' ' + to.y,
        stroke: from.color,
        'stroke-width': 2,
        fill: 'none',
        opacity: 0.7,
        class: 'gfv-merge-path'
    });
    group.appendChild(path);

    var circle = GFV._createSVG('circle', {
        cx: x, cy: to.y, r: g.commitRadius + 1,
        fill: to.color, stroke: from.color, 'stroke-width': 2,
        class: 'gfv-commit'
    });
    group.appendChild(circle);

    if (label) {
        var text = GFV._createSVG('text', {
            x: x, y: to.y - 16,
            class: 'gfv-commit-label',
            'text-anchor': 'middle'
        });
        text.textContent = label;
        group.appendChild(text);
    }

    svg.appendChild(group);
    GFV.state.merges++;
    GFV.updateStats();
    return { x: x, y: to.y };
};

/* ===== Add Tag ===== */
GFV.addTag = function(branch, tagName) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var b = g.branches[branch];
    if (!svg || !b) return;

    var x = g.commitX;
    g.commitX += g.commitSpacing;
    b.headX = x;
    b.commits.push({ x: x, y: b.y });
    var y = b.y;
    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var circle = GFV._createSVG('circle', {
        cx: x, cy: y, r: g.commitRadius,
        fill: b.color, class: 'gfv-commit'
    });
    group.appendChild(circle);

    var tagW = tagName.length * 7 + 16;
    var tagH = 18;
    var rect = GFV._createSVG('rect', {
        x: x - tagW / 2, y: y - 32,
        width: tagW, height: tagH,
        fill: '#f9e2af', class: 'gfv-tag-bg'
    });
    group.appendChild(rect);

    var text = GFV._createSVG('text', {
        x: x, y: y - 23,
        class: 'gfv-tag'
    });
    text.textContent = '\uD83C\uDFF7 ' + tagName;
    group.appendChild(text);

    svg.appendChild(group);
    GFV.state.commits++;
    GFV.updateStats();
};

/* ===== Add PR ===== */
GFV.addPR = function(fromBranch, toBranch, prLabel) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var from = g.branches[fromBranch];
    var to = g.branches[toBranch];
    if (!svg || !from || !to) return;

    var fromX = g.commitX;
    g.commitX += g.commitSpacing;
    from.headX = fromX;
    var toX = fromX + 30;

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var path = GFV._createSVG('path', {
        d: 'M ' + fromX + ' ' + from.y + ' C ' +
            (fromX + 15) + ' ' + from.y + ' ' +
            (toX - 15) + ' ' + to.y + ' ' +
            toX + ' ' + to.y,
        stroke: GFV.state._accentColor || '#89b4fa',
        'stroke-width': 2,
        'stroke-dasharray': '6 3',
        fill: 'none',
        opacity: 0.8
    });
    group.appendChild(path);

    var midX = (fromX + toX) / 2;
    var midY = (from.y + to.y) / 2;
    var badgeW = (prLabel || 'PR').length * 7 + 12;
    var rect = GFV._createSVG('rect', {
        x: midX - badgeW / 2, y: midY - 10,
        width: badgeW, height: 20,
        class: 'gfv-pr-badge-bg'
    });
    group.appendChild(rect);

    var text = GFV._createSVG('text', {
        x: midX, y: midY,
        class: 'gfv-pr-badge'
    });
    text.textContent = prLabel || 'PR';
    group.appendChild(text);

    svg.appendChild(group);
    GFV.state.prs++;
    GFV.updateStats();
};

/* ===== Add Cherry-pick ===== */
GFV.addCherryPick = function(fromBranch, toBranch, label) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var from = g.branches[fromBranch];
    var to = g.branches[toBranch];
    if (!svg || !from || !to) return null;

    var fromX = from.headX;
    var x = g.commitX;
    g.commitX += g.commitSpacing;
    to.headX = x;
    to.commits.push({ x: x, y: to.y });

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var path = GFV._createSVG('path', {
        d: 'M ' + fromX + ' ' + from.y + ' L ' + x + ' ' + to.y,
        stroke: '#f5c2e7',
        class: 'gfv-cherry-pick-path'
    });
    group.appendChild(path);

    var circle = GFV._createSVG('circle', {
        cx: x, cy: to.y, r: g.commitRadius,
        fill: '#f5c2e7', class: 'gfv-commit'
    });
    group.appendChild(circle);

    if (label) {
        var text = GFV._createSVG('text', {
            x: x, y: to.y - 14,
            class: 'gfv-commit-label',
            'text-anchor': 'middle'
        });
        text.textContent = '\uD83C\uDF52 ' + label;
        group.appendChild(text);
    }

    svg.appendChild(group);
    GFV.state.commits++;
    GFV.updateStats();
    return { x: x, y: to.y };
};

/* ===== Add Rebase ===== */
GFV.addRebase = function(fromBranch, toBranch, count) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var from = g.branches[fromBranch];
    var to = g.branches[toBranch];
    if (!svg || !from || !to) return;

    var startX = from.headX;
    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var n = count || 3;
    for (var i = 0; i < n; i++) {
        var x = startX + (i + 1) * 25;
        var oldY = from.y;
        var newY = to.y;

        var path = GFV._createSVG('path', {
            d: 'M ' + (x - 15) + ' ' + oldY + ' L ' + x + ' ' + newY,
            stroke: from.color,
            class: 'gfv-rebase-path'
        });
        group.appendChild(path);

        var circle = GFV._createSVG('circle', {
            cx: x, cy: newY, r: g.commitRadius - 1,
            fill: from.color, opacity: 0.6, class: 'gfv-commit'
        });
        group.appendChild(circle);
    }

    svg.appendChild(group);
};

/* ===== Add Fork (visual fork from upstream to origin) ===== */
GFV.addFork = function(fromBranch, toBranch, label) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var from = g.branches[fromBranch];
    var to = g.branches[toBranch];
    if (!svg || !from || !to) return;

    var x = g.commitX;
    g.commitX += g.commitSpacing;
    from.headX = x;
    to.headX = x;

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var path = GFV._createSVG('path', {
        d: 'M ' + x + ' ' + from.y + ' L ' + x + ' ' + to.y,
        stroke: to.color,
        'stroke-width': 2,
        'stroke-dasharray': '6 4',
        fill: 'none',
        opacity: 0.7
    });
    group.appendChild(path);

    var arrow = GFV._createSVG('polygon', {
        points: (x - 5) + ',' + (to.y - 12) + ' ' + x + ',' + (to.y - 4) + ' ' + (x + 5) + ',' + (to.y - 12),
        fill: to.color,
        opacity: 0.8
    });
    group.appendChild(arrow);

    var midY = (from.y + to.y) / 2;
    var badgeText = '\uD83C\uDF74 ' + (label || 'Fork');
    var badgeW = badgeText.length * 7 + 14;
    var rect = GFV._createSVG('rect', {
        x: x - badgeW / 2 - 2, y: midY - 10,
        width: badgeW + 4, height: 20,
        rx: 4, ry: 4,
        fill: '#89dceb', opacity: 0.9
    });
    group.appendChild(rect);

    var text = GFV._createSVG('text', {
        x: x, y: midY,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: '#0d1117', 'font-size': '11px', 'font-weight': 'bold'
    });
    text.textContent = badgeText;
    group.appendChild(text);

    svg.appendChild(group);
    GFV.state.branches++;
    GFV.updateStats();
};

/* ===== Add Push (dashed arrow from branch to remote, with ⬆ icon) ===== */
GFV.addPush = function(branch, toBranch, label) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var b = g.branches[branch];
    if (!svg || !b) return;

    var x = g.commitX;
    g.commitX += g.commitSpacing;
    b.headX = x;

    var y = b.y;
    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var to = toBranch ? g.branches[toBranch] : null;
    if (to) {
        var toY = to.y;
        to.headX = x;

        var path = GFV._createSVG('path', {
            d: 'M ' + x + ' ' + y + ' L ' + x + ' ' + toY,
            stroke: b.color,
            'stroke-width': 2,
            'stroke-dasharray': '5 4',
            fill: 'none',
            opacity: 0.6
        });
        group.appendChild(path);

        var arrowDir = toY < y ? -1 : 1;
        var arrowY = toY + arrowDir * 4;
        var arrow = GFV._createSVG('polygon', {
            points: (x - 5) + ',' + (arrowY - arrowDir * 8) + ' ' +
                    x + ',' + arrowY + ' ' +
                    (x + 5) + ',' + (arrowY - arrowDir * 8),
            fill: b.color,
            opacity: 0.7
        });
        group.appendChild(arrow);

        var midY = (y + toY) / 2;
        var icon = GFV._createSVG('text', {
            x: x + 16, y: midY + 4,
            'text-anchor': 'middle', 'font-size': '14px'
        });
        icon.textContent = '\u2B06';
        group.appendChild(icon);

        if (label) {
            var text = GFV._createSVG('text', {
                x: x + 16, y: midY - 10,
                class: 'gfv-commit-label',
                'text-anchor': 'middle'
            });
            text.textContent = label;
            group.appendChild(text);
        }
    } else {
        var iconOnly = GFV._createSVG('text', {
            x: x, y: y - 4,
            'text-anchor': 'middle', 'font-size': '16px'
        });
        iconOnly.textContent = '\u2B06';
        group.appendChild(iconOnly);

        if (label) {
            var textOnly = GFV._createSVG('text', {
                x: x, y: y - 20,
                class: 'gfv-commit-label',
                'text-anchor': 'middle'
            });
            textOnly.textContent = label;
            group.appendChild(textOnly);
        }
    }

    svg.appendChild(group);
};

/* ===== Add Annotation (small badge near a branch's head) ===== */
GFV.addAnnotation = function(branch, text, atX, position) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var b = g.branches[branch];
    if (!svg || !b) return;

    var x = atX || b.headX;
    var y = b.y;
    var offsetY = (position === 'above') ? -34 : 34;
    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var badgeW = text.length * 6.5 + 12;
    var rect = GFV._createSVG('rect', {
        x: x - badgeW / 2, y: y + offsetY,
        width: badgeW, height: 18,
        rx: 9, ry: 9,
        fill: 'rgba(249,226,175,0.9)'
    });
    group.appendChild(rect);

    var label = GFV._createSVG('text', {
        x: x, y: y + offsetY + 9,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: '#0d1117', 'font-size': '10px', 'font-weight': 'bold'
    });
    label.textContent = text;
    group.appendChild(label);

    svg.appendChild(group);
};

/* ===== Add Deploy ===== */
GFV.addDeploy = function(branch, envName) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var b = g.branches[branch];
    if (!svg || !b) return;

    var x = g.commitX;
    g.commitX += g.commitSpacing;
    b.headX = x;
    b.commits.push({ x: x, y: b.y });
    var y = b.y;
    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var circle = GFV._createSVG('circle', {
        cx: x, cy: y, r: g.commitRadius,
        fill: b.color, class: 'gfv-commit'
    });
    group.appendChild(circle);

    var text = GFV._createSVG('text', {
        x: x, y: y - 18,
        class: 'gfv-deploy-icon',
        'text-anchor': 'middle'
    });
    text.textContent = '\uD83D\uDE80';
    group.appendChild(text);

    if (envName) {
        var label = GFV._createSVG('text', {
            x: x, y: y - 38,
            class: 'gfv-commit-label',
            'text-anchor': 'middle',
            fill: '#fab387'
        });
        label.textContent = envName;
        group.appendChild(label);
    }

    svg.appendChild(group);
};

/* ===== Delete Branch (visual strikethrough) ===== */
GFV.deleteBranch = function(branch) {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var b = g.branches[branch];
    if (!svg || !b) return;

    var x = g.commitX;
    g.commitX += g.commitSpacing;
    b.headX = x;

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });

    var line = GFV._createSVG('line', {
        x1: g.labelWidth, y1: b.y,
        x2: x + 20, y2: b.y,
        class: 'gfv-delete-line'
    });
    group.appendChild(line);

    var cross1 = GFV._createSVG('line', {
        x1: x - 6, y1: b.y - 6, x2: x + 6, y2: b.y + 6,
        stroke: '#f38ba8', 'stroke-width': 3
    });
    var cross2 = GFV._createSVG('line', {
        x1: x + 6, y1: b.y - 6, x2: x - 6, y2: b.y + 6,
        stroke: '#f38ba8', 'stroke-width': 3
    });
    group.appendChild(cross1);
    group.appendChild(cross2);

    svg.appendChild(group);
};

/* ===== Add Badge (Ship/Show/Ask) ===== */
GFV.addBadge = function(x, y, text, color) {
    var svg = document.getElementById('gfv-canvas');
    if (!svg) return;

    var group = GFV._createSVG('g', { class: 'gfv-fade-in' });
    var w = text.length * 7 + 14;

    var rect = GFV._createSVG('rect', {
        x: x - w / 2, y: y - 10, width: w, height: 20,
        rx: 10, ry: 10, fill: color || '#89b4fa'
    });
    group.appendChild(rect);

    var label = GFV._createSVG('text', {
        x: x, y: y, class: 'gfv-badge', fill: '#0d1117'
    });
    label.textContent = text;
    group.appendChild(label);

    svg.appendChild(group);
};

/* ===== Clear Graph ===== */
GFV.clearGraph = function() {
    var svg = document.getElementById('gfv-canvas');
    if (svg) svg.innerHTML = '';
    GFV.graph.branches = {};
    GFV.graph.commitX = GFV.graph.labelWidth;
    GFV.graph.nextY = 40;
    GFV.state.running = false;
};

/* ===== Animate Flow ===== */
GFV.animateFlow = async function(steps, options) {
    if (GFV.state.running) return;

    if (GFV.stepMode.active) {
        GFV.exitStepMode();
        GFV.clearGraph();
        GFV.resetStats();
        GFV.clearLog();
    }

    GFV.state.branches = 0;
    GFV.state.commits = 0;
    GFV.state.merges = 0;
    GFV.state.prs = 0;
    GFV.updateStats();

    GFV.state.running = true;
    GFV.state.stepIndex = 0;
    GFV.state._flowSteps = steps;
    GFV.state._flowOptions = options;

    var opts = options || {};
    GFV.log('REQUEST', opts.requestLabel || GFV._t('ui.log.request_start', null, 'Flow started'));

    var startTime = performance.now();

    for (var i = 0; i < steps.length; i++) {
        if (!GFV.state.running) break;

        var step = steps[i];
        GFV.state.stepIndex = i + 1;
        step._stepNum = i + 1;
        GFV._executeStep(step);
        var stepLabel = step.label || step.tagName || step.envName || step.branch || '';
        var logDesc = step.descriptionKey
            ? GFV._t(step.descriptionKey, step.descriptionParams || null, step.description || '')
            : (step.description || '');
        var stepPrefix = GFV._stepPrefix(i + 1);
        GFV.log(step.logType || 'FLOW', stepPrefix + ': ' + stepLabel + (logDesc ? ' — ' + logDesc : ''));

        var delay = step.delay !== undefined ? step.delay : GFV.state.stepDelay;
        await GFV.sleep(delay);
    }

    var elapsed = Math.round(performance.now() - startTime);
    if (GFV.state.running) {
        GFV.log('RESPONSE', GFV._t('ui.log.flow_completed', { time: elapsed, steps: steps.length }, 'Flow completed in ' + elapsed + 'ms (' + steps.length + ' steps)'));
    }

    GFV.state.running = false;
    GFV.state.paused = false;
    GFV.state._flowSteps = null;
    GFV.state._flowOptions = null;

    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }
};

/* ===== Execute Single Step ===== */
GFV._executeStep = function(step) {
    if (step.xPad) GFV.graph.commitX += step.xPad;

    switch (step.op) {
        case 'branch':
            GFV.addBranch(step.fromBranch, step.branch);
            break;
        case 'commit':
            GFV.addCommit(step.branch, step.label);
            break;
        case 'merge':
            GFV.addMerge(step.fromBranch, step.toBranch, step.label);
            break;
        case 'tag':
            GFV.addTag(step.branch, step.tagName);
            break;
        case 'pr':
            GFV.addPR(step.fromBranch, step.toBranch, step.label);
            break;
        case 'deploy':
            GFV.addDeploy(step.branch, step.envName);
            break;
        case 'cherry-pick':
            GFV.addCherryPick(step.fromBranch, step.toBranch, step.label);
            break;
        case 'rebase':
            GFV.addRebase(step.fromBranch, step.toBranch, step.count);
            break;
        case 'fork':
            GFV.addFork(step.fromBranch, step.toBranch, step.label);
            break;
        case 'push':
            GFV.addPush(step.branch, step.toBranch, step.label);
            break;
        case 'delete-branch':
            GFV.deleteBranch(step.branch);
            break;
        case 'badge':
            var bx = step.x, by = step.y;
            if (step.branch && GFV.graph.branches[step.branch]) {
                var bb = GFV.graph.branches[step.branch];
                bx = GFV.graph.commitX;
                GFV.graph.commitX += GFV.graph.commitSpacing;
                bb.headX = bx;
                by = bb.y - 30;
            }
            GFV.addBadge(bx, by, step.label, step.color);
            break;
    }

    /* Render step number on the SVG */
    if (step._stepNum) {
        var svg = document.getElementById('gfv-canvas');
        if (svg) {
            var g = GFV.graph;
            var targetBranch;
            if (step.op === 'branch') {
                targetBranch = step.branch;
            } else if (step.op === 'fork') {
                targetBranch = step.toBranch || step.branch;
            } else if (step.op === 'push') {
                targetBranch = step.branch;
            } else if (step.op === 'pr') {
                targetBranch = step.fromBranch || step.branch;
            } else if (step.op === 'merge' || step.op === 'cherry-pick') {
                targetBranch = step.toBranch || step.branch;
            } else {
                targetBranch = step.branch;
            }
            var br = g.branches[targetBranch];
            if (br) {
                var translatedDesc = step.descriptionKey
                    ? GFV._t(step.descriptionKey, step.descriptionParams || null, step.description || '')
                    : (step.description || '');
                GFV._addStepNumber(svg, br.headX, br.y, step._stepNum, translatedDesc);
            }
        }
    }

    /* Render annotation badge if present */
    if (step.annotation) {
        var annotBranch = step.annotationBranch || step.toBranch || step.branch;
        var sourceBranch = step.branch || step.fromBranch;
        var atX = (annotBranch !== sourceBranch && sourceBranch) ? g.branches[sourceBranch].headX : undefined;
        if (annotBranch) {
            GFV.addAnnotation(annotBranch, step.annotation, atX, step.annotationPosition);
        }
    }
};

/* ===== Trade-offs ===== */
GFV.showTradeoffs = function(tradeoffs, i18nPrefix) {
    var container = document.getElementById('tradeoffs-panel');
    var body = document.getElementById('tradeoffs-body');
    var toggle = document.getElementById('tradeoffs-toggle');
    if (!container || !body || !toggle) return;

    if (!tradeoffs) {
        container.style.display = 'none';
        body.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
        return;
    }

    var pros = i18nPrefix ? I18N.ta(i18nPrefix + '.tradeoffs.pros', tradeoffs.pros || []) : (tradeoffs.pros || []);
    var cons = i18nPrefix ? I18N.ta(i18nPrefix + '.tradeoffs.cons', tradeoffs.cons || []) : (tradeoffs.cons || []);
    var whenToUse = i18nPrefix ? I18N.t(i18nPrefix + '.tradeoffs.whenToUse', null, tradeoffs.whenToUse || '') : (tradeoffs.whenToUse || '');

    var html = '<div class="tradeoffs-grid">';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title pros">&#x2705; ' + I18N.t('ui.tradeoffs.pros', null, 'Pros') + '</div>';
    pros.forEach(function(p) {
        html += '<div class="tradeoffs-item pro">' + p + '</div>';
    });
    html += '</div>';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title cons">&#x274C; ' + I18N.t('ui.tradeoffs.cons', null, 'Cons') + '</div>';
    cons.forEach(function(c) {
        html += '<div class="tradeoffs-item con">' + c + '</div>';
    });
    html += '</div></div>';

    if (whenToUse) {
        html += '<div class="tradeoffs-when">' +
            '<div class="tradeoffs-when-title">' + I18N.t('ui.tradeoffs.when', null, 'When to Use') + '</div>' +
            whenToUse + '</div>';
    }

    body.innerHTML = html;
    body.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
    container.style.display = 'block';
};

/* ===== Branch Rules ===== */
GFV.showBranchRules = function(rules) {
    var body = document.getElementById('branch-rules-body');
    if (!body) return;

    var html = '';
    rules.forEach(function(rule) {
        var cls = rule.allowed ? 'allowed' : 'forbidden';
        var icon = rule.allowed ? '&#x2705;' : '&#x274C;';
        html += '<div class="dep-rule ' + cls + '">' +
            '<span class="dep-rule-icon">' + icon + '</span>' +
            '<span>' + rule.from + ' &#x2192; ' + rule.to + '</span>' +
            '</div>';
    });

    body.innerHTML = html;
};

/* ===== Step Mode ===== */
GFV.stepMode = {
    active: false,
    steps: null,
    index: 0,
    options: null,
    _snapshots: []
};

GFV._takeSnapshot = function() {
    var svg = document.getElementById('gfv-canvas');
    var g = GFV.graph;
    var s = GFV.state;
    return {
        childCount: svg ? svg.children.length : 0,
        graph: {
            branches: JSON.parse(JSON.stringify(g.branches)),
            commitX: g.commitX,
            nextY: g.nextY
        },
        stats: {
            branches: s.branches,
            commits: s.commits,
            merges: s.merges,
            prs: s.prs
        }
    };
};

GFV._restoreSnapshot = function(snap) {
    var svg = document.getElementById('gfv-canvas');
    if (svg) {
        while (svg.children.length > snap.childCount) {
            svg.removeChild(svg.lastChild);
        }
    }

    var g = GFV.graph;
    var saved = snap.graph;
    g.branches = JSON.parse(JSON.stringify(saved.branches));
    g.commitX = saved.commitX;
    g.nextY = saved.nextY;

    var s = GFV.state;
    s.branches = snap.stats.branches;
    s.commits = snap.stats.commits;
    s.merges = snap.stats.merges;
    s.prs = snap.stats.prs;
    GFV.updateStats();
};

GFV.startStepMode = function(steps, options, resumeFromIndex) {
    if (resumeFromIndex > 0) {
        GFV.state.running = false;
        GFV.stepMode.active = true;
        GFV.stepMode.steps = steps;
        GFV.stepMode.index = resumeFromIndex;
        GFV.stepMode.options = options || {};
        GFV.stepMode._snapshots = [GFV._takeSnapshot()];
        GFV.log('FLOW', GFV._t('ui.log.step_mode', { step: resumeFromIndex }, 'Switched to step mode at step ' + resumeFromIndex));
    } else {
        GFV.resetStats();
        GFV.clearLog();
        GFV.stepMode.active = true;
        GFV.stepMode.steps = steps;
        GFV.stepMode.index = 0;
        GFV.stepMode.options = options || {};
        GFV.stepMode._snapshots = [GFV._takeSnapshot()];
        var stepStartLabel = (options && options.requestLabel) ? options.requestLabel : GFV._t('ui.log.step_mode_start', null, 'Step mode started');
        GFV.log('REQUEST', stepStartLabel);
    }
    GFV._updateStepButtons();
};

GFV.switchToStepMode = function() {
    if (!GFV.state.running || !GFV.state.paused || !GFV.state._flowSteps) return;

    var steps = GFV.state._flowSteps;
    var options = GFV.state._flowOptions || {};
    options._branchNames = options._branchNames || Object.keys(GFV.graph.branches);
    var currentIndex = GFV.state.stepIndex;

    GFV.state._flowSteps = null;
    GFV.state._flowOptions = null;
    GFV.state.running = false;
    GFV.resume();

    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }

    GFV.startStepMode(steps, options, currentIndex);
};

GFV.stepForward = function() {
    var sm = GFV.stepMode;
    if (!sm.active || sm.index >= sm.steps.length) return;

    sm._snapshots.push(GFV._takeSnapshot());

    var step = sm.steps[sm.index];
    step._stepNum = sm.index + 1;
    GFV._executeStep(step);
    var smLabel = step.label || step.tagName || step.envName || step.branch || '';
    var smDesc = step.descriptionKey
        ? GFV._t(step.descriptionKey, step.descriptionParams || null, step.description || '')
        : (step.description || '');
    var smPrefix = GFV._stepPrefix(sm.index + 1);
    GFV.log(step.logType || 'FLOW', smPrefix + ': ' + smLabel + (smDesc ? ' — ' + smDesc : ''));

    sm.index++;
    GFV.state.stepIndex = sm.index;

    if (sm.index >= sm.steps.length) {
        GFV.log('RESPONSE', GFV._t('ui.log.flow_completed_steps', { steps: sm.steps.length }, 'Flow completed (' + sm.steps.length + ' steps)'));
    }

    GFV._updateStepButtons();
};

GFV.stepBack = function() {
    var sm = GFV.stepMode;
    if (!sm.active || sm.index <= 0) return;

    sm.index--;
    GFV.state.stepIndex = sm.index;

    if (sm._snapshots.length > 0) {
        var snap = sm._snapshots.pop();
        GFV._restoreSnapshot(snap);
    }

    GFV._updateStepButtons();
};

GFV.exitStepMode = function() {
    GFV.stepMode.active = false;
    GFV.stepMode.steps = null;
    GFV.stepMode.index = 0;
    GFV.stepMode._snapshots = [];
    GFV._updateStepButtons();
};

GFV._updateStepButtons = function() {
    var sm = GFV.stepMode;
    var btnBack = document.getElementById('btn-step-back');
    var btnFwd = document.getElementById('btn-step-fwd');
    var btnStep = document.getElementById('btn-step-mode');
    if (!btnBack || !btnFwd || !btnStep) return;

    if (sm.active) {
        btnBack.disabled = sm.index <= 0;
        btnFwd.disabled = sm.index >= (sm.steps ? sm.steps.length : 0);
        btnBack.style.display = '';
        btnFwd.style.display = '';
        btnStep.classList.add('active');
        btnStep.innerHTML = '&#x23F9; ' + I18N.t('ui.btn.exit_steps', null, 'Exit Steps');
    } else {
        btnBack.style.display = 'none';
        btnFwd.style.display = 'none';
        btnStep.classList.remove('active');
        btnStep.innerHTML = '&#x23ED; ' + I18N.t('ui.btn.step_mode', null, 'Step Mode');
    }
};
