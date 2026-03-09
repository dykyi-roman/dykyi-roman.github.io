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
        hexagonal:      { accent: '#3B82F6', bg: '#0d1630', light: '#152048' },
        ddd:            { accent: '#F59E0B', bg: '#1f1a0d', light: '#302615' },
        cqrs:           { accent: '#10B981', bg: '#0d1f18', light: '#153024' },
        eventsourcing:  { accent: '#EC4899', bg: '#1f0d1a', light: '#301524' },
        eda:            { accent: '#F97316', bg: '#1f150d', light: '#302015' },
        microservices:  { accent: '#84CC16', bg: '#1a1f0d', light: '#283015' },
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
ARCHV.renderComponent = function(id, name, icon, tooltip) {
    return '<span class="archv-component" id="' + id + '"' +
        (tooltip ? ' data-tooltip="' + tooltip.replace(/"/g, '&quot;') + '"' : '') +
        '>' +
        (icon ? '<span class="comp-icon">' + icon + '</span>' : '') +
        name + '</span>';
};

/* ===== Tooltip System ===== */
ARCHV._initTooltips = function() {
    document.addEventListener('mouseover', function(e) {
        var target = e.target.closest('[data-tooltip]');
        if (!target || target.querySelector('.archv-tooltip')) return;
        var tip = document.createElement('div');
        tip.className = 'archv-tooltip';
        tip.textContent = target.getAttribute('data-tooltip');
        target.appendChild(tip);
    });
    document.addEventListener('mouseout', function(e) {
        var target = e.target.closest('[data-tooltip]');
        if (!target) return;
        var tip = target.querySelector('.archv-tooltip');
        if (tip) tip.remove();
    });
};

ARCHV._tooltipsInitialized = false;
ARCHV.ensureTooltips = function() {
    if (!ARCHV._tooltipsInitialized) {
        ARCHV._initTooltips();
        ARCHV._tooltipsInitialized = true;
    }
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

    if (ARCHV.stepMode.active) {
        ARCHV.exitStepMode();
        ARCHV.clearAnimations();
        ARCHV.resetStats();
        ARCHV.clearLog();
    }

    ARCHV.state.layersTraversed = 0;
    ARCHV.state.componentsHit = 0;
    ARCHV.state.depsUsed = 0;
    ARCHV.updateStats();

    ARCHV.state.running = true;
    ARCHV.state.stepIndex = 0;
    ARCHV.state._flowSteps = steps;
    ARCHV.state._flowOptions = options;

    var svg = document.getElementById('archv-svg-layer');
    if (svg) svg.innerHTML = '';
    document.querySelectorAll('.archv-visited').forEach(function(el) {
        el.classList.remove('archv-visited');
    });

    var customDelay = options && options.delay ? options.delay : 0;
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
            if (step.noArrowFromPrev) {
                ARCHV._drawStepBadge(el, i + 1);
            } else {
                var sourceEl = step.arrowFromId
                    ? document.getElementById(step.arrowFromId)
                    : document.getElementById(steps[i - 1].elementId);
                if (sourceEl) {
                    ARCHV._drawArrow(sourceEl, el, step.logType, i + 1, step.arrowFromOffset, step.arrowToOffset);
                    depsCount++;
                }
            }
        } else if (el) {
            ARCHV._drawStepBadge(el, i + 1);
        }

        var stepDelay = step.delay !== undefined ? step.delay : (customDelay || ARCHV.state.stepDelay);
        await ARCHV.sleep(stepDelay);

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
    ARCHV.state._flowSteps = null;
    ARCHV.state._flowOptions = null;
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

    var markerAsync = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerAsync.setAttribute('id', 'archv-arrowhead-async');
    markerAsync.setAttribute('markerWidth', '8');
    markerAsync.setAttribute('markerHeight', '6');
    markerAsync.setAttribute('refX', '8');
    markerAsync.setAttribute('refY', '3');
    markerAsync.setAttribute('orient', 'auto');
    var polygonAsync = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygonAsync.setAttribute('points', '0 0, 8 3, 0 6');
    polygonAsync.setAttribute('class', 'flow-arrow-head-async');
    markerAsync.appendChild(polygonAsync);
    defs.appendChild(markerAsync);

    var markerReplay = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerReplay.setAttribute('id', 'archv-arrowhead-replay');
    markerReplay.setAttribute('markerWidth', '8');
    markerReplay.setAttribute('markerHeight', '6');
    markerReplay.setAttribute('refX', '8');
    markerReplay.setAttribute('refY', '3');
    markerReplay.setAttribute('orient', 'auto');
    var polygonReplay = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygonReplay.setAttribute('points', '0 0, 8 3, 0 6');
    polygonReplay.setAttribute('class', 'flow-arrow-head-replay');
    markerReplay.appendChild(polygonReplay);
    defs.appendChild(markerReplay);

    var markerWrite = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerWrite.setAttribute('id', 'archv-arrowhead-write');
    markerWrite.setAttribute('markerWidth', '8');
    markerWrite.setAttribute('markerHeight', '6');
    markerWrite.setAttribute('refX', '8');
    markerWrite.setAttribute('refY', '3');
    markerWrite.setAttribute('orient', 'auto');
    var polygonWrite = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygonWrite.setAttribute('points', '0 0, 8 3, 0 6');
    polygonWrite.setAttribute('class', 'flow-arrow-head-write');
    markerWrite.appendChild(polygonWrite);
    defs.appendChild(markerWrite);

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
ARCHV._drawArrow = function(fromEl, toEl, flowType, stepNum, sourceOffset, targetOffset) {
    var svg = document.getElementById('archv-svg-layer');
    if (!svg || !fromEl || !toEl) return;

    ARCHV._ensureArrowMarker(svg);

    var vizArea = document.getElementById('viz-area');
    var areaRect = vizArea.getBoundingClientRect();
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = toEl.getBoundingClientRect();

    var srcOffPx = sourceOffset ? sourceOffset * fromRect.width : 0;
    var tgtOffPx = targetOffset ? targetOffset * toRect.width : 0;
    var cx1 = fromRect.left + fromRect.width / 2 + srcOffPx - areaRect.left;
    var cy1 = fromRect.top + fromRect.height / 2 - areaRect.top;
    var cx2 = toRect.left + toRect.width / 2 + tgtOffPx - areaRect.left;
    var cy2 = toRect.top + toRect.height / 2 - areaRect.top;

    var from = ARCHV._edgePoint(fromRect, areaRect, cx2, cy2, 2);
    var to = ARCHV._edgePoint(toRect, areaRect, cx1, cy1, 2);

    var x1 = from.x, y1 = from.y;
    var x2 = to.x, y2 = to.y;

    var isResponse = flowType === 'RESPONSE';
    var isReplay = flowType === 'REPLAY';
    var isWrite = flowType === 'WRITE_EVENT';
    var isAsync = flowType === 'ASYNC';
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

    var arrowClass = 'flow-arrow';
    var markerId = 'archv-arrowhead';
    var badgeClass = 'flow-step-bg';
    if (isResponse) {
        arrowClass = 'flow-arrow flow-arrow-response';
        markerId = 'archv-arrowhead-response';
        badgeClass = 'flow-step-bg flow-step-bg-response';
    } else if (isReplay) {
        arrowClass = 'flow-arrow flow-arrow-replay';
        markerId = 'archv-arrowhead-replay';
        badgeClass = 'flow-step-bg flow-step-bg-replay';
    } else if (isWrite) {
        arrowClass = 'flow-arrow flow-arrow-write';
        markerId = 'archv-arrowhead-write';
        badgeClass = 'flow-step-bg flow-step-bg-write';
    } else if (isAsync) {
        arrowClass = 'flow-arrow flow-arrow-async';
        markerId = 'archv-arrowhead-async';
        badgeClass = 'flow-step-bg flow-step-bg-async';
    }

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var d = 'M ' + x1 + ' ' + y1 + ' Q ' + cpx + ' ' + cpy + ' ' + x2 + ' ' + y2;
    path.setAttribute('d', d);
    path.setAttribute('class', arrowClass);
    path.setAttribute('marker-end', 'url(#' + markerId + ')');
    svg.appendChild(path);

    if (stepNum) {
        var t = 0.75;
        var labelX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpx + t * t * x2;
        var labelY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpy + t * t * y2;

        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', labelX);
        circle.setAttribute('cy', labelY);
        circle.setAttribute('r', '10');
        circle.setAttribute('class', badgeClass);
        svg.appendChild(circle);

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('class', 'flow-step-num');
        text.textContent = stepNum;
        svg.appendChild(text);
    }
};

/* ===== Trade-offs Rendering ===== */
ARCHV.showTradeoffs = function(tradeoffs) {
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

    var html = '<div class="tradeoffs-grid">';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title pros">&#x2705; Pros</div>';
    (tradeoffs.pros || []).forEach(function(p) {
        html += '<div class="tradeoffs-item pro">' + p + '</div>';
    });
    html += '</div>';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title cons">&#x274C; Cons</div>';
    (tradeoffs.cons || []).forEach(function(c) {
        html += '<div class="tradeoffs-item con">' + c + '</div>';
    });
    html += '</div></div>';

    if (tradeoffs.whenToUse) {
        html += '<div class="tradeoffs-when">' +
            '<div class="tradeoffs-when-title">When to Use</div>' +
            tradeoffs.whenToUse + '</div>';
    }

    body.innerHTML = html;
    body.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
    container.style.display = 'block';
};

/* ===== Step Mode ===== */
ARCHV.stepMode = {
    active: false,
    steps: null,
    index: 0,
    options: null
};

ARCHV.startStepMode = function(steps, options, resumeFromIndex) {
    if (resumeFromIndex > 0) {
        ARCHV.state.running = false;
        ARCHV.stepMode.active = true;
        ARCHV.stepMode.steps = steps;
        ARCHV.stepMode.index = resumeFromIndex;
        ARCHV.stepMode.options = options || {};
        ARCHV.stepMode._reqId = ARCHV.state.requestId;

        var layersSet = new Set();
        var componentsCount = 0;
        var depsCount = 0;
        for (var i = 0; i < resumeFromIndex; i++) {
            if (steps[i].layerId) layersSet.add(steps[i].layerId);
            componentsCount++;
            if (i > 0) depsCount++;
        }
        ARCHV.state.layersTraversed = layersSet.size;
        ARCHV.state.componentsHit = componentsCount;
        ARCHV.state.depsUsed = depsCount;
        ARCHV.updateStats();

        ARCHV.log('FLOW', 'Switched to step mode at step ' + resumeFromIndex);
    } else {
        ARCHV.clearAnimations();
        ARCHV.resetStats();
        ARCHV.clearLog();
        ARCHV.stepMode.active = true;
        ARCHV.stepMode.steps = steps;
        ARCHV.stepMode.index = 0;
        ARCHV.stepMode.options = options || {};

        var svg = document.getElementById('archv-svg-layer');
        if (svg) svg.innerHTML = '';

        var reqId = ARCHV.nextRequestId();
        ARCHV.stepMode._reqId = reqId;
        ARCHV.log('REQUEST', 'R' + reqId + ': ' + (options && options.requestLabel ? options.requestLabel : 'Step mode started'));
    }

    ARCHV._updateStepButtons();
};

ARCHV.switchToStepMode = function() {
    if (!ARCHV.state.running || !ARCHV.state.paused || !ARCHV.state._flowSteps) return;

    var steps = ARCHV.state._flowSteps;
    var options = ARCHV.state._flowOptions || {};
    var currentIndex = ARCHV.state.stepIndex;

    ARCHV.state._flowSteps = null;
    ARCHV.state._flowOptions = null;

    ARCHV.state.running = false;
    ARCHV.resume();

    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; Pause';
    }

    ARCHV.startStepMode(steps, options, currentIndex);
};

ARCHV.stepForward = function() {
    var sm = ARCHV.stepMode;
    if (!sm.active || sm.index >= sm.steps.length) return;

    var step = sm.steps[sm.index];
    var el = document.getElementById(step.elementId);

    if (step.layerId) {
        var layerEl = document.getElementById(step.layerId);
        if (layerEl) layerEl.classList.add('archv-layer-active');
    }

    if (el) {
        el.classList.remove('archv-visited');
        el.classList.add('archv-active');
        ARCHV._showStepLabel(el, sm.index + 1, step.label);
    }

    ARCHV.log(step.logType || 'FLOW', 'Step ' + (sm.index + 1) + ': ' + step.label + (step.description ? ' - ' + step.description : ''));

    if (sm.index > 0 && el) {
        if (step.noArrowFromPrev) {
            ARCHV._drawStepBadge(el, sm.index + 1);
        } else {
            var sourceEl = step.arrowFromId
                ? document.getElementById(step.arrowFromId)
                : document.getElementById(sm.steps[sm.index - 1].elementId);
            if (sourceEl) ARCHV._drawArrow(sourceEl, el, step.logType, sm.index + 1, step.arrowFromOffset);
        }
    } else if (el) {
        ARCHV._drawStepBadge(el, sm.index + 1);
    }

    sm.index++;
    ARCHV.state.stepIndex = sm.index;

    var layersSet = new Set();
    for (var j = 0; j < sm.index; j++) {
        if (sm.steps[j].layerId) layersSet.add(sm.steps[j].layerId);
    }
    ARCHV.state.layersTraversed = layersSet.size;
    ARCHV.state.componentsHit = sm.index;
    ARCHV.updateStats();

    if (sm.index >= sm.steps.length) {
        ARCHV.log('RESPONSE', 'R' + sm._reqId + ': Flow completed (' + sm.steps.length + ' steps)');
    }

    ARCHV._updateStepButtons();
};

ARCHV.stepBack = function() {
    var sm = ARCHV.stepMode;
    if (!sm.active || sm.index <= 0) return;

    sm.index--;
    ARCHV.state.stepIndex = sm.index;

    var step = sm.steps[sm.index];
    var el = document.getElementById(step.elementId);
    if (el) {
        el.classList.remove('archv-active', 'archv-visited');
    }
    document.querySelectorAll('.archv-step-indicator').forEach(function(s) { s.remove(); });

    var svg = document.getElementById('archv-svg-layer');
    if (svg) svg.innerHTML = '';
    document.querySelectorAll('.archv-layer-active').forEach(function(el) {
        el.classList.remove('archv-layer-active');
    });

    var layersSet = new Set();
    var componentsCount = 0;
    for (var i = 0; i < sm.index; i++) {
        var s = sm.steps[i];
        var e = document.getElementById(s.elementId);
        if (e) {
            e.classList.remove('archv-active');
            e.classList.add('archv-visited');
        }
        if (s.layerId) {
            var layerEl = document.getElementById(s.layerId);
            if (layerEl) layerEl.classList.add('archv-layer-active');
            layersSet.add(s.layerId);
        }
        componentsCount++;
        if (i > 0) {
            if (s.noArrowFromPrev) {
                if (e) ARCHV._drawStepBadge(e, i + 1);
            } else {
                var sourceE = s.arrowFromId
                    ? document.getElementById(s.arrowFromId)
                    : document.getElementById(sm.steps[i - 1].elementId);
                if (sourceE && e) ARCHV._drawArrow(sourceE, e, s.logType, i + 1, s.arrowFromOffset, s.arrowToOffset);
            }
        } else if (e) {
            ARCHV._drawStepBadge(e, 1);
        }
    }

    ARCHV.state.layersTraversed = layersSet.size;
    ARCHV.state.componentsHit = componentsCount;
    ARCHV.updateStats();

    ARCHV._updateStepButtons();
};

ARCHV.exitStepMode = function() {
    ARCHV.stepMode.active = false;
    ARCHV.stepMode.steps = null;
    ARCHV.stepMode.index = 0;
    ARCHV._updateStepButtons();
};

ARCHV._updateStepButtons = function() {
    var sm = ARCHV.stepMode;
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
        btnStep.innerHTML = '&#x23F9; Exit Steps';
    } else {
        btnBack.style.display = 'none';
        btnFwd.style.display = 'none';
        btnStep.classList.remove('active');
        btnStep.innerHTML = '&#x23ED; Step Mode';
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
