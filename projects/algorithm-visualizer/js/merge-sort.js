/* ===== Merge Sort Algorithm ===== */

AV['merge-sort'] = {};

AV['merge-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic top-down Merge Sort: recursively divides the array in half until sub-arrays have one element, then merges pairs of sorted sub-arrays back together by comparing and placing elements in order.' }
];

AV['merge-sort'].depRules = [
    { name: 'Time (Best)', role: 'O(n log n) \u2014 always divides and merges', type: 'good' },
    { name: 'Time (Average)', role: 'O(n log n) \u2014 guaranteed', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n log n) \u2014 no degradation', type: 'good' },
    { name: 'Space', role: 'O(n) \u2014 auxiliary array for merging', type: 'bad' },
    { name: 'Stable', role: 'Yes \u2014 equal elements maintain relative order', type: 'good' },
    { name: 'Adaptive', role: 'No \u2014 always O(n log n) regardless of input', type: 'info' }
];

AV['merge-sort'].details = {
    standard: {
        principles: [
            'Recursively divide the array into two halves until each sub-array has one element',
            'A single-element sub-array is inherently sorted (base case)',
            'Merge two sorted sub-arrays by comparing their front elements and placing the smaller one first',
            'Continue merging until all elements are combined into one fully sorted array',
            'The divide step takes O(log n) levels; each level does O(n) work during merges'
        ],
        concepts: [
            { term: 'Divide', definition: 'Split the array at the midpoint into left and right halves. This continues recursively until sub-arrays have one element each.' },
            { term: 'Conquer (Merge)', definition: 'Combine two sorted sub-arrays into one sorted array by repeatedly picking the smaller front element. Requires O(n) auxiliary space for temporary storage.' },
            { term: 'Stable Sort', definition: 'When left and right elements are equal, the left element is placed first, preserving the original relative order of equal values.' },
            { term: 'Guaranteed O(n log n)', definition: 'Unlike Quick Sort, Merge Sort always divides evenly and always does O(n) work per level. There is no worst-case degradation.' }
        ],
        tradeoffs: {
            pros: [
                'Guaranteed O(n log n) time in all cases \u2014 no worst-case degradation',
                'Stable sorting algorithm \u2014 preserves order of equal elements',
                'Excellent for sorting linked lists \u2014 no random access needed',
                'Predictable performance \u2014 not sensitive to input order',
                'Natural choice for external sorting (sorting data too large for memory)'
            ],
            cons: [
                'Requires O(n) auxiliary space for merging \u2014 not in-place',
                'Slower than Quick Sort in practice due to higher constant factors and cache misses',
                'Overhead of recursive function calls for small sub-arrays',
                'Memory allocation for temporary arrays can be expensive'
            ],
            whenToUse: 'Use Merge Sort when stability is required, when guaranteed O(n log n) worst-case is needed, for linked lists, or for external sorting. For in-memory arrays where space is a concern, prefer Quick Sort.'
        }
    }
};

/* ---------- Mode: standard ---------- */

AV['merge-sort'].standard = {
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

        function mergeSort(left, right) {
            if (right - left <= 1) return;
            var mid = Math.floor((left + right) / 2);
            mergeSort(left, mid);
            mergeSort(mid, right);
            merge(left, mid, right);
        }

        function merge(left, mid, right) {
            passCounter++;
            steps.push({ type: 'PASS', pass: passCounter });

            var leftArr = arr.slice(left, mid);
            var rightArr = arr.slice(mid, right);
            var i = 0, j = 0, k = left;

            while (i < leftArr.length && j < rightArr.length) {
                steps.push({
                    type: 'COMPARE',
                    indices: [left + i, mid + j],
                    values: [leftArr[i], rightArr[j]]
                });

                if (leftArr[i] <= rightArr[j]) {
                    arr[k] = leftArr[i];
                    steps.push({ type: 'OVERWRITE', index: k, value: leftArr[i] });
                    i++;
                } else {
                    arr[k] = rightArr[j];
                    steps.push({ type: 'OVERWRITE', index: k, value: rightArr[j] });
                    j++;
                }
                k++;
            }

            while (i < leftArr.length) {
                arr[k] = leftArr[i];
                steps.push({ type: 'OVERWRITE', index: k, value: leftArr[i] });
                i++;
                k++;
            }

            while (j < rightArr.length) {
                arr[k] = rightArr[j];
                steps.push({ type: 'OVERWRITE', index: k, value: rightArr[j] });
                j++;
                k++;
            }
        }

        mergeSort(0, n);

        for (var s = 0; s < n; s++) {
            steps.push({ type: 'SORTED', index: s, value: arr[s] });
        }
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('merge-sort.stepLabel', null, 'Merge Sort \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV.animateFlow(
            AV['merge-sort'].standard.steps(),
            AV['merge-sort'].standard.stepOptions()
        );
    }
};
