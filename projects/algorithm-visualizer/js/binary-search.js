/* ===== Binary Search Algorithm ===== */

AV['binary-search'] = {};

AV['binary-search'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Binary Search: repeatedly divides a sorted array in half, comparing the middle element with the target. Eliminates half the remaining elements with each comparison, achieving O(log n) time.' }
];

AV['binary-search'].depRules = [
    { name: 'Time (Best)', role: 'O(1) \u2014 target is the middle element', type: 'good' },
    { name: 'Time (Average)', role: 'O(log n) \u2014 logarithmic', type: 'good' },
    { name: 'Time (Worst)', role: 'O(log n) \u2014 target absent or at boundary', type: 'info' },
    { name: 'Space', role: 'O(1) \u2014 iterative, no extra memory', type: 'good' },
    { name: 'Sorted Input Required', role: 'Yes \u2014 array must be pre-sorted', type: 'bad' },
    { name: 'Stable', role: 'N/A \u2014 search, not sort', type: 'info' }
];

AV['binary-search'].details = {
    standard: {
        principles: [
            'The array must be sorted before binary search can be applied',
            'Compare the target with the middle element of the current range',
            'If the target equals the middle element, the search is complete',
            'If the target is smaller, discard the right half and search the left',
            'If the target is larger, discard the left half and search the right'
        ],
        concepts: [
            { term: 'Divide and Conquer', definition: 'A strategy that splits a problem into smaller subproblems. Binary Search halves the search space with each comparison, reducing the problem size exponentially.' },
            { term: 'Search Space', definition: 'The range of indices [low..high] where the target may exist. Initially the entire array; shrinks by half after each comparison.' },
            { term: 'Mid-Point Calculation', definition: 'mid = floor((low + high) / 2). Picks the center of the current range. Using floor avoids overflow that (low + high) / 2 can cause in some languages.' },
            { term: 'Logarithmic Elimination', definition: 'Each comparison eliminates half the remaining elements. For n elements, at most \u2308log\u2082 n\u2309 + 1 comparisons are needed.' }
        ],
        tradeoffs: {
            pros: [
                'O(log n) time \u2014 extremely fast for large datasets',
                'O(1) extra space \u2014 no auxiliary data structures needed',
                'Simple and predictable \u2014 easy to analyze and implement',
                'Cache-friendly \u2014 accesses contiguous memory regions',
                'Optimal for sorted static data with frequent lookups'
            ],
            cons: [
                'Requires sorted input \u2014 sorting costs O(n log n) if not already sorted',
                'Not efficient for small arrays \u2014 linear search has lower overhead',
                'Poor for dynamic data \u2014 insertions/deletions break sorted order',
                'Only works with random-access data structures (arrays, not linked lists)'
            ],
            whenToUse: 'Best for large, sorted, static datasets with frequent search queries. If the data changes often, consider balanced BSTs or hash tables. For small arrays (n < 16), linear search may be faster due to lower overhead.'
        }
    }
};

AV['binary-search'].legendItems = [
    { swatch: 'av-legend-default', i18nKey: 'av.legend.default' },
    { swatch: 'av-legend-scanning', i18nKey: 'av.legend.checking' },
    { swatch: 'av-legend-examined', i18nKey: 'av.legend.eliminated' },
    { swatch: 'av-legend-found', i18nKey: 'av.legend.found' }
];

/* ---------- Mode: standard ---------- */

AV['binary-search'].standard = {
    init: function() {
        var arr;
        do {
            arr = AV.generateRandomArray(20, 5, 99);
            arr.sort(function(a, b) { return a - b; });
            /* Deduplicate */
            arr = arr.filter(function(v, i, a) { return i === 0 || v !== a[i - 1]; });
        } while (arr.length < 12);

        AV.state._initialArray = arr.slice();

        /* Pick target: 70% chance from array, 30% random not-in-array */
        var target;
        if (Math.random() < 0.7) {
            target = arr[Math.floor(Math.random() * arr.length)];
        } else {
            do {
                target = Math.floor(Math.random() * 95) + 5;
            } while (arr.indexOf(target) !== -1);
        }
        AV.state._searchTarget = target;

        AV.renderArray(arr);
        AV['binary-search']._injectTargetUI(arr, target);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var target = AV.state._searchTarget;
        var steps = [];
        var eliminated = [];
        var low = 0, high = arr.length - 1;

        while (low <= high) {
            var mid = Math.floor((low + high) / 2);

            steps.push({
                type: 'BS_CHECK',
                mid: mid,
                low: low,
                high: high,
                value: arr[mid],
                target: target,
                eliminated: eliminated.slice()
            });

            if (arr[mid] === target) {
                steps.push({ type: 'FOUND', index: mid, value: arr[mid], eliminated: eliminated.slice() });
                steps.push({ type: 'DONE' });
                return steps;
            } else if (arr[mid] < target) {
                /* Target is larger — eliminate left half (low..mid) */
                for (var i = low; i <= mid; i++) eliminated.push(i);
                steps.push({
                    type: 'BS_ELIMINATE',
                    direction: 'right',
                    eliminated: eliminated.slice(),
                    newLow: mid + 1,
                    newHigh: high,
                    mid: mid
                });
                low = mid + 1;
            } else {
                /* Target is smaller — eliminate right half (mid..high) */
                for (var j = mid; j <= high; j++) eliminated.push(j);
                steps.push({
                    type: 'BS_ELIMINATE',
                    direction: 'left',
                    eliminated: eliminated.slice(),
                    newLow: low,
                    newHigh: mid - 1,
                    mid: mid
                });
                high = mid - 1;
            }
        }

        steps.push({ type: 'DONE', found: false });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('binary-search.stepLabel', null, 'Binary Search \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV['binary-search']._injectTargetUI(AV.state._initialArray, AV.state._searchTarget);
        AV.animateFlow(
            AV['binary-search'].standard.steps(),
            AV['binary-search'].standard.stepOptions()
        );
    }
};

/* ---------- Shared helpers ---------- */

AV['binary-search']._injectTargetLine = function(arr, target) {
    var oldLine = document.querySelector('.av-target-line');
    if (oldLine) oldLine.remove();
    var container = document.querySelector('.av-bar-container');
    if (container) {
        var maxVal = Math.max.apply(null, arr);
        var containerHeight = 420;
        var lineBottom = Math.max(8, (target / maxVal) * containerHeight);
        var line = document.createElement('div');
        line.className = 'av-target-line';
        line.style.bottom = lineBottom + 'px';
        container.style.position = 'relative';
        container.appendChild(line);
    }
};

AV['binary-search']._injectTargetUI = function(arr, target) {
    /* Remove existing target UI */
    var old = document.querySelector('.av-target-banner');
    if (old) old.remove();
    var oldLine = document.querySelector('.av-target-line');
    if (oldLine) oldLine.remove();

    /* Banner with label + input inside .viz-area */
    var vizArea = document.getElementById('viz-area');
    if (vizArea) {
        var banner = document.createElement('div');
        banner.className = 'av-target-banner';

        var label = document.createElement('span');
        label.setAttribute('data-i18n', 'av.target_label_prefix');
        label.textContent = I18N.t('av.target_label_prefix', null, 'Target:');
        banner.appendChild(label);

        var input = document.createElement('input');
        input.className = 'av-target-input';
        input.type = 'number';
        input.min = '1';
        input.max = '99';
        input.value = target;
        banner.appendChild(input);

        input.addEventListener('change', function() {
            AV['binary-search']._updateTarget(arr);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                AV['binary-search']._updateTarget(arr);
            }
        });

        vizArea.appendChild(banner);
    }

    /* Dashed line at target height inside .av-bar-container */
    AV['binary-search']._injectTargetLine(arr, target);
};

AV['binary-search']._updateTarget = function(arr) {
    var input = document.querySelector('.av-target-input');
    if (!input) return;
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
    AV.state._searchTarget = val;
    AV['binary-search']._injectTargetLine(arr, val);
};

AV['binary-search']._renderPointers = function(low, mid, high) {
    /* Remove old pointers */
    document.querySelectorAll('.av-bs-pointer').forEach(function(el) { el.remove(); });
    var bars = document.querySelectorAll('.av-bar');
    var labels = [
        { idx: low, text: 'L', cls: 'av-bs-ptr-low' },
        { idx: high, text: 'H', cls: 'av-bs-ptr-high' }
    ];
    if (mid >= 0) {
        labels.push({ idx: mid, text: 'M', cls: 'av-bs-ptr-mid' });
    }
    labels.forEach(function(lbl) {
        if (lbl.idx >= 0 && lbl.idx < bars.length && bars[lbl.idx]) {
            var el = document.createElement('div');
            el.className = 'av-bs-pointer ' + lbl.cls;
            el.textContent = lbl.text;
            bars[lbl.idx].appendChild(el);
        }
    });
};

AV['binary-search']._applyEliminated = function(eliminated) {
    var bars = document.querySelectorAll('.av-bar');
    eliminated.forEach(function(idx) {
        if (bars[idx]) bars[idx].classList.add('av-examined');
    });
};
