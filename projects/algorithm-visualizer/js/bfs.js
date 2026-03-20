/* ===== BFS (Breadth-First Search) Algorithm ===== */

AV['bfs'] = {};

AV['bfs'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic BFS: explores a graph level by level using a FIFO queue. Starting from node A, it visits all neighbors before moving to the next depth level, producing a wave-like traversal pattern.' }
];

AV['bfs'].depRules = [
    { name: 'Time', role: 'O(V + E) \u2014 visits every vertex and edge once', type: 'good' },
    { name: 'Space', role: 'O(V) \u2014 queue + visited set', type: 'info' },
    { name: 'Shortest Path', role: 'Yes \u2014 finds shortest path in unweighted graphs', type: 'good' },
    { name: 'Complete', role: 'Yes \u2014 always finds a solution if one exists', type: 'good' },
    { name: 'Weighted Graphs', role: 'No \u2014 does not handle edge weights (use Dijkstra)', type: 'bad' },
    { name: 'Data Structure', role: 'FIFO Queue', type: 'info' }
];

AV['bfs'].details = {
    standard: {
        principles: [
            'Start from a source node and mark it as visited',
            'Add the source to a FIFO queue',
            'While the queue is not empty: dequeue a node, explore all unvisited neighbors',
            'Each neighbor is enqueued and marked as visited',
            'This guarantees level-by-level (wave) traversal'
        ],
        concepts: [
            { term: 'FIFO Queue', definition: 'First-In-First-Out data structure. Nodes discovered first are explored first, ensuring breadth-first order.' },
            { term: 'Level/Wave', definition: 'All nodes at distance k from the source are explored before any node at distance k+1. This is the key property of BFS.' },
            { term: 'Visited Set', definition: 'Tracks which nodes have been seen to prevent revisiting. Essential for correctness in graphs with cycles.' },
            { term: 'Shortest Path', definition: 'In unweighted graphs, BFS naturally finds the shortest path (fewest edges) from the source to every reachable node.' }
        ],
        tradeoffs: {
            pros: [
                'Finds the shortest path in unweighted graphs',
                'Complete \u2014 guaranteed to find a solution if reachable',
                'Simple and intuitive level-by-level exploration',
                'Optimal for finding nearest neighbors or closest nodes',
                'Foundation for many advanced algorithms (Dijkstra, A*)'
            ],
            cons: [
                'O(V) space for the queue \u2014 can be large for wide graphs',
                'Not suitable for weighted graphs \u2014 use Dijkstra instead',
                'Explores all nodes at current depth before going deeper',
                'Less memory-efficient than DFS for deep, narrow graphs'
            ],
            whenToUse: 'Use BFS when you need the shortest path in unweighted graphs, want to explore nodes by distance from source, or need level-order traversal. For weighted graphs, use Dijkstra. For exhaustive deep exploration, consider DFS.'
        }
    }
};

AV['bfs'].legendItems = [
    { swatch: 'av-legend-node-unvisited', i18nKey: 'av.legend.unvisited' },
    { swatch: 'av-legend-node-queued', i18nKey: 'av.legend.in_queue' },
    { swatch: 'av-legend-node-visiting', i18nKey: 'av.legend.visiting' },
    { swatch: 'av-legend-node-visited', i18nKey: 'av.legend.visited' },
    { swatch: 'av-legend-edge-active', i18nKey: 'av.legend.edge_exploring' }
];

AV['bfs']._graph = {
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

/* ---------- Mode: standard ---------- */

AV['bfs'].standard = {
    init: function() {
        var g = AV['bfs']._graph;
        AV.renderGraph(g.nodes, g.edges);
        AV.renderQueue([]);
        AV._setGraphStatLabels();
    },

    steps: function() {
        var g = AV['bfs']._graph;
        var adj = g.adjacency;
        var start = 'A';
        var steps = [];
        var visited = {};
        var queue = [];

        /* Enqueue start */
        queue.push(start);
        visited[start] = true;
        steps.push({ type: 'ENQUEUE', node: start, queue: queue.slice() });

        while (queue.length > 0) {
            var current = queue.shift();
            steps.push({ type: 'DEQUEUE', node: current, queue: queue.slice() });

            var neighbors = adj[current] || [];
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                steps.push({ type: 'EXPLORE_EDGE', from: current, to: neighbor, alreadyVisited: !!visited[neighbor], queue: queue.slice() });

                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push(neighbor);
                    steps.push({ type: 'ENQUEUE', node: neighbor, queue: queue.slice() });
                }
            }

            steps.push({ type: 'VISIT', node: current, queue: queue.slice() });
        }

        steps.push({ type: 'COMPLETE', queue: [] });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('bfs.stepLabel', null, 'BFS \u2014 Standard') };
    },

    run: function() {
        var g = AV['bfs']._graph;
        AV.renderGraph(g.nodes, g.edges);
        AV.renderQueue([]);
        AV._setGraphStatLabels();
        AV.animateFlow(
            AV['bfs'].standard.steps(),
            AV['bfs'].standard.stepOptions()
        );
    }
};
