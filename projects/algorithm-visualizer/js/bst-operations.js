/* ===== BST Operations (Binary Search Tree) Algorithm ===== */

AV['bst-operations'] = {};

AV['bst-operations'].modes = [
    { id: 'insert', label: 'Insert', desc: 'BST Insert: builds a Binary Search Tree by inserting values one at a time. Each value is compared with nodes starting from the root, going left if smaller or right if larger, until an empty position is found.' }
];

AV['bst-operations'].depRules = [
    { name: 'Time (Average)', role: 'O(log n) \u2014 balanced tree', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n) \u2014 degenerate (linked list)', type: 'bad' },
    { name: 'Space', role: 'O(n) \u2014 one node per value', type: 'info' },
    { name: 'In-Place', role: 'No \u2014 allocates nodes dynamically', type: 'info' },
    { name: 'Sorted Output', role: 'Yes \u2014 in-order traversal gives sorted sequence', type: 'good' },
    { name: 'Self-Balancing', role: 'No \u2014 use AVL or Red-Black Tree', type: 'bad' }
];

AV['bst-operations'].details = {
    insert: {
        principles: [
            'Start at the root of the tree',
            'Compare the new value with the current node',
            'If smaller, go to the left child; if larger or equal, go to the right child',
            'Repeat until an empty position (null child) is found',
            'Place the new value at that empty position'
        ],
        concepts: [
            { term: 'BST Property', definition: 'For every node, all values in the left subtree are smaller, and all values in the right subtree are larger. This invariant is maintained after every insertion.' },
            { term: 'Tree Height', definition: 'The number of edges on the longest root-to-leaf path. Determines the worst-case time for insert and search operations.' },
            { term: 'Balanced vs Degenerate', definition: 'A balanced BST has O(log n) height. A degenerate BST (all nodes in one direction) has O(n) height, reducing to a linked list.' },
            { term: 'In-Order Traversal', definition: 'Visiting left subtree, then root, then right subtree produces values in sorted order. This is a key property of BSTs.' }
        ],
        tradeoffs: {
            pros: [
                'Simple insertion \u2014 just follow comparisons down the tree',
                'O(log n) average case for insert, search, and delete',
                'In-order traversal gives sorted output without extra work',
                'Foundation for more advanced trees (AVL, Red-Black)',
                'Dynamic \u2014 handles insertions and deletions efficiently'
            ],
            cons: [
                'O(n) worst case if input is sorted (degenerate tree)',
                'Not self-balancing \u2014 can become highly unbalanced',
                'No guaranteed O(log n) \u2014 depends on insertion order',
                'Extra memory for node pointers compared to arrays'
            ],
            whenToUse: 'Use basic BST for educational purposes or when input is known to be random. For guaranteed O(log n) operations, use self-balancing variants: AVL Tree for read-heavy workloads, Red-Black Tree for write-heavy workloads.'
        }
    }
};

AV['bst-operations'].legendItems = [
    { swatch: 'av-legend-node-pending', i18nKey: 'av.legend.bst_pending' },
    { swatch: 'av-legend-node-comparing', i18nKey: 'av.legend.bst_comparing' },
    { swatch: 'av-legend-node-visited', i18nKey: 'av.legend.visited' },
    { swatch: 'av-legend-node-inserted', i18nKey: 'av.legend.bst_inserted' },
    { swatch: 'av-legend-edge-active', i18nKey: 'av.legend.edge_exploring' }
];

AV['bst-operations']._generateValues = function() {
    var set = {};
    while (Object.keys(set).length < 15) {
        set[Math.floor(Math.random() * 90) + 10] = true;
    }
    var sorted = Object.keys(set).map(Number).sort(function(a, b) { return a - b; });
    var result = [];
    function buildOrder(lo, hi) {
        if (lo > hi) return;
        var mid = Math.floor((lo + hi) / 2);
        result.push(sorted[mid]);
        buildOrder(lo, mid - 1);
        buildOrder(mid + 1, hi);
    }
    buildOrder(0, sorted.length - 1);
    return result;
};

AV['bst-operations']._insertionValues = AV['bst-operations']._generateValues();

AV['bst-operations']._computeLayout = function(values) {
    var nodes = [];
    var edges = [];
    var tree = {};
    var root = null;

    for (var i = 0; i < values.length; i++) {
        var val = values[i];
        if (root === null) {
            root = val;
            tree[val] = { left: null, right: null };
        } else {
            var current = root;
            while (true) {
                if (val < current) {
                    if (tree[current].left === null) {
                        tree[current].left = val;
                        tree[val] = { left: null, right: null };
                        edges.push([String(current), String(val)]);
                        break;
                    }
                    current = tree[current].left;
                } else {
                    if (tree[current].right === null) {
                        tree[current].right = val;
                        tree[val] = { left: null, right: null };
                        edges.push([String(current), String(val)]);
                        break;
                    }
                    current = tree[current].right;
                }
            }
        }
    }

    var baseX = 450, baseY = 55, yStep = 85, baseSpread = 200;
    var queue = [{ val: root, x: baseX, y: baseY, depth: 0 }];

    while (queue.length > 0) {
        var item = queue.shift();
        var spread = baseSpread / Math.pow(2, item.depth);
        nodes.push({ id: String(item.val), x: item.x, y: item.y });

        if (tree[item.val].left !== null) {
            queue.push({ val: tree[item.val].left, x: item.x - spread, y: item.y + yStep, depth: item.depth + 1 });
        }
        if (tree[item.val].right !== null) {
            queue.push({ val: tree[item.val].right, x: item.x + spread, y: item.y + yStep, depth: item.depth + 1 });
        }
    }

    return { nodes: nodes, edges: edges };
};

/* ---------- Mode: insert ---------- */

AV['bst-operations'].insert = {
    init: function() {
        AV['bst-operations']._insertionValues = AV['bst-operations']._generateValues();
        var layout = AV['bst-operations']._computeLayout(AV['bst-operations']._insertionValues);
        AV.renderGraph(layout.nodes, layout.edges);
        AV.state._isTreeAlgorithm = true;

        var svg = document.querySelector('.av-graph-svg');
        if (svg) svg.setAttribute('class', svg.getAttribute('class') + ' av-tree-svg');

        layout.nodes.forEach(function(n) {
            AV.setNodeState(n.id, 'pending');
        });

        document.querySelectorAll('.av-edge').forEach(function(e) {
            e.setAttribute('class', 'av-edge av-edge-pending');
        });

        var panel = document.querySelector('.av-queue-panel');
        if (panel) panel.remove();

        AV._renderInsertBanner(null);
        AV._setTreeStatLabels();
    },

    steps: function() {
        var values = AV['bst-operations']._insertionValues;
        var steps = [];
        var tree = {};
        var root = null;

        for (var i = 0; i < values.length; i++) {
            var val = values[i];
            steps.push({ type: 'INSERT_START', value: val });

            if (root === null) {
                root = val;
                tree[val] = { left: null, right: null };
                steps.push({ type: 'TREE_PLACE', value: val, parentNode: null, direction: 'root' });
                continue;
            }

            var current = root;
            while (true) {
                steps.push({ type: 'TREE_COMPARE', value: val, nodeValue: current });

                if (val < current) {
                    steps.push({ type: 'TREE_GO_LEFT', value: val, fromNode: current });
                    if (tree[current].left === null) {
                        tree[current].left = val;
                        tree[val] = { left: null, right: null };
                        steps.push({ type: 'TREE_PLACE', value: val, parentNode: current, direction: 'left' });
                        break;
                    }
                    current = tree[current].left;
                } else {
                    steps.push({ type: 'TREE_GO_RIGHT', value: val, fromNode: current });
                    if (tree[current].right === null) {
                        tree[current].right = val;
                        tree[val] = { left: null, right: null };
                        steps.push({ type: 'TREE_PLACE', value: val, parentNode: current, direction: 'right' });
                        break;
                    }
                    current = tree[current].right;
                }
            }
        }

        steps.push({ type: 'COMPLETE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('bst-operations.stepLabel', null, 'BST \u2014 Insert') };
    },

    run: function() {
        AV['bst-operations'].insert.init();
        AV.animateFlow(
            AV['bst-operations'].insert.steps(),
            AV['bst-operations'].insert.stepOptions()
        );
    }
};
