/* ===== Insertion Sort Algorithm ===== */

AV['insertion-sort'] = {};

AV['insertion-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Insertion Sort: builds a sorted portion from left to right by taking each element and inserting it into its correct position among the already-sorted elements by shifting larger elements one position to the right.' }
];

AV['insertion-sort'].depRules = [
    { name: 'Time (Best)', role: 'O(n) \u2014 already sorted array', type: 'good' },
    { name: 'Time (Average)', role: 'O(n\u00B2) \u2014 quadratic', type: 'bad' },
    { name: 'Time (Worst)', role: 'O(n\u00B2) \u2014 reverse sorted', type: 'bad' },
    { name: 'Space', role: 'O(1) \u2014 in-place sorting', type: 'good' },
    { name: 'Stable', role: 'Yes \u2014 equal elements maintain relative order', type: 'good' },
    { name: 'Adaptive', role: 'Yes \u2014 faster on nearly sorted data', type: 'good' }
];

AV['insertion-sort'].details = {
    standard: {
        principles: [
            'Start with the first element as a sorted portion of size one',
            'Take the next unsorted element (key) and compare it leftward with sorted elements',
            'Shift each sorted element that is greater than the key one position to the right',
            'Insert the key into the vacated position',
            'Repeat until all elements are in the sorted portion'
        ],
        concepts: [
            { term: 'Key', definition: 'The current element being inserted into the sorted portion. In pass i, the key is arr[i], and it is compared against elements arr[i\u22121], arr[i\u22122], \u2026 until its correct position is found.' },
            { term: 'Shifting', definition: 'Moving sorted elements one position to the right to make room for the key. Equivalent to a series of adjacent swaps moving the key leftward.' },
            { term: 'Stable Sort', definition: 'Insertion Sort only swaps when strictly greater (not equal), so equal elements preserve their original relative order.' },
            { term: 'Adaptive', definition: 'On nearly sorted input, the inner loop terminates early for most elements, giving O(n) best-case time. The fewer inversions, the faster it runs.' }
        ],
        tradeoffs: {
            pros: [
                'Simple to understand and implement',
                'Stable sorting algorithm \u2014 preserves order of equal elements',
                'In-place \u2014 requires only O(1) extra memory',
                'Adaptive \u2014 very efficient on nearly sorted or small datasets',
                'Online \u2014 can sort elements as they are received'
            ],
            cons: [
                'O(n\u00B2) average and worst case \u2014 slow for large arrays',
                'Significantly slower than O(n log n) algorithms like Merge Sort or Quick Sort',
                'Many shifts required when elements are far from their target position',
                'Performance degrades significantly on reverse-sorted data'
            ],
            whenToUse: 'Best for small arrays (< 50 elements), nearly sorted data, or as the base case in hybrid algorithms like Tim Sort. Preferred over Selection Sort when stability is required. For large datasets, prefer Quick Sort, Merge Sort, or Tim Sort.'
        }
    }
};

/* ---------- Mode: standard ---------- */

AV['insertion-sort'].standard = {
    init: function() {
        var arr = AV.generateRandomArray(20, 5, 99);
        AV.state._initialArray = arr.slice();
        AV.renderArray(arr);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var n = arr.length;
        var steps = [];

        for (var i = 1; i < n; i++) {
            steps.push({ type: 'PASS', pass: i });
            var j = i;

            while (j > 0) {
                steps.push({
                    type: 'COMPARE',
                    indices: [j - 1, j],
                    values: [arr[j - 1], arr[j]]
                });

                if (arr[j - 1] > arr[j]) {
                    var tmp = arr[j - 1];
                    arr[j - 1] = arr[j];
                    arr[j] = tmp;

                    steps.push({
                        type: 'SWAP',
                        indices: [j - 1, j],
                        values: [arr[j - 1], arr[j]]
                    });

                    j--;
                } else {
                    break;
                }
            }

            steps.push({
                type: 'SORTED',
                index: i,
                value: arr[i]
            });
        }

        steps.push({ type: 'SORTED', index: 0, value: arr[0] });
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('insertion-sort.stepLabel', null, 'Insertion Sort \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV.animateFlow(
            AV['insertion-sort'].standard.steps(),
            AV['insertion-sort'].standard.stepOptions()
        );
    }
};
