/* ===== Architecture Visualizer Engine ===== */

const ARCHV = window.ARCHV || {};
window.ARCHV = ARCHV;

ARCHV.state = {
    arch: 'layered',
    mode: null,
    running: false,
    paused: false,
    _pauseResolve: null,
    stepIndex: 0,

    requestId: 0,
    stepDelay: 600,
    layersTraversed: 0,
    componentsHit: 0,
    depsUsed: 0
};

/* ===== Event Log ===== */
ARCHV.log = function(type, text) {
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
    typeSpan.textContent = type;

    var textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(typeSpan);
    entry.appendChild(textSpan);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

ARCHV.clearLog = function() {
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

ARCHV.copyLog = function() {
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
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
    });
};

/* ===== Stats ===== */
ARCHV.updateStats = function() {
    var s = ARCHV.state;
    document.getElementById('stat-layers').textContent = s.layersTraversed;
    document.getElementById('stat-components').textContent = s.componentsHit;
};

ARCHV.resetStats = function() {
    var s = ARCHV.state;
    s.layersTraversed = 0;
    s.componentsHit = 0;
    s.requestId = 0;
    s.stepIndex = 0;
    s.running = false;
    ARCHV.updateStats();
};

ARCHV.addStats = function(layers, components, deps, time) {
    ARCHV.state.layersTraversed += layers;
    ARCHV.state.componentsHit += components;
    ARCHV.state.depsUsed += deps;
    ARCHV.updateStats();
};

/* ===== Helpers ===== */
ARCHV.sleep = async function(ms) {
    await new Promise(function(r) { setTimeout(r, ms); });
    while (ARCHV.state.paused) {
        await new Promise(function(r) { ARCHV.state._pauseResolve = r; });
    }
};

ARCHV.pause = function() {
    ARCHV.state.paused = true;
};

ARCHV.resume = function() {
    ARCHV.state.paused = false;
    if (ARCHV.state._pauseResolve) {
        ARCHV.state._pauseResolve();
        ARCHV.state._pauseResolve = null;
    }
};

ARCHV.nextRequestId = function() {
    return ++ARCHV.state.requestId;
};

/* ===== Accent Colors ===== */
ARCHV.setAccentColors = function(archId) {
    var root = document.documentElement.style;
    var themes = {
        layered:        { accent: '#6366F1', bg: '#161830', light: '#1e2248' },
        clean:          { accent: '#8B5CF6', bg: '#1a1630', light: '#241e48' },
        hexagonal:      { accent: '#06B6D4', bg: '#0d1f24', light: '#153038' },
        ddd:            { accent: '#F59E0B', bg: '#1f1a0d', light: '#302615' },
        cqrs:           { accent: '#10B981', bg: '#0d1f18', light: '#153024' },
        eventsourcing:  { accent: '#EC4899', bg: '#1f0d1a', light: '#301524' },
        eda:            { accent: '#F97316', bg: '#1f150d', light: '#302015' },
        mvc:            { accent: '#EF4444', bg: '#1f0d0d', light: '#301515' }
    };
    var t = themes[archId] || themes.layered;
    root.setProperty('--archv-accent', t.accent);
    root.setProperty('--archv-accent-bg', t.bg);
    root.setProperty('--archv-accent-light', t.light);
};

/* ===== Clear Animations ===== */
ARCHV.clearAnimations = function() {
    var svg = document.getElementById('archv-svg-layer');
    if (svg) svg.innerHTML = '';
    ARCHV.state.running = false;
    document.querySelectorAll('.archv-active, .archv-visited, .archv-layer-active, .archv-ring-active').forEach(function(el) {
        el.classList.remove('archv-active', 'archv-visited', 'archv-layer-active', 'archv-ring-active');
    });
    document.querySelectorAll('.archv-step-indicator').forEach(function(el) {
        el.remove();
    });
};

/* ===== Render Component ===== */
ARCHV.renderComponent = function(id, name, icon) {
    return '<span class="archv-component" id="' + id + '">' +
        (icon ? '<span class="comp-icon">' + icon + '</span>' : '') +
        name + '</span>';
};

/* ===== Render Arrow Connector ===== */
ARCHV.renderArrowConnector = function(label) {
    return '<div class="archv-arrow-connector">' +
        '<span>&#x25BC;</span>' +
        (label ? '<span class="archv-arrow-label">' + label + '</span>' : '') +
        '</div>';
};

/* ===== Show Step Label ===== */
ARCHV._showStepLabel = function(el, stepNum, label) {
    if (!el) return;
    document.querySelectorAll('.archv-step-indicator').forEach(function(s) { s.remove(); });
    var indicator = document.createElement('div');
    indicator.className = 'archv-step-indicator';
    indicator.textContent = stepNum + '. ' + label;
    el.appendChild(indicator);
};

/* ===== Animate Flow ===== */
ARCHV.animateFlow = async function(steps, options) {
    if (ARCHV.state.running) return;
    ARCHV.state.running = true;
    ARCHV.state.stepIndex = 0;

    var svg = document.getElementById('archv-svg-layer');
    if (svg) svg.innerHTML = '';
    document.querySelectorAll('.archv-visited').forEach(function(el) {
        el.classList.remove('archv-visited');
    });

    var delay = options && options.delay ? options.delay : ARCHV.state.stepDelay;
    var reqId = ARCHV.nextRequestId();
    var startTime = performance.now();
    var layersSet = new Set();
    var depsCount = 0;

    ARCHV.log('REQUEST', 'R' + reqId + ': ' + (options && options.requestLabel ? options.requestLabel : 'Request initiated'));

    for (var i = 0; i < steps.length; i++) {
        if (!ARCHV.state.running) break;

        var step = steps[i];
        var el = document.getElementById(step.elementId);
        ARCHV.state.stepIndex = i + 1;

        if (step.layerId) {
            var layerEl = document.getElementById(step.layerId);
            if (layerEl) {
                layerEl.classList.add('archv-layer-active');
                layersSet.add(step.layerId);
            }
        }

        if (el) {
            el.classList.add('archv-active');
            ARCHV._showStepLabel(el, i + 1, step.label);
        }

        ARCHV.log(step.logType || 'FLOW', 'Step ' + (i + 1) + ': ' + step.label + (step.description ? ' - ' + step.description : ''));

        if (i > 0 && el) {
            var prevEl = document.getElementById(steps[i - 1].elementId);
            if (prevEl) {
                ARCHV._drawArrow(prevEl, el, step.logType, i + 1);
                depsCount++;
            }
        } else if (el) {
            ARCHV._drawStepBadge(el, i + 1);
        }

        await ARCHV.sleep(ARCHV.state.stepDelay);

        if (el) {
            el.classList.remove('archv-active');
            el.classList.add('archv-visited');
        }
        document.querySelectorAll('.archv-step-indicator').forEach(function(s) { s.remove(); });
    }

    var elapsed = Math.round(performance.now() - startTime);
    if (ARCHV.state.running) {
        ARCHV.addStats(layersSet.size, steps.length, depsCount, elapsed);
        ARCHV.log('RESPONSE', 'R' + reqId + ': Flow completed in ' + elapsed + 'ms (' + steps.length + ' steps)');
    }
    ARCHV.state.running = false;
    ARCHV.state.paused = false;
    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; Pause';
    }
};

/* ===== Ensure Shared Arrow Markers ===== */
ARCHV._ensureArrowMarker = function(svg) {
    if (svg.querySelector('#archv-arrowhead')) return;
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'archv-arrowhead');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 8 3, 0 6');
    polygon.setAttribute('class', 'flow-arrow-head');
    marker.appendChild(polygon);
    defs.appendChild(marker);

    var markerResp = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerResp.setAttribute('id', 'archv-arrowhead-response');
    markerResp.setAttribute('markerWidth', '8');
    markerResp.setAttribute('markerHeight', '6');
    markerResp.setAttribute('refX', '8');
    markerResp.setAttribute('refY', '3');
    markerResp.setAttribute('orient', 'auto');
    var polygonResp = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygonResp.setAttribute('points', '0 0, 8 3, 0 6');
    polygonResp.setAttribute('class', 'flow-arrow-head-response');
    markerResp.appendChild(polygonResp);
    defs.appendChild(markerResp);

    svg.appendChild(defs);
};

/* ===== Edge Point: find where a line from rect center toward target exits the rect ===== */
ARCHV._edgePoint = function(rect, areaRect, targetX, targetY, padding) {
    var cx = rect.left + rect.width / 2 - areaRect.left;
    var cy = rect.top + rect.height / 2 - areaRect.top;
    var hw = rect.width / 2 + (padding || 0);
    var hh = rect.height / 2 + (padding || 0);

    var dx = targetX - cx;
    var dy = targetY - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };

    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);

    if (absDx * hh > absDy * hw) {
        var sign = dx > 0 ? 1 : -1;
        return { x: cx + sign * hw, y: cy + dy * (hw / absDx) };
    } else {
        var sign = dy > 0 ? 1 : -1;
        return { x: cx + dx * (hh / absDy), y: cy + sign * hh };
    }
};

/* ===== Draw Step Badge on Element ===== */
ARCHV._drawStepBadge = function(el, stepNum) {
    var svg = document.getElementById('archv-svg-layer');
    if (!svg || !el) return;

    var vizArea = document.getElementById('viz-area');
    var areaRect = vizArea.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();

    var x = elRect.left - areaRect.left - 14;
    var y = elRect.top - areaRect.top + elRect.height / 2;

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '10');
    circle.setAttribute('class', 'flow-step-bg');
    svg.appendChild(circle);

    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', 'flow-step-num');
    text.textContent = stepNum;
    svg.appendChild(text);
};

/* ===== Draw Arrow Between Elements ===== */
ARCHV._drawArrow = function(fromEl, toEl, flowType, stepNum) {
    var svg = document.getElementById('archv-svg-layer');
    if (!svg || !fromEl || !toEl) return;

    ARCHV._ensureArrowMarker(svg);

    var vizArea = document.getElementById('viz-area');
    var areaRect = vizArea.getBoundingClientRect();
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = toEl.getBoundingClientRect();

    var cx1 = fromRect.left + fromRect.width / 2 - areaRect.left;
    var cy1 = fromRect.top + fromRect.height / 2 - areaRect.top;
    var cx2 = toRect.left + toRect.width / 2 - areaRect.left;
    var cy2 = toRect.top + toRect.height / 2 - areaRect.top;

    var from = ARCHV._edgePoint(fromRect, areaRect, cx2, cy2, 2);
    var to = ARCHV._edgePoint(toRect, areaRect, cx1, cy1, 2);

    var x1 = from.x, y1 = from.y;
    var x2 = to.x, y2 = to.y;

    var isResponse = flowType === 'RESPONSE';
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dist = Math.sqrt(dx * dx + dy * dy);

    var baseCurve = dist > 50 ? Math.min(dist * 0.25, 80) : 0;
    var curvature = baseCurve;
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var nx = dist > 0 ? -dy / dist : 0;
    var ny = dist > 0 ? dx / dist : 0;
    var cpx = mx + nx * curvature;
    var cpy = my + ny * curvature;

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var d = 'M ' + x1 + ' ' + y1 + ' Q ' + cpx + ' ' + cpy + ' ' + x2 + ' ' + y2;
    path.setAttribute('d', d);
    path.setAttribute('class', isResponse ? 'flow-arrow flow-arrow-response' : 'flow-arrow');
    path.setAttribute('marker-end', isResponse ? 'url(#archv-arrowhead-response)' : 'url(#archv-arrowhead)');
    svg.appendChild(path);

    if (stepNum) {
        var t = 0.2;
        var labelX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpx + t * t * x2;
        var labelY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpy + t * t * y2;

        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', labelX);
        circle.setAttribute('cy', labelY);
        circle.setAttribute('r', '10');
        circle.setAttribute('class', isResponse ? 'flow-step-bg flow-step-bg-response' : 'flow-step-bg');
        svg.appendChild(circle);

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('class', 'flow-step-num');
        text.textContent = stepNum;
        svg.appendChild(text);
    }
};

/* ===== Dependency Rules ===== */
ARCHV.showDependencyRules = function(rules) {
    var body = document.getElementById('dep-rules-body');
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
