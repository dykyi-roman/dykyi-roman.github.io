/* ===== Counting Sort Algorithm ===== */

AV['counting-sort'] = {};

AV['counting-sort'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Counts occurrences of each value, computes a cumulative (prefix) sum, then places each element into its final output position \u2014 O(n+k), non-comparison-based and stable.' }
];

AV['counting-sort'].depRules = [
    { name: 'Time (Best/Avg/Worst)', role: 'O(n + k) \u2014 linear in input size and value range', type: 'good' },
    { name: 'Space', role: 'O(n + k) \u2014 count array + output array', type: 'bad' },
    { name: 'Stable', role: 'Yes \u2014 right-to-left placement preserves relative order', type: 'good' },
    { name: 'Adaptive', role: 'No \u2014 always O(n+k) regardless of input order', type: 'info' },
    { name: 'Input Constraint', role: 'Integer keys with bounded range k', type: 'bad' },
    { name: 'In-Place', role: 'No \u2014 requires auxiliary count and output arrays', type: 'bad' }
];

AV['counting-sort'].details = {
    standard: {
        principles: [
            'Identify the range of values k in the input (e.g., 1..9)',
            'Phase 1 \u2014 Count: iterate input; increment count[value] for each element',
            'Phase 2 \u2014 Cumulative Sum: convert count array to prefix sums so count[v] is the last output position of value v',
            'Phase 3 \u2014 Place: scan input right-to-left; for each element v, place it at output[count[v]-1] and decrement count[v]',
            'Right-to-left scan is essential for stability \u2014 equal keys keep their original relative order'
        ],
        concepts: [
            { term: 'Count Array', definition: 'Auxiliary array of size k+1 that records the frequency of each distinct value. After the counting phase, count[v] = number of occurrences of v in the input.' },
            { term: 'Cumulative Sum (Prefix)', definition: 'Transforms count[] so that count[v] equals the number of elements less-than-or-equal-to v. This gives the one-past-last output position for each value.' },
            { term: 'Stable Placement', definition: 'Scanning input right-to-left and decrementing count[v] after each placement ensures equal keys keep their original order \u2014 a prerequisite for using Counting Sort as a sub-routine in Radix Sort.' },
            { term: 'Non-Comparison Sort', definition: 'No element-to-element comparisons are performed \u2014 Counting Sort relies on value identity as an index. This bypasses the \u03A9(n log n) comparison-sort lower bound.' }
        ],
        tradeoffs: {
            pros: [
                'O(n + k) time \u2014 linear when k is bounded',
                'Stable sorting \u2014 preserves relative order of equal keys',
                'Simple to implement \u2014 three clean phases',
                'Acts as the stable inner sort for Radix Sort',
                'Predictable: performance independent of input order'
            ],
            cons: [
                'Only works on integer keys (or keys mappable to integers)',
                'O(k) extra space \u2014 impractical if k >> n (e.g., sorting by 32-bit integers directly)',
                'Not in-place \u2014 requires a separate output array',
                'Not useful for general comparable data (strings, custom objects without ordering keys)'
            ],
            whenToUse: 'Use Counting Sort when keys are small integers within a bounded range (k = O(n)), when stability is required, or as the inner sort in Radix Sort. Avoid when the value range k is much larger than the input size n.'
        }
    }
};

AV['counting-sort'].legendItems = [
    { swatch: 'av-legend-default', i18nKey: 'av.legend.default' },
    { swatch: 'av-legend-scanning', i18nKey: 'av.legend.cs_reading' },
    { swatch: 'av-legend-count-active', i18nKey: 'av.legend.cs_count_active' },
    { swatch: 'av-legend-sorted', i18nKey: 'av.legend.sorted' }
];

/* ===== Helpers: Count Array UI ===== */

AV['counting-sort']._injectCountArray = function(k) {
    AV['counting-sort']._removeCountArray();

    var vizArea = document.getElementById('viz-area');
    if (!vizArea) return;

    var container = document.createElement('div');
    container.className = 'av-count-container';

    var label = document.createElement('div');
    label.className = 'av-count-label';
    label.textContent = I18N.t('av.cs.count_label', null, 'count[ ]');
    container.appendChild(label);

    for (var i = 0; i <= k; i++) {
        var cell = document.createElement('div');
        cell.className = 'av-count-cell';
        cell.setAttribute('data-index', String(i));
        cell.innerHTML = '<span class="av-count-cell-index">' + i + '</span>' +
                         '<span class="av-count-cell-value">0</span>';
        container.appendChild(cell);
    }

    vizArea.appendChild(container);
};

AV['counting-sort']._removeCountArray = function() {
    var existing = document.querySelector('.av-count-container');
    if (existing) existing.remove();
};

AV['counting-sort']._updateCountCell = function(index, value, className) {
    var cell = document.querySelector('.av-count-cell[data-index="' + index + '"]');
    if (!cell) return;
    var valSpan = cell.querySelector('.av-count-cell-value');
    if (valSpan) valSpan.textContent = String(value);
    if (className) cell.classList.add(className);
};

AV['counting-sort']._clearCountHighlights = function() {
    document.querySelectorAll('.av-count-cell').forEach(function(cell) {
        cell.classList.remove('av-count-incrementing', 'av-count-cumulative', 'av-count-reading');
    });
};

AV['counting-sort']._applyCountSnapshot = function(countState) {
    if (!countState) return;
    for (var i = 0; i < countState.length; i++) {
        var cell = document.querySelector('.av-count-cell[data-index="' + i + '"]');
        if (!cell) continue;
        var valSpan = cell.querySelector('.av-count-cell-value');
        if (valSpan) valSpan.textContent = String(countState[i]);
        cell.classList.remove('av-count-incrementing', 'av-count-cumulative', 'av-count-reading');
    }
};

/* ===== Array Generation ===== */

AV['counting-sort']._generateArray = function(n, maxVal) {
    var arr = [];
    for (var i = 0; i < n; i++) {
        arr.push(Math.floor(Math.random() * maxVal) + 1);
    }
    return arr;
};

/* ---------- Mode: standard ---------- */

AV['counting-sort'].standard = {
    init: function() {
        var maxVal = 9;
        var n = 15;
        var arr = AV['counting-sort']._generateArray(n, maxVal);
        AV.state._initialArray = arr.slice();
        AV.state._csMaxVal = maxVal;

        AV.renderArray(arr);
        AV['counting-sort']._injectCountArray(maxVal);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var maxVal = AV.state._csMaxVal || 9;
        var n = arr.length;
        var steps = [];

        var count = new Array(maxVal + 1).fill(0);

        /* Phase 1: Count occurrences */
        steps.push({ type: 'PASS', pass: 1, phase: 'count' });
        for (var i = 0; i < n; i++) {
            count[arr[i]]++;
            steps.push({
                type: 'CS_COUNT_INCR',
                inputIndex: i,
                inputValue: arr[i],
                countIndex: arr[i],
                newCount: count[arr[i]],
                countState: count.slice()
            });
        }

        /* Phase 2: Cumulative sum */
        steps.push({ type: 'PASS', pass: 2, phase: 'cumulative' });
        for (var j = 1; j <= maxVal; j++) {
            var prev = count[j];
            count[j] += count[j - 1];
            steps.push({
                type: 'CS_CUMULATIVE',
                countIndex: j,
                prevValue: prev,
                newValue: count[j],
                countState: count.slice()
            });
        }

        /* Phase 3: Placement (right-to-left for stability) */
        steps.push({ type: 'PASS', pass: 3, phase: 'place' });
        var output = new Array(n);
        for (var p = n - 1; p >= 0; p--) {
            var v = arr[p];
            var outIdx = count[v] - 1;
            output[outIdx] = v;
            count[v]--;
            steps.push({
                type: 'CS_PLACE',
                inputIndex: p,
                inputValue: v,
                countIndex: v,
                outputIndex: outIdx,
                newCount: count[v],
                countState: count.slice()
            });
        }

        /* Mark all positions as sorted */
        for (var s = 0; s < n; s++) {
            steps.push({ type: 'SORTED', index: s, value: output[s] });
        }
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('counting-sort.stepLabel', null, 'Counting Sort \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV['counting-sort']._injectCountArray(AV.state._csMaxVal || 9);
        AV.animateFlow(
            AV['counting-sort'].standard.steps(),
            AV['counting-sort'].standard.stepOptions()
        );
    }
};
