/* ===== Deployment Visualizer Engine (SVG board) ===== */

const DV = window.DV || {};
window.DV = DV;

DV.state = {
    strategy: 'big-bang',
    mode: null,
    running: false,
    paused: false,
    _pauseResolve: null,
    stepIndex: 0,
    stepDelay: 600,
    _flowSteps: null,
    _flowOptions: null,
    downtime: 0,
    errors: 0,
    v2Traffic: 0,
    rollbacks: 0,
    board: { config: null, activeStage: null, stageX: {}, groups: [], outage: false }
};

DV.SVGNS = 'http://www.w3.org/2000/svg';

/* ===== i18n helper ===== */
DV.t = function(key, params, fallback) {
    return I18N.t(key, params, fallback !== undefined ? fallback : key);
};

/* ===== Text helpers ===== */
DV._decode = function(s) {
    if (s == null) return '';
    return String(s)
        .replace(/<\/?b>/g, '')
        .replace(/&#x2192;/g, '→').replace(/&#x2713;/g, '✓')
        .replace(/&#x2715;/g, '✕').replace(/&#x23F3;/g, '⏳')
        .replace(/&#x21CA;/g, '⇊').replace(/&times;/g, '×')
        .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—')
        .replace(/&middot;/g, '·').replace(/&amp;/g, '&');
};
DV._esc = function(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
DV._txt = function(s) { return DV._esc(DV._decode(s)); };

/* ===== Event Log ===== */
DV.log = function(type, text) {
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
    var typeKey = typeof type === 'string' ? type.toUpperCase() : 'INFO';
    typeSpan.className = 'log-type dv-lt-' + typeKey;
    typeSpan.textContent = I18N.t('dv.log.type.' + typeKey, null, typeKey);

    var textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(typeSpan);
    entry.appendChild(textSpan);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

DV.clearLog = function() {
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

DV.copyLog = function() {
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
DV.updateStats = function() {
    var s = DV.state;
    var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-downtime', s.downtime + 's');
    set('stat-errors', s.errors >= 1000 ? (s.errors / 1000).toFixed(1) + 'k' : s.errors);
    set('stat-traffic', s.v2Traffic + '%');
    set('stat-rollbacks', s.rollbacks);
};

DV.resetStats = function() {
    var s = DV.state;
    s.downtime = 0;
    s.errors = 0;
    s.v2Traffic = 0;
    s.rollbacks = 0;
    s.stepIndex = 0;
    s.running = false;
    DV.updateStats();
};

/* ===== Pause / Resume ===== */
DV.sleep = async function(ms) {
    await new Promise(function(r) { setTimeout(r, ms); });
    while (DV.state.paused) {
        await new Promise(function(r) { DV.state._pauseResolve = r; });
    }
};
DV.pause = function() { DV.state.paused = true; };
DV.resume = function() {
    DV.state.paused = false;
    if (DV.state._pauseResolve) {
        DV.state._pauseResolve();
        DV.state._pauseResolve = null;
    }
};

/* ===== Accent Colors ===== */
DV.setAccentColors = function(strategyId) {
    var themes = {
        'big-bang':       { accent: '#EF4444', bg: '#1f0d0d', light: '#301515' },
        'rolling':        { accent: '#3B82F6', bg: '#0d1630', light: '#152048' },
        'blue-green':     { accent: '#10B981', bg: '#0d1f18', light: '#153024' },
        'canary':         { accent: '#F59E0B', bg: '#1f1a0d', light: '#302615' },
        'feature-toggle': { accent: '#8B5CF6', bg: '#1a1630', light: '#241e48' },
        'shadow':         { accent: '#06B6D4', bg: '#0d1d22', light: '#152d34' }
    };
    var t = themes[strategyId] || themes['big-bang'];
    var root = document.documentElement.style;
    root.setProperty('--dv-accent', t.accent);
    root.setProperty('--dv-accent-bg', t.bg);
    root.setProperty('--dv-accent-light', t.light);
};

/* tooltips are native SVG <title> now — keep a no-op for app.js */
DV.ensureTooltips = function() {};

/* ===== Helpers ===== */
DV.fleet = function(version, health, n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push({ v: version, h: health });
    return a;
};

DV._stageIcons = {
    'build': '&#x1F528;', 'stop': '&#x1F6D1;', 'start': '&#x25B6;',
    'migrate': '&#x1F504;', 'migrate-expand': '&#x1F4C8;',
    'deploy': '&#x1F4E6;', 'release': '&#x1F4E6;', 'health': '&#x1FA7A;',
    'smoke': '&#x1F9EA;', 'traffic': '&#x1F500;', 'verify': '&#x1F50D;', 'toggle': '&#x1F6A9;',
    'observe': '&#x1F4CA;', 'migrate-contract': '&#x1F4C9;', 'promote': '&#x2B06;',
    'mirror': '&#x1F465;', 'done': '&#x2705;', 'rollback': '&#x21A9;', 'restore': '&#x1F9EF;'
};

DV.mkMode = function(initFn, stepsFn, startKey) {
    return {
        init: initFn,
        steps: stepsFn,
        stepOptions: function() { return { startKey: startKey }; },
        run: function() { initFn(); DV.animateFlow(stepsFn(), { startKey: startKey }); }
    };
};

/* ===== Geometry (viewBox 1000 x 540) ===== */
DV.geo = {
    W: 1000, H: 540,
    railY: 44, railX0: 60, railX1: 900, railLabelY: 70,
    users: { x: 46, y: 212, w: 118, h: 96, cx: 164, cy: 260 },
    router: { x: 250, y: 212, w: 152, h: 96, inX: 250, outX: 402, cy: 260 },
    instX: 468, instW: 258, instOut: 726,
    svc: [
        { id: 'db', x: 740, y: 92, cy: 142 },
        { id: 'cache', x: 740, y: 200, cy: 250 },
        { id: 'queue', x: 740, y: 308, cy: 358 },
        { id: 'search', x: 740, y: 416, cy: 466 }
    ],
    svcW: 246, svcH: 100
};

DV._groupGeo = function(n) {
    var g = DV.geo;
    if (n <= 1) return [{ x: g.instX, y: 198, w: g.instW, h: 130, cx: g.instX + g.instW / 2, cy: 263 }];
    return [
        { x: g.instX, y: 116, w: g.instW, h: 122, cx: g.instX + g.instW / 2, cy: 177 },
        { x: g.instX, y: 300, w: g.instW, h: 122, cx: g.instX + g.instW / 2, cy: 361 }
    ];
};

/* ===== Render Board ===== */
DV.renderBoard = function(config) {
    DV.state.board.config = config;
    DV.state.board.activeStage = null;
    DV.state.board.stageX = {};
    DV.state.board.outage = false;
    DV._svcState = { db: {}, cache: {}, queue: {}, search: {} };
    var board = document.getElementById('dv-board');
    if (!board) return;
    var g = DV.geo;

    /* --- pipeline rail --- */
    var stages = config.stages || [];
    var n = stages.length;
    var rail = '<line class="dv-rail-track" x1="' + g.railX0 + '" y1="' + g.railY + '" x2="' + g.railX1 + '" y2="' + g.railY + '"/>' +
        '<line class="dv-rail-progress" id="dv-rail-progress" x1="' + g.railX0 + '" y1="' + g.railY + '" x2="' + g.railX0 + '" y2="' + g.railY + '"/>';
    stages.forEach(function(id, i) {
        var x = n > 1 ? g.railX0 + i * (g.railX1 - g.railX0) / (n - 1) : (g.railX0 + g.railX1) / 2;
        DV.state.board.stageX[id] = x;
        rail += '<g class="dv-stage dv-stage--pending" id="dv-stg-' + id + '">' +
            '<circle class="dv-stage-c" cx="' + x + '" cy="' + g.railY + '" r="13"/>' +
            '<text class="dv-stage-ic" x="' + x + '" y="' + (g.railY + 5) + '">' + (DV._stageIcons[id] || '&#x25CF;') + '</text>' +
            '<text class="dv-stage-lbl" x="' + x + '" y="' + g.railLabelY + '">' + DV._txt(I18N.t('dv.stage.' + id, null, id)) + '</text>' +
            '</g>';
    });

    /* --- static connectors --- */
    var conn = '<path class="dv-conn" d="M' + g.users.cx + ',' + g.users.cy + ' L' + (g.router.inX - 6) + ',' + g.router.cy + '" marker-end="url(#dv-arrow)"/>';
    g.svc.forEach(function(s) {
        conn += '<path class="dv-conn dv-conn--io" d="M' + g.instOut + ',263 C' + (g.instOut + 48) + ',263 ' + s.x + ',' + (s.cy - 24) + ' ' + (s.x - 6) + ',' + s.cy + '" marker-end="url(#dv-arrow)"/>';
    });

    /* --- Users node --- */
    var u = g.users;
    var usersG = '<g class="dv-node dv-node-users" transform="translate(' + u.x + ',' + u.y + ')">' +
        '<title>' + DV._txt(I18N.t('dv.ui.users', null, 'Users')) + '</title>' +
        '<rect class="dv-node-bg" x="0" y="0" width="' + u.w + '" height="' + u.h + '" rx="10"/>' +
        '<text class="dv-node-glyph" x="' + (u.w / 2) + '" y="42">&#x1F465;</text>' +
        '<text class="dv-node-title" x="' + (u.w / 2) + '" y="66">' + DV._txt(I18N.t('dv.ui.users', null, 'Users')) + '</text>' +
        '<text class="dv-node-sub" x="' + (u.w / 2) + '" y="83">' + DV._txt(I18N.t('dv.ui.requests', null, 'live requests')) + '</text>' +
        '</g>';

    /* --- Router node --- */
    var r = g.router;
    var routerG = '<g class="dv-node dv-node-router" transform="translate(' + r.x + ',' + r.y + ')">' +
        '<title>' + DV._txt(I18N.t('dv.ui.router', null, 'Traffic Router')) + '</title>' +
        '<rect class="dv-node-bg" x="0" y="0" width="' + r.w + '" height="' + r.h + '" rx="10"/>' +
        '<text class="dv-node-glyph" x="' + (r.w / 2) + '" y="34">&#x1F310;</text>' +
        '<text class="dv-node-title" x="' + (r.w / 2) + '" y="54">' + DV._txt(I18N.t('dv.ui.router', null, 'Router')) + '</text>' +
        '<g id="dv-router-bar" transform="translate(16,64)">' +
            '<rect class="dv-rt-seg dv-rt-v1" id="dv-rt-v1" x="0" y="0" width="120" height="14" rx="3"/>' +
            '<rect class="dv-rt-seg dv-rt-v2" id="dv-rt-v2" x="120" y="0" width="0" height="14" rx="3"/>' +
            '<text class="dv-rt-label" id="dv-rt-label" x="60" y="11">100% v1</text>' +
        '</g>' +
        '<text class="dv-rt-mirror" id="dv-rt-mirror" x="' + (r.w / 2) + '" y="92" style="display:none">&#x21CA; mirror</text>' +
        '</g>';

    /* --- service nodes --- */
    var svcMeta = {
        db: { icon: '&#x1F5C4;', nameKey: 'dv.svc.db.name' },
        cache: { icon: '&#x26A1;', nameKey: 'dv.svc.cache.name' },
        queue: { icon: '&#x1F4EC;', nameKey: 'dv.svc.queue.name' },
        search: { icon: '&#x1F50E;', nameKey: 'dv.svc.search.name' }
    };
    var svcG = '';
    g.svc.forEach(function(s) {
        var m = svcMeta[s.id];
        svcG += '<g class="dv-svc dv-svc--idle" id="dv-svc-' + s.id + '" transform="translate(' + s.x + ',' + s.y + ')">' +
            '<title>' + DV._txt(I18N.t('dv.tooltip.svc-' + s.id, null, '')) + '</title>' +
            '<rect class="dv-svc-bg" x="0" y="0" width="' + g.svcW + '" height="' + g.svcH + '" rx="10"/>' +
            '<rect class="dv-svc-edge" x="0" y="8" width="4" height="' + (g.svcH - 16) + '" rx="2"/>' +
            '<text class="dv-svc-icon" x="16" y="29">' + m.icon + '</text>' +
            '<text class="dv-svc-name" x="40" y="29">' + DV._txt(I18N.t(m.nameKey, null, s.id)) + '</text>' +
            '<circle class="dv-svc-led" id="dv-led-' + s.id + '" cx="' + (g.svcW - 16) + '" cy="23" r="5"/>' +
            '<text class="dv-svc-cap" id="dv-cap-' + s.id + '" x="16" y="49">&#x2014;</text>' +
            '<g class="dv-mini" id="dv-mini-' + s.id + '" transform="translate(16,58)"></g>' +
            '</g>';
    });

    /* --- outage overlay --- */
    var outage = '<g id="dv-svg-outage" style="display:none">' +
        '<rect class="dv-outage-rect" x="60" y="86" width="664" height="30" rx="6"/>' +
        '<text class="dv-outage-text" x="392" y="106">&#x26A0;  ' +
        DV._txt(I18N.t('dv.ui.outage', null, 'Service outage — users cannot be served')) + '</text>' +
        '</g>';

    board.innerHTML =
        '<svg class="dv-svg" id="dv-svg" viewBox="0 0 ' + g.W + ' ' + g.H + '" preserveAspectRatio="xMidYMid meet" role="img">' +
        '<defs>' +
            '<marker id="dv-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">' +
                '<path d="M0,0 L6,3 L0,6 Z" class="dv-arrow-head"/>' +
            '</marker>' +
        '</defs>' +
        '<g id="dv-conn"><g id="dv-conn-static">' + conn + '</g><g id="dv-conn-rg"></g></g>' +
        '<g id="dv-particles"></g>' +
        '<g id="dv-rail">' + rail + '</g>' +
        usersG + routerG +
        '<g id="dv-svg-instances"></g>' +
        '<g id="dv-svg-flag" style="display:none"></g>' +
        svcG + outage +
        '</svg>';

    /* io particle paths */
    var ioPaths = {};
    g.svc.forEach(function(s) {
        ioPaths[s.id] = 'M' + g.instOut + ',263 C' + (g.instOut + 48) + ',263 ' + s.x + ',' + (s.cy - 24) + ' ' + (s.x - 4) + ',' + s.cy;
    });
    DV.particles.setIoPaths(ioPaths);

    /* initial state */
    if (config.groups) DV.setInstances(config.groups);
    if (config.router) DV.setTraffic(config.router);
    if (config.services) {
        Object.keys(config.services).forEach(function(k) { DV.setService(k, config.services[k]); });
    }
    if (config.flag) DV.setFlag(config.flag);
    DV.particles.start();
};

/* ===== Pipeline Stages ===== */
DV._stageClass = function(id, cls) {
    var el = document.getElementById('dv-stg-' + id);
    if (el) el.setAttribute('class', 'dv-stage ' + cls);
};

DV.setStage = function(id) {
    var prev = DV.state.board.activeStage;
    if (prev && prev !== id) {
        var pe = document.getElementById('dv-stg-' + prev);
        if (pe && pe.getAttribute('class').indexOf('dv-stage--failed') === -1) {
            DV._stageClass(prev, 'dv-stage--done');
        }
    }
    DV._stageClass(id, 'dv-stage--active');
    DV.state.board.activeStage = id;
    var prog = document.getElementById('dv-rail-progress');
    var x = DV.state.board.stageX[id];
    if (prog && x != null) prog.setAttribute('x2', x);
};

DV.setStageState = function(id, st) {
    DV._stageClass(id, 'dv-stage--' + st);
};

DV.failStage = function(id) {
    DV.state.board.activeStage = id;
    DV._stageClass(id, 'dv-stage--failed');
    var prog = document.getElementById('dv-rail-progress');
    var x = DV.state.board.stageX[id];
    if (prog && x != null) { prog.setAttribute('x2', x); prog.setAttribute('class', 'dv-rail-progress dv-rail-progress--fail'); }
};

DV._finishActiveStage = function() {
    var id = DV.state.board.activeStage;
    if (!id) return;
    var el = document.getElementById('dv-stg-' + id);
    if (el && el.getAttribute('class').indexOf('dv-stage--failed') === -1) {
        DV._stageClass(id, 'dv-stage--done');
    }
};

DV.showRollback = function() {
    var rail = document.getElementById('dv-rail');
    if (!rail) return;
    if (!document.getElementById('dv-stg-rollback')) {
        var g = DV.geo;
        var x = g.railX1 + 46;
        DV.state.board.stageX.rollback = x;
        var lastX = g.railX1;
        var ns = DV.SVGNS;
        var grp = document.createElementNS(ns, 'g');
        grp.setAttribute('class', 'dv-stage dv-stage--active dv-stage--rollback');
        grp.setAttribute('id', 'dv-stg-rollback');
        grp.innerHTML =
            '<line class="dv-rail-track dv-rail-track--fail" x1="' + lastX + '" y1="' + g.railY + '" x2="' + x + '" y2="' + g.railY + '"/>' +
            '<circle class="dv-stage-c" cx="' + x + '" cy="' + g.railY + '" r="13"/>' +
            '<text class="dv-stage-ic" x="' + x + '" y="' + (g.railY + 5) + '">' + DV._stageIcons.rollback + '</text>' +
            '<text class="dv-stage-lbl" x="' + x + '" y="' + g.railLabelY + '">' + DV._txt(I18N.t('dv.stage.rollback', null, 'Rollback')) + '</text>';
        rail.appendChild(grp);
    }
    DV._stageClass('rollback', 'dv-stage--active dv-stage--rollback');
    DV.state.board.activeStage = 'rollback';
};

/* ===== Instances ===== */
DV.setInstances = function(groups) {
    var wrap = document.getElementById('dv-svg-instances');
    var rg = document.getElementById('dv-conn-rg');
    if (!wrap) return;
    var geo = DV._groupGeo(groups.length);
    var html = '';
    var conn = '';
    var flowPaths = [];
    groups.forEach(function(grp, gi) {
        var box = geo[gi] || geo[geo.length - 1];
        var insts = grp.instances || [];
        var cnt = insts.length;
        var sw = 42, gap = 14;
        var totalW = cnt > 0 ? cnt * sw + (cnt - 1) * gap : 0;
        var startX = box.x + (box.w - totalW) / 2;
        var sy = box.y + box.h - 58;
        var label = DV._txt(I18N.t(grp.labelKey, null, grp.labelKey));
        html += '<g class="dv-igroup' + (grp.dim ? ' dv-igroup--dim' : '') + '">' +
            '<rect class="dv-igroup-bg dv-igroup-bg--' + (grp.version || 'v1') + '" x="' + box.x + '" y="' + box.y +
                '" width="' + box.w + '" height="' + box.h + '" rx="9"/>' +
            '<text class="dv-igroup-label" x="' + (box.x + box.w / 2) + '" y="' + (box.y + 22) + '">' + label + '</text>';
        if (cnt === 0) {
            html += '<text class="dv-igroup-empty" x="' + (box.x + box.w / 2) + '" y="' + (box.y + box.h / 2 + 14) + '">&#x2014;</text>';
        } else {
            insts.forEach(function(inst, i) {
                var ix = startX + i * (sw + gap);
                html += '<g class="dv-server dv-server--' + inst.v + ' dv-server--' + inst.h + '">' +
                    '<title>' + DV._txt(I18N.t('dv.tooltip.health-' + inst.h, null, inst.h)) + '</title>' +
                    '<rect class="dv-server-bg" x="' + ix + '" y="' + sy + '" width="' + sw + '" height="46" rx="6"/>' +
                    '<text class="dv-server-ver" x="' + (ix + sw / 2) + '" y="' + (sy + 21) + '">' + inst.v + '</text>' +
                    '<circle class="dv-server-led" cx="' + (ix + sw / 2) + '" cy="' + (sy + 33) + '" r="4.5"/>' +
                    '</g>';
            });
        }
        html += '</g>';
        /* router -> group connector */
        var gc = DV.geo.router;
        conn += '<path class="dv-conn dv-conn--rg" d="M' + gc.outX + ',' + gc.cy +
            ' C' + (gc.outX + 38) + ',' + gc.cy + ' ' + (box.x - 38) + ',' + box.cy + ' ' + (box.x - 6) + ',' + box.cy +
            '" marker-end="url(#dv-arrow)"/>';
        /* particle flow path */
        flowPaths.push({
            version: grp.version || 'v1',
            d: 'M' + DV.geo.users.cx + ',' + DV.geo.users.cy + ' L' + gc.outX + ',' + gc.cy +
                ' C' + (gc.outX + 38) + ',' + gc.cy + ' ' + (box.x - 38) + ',' + box.cy + ' ' + (box.x + 60) + ',' + box.cy
        });
    });
    wrap.innerHTML = html;
    if (rg) rg.innerHTML = conn;
    DV.state.board.groups = geo;
    DV.particles.setFlow(flowPaths);
};

/* ===== Traffic Router ===== */
DV.setTraffic = function(spec) {
    var v1 = spec.v1 != null ? spec.v1 : 0;
    var v2 = spec.v2 != null ? spec.v2 : 0;
    var total = v1 + v2 || 1;
    var barW = 120;
    var w1 = barW * v1 / total;
    var s1 = document.getElementById('dv-rt-v1');
    var s2 = document.getElementById('dv-rt-v2');
    if (s1) { s1.setAttribute('width', Math.max(w1, 0.01)); }
    if (s2) { s2.setAttribute('x', w1); s2.setAttribute('width', Math.max(barW - w1, 0.01)); }
    var lbl = document.getElementById('dv-rt-label');
    if (lbl) lbl.textContent = v1 + '% v1 / ' + v2 + '% v2';
    var mirror = document.getElementById('dv-rt-mirror');
    if (mirror) mirror.style.display = spec.mirror ? '' : 'none';
    DV.particles.setWeights(v1, v2);
    DV.particles.setMirror(!!spec.mirror);
};

/* ===== Service mini-diagrams ===== */
DV._svcDerive = {
    db: function(p) {
        var m = (p.migration || '').toLowerCase();
        var phase = 'idle';
        if (/fail/.test(m)) phase = 'fail';
        else if (/restor|rolled back|discard/.test(m)) phase = 'restore';
        else if (/breaking|rename/.test(m)) phase = 'break';
        else if (/contract|drop/.test(m)) phase = 'contract';
        else if (/expand|add column/.test(m)) phase = 'expand';
        else if (/running|restoring|alter table/.test(m)) phase = 'run';
        else if (/applied|✓/.test(m)) phase = 'done';
        return phase;
    },
    cacheFill: function(p) {
        var s = (p.state || '').toLowerCase();
        if (/warming/.test(s)) return 0.5;
        if (/mixed/.test(s)) return 0.55;
        if (/flush|cold/.test(s)) return 0;
        if (/warm/.test(s)) return 1;
        return 1;
    },
    queueCount: function(p) {
        var v = String(p.messages || '');
        if (/drain/i.test(v)) return -1;
        var m = v.match(/^(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
    },
    searchPct: function(p) {
        var v = String(p.reindex || '');
        if (/100|✓/.test(v)) return 100;
        var m = v.match(/(\d+)\s*%/);
        return m ? parseInt(m[1], 10) : -1;
    }
};

DV._mini = {
    db: function(patch) {
        var phase = DV._svcDerive.db(patch);
        var cls = 'dv-col--' + phase;
        var bars = (phase === 'expand') ? 5 : 4;
        var s = '';
        for (var i = 0; i < bars; i++) {
            var isNew = (phase === 'expand' && i === 4);
            s += '<rect class="dv-col ' + (isNew ? 'dv-col--new' : cls) + '" x="' + (i * 26) + '" y="6" width="18" height="26" rx="2"/>';
        }
        if (phase === 'run') s += '<text class="dv-mini-mark" x="142" y="26">&#x1F512;</text>';
        else if (phase === 'fail') s += '<text class="dv-mini-mark dv-mark--bad" x="142" y="26">&#x2715;</text>';
        else if (phase === 'expand') s += '<text class="dv-mini-mark dv-mark--ok" x="148" y="26">+1</text>';
        else if (phase === 'contract') s += '<text class="dv-mini-mark dv-mark--ok" x="148" y="26">&#x2212;1</text>';
        else if (phase === 'done' || phase === 'restore') s += '<text class="dv-mini-mark dv-mark--ok" x="142" y="26">&#x2713;</text>';
        else if (phase === 'break') s += '<text class="dv-mini-mark dv-mark--bad" x="142" y="26">&#x26A0;</text>';
        return s;
    },
    cache: function(patch) {
        var fill = DV._svcDerive.cacheFill(patch);
        var cols = 12, rows = 3, total = cols * rows;
        var on = Math.round(total * fill);
        var s = '';
        for (var i = 0; i < total; i++) {
            var c = i % cols, r = Math.floor(i / cols);
            var lit = i < on;
            s += '<rect class="dv-cell ' + (lit ? 'dv-cell--on' : 'dv-cell--off') + '" x="' +
                (c * 13) + '" y="' + (r * 11) + '" width="10" height="8" rx="1.5"/>';
        }
        return s;
    },
    queue: function(patch) {
        var cnt = DV._svcDerive.queueCount(patch);
        var draining = cnt === -1;
        var show = draining ? 4 : Math.min(Math.max(cnt, 0), 8);
        var s = '<rect class="dv-q-lane" x="0" y="9" width="208" height="18" rx="3"/>' +
            '<circle class="dv-q-end" cx="6" cy="18" r="4"/>' +
            '<circle class="dv-q-end" cx="202" cy="18" r="4"/>';
        for (var i = 0; i < show; i++) {
            s += '<rect class="dv-q-msg' + (draining ? ' dv-q-msg--drain' : '') + '" x="' +
                (18 + i * 22) + '" y="11" width="16" height="14" rx="2"/>';
        }
        if (cnt === 0 && !draining) s += '<text class="dv-mini-sub" x="104" y="22">empty</text>';
        return s;
    },
    search: function(patch) {
        var pct = DV._svcDerive.searchPct(patch);
        var idx = String(patch.index || '');
        var activeV2 = /idx_v2|&#x2192; idx_v2|v2/.test(idx) && !/idx_v1 live/.test(idx);
        var s =
            '<rect class="dv-idx ' + (activeV2 ? '' : 'dv-idx--active') + '" x="0" y="2" width="58" height="20" rx="3"/>' +
            '<text class="dv-idx-t" x="29" y="16">idx_v1</text>' +
            '<rect class="dv-idx ' + (activeV2 ? 'dv-idx--active' : '') + '" x="70" y="2" width="58" height="20" rx="3"/>' +
            '<text class="dv-idx-t" x="99" y="16">idx_v2</text>' +
            '<text class="dv-idx-alias" x="140" y="16">alias&#x2192;' + (activeV2 ? 'v2' : 'v1') + '</text>';
        if (pct >= 0) {
            s += '<rect class="dv-bar-track" x="0" y="29" width="200" height="6" rx="3"/>' +
                '<rect class="dv-bar-fill" x="0" y="29" width="' + (200 * pct / 100) + '" height="6" rx="3"/>';
        }
        return s;
    }
};

DV._svcCaption = {
    db: function(p) { return DV._decode(p.schema || ''); },
    cache: function(p) { return DV._decode((p.state || '') + (p.keys ? '  ·  ' + p.keys : '')); },
    queue: function(p) { return DV._decode(p.consumers || ''); },
    search: function(p) { return DV._decode(p.index || ''); }
};

DV._svcState = { db: {}, cache: {}, queue: {}, search: {} };

DV.setService = function(id, patch) {
    var node = document.getElementById('dv-svc-' + id);
    if (!node || !patch) return;
    var st = DV._svcState[id] || (DV._svcState[id] = {});
    Object.keys(patch).forEach(function(k) { st[k] = patch[k]; });

    if (patch.status) node.setAttribute('class', 'dv-svc dv-svc--' + patch.status);

    var cap = document.getElementById('dv-cap-' + id);
    if (cap && DV._svcCaption[id]) {
        var c = DV._svcCaption[id](st);
        if (c) cap.textContent = c;
    }
    var mini = document.getElementById('dv-mini-' + id);
    if (mini && DV._mini[id]) mini.innerHTML = DV._mini[id](st);

    if (patch.pulse) DV.ioPulse(id, patch.pulse);
    else if (patch.io && patch.io !== 'idle') DV.ioPulse(id, patch.io);
};

/* ===== I/O Pulse ===== */
DV.ioPulse = function(id, ioType) {
    var led = document.getElementById('dv-led-' + id);
    if (led) {
        led.setAttribute('class', 'dv-svc-led');
        if (led.getBoundingClientRect) led.getBoundingClientRect();
        led.setAttribute('class', 'dv-svc-led dv-led--active dv-led--' + ioType);
    }
    DV.particles.io(id, ioType);
};

/* ===== Feature Flag ===== */
DV.setFlag = function(spec) {
    var node = document.getElementById('dv-svg-flag');
    if (!node) return;
    node.style.display = '';
    var on = spec.state === 'on';
    node.setAttribute('class', on ? 'dv-flag--on' : 'dv-flag--off');
    node.setAttribute('transform', 'translate(486,350)');
    node.innerHTML =
        '<title>' + DV._txt(I18N.t('dv.tooltip.flag', null, 'Feature flag')) + '</title>' +
        '<rect class="dv-flag-bg" x="0" y="0" width="222" height="40" rx="8"/>' +
        '<text class="dv-flag-glyph" x="16" y="26">&#x1F6A9;</text>' +
        '<text class="dv-flag-name" x="38" y="25">' + DV._txt(I18N.t('dv.ui.flag', null, 'Feature flag')) + '</text>' +
        '<rect class="dv-flag-pill" x="120" y="9" width="44" height="22" rx="11"/>' +
        '<text class="dv-flag-state" x="142" y="24">' + (on ? 'ON' : 'OFF') + '</text>' +
        '<text class="dv-flag-pct" x="208" y="25">' + (spec.pct != null ? spec.pct + '%' : '') + '</text>';
};

/* ===== Outage ===== */
DV.setOutage = function(on) {
    DV.state.board.outage = on;
    var o = document.getElementById('dv-svg-outage');
    if (o) o.style.display = on ? '' : 'none';
    var svg = document.getElementById('dv-svg');
    if (svg) svg.setAttribute('class', on ? 'dv-svg dv-svg--outage' : 'dv-svg');
    DV.particles.setOutage(on);
};

/* ===== Particles ===== */
DV.particles = {
    _timer: null, _flow: [], _io: {}, _w: { v1: 100, v2: 0 }, _outage: false, _mirror: false
};
DV.particles.setFlow = function(paths) { this._flow = paths || []; };
DV.particles.setIoPaths = function(io) { this._io = io || {}; };
DV.particles.setWeights = function(v1, v2) { this._w = { v1: v1, v2: v2 }; };
DV.particles.setMirror = function(b) { this._mirror = !!b; };
DV.particles.setOutage = function(b) { this._outage = !!b; };

DV.particles._reduced = function() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
};

DV.particles._spawn = function(d, cls, dur) {
    var layer = document.getElementById('dv-particles');
    if (!layer || layer.childNodes.length > 46) return;
    var ns = DV.SVGNS;
    var c = document.createElementNS(ns, 'circle');
    c.setAttribute('r', '4.2');
    c.setAttribute('cx', '0');
    c.setAttribute('cy', '0');
    c.setAttribute('class', 'dv-particle ' + cls);
    var am = document.createElementNS(ns, 'animateMotion');
    am.setAttribute('dur', dur + 's');
    am.setAttribute('path', d);
    am.setAttribute('begin', 'indefinite');
    am.setAttribute('fill', 'remove');
    am.setAttribute('rotate', '0');
    c.appendChild(am);
    layer.appendChild(c);
    try { am.beginElement(); } catch (e) {}
    setTimeout(function() { if (c.parentNode) c.parentNode.removeChild(c); }, dur * 1000 + 260);
};

DV.particles.tick = function() {
    var p = DV.particles;
    if (document.hidden || p._reduced()) return;
    if (p._outage) {
        var g = DV.geo;
        p._spawn('M' + g.users.cx + ',' + g.users.cy + ' L' + g.router.outX + ',' + g.router.cy,
            'dv-particle--fail', 0.9);
        return;
    }
    if (!p._flow.length) return;
    var w = p._w, total = Math.max(w.v1 + w.v2, 1);
    var wantV2 = (Math.random() * total) > w.v1;
    var path = null, i;
    for (i = 0; i < p._flow.length; i++) {
        if ((p._flow[i].version === 'v2') === wantV2) { path = p._flow[i]; break; }
    }
    if (!path) path = p._flow[0];
    p._spawn(path.d, 'dv-particle--' + path.version, 1.5 + Math.random() * 0.5);
    if (p._mirror) {
        for (i = 0; i < p._flow.length; i++) {
            if (p._flow[i].version === 'v2') { p._spawn(p._flow[i].d, 'dv-particle--mirror', 1.9); break; }
        }
    }
};

DV.particles.io = function(svcId, type) {
    var d = DV.particles._io[svcId];
    if (!d || DV.particles._reduced()) return;
    var bad = (type === 'error' || type === 'lock' || type === 'flush' || type === 'miss');
    DV.particles._spawn(d, 'dv-particle--io ' + (bad ? 'dv-particle--io-bad' : 'dv-particle--io-ok'), 0.85);
};

DV.particles.start = function() {
    DV.particles.stop();
    if (DV.particles._reduced()) return;
    DV.particles._timer = setInterval(DV.particles.tick, 480);
};
DV.particles.stop = function() {
    if (DV.particles._timer) { clearInterval(DV.particles._timer); DV.particles._timer = null; }
    var layer = document.getElementById('dv-particles');
    if (layer) layer.innerHTML = '';
};

/* ===== Apply one step's effects ===== */
DV._applyStep = function(step) {
    if (step.stage) DV.setStage(step.stage);
    if (step.stageFail) DV.failStage(step.stageFail);
    if (step.stageDone) DV.setStageState(step.stageDone, 'done');
    if (step.rollback) DV.showRollback();
    if (step.instances) DV.setInstances(step.instances);
    if (step.traffic) {
        DV.setTraffic(step.traffic);
        if (step.traffic.v2 != null) DV.state.v2Traffic = step.traffic.v2;
    }
    if (step.flag) DV.setFlag(step.flag);
    if (step.services) {
        Object.keys(step.services).forEach(function(k) { DV.setService(k, step.services[k]); });
    }
    if (step.outage === 'start') DV.setOutage(true);
    if (step.outage === 'end') DV.setOutage(false);
    if (step.setV2 != null) DV.state.v2Traffic = step.setV2;
    if (step.addDowntime) DV.state.downtime += step.addDowntime;
    if (step.addErrors) DV.state.errors += step.addErrors;
    if (step.addRollback) DV.state.rollbacks += step.addRollback;
    DV.updateStats();
};

DV._stepText = function(step) {
    return step.descKey ? I18N.t(step.descKey, step.descParams || null, step.desc || step.descKey) : (step.desc || '');
};

DV._logStep = function(step, stepNum) {
    var prefix = I18N.t('ui.log.step', { n: stepNum }, 'Step ' + stepNum);
    DV.log(step.logType || 'INFO', prefix + ': ' + DV._stepText(step));
};

/* ===== Animate Flow ===== */
DV.animateFlow = async function(steps, options) {
    if (DV.state.running) return;
    if (DV.stepMode.active) DV.exitStepMode();

    DV.resetStats();
    DV.clearLog();
    DV.state.running = true;
    DV.state.paused = false;
    DV.state.stepIndex = 0;
    DV.state._flowSteps = steps;
    DV.state._flowOptions = options || {};

    var startLabel = options && options.startKey
        ? I18N.t(options.startKey, null, options.startLabel || 'Deployment started')
        : I18N.t('dv.log.started', null, 'Deployment started');
    DV.log('PIPELINE', startLabel);

    var startTime = performance.now();
    for (var i = 0; i < steps.length; i++) {
        if (!DV.state.running) break;
        var step = steps[i];
        DV.state.stepIndex = i + 1;
        DV._applyStep(step);
        DV._logStep(step, i + 1);
        var delay = step.delay !== undefined ? step.delay : DV.state.stepDelay;
        await DV.sleep(delay);
    }

    if (DV.state.running) {
        DV._finishActiveStage();
        var elapsed = Math.round(performance.now() - startTime);
        DV.log('DONE', I18N.t('dv.log.finished', { steps: steps.length, time: elapsed },
            'Flow finished (' + steps.length + ' steps, ' + elapsed + 'ms)'));
    }
    DV.state.running = false;
    DV.state.paused = false;
    DV.state._flowSteps = null;
    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }
};

/* ===== Step Mode (replay-based) ===== */
DV.stepMode = { active: false, steps: null, index: 0, options: null, initFn: null };

DV.startStepMode = function(steps, options, initFn) {
    DV.state.running = false;
    DV.resetStats();
    DV.clearLog();
    if (initFn) initFn();
    DV.stepMode.active = true;
    DV.stepMode.steps = steps;
    DV.stepMode.index = 0;
    DV.stepMode.options = options || {};
    DV.stepMode.initFn = initFn;
    var startLabel = options && options.startKey
        ? I18N.t(options.startKey, null, options.startLabel || 'Step mode')
        : I18N.t('dv.log.step_mode', null, 'Step mode started');
    DV.log('PIPELINE', startLabel);
    DV._updateStepButtons();
};

DV.stepForward = function() {
    var sm = DV.stepMode;
    if (!sm.active || sm.index >= sm.steps.length) return;
    var step = sm.steps[sm.index];
    DV._applyStep(step);
    DV._logStep(step, sm.index + 1);
    sm.index++;
    DV.state.stepIndex = sm.index;
    if (sm.index >= sm.steps.length) {
        DV._finishActiveStage();
        DV.log('DONE', I18N.t('dv.log.finished_steps', { steps: sm.steps.length },
            'Flow finished (' + sm.steps.length + ' steps)'));
    }
    DV._updateStepButtons();
};

DV.stepBack = function() {
    var sm = DV.stepMode;
    if (!sm.active || sm.index <= 0) return;
    sm.index--;
    DV.resetStats();
    DV.clearLog();
    if (sm.initFn) sm.initFn();
    for (var i = 0; i < sm.index; i++) {
        DV._applyStep(sm.steps[i]);
        DV._logStep(sm.steps[i], i + 1);
    }
    DV.state.stepIndex = sm.index;
    DV._updateStepButtons();
};

DV.exitStepMode = function() {
    DV.stepMode.active = false;
    DV.stepMode.steps = null;
    DV.stepMode.index = 0;
    DV.stepMode.initFn = null;
    DV._updateStepButtons();
};

DV._updateStepButtons = function() {
    var sm = DV.stepMode;
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

/* ===== Strategy Properties Panel ===== */
DV.showProperties = function(props) {
    var body = document.getElementById('dep-rules-body');
    if (!body) return;
    if (!props || !props.length) { body.innerHTML = ''; return; }
    body.innerHTML = props.map(function(p) {
        var icon = p.type === 'good' ? '&#x2705;' : (p.type === 'bad' ? '&#x26A0;' : '&#x2139;');
        return '<div class="dv-prop dv-prop--' + (p.type || 'info') + '">' +
            '<span class="dv-prop-icon">' + icon + '</span>' +
            '<span class="dv-prop-name">' + I18N.t(p.nameKey, null, p.nameKey) + '</span>' +
            '<span class="dv-prop-value">' + I18N.t(p.valueKey, null, p.valueKey) + '</span>' +
            '</div>';
    }).join('');
};

/* ===== Details Panel ===== */
DV.showDetails = function(strategyId) {
    var container = document.getElementById('pattern-details');
    var body = document.getElementById('pattern-details-body');
    var toggle = document.getElementById('pattern-details-toggle');
    if (!container || !body || !toggle) return;

    var principles = I18N.ta('dv.' + strategyId + '.principles', []);
    var concepts = I18N.to('dv.' + strategyId + '.concepts', []);

    if (!principles.length && !concepts.length) {
        container.style.display = 'none';
        return;
    }
    var html = '';
    if (principles.length) {
        html += '<div class="pattern-details-section">' +
            '<div class="pattern-details-section-title">' + I18N.t('ui.details.principles', null, 'Principles') + '</div>' +
            '<ul class="pattern-details-list">' +
            principles.map(function(p) { return '<li>' + p + '</li>'; }).join('') +
            '</ul></div>';
    }
    if (concepts.length) {
        html += '<div class="pattern-details-section">' +
            '<div class="pattern-details-section-title">' + I18N.t('ui.details.concepts', null, 'Key Concepts') + '</div>' +
            '<div class="pattern-concepts-grid">' +
            concepts.map(function(c) {
                return '<div class="pattern-concept">' +
                    '<span class="pattern-concept-term">' + c.term + '</span>' +
                    '<span class="pattern-concept-def">' + c.definition + '</span>' +
                    '</div>';
            }).join('') +
            '</div></div>';
    }
    body.innerHTML = html;
    body.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
    container.style.display = 'block';
};

/* ===== Trade-offs Panel ===== */
DV.showTradeoffs = function(strategyId) {
    var container = document.getElementById('tradeoffs-panel');
    var body = document.getElementById('tradeoffs-body');
    var toggle = document.getElementById('tradeoffs-toggle');
    if (!container || !body || !toggle) return;

    var pros = I18N.ta('dv.' + strategyId + '.pros', []);
    var cons = I18N.ta('dv.' + strategyId + '.cons', []);
    var whenToUse = I18N.t('dv.' + strategyId + '.whenToUse', null, '');

    if (!pros.length && !cons.length && !whenToUse) {
        container.style.display = 'none';
        return;
    }
    var html = '<div class="tradeoffs-grid">';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title pros">&#x2705; ' +
        I18N.t('ui.tradeoffs.pros', null, 'Pros') + '</div>';
    pros.forEach(function(p) { html += '<div class="tradeoffs-item pro">' + p + '</div>'; });
    html += '</div>';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title cons">&#x274C; ' +
        I18N.t('ui.tradeoffs.cons', null, 'Cons') + '</div>';
    cons.forEach(function(c) { html += '<div class="tradeoffs-item con">' + c + '</div>'; });
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
