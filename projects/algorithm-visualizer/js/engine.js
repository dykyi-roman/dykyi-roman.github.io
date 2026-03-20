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
    var maxVal = Math.max.apply(null, arr);
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
        bar.classList.remove('av-comparing', 'av-swapping', 'av-examined');
    });
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

AV.highlightEdge = function(from, to, className) {
    var edge = document.querySelector('.av-edge[data-from="' + from + '"][data-to="' + to + '"]') ||
               document.querySelector('.av-edge[data-from="' + to + '"][data-to="' + from + '"]');
    if (edge) edge.setAttribute('class', 'av-edge ' + className);
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
        'bst-operations': { accent: '#F59E0B', bg: '#1a1508', light: '#2d2210' }
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
    AV.state.running = true;

    var opts = options || {};
    AV.log('REQUEST', opts.requestLabel || I18N.t('av.log.started', null, 'Algorithm started'));
    var startTime = performance.now();

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
        } else if (step.type === 'FOUND') {
            AV.clearHighlights();
            var barsF = document.querySelectorAll('.av-bar');
            for (var fi = 0; fi < step.index; fi++) {
                if (barsF[fi]) barsF[fi].classList.add('av-examined');
            }
            AV.highlightBars([step.index], 'av-sorted');
            AV.log('FOUND', I18N.t('av.log.found', { index: step.index, value: step.value },
                'Found ' + step.value + ' at index ' + step.index));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'ENQUEUE') {
            AV.setNodeState(step.node, 'queued');
            AV.renderQueue(step.queue);
            AV.log('ENQUEUE', I18N.t('av.log.enqueue', { node: step.node }, 'Enqueue node ' + step.node));
            await AV.sleep(AV.state.stepDelay * 0.6);
        } else if (step.type === 'DEQUEUE') {
            AV.setNodeState(step.node, 'visiting');
            AV.renderQueue(step.queue);
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('DEQUEUE', I18N.t('av.log.dequeue', { node: step.node }, 'Dequeue node ' + step.node));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'EXPLORE_EDGE') {
            AV.highlightEdge(step.from, step.to, 'av-edge-active');
            AV.state.swaps++;
            AV.updateStats();
            if (step.alreadyVisited) {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge_skip', { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ' (already visited)'));
            } else {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge', { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ' (new)'));
            }
            await AV.sleep(AV.state.stepDelay * 0.5);
            AV.highlightEdge(step.from, step.to, 'av-edge-traversed');
        } else if (step.type === 'VISIT') {
            AV.setNodeState(step.node, 'visited');
            AV.renderQueue(step.queue);
            AV.log('VISIT', I18N.t('av.log.visit', { node: step.node }, 'Node ' + step.node + ' fully processed'));
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
            } else {
                AV.renderQueue([]);
                AV.log('COMPLETE', I18N.t('av.log.complete', null, 'BFS traversal complete'));
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
        } else if (step.type === 'DONE') {
            AV.clearHighlights();
            if (step.found === false) {
                document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-examined'); });
            } else {
                document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-sorted'); });
            }
        }
    }

    var elapsed = Math.round(performance.now() - startTime);
    if (AV.state.running) {
        if (AV.state._isTreeAlgorithm) {
            AV.log('DONE', I18N.t('av.log.done_tree', { time: elapsed, comparisons: AV.state.comparisons, inserted: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons, ' + AV.state.swaps + ' nodes inserted)'));
        } else if (AV.state._graphData) {
            AV.log('DONE', I18N.t('av.log.done_graph', { time: elapsed, nodes: AV.state.comparisons, edges: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' nodes, ' + AV.state.swaps + ' edges)'));
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
    var snapshots = [{ nodeStates: {}, queue: [], edgeStates: {} }];

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.type === 'ENQUEUE') {
            nodeStates[step.node] = 'queued';
            queue = step.queue.slice();
        } else if (step.type === 'DEQUEUE') {
            nodeStates[step.node] = 'visiting';
            queue = step.queue.slice();
        } else if (step.type === 'EXPLORE_EDGE') {
            var eKey = step.from + '-' + step.to;
            edgeStates[eKey] = 'traversed';
        } else if (step.type === 'VISIT') {
            nodeStates[step.node] = 'visited';
            queue = step.queue.slice();
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
        }
        var ns = {};
        Object.keys(nodeStates).forEach(function(k) { ns[k] = nodeStates[k]; });
        var es = {};
        Object.keys(edgeStates).forEach(function(k) { es[k] = edgeStates[k]; });
        snapshots.push({ nodeStates: ns, queue: queue.slice(), edgeStates: es });
    }
    return snapshots;
};

AV._applyGraphSnapshot = function(snapshot) {
    var isTree = AV.state._isTreeAlgorithm;
    /* Reset all nodes */
    document.querySelectorAll('.av-node').forEach(function(n) {
        n.className.baseVal = isTree ? 'av-node av-node-pending' : 'av-node av-node-unvisited';
    });
    /* Reset all edges */
    document.querySelectorAll('.av-edge').forEach(function(e) {
        e.setAttribute('class', isTree ? 'av-edge av-edge-pending' : 'av-edge');
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
    /* Apply queue (BFS only) */
    if (!isTree) {
        AV.renderQueue(snapshot.queue);
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
        } else if (step.type === 'SORTED') {
            sorted = sorted.concat([step.index]);
        } else if (step.type === 'FOUND') {
            sorted = sorted.concat([step.index]);
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

AV.startStepMode = function(steps, options, initialArray, resumeFromIndex) {
    var isGraph = !!AV.state._graphData;
    var snapshots = isGraph ? AV._computeGraphSnapshots(steps) : AV._computeSnapshots(initialArray, steps);

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
        } else {
            AV.renderArray(snapshot.arr);
            snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });
        }

        /* Re-inject target line for search algorithms after renderArray */
        if (AV.state._searchTarget !== undefined && AV['linear-search'] && AV['linear-search']._injectTargetLine) {
            AV['linear-search']._injectTargetLine(snapshot.arr, AV.state._searchTarget);
        }

        /* Restore highlight from the last executed step */
        if (resumeFromIndex > 0 && !isGraph) {
            var lastStep = steps[resumeFromIndex - 1];
            if (lastStep.type === 'COMPARE') AV.highlightBars(lastStep.indices, 'av-comparing');
            else if (lastStep.type === 'SWAP') AV.highlightBars(lastStep.indices, 'av-swapping');
            else if (lastStep.type === 'SCAN') {
                var bars = document.querySelectorAll('.av-bar');
                for (var ei = 0; ei < lastStep.index; ei++) {
                    if (bars[ei]) bars[ei].classList.add('av-examined');
                }
                AV.highlightBars([lastStep.index], 'av-comparing');
            } else if (lastStep.type === 'FOUND') {
                var barsF = document.querySelectorAll('.av-bar');
                for (var fi = 0; fi < lastStep.index; fi++) {
                    if (barsF[fi]) barsF[fi].classList.add('av-examined');
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
            AV.log('ENQUEUE', I18N.t('av.log.enqueue', { node: step.node }, 'Enqueue node ' + step.node));
        } else if (step.type === 'DEQUEUE') {
            AV.state.comparisons++;
            AV.log('DEQUEUE', I18N.t('av.log.dequeue', { node: step.node }, 'Dequeue node ' + step.node));
        } else if (step.type === 'EXPLORE_EDGE') {
            AV.highlightEdge(step.from, step.to, 'av-edge-active');
            AV.state.swaps++;
            if (step.alreadyVisited) {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge_skip', { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ' (already visited)'));
            } else {
                AV.log('EXPLORE_EDGE', I18N.t('av.log.explore_edge', { from: step.from, to: step.to }, 'Edge ' + step.from + '\u2192' + step.to + ' (new)'));
            }
        } else if (step.type === 'VISIT') {
            AV.log('VISIT', I18N.t('av.log.visit', { node: step.node }, 'Node ' + step.node + ' fully processed'));
        } else if (step.type === 'COMPLETE') {
            if (AV.state._isTreeAlgorithm) {
                AV._removeInsertBanner();
                AV.log('COMPLETE', I18N.t('av.log.complete_tree', null, 'BST construction complete'));
            } else {
                AV.log('COMPLETE', I18N.t('av.log.complete', null, 'BFS traversal complete'));
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
        }

        AV.updateStats();
        sm.index++;
        AV._updateStepButtons();
        return;
    }

    AV.renderArray(snapshot.arr);
    snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

    /* Re-inject target line for search algorithms after renderArray */
    if (AV.state._searchTarget !== undefined && AV['linear-search'] && AV['linear-search']._injectTargetLine) {
        AV['linear-search']._injectTargetLine(snapshot.arr, AV.state._searchTarget);
    }

    if (step.type === 'COMPARE') {
        AV.highlightBars(step.indices, 'av-comparing');
        AV.state.comparisons++;
        AV.log('COMPARE', 'Compare arr[' + step.indices[0] + ']=' + step.values[0] + ' with arr[' + step.indices[1] + ']=' + step.values[1]);
    } else if (step.type === 'SWAP') {
        AV.highlightBars(step.indices, 'av-swapping');
        AV.state.swaps++;
        AV.log('SWAP', 'Swap arr[' + step.indices[0] + ']=' + step.values[0] + ' \u2194 arr[' + step.indices[1] + ']=' + step.values[1]);
    } else if (step.type === 'SCAN') {
        var bars = document.querySelectorAll('.av-bar');
        for (var ei = 0; ei < step.index; ei++) {
            if (bars[ei]) bars[ei].classList.add('av-examined');
        }
        AV.highlightBars([step.index], 'av-comparing');
        AV.state.comparisons++;
        AV.log('SCAN', 'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target);
    } else if (step.type === 'FOUND') {
        var barsF = document.querySelectorAll('.av-bar');
        for (var fi = 0; fi < step.index; fi++) {
            if (barsF[fi]) barsF[fi].classList.add('av-examined');
        }
        AV.highlightBars([step.index], 'av-sorted');
        AV.log('FOUND', 'Found ' + step.value + ' at index ' + step.index);
    } else if (step.type === 'SORTED') {
        AV.log('SORTED', 'Position ' + step.index + ' is sorted');
    } else if (step.type === 'PASS') {
        AV.log('PASS', 'Pass ' + step.pass);
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
            if (sm.steps[gi].type === 'DEQUEUE' || sm.steps[gi].type === 'TREE_COMPARE') nodesVisited++;
            if (sm.steps[gi].type === 'EXPLORE_EDGE' || sm.steps[gi].type === 'TREE_PLACE') edgesExplored++;
        }
        AV.state.comparisons = nodesVisited;
        AV.state.swaps = edgesExplored;
        AV.updateStats();
        AV._applyGraphSnapshot(snapshot);
        AV._updateStepButtons();
        return;
    }

    var comparisons = 0;
    var swaps = 0;
    for (var i = 0; i < sm.index; i++) {
        if (sm.steps[i].type === 'COMPARE' || sm.steps[i].type === 'SCAN') comparisons++;
        if (sm.steps[i].type === 'SWAP') swaps++;
    }
    AV.state.comparisons = comparisons;
    AV.state.swaps = swaps;
    AV.updateStats();

    AV.renderArray(snapshot.arr);
    snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

    /* Re-inject target line for search algorithms after renderArray */
    if (AV.state._searchTarget !== undefined && AV['linear-search'] && AV['linear-search']._injectTargetLine) {
        AV['linear-search']._injectTargetLine(snapshot.arr, AV.state._searchTarget);
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
        } else if (prevStep.type === 'FOUND') {
            var barsF = document.querySelectorAll('.av-bar');
            for (var fi = 0; fi < prevStep.index; fi++) {
                if (barsF[fi]) barsF[fi].classList.add('av-examined');
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
    var currentIndex = AV.state.stepIndex;
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
