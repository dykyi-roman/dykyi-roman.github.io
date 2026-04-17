/* ===== A* (A-star) Pathfinding Algorithm ===== */

AV['a-star'] = {};

AV['a-star'].modes = [
    { id: 'standard', label: 'Standard', desc: 'A* finds the lowest-cost path from a start node to a goal node by ordering the frontier by f(n) = g(n) + h(n): the known cost from start plus a heuristic estimate to the goal. With an admissible heuristic, A* is optimal and typically expands fewer nodes than Dijkstra.' }
];

AV['a-star'].depRules = [
    { name: 'Time', role: 'O((V + E) log V) \u2014 with min-heap priority queue', type: 'good' },
    { name: 'Space', role: 'O(V) \u2014 open set + closed set + parents', type: 'info' },
    { name: 'Optimality', role: 'Yes \u2014 when the heuristic h(n) is admissible', type: 'good' },
    { name: 'Completeness', role: 'Yes \u2014 in finite graphs with non-negative weights', type: 'good' },
    { name: 'Admissibility', role: 'Required \u2014 h(n) must never overestimate true cost', type: 'info' },
    { name: 'Heuristic Quality', role: 'Better h \u2192 fewer expansions; h\u22610 degrades to Dijkstra', type: 'info' },
    { name: 'Data Structure', role: 'Priority Queue keyed by f = g + h', type: 'info' }
];

AV['a-star'].details = {
    standard: {
        principles: [
            'Initialize g(start)=0, g(n)=\u221E otherwise; precompute h(n) for every node',
            'Push start into the open set with f(start) = g(start) + h(start)',
            'Extract the node with minimum f from the open set',
            'If it is the goal, reconstruct the path by walking parent pointers back to start',
            'Otherwise for each neighbor: tentative_g = g(u) + weight(u,v); if better than g(v), relax and push with new f',
            'Move the extracted node into the closed set; repeat until goal is reached or open set is empty'
        ],
        concepts: [
            { term: 'g-score', definition: 'The best known actual cost from the start node to node n. Updated whenever a cheaper path is discovered (relaxation).' },
            { term: 'h-score (heuristic)', definition: 'An estimate of the remaining cost from n to the goal. Must be admissible (never overestimate) to preserve optimality.' },
            { term: 'f-score', definition: 'f(n) = g(n) + h(n). The priority key used to order the open set: smaller f means more promising node.' },
            { term: 'Open Set (Frontier)', definition: 'Priority queue of discovered nodes that have not yet been expanded. Ordered by f-score.' },
            { term: 'Closed Set', definition: 'Nodes already expanded with a finalized g-score. With a consistent heuristic, they do not need re-opening.' },
            { term: 'Admissible Heuristic', definition: 'h(n) \u2264 true cost from n to the goal for every n. Guarantees A* finds an optimal path.' },
            { term: 'Consistent (Monotone) Heuristic', definition: 'For every edge (u,v): h(u) \u2264 weight(u,v) + h(v). Implies admissibility and allows skipping re-opens.' }
        ],
        tradeoffs: {
            pros: [
                'Optimal path guaranteed when the heuristic is admissible',
                'Typically expands far fewer nodes than Dijkstra for single-target queries',
                'Tunable: heuristic quality directly controls efficiency vs optimality',
                'Basis for GPS routing, game AI pathfinding, robotics, puzzle solving',
                'Generalizes Dijkstra (h\u22610) and Greedy Best-First (g\u22610) in one framework'
            ],
            cons: [
                'Requires a domain-specific heuristic \u2014 not always obvious how to design',
                'Memory-heavy: stores both open and closed sets plus parent pointers',
                'A non-admissible heuristic breaks optimality (may find suboptimal paths)',
                'With a poor heuristic, performance collapses toward Dijkstra'
            ],
            whenToUse: 'Use A* for single-source-single-target shortest paths when a good admissible heuristic is available. For all-pairs or no heuristic, use Dijkstra. For negative weights, use Bellman-Ford.'
        }
    }
};

AV['a-star'].legendItems = [
    { swatch: 'av-legend-node-start', i18nKey: 'av.legend.a-star_start' },
    { swatch: 'av-legend-node-goal', i18nKey: 'av.legend.a-star_goal' },
    { swatch: 'av-legend-node-unvisited', i18nKey: 'av.legend.unvisited' },
    { swatch: 'av-legend-node-queued', i18nKey: 'av.legend.a-star_open' },
    { swatch: 'av-legend-node-visiting', i18nKey: 'av.legend.visiting' },
    { swatch: 'av-legend-node-visited', i18nKey: 'av.legend.a-star_closed' },
    { swatch: 'av-legend-node-path', i18nKey: 'av.legend.a-star_path_node' },
    { swatch: 'av-legend-edge-path', i18nKey: 'av.legend.a-star_path_edge' }
];

/* Same 7-node weighted graph as Dijkstra, with start=A, goal=G and admissible heuristics */
AV['a-star']._graph = {
    nodes: [
        { id: 'A', x: 450, y: 55,  h: 10 },
        { id: 'B', x: 250, y: 160, h: 6 },
        { id: 'C', x: 650, y: 160, h: 9 },
        { id: 'D', x: 100, y: 290, h: 7 },
        { id: 'E', x: 350, y: 290, h: 5 },
        { id: 'F', x: 550, y: 290, h: 2 },
        { id: 'G', x: 450, y: 390, h: 0 }
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
    },
    start: 'A',
    goal: 'G'
};

/* ---------- Mode: standard ---------- */

AV['a-star'].standard = {
    init: function() {
        var g = AV['a-star']._graph;
        AV.renderGraph(g.nodes, g.edges);
        AV['a-star']._markStartNode(g.start);
        AV['a-star']._markGoalNode(g.goal);
        AV.renderPriorityQueue([]);
        AV._setGraphStatLabels();

        /* Show initial heuristics on every node */
        g.nodes.forEach(function(n) {
            if (AV._setNodeHeuristic) AV._setNodeHeuristic(n.id, n.h);
        });
    },

    steps: function() {
        var g = AV['a-star']._graph;
        var adj = g.adjacency;
        var start = g.start;
        var goal = g.goal;
        var steps = [];

        /* Build heuristic map */
        var h = {};
        g.nodes.forEach(function(n) { h[n.id] = n.h; });

        /* g-scores, parents, open/closed */
        var gScore = {};
        var parent = {};
        var closed = {};
        g.nodes.forEach(function(n) {
            gScore[n.id] = n.id === start ? 0 : Infinity;
            parent[n.id] = null;
        });

        /* Priority queue: [{node, g, h, f}], sorted by f */
        var pq = [];

        function pqCopy() {
            return pq.map(function(e) { return { node: e.node, g: e.g, h: e.h, f: e.f }; });
        }

        function pqInsert(node, gVal, hVal) {
            var fVal = gVal + hVal;
            pq.push({ node: node, g: gVal, h: hVal, f: fVal });
            pq.sort(function(a, b) { return a.f - b.f; });
        }

        function pqExtractMin() {
            return pq.shift();
        }

        /* Initialization step — broadcast heuristics */
        steps.push({ type: 'HEURISTIC_INIT', heuristics: h, goal: goal });

        /* Enqueue start */
        pqInsert(start, 0, h[start]);
        steps.push({
            type: 'ENQUEUE', node: start, g: 0, h: h[start], f: 0 + h[start],
            parent: null, pq: pqCopy()
        });

        var goalReached = false;

        while (pq.length > 0) {
            var current = pqExtractMin();
            var u = current.node;

            /* Stale entry: node already closed with a better g — skip */
            if (closed[u]) continue;

            var neighbors = adj[u] || [];
            var openCount = 0;
            for (var c = 0; c < neighbors.length; c++) {
                if (!closed[neighbors[c].node]) openCount++;
            }

            steps.push({
                type: 'DEQUEUE', node: u, g: current.g, h: current.h, f: current.f,
                pq: pqCopy(), neighborCount: openCount
            });

            /* Goal test on extraction (optimal for admissible h) */
            if (u === goal) {
                steps.push({ type: 'GOAL_REACHED', node: u, g: current.g, pq: pqCopy() });
                closed[u] = true;
                steps.push({ type: 'VISIT', node: u, g: current.g, h: current.h, f: current.f, pq: pqCopy() });
                goalReached = true;

                /* Reconstruct path by walking parents back */
                var path = [];
                var edgesPath = [];
                var cur = goal;
                while (cur !== null) {
                    path.unshift(cur);
                    var p = parent[cur];
                    if (p !== null) edgesPath.unshift([p, cur]);
                    cur = p;
                }
                steps.push({
                    type: 'PATH_RECONSTRUCT', path: path, edges: edgesPath, totalCost: current.g
                });
                break;
            }

            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                var v = neighbor.node;
                var weight = neighbor.weight;

                if (closed[v]) {
                    steps.push({
                        type: 'EXPLORE_EDGE', from: u, to: v, weight: weight,
                        alreadyClosed: true, alreadyVisited: true
                    });
                    continue;
                }

                var tentativeG = gScore[u] + weight;
                var willRelax = tentativeG < gScore[v];

                steps.push({
                    type: 'EXPLORE_EDGE', from: u, to: v, weight: weight,
                    alreadyClosed: false, alreadyVisited: false,
                    relaxSkipped: !willRelax,
                    tentativeG: tentativeG, currentG: gScore[v],
                    newDist: tentativeG, currentDist: gScore[v] === Infinity ? 'Infinity' : gScore[v]
                });

                if (willRelax) {
                    var oldG = gScore[v];
                    gScore[v] = tentativeG;
                    parent[v] = u;
                    var newF = tentativeG + h[v];
                    var oldF = (oldG === Infinity) ? Infinity : oldG + h[v];
                    pqInsert(v, tentativeG, h[v]);
                    steps.push({
                        type: 'RELAX', node: v, oldG: oldG, newG: tentativeG,
                        oldF: oldF, newF: newF, hVal: h[v], via: u, pq: pqCopy(),
                        oldDist: oldG, newDist: tentativeG
                    });
                }
            }

            closed[u] = true;
            steps.push({ type: 'VISIT', node: u, g: gScore[u], h: h[u], f: gScore[u] + h[u], pq: pqCopy() });
        }

        var expanded = Object.keys(closed).length;
        steps.push({
            type: 'COMPLETE', isAStar: true,
            pathFound: goalReached,
            totalCost: goalReached ? gScore[goal] : null,
            totalExpanded: expanded,
            totalNodes: g.nodes.length
        });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('a-star.stepLabel', null, 'A* \u2014 Standard') };
    },

    run: function() {
        AV['a-star'].standard.init();
        AV.animateFlow(
            AV['a-star'].standard.steps(),
            AV['a-star'].standard.stepOptions()
        );
    }
};

/* ---------- Visual Helpers ---------- */

AV['a-star']._markStartNode = function(nodeId) {
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

AV['a-star']._markGoalNode = function(nodeId) {
    var node = document.querySelector('.av-node[data-node="' + nodeId + '"]');
    if (!node) return;

    node.className.baseVal = 'av-node av-node-goal';

    if (node.querySelector('.av-goal-ring')) return;

    var circle = node.querySelector('circle:not(.av-visit-order-bg)');
    if (!circle) return;
    var cx = circle.getAttribute('cx');
    var cy = circle.getAttribute('cy');

    var ring = AV._createSVG('circle', {
        cx: cx, cy: cy, r: 32,
        'class': 'av-goal-ring'
    });
    node.insertBefore(ring, node.firstChild);
};