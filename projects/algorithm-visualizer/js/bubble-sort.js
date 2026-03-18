/* ===== Bubble Sort Algorithm ===== */

AV['bubble-sort'] = {};

AV['bubble-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Bubble Sort: repeatedly steps through the array, compares adjacent elements, and swaps them if they are in the wrong order. Each pass bubbles the largest unsorted element to its correct position.' }
];

AV['bubble-sort'].depRules = [
    { name: 'Time (Best)', role: 'O(n) — already sorted array', type: 'good' },
    { name: 'Time (Average)', role: 'O(n\u00B2) — quadratic', type: 'bad' },
    { name: 'Time (Worst)', role: 'O(n\u00B2) — reverse sorted', type: 'bad' },
    { name: 'Space', role: 'O(1) — in-place sorting', type: 'good' },
    { name: 'Stable', role: 'Yes — equal elements maintain relative order', type: 'good' },
    { name: 'Adaptive', role: 'Yes — faster on nearly sorted data', type: 'good' }
];

AV['bubble-sort'].details = {
    standard: {
        principles: [
            'Compare adjacent elements pairwise from left to right',
            'Swap if the left element is greater than the right element',
            'After each pass, the largest unsorted element "bubbles up" to its final position',
            'Optimization: if no swaps occur during a pass, the array is already sorted — stop early',
            'Each pass reduces the unsorted portion by one element'
        ],
        concepts: [
            { term: 'Pass', definition: 'One complete traversal of the unsorted portion of the array. After pass k, the k-th largest element is in its correct position.' },
            { term: 'Adjacent Swap', definition: 'The fundamental operation: compare arr[j] with arr[j+1] and swap if arr[j] > arr[j+1]. This moves larger values toward the end.' },
            { term: 'Early Termination', definition: 'If a complete pass produces no swaps, the array is sorted. This optimization gives O(n) best-case time for already-sorted input.' },
            { term: 'Stable Sort', definition: 'Bubble Sort never swaps equal elements (only swaps when strictly greater), preserving the relative order of equal values.' }
        ],
        tradeoffs: {
            pros: [
                'Extremely simple to understand and implement',
                'Stable sorting algorithm — preserves order of equal elements',
                'In-place — requires only O(1) extra memory',
                'Adaptive — performs well on nearly sorted data with early termination',
                'Good for educational purposes and small datasets'
            ],
            cons: [
                'O(n\u00B2) average and worst case — very slow for large arrays',
                'Significantly slower than O(n log n) algorithms like Merge Sort or Quick Sort',
                'Many unnecessary comparisons even when elements are far from their target position',
                'Poor cache performance due to sequential access pattern with many swaps'
            ],
            whenToUse: 'Best for educational purposes, very small arrays (< 50 elements), or nearly sorted data where early termination provides a real benefit. For production use with large datasets, prefer Quick Sort, Merge Sort, or Tim Sort.'
        }
    }
};

/* ---------- Mode: standard ---------- */

AV['bubble-sort'].standard = {
    init: function() {
        var arr = AV.generateRandomArray(20, 5, 99);
        AV.state._initialArray = arr.slice();
        AV.renderArray(arr);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var n = arr.length;
        var steps = [];

        for (var i = 0; i < n - 1; i++) {
            steps.push({ type: 'PASS', pass: i + 1 });
            var swapped = false;

            for (var j = 0; j < n - 1 - i; j++) {
                steps.push({
                    type: 'COMPARE',
                    indices: [j, j + 1],
                    values: [arr[j], arr[j + 1]]
                });

                if (arr[j] > arr[j + 1]) {
                    var tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                    swapped = true;

                    steps.push({
                        type: 'SWAP',
                        indices: [j, j + 1],
                        values: [arr[j], arr[j + 1]]
                    });
                }
            }

            steps.push({
                type: 'SORTED',
                index: n - 1 - i,
                value: arr[n - 1 - i]
            });

            if (!swapped) break;
        }

        /* Mark first element as sorted too */
        steps.push({ type: 'SORTED', index: 0, value: arr[0] });
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('bubble-sort.stepLabel', null, 'Bubble Sort — Standard') };
    },

    run: function() {
        /* Re-render from initial array before running */
        AV.renderArray(AV.state._initialArray.slice());
        AV.animateFlow(
            AV['bubble-sort'].standard.steps(),
            AV['bubble-sort'].standard.stepOptions()
        );
    }
};
