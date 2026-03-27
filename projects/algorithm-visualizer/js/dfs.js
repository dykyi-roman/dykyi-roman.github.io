/* ===== DFS (Depth-First Search) ===== */

AV['dfs'] = {};

AV['dfs'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic DFS: explores a graph as deep as possible before backtracking, using a LIFO stack. Starting from node A, it dives down one path until reaching a dead-end, then backtracks to explore unvisited branches.' }
];

AV['dfs'].depRules = [
    { name: 'Time', role: 'O(V + E) \u2014 visits every vertex and edge once', type: 'good' },
    { name: 'Space', role: 'O(V) \u2014 stack + visited set', type: 'info' },
    { name: 'Shortest Path', role: 'No \u2014 does not guarantee shortest path', type: 'bad' },
    { name: 'Complete', role: 'Yes \u2014 always finds a solution if one exists', type: 'good' },
    { name: 'Cycle Detection', role: 'Yes \u2014 naturally detects back edges / cycles', type: 'good' },
    { name: 'Data Structure', role: 'LIFO Stack', type: 'info' }
];

AV['dfs'].details = {
    standard: {
        principles: [
            'Start from a source node and push it onto a LIFO stack',
            'While the stack is not empty: pop a node from the top',
            'If the node has not been visited, mark it as visited and explore its neighbors',
            'Push all unvisited neighbors onto the stack',
            'This naturally explores as deeply as possible before backtracking'
        ],
        concepts: [
            { term: 'LIFO Stack', definition: 'Last-In-First-Out data structure. The most recently discovered node is explored first, producing a depth-first traversal.' },
            { term: 'Backtracking', definition: 'When DFS reaches a dead-end (no unvisited neighbors), it returns to the most recent node with unexplored branches.' },
            { term: 'Visited Set', definition: 'Tracks which nodes have been seen to prevent revisiting. Essential for correctness in graphs with cycles.' },
            { term: 'Depth', definition: 'DFS explores paths to maximum depth before branching. It does not guarantee visiting nodes in order of distance from source.' }
        ],
        tradeoffs: {
            pros: [
                'Memory-efficient for deep, narrow graphs \u2014 stack depth is O(V) worst case',
                'Natural basis for topological sorting of DAGs',
                'Detects cycles efficiently via back-edge detection',
                'Foundation for finding connected components and strongly connected components',
                'Simple recursive or iterative implementation'
            ],
            cons: [
                'Does not find shortest paths \u2014 path found depends on neighbor ordering',
                'Can get stuck in deep branches if graph is very deep',
                'Traversal order depends on neighbor ordering \u2014 not deterministic without sorting',
                'Less intuitive than BFS for distance-related problems'
            ],
            whenToUse: 'Use DFS when you need to explore all reachable nodes, detect cycles, perform topological sorting, or find connected components. For shortest paths in unweighted graphs, use BFS instead.'
        }
    }
};

AV['dfs'].legendItems = [
    { swatch: 'av-legend-node-start', i18nKey: 'av.legend.dfs_start' },
    { swatch: 'av-legend-node-unvisited', i18nKey: 'av.legend.unvisited' },
    { swatch: 'av-legend-node-queued', i18nKey: 'av.legend.in_stack' },
    { swatch: 'av-legend-node-visiting', i18nKey: 'av.legend.visiting' },
    { swatch: 'av-legend-node-visited', i18nKey: 'av.legend.visited' },
    { swatch: 'av-legend-edge-active', i18nKey: 'av.legend.edge_exploring' },
    { swatch: 'av-legend-visit-order', i18nKey: 'av.legend.dfs_order', swatchContent: '#' }
];

/* Same graph as BFS for direct comparison */
AV['dfs']._graph = {
    nodes: [
        { id: 'A', x: 450, y: 55 },
        { id: 'B', x: 250, y: 160 },
        { id: 'C', x: 650, y: 160 },
        { id: 'D', x: 100, y: 290 },
        { id: 'E', x: 350, y: 290 },
        { id: 'F', x: 550, y: 290 },
        { id: 'G', x: 450, y: 390 }
    ],
    edges: [
        ['A', 'B'], ['A', 'C'],
        ['B', 'D'], ['B', 'E'],
        ['C', 'F'],
        ['D', 'E'],
        ['E', 'G'], ['F', 'G']
    ],
    adjacency: {
        A: ['B', 'C'],
        B: ['A', 'D', 'E'],
        C: ['A', 'F'],
        D: ['B', 'E'],
        E: ['B', 'D', 'G'],
        F: ['C', 'G'],
        G: ['E', 'F']
    }
};

/* ===== Standard Mode ===== */
AV['dfs'].standard = {
    init: function() {
        var g = AV['dfs']._graph;
        AV.renderGraph(g.nodes, g.edges);
        AV['dfs']._markStartNode('A');
        AV.renderStack([]);
        AV._setGraphStatLabels();
    },

    steps: function() {
        var g = AV['dfs']._graph;
        var adj = g.adjacency;
        var start = 'A';
        var steps = [];
        var visited = {};
        var stack = [];
        var maxDepth = 0;
        var depthMap = {};

        /* Push start */
        stack.push(start);
        depthMap[start] = 0;
        steps.push({ type: 'PUSH', node: start, stack: stack.slice(), depth: 0 });

        while (stack.length > 0) {
            var current = stack.pop();

            if (visited[current]) {
                /* Already visited (pushed multiple times) -- show pop and skip */
                steps.push({ type: 'POP', node: current, stack: stack.slice(), depth: depthMap[current] || 0, neighborCount: 0, skipped: true });
                continue;
            }

            visited[current] = true;
            var currentDepth = depthMap[current] || 0;
            if (currentDepth > maxDepth) maxDepth = currentDepth;
            var neighbors = adj[current] || [];
            var unvisitedCount = 0;
            for (var c = 0; c < neighbors.length; c++) {
                if (!visited[neighbors[c]]) unvisitedCount++;
            }

            steps.push({ type: 'POP', node: current, stack: stack.slice(), depth: currentDepth, neighborCount: unvisitedCount });

            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                var alreadyVisited = !!visited[neighbor];
                steps.push({ type: 'EXPLORE_EDGE', from: current, to: neighbor, alreadyVisited: alreadyVisited, action: alreadyVisited ? 'skip' : 'push', stack: stack.slice() });

                if (!alreadyVisited) {
                    stack.push(neighbor);
                    if (depthMap[neighbor] === undefined) {
                        depthMap[neighbor] = currentDepth + 1;
                    }
                    steps.push({ type: 'PUSH', node: neighbor, stack: stack.slice(), depth: depthMap[neighbor] });
                }
            }

            steps.push({ type: 'VISIT', node: current, stack: stack.slice(), depth: currentDepth });
        }

        steps.push({ type: 'COMPLETE', stack: [], totalVisited: Object.keys(visited).length, totalNodes: g.nodes.length, maxDepth: maxDepth });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('dfs.stepLabel', null, 'DFS \u2014 Standard') };
    },

    run: function() {
        var g = AV['dfs']._graph;
        AV.renderGraph(g.nodes, g.edges);
        AV['dfs']._markStartNode('A');
        AV.renderStack([]);
        AV._setGraphStatLabels();
        AV.animateFlow(
            AV['dfs'].standard.steps(),
            AV['dfs'].standard.stepOptions()
        );
    }
};

/* ===== Helpers ===== */
AV['dfs']._markStartNode = function(nodeId) {
    var node = document.querySelector('.av-node[data-node="' + nodeId + '"]');
    if (!node) return;

    node.className.baseVal = 'av-node av-node-start';

    if (node.querySelector('.av-start-ring')) return;

    var circle = node.querySelector('circle:not(.av-visit-order-bg)');
    if (!circle) return;
    var cx = circle.getAttribute('cx');
    var cy = circle.getAttribute('cy');

    var ring = AV._createSVG('circle', {
        cx: cx, cy: cy, r: 32,
        'class': 'av-start-ring'
    });
    node.insertBefore(ring, node.firstChild);
};
