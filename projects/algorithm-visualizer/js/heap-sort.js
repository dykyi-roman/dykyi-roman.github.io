/* ===== Heap Sort Algorithm ===== */

AV['heap-sort'] = {};

AV['heap-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Max-Heap based Heap Sort: builds a max-heap from the array, then repeatedly extracts the maximum element and places it at the end. Uses sift-down to restore the heap property after each extraction. Guarantees O(n log n) in all cases with O(1) extra space.' }
];

AV['heap-sort'].depRules = [
    { name: 'Time (Best)', role: 'O(n log n) \u2014 always builds heap and extracts', type: 'good' },
    { name: 'Time (Average)', role: 'O(n log n) \u2014 guaranteed', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n log n) \u2014 no degradation', type: 'good' },
    { name: 'Space', role: 'O(1) \u2014 in-place sorting', type: 'good' },
    { name: 'Stable', role: 'No \u2014 heap operations may reorder equal elements', type: 'bad' },
    { name: 'Adaptive', role: 'No \u2014 always O(n log n) regardless of input', type: 'info' }
];

AV['heap-sort'].details = {
    standard: {
        principles: [
            'Build a max-heap from the unsorted array using bottom-up heapify',
            'The max-heap property ensures every parent node is greater than or equal to its children',
            'Repeatedly extract the maximum element (root) and place it at the end of the array',
            'After each extraction, restore the heap property with a sift-down operation from the root',
            'Array indices encode the tree implicitly: for node at index i, left child = 2i+1, right child = 2i+2'
        ],
        concepts: [
            { term: 'Binary Heap', definition: 'A complete binary tree stored in an array where every parent \u2265 its children (max-heap). The root at index 0 always holds the maximum value.' },
            { term: 'Heapify (Sift-Down)', definition: 'Starting at a node, compare with both children and swap with the larger child if necessary. Repeat down the tree until the heap property is restored. O(log n) per call.' },
            { term: 'Build Heap', definition: 'Process all non-leaf nodes from bottom to top, calling heapify on each. Despite n/2 calls to heapify, the total work is O(n) due to decreasing tree heights at lower levels.' },
            { term: 'Extract Max', definition: 'Swap the root (maximum) with the last unsorted element, reduce the heap size by one, and sift-down the new root. Each extraction costs O(log n).' }
        ],
        tradeoffs: {
            pros: [
                'Guaranteed O(n log n) time in all cases \u2014 no worst-case degradation',
                'In-place sorting \u2014 only O(1) extra memory',
                'No worst-case degradation unlike Quick Sort on sorted input',
                'Combines best of Merge Sort (guaranteed performance) and Quick Sort (in-place)',
                'Often used as the fallback in Introsort to guarantee worst-case bounds'
            ],
            cons: [
                'Not stable \u2014 equal elements may change relative order during heap operations',
                'Poor cache locality due to non-sequential parent-child memory access patterns',
                'Typically slower than Quick Sort in practice due to higher constant factors',
                'More complex to implement correctly than simpler O(n\u00B2) algorithms'
            ],
            whenToUse: 'Use when guaranteed O(n log n) worst-case is required with O(1) space. Ideal for systems with strict memory constraints. Often part of Introsort (hybrid with Quick Sort). Prefer Quick Sort for average-case speed, Merge Sort when stability is needed.'
        }
    }
};

/* ---------- Mode: standard ---------- */

AV['heap-sort'].standard = {
    init: function() {
        var arr = AV.generateRandomArray(20, 5, 99);
        AV.state._initialArray = arr.slice();
        AV.renderArray(arr);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var n = arr.length;
        var steps = [];

        function siftDown(heapSize, root) {
            var largest = root;
            var left = 2 * root + 1;
            var right = 2 * root + 2;

            if (left < heapSize) {
                steps.push({
                    type: 'HEAP_COMPARE',
                    indices: [largest, left],
                    values: [arr[largest], arr[left]],
                    isLeft: true
                });
                if (arr[left] > arr[largest]) {
                    largest = left;
                }
            }

            if (right < heapSize) {
                steps.push({
                    type: 'HEAP_COMPARE',
                    indices: [largest, right],
                    values: [arr[largest], arr[right]],
                    isLeft: false
                });
                if (arr[right] > arr[largest]) {
                    largest = right;
                }
            }

            if (largest !== root) {
                steps.push({
                    type: 'HEAP_SWAP',
                    indices: [root, largest],
                    values: [arr[root], arr[largest]],
                    extract: false
                });
                var tmp = arr[root];
                arr[root] = arr[largest];
                arr[largest] = tmp;

                siftDown(heapSize, largest);
            }
        }

        /* Phase 1: Build Max-Heap */
        steps.push({ type: 'HEAP_PHASE', phase: 'build' });

        for (var i = Math.floor(n / 2) - 1; i >= 0; i--) {
            siftDown(n, i);
        }

        /* Phase 2: Extract max elements one by one */
        steps.push({ type: 'HEAP_PHASE', phase: 'extract' });

        for (var end = n - 1; end > 0; end--) {
            /* Swap root (max) with last unsorted element */
            steps.push({
                type: 'HEAP_SWAP',
                indices: [0, end],
                values: [arr[0], arr[end]],
                extract: true
            });
            var tmp = arr[0];
            arr[0] = arr[end];
            arr[end] = tmp;

            /* Mark extracted position as sorted */
            steps.push({ type: 'SORTED', index: end, value: arr[end] });

            /* Re-heapify the reduced heap */
            siftDown(end, 0);
        }

        /* Last remaining element is sorted */
        steps.push({ type: 'SORTED', index: 0, value: arr[0] });
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('heap-sort.stepLabel', null, 'Heap Sort \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV.animateFlow(
            AV['heap-sort'].standard.steps(),
            AV['heap-sort'].standard.stepOptions()
        );
    }
};
