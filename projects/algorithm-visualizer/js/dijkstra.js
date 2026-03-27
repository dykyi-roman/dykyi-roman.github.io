/* ===== Dijkstra's Shortest Path Algorithm ===== */

AV['dijkstra'] = {};

AV['dijkstra'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Dijkstra\'s algorithm finds the shortest path from a source node to all other nodes in a weighted graph. It uses a priority queue to greedily extract the nearest unvisited node and relaxes its neighbors\' distances.' }
];

AV['dijkstra'].depRules = [
    { name: 'Time', role: 'O((V + E) log V) \u2014 with min-heap priority queue', type: 'good' },
    { name: 'Space', role: 'O(V) \u2014 distances + priority queue', type: 'info' },
    { name: 'Shortest Path', role: 'Yes \u2014 finds optimal shortest paths from source', type: 'good' },
    { name: 'Negative Weights', role: 'No \u2014 requires non-negative edge weights', type: 'bad' },
    { name: 'Complete', role: 'Yes \u2014 finds paths to all reachable nodes', type: 'good' },
    { name: 'Data Structure', role: 'Priority Queue (min-heap)', type: 'info' }
];

AV['dijkstra'].details = {
    standard: {
        principles: [
            'Initialize source distance to 0 and all other distances to infinity',
            'Add source node to the priority queue with distance 0',
            'Extract the node with minimum distance from the priority queue',
            'For each neighbor: if current distance + edge weight < known distance, update (relax)',
            'Mark the extracted node as finalized and repeat until the queue is empty'
        ],
        concepts: [
            { term: 'Priority Queue (Min-Heap)', definition: 'A data structure that always returns the element with the smallest key. In Dijkstra\'s, it ensures we process the closest unfinalized node first.' },
            { term: 'Relaxation', definition: 'The process of updating a neighbor\'s distance when a shorter path is found: if dist[u] + weight(u,v) < dist[v], then update dist[v].' },
            { term: 'Greedy Choice', definition: 'Dijkstra always processes the nearest unvisited node. With non-negative weights, this greedy strategy guarantees optimality.' },
            { term: 'Shortest Path Tree', definition: 'The set of edges used in the final shortest paths from the source. Forms a spanning tree of the reachable graph.' }
        ],
        tradeoffs: {
            pros: [
                'Finds optimal shortest paths in weighted graphs with non-negative weights',
                'More efficient than Bellman-Ford for sparse graphs: O((V+E)log V) vs O(VE)',
                'Greedy approach guarantees correctness without revisiting finalized nodes',
                'Foundation for many variants including A*, bidirectional Dijkstra',
                'Natural fit for GPS routing, network routing, and pathfinding'
            ],
            cons: [
                'Cannot handle negative edge weights \u2014 use Bellman-Ford instead',
                'Priority queue adds implementation complexity compared to BFS',
                'O((V+E)log V) slower than BFS O(V+E) for unweighted graphs',
                'Only computes single-source shortest paths \u2014 use Floyd-Warshall for all-pairs'
            ],
            whenToUse: 'Use Dijkstra when you need shortest paths in weighted graphs with non-negative weights. For unweighted graphs, BFS is simpler and faster. For negative weights, use Bellman-Ford. For all-pairs, use Floyd-Warshall.'
        }
    }
};

AV['dijkstra'].legendItems = [
    { swatch: 'av-legend-node-start', i18nKey: 'av.legend.dijkstra_start' },
    { swatch: 'av-legend-node-unvisited', i18nKey: 'av.legend.unvisited' },
    { swatch: 'av-legend-node-queued', i18nKey: 'av.legend.in_pq' },
    { swatch: 'av-legend-node-visiting', i18nKey: 'av.legend.visiting' },
    { swatch: 'av-legend-node-visited', i18nKey: 'av.legend.dijkstra_finalized' },
    { swatch: 'av-legend-edge-active', i18nKey: 'av.legend.edge_exploring' },
    { swatch: 'av-legend-edge-relaxed', i18nKey: 'av.legend.edge_relaxed' },
    { swatch: 'av-legend-visit-order', i18nKey: 'av.legend.dijkstra_order', swatchContent: '#' }
];

/* Same 7-node graph as BFS/DFS but with weighted edges */
AV['dijkstra']._graph = {
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
        ['A', 'B', 4], ['A', 'C', 2],
        ['B', 'D', 5], ['B', 'E', 1],
        ['C', 'F', 8],
        ['D', 'E', 3],
        ['E', 'G', 6], ['F', 'G', 3]
    ],
    adjacency: {
        A: [{ node: 'B', weight: 4 }, { node: 'C', weight: 2 }],
        B: [{ node: 'A', weight: 4 }, { node: 'D', weight: 5 }, { node: 'E', weight: 1 }],
        C: [{ node: 'A', weight: 2 }, { node: 'F', weight: 8 }],
        D: [{ node: 'B', weight: 5 }, { node: 'E', weight: 3 }],
        E: [{ node: 'B', weight: 1 }, { node: 'D', weight: 3 }, { node: 'G', weight: 6 }],
        F: [{ node: 'C', weight: 8 }, { node: 'G', weight: 3 }],
        G: [{ node: 'E', weight: 6 }, { node: 'F', weight: 3 }]
    }
};

/* ---------- Mode: standard ---------- */

AV['dijkstra'].standard = {
    init: function() {
        var g = AV['dijkstra']._graph;
        AV.renderGraph(g.nodes, g.edges);
        AV['dijkstra']._markStartNode('A');
        AV.renderPriorityQueue([]);
        AV._setGraphStatLabels();

        /* Show initial distances */
        g.nodes.forEach(function(n) {
            AV._setNodeDistance(n.id, n.id === 'A' ? 0 : Infinity);
        });
    },

    steps: function() {
        var g = AV['dijkstra']._graph;
        var adj = g.adjacency;
        var start = 'A';
        var steps = [];

        /* Initialize distances */
        var dist = {};
        var finalized = {};
        var pq = []; /* [{node, dist}] sorted by dist */
        g.nodes.forEach(function(n) {
            dist[n.id] = n.id === start ? 0 : Infinity;
        });

        function distCopy() {
            var d = {};
            Object.keys(dist).forEach(function(k) { d[k] = dist[k]; });
            return d;
        }

        function pqCopy() {
            return pq.map(function(e) { return { node: e.node, dist: e.dist }; });
        }

        function pqInsert(node, d) {
            pq.push({ node: node, dist: d });
            pq.sort(function(a, b) { return a.dist - b.dist; });
        }

        function pqExtractMin() {
            return pq.shift();
        }

        /* Enqueue start */
        pqInsert(start, 0);
        steps.push({ type: 'ENQUEUE', node: start, dist: 0, pq: pqCopy(), distances: distCopy() });

        while (pq.length > 0) {
            var current = pqExtractMin();
            var u = current.node;

            /* Skip if already finalized (duplicate entry in PQ) */
            if (finalized[u]) continue;

            var neighbors = adj[u] || [];
            var unvisitedCount = 0;
            for (var c = 0; c < neighbors.length; c++) {
                if (!finalized[neighbors[c].node]) unvisitedCount++;
            }

            steps.push({ type: 'DEQUEUE', node: u, dist: current.dist, pq: pqCopy(), neighborCount: unvisitedCount });

            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                var v = neighbor.node;
                var weight = neighbor.weight;

                if (finalized[v]) {
                    steps.push({ type: 'EXPLORE_EDGE', from: u, to: v, alreadyVisited: true, weight: weight });
                    continue;
                }

                var newDist = dist[u] + weight;
                var willRelax = newDist < dist[v];

                steps.push({
                    type: 'EXPLORE_EDGE', from: u, to: v, alreadyVisited: false, weight: weight,
                    relaxSkipped: !willRelax,
                    newDist: newDist,
                    currentDist: dist[v]
                });

                if (willRelax) {
                    var oldDist = dist[v];
                    dist[v] = newDist;
                    pqInsert(v, newDist);
                    steps.push({
                        type: 'RELAX', node: v, oldDist: oldDist, newDist: newDist, via: u,
                        distances: distCopy(), pq: pqCopy()
                    });
                }
            }

            finalized[u] = true;
            steps.push({ type: 'VISIT', node: u, dist: dist[u], pq: pqCopy() });
        }

        steps.push({
            type: 'COMPLETE', isDijkstra: true,
            totalVisited: Object.keys(finalized).length,
            totalNodes: g.nodes.length
        });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('dijkstra.stepLabel', null, 'Dijkstra \u2014 Standard') };
    },

    run: function() {
        AV['dijkstra'].standard.init();
        AV.animateFlow(
            AV['dijkstra'].standard.steps(),
            AV['dijkstra'].standard.stepOptions()
        );
    }
};

/* ---------- Visual Helpers ---------- */

AV['dijkstra']._markStartNode = function(nodeId) {
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
