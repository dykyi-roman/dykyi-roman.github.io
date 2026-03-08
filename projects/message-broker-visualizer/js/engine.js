/* ===== Animation Engine, Event Log, Stats, Message Routing ===== */

const MBV = window.MBV || {};
window.MBV = MBV;

MBV.state = {
    broker: 'rabbitmq',
    mode: null,
    paused: false,
    simulateError: false,
    confirmsEnabled: false,
    msgId: 0,
    sent: 0,
    delivered: 0,
    queued: 0,
    throughputHistory: new Array(24).fill(0),
    throughputCurrent: 0,
    throughputInterval: null,
    animations: [],
    queuedMessages: [],
    deliveryQueue: [],
    roundRobinIndex: 0,
};

/* ===== Pause / Resume Delivery Queue ===== */
MBV.onResume = null;

MBV.enqueueDelivery = function(fn) {
    MBV.state.deliveryQueue.push(fn);
};

MBV.flushDeliveryQueue = async function() {
    while (MBV.state.deliveryQueue.length > 0) {
        const fn = MBV.state.deliveryQueue.shift();
        await fn();
        await MBV.sleep(150);
    }
    if (MBV.onResume) MBV.onResume();
};

/* ===== Event Log ===== */
MBV.log = function(type, text) {
    const logEl = document.getElementById('event-log');
    if (!logEl) return;
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${ts}</span><span class="log-type ${type}">${type}</span><span class="log-text">${text}</span>`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

MBV.clearLog = function() {
    const logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

MBV.copyLog = function() {
    const logEl = document.getElementById('event-log');
    if (!logEl) return;
    const entries = logEl.querySelectorAll('.log-entry');
    const lines = Array.from(entries).map(function(e) {
        const time = e.querySelector('.log-time');
        const type = e.querySelector('.log-type');
        const text = e.querySelector('.log-text');
        return (time ? time.textContent : '') + ' ' + (type ? type.textContent : '') + ' ' + (text ? text.textContent : '');
    });
    navigator.clipboard.writeText(lines.join('\n')).then(function() {
        const btn = document.getElementById('btn-copy-log');
        if (!btn) return;
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
    });
};

/* ===== Stats ===== */
MBV.updateStats = function() {
    document.getElementById('stat-sent').textContent = MBV.state.sent;
    document.getElementById('stat-delivered').textContent = MBV.state.delivered;
    document.getElementById('stat-queued').textContent = MBV.state.queued;
    document.getElementById('stat-throughput').textContent = MBV.state.throughputCurrent;
};

MBV.resetStats = function() {
    MBV.state.sent = 0;
    MBV.state.delivered = 0;
    MBV.state.queued = 0;
    MBV.state.msgId = 0;
    MBV.state.throughputCurrent = 0;
    MBV.state.throughputHistory = new Array(24).fill(0);
    MBV.state.roundRobinIndex = 0;
    MBV.state.deliveryQueue = [];
    MBV.updateStats();
};

MBV.startThroughputTracker = function() {
    if (MBV.state.throughputInterval) clearInterval(MBV.state.throughputInterval);
    let prevSent = MBV.state.sent;
    MBV.state.throughputInterval = setInterval(() => {
        const delta = MBV.state.sent - prevSent;
        prevSent = MBV.state.sent;
        MBV.state.throughputCurrent = delta;
        MBV.state.throughputHistory.push(delta);
        MBV.state.throughputHistory.shift();
        MBV.updateStats();
        MBV.drawThroughputChart();
    }, 1000);
};

MBV.drawThroughputChart = function() {
    const canvas = document.getElementById('throughput-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const data = MBV.state.throughputHistory;
    const max = Math.max(...data, 1);
    const barW = w / data.length;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--mbv-accent').trim();
    ctx.fillStyle = accent || '#FF6600';
    data.forEach((v, i) => {
        const barH = (v / max) * (h - 4);
        ctx.fillRect(i * barW + 1, h - barH - 2, barW - 2, barH);
    });
};

/* ===== Animation Engine ===== */
MBV.getPortCenter = function(el) {
    const vizArea = document.getElementById('viz-area');
    if (!el || !vizArea) return { x: 0, y: 0 };
    const elRect = el.getBoundingClientRect();
    const areaRect = vizArea.getBoundingClientRect();
    return {
        x: elRect.left + elRect.width / 2 - areaRect.left,
        y: elRect.top + elRect.height / 2 - areaRect.top
    };
};

MBV._ensureSvgLayer = function() {
    const layer = document.getElementById('animation-layer');
    if (!layer) return null;
    let svg = layer.querySelector('.pipe-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'pipe-svg');
        svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
        layer.insertBefore(svg, layer.firstChild);
    }
    return svg;
};

MBV._buildBezierPath = function(from, to) {
    const cpx1 = from.x + (to.x - from.x) * 0.3;
    const cpy1 = from.y - 30;
    const cpx2 = from.x + (to.x - from.x) * 0.7;
    const cpy2 = to.y - 30;
    return { cpx1, cpy1, cpx2, cpy2, d: `M${from.x},${from.y} C${cpx1},${cpy1} ${cpx2},${cpy2} ${to.x},${to.y}` };
};

MBV.animateDot = function(fromEl, toEl, options = {}) {
    const {
        label = '',
        color = null,
        cssClass = '',
        duration = 500,
        onArrive = null,
    } = options;

    return new Promise(resolve => {
        const layer = document.getElementById('animation-layer');
        if (!layer) { resolve(); return; }

        const from = MBV.getPortCenter(fromEl);
        const to = MBV.getPortCenter(toEl);

        /* Skip animation if source/target coordinates are invalid (detached element) */
        if (from.x === 0 && from.y === 0 && to.x === 0 && to.y === 0) { resolve(); return; }

        const bezier = MBV._buildBezierPath(from, to);

        const svg = MBV._ensureSvgLayer();

        /* --- Draw the pipe (SVG path) — skip when too many concurrent animations --- */
        const skipPipe = MBV.state.animations.length > 6;
        let pipeBg = null;
        let pipeFlow = null;
        if (svg && !skipPipe) {
            pipeBg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pipeBg.setAttribute('d', bezier.d);
            pipeBg.setAttribute('class', 'pipe-bg');
            svg.appendChild(pipeBg);

            pipeFlow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pipeFlow.setAttribute('d', bezier.d);
            pipeFlow.setAttribute('class', 'pipe-flow');
            if (color) pipeFlow.setAttribute('stroke', color);
            svg.appendChild(pipeFlow);

            const totalLen = pipeFlow.getTotalLength();
            pipeFlow.style.strokeDasharray = totalLen;
            pipeFlow.style.strokeDashoffset = totalLen;
            pipeFlow.style.transition = `stroke-dashoffset ${duration}ms ease-in-out`;
            requestAnimationFrame(() => {
                pipeFlow.style.strokeDashoffset = '0';
            });
        }

        /* --- Flying dot --- */
        const dot = document.createElement('div');
        dot.className = 'flying-dot ' + cssClass;
        if (color) dot.style.background = color;
        /* Set initial position before appending to prevent one-frame flash */
        dot.style.left = (from.x - 5) + 'px';
        dot.style.top = (from.y - 5) + 'px';
        if (label) {
            const lbl = document.createElement('span');
            lbl.className = 'dot-label';
            lbl.textContent = label;
            dot.appendChild(lbl);
        }
        layer.appendChild(dot);

        let start = null;
        let resolved = false;
        const animId = {};
        MBV.state.animations.push(animId);

        /* Safety: remove dot if animation stalls */
        const safetyTimer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                if (dot.parentNode) dot.remove();
                const idx = MBV.state.animations.indexOf(animId);
                if (idx > -1) MBV.state.animations.splice(idx, 1);
                if (pipeBg && pipeBg.parentNode) pipeBg.remove();
                if (pipeFlow && pipeFlow.parentNode) pipeFlow.remove();
                resolve();
            }
        }, duration + 2000);

        function step(ts) {
            if (resolved) return;
            if (!start) start = ts;
            let t = Math.min((ts - start) / duration, 1);
            const it = 1 - t;
            const x = it*it*it*from.x + 3*it*it*t*bezier.cpx1 + 3*it*t*t*bezier.cpx2 + t*t*t*to.x;
            const y = it*it*it*from.y + 3*it*it*t*bezier.cpy1 + 3*it*t*t*bezier.cpy2 + t*t*t*to.y;
            dot.style.left = (x - 5) + 'px';
            dot.style.top = (y - 5) + 'px';

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                if (resolved) return;
                resolved = true;
                clearTimeout(safetyTimer);
                dot.remove();
                const idx = MBV.state.animations.indexOf(animId);
                if (idx > -1) MBV.state.animations.splice(idx, 1);

                /* Fade out the pipe */
                if (pipeBg) { pipeBg.classList.add('pipe-fade'); setTimeout(() => pipeBg.remove(), 600); }
                if (pipeFlow) { pipeFlow.classList.add('pipe-fade'); setTimeout(() => pipeFlow.remove(), 600); }

                if (onArrive) onArrive();
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
};

MBV.animateInsideQueue = function(queueNodeEl, options = {}) {
    const { label = '', duration = 350 } = options;

    return new Promise(resolve => {
        if (!queueNodeEl) { resolve(); return; }

        const dot = document.createElement('div');
        dot.className = 'queue-traversal-dot';
        if (label) {
            const lbl = document.createElement('span');
            lbl.className = 'dot-label';
            lbl.textContent = label;
            dot.appendChild(lbl);
        }

        queueNodeEl.style.position = 'relative';
        queueNodeEl.appendChild(dot);

        const padding = 14;
        const startX = padding;
        const endX = queueNodeEl.offsetWidth - padding;

        dot.style.left = startX + 'px';

        let start = null;
        function step(ts) {
            if (!start) start = ts;
            const t = Math.min((ts - start) / duration, 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            dot.style.left = (startX + (endX - startX) * eased) + 'px';

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                dot.remove();
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
};

/* ===== Queue Dot Accumulation ===== */
MBV._getQueueDotsContainer = function(nodeEl) {
    if (!nodeEl) return null;
    let container = nodeEl.querySelector('.queue-dots');
    if (!container) {
        container = document.createElement('div');
        container.className = 'queue-dots';
        const countEl = nodeEl.querySelector('.queue-count');
        if (countEl) {
            nodeEl.insertBefore(container, countEl);
        } else {
            nodeEl.appendChild(container);
        }
    }
    return container;
};

MBV.addQueueDot = function(nodeEl, label) {
    if (!nodeEl) return;
    const container = MBV._getQueueDotsContainer(nodeEl);
    if (!container) return;
    const MAX_DOTS = 15;
    if (container.querySelectorAll('.queue-dot').length >= MAX_DOTS) return;
    const dot = document.createElement('div');
    dot.className = 'queue-dot';
    if (label) dot.title = label;
    container.appendChild(dot);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => dot.classList.add('visible'));
    });
};

MBV.removeQueueDot = function(nodeEl) {
    if (!nodeEl) return;
    const container = nodeEl.querySelector('.queue-dots');
    if (!container) return;
    const dot = container.querySelector('.queue-dot:not(.removing)');
    if (dot) {
        dot.classList.add('removing');
        dot.classList.remove('visible');
        setTimeout(() => dot.remove(), 250);
    }
};

MBV.clearQueueDots = function() {
    document.querySelectorAll('.queue-dots').forEach(el => el.remove());
};

MBV.clearAnimations = function() {
    const layer = document.getElementById('animation-layer');
    if (layer) layer.innerHTML = '';
    MBV.state.animations = [];
    MBV.state.deliveryQueue = [];
    MBV.onResume = null;
    MBV.clearQueueDots();
};

/* ===== Helpers ===== */
MBV.nextMsgId = function() {
    return ++MBV.state.msgId;
};

MBV.flashCard = function(cardEl, type, duration = 600) {
    if (!cardEl) return;
    const cls = type === 'green' ? 'card-flash-green' : 'card-flash-red';
    cardEl.classList.add(cls);
    if (type === 'red') cardEl.classList.add('shake');
    setTimeout(() => {
        cardEl.classList.remove(cls, 'shake');
    }, duration);
};

MBV.addBadge = function(cardEl, text, type) {
    const badges = cardEl.querySelector('.card-badges');
    if (!badges) return;
    const badge = document.createElement('span');
    badge.className = 'badge badge-' + type;
    badge.textContent = text;
    badges.appendChild(badge);
    setTimeout(() => badge.remove(), 3000);
};

MBV.setAccentColors = function(broker) {
    const root = document.documentElement.style;
    const themes = {
        rabbitmq: { accent: '#FF6600', bg: '#2a1f14', light: '#3d2a16' },
        kafka:    { accent: '#4da6ff', bg: '#14202e', light: '#1a2d42' },
        redis:    { accent: '#f05545', bg: '#2a1616', light: '#3d1c1c' },
    };
    const t = themes[broker] || themes.rabbitmq;
    root.setProperty('--mbv-accent', t.accent);
    root.setProperty('--mbv-accent-bg', t.bg);
    root.setProperty('--mbv-accent-light', t.light);
};

/* Topic matching for RabbitMQ and Redis */
MBV.matchTopic = function(pattern, routingKey) {
    const patternParts = pattern.split('.');
    const keyParts = routingKey.split('.');
    let pi = 0, ki = 0;
    while (pi < patternParts.length && ki < keyParts.length) {
        if (patternParts[pi] === '#') {
            if (pi === patternParts.length - 1) return true;
            pi++;
            while (ki < keyParts.length) {
                if (MBV.matchTopic(patternParts.slice(pi).join('.'), keyParts.slice(ki).join('.'))) return true;
                ki++;
            }
            return false;
        }
        if (patternParts[pi] === '*') {
            pi++; ki++;
            continue;
        }
        if (patternParts[pi] !== keyParts[ki]) return false;
        pi++; ki++;
    }
    while (pi < patternParts.length && patternParts[pi] === '#') pi++;
    return pi === patternParts.length && ki === keyParts.length;
};

/* Redis glob matching */
MBV.matchGlob = function(pattern, str) {
    let pi = 0, si = 0;
    let starP = -1, starS = -1;
    while (si < str.length) {
        if (pi < pattern.length && (pattern[pi] === '?' || pattern[pi] === str[si])) {
            pi++; si++;
        } else if (pi < pattern.length && pattern[pi] === '*') {
            starP = pi; starS = si; pi++;
        } else if (pi < pattern.length && pattern[pi] === '[') {
            const close = pattern.indexOf(']', pi);
            if (close === -1) return false;
            const chars = pattern.slice(pi + 1, close);
            if (chars.includes(str[si])) {
                pi = close + 1; si++;
            } else if (starP !== -1) {
                pi = starP + 1; starS++; si = starS;
            } else return false;
        } else if (starP !== -1) {
            pi = starP + 1; starS++; si = starS;
        } else return false;
    }
    while (pi < pattern.length && pattern[pi] === '*') pi++;
    return pi === pattern.length;
};

/* Simple hash for Kafka key-based partitioning */
MBV.hashKey = function(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
};

MBV.sleep = function(ms) {
    return new Promise(r => setTimeout(r, ms));
};
