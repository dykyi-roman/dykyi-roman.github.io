/* ===== Interpolation Search Algorithm ===== */

AV['interpolation-search'] = {};

AV['interpolation-search'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Interpolation Search estimates the probe position using the interpolation formula, adapting to the data distribution. Achieves O(log log n) on uniform data but degrades to O(n) on skewed distributions.' }
];

AV['interpolation-search'].depRules = [
    { name: 'Time (Best)', role: 'O(1) \u2014 target at probe position', type: 'good' },
    { name: 'Time (Average)', role: 'O(log log n) \u2014 on uniform data', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n) \u2014 skewed distribution', type: 'bad' },
    { name: 'Space', role: 'O(1) \u2014 iterative, no extra memory', type: 'good' },
    { name: 'Sorted Input Required', role: 'Yes \u2014 array must be pre-sorted', type: 'bad' },
    { name: 'Uniform Data', role: 'Best with uniformly distributed values', type: 'info' }
];

AV['interpolation-search'].details = {
    standard: {
        principles: [
            'The array must be sorted before interpolation search can be applied',
            'Estimate probe position using: pos = low + floor(((target \u2212 arr[low]) / (arr[high] \u2212 arr[low])) \u00D7 (high \u2212 low))',
            'If the probe element equals the target, the search is complete',
            'If the probe element is less than the target, eliminate the left portion and search right',
            'If the probe element is greater, eliminate the right portion and search left'
        ],
        concepts: [
            { term: 'Interpolation Formula', definition: 'pos = low + floor(((target \u2212 arr[low]) / (arr[high] \u2212 arr[low])) \u00D7 (high \u2212 low)). Estimates where the target would fall if values are uniformly distributed between arr[low] and arr[high].' },
            { term: 'Probe Position', definition: 'Unlike binary search\u2019s fixed midpoint, the probe adapts to the data. For uniform data it jumps closer to the target, reducing comparisons dramatically.' },
            { term: 'Uniform Distribution', definition: 'Values spaced roughly evenly. Interpolation search excels here because the formula accurately predicts the target\u2019s location, achieving O(log log n) comparisons.' },
            { term: 'Degradation on Skew', definition: 'If values are clustered or exponentially distributed, the probe estimate is poor, causing O(n) behavior similar to linear search. Binary search is safer for unknown distributions.' }
        ],
        tradeoffs: {
            pros: [
                'O(log log n) average on uniformly distributed data \u2014 faster than binary search',
                'O(1) extra space \u2014 no auxiliary data structures needed',
                'Adaptive \u2014 adjusts probe position based on value distribution',
                'Excellent for large datasets with known uniform distribution',
                'Same worst-case as linear search but vastly better on typical data'
            ],
            cons: [
                'O(n) worst case on skewed or adversarial data',
                'Requires sorted input \u2014 sorting costs O(n log n) if not already sorted',
                'Division by zero risk when arr[low] equals arr[high]',
                'More complex formula than binary search\u2019s simple midpoint',
                'Performance depends heavily on data distribution \u2014 not always predictable'
            ],
            whenToUse: 'Best for large, sorted datasets with roughly uniform value distribution (e.g., database keys, timestamps, sequential IDs). For non-uniform data or small arrays, binary search is safer and more predictable.'
        }
    }
};

AV['interpolation-search'].legendItems = [
    { swatch: 'av-legend-default', i18nKey: 'av.legend.default' },
    { swatch: 'av-legend-scanning', i18nKey: 'av.legend.probing' },
    { swatch: 'av-legend-examined', i18nKey: 'av.legend.eliminated' },
    { swatch: 'av-legend-found', i18nKey: 'av.legend.found' }
];

/* ---------- Mode: standard ---------- */

AV['interpolation-search'].standard = {
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
        AV['interpolation-search']._injectTargetUI(arr, target);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var target = AV.state._searchTarget;
        var steps = [];
        var eliminated = [];
        var low = 0, high = arr.length - 1;

        while (low <= high && target >= arr[low] && target <= arr[high]) {
            /* Guard against division by zero */
            if (arr[low] === arr[high]) {
                if (arr[low] === target) {
                    steps.push({
                        type: 'IS_PROBE', probe: low, low: low, high: high,
                        value: arr[low], target: target, eliminated: eliminated.slice(),
                        formula: 'arr[low]=arr[high]=target'
                    });
                    steps.push({ type: 'FOUND', index: low, value: arr[low], eliminated: eliminated.slice() });
                    steps.push({ type: 'DONE' });
                    return steps;
                }
                break;
            }

            var pos = low + Math.floor(((target - arr[low]) / (arr[high] - arr[low])) * (high - low));
            /* Clamp to valid range */
            if (pos < low) pos = low;
            if (pos > high) pos = high;

            var formulaStr = low + '+\u230A((' + target + '-' + arr[low] + ')/(' + arr[high] + '-' + arr[low] + '))\u00D7(' + high + '-' + low + ')\u230B=' + pos;

            steps.push({
                type: 'IS_PROBE',
                probe: pos,
                low: low,
                high: high,
                value: arr[pos],
                target: target,
                eliminated: eliminated.slice(),
                formula: formulaStr
            });

            if (arr[pos] === target) {
                steps.push({ type: 'FOUND', index: pos, value: arr[pos], eliminated: eliminated.slice() });
                steps.push({ type: 'DONE' });
                return steps;
            } else if (arr[pos] < target) {
                /* Target is larger — eliminate left portion (low..pos) */
                for (var i = low; i <= pos; i++) eliminated.push(i);
                steps.push({
                    type: 'IS_ELIMINATE',
                    direction: 'right',
                    eliminated: eliminated.slice(),
                    newLow: pos + 1,
                    newHigh: high,
                    probe: pos
                });
                low = pos + 1;
            } else {
                /* Target is smaller — eliminate right portion (pos..high) */
                for (var j = pos; j <= high; j++) eliminated.push(j);
                steps.push({
                    type: 'IS_ELIMINATE',
                    direction: 'left',
                    eliminated: eliminated.slice(),
                    newLow: low,
                    newHigh: pos - 1,
                    probe: pos
                });
                high = pos - 1;
            }
        }

        steps.push({ type: 'DONE', found: false });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('interpolation-search.stepLabel', null, 'Interpolation Search \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV['interpolation-search']._injectTargetUI(AV.state._initialArray, AV.state._searchTarget);
        AV.animateFlow(
            AV['interpolation-search'].standard.steps(),
            AV['interpolation-search'].standard.stepOptions()
        );
    }
};

/* ---------- Shared helpers ---------- */

AV['interpolation-search']._injectTargetLine = function(arr, target) {
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

AV['interpolation-search']._injectTargetUI = function(arr, target) {
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
            AV['interpolation-search']._updateTarget(arr);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                AV['interpolation-search']._updateTarget(arr);
            }
        });

        vizArea.appendChild(banner);
    }

    /* Dashed line at target height inside .av-bar-container */
    AV['interpolation-search']._injectTargetLine(arr, target);
};

AV['interpolation-search']._updateTarget = function(arr) {
    var input = document.querySelector('.av-target-input');
    if (!input) return;
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
    AV.state._searchTarget = val;
    AV['interpolation-search']._injectTargetLine(arr, val);
};

AV['interpolation-search']._renderPointers = function(low, probe, high) {
    /* Remove old pointers */
    document.querySelectorAll('.av-is-pointer').forEach(function(el) { el.remove(); });
    var bars = document.querySelectorAll('.av-bar');
    var labels = [
        { idx: low, text: 'L', cls: 'av-is-ptr-low' },
        { idx: high, text: 'H', cls: 'av-is-ptr-high' }
    ];
    if (probe >= 0) {
        labels.push({ idx: probe, text: 'P', cls: 'av-is-ptr-probe' });
    }
    labels.forEach(function(lbl) {
        if (lbl.idx >= 0 && lbl.idx < bars.length && bars[lbl.idx]) {
            var el = document.createElement('div');
            el.className = 'av-is-pointer ' + lbl.cls;
            el.textContent = lbl.text;
            bars[lbl.idx].appendChild(el);
        }
    });
};

AV['interpolation-search']._applyEliminated = function(eliminated) {
    var bars = document.querySelectorAll('.av-bar');
    eliminated.forEach(function(idx) {
        if (bars[idx]) bars[idx].classList.add('av-examined');
    });
};
