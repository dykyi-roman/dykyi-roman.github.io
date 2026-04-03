/* ===== Algorithm Visualizer Engine ===== */

var AV = window.AV || {};
window.AV = AV;

AV.state = {
    algorithm: 'bubble-sort',
    mode: null,
    running: false,
    paused: false,
    _pauseResolve: null,
    stepIndex: 0,
    stepDelay: 600,
    comparisons: 0,
    swaps: 0,
    array: [],
    _initialArray: [],
    sortedIndices: []
};

/* ===== Event Log ===== */
AV.log = function(type, text) {
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
    typeSpan.textContent = (window.I18N && I18N.t) ? I18N.t('ui.log.type.' + type, {}, type) : type;

    var textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(typeSpan);
    entry.appendChild(textSpan);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

AV.clearLog = function() {
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

AV.copyLog = function() {
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
AV.updateStats = function() {
    var s = AV.state;
    var cmpEl = document.getElementById('stat-comparisons');
    var swpEl = document.getElementById('stat-swaps');
    if (cmpEl) cmpEl.textContent = s.comparisons;
    if (swpEl) swpEl.textContent = s.swaps;
};

AV.resetStats = function() {
    var s = AV.state;
    s.comparisons = 0;
    s.swaps = 0;
    s.stepIndex = 0;
    s.running = false;
    s.sortedIndices = [];
    AV.updateStats();
};

/* ===== Helpers ===== */
AV.sleep = async function(ms) {
    await new Promise(function(r) { setTimeout(r, ms); });
    while (AV.state.paused) {
        await new Promise(function(r) { AV.state._pauseResolve = r; });
    }
    if (!AV.state.running) throw new Error('AV_STOP');
};

AV.pause = function() {
    AV.state.paused = true;
};

AV.resume = function() {
    AV.state.paused = false;
    if (AV.state._pauseResolve) {
        AV.state._pauseResolve();
        AV.state._pauseResolve = null;
    }
};

/* ===== Array Generation ===== */
AV.generateRandomArray = function(size, min, max) {
    var arr = [];
    for (var i = 0; i < size; i++) {
        arr.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return arr;
};

/* ===== Array Rendering ===== */
AV.renderArray = function(arr) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;

    AV.state.array = arr.slice();
    var maxVal = AV.state._dpMaxVal || Math.max.apply(null, arr);
    var containerHeight = 400;

    var html = '<div class="av-bar-container">';
    for (var i = 0; i < arr.length; i++) {
        var height = Math.max(8, (arr[i] / maxVal) * containerHeight);
        html += '<div class="av-bar" data-index="' + i + '" data-value="' + arr[i] + '" style="height:' + height + 'px">' +
            '<span class="av-bar-value">' + arr[i] + '</span></div>';
    }
    html += '</div>';
    canvas.innerHTML = html;
};

/* ===== Bar Highlighting ===== */
AV.highlightBars = function(indices, className) {
    var bars = document.querySelectorAll('.av-bar');
    indices.forEach(function(idx) {
        if (bars[idx]) bars[idx].classList.add(className);
    });
};

AV.clearHighlights = function() {
    document.querySelectorAll('.av-bar').forEach(function(bar) {
        bar.classList.remove('av-comparing', 'av-swapping', 'av-examined', 'av-reading', 'av-computing', 'av-result');
    });
};

AV.updateBarValue = function(index, value, maxVal) {
    var bars = document.querySelectorAll('.av-bar');
    var bar = bars[index];
    if (!bar) return;
    var containerHeight = 400;
    var height = Math.max(8, (value / maxVal) * containerHeight);
    bar.style.height = height + 'px';
    bar.setAttribute('data-value', value);
    var label = bar.querySelector('.av-bar-value');
    if (label) label.textContent = value;
};

AV.markSorted = function(index) {
    var bars = document.querySelectorAll('.av-bar');
    if (bars[index]) {
        bars[index].classList.add('av-sorted');
    }
    if (AV.state.sortedIndices.indexOf(index) === -1) {
        AV.state.sortedIndices.push(index);
    }
};

/* ===== Swap Animation ===== */
AV.animateSwap = function(i, j) {
    return new Promise(function(resolve) {
        var container = document.querySelector('.av-bar-container');
        if (!container) { resolve(); return; }
        var bars = container.children;
        var barI = bars[i];
        var barJ = bars[j];
        if (!barI || !barJ) { resolve(); return; }

        var rectI = barI.getBoundingClientRect();
        var rectJ = barJ.getBoundingClientRect();
        var distance = rectJ.left - rectI.left;

        barI.style.transition = 'transform 0.3s ease';
        barJ.style.transition = 'transform 0.3s ease';
        barI.style.transform = 'translateX(' + distance + 'px)';
        barJ.style.transform = 'translateX(' + (-distance) + 'px)';

        setTimeout(function() {
            barI.style.transition = '';
            barJ.style.transition = '';
            barI.style.transform = '';
            barJ.style.transform = '';

            /* Swap DOM positions */
            if (i < j) {
                container.insertBefore(barJ, barI);
            } else {
                container.insertBefore(barI, barJ);
            }

            resolve();
        }, 320);
    });
};

/* ===== SVG Helpers (Graph Visualization) ===== */
AV._svgNS = 'http://www.w3.org/2000/svg';

AV._createSVG = function(tag, attrs) {
    var el = document.createElementNS(AV._svgNS, tag);
    if (attrs) {
        Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
    }
    return el;
};

AV.renderGraph = function(nodes, edges) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;

    AV.state._graphData = { nodes: nodes, edges: edges };
    AV.state._initialArray = [];

    var svg = AV._createSVG('svg', {
        'class': 'av-graph-svg',
        'viewBox': '0 0 900 440',
        'preserveAspectRatio': 'xMidYMid meet'
    });

    /* Render edges */
    var nodeMap = {};
    nodes.forEach(function(n) { nodeMap[n.id] = n; });

    edges.forEach(function(e) {
        var from = nodeMap[e[0]];
        var to = nodeMap[e[1]];
        if (!from || !to) return;
        var line = AV._createSVG('line', {
            'x1': from.x, 'y1': from.y,
            'x2': to.x, 'y2': to.y,
            'class': 'av-edge',
            'data-from': e[0],
            'data-to': e[1]
        });
        svg.appendChild(line);

        /* Optional edge weight label */
        if (e[2] !== undefined) {
            var mx = (from.x + to.x) / 2;
            var my = (from.y + to.y) / 2;
            var dx = to.x - from.x;
            var dy = to.y - from.y;
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            var ox = -dy / len * 14;
            var oy = dx / len * 14;
            var weightLabel = AV._createSVG('text', {
                x: mx + ox, y: my + oy,
                'text-anchor': 'middle',
                'class': 'av-edge-weight',
                'font-size': '12'
            });
            weightLabel.textContent = e[2];
            svg.appendChild(weightLabel);
        }
    });

    /* Render nodes */
    nodes.forEach(function(n) {
        var g = AV._createSVG('g', {
            'class': 'av-node av-node-unvisited',
            'data-node': n.id
        });
        g.appendChild(AV._createSVG('circle', { cx: n.x, cy: n.y, r: 26 }));
        var text = AV._createSVG('text', {
            x: n.x, y: n.y + 5,
            'text-anchor': 'middle',
            'font-size': '16'
        });
        text.textContent = n.id;
        g.appendChild(text);

        /* Visit-order badge (hidden by default) */
        var badgeBg = AV._createSVG('circle', {
            cx: n.x + 20, cy: n.y - 20, r: 9,
            'class': 'av-visit-order-bg',
            'display': 'none'
        });
        g.appendChild(badgeBg);
        var badge = AV._createSVG('text', {
            x: n.x + 20, y: n.y - 16,
            'text-anchor': 'middle',
            'class': 'av-visit-order',
            'display': 'none'
        });
        badge.textContent = '';
        g.appendChild(badge);

        svg.appendChild(g);
    });

    canvas.innerHTML = '';
    canvas.appendChild(svg);
};

AV.setNodeState = function(nodeId, state) {
    var node = document.querySelector('.av-node[data-node="' + nodeId + '"]');
    if (!node) return;
    node.className.baseVal = 'av-node av-node-' + state;
};

AV._setDpNodeText = function(nodeId, label, value) {
    var textEl = document.querySelector('.av-node[data-node="' + nodeId + '"] text');
    if (!textEl) return;
    var circle = textEl.parentNode.querySelector('circle');
    var cx = parseFloat(circle.getAttribute('cx'));
    var cy = parseFloat(circle.getAttribute('cy'));
    while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
    var line1 = document.createElementNS(AV._svgNS, 'tspan');
    line1.setAttribute('x', cx);
    line1.setAttribute('y', cy - 2);
    line1.setAttribute('text-anchor', 'middle');
    line1.textContent = label;
    var line2 = document.createElementNS(AV._svgNS, 'tspan');
    line2.setAttribute('x', cx);
    line2.setAttribute('dy', '14');
    line2.setAttribute('text-anchor', 'middle');
    line2.setAttribute('font-size', '11');
    line2.textContent = '=' + value;
    textEl.appendChild(line1);
    textEl.appendChild(line2);
};

AV.highlightEdge = function(from, to, className) {
    var edge = document.querySelector('.av-edge[data-from="' + from + '"][data-to="' + to + '"]') ||
               document.querySelector('.av-edge[data-from="' + to + '"][data-to="' + from + '"]');
    if (edge) edge.setAttribute('class', 'av-edge ' + className);
};

AV._showVisitOrder = function(nodeId, order) {
    var node = document.querySelector('.av-node[data-node="' + nodeId + '"]');
    if (!node) return;
    var bg = node.querySelector('.av-visit-order-bg');
    var badge = node.querySelector('.av-visit-order');
    if (bg && badge) {
        bg.setAttribute('display', '');
        badge.setAttribute('display', '');
        badge.textContent = order;
    }
};

AV._hideAllVisitOrders = function() {
    document.querySelectorAll('.av-visit-order-bg').forEach(function(el) {
        el.setAttribute('display', 'none');
    });
    document.querySelectorAll('.av-visit-order').forEach(function(el) {
        el.setAttribute('display', 'none');
        el.textContent = '';
    });
};

/* ===== Distance Labels (Dijkstra / weighted graphs) ===== */
AV._setNodeDistance = function(nodeId, dist) {
    var node = document.querySelector('.av-node[data-node="' + nodeId + '"]');
    if (!node) return;
    var existing = node.querySelector('.av-dist-label');
    var circle = node.querySelector('circle:not(.av-visit-order-bg)');
    if (!circle) return;
    var cx = parseFloat(circle.getAttribute('cx'));
    var cy = parseFloat(circle.getAttribute('cy'));
    var text = (dist === Infinity || dist === 'Infinity') ? '\u221E' : dist;
    if (existing) {
        existing.textContent = text;
        return;
    }
    var label = AV._createSVG('text', {
        x: cx, y: cy + 44,
        'text-anchor': 'middle',
        'class': 'av-dist-label',
        'font-size': '12'
    });
    label.textContent = text;
    node.appendChild(label);
};

AV._hideAllDistances = function() {
    document.querySelectorAll('.av-dist-label').forEach(function(el) { el.remove(); });
};

AV.clearEdgeHighlights = function() {
    document.querySelectorAll('.av-edge').forEach(function(e) {
        e.setAttribute('class', 'av-edge');
    });
};

AV.renderQueue = function(queue) {
    var vizArea = document.getElementById('viz-area');
    if (!vizArea) return;

    var panel = vizArea.querySelector('.av-queue-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'av-queue-panel';
        var canvas = document.getElementById('av-canvas');
        vizArea.insertBefore(panel, canvas);
    }

    var label = I18N.t('av.queue.label', null, 'Queue:');
    var emptyText = I18N.t('av.queue.empty', null, 'empty');

    if (queue.length === 0) {
        panel.innerHTML = '<span class="av-queue-label">' + label + '</span><span class="av-queue-empty">' + emptyText + '</span>';
    } else {
        var itemsHtml = queue.map(function(id) {
            return '<span class="av-queue-item">' + id + '</span>';
        }).join('');
        panel.innerHTML = '<span class="av-queue-label">' + label + '</span><div class="av-queue-items">' + itemsHtml + '</div>';
    }
};

AV.renderStack = function(stack) {
    var vizArea = document.getElementById('viz-area');
    if (!vizArea) return;

    var panel = vizArea.querySelector('.av-stack-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'av-queue-panel av-stack-panel';
        var canvas = document.getElementById('av-canvas');
        vizArea.insertBefore(panel, canvas);
    }

    var label = I18N.t('av.stack.label', null, 'Stack:');
    var emptyText = I18N.t('av.stack.empty', null, 'empty');

    if (stack.length === 0) {
        panel.innerHTML = '<span class="av-queue-label">' + label + '</span><span class="av-queue-empty">' + emptyText + '</span>';
    } else {
        var itemsHtml = stack.map(function(id) {
            return '<span class="av-queue-item av-stack-item">' + id + '</span>';
        }).join('');
        panel.innerHTML = '<span class="av-queue-label">' + label + '</span><div class="av-queue-items">' + itemsHtml + '</div>';
    }
};

/* ===== Priority Queue Rendering (Dijkstra / weighted graphs) ===== */
AV.renderPriorityQueue = function(pq) {
    var vizArea = document.getElementById('viz-area');
    if (!vizArea) return;

    var panel = vizArea.querySelector('.av-queue-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'av-queue-panel';
        var canvas = document.getElementById('av-canvas');
        vizArea.insertBefore(panel, canvas);
    }

    var label = I18N.t('av.pq.label', null, 'Priority Queue:');
    var emptyText = I18N.t('av.pq.empty', null, 'empty');

    if (pq.length === 0) {
        panel.innerHTML = '<span class="av-queue-label">' + label + '</span><span class="av-queue-empty">' + emptyText + '</span>';
    } else {
        var itemsHtml = pq.map(function(entry) {
            var d = (entry.dist === Infinity || entry.dist === 'Infinity') ? '\u221E' : entry.dist;
            return '<span class="av-queue-item av-pq-item">' + entry.node + '<span class="av-pq-dist">(' + d + ')</span></span>';
        }).join('');
        panel.innerHTML = '<span class="av-queue-label">' + label + '</span><div class="av-queue-items">' + itemsHtml + '</div>';
    }
};

/* ===== String Matching Rendering ===== */
AV.renderStringMatch = function(text, pattern, patternOffset, lps) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;

    AV.state._isStringAlgorithm = true;

    var html = '<div class="av-str-container">';

    /* Text row */
    html += '<div class="av-str-row"><span class="av-str-label">' +
        I18N.t('av.str.text_label', null, 'Text:') + '</span>';
    html += '<div class="av-str-cells" id="av-str-text">';
    for (var i = 0; i < text.length; i++) {
        html += '<div class="av-str-cell" data-index="' + i + '">' +
            '<span class="av-str-index">' + i + '</span>' + text[i] + '</div>';
    }
    html += '</div></div>';

    /* Pattern row (offset by patternOffset empty cells, clamped to text length) */
    html += '<div class="av-str-row"><span class="av-str-label">' +
        I18N.t('av.str.pattern_label', null, 'Pattern:') + '</span>';
    html += '<div class="av-str-cells" id="av-str-pattern">';
    for (var s = 0; s < patternOffset; s++) {
        html += '<div class="av-str-cell av-str-empty"></div>';
    }
    var maxPatCells = Math.max(0, text.length - patternOffset);
    for (var j = 0; j < pattern.length && j < maxPatCells; j++) {
        html += '<div class="av-str-cell" data-pindex="' + j + '">' + pattern[j] + '</div>';
    }
    html += '</div></div>';

    /* LPS row */
    if (lps) {
        html += '<div class="av-str-lps-row"><span class="av-str-label">' +
            I18N.t('av.str.lps_label', null, 'LPS:') + '</span>';
        html += '<div class="av-str-cells" id="av-str-lps">';
        for (var k = 0; k < lps.length; k++) {
            var val = lps[k] !== undefined && lps[k] !== -1 ? lps[k] : '\u2014';
            var filledCls = lps[k] !== undefined && lps[k] !== -1 ? ' av-str-lps-filled' : '';
            html += '<div class="av-str-lps-cell' + filledCls + '" data-lindex="' + k + '">' + val + '</div>';
        }
        html += '</div></div>';
    }

    html += '</div>';
    canvas.innerHTML = html;
};

AV.clearStringHighlights = function() {
    document.querySelectorAll('.av-str-cell').forEach(function(cell) {
        cell.classList.remove('av-str-comparing', 'av-str-match', 'av-str-mismatch', 'av-str-found', 'av-str-idle');
    });
    document.querySelectorAll('.av-str-lps-cell').forEach(function(cell) {
        cell.classList.remove('av-str-lps-active', 'av-str-lps-set');
    });
};

AV._setGraphStatLabels = function() {
    var lbl1 = document.querySelector('#stat-comparisons').closest('.stat-item').querySelector('.stat-label');
    var lbl2 = document.querySelector('#stat-swaps').closest('.stat-item').querySelector('.stat-label');
    if (lbl1) {
        lbl1.textContent = I18N.t('av.stat.nodes_visited', null, 'Nodes Visited');
        lbl1.setAttribute('data-i18n', 'av.stat.nodes_visited');
    }
    if (lbl2) {
        lbl2.textContent = I18N.t('av.stat.edges_explored', null, 'Edges Explored');
        lbl2.setAttribute('data-i18n', 'av.stat.edges_explored');
    }
};

AV._restoreArrayStatLabels = function() {
    var lbl1 = document.querySelector('#stat-comparisons').closest('.stat-item').querySelector('.stat-label');
    var lbl2 = document.querySelector('#stat-swaps').closest('.stat-item').querySelector('.stat-label');
    if (lbl1) {
        lbl1.textContent = I18N.t('av.stat.comparisons', null, 'Comparisons');
        lbl1.setAttribute('data-i18n', 'av.stat.comparisons');
    }
    if (lbl2) {
        lbl2.textContent = I18N.t('av.stat.swaps', null, 'Swaps');
        lbl2.setAttribute('data-i18n', 'av.stat.swaps');
    }
};

AV._setTreeStatLabels = function() {
    var lbl1 = document.querySelector('#stat-comparisons').closest('.stat-item').querySelector('.stat-label');
    var lbl2 = document.querySelector('#stat-swaps').closest('.stat-item').querySelector('.stat-label');
    if (lbl1) {
        lbl1.textContent = I18N.t('av.stat.comparisons', null, 'Comparisons');
        lbl1.setAttribute('data-i18n', 'av.stat.comparisons');
    }
    if (lbl2) {
        lbl2.textContent = I18N.t('av.stat.nodes_inserted', null, 'Nodes Inserted');
        lbl2.setAttribute('data-i18n', 'av.stat.nodes_inserted');
    }
};

AV._setDpStatLabels = function() {
    var lbl1 = document.querySelector('#stat-comparisons').closest('.stat-item').querySelector('.stat-label');
    var lbl2 = document.querySelector('#stat-swaps').closest('.stat-item').querySelector('.stat-label');
    if (lbl1) {
        lbl1.textContent = I18N.t('av.stat.computations', null, 'Computations');
        lbl1.setAttribute('data-i18n', 'av.stat.computations');
    }
    if (lbl2) {
        lbl2.textContent = I18N.t('av.stat.cache_hits', null, 'Cache Hits');
        lbl2.setAttribute('data-i18n', 'av.stat.cache_hits');
    }
};

AV._setStringStatLabels = function() {
    var lbl1 = document.querySelector('#stat-comparisons').closest('.stat-item').querySelector('.stat-label');
    var lbl2 = document.querySelector('#stat-swaps').closest('.stat-item').querySelector('.stat-label');
    if (lbl1) {
        lbl1.textContent = I18N.t('av.stat.comparisons', null, 'Comparisons');
        lbl1.setAttribute('data-i18n', 'av.stat.comparisons');
    }
    if (lbl2) {
        lbl2.textContent = I18N.t('av.stat.matches_found', null, 'Matches Found');
        lbl2.setAttribute('data-i18n', 'av.stat.matches_found');
    }
};

AV._setHashStatLabels = function() {
    var lbl1 = document.querySelector('#stat-comparisons').closest('.stat-item').querySelector('.stat-label');
    var lbl2 = document.querySelector('#stat-swaps').closest('.stat-item').querySelector('.stat-label');
    if (lbl1) {
        lbl1.textContent = I18N.t('av.stat.hash_operations', null, 'Operations');
        lbl1.setAttribute('data-i18n', 'av.stat.hash_operations');
    }
    if (lbl2) {
        lbl2.textContent = I18N.t('av.stat.hash_collisions', null, 'Collisions');
        lbl2.setAttribute('data-i18n', 'av.stat.hash_collisions');
    }
};

/* ===== Hash Table Rendering ===== */
AV.renderHashTable = function(table, mode) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;

    AV.state._isHashAlgorithm = true;

    var html = '<div class="av-hash-container">';

    html += '<div class="av-hash-formula" id="av-hash-formula">' +
        '<span class="av-hash-formula-label" data-i18n="av.hash.formula_label">' + I18N.t('av.hash.formula_label', null, 'Hash Function:') + '</span>' +
        '<span class="av-hash-formula-text">h(k) = charSum(k) mod ' + table.length + '</span>' +
        '</div>';

    html += '<div class="av-hash-key-banner" id="av-hash-key-banner" style="display:none">' +
        '<span class="av-hash-key-label" data-i18n="av.hash.inserting_label">' + I18N.t('av.hash.inserting_label', null, 'Inserting:') + '</span>' +
        '<span class="av-hash-key-value" id="av-hash-key-value">\u2014</span>' +
        '</div>';

    html += '<div class="av-hash-buckets" id="av-hash-buckets">';
    for (var i = 0; i < table.length; i++) {
        html += '<div class="av-hash-bucket" data-bucket="' + i + '">';
        html += '<div class="av-hash-bucket-index">' + i + '</div>';
        html += '<div class="av-hash-bucket-slot" data-slot="' + i + '">';

        if (mode === 'chaining') {
            if (table[i] && table[i].length > 0) {
                html += '<div class="av-hash-chain">';
                for (var ci = 0; ci < table[i].length; ci++) {
                    if (ci > 0) html += '<div class="av-hash-chain-arrow">\u2192</div>';
                    html += '<div class="av-hash-chain-node" data-chain-idx="' + ci + '">' + table[i][ci] + '</div>';
                }
                html += '</div>';
            } else {
                html += '<span class="av-hash-empty-label">\u2014</span>';
            }
        } else {
            if (table[i] !== null && table[i] !== undefined) {
                html += '<span class="av-hash-value">' + table[i] + '</span>';
            } else {
                html += '<span class="av-hash-empty-label">\u2014</span>';
            }
        }

        html += '</div></div>';
    }
    html += '</div>';
    html += '</div>';

    canvas.innerHTML = html;
};

AV.clearHashHighlights = function() {
    document.querySelectorAll('.av-hash-bucket-slot').forEach(function(slot) {
        slot.classList.remove('av-hash-checking', 'av-hash-inserting', 'av-hash-collision', 'av-hash-probing', 'av-hash-found', 'av-hash-not-found');
    });
    document.querySelectorAll('.av-hash-chain-node').forEach(function(node) {
        node.classList.remove('av-hash-checking', 'av-hash-inserting', 'av-hash-found');
    });
};

AV._updateHashFormula = function(key, hashValue, tableSize, charCodeSum) {
    var formula = document.getElementById('av-hash-formula');
    if (!formula) return;
    var text = formula.querySelector('.av-hash-formula-text');
    if (text) {
        var s = String(key);
        var codes = [];
        for (var i = 0; i < s.length; i++) codes.push(s.charCodeAt(i));
        text.innerHTML = 'h(<strong>"' + key + '"</strong>) = (' + codes.join('+') + ') mod ' + tableSize + ' = <strong>' + hashValue + '</strong>';
    }
    formula.classList.add('av-hash-formula-active');
    setTimeout(function() { formula.classList.remove('av-hash-formula-active'); }, 600);
};

AV._updateHashKeyBanner = function(key) {
    var banner = document.getElementById('av-hash-key-banner');
    if (!banner) return;
    if (key === null) {
        banner.style.display = 'none';
    } else {
        banner.style.display = '';
        document.getElementById('av-hash-key-value').textContent = key;
    }
};

AV._insertHashValue = function(index, key, mode) {
    var slot = document.querySelector('.av-hash-bucket-slot[data-slot="' + index + '"]');
    if (!slot) return;

    if (mode === 'chaining') {
        var chain = slot.querySelector('.av-hash-chain');
        if (!chain) {
            slot.innerHTML = '<div class="av-hash-chain"></div>';
            chain = slot.querySelector('.av-hash-chain');
        }
        var existingNodes = chain.querySelectorAll('.av-hash-chain-node');
        if (existingNodes.length > 0) {
            var arrow = document.createElement('div');
            arrow.className = 'av-hash-chain-arrow';
            arrow.textContent = '\u2192';
            chain.appendChild(arrow);
        }
        var node = document.createElement('div');
        node.className = 'av-hash-chain-node av-hash-inserting';
        node.setAttribute('data-chain-idx', existingNodes.length);
        node.textContent = key;
        chain.appendChild(node);
        var emptyLabel = slot.querySelector('.av-hash-empty-label');
        if (emptyLabel) emptyLabel.remove();
    } else {
        slot.innerHTML = '<span class="av-hash-value av-hash-inserting">' + key + '</span>';
    }
};

/* ===== Hash Table Snapshots ===== */
AV._computeHashSnapshots = function(steps) {
    var tableSize = AV.state._hashTableSize;
    var mode = AV.state._hashMode;

    var hasInserts = steps.some(function(s) { return s.type === 'HASH_INSERT' || s.type === 'HASH_CHAIN_ADD'; });
    var table;
    if (!hasInserts && AV.state._hashTable) {
        table = JSON.parse(JSON.stringify(AV.state._hashTable));
    } else if (mode === 'chaining') {
        table = (function() { var a = []; for (var i = 0; i < tableSize; i++) a.push([]); return a; })();
    } else {
        table = new Array(tableSize).fill(null);
    }

    var operations = 0;
    var collisions = 0;
    var currentKey = null;
    var currentHash = null;
    var currentCharCodeSum = null;

    var snapshots = [{
        table: JSON.parse(JSON.stringify(table)),
        operations: 0,
        collisions: 0,
        currentKey: null,
        currentHash: null,
        charCodeSum: null
    }];

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];

        if (step.type === 'HASH_COMPUTE') {
            currentKey = step.key;
            currentHash = step.hashValue;
            currentCharCodeSum = step.charCodeSum || null;
            operations++;
        } else if (step.type === 'HASH_INSERT') {
            if (mode === 'chaining') {
                table[step.index].push(step.key);
            } else {
                table[step.index] = step.key;
            }
        } else if (step.type === 'HASH_CHAIN_ADD') {
            table[step.index].push(step.key);
        } else if (step.type === 'HASH_COLLISION') {
            collisions++;
            operations++;
        }

        snapshots.push({
            table: JSON.parse(JSON.stringify(table)),
            operations: operations,
            collisions: collisions,
            currentKey: currentKey,
            currentHash: currentHash,
            charCodeSum: currentCharCodeSum
        });
    }
    return snapshots;
};

AV._applyHashSnapshot = function(snapshot) {
    AV.renderHashTable(snapshot.table, AV.state._hashMode);
    if (snapshot.currentKey !== null) {
        AV._updateHashKeyBanner(snapshot.currentKey);
        if (snapshot.currentHash !== null) {
            AV._updateHashFormula(snapshot.currentKey, snapshot.currentHash, AV.state._hashTableSize, snapshot.charCodeSum);
        }
    } else {
        AV._updateHashKeyBanner(null);
    }
    if (AV.state._hashSearchTarget !== undefined) {
        AV._reinjectSearchTargetUI();
    }
};

/* ===== String Input Panel ===== */
AV._renderStringInputPanel = function(text, pattern, onApply) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;
    AV._removeStringInputPanel();

    var panel = document.createElement('div');
    panel.className = 'av-str-input-panel';

    var textLabel = I18N.t('av.str.text_label', null, 'Text:');
    var patternLabel = I18N.t('av.str.pattern_label', null, 'Pattern:');
    var applyLabel = I18N.t('av.str.input_apply', null, 'Apply');

    panel.innerHTML =
        '<label class="av-str-input-group">' +
            '<span class="av-str-input-label">' + textLabel + '</span>' +
            '<input type="text" class="av-str-input" id="av-str-input-text" value="' + text + '" spellcheck="false" autocomplete="off">' +
        '</label>' +
        '<label class="av-str-input-group">' +
            '<span class="av-str-input-label">' + patternLabel + '</span>' +
            '<input type="text" class="av-str-input" id="av-str-input-pattern" value="' + pattern + '" spellcheck="false" autocomplete="off">' +
        '</label>' +
        '<button class="av-str-input-btn" id="av-str-input-apply">' + applyLabel + '</button>';

    canvas.parentNode.insertBefore(panel, canvas);

    var applyBtn = document.getElementById('av-str-input-apply');
    var textInput = document.getElementById('av-str-input-text');
    var patInput = document.getElementById('av-str-input-pattern');

    function doApply() {
        var t = textInput.value.trim();
        var p = patInput.value.trim();
        if (!t || !p || p.length > t.length) return;
        onApply(t, p);
    }

    applyBtn.onclick = doApply;
    textInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doApply(); });
    patInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doApply(); });
};

AV._removeStringInputPanel = function() {
    var panel = document.querySelector('.av-str-input-panel');
    if (panel) panel.remove();
};

AV._renderInsertBanner = function(value) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;
    var banner = canvas.querySelector('.av-insert-banner');
    if (value === null) {
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'av-insert-banner';
            canvas.appendChild(banner);
        }
        var label = I18N.t('av.insert_label', null, 'Inserting:');
        banner.innerHTML = '<span>' + label + '</span><span class="av-insert-value">\u2014</span>';
        return;
    }
    if (!banner) return;
    banner.querySelector('.av-insert-value').textContent = value;
};

AV._removeInsertBanner = function() {
    var banner = document.querySelector('.av-insert-banner');
    if (banner) banner.remove();
};

/* ===== Accent Colors ===== */
AV.setAccentColors = function(algorithmId) {
    var root = document.documentElement.style;
    var themes = {
        'bubble-sort': { accent: '#3B82F6', bg: '#0d1630', light: '#152048' },
        'linear-search': { accent: '#8B5CF6', bg: '#1a0d30', light: '#221548' },
        'bfs': { accent: '#06B6D4', bg: '#0d1a22', light: '#15252f' },
        'bst-operations': { accent: '#F59E0B', bg: '#1a1508', light: '#2d2210' },
        'fibonacci': { accent: '#EC4899', bg: '#1a0d18', light: '#2d1528' },
        'kmp': { accent: '#14B8A6', bg: '#0d1a1a', light: '#15282a' },
        'selection-sort': { accent: '#10B981', bg: '#0d1a18', light: '#152a25' },
        'hash-table': { accent: '#F97316', bg: '#1a1208', light: '#2d1f10' },
        'binary-search': { accent: '#0EA5E9', bg: '#0c1a2e', light: '#142d4a' },
        'jump-search': { accent: '#A855F7', bg: '#1a0d2e', light: '#25154a' },
        'dfs': { accent: '#A855F7', bg: '#1a0d2e', light: '#25154a' },
        'merge-sort': { accent: '#6366F1', bg: '#0d0d30', light: '#15154a' },
        'dijkstra': { accent: '#F43F5E', bg: '#1a0d12', light: '#2d1520' }
    };
    var t = themes[algorithmId] || themes['bubble-sort'];
    root.setProperty('--av-accent', t.accent);
    root.setProperty('--av-accent-bg', t.bg);
    root.setProperty('--av-accent-light', t.light);
};

/* ===== Trade-offs Rendering ===== */
AV.showTradeoffs = function(tradeoffs, i18nPrefix) {
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

/* ===== Complexity Panel ===== */
AV.showComplexity = function(rules, i18nKey) {
    var body = document.getElementById('dep-rules-body');
    if (!body) return;

    var translated = i18nKey ? I18N.to(i18nKey, rules) : rules;
    var html = '';
    translated.forEach(function(r) {
        var cls = r.type === 'good' ? 'allowed' : (r.type === 'bad' ? 'forbidden' : 'info');
        var icon = r.type === 'good' ? '&#x2705;' : (r.type === 'bad' ? '&#x274C;' : '&#x1F539;');
        html += '<div class="dep-rule ' + cls + '">' +
            '<span class="dep-rule-icon">' + icon + '</span>' +
            '<span><strong>' + r.name + '</strong> — ' + r.role + '</span>' +
            '</div>';
    });

    body.innerHTML = html;
};

/* ===== Animate Algorithm Flow ===== */
AV.animateFlow = async function(steps, options) {
    if (AV.state.running) return;

    if (AV.stepMode.active) {
        AV.exitStepMode();
    }

    AV.state.comparisons = 0;
    AV.state.swaps = 0;
    AV.state.sortedIndices = [];
    AV.updateStats();
    AV.state.stepIndex = 0;
    AV.state._flowSteps = steps;
    AV.state._flowOptions = options;
    AV.state._visitOrderCounter = 0;
    AV.state.running = true;

    var opts = options || {};
    AV.log('REQUEST', opts.requestLabel || I18N.t('av.log.started', null, 'Algorithm started'));
    var startTime = performance.now();

    try {
    for (var i = 0; i < steps.length; i++) {
        if (!AV.state.running) break;
        AV.state.stepIndex = i;

        var step = steps[i];

        if (step.type === 'COMPARE') {
            AV.clearHighlights();
            AV.highlightBars(step.indices, 'av-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('COMPARE', I18N.t('av.log.compare', { a: step.values[0], b: step.values[1], i: step.indices[0], j: step.indices[1] },
                'Compare arr[' + step.indices[0] + ']=' + step.values[0] + ' with arr[' + step.indices[1] + ']=' + step.values[1]));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'SWAP') {
            AV.clearHighlights();
            AV.highlightBars(step.indices, 'av-swapping');
            AV.state.swaps++;
            AV.updateStats();
            AV.log('SWAP', I18N.t('av.log.swap', { a: step.values[0], b: step.values[1], i: step.indices[0], j: step.indices[1] },
                'Swap arr[' + step.indices[0] + ']=' + step.values[0] + ' \u2194 arr[' + step.indices[1] + ']=' + step.values[1]));
            await AV.animateSwap(step.indices[0], step.indices[1]);
            await AV.sleep(AV.state.stepDelay * 0.5);
        } else if (step.type === 'OVERWRITE') {
            AV.clearHighlights();
            AV.updateBarValue(step.index, step.value, Math.max.apply(null, AV.state._initialArray));
            AV.highlightBars([step.index], 'av-swapping');
            AV.state.swaps++;
            AV.updateStats();
            AV.log('OVERWRITE', I18N.t('av.log.overwrite', { index: step.index, value: step.value },
                'Place ' + step.value + ' at position ' + step.index));
            await AV.sleep(AV.state.stepDelay * 0.5);
        } else if (step.type === 'SORTED') {
            AV.clearHighlights();
            AV.markSorted(step.index);
            AV.log('SORTED', I18N.t('av.log.sorted', { index: step.index, value: step.value },
                'Position ' + step.index + ' (value=' + step.value + ') is sorted'));
            await AV.sleep(AV.state.stepDelay * 0.3);
        } else if (step.type === 'PASS') {
            AV.clearHighlights();
            AV.log('PASS', I18N.t('av.log.pass', { n: step.pass },
                'Pass ' + step.pass + ' begins'));
            await AV.sleep(AV.state.stepDelay * 0.3);
        } else if (step.type === 'SCAN') {
            AV.clearHighlights();
            var bars = document.querySelectorAll('.av-bar');
            for (var ei = 0; ei < step.index; ei++) {
                if (bars[ei]) bars[ei].classList.add('av-examined');
            }
            AV.highlightBars([step.index], 'av-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('SCAN', I18N.t('av.log.scan', { index: step.index, value: step.value, target: step.target },
                'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'BS_CHECK') {
            AV.clearHighlights();
            AV['binary-search']._applyEliminated(step.eliminated);
            AV.highlightBars([step.mid], 'av-comparing');
            AV['binary-search']._renderPointers(step.low, step.mid, step.high);
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('BS_CHECK', I18N.t('av.log.bs_check', { mid: step.mid, value: step.value, target: step.target, low: step.low, high: step.high },
                'Check arr[' + step.mid + ']=' + step.value + ' vs target=' + step.target + ' (range [' + step.low + '..' + step.high + '])'));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'BS_ELIMINATE') {
            AV.clearHighlights();
            AV['binary-search']._applyEliminated(step.eliminated);
            AV['binary-search']._renderPointers(step.newLow, -1, step.newHigh);
            AV.log('BS_ELIMINATE', I18N.t('av.log.bs_eliminate', { direction: step.direction, newLow: step.newLow, newHigh: step.newHigh },
                'Eliminate ' + step.direction + ' half, new range [' + step.newLow + '..' + step.newHigh + ']'));
            await AV.sleep(AV.state.stepDelay * 0.5);
        } else if (step.type === 'JS_JUMP') {
            AV.clearHighlights();
            AV['jump-search']._applySkipped(step.skipped);
            AV.highlightBars([step.jumpPos], 'av-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('JS_JUMP', I18N.t('av.log.js_jump', { jumpPos: step.jumpPos, value: step.value, target: step.target, blockStart: step.blockStart, jumpSize: step.jumpSize },
                'Jump to arr[' + step.jumpPos + ']=' + step.value + ' vs target=' + step.target + ' (block from ' + step.blockStart + ', step=' + step.jumpSize + ')'));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'JS_SCAN') {
            AV.clearHighlights();
            AV['jump-search']._applySkipped(step.skipped);
            var jsBars = document.querySelectorAll('.av-bar');
            for (var jsi = step.blockStart; jsi < step.index; jsi++) {
                if (jsBars[jsi]) jsBars[jsi].classList.add('av-examined');
            }
            AV.highlightBars([step.index], 'av-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('JS_SCAN', I18N.t('av.log.js_scan', { index: step.index, value: step.value, target: step.target },
                'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'FOUND') {
            AV.clearHighlights();
            if (step.eliminated) {
                AV['binary-search']._applyEliminated(step.eliminated);
            } else if (step.skipped) {
                AV['jump-search']._applySkipped(step.skipped);
            } else {
                var barsF = document.querySelectorAll('.av-bar');
                for (var fi = 0; fi < step.index; fi++) {
                    if (barsF[fi]) barsF[fi].classList.add('av-examined');
                }
            }
            AV.highlightBars([step.index], 'av-sorted');
            AV.log('FOUND', I18N.t('av.log.found', { index: step.index, value: step.value },
                'Found ' + step.value + ' at index ' + step.index));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'ENQUEUE') {
            /* Remove start ring if present */
            var enqNode = document.querySelector('.av-node[data-node="' + step.node + '"]');
            if (enqNode) { var sr = enqNode.querySelector('.av-start-ring'); if (sr) sr.remove(); }
            AV.setNodeState(step.node, 'queued');
            if (step.pq) {
                AV.renderPriorityQueue(step.pq);
                if (step.dist !== undefined) AV._setNodeDistance(step.node, step.dist);
                AV.log('ENQUEUE', I18N.t('av.log.enqueue_dijkstra', { node: step.node, dist: step.dist === Infinity ? '\u221E' : step.dist }, 'Init ' + step.node + ' dist=' + (step.dist === Infinity ? '\u221E' : step.dist)));
            } else {
                AV.renderQueue(step.queue);
                AV.log('ENQUEUE', I18N.t('av.log.enqueue', { node: step.node, level: step.level, queue: step.queue.join(', ') }, 'Enqueue ' + step.node));
            }
            await AV.sleep(AV.state.stepDelay * 0.6);
        } else if (step.type === 'PUSH') {
            var pushNode = document.querySelector('.av-node[data-node="' + step.node + '"]');
            if (pushNode) { var sr2 = pushNode.querySelector('.av-start-ring'); if (sr2) sr2.remove(); }
            AV.setNodeState(step.node, 'queued');
            AV.renderStack(step.stack);
            AV.log('PUSH', I18N.t('av.log.push', { node: step.node, depth: step.depth, stack: step.stack.join(', ') }, 'Push ' + step.node));
            await AV.sleep(AV.state.stepDelay * 0.6);
        } else if (step.type === 'DEQUEUE') {
            AV.setNodeState(step.node, 'visiting');
            AV.state.comparisons++;
            AV.updateStats();
            if (step.pq) {
                AV.renderPriorityQueue(step.pq);
                AV.log('DEQUEUE', I18N.t('av.log.dequeue_dijkstra', { node: step.node, dist: step.dist, neighborCount: step.neighborCount }, 'Extract-min ' + step.node + ' (dist=' + step.dist + ')'));
            } else {
                AV.renderQueue(step.queue);
                AV.log('DEQUEUE', I18N.t('av.log.dequeue', { node: step.node, level: step.level, neighborCount: step.neighborCount, queue: step.queue.join(', ') }, 'Dequeue ' + step.node));
            }
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'POP') {
            AV.setNodeState(step.node, 'visiting');
            AV.renderStack(step.stack);
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('POP', I18N.t('av.log.pop', { node: step.node, depth: step.depth, neighborCount: step.neighborCount, stack: step.stack.join(', ') }, 'Pop ' + step.node));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'EXPLORE_EDGE') {
            AV.highlightEdge(step.from, step.to, 'av-edge-active');
            AV.state.swaps++;
            AV.updateStats();
            if (step.alreadyVisited) {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge_skip', { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ': skip'));
            } else if (step.relaxSkipped) {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge_no_relax', { from: step.from, to: step.to, newDist: step.newDist, currentDist: step.currentDist },
                    'Edge ' + step.from + '\u2192' + step.to + ': no improvement (' + step.newDist + ' \u2265 ' + step.currentDist + ')'));
            } else {
                var edgeLogKey = step.action === 'push' ? 'av.log.explore_edge_push' : 'av.log.explore_edge';
                AV.log('EXPLORE_EDGE', I18N.t(edgeLogKey, { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ': add'));
            }
            await AV.sleep(AV.state.stepDelay * 0.5);
            AV.highlightEdge(step.from, step.to, 'av-edge-traversed');
        } else if (step.type === 'RELAX') {
            AV.setNodeState(step.node, 'queued');
            AV._setNodeDistance(step.node, step.newDist);
            AV.highlightEdge(step.via, step.node, 'av-edge-relaxed');
            if (step.pq) AV.renderPriorityQueue(step.pq);
            var oldD = (step.oldDist === Infinity || step.oldDist === 'Infinity') ? '\u221E' : step.oldDist;
            AV.log('RELAX', I18N.t('av.log.relax', { node: step.node, oldDist: oldD, newDist: step.newDist, via: step.via },
                'Relax ' + step.node + ': ' + oldD + ' \u2192 ' + step.newDist + ' via ' + step.via));
            await AV.sleep(AV.state.stepDelay * 0.7);
            AV.highlightEdge(step.via, step.node, 'av-edge-traversed');
        } else if (step.type === 'VISIT') {
            AV.setNodeState(step.node, 'visited');
            if (step.pq) {
                AV.renderPriorityQueue(step.pq);
                AV.state._visitOrderCounter++;
                AV._showVisitOrder(step.node, AV.state._visitOrderCounter);
                AV.log('VISIT', I18N.t('av.log.visit_dijkstra', { node: step.node, dist: step.dist }, step.node + ' finalized (dist=' + step.dist + ')'));
            } else if (step.stack !== undefined) {
                AV.renderStack(step.stack);
                AV.state._visitOrderCounter++;
                AV._showVisitOrder(step.node, AV.state._visitOrderCounter);
                AV.log('VISIT', I18N.t('av.log.visit_dfs', { node: step.node, depth: step.depth, stack: step.stack.join(', ') }, step.node + ' done'));
            } else {
                AV.renderQueue(step.queue);
                AV.state._visitOrderCounter++;
                AV._showVisitOrder(step.node, AV.state._visitOrderCounter);
                AV.log('VISIT', I18N.t('av.log.visit', { node: step.node, level: step.level, queue: step.queue.join(', ') }, step.node + ' done'));
            }
            await AV.sleep(AV.state.stepDelay * 0.4);
        } else if (step.type === 'COMPLETE') {
            if (AV.state._isTreeAlgorithm) {
                document.querySelectorAll('.av-node').forEach(function(n) {
                    var cls = n.className.baseVal;
                    if (cls.indexOf('av-node-visiting') !== -1 || cls.indexOf('av-node-visited') !== -1) {
                        n.className.baseVal = 'av-node av-node-inserted';
                    }
                });
                AV._removeInsertBanner();
                AV.log('COMPLETE', I18N.t('av.log.complete_tree', null, 'BST construction complete'));
            } else if (step.isDijkstra) {
                AV.renderPriorityQueue([]);
                AV.log('COMPLETE', I18N.t('av.log.complete_dijkstra', { totalVisited: step.totalVisited, totalNodes: step.totalNodes }, 'Dijkstra complete: ' + step.totalVisited + '/' + step.totalNodes + ' nodes'));
            } else if (step.maxDepth !== undefined) {
                AV.renderStack([]);
                AV.log('COMPLETE', I18N.t('av.log.complete_dfs', { totalVisited: step.totalVisited, totalNodes: step.totalNodes, maxDepth: step.maxDepth }, 'DFS complete'));
            } else {
                AV.renderQueue([]);
                AV.log('COMPLETE', I18N.t('av.log.complete', { totalVisited: step.totalVisited, totalNodes: step.totalNodes, maxLevel: step.maxLevel }, 'BFS complete'));
            }
            await AV.sleep(AV.state.stepDelay * 0.3);
        } else if (step.type === 'INSERT_START') {
            document.querySelectorAll('.av-node').forEach(function(n) {
                var cls = n.className.baseVal;
                if (cls.indexOf('av-node-visiting') !== -1 || cls.indexOf('av-node-visited') !== -1) {
                    n.className.baseVal = 'av-node av-node-inserted';
                }
            });
            AV._renderInsertBanner(step.value);
            AV.log('INSERT', I18N.t('av.log.insert_start', { value: step.value }, 'Insert value ' + step.value));
            await AV.sleep(AV.state.stepDelay * 0.5);
        } else if (step.type === 'TREE_COMPARE') {
            AV.setNodeState(String(step.nodeValue), 'visiting');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('TRAVERSE', I18N.t('av.log.tree_compare', { value: step.value, nodeValue: step.nodeValue },
                'Compare ' + step.value + ' with node ' + step.nodeValue));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'TREE_GO_LEFT' || step.type === 'TREE_GO_RIGHT') {
            AV.setNodeState(String(step.fromNode), 'visited');
            var treeDir = step.type === 'TREE_GO_LEFT' ? 'left' : 'right';
            AV.log('TRAVERSE', I18N.t('av.log.tree_go', { value: step.value, direction: treeDir, fromNode: step.fromNode },
                'Go ' + treeDir + ' from ' + step.fromNode));
            await AV.sleep(AV.state.stepDelay * 0.4);
        } else if (step.type === 'TREE_PLACE') {
            if (step.parentNode !== null) {
                AV.highlightEdge(String(step.parentNode), String(step.value), 'av-edge-active');
            }
            AV.setNodeState(String(step.value), 'inserted');
            AV.state.swaps++;
            AV.updateStats();
            AV.log('INSERT', I18N.t('av.log.tree_place', { value: step.value, parentNode: step.parentNode || 'none', direction: step.direction },
                'Place ' + step.value + (step.parentNode ? ' as ' + step.direction + ' of ' + step.parentNode : ' as root')));
            await AV.sleep(AV.state.stepDelay * 0.8);
            if (step.parentNode !== null) {
                AV.highlightEdge(String(step.parentNode), String(step.value), 'av-edge-traversed');
            }
        } else if (step.type === 'DP_BASE') {
            AV.clearHighlights();
            AV.updateBarValue(step.index, step.value, AV.state._dpMaxVal || 1);
            AV.highlightBars([step.index], 'av-base-case');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('DP_BASE', I18N.t('av.log.dp_base', { index: step.index, value: step.value },
                'Base case: F(' + step.index + ') = ' + step.value));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'DP_READ') {
            AV.clearHighlights();
            AV.highlightBars(step.indices, 'av-reading');
            AV.log('DP_READ', I18N.t('av.log.dp_read', { i1: step.indices[0], v1: step.values[0], i2: step.indices[1], v2: step.values[1], computing: step.computing },
                'To compute F(' + step.computing + '): read F(' + step.indices[0] + ')=' + step.values[0] + ', F(' + step.indices[1] + ')=' + step.values[1]));
            await AV.sleep(AV.state.stepDelay * 0.7);
        } else if (step.type === 'DP_FILL') {
            AV.clearHighlights();
            AV.highlightBars([step.index], 'av-computing');
            AV.updateBarValue(step.index, step.value, AV.state._dpMaxVal || 1);
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('DP_FILL', I18N.t('av.log.dp_fill', { index: step.index, value: step.value, formula: step.formula, i1: step.i1, v1: step.v1, i2: step.i2, v2: step.v2 },
                'F(' + step.index + ') = F(' + step.i1 + ')+F(' + step.i2 + ') = ' + step.v1 + '+' + step.v2 + ' = ' + step.value));
            await AV.sleep(AV.state.stepDelay);
            AV.clearHighlights();
            AV.markSorted(step.index);
        } else if (step.type === 'DP_RESULT') {
            AV.clearHighlights();
            AV.highlightBars([step.index], 'av-result');
            AV.log('DP_RESULT', I18N.t('av.log.dp_result', { n: step.index, value: step.value },
                'Answer: F(' + step.index + ') = ' + step.value));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'DP_CALL') {
            AV.setNodeState(step.node, 'computing');
            if (step.parentNode) {
                AV.highlightEdge(step.parentNode, step.node, 'av-edge-active');
            }
            AV.state.comparisons++;
            AV.updateStats();
            var dpCallMsg = step.parentLabel
                ? I18N.t('av.log.dp_call_from', { n: step.label || step.node, parent: step.parentLabel, depth: step.depth },
                    step.parentLabel + ' needs ' + (step.label || step.node) + ': depth ' + step.depth)
                : I18N.t('av.log.dp_call_root', { n: step.label || step.node },
                    'Compute ' + (step.label || step.node) + ': begin recursion');
            AV.log('DP_CALL', dpCallMsg);
            await AV.sleep(AV.state.stepDelay * 0.7);
            if (step.parentNode) {
                AV.highlightEdge(step.parentNode, step.node, 'av-edge-traversed');
            }
        } else if (step.type === 'DP_MEMO_HIT') {
            AV.setNodeState(step.node, 'cached');
            if (step.parentNode) {
                AV.highlightEdge(step.parentNode, step.node, 'av-edge-active');
                await AV.sleep(AV.state.stepDelay * 0.3);
                AV.highlightEdge(step.parentNode, step.node, 'av-edge-traversed');
            }
            AV.state.swaps++;
            AV.updateStats();
            var dpMemoMsg = step.parentLabel
                ? I18N.t('av.log.dp_memo_hit_from', { n: step.label || step.node, value: step.value, parent: step.parentLabel },
                    step.parentLabel + ' needs ' + (step.label || step.node) + ': ' + step.value + ' in cache')
                : I18N.t('av.log.dp_memo_hit', { n: step.label || step.node, value: step.value },
                    'Cache hit: ' + (step.label || step.node) + '=' + step.value + ' \u2014 skip subtree');
            AV.log('DP_MEMO', dpMemoMsg);
            /* Update node text to show value (two-line) */
            AV._setDpNodeText(step.node, step.label || step.node, step.value);
            await AV.sleep(AV.state.stepDelay * 0.5);
        } else if (step.type === 'DP_RETURN') {
            AV.setNodeState(step.node, 'visited');
            var dpRetMsg = step.formula
                ? I18N.t('av.log.dp_return_formula', { n: step.label || step.node, value: step.value, formula: step.formula },
                    'Return ' + (step.label || step.node) + ' = ' + step.formula + ' = ' + step.value + ', store')
                : I18N.t('av.log.dp_return_base', { n: step.label || step.node, value: step.value },
                    'Return ' + (step.label || step.node) + '=' + step.value + ' (base), store');
            AV.log('DP_RETURN', dpRetMsg);
            /* Update node text to show value (two-line) */
            AV._setDpNodeText(step.node, step.label || step.node, step.value);
            await AV.sleep(AV.state.stepDelay * 0.4);

        /* ===== String Matching Steps ===== */
        } else if (step.type === 'STR_COMPARE') {
            AV.clearStringHighlights();
            var strTextCells = document.querySelectorAll('#av-str-text .av-str-cell');
            var strPatCells = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            if (strTextCells[step.textIndex]) strTextCells[step.textIndex].classList.add('av-str-comparing');
            if (strPatCells[step.patternIndex]) strPatCells[step.patternIndex].classList.add('av-str-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('STR_COMPARE', I18N.t('av.log.str_compare',
                { ti: step.textIndex, tc: step.textChar, pi: step.patternIndex, pc: step.patternChar },
                'Compare text[' + step.textIndex + ']=\u201C' + step.textChar + '\u201D with pattern[' + step.patternIndex + ']=\u201C' + step.patternChar + '\u201D'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'STR_MATCH_CHAR') {
            AV.clearStringHighlights();
            var strTextCells2 = document.querySelectorAll('#av-str-text .av-str-cell');
            var strPatCells2 = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            for (var smi = 0; smi <= step.patternIndex; smi++) {
                if (strTextCells2[step.offset + smi]) strTextCells2[step.offset + smi].classList.add('av-str-match');
                if (strPatCells2[smi]) strPatCells2[smi].classList.add('av-str-match');
            }
            var strMatched = step.matched || (step.patternIndex + 1);
            var strTotal = (AV.state._pattern || '').length;
            AV.log('STR_MATCH_CHAR', I18N.t('av.log.str_match_char',
                { tc: step.textChar, ti: step.textIndex, pi: step.patternIndex, matched: strMatched, total: strTotal },
                'Match at [' + step.textIndex + ']: \u201C' + step.textChar + '\u201D \u2014 ' + strMatched + '/' + strTotal));
            await AV.sleep(AV.state.stepDelay * 0.5);

        } else if (step.type === 'STR_MISMATCH') {
            AV.clearStringHighlights();
            var strTextCells3 = document.querySelectorAll('#av-str-text .av-str-cell');
            var strPatCells3 = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            if (strTextCells3[step.textIndex]) strTextCells3[step.textIndex].classList.add('av-str-mismatch');
            if (strPatCells3[step.patternIndex]) strPatCells3[step.patternIndex].classList.add('av-str-mismatch');
            if (step.patternIndex === 0) {
                AV.log('STR_MISMATCH', I18N.t('av.log.str_mismatch_start',
                    { ti: step.textIndex, tc: step.textChar, pc: step.patternChar },
                    'Mismatch at text[' + step.textIndex + ']: \u201C' + step.textChar + '\u201D\u2260\u201C' + step.patternChar + '\u201D \u2014 advance text'));
            } else {
                AV.log('STR_MISMATCH', I18N.t('av.log.str_mismatch',
                    { tc: step.textChar, ti: step.textIndex, pi: step.patternIndex, pc: step.patternChar, lps: step.lpsValue, lpsIdx: step.lpsIdx !== undefined ? step.lpsIdx : step.patternIndex - 1 },
                    'Mismatch text[' + step.textIndex + ']: \u201C' + step.textChar + '\u201D\u2260\u201C' + step.patternChar + '\u201D \u2014 LPS=' + step.lpsValue + ', keep ' + step.lpsValue));
            }
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'STR_SHIFT') {
            AV.renderStringMatch(AV.state._text, AV.state._pattern, step.newOffset, step.lps);
            var strSkipped = step.skipped !== undefined ? step.skipped : (step.newOffset - step.oldOffset);
            AV.log('STR_SHIFT', I18N.t('av.log.str_shift',
                { from: step.oldOffset, to: step.newOffset, lps: step.lpsValue, skipped: strSkipped },
                'Shift +' + strSkipped + ' (' + step.oldOffset + '\u2192' + step.newOffset + '): ' + step.lpsValue + ' chars align'));
            await AV.sleep(AV.state.stepDelay * 0.6);

        } else if (step.type === 'STR_FOUND') {
            AV.clearStringHighlights();
            var strTextCells4 = document.querySelectorAll('#av-str-text .av-str-cell');
            var strPatCells4 = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            for (var sfi = 0; sfi < AV.state._pattern.length; sfi++) {
                if (strTextCells4[step.position + sfi]) strTextCells4[step.position + sfi].classList.add('av-str-found');
                if (strPatCells4[sfi]) strPatCells4[sfi].classList.add('av-str-found');
            }
            AV.state.swaps++;
            AV.updateStats();
            var strMatchEnd = step.matchEnd !== undefined ? step.matchEnd : (step.position + (AV.state._pattern || '').length - 1);
            AV.log('STR_FOUND', I18N.t('av.log.str_found',
                { position: step.position, matchEnd: strMatchEnd },
                'Pattern found at text[' + step.position + '..' + strMatchEnd + ']!'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'STR_LPS_SET') {
            var lpsCell = document.querySelector('.av-str-lps-cell[data-lindex="' + step.index + '"]');
            if (lpsCell) {
                lpsCell.textContent = step.value;
                lpsCell.classList.add('av-str-lps-set');
                lpsCell.classList.add('av-str-lps-filled');
            }
            var lpsLogKey, lpsLogParams, lpsLogFallback;
            if (step.index === 0) {
                lpsLogKey = 'av.log.str_lps_set_base';
                lpsLogParams = { index: 0 };
                lpsLogFallback = 'LPS[0]=0: single char \u2014 no proper prefix';
            } else if (step.value === 0) {
                lpsLogKey = 'av.log.str_lps_set_zero';
                lpsLogParams = { index: step.index, char: step.char };
                lpsLogFallback = 'LPS[' + step.index + ']=0: no prefix=suffix';
            } else {
                lpsLogKey = 'av.log.str_lps_set';
                lpsLogParams = { index: step.index, value: step.value, char: step.char, prefix: step.prefix || '' };
                lpsLogFallback = 'LPS[' + step.index + ']=' + step.value + ': \u201C' + (step.prefix || '') + '\u201D prefix=suffix';
            }
            AV.log('STR_LPS_SET', I18N.t(lpsLogKey, lpsLogParams, lpsLogFallback));
            await AV.sleep(AV.state.stepDelay * 0.5);

        } else if (step.type === 'HASH_COMPUTE') {
            AV.clearHashHighlights();
            AV._updateHashKeyBanner(step.key);
            AV._updateHashFormula(step.key, step.hashValue, step.tableSize, step.charCodeSum);
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('HASH_COMPUTE', I18N.t('av.log.hash_compute',
                { key: step.key, hash: step.hashValue, size: step.tableSize, sum: step.charCodeSum },
                'h("' + step.key + '") = (' + step.charCodeSum + ') mod ' + step.tableSize + ' = ' + step.hashValue));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'HASH_CHECK_SLOT') {
            AV.clearHashHighlights();
            var hcSlot = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hcSlot) hcSlot.classList.add('av-hash-checking');
            if (step.chainPos !== undefined && hcSlot) {
                var hcNode = hcSlot.querySelectorAll('.av-hash-chain-node')[step.chainPos];
                if (hcNode) hcNode.classList.add('av-hash-checking');
            }
            AV.log('HASH_CHECK', I18N.t('av.log.hash_check_slot',
                { index: step.index, value: step.currentValue },
                'Check bucket[' + step.index + ']: ' + (step.isEmpty ? 'empty' : 'occupied (' + step.currentValue + ')')));
            await AV.sleep(AV.state.stepDelay * 0.7);

        } else if (step.type === 'HASH_INSERT') {
            AV.clearHashHighlights();
            AV._insertHashValue(step.index, step.key, AV.state._hashMode);
            var hiSlot = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hiSlot) hiSlot.classList.add('av-hash-inserting');
            AV.state.swaps++;
            AV.updateStats();
            AV.log('HASH_INSERT', I18N.t('av.log.hash_insert',
                { key: step.key, index: step.index },
                'Insert "' + step.key + '" into bucket[' + step.index + ']'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'HASH_COLLISION') {
            AV.clearHashHighlights();
            var hcolSlot = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hcolSlot) hcolSlot.classList.add('av-hash-collision');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('HASH_COLLISION', I18N.t('av.log.hash_collision',
                { key: step.key, index: step.index, existing: step.existingValue },
                'Collision at bucket[' + step.index + ']: ' + step.existingValue + ' already present'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'HASH_CHAIN_ADD') {
            AV.clearHashHighlights();
            AV._insertHashValue(step.index, step.key, 'chaining');
            var hcaSlot = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hcaSlot) hcaSlot.classList.add('av-hash-inserting');
            AV.state.swaps++;
            AV.updateStats();
            AV.log('HASH_CHAIN', I18N.t('av.log.hash_chain_add',
                { key: step.key, index: step.index, chainLen: step.chainLength },
                'Chain "' + step.key + '" to bucket[' + step.index + '] (chain length: ' + step.chainLength + ')'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'HASH_PROBE') {
            AV.clearHashHighlights();
            var hpFrom = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.fromIndex + '"]');
            var hpTo = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.toIndex + '"]');
            if (hpFrom) hpFrom.classList.add('av-hash-probing');
            if (hpTo) hpTo.classList.add('av-hash-checking');
            AV.log('HASH_PROBE', I18N.t('av.log.hash_probe',
                { key: step.key, from: step.fromIndex, to: step.toIndex, num: step.probeNumber },
                'Probe #' + step.probeNumber + ': bucket[' + step.fromIndex + '] \u2192 bucket[' + step.toIndex + ']'));
            await AV.sleep(AV.state.stepDelay * 0.7);

        } else if (step.type === 'HASH_FOUND') {
            AV.clearHashHighlights();
            var hfSlot = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hfSlot) hfSlot.classList.add('av-hash-found');
            if (step.chainPos !== undefined && hfSlot) {
                var hfNode = hfSlot.querySelectorAll('.av-hash-chain-node')[step.chainPos];
                if (hfNode) hfNode.classList.add('av-hash-found');
            }
            AV.log('HASH_FOUND', I18N.t('av.log.hash_found',
                { key: step.key, index: step.index },
                'Found "' + step.key + '" in bucket[' + step.index + ']'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'HASH_NOT_FOUND') {
            AV.clearHashHighlights();
            document.querySelectorAll('.av-hash-bucket-slot').forEach(function(s) {
                s.classList.add('av-hash-not-found');
            });
            AV.log('HASH_NOT_FOUND', I18N.t('av.log.hash_not_found',
                { key: step.key },
                'Value "' + step.key + '" not found in hash table'));
            await AV.sleep(AV.state.stepDelay);

        } else if (step.type === 'DONE') {
            AV.clearHighlights();
            if (AV.state._isStringAlgorithm) {
                AV.clearStringHighlights();
                document.querySelectorAll('#av-str-text .av-str-cell').forEach(function(c) {
                    if (!c.classList.contains('av-str-found')) c.classList.add('av-str-idle');
                });
            } else if (AV.state._isHashAlgorithm) {
                AV.clearHashHighlights();
            } else if (step.found === false) {
                document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-examined'); });
            } else {
                document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-sorted'); });
            }
        }
    }
    } catch (e) {
        if (e.message !== 'AV_STOP') throw e;
    }

    var elapsed = Math.round(performance.now() - startTime);
    if (AV.state.running) {
        if (AV.state._isDPAlgorithm) {
            AV.log('DONE', I18N.t('av.log.done_dp', { time: elapsed, computations: AV.state.comparisons, cacheHits: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' computations, ' + AV.state.swaps + ' cache hits)'));
        } else if (AV.state._isTreeAlgorithm) {
            AV.log('DONE', I18N.t('av.log.done_tree', { time: elapsed, comparisons: AV.state.comparisons, inserted: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons, ' + AV.state.swaps + ' nodes inserted)'));
        } else if (AV.state._graphData) {
            AV.log('DONE', I18N.t('av.log.done_graph', { time: elapsed, nodes: AV.state.comparisons, edges: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' nodes, ' + AV.state.swaps + ' edges)'));
        } else if (AV.state._isStringAlgorithm) {
            AV.log('DONE', I18N.t('av.log.done_string', { time: elapsed, comparisons: AV.state.comparisons, matches: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons, ' + AV.state.swaps + ' matches found)'));
        } else if (AV.state._isHashAlgorithm) {
            AV.log('DONE', I18N.t('av.log.done_hash',
                { time: elapsed, operations: AV.state.comparisons, collisions: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' operations, ' + AV.state.swaps + ' insertions)'));
        } else if (AV.state._searchTarget !== undefined) {
            AV.log('DONE', I18N.t('av.log.done_search', { time: elapsed, comparisons: AV.state.comparisons },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons)'));
        } else {
            AV.log('DONE', I18N.t('av.log.done', { time: elapsed, comparisons: AV.state.comparisons, swaps: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons, ' + AV.state.swaps + ' swaps)'));
        }
    }
    AV.state.running = false;
    AV.state.paused = false;
    AV.state._flowSteps = null;
    AV.state._flowOptions = null;
    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }
};

/* ===== Step Mode ===== */
AV.stepMode = {
    active: false,
    steps: null,
    index: 0,
    options: null,
    arraySnapshots: null
};

AV._computeGraphSnapshots = function(steps) {
    var nodeStates = {};
    var queue = [];
    var edgeStates = {};
    var visitOrder = {};
    var visitCounter = 0;
    var distances = {};
    var snapshots = [{ nodeStates: {}, queue: [], edgeStates: {}, visitOrder: {}, distances: {} }];

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.type === 'ENQUEUE') {
            nodeStates[step.node] = 'queued';
            if (step.pq) {
                queue = step.pq.slice();
                if (step.dist !== undefined) distances[step.node] = step.dist;
            } else {
                queue = step.queue.slice();
            }
        } else if (step.type === 'PUSH') {
            nodeStates[step.node] = 'queued';
            queue = step.stack.slice();
        } else if (step.type === 'DEQUEUE') {
            nodeStates[step.node] = 'visiting';
            queue = step.pq ? step.pq.slice() : step.queue.slice();
        } else if (step.type === 'POP') {
            nodeStates[step.node] = 'visiting';
            queue = step.stack.slice();
        } else if (step.type === 'EXPLORE_EDGE') {
            var eKey = step.from + '-' + step.to;
            edgeStates[eKey] = 'traversed';
        } else if (step.type === 'RELAX') {
            nodeStates[step.node] = 'queued';
            if (step.distances) {
                Object.keys(step.distances).forEach(function(k) { distances[k] = step.distances[k]; });
            }
            if (step.pq) queue = step.pq.slice();
        } else if (step.type === 'VISIT') {
            nodeStates[step.node] = 'visited';
            if (step.pq) {
                queue = step.pq.slice();
            } else {
                queue = (step.stack || step.queue).slice();
            }
            visitCounter++;
            visitOrder[step.node] = visitCounter;
        } else if (step.type === 'INSERT_START') {
            Object.keys(nodeStates).forEach(function(k) {
                if (nodeStates[k] === 'visiting' || nodeStates[k] === 'visited') {
                    nodeStates[k] = 'inserted';
                }
            });
        } else if (step.type === 'TREE_COMPARE') {
            nodeStates[String(step.nodeValue)] = 'visiting';
        } else if (step.type === 'TREE_GO_LEFT' || step.type === 'TREE_GO_RIGHT') {
            nodeStates[String(step.fromNode)] = 'visited';
        } else if (step.type === 'TREE_PLACE') {
            nodeStates[String(step.value)] = 'inserted';
            if (step.parentNode !== null) {
                edgeStates[String(step.parentNode) + '-' + String(step.value)] = 'traversed';
            }
        } else if (step.type === 'COMPLETE') {
            queue = [];
            Object.keys(nodeStates).forEach(function(k) {
                if (nodeStates[k] === 'visiting' || nodeStates[k] === 'visited') {
                    nodeStates[k] = 'inserted';
                }
            });
        } else if (step.type === 'DP_CALL') {
            nodeStates[step.node] = 'computing';
            if (step.parentNode) {
                edgeStates[step.parentNode + '-' + step.node] = 'traversed';
            }
        } else if (step.type === 'DP_MEMO_HIT') {
            nodeStates[step.node] = 'cached';
            if (step.parentNode) {
                edgeStates[step.parentNode + '-' + step.node] = 'traversed';
            }
        } else if (step.type === 'DP_RETURN') {
            nodeStates[step.node] = 'visited';
        }
        var ns = {};
        Object.keys(nodeStates).forEach(function(k) { ns[k] = nodeStates[k]; });
        var es = {};
        Object.keys(edgeStates).forEach(function(k) { es[k] = edgeStates[k]; });
        var vo = {};
        Object.keys(visitOrder).forEach(function(k) { vo[k] = visitOrder[k]; });
        var dc = {};
        Object.keys(distances).forEach(function(k) { dc[k] = distances[k]; });
        snapshots.push({ nodeStates: ns, queue: queue.slice(), edgeStates: es, visitOrder: vo, distances: dc });
    }
    return snapshots;
};

AV._applyGraphSnapshot = function(snapshot) {
    var isTree = AV.state._isTreeAlgorithm;
    var isDP = AV.state._isDPAlgorithm;
    var defaultNodeClass = (isTree || isDP) ? 'av-node av-node-pending' : 'av-node av-node-unvisited';
    var defaultEdgeClass = (isTree || isDP) ? 'av-edge av-edge-pending' : 'av-edge';
    /* Reset all nodes */
    document.querySelectorAll('.av-node').forEach(function(n) {
        n.className.baseVal = defaultNodeClass;
        /* Reset node text for DP trees */
        if (isDP) {
            var textEl = n.querySelector('text');
            var nodeId = n.getAttribute('data-node');
            if (textEl && nodeId && AV.state._dpNodeLabels && AV.state._dpNodeLabels[nodeId]) {
                textEl.textContent = AV.state._dpNodeLabels[nodeId];
            }
        }
    });
    /* Reset all edges */
    document.querySelectorAll('.av-edge').forEach(function(e) {
        e.setAttribute('class', defaultEdgeClass);
    });
    /* Apply node states */
    Object.keys(snapshot.nodeStates).forEach(function(id) {
        AV.setNodeState(id, snapshot.nodeStates[id]);
    });
    /* Apply edge states */
    Object.keys(snapshot.edgeStates).forEach(function(key) {
        var parts = key.split('-');
        AV.highlightEdge(parts[0], parts[1], 'av-edge-traversed');
    });
    /* Apply queue/stack (graph algorithms) */
    if (!isTree && !isDP) {
        if (AV.state.algorithm === 'dijkstra') {
            AV.renderPriorityQueue(snapshot.queue);
        } else if (AV.state.algorithm === 'dfs') {
            AV.renderStack(snapshot.queue);
        } else {
            AV.renderQueue(snapshot.queue);
        }
    }
    /* Apply visit order badges */
    AV._hideAllVisitOrders();
    if (snapshot.visitOrder) {
        Object.keys(snapshot.visitOrder).forEach(function(id) {
            AV._showVisitOrder(id, snapshot.visitOrder[id]);
        });
    }
    /* Apply distance labels (Dijkstra / weighted graphs) */
    AV._hideAllDistances();
    if (snapshot.distances && Object.keys(snapshot.distances).length > 0) {
        Object.keys(snapshot.distances).forEach(function(id) {
            AV._setNodeDistance(id, snapshot.distances[id]);
        });
    }
    /* Remove all start rings — they are transient decorations */
    document.querySelectorAll('.av-start-ring').forEach(function(r) { r.remove(); });
    /* Re-apply start marker if node A has no state (initial graph state) */
    if (!isTree && !snapshot.nodeStates['A']) {
        if (AV.state.algorithm === 'bfs' && AV['bfs']) {
            AV['bfs']._markStartNode('A');
        } else if (AV.state.algorithm === 'dfs' && AV['dfs']) {
            AV['dfs']._markStartNode('A');
        } else if (AV.state.algorithm === 'dijkstra' && AV['dijkstra']) {
            AV['dijkstra']._markStartNode('A');
        }
    }
};

AV._computeSnapshots = function(initialArray, steps) {
    var arr = initialArray.slice();
    var sorted = [];
    var snapshots = [{ arr: arr.slice(), sorted: sorted.slice() }];

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.type === 'SWAP') {
            var tmp = arr[step.indices[0]];
            arr[step.indices[0]] = arr[step.indices[1]];
            arr[step.indices[1]] = tmp;
        } else if (step.type === 'OVERWRITE') {
            arr[step.index] = step.value;
        } else if (step.type === 'SORTED') {
            sorted = sorted.concat([step.index]);
        } else if (step.type === 'FOUND') {
            sorted = sorted.concat([step.index]);
        } else if (step.type === 'DP_BASE' || step.type === 'DP_FILL') {
            arr[step.index] = step.value;
            if (step.type === 'DP_FILL') {
                sorted = sorted.concat([step.index]);
            }
        } else if (step.type === 'DP_RESULT') {
            /* keep sorted as-is; result highlight handled via bar class */
        } else if (step.type === 'DONE') {
            if (step.found !== false) {
                sorted = [];
                for (var k = 0; k < arr.length; k++) sorted.push(k);
            }
        }
        snapshots.push({ arr: arr.slice(), sorted: sorted.slice() });
    }
    return snapshots;
};

AV._computeStringSnapshots = function(steps) {
    var patternOffset = 0;
    var lps = new Array(AV.state._pattern.length).fill(-1);
    var matchedPositions = [];
    var comparisons = 0;
    var matches = 0;

    var snapshots = [{
        patternOffset: 0,
        lps: lps.slice(),
        matchedPositions: [],
        comparisons: 0,
        matches: 0
    }];

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.type === 'STR_COMPARE') {
            comparisons++;
        } else if (step.type === 'STR_SHIFT') {
            patternOffset = step.newOffset;
        } else if (step.type === 'STR_FOUND') {
            matches++;
            matchedPositions = matchedPositions.concat([step.position]);
        } else if (step.type === 'STR_LPS_SET') {
            lps[step.index] = step.value;
        }
        snapshots.push({
            patternOffset: patternOffset,
            lps: lps.slice(),
            matchedPositions: matchedPositions.slice(),
            comparisons: comparisons,
            matches: matches
        });
    }
    return snapshots;
};

AV._applyStringSnapshot = function(snapshot) {
    var text = AV.state._text;
    var pattern = AV.state._pattern;
    AV.renderStringMatch(text, pattern, snapshot.patternOffset, snapshot.lps);

    var textCells = document.querySelectorAll('#av-str-text .av-str-cell');
    snapshot.matchedPositions.forEach(function(pos) {
        for (var j = 0; j < pattern.length; j++) {
            if (textCells[pos + j]) textCells[pos + j].classList.add('av-str-found');
        }
    });
};

AV.startStepMode = function(steps, options, initialArray, resumeFromIndex) {
    var isGraph = !!AV.state._graphData;
    var isString = !!AV.state._isStringAlgorithm;
    var isHash = !!AV.state._isHashAlgorithm;
    var snapshots = isGraph ? AV._computeGraphSnapshots(steps) : isString ? AV._computeStringSnapshots(steps) : isHash ? AV._computeHashSnapshots(steps) : AV._computeSnapshots(initialArray, steps);

    if (resumeFromIndex > 0) {
        /* Resume from current animation position — keep stats and log */
        AV.state.running = false;

        AV.stepMode.active = true;
        AV.stepMode.steps = steps;
        AV.stepMode.index = resumeFromIndex;
        AV.stepMode.options = options || {};
        AV.stepMode.arraySnapshots = snapshots;

        /* Render the snapshot at the current position */
        var snapshot = snapshots[resumeFromIndex];
        if (isGraph) {
            AV._applyGraphSnapshot(snapshot);
        } else if (isString) {
            AV._applyStringSnapshot(snapshot);
        } else if (isHash) {
            AV._applyHashSnapshot(snapshot);
        } else {
            AV.renderArray(snapshot.arr);
            snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });
        }

        /* Re-inject target line for search algorithms after renderArray */
        if (AV.state._searchTarget !== undefined) {
            var searchAlgo = AV[AV.state.algorithm];
            if (searchAlgo && searchAlgo._injectTargetLine) {
                searchAlgo._injectTargetLine(snapshot.arr, AV.state._searchTarget);
            }
        }

        /* Restore highlight from the last executed step */
        if (resumeFromIndex > 0 && !isGraph) {
            var lastStep = steps[resumeFromIndex - 1];
            if (lastStep.type === 'COMPARE') AV.highlightBars(lastStep.indices, 'av-comparing');
            else if (lastStep.type === 'SWAP') AV.highlightBars(lastStep.indices, 'av-swapping');
            else if (lastStep.type === 'OVERWRITE') AV.highlightBars([lastStep.index], 'av-swapping');
            else if (lastStep.type === 'SCAN') {
                var bars = document.querySelectorAll('.av-bar');
                for (var ei = 0; ei < lastStep.index; ei++) {
                    if (bars[ei]) bars[ei].classList.add('av-examined');
                }
                AV.highlightBars([lastStep.index], 'av-comparing');
            } else if (lastStep.type === 'BS_CHECK') {
                AV['binary-search']._applyEliminated(lastStep.eliminated);
                AV.highlightBars([lastStep.mid], 'av-comparing');
                AV['binary-search']._renderPointers(lastStep.low, lastStep.mid, lastStep.high);
            } else if (lastStep.type === 'BS_ELIMINATE') {
                AV['binary-search']._applyEliminated(lastStep.eliminated);
                AV['binary-search']._renderPointers(lastStep.newLow, -1, lastStep.newHigh);
            } else if (lastStep.type === 'JS_JUMP') {
                AV['jump-search']._applySkipped(lastStep.skipped);
                AV.highlightBars([lastStep.jumpPos], 'av-comparing');
            } else if (lastStep.type === 'JS_SCAN') {
                AV['jump-search']._applySkipped(lastStep.skipped);
                var jsBarsSM = document.querySelectorAll('.av-bar');
                for (var jsi = lastStep.blockStart; jsi < lastStep.index; jsi++) {
                    if (jsBarsSM[jsi]) jsBarsSM[jsi].classList.add('av-examined');
                }
                AV.highlightBars([lastStep.index], 'av-comparing');
            } else if (lastStep.type === 'FOUND') {
                if (lastStep.eliminated) {
                    AV['binary-search']._applyEliminated(lastStep.eliminated);
                } else if (lastStep.skipped) {
                    AV['jump-search']._applySkipped(lastStep.skipped);
                } else {
                    var barsF = document.querySelectorAll('.av-bar');
                    for (var fi = 0; fi < lastStep.index; fi++) {
                        if (barsF[fi]) barsF[fi].classList.add('av-examined');
                    }
                }
                AV.highlightBars([lastStep.index], 'av-sorted');
            }
        }

        AV.log('PASS', I18N.t('ui.log.step_mode_resume', { step: resumeFromIndex },
            'Step mode from step ' + resumeFromIndex));
    } else {
        /* Fresh start */
        AV.resetStats();
        AV.clearLog();
        AV.state.running = false;

        AV.stepMode.active = true;
        AV.stepMode.steps = steps;
        AV.stepMode.index = 0;
        AV.stepMode.options = options || {};
        AV.stepMode.arraySnapshots = snapshots;

        AV.log('REQUEST', options && options.requestLabel ? options.requestLabel : I18N.t('ui.log.step_mode_start', null, 'Step mode started'));
    }
    AV._updateStepButtons();
};

AV.stepForward = function() {
    var sm = AV.stepMode;
    if (!sm.active || sm.index >= sm.steps.length) return;

    var step = sm.steps[sm.index];
    var snapshot = sm.arraySnapshots[sm.index + 1];
    var isGraph = !!AV.state._graphData;

    if (isGraph) {
        AV._applyGraphSnapshot(snapshot);

        if (step.type === 'ENQUEUE') {
            if (step.pq) {
                AV.log('ENQUEUE', I18N.t('av.log.enqueue_dijkstra', { node: step.node, dist: step.dist === Infinity ? '\u221E' : step.dist }, 'Init ' + step.node + ' dist=' + (step.dist === Infinity ? '\u221E' : step.dist)));
            } else {
                AV.log('ENQUEUE', I18N.t('av.log.enqueue', { node: step.node, level: step.level, queue: step.queue.join(', ') }, 'Enqueue ' + step.node));
            }
        } else if (step.type === 'PUSH') {
            AV.log('PUSH', I18N.t('av.log.push', { node: step.node, depth: step.depth, stack: step.stack.join(', ') }, 'Push ' + step.node));
        } else if (step.type === 'DEQUEUE') {
            AV.state.comparisons++;
            if (step.pq) {
                AV.log('DEQUEUE', I18N.t('av.log.dequeue_dijkstra', { node: step.node, dist: step.dist, neighborCount: step.neighborCount }, 'Extract-min ' + step.node + ' (dist=' + step.dist + ')'));
            } else {
                AV.log('DEQUEUE', I18N.t('av.log.dequeue', { node: step.node, level: step.level, neighborCount: step.neighborCount, queue: step.queue.join(', ') }, 'Dequeue ' + step.node));
            }
        } else if (step.type === 'POP') {
            AV.state.comparisons++;
            AV.log('POP', I18N.t('av.log.pop', { node: step.node, depth: step.depth, neighborCount: step.neighborCount, stack: step.stack.join(', ') }, 'Pop ' + step.node));
        } else if (step.type === 'EXPLORE_EDGE') {
            AV.highlightEdge(step.from, step.to, 'av-edge-active');
            AV.state.swaps++;
            if (step.alreadyVisited) {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge_skip', { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ': skip'));
            } else if (step.relaxSkipped) {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge_no_relax', { from: step.from, to: step.to, newDist: step.newDist, currentDist: step.currentDist },
                    'Edge ' + step.from + '\u2192' + step.to + ': no improvement (' + step.newDist + ' \u2265 ' + step.currentDist + ')'));
            } else {
                var sfEdgeLogKey = step.action === 'push' ? 'av.log.explore_edge_push' : 'av.log.explore_edge';
                AV.log('EXPLORE_EDGE', I18N.t(sfEdgeLogKey, { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ': add'));
            }
        } else if (step.type === 'RELAX') {
            AV.highlightEdge(step.via, step.node, 'av-edge-relaxed');
            var sfOldD = (step.oldDist === Infinity || step.oldDist === 'Infinity') ? '\u221E' : step.oldDist;
            AV.log('RELAX', I18N.t('av.log.relax', { node: step.node, oldDist: sfOldD, newDist: step.newDist, via: step.via },
                'Relax ' + step.node + ': ' + sfOldD + ' \u2192 ' + step.newDist + ' via ' + step.via));
        } else if (step.type === 'VISIT') {
            if (step.pq) {
                AV.log('VISIT', I18N.t('av.log.visit_dijkstra', { node: step.node, dist: step.dist }, step.node + ' finalized (dist=' + step.dist + ')'));
            } else if (step.stack !== undefined) {
                AV.log('VISIT', I18N.t('av.log.visit_dfs', { node: step.node, depth: step.depth, stack: step.stack.join(', ') }, step.node + ' done'));
            } else {
                AV.log('VISIT', I18N.t('av.log.visit', { node: step.node, level: step.level, queue: step.queue.join(', ') }, step.node + ' done'));
            }
            if (snapshot.visitOrder && snapshot.visitOrder[step.node]) {
                AV._showVisitOrder(step.node, snapshot.visitOrder[step.node]);
            }
        } else if (step.type === 'COMPLETE') {
            if (AV.state._isTreeAlgorithm) {
                AV._removeInsertBanner();
                AV.log('COMPLETE', I18N.t('av.log.complete_tree', null, 'BST construction complete'));
            } else if (step.isDijkstra) {
                AV.log('COMPLETE', I18N.t('av.log.complete_dijkstra', { totalVisited: step.totalVisited, totalNodes: step.totalNodes }, 'Dijkstra complete: ' + step.totalVisited + '/' + step.totalNodes + ' nodes'));
            } else if (step.maxDepth !== undefined) {
                AV.log('COMPLETE', I18N.t('av.log.complete_dfs', { totalVisited: step.totalVisited, totalNodes: step.totalNodes, maxDepth: step.maxDepth }, 'DFS complete'));
            } else {
                AV.log('COMPLETE', I18N.t('av.log.complete', { totalVisited: step.totalVisited, totalNodes: step.totalNodes, maxLevel: step.maxLevel }, 'BFS complete'));
            }
        } else if (step.type === 'INSERT_START') {
            AV._renderInsertBanner(step.value);
            AV.log('INSERT', I18N.t('av.log.insert_start', { value: step.value }, 'Insert value ' + step.value));
        } else if (step.type === 'TREE_COMPARE') {
            AV.state.comparisons++;
            AV.log('TRAVERSE', I18N.t('av.log.tree_compare', { value: step.value, nodeValue: step.nodeValue },
                'Compare ' + step.value + ' with node ' + step.nodeValue));
        } else if (step.type === 'TREE_GO_LEFT' || step.type === 'TREE_GO_RIGHT') {
            var stepDir = step.type === 'TREE_GO_LEFT' ? 'left' : 'right';
            AV.log('TRAVERSE', I18N.t('av.log.tree_go', { value: step.value, direction: stepDir, fromNode: step.fromNode },
                'Go ' + stepDir + ' from ' + step.fromNode));
        } else if (step.type === 'TREE_PLACE') {
            if (step.parentNode !== null) {
                AV.highlightEdge(String(step.parentNode), String(step.value), 'av-edge-active');
            }
            AV.state.swaps++;
            AV.log('INSERT', I18N.t('av.log.tree_place', { value: step.value, parentNode: step.parentNode || 'none', direction: step.direction },
                'Place ' + step.value + (step.parentNode ? ' as ' + step.direction + ' of ' + step.parentNode : ' as root')));
        } else if (step.type === 'DP_CALL') {
            AV.state.comparisons++;
            var sfCallMsg = step.parentLabel
                ? I18N.t('av.log.dp_call_from', { n: step.label || step.node, parent: step.parentLabel, depth: step.depth },
                    step.parentLabel + ' needs ' + (step.label || step.node) + ': depth ' + step.depth)
                : I18N.t('av.log.dp_call_root', { n: step.label || step.node },
                    'Compute ' + (step.label || step.node) + ': begin recursion');
            AV.log('DP_CALL', sfCallMsg);
        } else if (step.type === 'DP_MEMO_HIT') {
            AV.state.swaps++;
            AV._setDpNodeText(step.node, step.label || step.node, step.value);
            var sfMemoMsg = step.parentLabel
                ? I18N.t('av.log.dp_memo_hit_from', { n: step.label || step.node, value: step.value, parent: step.parentLabel },
                    step.parentLabel + ' needs ' + (step.label || step.node) + ': ' + step.value + ' in cache')
                : I18N.t('av.log.dp_memo_hit', { n: step.label || step.node, value: step.value },
                    'Cache hit: ' + (step.label || step.node) + '=' + step.value + ' \u2014 skip subtree');
            AV.log('DP_MEMO', sfMemoMsg);
        } else if (step.type === 'DP_RETURN') {
            AV._setDpNodeText(step.node, step.label || step.node, step.value);
            var sfRetMsg = step.formula
                ? I18N.t('av.log.dp_return_formula', { n: step.label || step.node, value: step.value, formula: step.formula },
                    'Return ' + (step.label || step.node) + ' = ' + step.formula + ' = ' + step.value + ', store')
                : I18N.t('av.log.dp_return_base', { n: step.label || step.node, value: step.value },
                    'Return ' + (step.label || step.node) + '=' + step.value + ' (base), store');
            AV.log('DP_RETURN', sfRetMsg);
        }

        AV.updateStats();
        sm.index++;
        AV._updateStepButtons();
        return;
    }

    var isString = !!AV.state._isStringAlgorithm;
    if (isString) {
        AV._applyStringSnapshot(snapshot);
        if (step.type === 'STR_COMPARE') {
            var stCells = document.querySelectorAll('#av-str-text .av-str-cell');
            var spCells = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            if (stCells[step.textIndex]) stCells[step.textIndex].classList.add('av-str-comparing');
            if (spCells[step.patternIndex]) spCells[step.patternIndex].classList.add('av-str-comparing');
            AV.state.comparisons++;
            AV.log('STR_COMPARE', I18N.t('av.log.str_compare',
                { ti: step.textIndex, tc: step.textChar, pi: step.patternIndex, pc: step.patternChar },
                'Compare text[' + step.textIndex + ']=\u201C' + step.textChar + '\u201D vs pattern[' + step.patternIndex + ']=\u201C' + step.patternChar + '\u201D'));
        } else if (step.type === 'STR_MATCH_CHAR') {
            var stCells2 = document.querySelectorAll('#av-str-text .av-str-cell');
            var spCells2 = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            for (var smi2 = 0; smi2 <= step.patternIndex; smi2++) {
                if (stCells2[step.offset + smi2]) stCells2[step.offset + smi2].classList.add('av-str-match');
                if (spCells2[smi2]) spCells2[smi2].classList.add('av-str-match');
            }
            var sfMatched = step.matched || (step.patternIndex + 1);
            var sfTotal = (AV.state._pattern || '').length;
            AV.log('STR_MATCH_CHAR', I18N.t('av.log.str_match_char',
                { tc: step.textChar, ti: step.textIndex, pi: step.patternIndex, matched: sfMatched, total: sfTotal },
                'Match at [' + step.textIndex + ']: \u201C' + step.textChar + '\u201D \u2014 ' + sfMatched + '/' + sfTotal));
        } else if (step.type === 'STR_MISMATCH') {
            var stCells3 = document.querySelectorAll('#av-str-text .av-str-cell');
            var spCells3 = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            if (stCells3[step.textIndex]) stCells3[step.textIndex].classList.add('av-str-mismatch');
            if (spCells3[step.patternIndex]) spCells3[step.patternIndex].classList.add('av-str-mismatch');
            if (step.patternIndex === 0) {
                AV.log('STR_MISMATCH', I18N.t('av.log.str_mismatch_start',
                    { ti: step.textIndex, tc: step.textChar, pc: step.patternChar },
                    'Mismatch at text[' + step.textIndex + ']: advance text'));
            } else {
                AV.log('STR_MISMATCH', I18N.t('av.log.str_mismatch',
                    { tc: step.textChar, ti: step.textIndex, pi: step.patternIndex, pc: step.patternChar, lps: step.lpsValue, lpsIdx: step.lpsIdx !== undefined ? step.lpsIdx : step.patternIndex - 1 },
                    'Mismatch text[' + step.textIndex + ']: LPS=' + step.lpsValue + ', keep ' + step.lpsValue));
            }
        } else if (step.type === 'STR_SHIFT') {
            var sfSkipped = step.skipped !== undefined ? step.skipped : (step.newOffset - step.oldOffset);
            AV.log('STR_SHIFT', I18N.t('av.log.str_shift',
                { from: step.oldOffset, to: step.newOffset, lps: step.lpsValue, skipped: sfSkipped },
                'Shift +' + sfSkipped + ' (' + step.oldOffset + '\u2192' + step.newOffset + ')'));
        } else if (step.type === 'STR_FOUND') {
            var stCells4 = document.querySelectorAll('#av-str-text .av-str-cell');
            var spCells4 = document.querySelectorAll('#av-str-pattern .av-str-cell:not(.av-str-empty)');
            for (var sfi2 = 0; sfi2 < AV.state._pattern.length; sfi2++) {
                if (stCells4[step.position + sfi2]) stCells4[step.position + sfi2].classList.add('av-str-found');
                if (spCells4[sfi2]) spCells4[sfi2].classList.add('av-str-found');
            }
            AV.state.swaps++;
            var sfMatchEnd = step.matchEnd !== undefined ? step.matchEnd : (step.position + (AV.state._pattern || '').length - 1);
            AV.log('STR_FOUND', I18N.t('av.log.str_found',
                { position: step.position, matchEnd: sfMatchEnd },
                'Pattern found at text[' + step.position + '..' + sfMatchEnd + ']!'));
        } else if (step.type === 'STR_LPS_SET') {
            var lpsCellSF = document.querySelector('.av-str-lps-cell[data-lindex="' + step.index + '"]');
            if (lpsCellSF) {
                lpsCellSF.classList.add('av-str-lps-set');
            }
            var sfLpsKey, sfLpsParams, sfLpsFb;
            if (step.index === 0) {
                sfLpsKey = 'av.log.str_lps_set_base';
                sfLpsParams = { index: 0 };
                sfLpsFb = 'LPS[0]=0: no proper prefix';
            } else if (step.value === 0) {
                sfLpsKey = 'av.log.str_lps_set_zero';
                sfLpsParams = { index: step.index, char: step.char };
                sfLpsFb = 'LPS[' + step.index + ']=0: no prefix=suffix';
            } else {
                sfLpsKey = 'av.log.str_lps_set';
                sfLpsParams = { index: step.index, value: step.value, char: step.char, prefix: step.prefix || '' };
                sfLpsFb = 'LPS[' + step.index + ']=' + step.value + ': \u201C' + (step.prefix || '') + '\u201D';
            }
            AV.log('STR_LPS_SET', I18N.t(sfLpsKey, sfLpsParams, sfLpsFb));
        } else if (step.type === 'DONE') {
            AV.log('DONE', I18N.t('av.log.done_step', null, 'Search complete'));
        }
        AV.updateStats();
        sm.index++;
        AV._updateStepButtons();
        return;
    }

    var isHash = !!AV.state._isHashAlgorithm;
    if (isHash) {
        AV._applyHashSnapshot(snapshot);
        if (step.type === 'HASH_COMPUTE') {
            AV.state.comparisons++;
            AV.log('HASH_COMPUTE', I18N.t('av.log.hash_compute',
                { key: step.key, hash: step.hashValue, size: step.tableSize, sum: step.charCodeSum },
                'h("' + step.key + '") = (' + step.charCodeSum + ') mod ' + step.tableSize + ' = ' + step.hashValue));
        } else if (step.type === 'HASH_CHECK_SLOT') {
            var hcsSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hcsSf) hcsSf.classList.add('av-hash-checking');
            if (step.chainPos !== undefined && hcsSf) {
                var hcsN = hcsSf.querySelectorAll('.av-hash-chain-node')[step.chainPos];
                if (hcsN) hcsN.classList.add('av-hash-checking');
            }
            AV.log('HASH_CHECK', 'Check bucket[' + step.index + ']: ' + (step.isEmpty ? 'empty' : 'occupied'));
        } else if (step.type === 'HASH_INSERT') {
            var hisSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hisSf) hisSf.classList.add('av-hash-inserting');
            AV.state.swaps++;
            AV.log('HASH_INSERT', 'Insert "' + step.key + '" into bucket[' + step.index + ']');
        } else if (step.type === 'HASH_COLLISION') {
            var hcolSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hcolSf) hcolSf.classList.add('av-hash-collision');
            AV.state.comparisons++;
            AV.log('HASH_COLLISION', 'Collision at bucket[' + step.index + ']');
        } else if (step.type === 'HASH_CHAIN_ADD') {
            var hcaSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hcaSf) hcaSf.classList.add('av-hash-inserting');
            AV.state.swaps++;
            AV.log('HASH_CHAIN', 'Chain "' + step.key + '" to bucket[' + step.index + ']');
        } else if (step.type === 'HASH_PROBE') {
            var hpFSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.fromIndex + '"]');
            var hpTSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.toIndex + '"]');
            if (hpFSf) hpFSf.classList.add('av-hash-probing');
            if (hpTSf) hpTSf.classList.add('av-hash-checking');
            AV.log('HASH_PROBE', 'Probe #' + step.probeNumber + ': bucket[' + step.fromIndex + '] \u2192 bucket[' + step.toIndex + ']');
        } else if (step.type === 'HASH_FOUND') {
            var hfSf = document.querySelector('.av-hash-bucket-slot[data-slot="' + step.index + '"]');
            if (hfSf) hfSf.classList.add('av-hash-found');
            AV.log('HASH_FOUND', 'Found "' + step.key + '" in bucket[' + step.index + ']');
        } else if (step.type === 'HASH_NOT_FOUND') {
            document.querySelectorAll('.av-hash-bucket-slot').forEach(function(s) { s.classList.add('av-hash-not-found'); });
            AV.log('HASH_NOT_FOUND', 'Value "' + step.key + '" not found');
        } else if (step.type === 'DONE') {
            AV.log('DONE', I18N.t('av.log.done_step', null, 'Hash table operation complete'));
        }
        AV.updateStats();
        sm.index++;
        AV._updateStepButtons();
        return;
    }

    AV.renderArray(snapshot.arr);
    snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

    /* Re-inject target line for search algorithms after renderArray */
    if (AV.state._searchTarget !== undefined) {
        var searchAlgo = AV[AV.state.algorithm];
        if (searchAlgo && searchAlgo._injectTargetLine) {
            searchAlgo._injectTargetLine(snapshot.arr, AV.state._searchTarget);
        }
    }

    if (step.type === 'COMPARE') {
        AV.highlightBars(step.indices, 'av-comparing');
        AV.state.comparisons++;
        AV.log('COMPARE', 'Compare arr[' + step.indices[0] + ']=' + step.values[0] + ' with arr[' + step.indices[1] + ']=' + step.values[1]);
    } else if (step.type === 'SWAP') {
        AV.highlightBars(step.indices, 'av-swapping');
        AV.state.swaps++;
        AV.log('SWAP', 'Swap arr[' + step.indices[0] + ']=' + step.values[0] + ' \u2194 arr[' + step.indices[1] + ']=' + step.values[1]);
    } else if (step.type === 'OVERWRITE') {
        AV.highlightBars([step.index], 'av-swapping');
        AV.state.swaps++;
        AV.log('OVERWRITE', I18N.t('av.log.overwrite', { index: step.index, value: step.value },
            'Place ' + step.value + ' at position ' + step.index));
    } else if (step.type === 'SCAN') {
        var bars = document.querySelectorAll('.av-bar');
        for (var ei = 0; ei < step.index; ei++) {
            if (bars[ei]) bars[ei].classList.add('av-examined');
        }
        AV.highlightBars([step.index], 'av-comparing');
        AV.state.comparisons++;
        AV.log('SCAN', 'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target);
    } else if (step.type === 'BS_CHECK') {
        AV['binary-search']._applyEliminated(step.eliminated);
        AV.highlightBars([step.mid], 'av-comparing');
        AV['binary-search']._renderPointers(step.low, step.mid, step.high);
        AV.state.comparisons++;
        AV.log('BS_CHECK', 'Check arr[' + step.mid + ']=' + step.value + ' vs target=' + step.target);
    } else if (step.type === 'BS_ELIMINATE') {
        AV['binary-search']._applyEliminated(step.eliminated);
        AV['binary-search']._renderPointers(step.newLow, -1, step.newHigh);
        AV.log('BS_ELIMINATE', 'Eliminate ' + step.direction + ' half, range [' + step.newLow + '..' + step.newHigh + ']');
    } else if (step.type === 'JS_JUMP') {
        AV['jump-search']._applySkipped(step.skipped);
        AV.highlightBars([step.jumpPos], 'av-comparing');
        AV.state.comparisons++;
        AV.log('JS_JUMP', 'Jump to arr[' + step.jumpPos + ']=' + step.value + ' vs target=' + step.target);
    } else if (step.type === 'JS_SCAN') {
        AV['jump-search']._applySkipped(step.skipped);
        var jsBars = document.querySelectorAll('.av-bar');
        for (var jsi = step.blockStart; jsi < step.index; jsi++) {
            if (jsBars[jsi]) jsBars[jsi].classList.add('av-examined');
        }
        AV.highlightBars([step.index], 'av-comparing');
        AV.state.comparisons++;
        AV.log('JS_SCAN', 'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target);
    } else if (step.type === 'FOUND') {
        if (step.eliminated) {
            AV['binary-search']._applyEliminated(step.eliminated);
        } else if (step.skipped) {
            AV['jump-search']._applySkipped(step.skipped);
        } else {
            var barsF = document.querySelectorAll('.av-bar');
            for (var fi = 0; fi < step.index; fi++) {
                if (barsF[fi]) barsF[fi].classList.add('av-examined');
            }
        }
        AV.highlightBars([step.index], 'av-sorted');
        AV.log('FOUND', 'Found ' + step.value + ' at index ' + step.index);
    } else if (step.type === 'SORTED') {
        AV.log('SORTED', 'Position ' + step.index + ' is sorted');
    } else if (step.type === 'PASS') {
        AV.log('PASS', 'Pass ' + step.pass);
    } else if (step.type === 'DP_BASE') {
        AV.highlightBars([step.index], 'av-base-case');
        AV.state.comparisons++;
        AV.log('DP_BASE', I18N.t('av.log.dp_base', { index: step.index, value: step.value },
            'Base case: F(' + step.index + ') = ' + step.value));
    } else if (step.type === 'DP_READ') {
        AV.highlightBars(step.indices, 'av-reading');
        AV.log('DP_READ', I18N.t('av.log.dp_read', { i1: step.indices[0], v1: step.values[0], i2: step.indices[1], v2: step.values[1], computing: step.computing },
            'To compute F(' + step.computing + '): read F(' + step.indices[0] + ')=' + step.values[0] + ', F(' + step.indices[1] + ')=' + step.values[1]));
    } else if (step.type === 'DP_FILL') {
        AV.highlightBars([step.index], 'av-computing');
        AV.state.comparisons++;
        AV.log('DP_FILL', I18N.t('av.log.dp_fill', { index: step.index, value: step.value, formula: step.formula, i1: step.i1, v1: step.v1, i2: step.i2, v2: step.v2 },
            'F(' + step.index + ') = F(' + step.i1 + ')+F(' + step.i2 + ') = ' + step.v1 + '+' + step.v2 + ' = ' + step.value));
    } else if (step.type === 'DP_RESULT') {
        AV.highlightBars([step.index], 'av-result');
        AV.log('DP_RESULT', I18N.t('av.log.dp_result', { n: step.index, value: step.value },
            'Answer: F(' + step.index + ') = ' + step.value));
    } else if (step.type === 'DONE') {
        if (step.found === false) {
            document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-examined'); });
            AV.log('DONE', I18N.t('av.log.not_found', null, 'Target not found'));
        } else if (AV.state._searchTarget !== undefined) {
            AV.log('DONE', I18N.t('av.log.done_step', null, 'Search complete'));
        } else {
            AV.log('DONE', I18N.t('av.log.done_step', null, 'Sorting complete'));
        }
    }

    AV.updateStats();
    sm.index++;
    AV._updateStepButtons();

    /* Auto-advance past non-visual steps (PASS) so each click shows a bar change */
    if (step.type === 'PASS' && sm.index < sm.steps.length) {
        AV.stepForward();
    }
};

AV.stepBack = function() {
    var sm = AV.stepMode;
    if (!sm.active || sm.index <= 0) return;

    sm.index--;
    var snapshot = sm.arraySnapshots[sm.index];
    var isGraph = !!AV.state._graphData;

    if (isGraph) {
        /* Recompute stats for graph */
        var nodesVisited = 0;
        var edgesExplored = 0;
        for (var gi = 0; gi < sm.index; gi++) {
            if (sm.steps[gi].type === 'DEQUEUE' || sm.steps[gi].type === 'TREE_COMPARE' || sm.steps[gi].type === 'DP_CALL') nodesVisited++;
            if (sm.steps[gi].type === 'EXPLORE_EDGE' || sm.steps[gi].type === 'TREE_PLACE' || sm.steps[gi].type === 'DP_MEMO_HIT') edgesExplored++;
        }
        AV.state.comparisons = nodesVisited;
        AV.state.swaps = edgesExplored;
        AV.updateStats();
        AV._applyGraphSnapshot(snapshot);
        AV._updateStepButtons();
        return;
    }

    var isStringBack = !!AV.state._isStringAlgorithm;
    if (isStringBack) {
        AV.state.comparisons = snapshot.comparisons;
        AV.state.swaps = snapshot.matches;
        AV.updateStats();
        AV._applyStringSnapshot(snapshot);
        AV._updateStepButtons();
        return;
    }

    var isHashBack = !!AV.state._isHashAlgorithm;
    if (isHashBack) {
        AV.state.comparisons = snapshot.operations;
        AV.state.swaps = snapshot.collisions;
        AV.updateStats();
        AV._applyHashSnapshot(snapshot);
        AV._updateStepButtons();
        return;
    }

    var comparisons = 0;
    var swaps = 0;
    for (var i = 0; i < sm.index; i++) {
        if (sm.steps[i].type === 'COMPARE' || sm.steps[i].type === 'SCAN' || sm.steps[i].type === 'BS_CHECK' || sm.steps[i].type === 'JS_JUMP' || sm.steps[i].type === 'JS_SCAN' || sm.steps[i].type === 'DP_BASE' || sm.steps[i].type === 'DP_FILL') comparisons++;
        if (sm.steps[i].type === 'SWAP') swaps++;
    }
    AV.state.comparisons = comparisons;
    AV.state.swaps = swaps;
    AV.updateStats();

    AV.renderArray(snapshot.arr);
    snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

    /* Re-inject target line for search algorithms after renderArray */
    if (AV.state._searchTarget !== undefined) {
        var searchAlgo = AV[AV.state.algorithm];
        if (searchAlgo && searchAlgo._injectTargetLine) {
            searchAlgo._injectTargetLine(snapshot.arr, AV.state._searchTarget);
        }
    }

    if (sm.index > 0) {
        var prevStep = sm.steps[sm.index - 1];
        if (prevStep.type === 'COMPARE') AV.highlightBars(prevStep.indices, 'av-comparing');
        else if (prevStep.type === 'SWAP') AV.highlightBars(prevStep.indices, 'av-swapping');
        else if (prevStep.type === 'SCAN') {
            var bars = document.querySelectorAll('.av-bar');
            for (var ei = 0; ei < prevStep.index; ei++) {
                if (bars[ei]) bars[ei].classList.add('av-examined');
            }
            AV.highlightBars([prevStep.index], 'av-comparing');
        } else if (prevStep.type === 'BS_CHECK') {
            AV['binary-search']._applyEliminated(prevStep.eliminated);
            AV.highlightBars([prevStep.mid], 'av-comparing');
            AV['binary-search']._renderPointers(prevStep.low, prevStep.mid, prevStep.high);
        } else if (prevStep.type === 'BS_ELIMINATE') {
            AV['binary-search']._applyEliminated(prevStep.eliminated);
            AV['binary-search']._renderPointers(prevStep.newLow, -1, prevStep.newHigh);
        } else if (prevStep.type === 'JS_JUMP') {
            AV['jump-search']._applySkipped(prevStep.skipped);
            AV.highlightBars([prevStep.jumpPos], 'av-comparing');
        } else if (prevStep.type === 'JS_SCAN') {
            AV['jump-search']._applySkipped(prevStep.skipped);
            var jsBarsBack = document.querySelectorAll('.av-bar');
            for (var jsi = prevStep.blockStart; jsi < prevStep.index; jsi++) {
                if (jsBarsBack[jsi]) jsBarsBack[jsi].classList.add('av-examined');
            }
            AV.highlightBars([prevStep.index], 'av-comparing');
        } else if (prevStep.type === 'FOUND') {
            if (prevStep.eliminated) {
                AV['binary-search']._applyEliminated(prevStep.eliminated);
            } else if (prevStep.skipped) {
                AV['jump-search']._applySkipped(prevStep.skipped);
            } else {
                var barsF = document.querySelectorAll('.av-bar');
                for (var fi = 0; fi < prevStep.index; fi++) {
                    if (barsF[fi]) barsF[fi].classList.add('av-examined');
                }
            }
            AV.highlightBars([prevStep.index], 'av-sorted');
        }
    }

    AV._updateStepButtons();
};

AV.exitStepMode = function() {
    AV.stepMode.active = false;
    AV.stepMode.steps = null;
    AV.stepMode.index = 0;
    AV.stepMode.arraySnapshots = null;
    AV._updateStepButtons();
};

AV.switchToStepMode = function() {
    if (!AV.state.running || !AV.state.paused) return;

    var steps = AV.state._flowSteps;
    var options = AV.state._flowOptions || {};
    var currentIndex = AV.state.stepIndex + 1;
    var savedComparisons = AV.state.comparisons;
    var savedSwaps = AV.state.swaps;

    /* Stop the running animation */
    AV.state._flowSteps = null;
    AV.state._flowOptions = null;
    AV.state.running = false;
    AV.resume();

    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }

    if (steps) {
        AV.startStepMode(steps, options, AV.state._initialArray, currentIndex);
        /* Restore stats from animation */
        AV.state.comparisons = savedComparisons;
        AV.state.swaps = savedSwaps;
        AV.updateStats();
    }
};

AV._updateStepButtons = function() {
    var sm = AV.stepMode;
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
