/* ===== Design Pattern Visualizer Engine ===== */

var PV = window.PV || {};
window.PV = PV;

PV.state = {
    pattern: 'simple-factory',
    mode: null,
    running: false,
    paused: false,
    _pauseResolve: null,
    stepIndex: 0,
    requestId: 0,
    stepDelay: 600,
    stepsCompleted: 0,
    objectsCreated: 0
};

/* ===== Event Log ===== */
PV.log = function(type, text) {
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

PV.clearLog = function() {
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

PV.copyLog = function() {
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
PV.updateStats = function() {
    var s = PV.state;
    document.getElementById('stat-steps').textContent = s.stepsCompleted;
    document.getElementById('stat-objects').textContent = s.objectsCreated;
};

PV.resetStats = function() {
    var s = PV.state;
    s.stepsCompleted = 0;
    s.objectsCreated = 0;
    s.requestId = 0;
    s.stepIndex = 0;
    s.running = false;
    PV.updateStats();
};

/* ===== Helpers ===== */
PV.sleep = async function(ms) {
    await new Promise(function(r) { setTimeout(r, ms); });
    while (PV.state.paused) {
        await new Promise(function(r) { PV.state._pauseResolve = r; });
    }
};

PV.pause = function() {
    PV.state.paused = true;
};

PV.resume = function() {
    PV.state.paused = false;
    if (PV.state._pauseResolve) {
        PV.state._pauseResolve();
        PV.state._pauseResolve = null;
    }
};

PV.nextRequestId = function() {
    return ++PV.state.requestId;
};

/* ===== Accent Colors ===== */
PV.setAccentColors = function(patternId) {
    var root = document.documentElement.style;
    var themes = {
        'simple-factory':   { accent: '#3B82F6', bg: '#0d1630', light: '#152048' },
        'factory-method':   { accent: '#8B5CF6', bg: '#1a1630', light: '#241e48' },
        'abstract-factory': { accent: '#6366F1', bg: '#161830', light: '#1e2248' },
        'builder':          { accent: '#F59E0B', bg: '#1f1a0d', light: '#302615' },
        'prototype':        { accent: '#10B981', bg: '#0d1f18', light: '#153024' },
        'singleton':        { accent: '#EC4899', bg: '#1f0d1a', light: '#301524' },
        'pool':             { accent: '#F97316', bg: '#1f150d', light: '#302015' },
        'static-factory':   { accent: '#84CC16', bg: '#1a1f0d', light: '#283015' }
    };
    var t = themes[patternId] || themes['simple-factory'];
    root.setProperty('--pv-accent', t.accent);
    root.setProperty('--pv-accent-bg', t.bg);
    root.setProperty('--pv-accent-light', t.light);
};

/* ===== Clear Animations ===== */
PV.clearAnimations = function(keepRelations) {
    var svg = document.getElementById('pv-svg-layer');
    if (svg) {
        if (keepRelations) {
            var relations = svg.querySelectorAll('.pv-relation-inherit, .pv-relation-compose, .pv-relation-depend');
            var preserved = [];
            relations.forEach(function(r) { preserved.push(r); });
            svg.innerHTML = '';
            PV._ensureArrowMarker(svg);
            preserved.forEach(function(r) { svg.appendChild(r); });
        } else {
            svg.innerHTML = '';
        }
    }
    PV.state.running = false;
    document.querySelectorAll('.pv-active, .pv-visited, .pv-spawned').forEach(function(el) {
        el.classList.remove('pv-active', 'pv-visited', 'pv-spawned');
    });
    document.querySelectorAll('[data-visible]').forEach(function(el) {
        el.classList.add('pv-spawned');
    });
    document.querySelectorAll('.pv-step-indicator').forEach(function(el) {
        el.remove();
    });
};

/* ===== Attribute Escaping ===== */
PV._escAttr = function(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/* ===== Render UML Class Box ===== */
PV.renderClass = function(id, name, options) {
    var opts = options || {};
    var html = '<div class="pv-class-box" id="' + id + '"' +
        (opts.tooltip ? ' data-tooltip="' + PV._escAttr(opts.tooltip) + '"' : '') + '>';
    html += '<div class="pv-class-header">';
    if (opts.stereotype) {
        html += '<span class="stereotype">&laquo;' + opts.stereotype + '&raquo;</span>';
    }
    html += name + '</div>';
    if (opts.fields && opts.fields.length) {
        html += '<div class="pv-class-section">';
        opts.fields.forEach(function(f) {
            html += '<span class="field">' + f + '</span>';
        });
        html += '</div>';
    }
    if (opts.methods && opts.methods.length) {
        html += '<div class="pv-class-section">';
        opts.methods.forEach(function(m) {
            html += '<span class="method">' + m + '</span>';
        });
        html += '</div>';
    }
    html += '</div>';
    return html;
};

/* ===== Render Object Instance ===== */
PV.renderObject = function(id, label, options) {
    var opts = options || {};
    var cls = 'pv-object';
    if (opts.visible) cls += ' pv-spawned';
    return '<div class="' + cls + '" id="' + id + '"' +
        (opts.visible ? ' data-visible="1"' : '') +
        (opts.tooltip ? ' data-tooltip="' + PV._escAttr(opts.tooltip) + '"' : '') +
        '>' + label + '</div>';
};

/* ===== Spawn Object (animate into view) ===== */
PV.animateCreate = function(elementId) {
    var el = document.getElementById(elementId);
    if (el) {
        el.classList.add('pv-spawned');
        PV.state.objectsCreated++;
        PV.updateStats();
    }
};

/* ===== Set Property (animate into view, no object count) ===== */
PV.animateProperty = function(elementId) {
    var el = document.getElementById(elementId);
    if (el) {
        el.classList.add('pv-spawned');
    }
};

/* ===== Render Arrow Connector ===== */
PV.renderArrowConnector = function(label) {
    return '<div class="pv-arrow-connector">' +
        '<span>&#x25BC;</span>' +
        (label ? '<span class="pv-arrow-label">' + label + '</span>' : '') +
        '</div>';
};

/* ===== Show Step Label ===== */
PV._showStepLabel = function(el, stepNum, label) {
    if (!el) return;
    document.querySelectorAll('.pv-step-indicator').forEach(function(s) { s.remove(); });
    var indicator = document.createElement('div');
    indicator.className = 'pv-step-indicator';
    indicator.textContent = stepNum + '. ' + label;
    el.appendChild(indicator);
};

/* ===== Tooltip System ===== */
PV._initTooltips = function() {
    document.addEventListener('mouseover', function(e) {
        var target = e.target.closest('[data-tooltip]');
        if (!target || target.querySelector('.pv-tooltip')) return;
        var tip = document.createElement('div');
        tip.className = 'pv-tooltip';
        tip.textContent = target.getAttribute('data-tooltip');
        target.appendChild(tip);
    });
    document.addEventListener('mouseout', function(e) {
        var target = e.target.closest('[data-tooltip]');
        if (!target) return;
        var tip = target.querySelector('.pv-tooltip');
        if (tip) tip.remove();
    });
};

PV._tooltipsInitialized = false;
PV.ensureTooltips = function() {
    if (!PV._tooltipsInitialized) {
        PV._initTooltips();
        PV._tooltipsInitialized = true;
    }
};

/* ===== Ensure SVG Arrow Markers ===== */
PV._ensureArrowMarker = function(svg) {
    if (svg.querySelector('#pv-arrowhead')) return;
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    var markers = [
        { id: 'pv-arrowhead', cls: 'flow-arrow-head' },
        { id: 'pv-arrowhead-response', cls: 'flow-arrow-head-response' },
        { id: 'pv-arrowhead-create', cls: 'flow-arrow-head-create' }
    ];

    markers.forEach(function(m) {
        var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', m.id);
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 8 3, 0 6');
        polygon.setAttribute('class', m.cls);
        marker.appendChild(polygon);
        defs.appendChild(marker);
    });

    /* UML relationship markers */
    /* Inheritance (open triangle) */
    var inheritMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    inheritMarker.setAttribute('id', 'pv-inherit');
    inheritMarker.setAttribute('markerWidth', '12');
    inheritMarker.setAttribute('markerHeight', '10');
    inheritMarker.setAttribute('refX', '12');
    inheritMarker.setAttribute('refY', '5');
    inheritMarker.setAttribute('orient', 'auto');
    var inheritPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    inheritPoly.setAttribute('points', '0 0, 12 5, 0 10');
    inheritPoly.setAttribute('fill', 'none');
    inheritPoly.setAttribute('stroke', '#555e6e');
    inheritPoly.setAttribute('stroke-width', '1.5');
    inheritMarker.appendChild(inheritPoly);
    defs.appendChild(inheritMarker);

    /* Composition (filled diamond) */
    var composeMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    composeMarker.setAttribute('id', 'pv-compose');
    composeMarker.setAttribute('markerWidth', '12');
    composeMarker.setAttribute('markerHeight', '8');
    composeMarker.setAttribute('refX', '0');
    composeMarker.setAttribute('refY', '4');
    composeMarker.setAttribute('orient', 'auto');
    var composePoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    composePoly.setAttribute('points', '0 4, 6 0, 12 4, 6 8');
    composePoly.setAttribute('fill', '#555e6e');
    composeMarker.appendChild(composePoly);
    defs.appendChild(composeMarker);

    /* Dependency (open arrow) */
    var depMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    depMarker.setAttribute('id', 'pv-depend');
    depMarker.setAttribute('markerWidth', '8');
    depMarker.setAttribute('markerHeight', '6');
    depMarker.setAttribute('refX', '8');
    depMarker.setAttribute('refY', '3');
    depMarker.setAttribute('orient', 'auto');
    var depPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    depPath.setAttribute('d', 'M 0 0 L 8 3 L 0 6');
    depPath.setAttribute('fill', 'none');
    depPath.setAttribute('stroke', '#555e6e');
    depPath.setAttribute('stroke-width', '1.5');
    depMarker.appendChild(depPath);
    defs.appendChild(depMarker);

    svg.appendChild(defs);
};

/* ===== Edge Point Calculation ===== */
PV._edgePoint = function(rect, areaRect, targetX, targetY, padding) {
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

/* ===== Draw Step Badge ===== */
PV._drawStepBadge = function(el, stepNum, position) {
    var svg = document.getElementById('pv-svg-layer');
    if (!svg || !el) return;

    var vizArea = document.getElementById('viz-area');
    var areaRect = vizArea.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();

    var x, y;
    if (position === 'top-left') {
        x = elRect.left - areaRect.left + elRect.width * 0.25;
        y = elRect.top - areaRect.top - 14;
    } else if (position === 'top-right') {
        x = elRect.left - areaRect.left + elRect.width * 0.75;
        y = elRect.top - areaRect.top - 14;
    } else if (position === 'top') {
        x = elRect.left - areaRect.left + elRect.width / 2;
        y = elRect.top - areaRect.top - 14;
    } else if (position === 'right') {
        x = elRect.left - areaRect.left + elRect.width + 14;
        y = elRect.top - areaRect.top + elRect.height / 2;
    } else {
        x = elRect.left - areaRect.left - 14;
        y = elRect.top - areaRect.top + elRect.height / 2;
    }

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
PV._drawArrow = function(fromEl, toEl, flowType, stepNum, sourceOffset, targetOffset) {
    var svg = document.getElementById('pv-svg-layer');
    if (!svg || !fromEl || !toEl) return;

    PV._ensureArrowMarker(svg);

    var vizArea = document.getElementById('viz-area');
    var areaRect = vizArea.getBoundingClientRect();
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = toEl.getBoundingClientRect();

    var srcOffX = 0, srcOffY = 0, tgtOffX = 0, tgtOffY = 0;
    if (sourceOffset && typeof sourceOffset === 'object') {
        srcOffX = (sourceOffset.x || 0) * fromRect.width;
        srcOffY = (sourceOffset.y || 0) * fromRect.height;
    } else if (sourceOffset) {
        srcOffX = sourceOffset * fromRect.width;
    }
    if (targetOffset && typeof targetOffset === 'object') {
        tgtOffX = (targetOffset.x || 0) * toRect.width;
        tgtOffY = (targetOffset.y || 0) * toRect.height;
    } else if (targetOffset) {
        tgtOffX = targetOffset * toRect.width;
    }
    var cx1 = fromRect.left + fromRect.width / 2 + srcOffX - areaRect.left;
    var cy1 = fromRect.top + fromRect.height / 2 + srcOffY - areaRect.top;
    var cx2 = toRect.left + toRect.width / 2 + tgtOffX - areaRect.left;
    var cy2 = toRect.top + toRect.height / 2 + tgtOffY - areaRect.top;

    var from = PV._edgePoint(fromRect, areaRect, cx2, cy2, 2);
    var to = PV._edgePoint(toRect, areaRect, cx1, cy1, 2);

    var x1 = from.x, y1 = from.y;
    var x2 = to.x, y2 = to.y;

    var isResponse = flowType === 'RESPONSE';
    var isCreate = flowType === 'CREATE';
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
    var markerId = 'pv-arrowhead';
    var badgeClass = 'flow-step-bg';
    if (isResponse) {
        arrowClass = 'flow-arrow flow-arrow-response';
        markerId = 'pv-arrowhead-response';
        badgeClass = 'flow-step-bg flow-step-bg-response';
    } else if (isCreate) {
        arrowClass = 'flow-arrow flow-arrow-create';
        markerId = 'pv-arrowhead-create';
        badgeClass = 'flow-step-bg flow-step-bg-create';
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

/* ===== Draw Static UML Relation ===== */
PV.renderRelation = function(fromId, toId, type) {
    var svg = document.getElementById('pv-svg-layer');
    if (!svg) return;
    PV._ensureArrowMarker(svg);

    var fromEl = document.getElementById(fromId);
    var toEl = document.getElementById(toId);
    if (!fromEl || !toEl) return;

    var vizArea = document.getElementById('viz-area');
    var areaRect = vizArea.getBoundingClientRect();
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = toEl.getBoundingClientRect();

    var cx1 = fromRect.left + fromRect.width / 2 - areaRect.left;
    var cy1 = fromRect.top + fromRect.height / 2 - areaRect.top;
    var cx2 = toRect.left + toRect.width / 2 - areaRect.left;
    var cy2 = toRect.top + toRect.height / 2 - areaRect.top;

    var from = PV._edgePoint(fromRect, areaRect, cx2, cy2, 2);
    var to = PV._edgePoint(toRect, areaRect, cx1, cy1, 2);

    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);

    if (type === 'inherit') {
        line.setAttribute('class', 'pv-relation-inherit');
        line.setAttribute('marker-end', 'url(#pv-inherit)');
    } else if (type === 'compose') {
        line.setAttribute('class', 'pv-relation-compose');
        line.setAttribute('marker-start', 'url(#pv-compose)');
    } else if (type === 'depend') {
        line.setAttribute('class', 'pv-relation-depend');
        line.setAttribute('marker-end', 'url(#pv-depend)');
    }

    svg.appendChild(line);
};

/* ===== Trade-offs Rendering ===== */
PV.showTradeoffs = function(tradeoffs) {
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

/* ===== Pattern Participants ===== */
PV.showParticipants = function(participants) {
    var body = document.getElementById('dep-rules-body');
    if (!body) return;

    var html = '';
    participants.forEach(function(p) {
        html += '<div class="dep-rule allowed">' +
            '<span class="dep-rule-icon">&#x1F539;</span>' +
            '<span><strong>' + p.name + '</strong> — ' + p.role + '</span>' +
            '</div>';
    });

    body.innerHTML = html;
};

/* ===== Animate Flow ===== */
PV.animateFlow = async function(steps, options) {
    if (PV.state.running) return;

    if (PV.stepMode.active) {
        PV.exitStepMode();
        PV.clearAnimations();
        PV.resetStats();
        PV.clearLog();
    }

    PV.state.stepsCompleted = 0;
    PV.state.objectsCreated = 0;
    PV.updateStats();

    PV.state.stepIndex = 0;
    PV.state._flowSteps = steps;
    PV.state._flowOptions = options;

    PV.clearAnimations(true);
    PV.state.running = true;

    var customDelay = options && options.delay ? options.delay : 0;
    var reqId = PV.nextRequestId();
    var startTime = performance.now();

    PV.log('REQUEST', 'R' + reqId + ': ' + (options && options.requestLabel ? options.requestLabel : 'Pattern flow initiated'));

    for (var i = 0; i < steps.length; i++) {
        if (!PV.state.running) break;

        var step = steps[i];
        var el = document.getElementById(step.elementId);
        PV.state.stepIndex = i + 1;
        var stepLabel = String(i + 1);

        if (el) {
            el.classList.add('pv-active');
            PV._showStepLabel(el, stepLabel, step.label);
        }

        PV.log(step.logType || 'FLOW', 'Step ' + stepLabel + ': ' + step.label + (step.description ? ' — ' + step.description : ''));

        if (step.spawnId) {
            if (step.logType === 'PROPERTY') {
                PV.animateProperty(step.spawnId);
            } else {
                PV.animateCreate(step.spawnId);
            }
        }

        if (i > 0 && el) {
            if (step.noArrowFromPrev) {
                PV._drawStepBadge(el, stepLabel, step.badgePosition);
            } else {
                var sourceEl = step.arrowFromId
                    ? document.getElementById(step.arrowFromId)
                    : document.getElementById(steps[i - 1].elementId);
                if (sourceEl) {
                    PV._drawArrow(sourceEl, el, step.logType, stepLabel, step.arrowFromOffset, step.arrowToOffset);
                }
            }
        } else if (el) {
            PV._drawStepBadge(el, stepLabel, step.badgePosition);
        }

        var stepDelay = step.delay !== undefined ? step.delay : (customDelay || PV.state.stepDelay);
        await PV.sleep(stepDelay);

        if (el) {
            el.classList.remove('pv-active');
            el.classList.add('pv-visited');
        }
        document.querySelectorAll('.pv-step-indicator').forEach(function(s) { s.remove(); });
        PV.state.stepsCompleted = i + 1;
        PV.updateStats();
    }

    var elapsed = Math.round(performance.now() - startTime);
    if (PV.state.running) {
        PV.log('RESPONSE', 'R' + reqId + ': Flow completed in ' + elapsed + 'ms (' + steps.length + ' steps, ' + PV.state.objectsCreated + ' objects created)');
    }
    PV.state.running = false;
    PV.state.paused = false;
    PV.state._flowSteps = null;
    PV.state._flowOptions = null;
    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; Pause';
    }
};

/* ===== Step Mode ===== */
PV.stepMode = {
    active: false,
    steps: null,
    index: 0,
    options: null
};

PV.startStepMode = function(steps, options, resumeFromIndex) {
    if (resumeFromIndex > 0) {
        PV.state.running = false;
        PV.stepMode.active = true;
        PV.stepMode.steps = steps;
        PV.stepMode.index = resumeFromIndex;
        PV.stepMode.options = options || {};
        PV.stepMode._reqId = PV.state.requestId;

        PV.state.stepsCompleted = resumeFromIndex;
        var spawnCount = 0;
        for (var i = 0; i < resumeFromIndex; i++) {
            if (steps[i].spawnId) spawnCount++;
        }
        PV.state.objectsCreated = spawnCount;
        PV.updateStats();
        PV.log('FLOW', 'Switched to step mode at step ' + resumeFromIndex);
    } else {
        PV.resetStats();
        PV.clearLog();
        PV.clearAnimations(true);

        PV.stepMode.active = true;
        PV.stepMode.steps = steps;
        PV.stepMode.index = 0;
        PV.stepMode.options = options || {};

        var reqId = PV.nextRequestId();
        PV.stepMode._reqId = reqId;
        PV.log('REQUEST', 'R' + reqId + ': ' + (options && options.requestLabel ? options.requestLabel : 'Step mode started'));
    }
    PV._updateStepButtons();
};

PV.switchToStepMode = function() {
    if (!PV.state.running || !PV.state.paused || !PV.state._flowSteps) return;

    var steps = PV.state._flowSteps;
    var options = PV.state._flowOptions || {};
    var currentIndex = PV.state.stepIndex;

    PV.state._flowSteps = null;
    PV.state._flowOptions = null;
    PV.state.running = false;
    PV.resume();

    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; Pause';
    }

    PV.startStepMode(steps, options, currentIndex);
};

PV.stepForward = function() {
    var sm = PV.stepMode;
    if (!sm.active || sm.index >= sm.steps.length) return;

    var step = sm.steps[sm.index];
    var el = document.getElementById(step.elementId);
    var stepLabel = String(sm.index + 1);

    if (el) {
        el.classList.remove('pv-visited');
        el.classList.add('pv-active');
        PV._showStepLabel(el, stepLabel, step.label);
    }

    PV.log(step.logType || 'FLOW', 'Step ' + stepLabel + ': ' + step.label + (step.description ? ' — ' + step.description : ''));

    if (step.spawnId) {
        if (step.logType === 'PROPERTY') {
            PV.animateProperty(step.spawnId);
        } else {
            PV.animateCreate(step.spawnId);
        }
    }

    if (sm.index > 0 && el) {
        if (step.noArrowFromPrev) {
            PV._drawStepBadge(el, stepLabel, step.badgePosition);
        } else {
            var sourceEl = step.arrowFromId
                ? document.getElementById(step.arrowFromId)
                : document.getElementById(sm.steps[sm.index - 1].elementId);
            if (sourceEl) PV._drawArrow(sourceEl, el, step.logType, stepLabel, step.arrowFromOffset, step.arrowToOffset);
        }
    } else if (el) {
        PV._drawStepBadge(el, stepLabel, step.badgePosition);
    }

    sm.index++;
    PV.state.stepIndex = sm.index;
    PV.state.stepsCompleted = sm.index;
    PV.updateStats();

    if (sm.index >= sm.steps.length) {
        PV.log('RESPONSE', 'R' + sm._reqId + ': Flow completed (' + sm.steps.length + ' steps)');
    }

    PV._updateStepButtons();
};

PV.stepBack = function() {
    var sm = PV.stepMode;
    if (!sm.active || sm.index <= 0) return;

    sm.index--;
    PV.state.stepIndex = sm.index;

    var step = sm.steps[sm.index];
    var el = document.getElementById(step.elementId);
    if (el) {
        el.classList.remove('pv-active', 'pv-visited');
    }
    document.querySelectorAll('.pv-step-indicator').forEach(function(s) { s.remove(); });

    /* Remove all spawn states, then restore initially-visible objects */
    document.querySelectorAll('.pv-object.pv-spawned').forEach(function(el) {
        el.classList.remove('pv-spawned');
    });
    document.querySelectorAll('[data-visible]').forEach(function(el) {
        el.classList.add('pv-spawned');
    });

    /* Redraw from scratch up to current index */
    var svg = document.getElementById('pv-svg-layer');
    if (svg) {
        var relations = svg.querySelectorAll('.pv-relation-inherit, .pv-relation-compose, .pv-relation-depend');
        var preserved = [];
        relations.forEach(function(r) { preserved.push(r); });
        svg.innerHTML = '';
        PV._ensureArrowMarker(svg);
        preserved.forEach(function(r) { svg.appendChild(r); });
    }

    for (var i = 0; i < sm.index; i++) {
        var s = sm.steps[i];
        var e = document.getElementById(s.elementId);
        if (e) {
            e.classList.remove('pv-active');
            e.classList.add('pv-visited');
        }
        /* Re-spawn objects for steps before current index */
        if (s.spawnId) {
            var spawnEl = document.getElementById(s.spawnId);
            if (spawnEl) spawnEl.classList.add('pv-spawned');
        }
        if (i > 0) {
            if (s.noArrowFromPrev) {
                if (e) PV._drawStepBadge(e, String(i + 1), s.badgePosition);
            } else {
                var sourceE = s.arrowFromId
                    ? document.getElementById(s.arrowFromId)
                    : document.getElementById(sm.steps[i - 1].elementId);
                if (sourceE && e) PV._drawArrow(sourceE, e, s.logType, String(i + 1), s.arrowFromOffset, s.arrowToOffset);
            }
        } else if (e) {
            PV._drawStepBadge(e, '1', s.badgePosition);
        }
    }

    PV.state.stepsCompleted = sm.index;
    PV.state.objectsCreated = document.querySelectorAll('.pv-object.pv-spawned').length;
    PV.updateStats();
    PV._updateStepButtons();
};

PV.exitStepMode = function() {
    PV.stepMode.active = false;
    PV.stepMode.steps = null;
    PV.stepMode.index = 0;
    PV._updateStepButtons();
};

PV._updateStepButtons = function() {
    var sm = PV.stepMode;
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
