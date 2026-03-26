/* ===== Selection Sort Algorithm ===== */

AV['selection-sort'] = {};

AV['selection-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Selection Sort: finds the minimum element in the unsorted portion and swaps it with the first unsorted element. Each pass places one element in its final position with at most one swap.' }
];

AV['selection-sort'].depRules = [
    { name: 'Time (Best)', role: 'O(n\u00B2) \u2014 always scans entire unsorted portion', type: 'bad' },
    { name: 'Time (Average)', role: 'O(n\u00B2) \u2014 quadratic', type: 'bad' },
    { name: 'Time (Worst)', role: 'O(n\u00B2) \u2014 quadratic', type: 'bad' },
    { name: 'Space', role: 'O(1) \u2014 in-place sorting', type: 'good' },
    { name: 'Stable', role: 'No \u2014 swaps can change relative order of equal elements', type: 'bad' },
    { name: 'Swaps', role: 'O(n) \u2014 at most n\u22121 swaps (fewer than Bubble Sort)', type: 'good' }
];

AV['selection-sort'].details = {
    standard: {
        principles: [
            'Divide the array into sorted (left) and unsorted (right) portions',
            'Find the minimum element in the unsorted portion by scanning left to right',
            'Swap the minimum with the first unsorted element',
            'Move the sorted boundary one position to the right',
            'Repeat until the entire array is sorted'
        ],
        concepts: [
            { term: 'Selection', definition: 'The core operation: scan the unsorted portion to find the minimum element. This requires n\u2212i\u22121 comparisons in pass i.' },
            { term: 'In-place', definition: 'Selection Sort uses only O(1) extra memory \u2014 a single variable to track the minimum index. No auxiliary arrays needed.' },
            { term: 'Unstable', definition: 'Swapping the minimum to the front can jump over equal elements, changing their relative order. For example, [2a, 2b, 1] becomes [1, 2b, 2a].' },
            { term: 'Minimum Swaps', definition: 'Each pass performs at most one swap, giving exactly n\u22121 swaps in the worst case. This is optimal and far fewer than Bubble Sort.' }
        ],
        tradeoffs: {
            pros: [
                'Simple to understand and implement',
                'Minimizes the number of swaps \u2014 O(n) swaps vs O(n\u00B2) for Bubble Sort',
                'In-place \u2014 requires only O(1) extra memory',
                'Performance is predictable \u2014 always O(n\u00B2) regardless of input order',
                'Good when writes/swaps are expensive (e.g., flash memory)'
            ],
            cons: [
                'O(n\u00B2) in all cases \u2014 no best-case improvement for sorted input',
                'Not stable \u2014 equal elements may change relative order',
                'Not adaptive \u2014 does not benefit from partially sorted data',
                'Significantly slower than O(n log n) algorithms for large datasets'
            ],
            whenToUse: 'Best when swap cost is high and comparison cost is low, for small datasets, or when simplicity is valued over performance. When stability matters, prefer Insertion Sort. For large datasets, prefer Quick Sort, Merge Sort, or Tim Sort.'
        }
    }
};

/* ---------- Mode: standard ---------- */

AV['selection-sort'].standard = {
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
            var minIdx = i;

            for (var j = i + 1; j < n; j++) {
                steps.push({
                    type: 'COMPARE',
                    indices: [j, minIdx],
                    values: [arr[j], arr[minIdx]]
                });

                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }

            if (minIdx !== i) {
                var tmp = arr[i];
                arr[i] = arr[minIdx];
                arr[minIdx] = tmp;

                steps.push({
                    type: 'SWAP',
                    indices: [i, minIdx],
                    values: [arr[i], arr[minIdx]]
                });
            }

            steps.push({
                type: 'SORTED',
                index: i,
                value: arr[i]
            });
        }

        /* Mark last element as sorted too */
        steps.push({ type: 'SORTED', index: n - 1, value: arr[n - 1] });
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('selection-sort.stepLabel', null, 'Selection Sort \u2014 Standard') };
    },

    run: function() {
        /* Re-render from initial array before running */
        AV.renderArray(AV.state._initialArray.slice());
        AV.animateFlow(
            AV['selection-sort'].standard.steps(),
            AV['selection-sort'].standard.stepOptions()
        );
    }
};
