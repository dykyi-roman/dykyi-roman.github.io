/* ===== Fibonacci (Dynamic Programming) Algorithm ===== */

AV['fibonacci'] = {};

AV['fibonacci'].modes = [
    { id: 'bottom-up', label: 'Bottom-Up', desc: 'Iterative tabulation: builds the DP table from F(0) to F(n), filling each cell using previously computed values. O(n) time and space.' },
    { id: 'top-down', label: 'Top-Down', desc: 'Recursive with memoization: computes F(n) by recursing into subproblems, caching results to avoid recomputation. O(n) time.' },
    { id: 'naive', label: 'Naive Recursive', desc: 'Pure recursion without memoization. The full recursion tree reveals O(2^n) exponential time from redundant recomputation.' }
];

AV['fibonacci'].depRules = [
    { name: 'Time (Bottom-Up)', role: 'O(n) \u2014 linear tabulation', type: 'good' },
    { name: 'Time (Top-Down)', role: 'O(n) \u2014 with memoization', type: 'good' },
    { name: 'Time (Naive)', role: 'O(2\u207F) \u2014 exponential', type: 'bad' },
    { name: 'Space (Bottom-Up)', role: 'O(n) \u2014 DP table', type: 'info' },
    { name: 'Space (Top-Down)', role: 'O(n) \u2014 memo + call stack', type: 'info' },
    { name: 'Space (Naive)', role: 'O(n) \u2014 call stack depth', type: 'info' }
];

AV['fibonacci'].details = {
    'bottom-up': {
        principles: [
            'Define base cases: F(0) = 0, F(1) = 1',
            'Fill DP table iteratively from index 2 to n',
            'Each cell dp[i] = dp[i-1] + dp[i-2]',
            'Read previously computed values \u2014 no recomputation',
            'Final answer is dp[n]'
        ],
        concepts: [
            { term: 'Tabulation', definition: 'Bottom-up DP approach: solve all subproblems in order, starting from the smallest, and store results in a table.' },
            { term: 'Optimal Substructure', definition: 'F(n) depends on F(n-1) and F(n-2). Each Fibonacci number is built from two previously solved subproblems.' },
            { term: 'Overlapping Subproblems', definition: 'Without DP, F(n-2) would be computed twice: once for F(n) and once for F(n-1). Tabulation eliminates this redundancy.' },
            { term: 'Space Optimization', definition: 'Since F(i) only depends on the two previous values, the table can be reduced to two variables for O(1) space.' }
        ],
        tradeoffs: {
            pros: [
                'O(n) time \u2014 each subproblem solved exactly once',
                'No recursion overhead \u2014 simple loop',
                'Predictable memory usage \u2014 fixed-size table',
                'Easy to understand and implement',
                'Can be further optimized to O(1) space'
            ],
            cons: [
                'Computes all subproblems even if not all are needed',
                'O(n) space for the full table',
                'Less intuitive than the recursive definition',
                'Not easily generalizable to all DP problems'
            ],
            whenToUse: 'Use bottom-up when you need all subproblem values, want predictable performance, or need to avoid stack overflow for large n. Preferred for production code.'
        }
    },
    'top-down': {
        principles: [
            'Start from F(n) and recurse into F(n-1) and F(n-2)',
            'Before computing, check if result is already in memo cache',
            'If cached (memo hit), return immediately \u2014 no recomputation',
            'If not cached, compute recursively and store the result',
            'Memoization converts O(2\u207F) to O(n)'
        ],
        concepts: [
            { term: 'Memoization', definition: 'Top-down DP technique: cache results of expensive function calls and return the cached result when the same inputs occur again.' },
            { term: 'Memo Hit', definition: 'When a recursive call finds a previously computed result in the cache. This eliminates the entire subtree of redundant computation.' },
            { term: 'Call Stack', definition: 'Each recursive call adds a frame to the stack. Maximum depth is n, giving O(n) space for the call stack alone.' },
            { term: 'Lazy Evaluation', definition: 'Unlike bottom-up, memoization only computes subproblems that are actually needed. For Fibonacci this makes no difference, but for sparse DP problems it can be faster.' }
        ],
        tradeoffs: {
            pros: [
                'O(n) time with memoization',
                'Natural recursive structure mirrors the mathematical definition',
                'Only computes needed subproblems (lazy)',
                'Easy to derive from naive recursive solution',
                'Good for problems with large sparse state spaces'
            ],
            cons: [
                'Recursion overhead \u2014 function call cost per subproblem',
                'O(n) call stack depth \u2014 risk of stack overflow for large n',
                'Cache management adds constant overhead',
                'Harder to optimize space compared to bottom-up'
            ],
            whenToUse: 'Use top-down when the recursive structure is natural, when only a subset of subproblems is needed, or as a first step in developing a DP solution before converting to bottom-up.'
        }
    },
    'naive': {
        principles: [
            'Directly implement the recurrence: F(n) = F(n-1) + F(n-2)',
            'Base cases: F(0) = 0, F(1) = 1',
            'Each call spawns two recursive calls',
            'No caching \u2014 identical subproblems are recomputed many times',
            'The recursion tree grows exponentially'
        ],
        concepts: [
            { term: 'Exponential Blowup', definition: 'Without memoization, the number of calls grows as O(2\u207F). F(6) alone requires 25 function calls, most of which are redundant.' },
            { term: 'Redundant Computation', definition: 'F(3) is computed 3 times for F(6), F(2) is computed 5 times. Each duplicate call spawns its own subtree of duplicates.' },
            { term: 'Recursion Tree', definition: 'A tree where each node represents a function call. The left child is F(n-1), the right is F(n-2). Duplicate nodes show the waste.' },
            { term: 'Motivation for DP', definition: 'The naive approach demonstrates exactly why dynamic programming exists: to eliminate redundant computation through caching (memoization) or tabulation.' }
        ],
        tradeoffs: {
            pros: [
                'Simplest implementation \u2014 directly matches math definition',
                'Good for understanding the problem before optimization',
                'No extra memory for caching'
            ],
            cons: [
                'O(2\u207F) time \u2014 completely impractical for n > 30',
                'Massive redundant computation',
                'O(n) call stack depth',
                'Demonstrates the anti-pattern that DP solves'
            ],
            whenToUse: 'Use only for educational purposes to demonstrate why dynamic programming is needed. Never use in production. Switch to bottom-up or top-down for any practical computation.'
        }
    }
};

/* ===== Helper Functions ===== */

AV['fibonacci']._fib = function(n) {
    if (n <= 1) return n;
    var a = 0, b = 1;
    for (var i = 2; i <= n; i++) { var t = a + b; a = b; b = t; }
    return b;
};

AV['fibonacci']._injectNBanner = function(n, min, max) {
    var old = document.querySelector('.av-target-banner');
    if (old) old.remove();

    var vizArea = document.getElementById('viz-area');
    if (!vizArea) vizArea = document.getElementById('av-canvas');
    if (!vizArea) return;

    var banner = document.createElement('div');
    banner.className = 'av-target-banner';

    var label = document.createElement('span');
    label.textContent = I18N.t('av.dp_n_label', null, 'N =');
    banner.appendChild(label);

    var input = document.createElement('input');
    input.className = 'av-target-input';
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.value = String(n);
    banner.appendChild(input);

    input.addEventListener('change', function() {
        var val = parseInt(input.value, 10);
        if (isNaN(val) || val < min) val = min;
        if (val > max) val = max;
        input.value = val;
        AV.state._fibN = val;
        var mode = AV.state.mode;
        if (AV['fibonacci'][mode]) AV['fibonacci'][mode].init();
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.dispatchEvent(new Event('change'));
        }
    });

    vizArea.appendChild(banner);
};

/* ===== Tree Layout for Recursion Trees ===== */

AV['fibonacci']._buildMemoTree = function(n) {
    var nodes = [];
    var edges = [];
    var nodeMap = {};
    var computed = {};

    function buildNode(val, parentId) {
        var nodeId = 'F' + val;
        var isMemoHit = computed[val] !== undefined;

        if (!nodeMap[nodeId]) {
            nodeMap[nodeId] = true;
            nodes.push({ id: nodeId, label: 'F(' + val + ')' });
        }

        if (parentId) {
            edges.push([parentId, nodeId]);
        }

        if (isMemoHit) return;

        computed[val] = true;

        if (val >= 2) {
            buildNode(val - 1, nodeId);
            buildNode(val - 2, nodeId);
        }
    }

    buildNode(n, null);
    AV['fibonacci']._layoutTree(nodes, edges);
    return { nodes: nodes, edges: edges };
};

AV['fibonacci']._buildNaiveTree = function(n) {
    var nodes = [];
    var edges = [];
    var counter = {};

    function buildNode(val, parentId) {
        var count = counter[val] || 0;
        counter[val] = count + 1;
        var nodeId = 'F' + val + '_' + count;

        nodes.push({ id: nodeId, label: 'F(' + val + ')', fibVal: val, dupIndex: count });

        if (parentId) {
            edges.push([parentId, nodeId]);
        }

        if (val >= 2) {
            buildNode(val - 1, nodeId);
            buildNode(val - 2, nodeId);
        }
    }

    buildNode(n, null);
    AV['fibonacci']._layoutTree(nodes, edges);
    return { nodes: nodes, edges: edges };
};

AV['fibonacci']._layoutTree = function(nodes, edges) {
    if (nodes.length === 0) return;

    var children = {};
    var rootId = nodes[0].id;

    edges.forEach(function(e) {
        if (!children[e[0]]) children[e[0]] = [];
        children[e[0]].push(e[1]);
    });

    /* Compute subtree widths for proper spacing */
    var widths = {};
    function computeWidth(id) {
        var ch = children[id] || [];
        if (ch.length === 0) { widths[id] = 1; return 1; }
        var total = 0;
        ch.forEach(function(c) { total += computeWidth(c); });
        widths[id] = total;
        return total;
    }
    computeWidth(rootId);

    var totalWidth = widths[rootId];
    var canvasWidth = 900;
    var xPadding = 40;
    var usableWidth = canvasWidth - 2 * xPadding;
    var yStep = 70;
    var startY = 45;

    var positions = {};
    function layoutNode(id, xStart, xEnd, depth) {
        var x = (xStart + xEnd) / 2;
        var y = startY + depth * yStep;
        positions[id] = { x: x, y: y };

        var ch = children[id] || [];
        if (ch.length === 0) return;

        var currentX = xStart;
        ch.forEach(function(c) {
            var w = widths[c];
            var childEnd = currentX + (w / totalWidth) * usableWidth;
            layoutNode(c, currentX, childEnd, depth + 1);
            currentX = childEnd;
        });
    }

    layoutNode(rootId, xPadding, xPadding + usableWidth, 0);

    nodes.forEach(function(n) {
        var pos = positions[n.id];
        if (pos) {
            n.x = pos.x;
            n.y = pos.y;
        }
    });
};

/* ===== Generate Steps for Memoized Recursion ===== */

AV['fibonacci']._memoSteps = function(n) {
    var steps = [];
    var memo = {};

    function fib(val, parentNode) {
        var nodeId = 'F' + val;

        if (memo[val] !== undefined) {
            steps.push({ type: 'DP_MEMO_HIT', node: nodeId, label: 'F(' + val + ')', value: memo[val], parentNode: parentNode });
            return memo[val];
        }

        steps.push({ type: 'DP_CALL', node: nodeId, label: 'F(' + val + ')', parentNode: parentNode });

        if (val <= 1) {
            memo[val] = val;
            steps.push({ type: 'DP_RETURN', node: nodeId, label: 'F(' + val + ')', value: val });
            return val;
        }

        var left = fib(val - 1, nodeId);
        var right = fib(val - 2, nodeId);
        memo[val] = left + right;
        steps.push({ type: 'DP_RETURN', node: nodeId, label: 'F(' + val + ')', value: memo[val] });
        return memo[val];
    }

    fib(n, null);
    steps.push({ type: 'DONE' });
    return steps;
};

/* ===== Generate Steps for Naive Recursion ===== */

AV['fibonacci']._naiveSteps = function(n) {
    var steps = [];
    var counter = {};

    function fib(val, parentNode) {
        var count = counter[val] || 0;
        counter[val] = count + 1;
        var nodeId = 'F' + val + '_' + count;

        steps.push({ type: 'DP_CALL', node: nodeId, label: 'F(' + val + ')', parentNode: parentNode });

        if (val <= 1) {
            steps.push({ type: 'DP_RETURN', node: nodeId, label: 'F(' + val + ')', value: val });
            return val;
        }

        var left = fib(val - 1, nodeId);
        var right = fib(val - 2, nodeId);
        var result = left + right;
        steps.push({ type: 'DP_RETURN', node: nodeId, label: 'F(' + val + ')', value: result });
        return result;
    }

    fib(n, null);
    steps.push({ type: 'DONE' });
    return steps;
};

/* ===== Legend Configuration ===== */

AV['fibonacci']._setBottomUpLegend = function() {
    AV['fibonacci'].legendItems = [
        { swatch: 'av-legend-bar-default', i18nKey: 'av.legend.dp_unfilled' },
        { swatch: 'av-legend-bar-base', i18nKey: 'av.legend.dp_base_case' },
        { swatch: 'av-legend-bar-reading', i18nKey: 'av.legend.dp_reading' },
        { swatch: 'av-legend-bar-computing', i18nKey: 'av.legend.dp_computing' },
        { swatch: 'av-legend-bar-filled', i18nKey: 'av.legend.dp_filled' },
        { swatch: 'av-legend-bar-result', i18nKey: 'av.legend.dp_result' }
    ];
};

AV['fibonacci']._setTreeLegend = function(isNaive) {
    var items = [
        { swatch: 'av-legend-node-pending', i18nKey: 'av.legend.dp_pending' },
        { swatch: 'av-legend-node-computing', i18nKey: 'av.legend.dp_computing_node' },
        { swatch: 'av-legend-node-visited', i18nKey: 'av.legend.dp_computed' }
    ];
    if (!isNaive) {
        items.push({ swatch: 'av-legend-node-cached', i18nKey: 'av.legend.dp_cached' });
    }
    items.push({ swatch: 'av-legend-edge-active', i18nKey: 'av.legend.edge_exploring' });
    AV['fibonacci'].legendItems = items;
};

/* ===== Mode: Bottom-Up ===== */

AV['fibonacci']['bottom-up'] = {
    init: function() {
        var n = AV.state._fibN || 10;
        AV.state._fibN = n;
        AV.state._isDPAlgorithm = true;
        AV.state._isTreeAlgorithm = false;
        delete AV.state._graphData;
        delete AV.state._searchTarget;
        delete AV.state._dpNodeLabels;

        AV['fibonacci']._setBottomUpLegend();

        var dpTable = new Array(n + 1).fill(0);
        AV.state._initialArray = dpTable.slice();
        AV.state._dpMaxVal = AV['fibonacci']._fib(n) || 1;
        AV.renderArray(dpTable);
        AV['fibonacci']._injectNBanner(n, 2, 15);
        AV._setDpStatLabels();
    },

    steps: function() {
        var n = AV.state._fibN || 10;
        var steps = [];

        steps.push({ type: 'DP_BASE', index: 0, value: 0 });
        steps.push({ type: 'DP_BASE', index: 1, value: 1 });

        for (var i = 2; i <= n; i++) {
            var v1 = AV['fibonacci']._fib(i - 1);
            var v2 = AV['fibonacci']._fib(i - 2);
            steps.push({ type: 'DP_READ', indices: [i - 1, i - 2], values: [v1, v2] });
            steps.push({ type: 'DP_FILL', index: i, value: v1 + v2, formula: 'dp[' + (i - 1) + '] + dp[' + (i - 2) + ']' });
        }

        steps.push({ type: 'DP_RESULT', index: n, value: AV['fibonacci']._fib(n) });
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('fibonacci.stepLabel', null, 'Fibonacci \u2014 Bottom-Up') };
    },

    run: function() {
        AV['fibonacci']['bottom-up'].init();
        AV.animateFlow(
            AV['fibonacci']['bottom-up'].steps(),
            AV['fibonacci']['bottom-up'].stepOptions()
        );
    }
};

/* ===== Mode: Top-Down (Memoization) ===== */

AV['fibonacci']['top-down'] = {
    init: function() {
        var n = AV.state._fibN || 7;
        if (n > 8) n = 8;
        AV.state._fibN = n;
        AV.state._isDPAlgorithm = true;
        AV.state._isTreeAlgorithm = false;
        delete AV.state._searchTarget;

        AV['fibonacci']._setTreeLegend(false);

        var treeData = AV['fibonacci']._buildMemoTree(n);
        AV.renderGraph(treeData.nodes, treeData.edges);

        /* Store original labels for snapshot reset */
        var labels = {};
        treeData.nodes.forEach(function(nd) {
            labels[nd.id] = nd.label;
        });
        AV.state._dpNodeLabels = labels;

        /* Set node text to label */
        treeData.nodes.forEach(function(nd) {
            var textEl = document.querySelector('.av-node[data-node="' + nd.id + '"] text');
            if (textEl) textEl.textContent = nd.label;
            AV.setNodeState(nd.id, 'pending');
        });
        document.querySelectorAll('.av-edge').forEach(function(e) {
            e.setAttribute('class', 'av-edge av-edge-pending');
        });

        var panel = document.querySelector('.av-queue-panel');
        if (panel) panel.remove();

        AV['fibonacci']._injectNBanner(n, 2, 8);
        AV._setDpStatLabels();
    },

    steps: function() {
        var n = AV.state._fibN || 7;
        return AV['fibonacci']._memoSteps(n);
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('fibonacci.stepLabel_topdown', null, 'Fibonacci \u2014 Top-Down') };
    },

    run: function() {
        AV['fibonacci']['top-down'].init();
        AV.animateFlow(
            AV['fibonacci']['top-down'].steps(),
            AV['fibonacci']['top-down'].stepOptions()
        );
    }
};

/* ===== Mode: Naive Recursive ===== */

AV['fibonacci']['naive'] = {
    init: function() {
        var n = AV.state._fibN || 6;
        if (n > 7) n = 7;
        AV.state._fibN = n;
        AV.state._isDPAlgorithm = true;
        AV.state._isTreeAlgorithm = false;
        delete AV.state._searchTarget;

        AV['fibonacci']._setTreeLegend(true);

        var treeData = AV['fibonacci']._buildNaiveTree(n);
        AV.renderGraph(treeData.nodes, treeData.edges);

        /* Store original labels for snapshot reset */
        var labels = {};
        treeData.nodes.forEach(function(nd) {
            labels[nd.id] = nd.label;
        });
        AV.state._dpNodeLabels = labels;

        /* Set node text to label */
        treeData.nodes.forEach(function(nd) {
            var textEl = document.querySelector('.av-node[data-node="' + nd.id + '"] text');
            if (textEl) textEl.textContent = nd.label;
            AV.setNodeState(nd.id, 'pending');
        });
        document.querySelectorAll('.av-edge').forEach(function(e) {
            e.setAttribute('class', 'av-edge av-edge-pending');
        });

        var panel = document.querySelector('.av-queue-panel');
        if (panel) panel.remove();

        AV['fibonacci']._injectNBanner(n, 2, 7);
        AV._setDpStatLabels();
    },

    steps: function() {
        var n = AV.state._fibN || 6;
        return AV['fibonacci']._naiveSteps(n);
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('fibonacci.stepLabel_naive', null, 'Fibonacci \u2014 Naive') };
    },

    run: function() {
        AV['fibonacci']['naive'].init();
        AV.animateFlow(
            AV['fibonacci']['naive'].steps(),
            AV['fibonacci']['naive'].stepOptions()
        );
    }
};
