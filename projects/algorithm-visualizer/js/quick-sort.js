/* ===== Quick Sort Algorithm ===== */

AV['quick-sort'] = {};

AV['quick-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Quick Sort with Lomuto partition: selects the last element as pivot, partitions the array so that elements smaller than pivot are on the left and larger on the right, then recursively sorts both sides.' }
];

AV['quick-sort'].depRules = [
    { name: 'Time (Best)', role: 'O(n log n) \u2014 balanced partitions', type: 'good' },
    { name: 'Time (Average)', role: 'O(n log n) \u2014 expected with random data', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n\u00B2) \u2014 already sorted or all equal elements', type: 'bad' },
    { name: 'Space', role: 'O(log n) \u2014 recursion stack depth', type: 'good' },
    { name: 'Stable', role: 'No \u2014 partitioning may change relative order of equal elements', type: 'bad' },
    { name: 'Adaptive', role: 'No \u2014 performance depends on pivot selection, not input order', type: 'info' }
];

AV['quick-sort'].details = {
    standard: {
        principles: [
            'Choose a pivot element (here: last element in the sub-array)',
            'Partition: rearrange so all elements \u2264 pivot are on the left, all > pivot are on the right',
            'Place the pivot in its final sorted position between the two groups',
            'Recursively apply the same process to the left and right sub-arrays',
            'Base case: sub-arrays of size 0 or 1 are already sorted'
        ],
        concepts: [
            { term: 'Pivot', definition: 'The element chosen to divide the array. After partitioning, the pivot is in its final sorted position. Lomuto scheme uses the last element.' },
            { term: 'Partition (Lomuto)', definition: 'Scans left to right maintaining a boundary index i. When an element \u2264 pivot is found, it is swapped to position i and i advances. After the scan, the pivot is swapped to position i.' },
            { term: 'In-place', definition: 'Quick Sort partitions within the original array using only O(log n) stack space for recursion, unlike Merge Sort which requires O(n) auxiliary space.' },
            { term: 'Divide and Conquer', definition: 'The array is divided by the pivot into two independent sub-problems. Each sub-array is sorted recursively. No merge step is needed because partitioning places elements in the correct relative order.' }
        ],
        tradeoffs: {
            pros: [
                'Fastest general-purpose sorting in practice \u2014 excellent cache locality',
                'In-place \u2014 only O(log n) extra space for recursion stack',
                'Average O(n log n) with small constant factors',
                'Widely used in standard libraries (C qsort, Java Arrays.sort for primitives)',
                'Easy to parallelize \u2014 sub-arrays are independent after partitioning'
            ],
            cons: [
                'O(n\u00B2) worst case on already sorted or nearly sorted input (Lomuto scheme)',
                'Not stable \u2014 equal elements may be reordered',
                'Performance highly dependent on pivot selection',
                'Recursion depth can reach O(n) in worst case, risking stack overflow'
            ],
            whenToUse: 'Best general-purpose sort for in-memory arrays. Prefer over Merge Sort when auxiliary space is limited. Avoid on nearly sorted data without randomized pivot. For stability, use Merge Sort. For small arrays, Insertion Sort is faster.'
        }
    }
};

/* ---------- Mode: standard ---------- */

AV['quick-sort'].standard = {
    init: function() {
        var arr = AV.generateRandomArray(20, 5, 99);
        AV.state._initialArray = arr.slice();
        AV.renderArray(arr);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var n = arr.length;
        var steps = [];
        var passCounter = 0;

        function quickSort(low, high) {
            if (low >= high) return;
            var pivotIndex = partition(low, high);
            quickSort(low, pivotIndex - 1);
            quickSort(pivotIndex + 1, high);
        }

        function partition(low, high) {
            passCounter++;
            steps.push({ type: 'PASS', pass: passCounter });

            var pivot = arr[high];
            var i = low;

            for (var j = low; j < high; j++) {
                steps.push({
                    type: 'COMPARE',
                    indices: [j, high],
                    values: [arr[j], pivot]
                });

                if (arr[j] <= pivot) {
                    if (i !== j) {
                        var tmp = arr[i];
                        arr[i] = arr[j];
                        arr[j] = tmp;

                        steps.push({
                            type: 'SWAP',
                            indices: [i, j],
                            values: [arr[i], arr[j]]
                        });
                    }
                    i++;
                }
            }

            if (i !== high) {
                var tmp2 = arr[i];
                arr[i] = arr[high];
                arr[high] = tmp2;

                steps.push({
                    type: 'SWAP',
                    indices: [i, high],
                    values: [arr[i], arr[high]]
                });
            }

            steps.push({ type: 'SORTED', index: i, value: arr[i] });
            return i;
        }

        quickSort(0, n - 1);

        /* Mark any remaining unsorted positions (single-element partitions) */
        for (var s = 0; s < n; s++) {
            steps.push({ type: 'SORTED', index: s, value: arr[s] });
        }
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('quick-sort.stepLabel', null, 'Quick Sort \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV.animateFlow(
            AV['quick-sort'].standard.steps(),
            AV['quick-sort'].standard.stepOptions()
        );
    }
};