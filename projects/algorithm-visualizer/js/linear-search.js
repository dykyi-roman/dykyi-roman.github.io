/* ===== Linear Search Algorithm ===== */

AV['linear-search'] = {};

AV['linear-search'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Linear Search: scans the array from left to right, comparing each element with the target value. Returns the index of the first match or reports that the target is not found.' }
];

AV['linear-search'].depRules = [
    { name: 'Time (Best)', role: 'O(1) \u2014 target is the first element', type: 'good' },
    { name: 'Time (Average)', role: 'O(n) \u2014 linear', type: 'info' },
    { name: 'Time (Worst)', role: 'O(n) \u2014 target at the end or absent', type: 'bad' },
    { name: 'Space', role: 'O(1) \u2014 no extra memory', type: 'good' },
    { name: 'Sorted Input Required', role: 'No \u2014 works on any array', type: 'good' },
    { name: 'Stable', role: 'Yes \u2014 returns first occurrence', type: 'good' }
];

AV['linear-search'].details = {
    standard: {
        principles: [
            'Start from the first element and move sequentially to the right',
            'Compare each element with the target value',
            'If a match is found, return its index immediately',
            'If the end of the array is reached without a match, report "not found"',
            'No preprocessing or sorting of the input is required'
        ],
        concepts: [
            { term: 'Sequential Scan', definition: 'Visiting each element one by one in order. The simplest search strategy with no special data structure requirements.' },
            { term: 'Comparison', definition: 'The fundamental operation: check if arr[i] equals the target. Each comparison eliminates exactly one element.' },
            { term: 'Target', definition: 'The value being searched for. Linear Search works with any data type that supports equality comparison.' },
            { term: 'Sentinel Variant', definition: 'Place the target at the end of the array as a sentinel to eliminate the bounds check in each iteration, reducing constant factors.' }
        ],
        tradeoffs: {
            pros: [
                'Simplest search algorithm \u2014 easy to understand and implement',
                'Works on unsorted arrays \u2014 no preprocessing needed',
                'O(1) extra space \u2014 no auxiliary data structures',
                'Good for small datasets or one-time searches',
                'Works with any data type that supports equality check'
            ],
            cons: [
                'O(n) time \u2014 slow for large datasets',
                'Does not exploit sorted order \u2014 Binary Search is faster for sorted arrays',
                'Must scan the entire array when the target is absent',
                'No benefit from repeated queries on the same data'
            ],
            whenToUse: 'Best for small or unsorted collections, one-time searches, or when the cost of sorting exceeds the search benefit. For sorted data or frequent queries, prefer Binary Search or hash-based lookups.'
        }
    }
};

AV['linear-search'].legendItems = [
    { swatch: 'av-legend-default', i18nKey: 'av.legend.default' },
    { swatch: 'av-legend-scanning', i18nKey: 'av.legend.scanning' },
    { swatch: 'av-legend-examined', i18nKey: 'av.legend.examined' },
    { swatch: 'av-legend-found', i18nKey: 'av.legend.found' }
];

/* ---------- Mode: standard ---------- */

AV['linear-search'].standard = {
    init: function() {
        var arr = AV.generateRandomArray(20, 5, 99);
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
        AV['linear-search']._injectTargetUI(arr, target);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var target = AV.state._searchTarget;
        var steps = [];

        for (var i = 0; i < arr.length; i++) {
            steps.push({ type: 'SCAN', index: i, value: arr[i], target: target });
            if (arr[i] === target) {
                steps.push({ type: 'FOUND', index: i, value: arr[i] });
                steps.push({ type: 'DONE' });
                return steps;
            }
        }

        steps.push({ type: 'DONE', found: false });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('linear-search.stepLabel', null, 'Linear Search \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV['linear-search']._injectTargetUI(AV.state._initialArray, AV.state._searchTarget);
        AV.animateFlow(
            AV['linear-search'].standard.steps(),
            AV['linear-search'].standard.stepOptions()
        );
    }
};

/* ---------- Shared helpers ---------- */

AV['linear-search']._injectTargetLine = function(arr, target) {
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

AV['linear-search']._injectTargetUI = function(arr, target) {
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
            AV['linear-search']._updateTarget(arr);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                AV['linear-search']._updateTarget(arr);
            }
        });

        vizArea.appendChild(banner);
    }

    /* Dashed line at target height inside .av-bar-container */
    AV['linear-search']._injectTargetLine(arr, target);
};

AV['linear-search']._updateTarget = function(arr) {
    var input = document.querySelector('.av-target-input');
    if (!input) return;
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
    AV.state._searchTarget = val;
    AV['linear-search']._injectTargetLine(arr, val);
};
