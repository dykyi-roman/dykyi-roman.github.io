/* ===== Database Index Visualizer Engine ===== */

const DBIV = window.DBIV || {};
window.DBIV = DBIV;

DBIV.state = {
    db: 'mysql',
    mode: null,
    paused: false,
    simulateError: false,
    queryId: 0,
    pagesRead: 0,
    rowsExamined: 0,
    indexLookups: 0,
    queryTime: 0,
    comparisonMode: false,
    animations: [],
    deliveryQueue: [],
};

/* ===== Pause / Resume Delivery Queue ===== */
DBIV.onResume = null;

DBIV.enqueueDelivery = function(fn) {
    DBIV.state.deliveryQueue.push(fn);
};

DBIV.flushDeliveryQueue = async function() {
    while (DBIV.state.deliveryQueue.length > 0) {
        const fn = DBIV.state.deliveryQueue.shift();
        await fn();
        await DBIV.sleep(150);
    }
    if (DBIV.onResume) DBIV.onResume();
};

/* ===== Event Log ===== */
DBIV.log = function(type, text) {
    const logEl = document.getElementById('event-log');
    if (!logEl) return;
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = ts;

    const typeSpan = document.createElement('span');
    typeSpan.className = 'log-type ' + type;
    typeSpan.textContent = type;

    const textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(typeSpan);
    entry.appendChild(textSpan);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

DBIV.clearLog = function() {
    const logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

/* ===== Stats ===== */
DBIV.updateStats = function() {
    const s = DBIV.state;
    document.getElementById('stat-pages').textContent = s.pagesRead;
    document.getElementById('stat-rows').textContent = s.rowsExamined;
    document.getElementById('stat-lookups').textContent = s.indexLookups;
    document.getElementById('stat-time').textContent = s.queryTime + ' ms';
};

DBIV.resetStats = function() {
    const s = DBIV.state;
    s.pagesRead = 0;
    s.rowsExamined = 0;
    s.indexLookups = 0;
    s.queryTime = 0;
    s.queryId = 0;
    s.deliveryQueue = [];
    DBIV.updateStats();
};

DBIV.addStats = function(pages, rows, lookups, time) {
    DBIV.state.pagesRead += pages;
    DBIV.state.rowsExamined += rows;
    DBIV.state.indexLookups += lookups;
    DBIV.state.queryTime += time;
    DBIV.updateStats();
};

/* ===== Animation Engine ===== */
DBIV.getPortCenter = function(el) {
    const vizArea = document.getElementById('viz-area');
    if (!el || !vizArea) return { x: 0, y: 0 };
    const elRect = el.getBoundingClientRect();
    const areaRect = vizArea.getBoundingClientRect();
    return {
        x: elRect.left + elRect.width / 2 - areaRect.left,
        y: elRect.top + elRect.height / 2 - areaRect.top
    };
};

DBIV._ensureSvgLayer = function() {
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

DBIV._buildBezierPath = function(from, to) {
    const cpx1 = from.x + (to.x - from.x) * 0.3;
    const cpy1 = from.y - 30;
    const cpx2 = from.x + (to.x - from.x) * 0.7;
    const cpy2 = to.y - 30;
    return { cpx1, cpy1, cpx2, cpy2, d: `M${from.x},${from.y} C${cpx1},${cpy1} ${cpx2},${cpy2} ${to.x},${to.y}` };
};

DBIV.animateDot = function(fromEl, toEl, options = {}) {
    const { duration = 500, onArrive = null } = options;
    return new Promise(resolve => {
        setTimeout(() => {
            if (onArrive) onArrive();
            resolve();
        }, Math.round(duration * 0.4));
    });
};

/* ===== Tree Traversal Animation ===== */
DBIV.animateTreeTraversal = async function(nodeEls, options = {}) {
    const { stepDelay = 400, fadeOthers = true } = options;
    const allNodes = document.querySelectorAll('.tree-node');

    for (let i = 0; i < nodeEls.length; i++) {
        const node = nodeEls[i];
        if (!node) continue;

        if (fadeOthers) {
            allNodes.forEach(n => {
                if (!nodeEls.includes(n)) n.classList.add('faded');
            });
        }

        node.classList.add('highlighted');
        node.classList.remove('faded');

        await DBIV.sleep(stepDelay);
    }

    await DBIV.sleep(200);
    allNodes.forEach(n => {
        n.classList.remove('faded');
        n.classList.remove('highlighted');
    });
};

/* ===== Full Scan Animation ===== */
DBIV.animateFullScan = async function(rowEls, options = {}) {
    const { delay = 80, matchIndex = -1 } = options;
    for (let i = 0; i < rowEls.length; i++) {
        const row = rowEls[i];
        if (!row) continue;
        row.classList.add('scanned');
        await DBIV.sleep(delay);
        if (i === matchIndex) {
            row.classList.remove('scanned');
            row.classList.add('matched');
        } else {
            row.classList.remove('scanned');
        }
    }
};

/* ===== Hash Animation ===== */
DBIV.animateHash = async function(key, bucketEl, hashFnEl) {
    if (hashFnEl) {
        hashFnEl.classList.add('active');
        hashFnEl.textContent = `hash("${key}") = bucket`;
        await DBIV.sleep(400);
        hashFnEl.classList.remove('active');
    }
    if (bucketEl) {
        bucketEl.classList.add('targeted');
        await DBIV.sleep(500);
    }
};

/* ===== B+Tree Path Finder ===== */
DBIV.findPathInTree = function(targetValue, treeNodes) {
    const levels = {};
    treeNodes.forEach(node => {
        const levelEl = node.closest('.tree-level');
        const level = levelEl ? parseInt(levelEl.dataset.level) : 0;
        if (!levels[level]) levels[level] = [];
        levels[level].push(node);
    });

    const path = [];
    const sortedLevels = Object.keys(levels).map(Number).sort((a, b) => a - b);
    let nodeIdx = 0;

    for (const level of sortedLevels) {
        const nodesAtLevel = levels[level];
        const node = nodesAtLevel[nodeIdx];
        if (!node) break;
        path.push(node);

        const hasPointers = !!node.querySelector('.tree-pointer');
        if (!hasPointers) break;

        const keys = Array.from(node.querySelectorAll('.tree-key')).map(k => {
            const v = k.dataset.key;
            return isNaN(v) ? v : parseFloat(v);
        });

        const tv = isNaN(targetValue) ? targetValue : parseFloat(targetValue);
        let localChild = 0;
        for (let i = 0; i < keys.length; i++) {
            if (tv >= keys[i]) localChild = i + 1;
        }

        let absoluteChild = 0;
        for (let n = 0; n < nodeIdx; n++) {
            absoluteChild += nodesAtLevel[n].querySelectorAll('.tree-key').length + 1;
        }
        nodeIdx = absoluteChild + localChild;
    }

    return path;
};

/* ===== B+Tree Renderer ===== */
DBIV.renderBTree = function(container, treeData) {
    let html = '<div class="tree-container">';

    treeData.levels.forEach((level, li) => {
        const levelName = li === 0 ? 'Root' : li === treeData.levels.length - 1 ? 'Leaf' : 'Internal';
        html += `<div class="tree-level" data-level="${li}">`;
        level.forEach((node, ni) => {
            const nodeId = `tnode-${li}-${ni}`;
            html += `<div class="tree-node" id="${nodeId}">`;
            node.keys.forEach((k, ki) => {
                if (node.pointers) {
                    html += `<span class="tree-pointer">&#x25BC;</span>`;
                }
                html += `<span class="tree-key" data-key="${k}" id="tkey-${li}-${ni}-${ki}">${k}</span>`;
            });
            if (node.pointers) {
                html += `<span class="tree-pointer">&#x25BC;</span>`;
            }
            html += '</div>';
        });
        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
};

/* ===== Skip List Renderer ===== */
DBIV.renderSkipList = function(container, data) {
    const maxLevel = data.maxLevel || 4;
    let html = '<div class="skiplist-container">';

    for (let level = maxLevel - 1; level >= 0; level--) {
        html += `<div class="skiplist-level"><span class="skiplist-level-label">L${level}</span>`;
        data.nodes.forEach(node => {
            if (node.level > level) {
                html += `<span class="skiplist-node" id="sl-${level}-${node.score}" data-score="${node.score}">${node.score}:${node.member}</span>`;
                html += `<span class="skiplist-arrow">&#x2192;</span>`;
            } else {
                html += `<span class="skiplist-node empty">-</span>`;
                html += `<span class="skiplist-arrow">&#x2192;</span>`;
            }
        });
        html += `<span class="skiplist-node" style="border-color:var(--dbiv-text-light)">NIL</span>`;
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
};

/* ===== Data Pages Renderer ===== */
DBIV.renderDataPages = function(container, pages) {
    let html = '';
    let offset = 0;
    pages.forEach((page, pi) => {
        html += `<div class="data-page" id="dpage-${pi}">`;
        html += `<div class="data-page-header">Page ${pi + 1}</div>`;
        page.rows.forEach((row, ri) => {
            const globalIdx = offset + ri;
            html += `<div class="data-row" id="drow-${globalIdx}">`;
            html += `<span class="data-row-id">${row.id}</span>`;
            html += `<span class="data-row-value">${row.value}</span>`;
            html += '</div>';
        });
        offset += page.rows.length;
        html += '</div>';
    });
    container.innerHTML = html;
};

/* ===== Comparison Mode ===== */
DBIV.showComparison = function(indexStats, fullScanStats) {
    const panel = document.getElementById('comparison-panel');
    panel.style.display = 'flex';

    document.getElementById('compare-index-stats').innerHTML =
        `<div class="comparison-stat-row"><span>Pages Read</span><span class="${indexStats.pages <= fullScanStats.pages ? 'comparison-faster' : 'comparison-slower'}">${indexStats.pages}</span></div>` +
        `<div class="comparison-stat-row"><span>Rows Examined</span><span class="${indexStats.rows <= fullScanStats.rows ? 'comparison-faster' : 'comparison-slower'}">${indexStats.rows}</span></div>` +
        `<div class="comparison-stat-row"><span>Time</span><span class="${indexStats.time <= fullScanStats.time ? 'comparison-faster' : 'comparison-slower'}">${indexStats.time} ms</span></div>`;

    document.getElementById('compare-full-stats').innerHTML =
        `<div class="comparison-stat-row"><span>Pages Read</span><span class="${fullScanStats.pages <= indexStats.pages ? 'comparison-faster' : 'comparison-slower'}">${fullScanStats.pages}</span></div>` +
        `<div class="comparison-stat-row"><span>Rows Examined</span><span class="${fullScanStats.rows <= indexStats.rows ? 'comparison-faster' : 'comparison-slower'}">${fullScanStats.rows}</span></div>` +
        `<div class="comparison-stat-row"><span>Time</span><span class="${fullScanStats.time <= indexStats.time ? 'comparison-faster' : 'comparison-slower'}">${fullScanStats.time} ms</span></div>`;
};

DBIV.hideComparison = function() {
    document.getElementById('comparison-panel').style.display = 'none';
};

/* ===== Helpers ===== */
DBIV.nextQueryId = function() {
    return ++DBIV.state.queryId;
};

DBIV.flashCard = function(cardEl, type, duration = 600) {
    if (!cardEl) return;
    const cls = type === 'green' ? 'card-flash-green' : 'card-flash-red';
    cardEl.classList.add(cls);
    if (type === 'red') cardEl.classList.add('shake');
    setTimeout(() => {
        cardEl.classList.remove(cls, 'shake');
    }, duration);
};

DBIV.setAccentColors = function(db) {
    const root = document.documentElement.style;
    const themes = {
        mysql:      { accent: '#00758F', bg: '#0d1f24', light: '#153038' },
        postgresql: { accent: '#336791', bg: '#0d1724', light: '#152538' },
        mongodb:    { accent: '#47A248', bg: '#0d1f10', light: '#15301a' },
        redis:      { accent: '#DC382D', bg: '#2a1616', light: '#3d1c1c' },
    };
    const t = themes[db] || themes.mysql;
    root.setProperty('--dbiv-accent', t.accent);
    root.setProperty('--dbiv-accent-bg', t.bg);
    root.setProperty('--dbiv-accent-light', t.light);
};

DBIV.hashKey = function(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
};

DBIV.sleep = function(ms) {
    return new Promise(r => setTimeout(r, ms));
};

DBIV.clearAnimations = function() {
    const layer = document.getElementById('animation-layer');
    if (layer) layer.innerHTML = '';
    DBIV.state.animations = [];
    DBIV.state.deliveryQueue = [];
    DBIV.onResume = null;
};

/* ===== Sample Data Generator ===== */
DBIV.sampleData = {
    users: [
        { id: 1, name: 'Alice', age: 28, email: 'alice@mail.com', city: 'NYC' },
        { id: 2, name: 'Bob', age: 35, email: 'bob@mail.com', city: 'LA' },
        { id: 3, name: 'Carol', age: 22, email: 'carol@mail.com', city: 'NYC' },
        { id: 4, name: 'Dave', age: 31, email: 'dave@mail.com', city: 'SF' },
        { id: 5, name: 'Eve', age: 27, email: 'eve@mail.com', city: 'LA' },
        { id: 6, name: 'Frank', age: 42, email: 'frank@mail.com', city: 'NYC' },
        { id: 7, name: 'Grace', age: 19, email: 'grace@mail.com', city: 'SF' },
        { id: 8, name: 'Hank', age: 38, email: 'hank@mail.com', city: 'LA' },
        { id: 9, name: 'Ivy', age: 25, email: 'ivy@mail.com', city: 'NYC' },
        { id: 10, name: 'Jack', age: 33, email: 'jack@mail.com', city: 'SF' },
        { id: 11, name: 'Kate', age: 29, email: 'kate@mail.com', city: 'LA' },
        { id: 12, name: 'Leo', age: 45, email: 'leo@mail.com', city: 'NYC' },
    ],

    toPages: function(rows, perPage) {
        perPage = perPage || 4;
        const pages = [];
        for (let i = 0; i < rows.length; i += perPage) {
            pages.push({
                rows: rows.slice(i, i + perPage).map(r => ({
                    id: r.id,
                    value: `${r.name}, ${r.age}, ${r.city}`
                }))
            });
        }
        return pages;
    },

    btreeFromField: function(rows, field) {
        const sorted = [...rows].sort((a, b) => {
            if (typeof a[field] === 'string') return a[field].localeCompare(b[field]);
            return a[field] - b[field];
        });
        const keys = sorted.map(r => r[field]);

        if (keys.length <= 3) {
            return { levels: [[{ keys }]] };
        }

        const mid = Math.floor(keys.length / 2);
        const rootKey = keys[mid];
        const left = keys.slice(0, mid);
        const right = keys.slice(mid);

        const leftMid = Math.floor(left.length / 2);
        const rightMid = Math.floor(right.length / 2);

        return {
            levels: [
                [{ keys: [rootKey], pointers: true }],
                [
                    { keys: [left[leftMid]], pointers: true },
                    { keys: [right[rightMid]], pointers: true }
                ],
                [
                    { keys: left.slice(0, leftMid) },
                    { keys: left.slice(leftMid) },
                    { keys: right.slice(0, rightMid) },
                    { keys: right.slice(rightMid) },
                ]
            ]
        };
    }
};
