/* ===== Jump Search Algorithm ===== */

AV['jump-search'] = {};

AV['jump-search'].modes = [
    { id: 'standard', label: 'Standard', desc: 'Classic Jump Search: jumps ahead by \u221An blocks through a sorted array, then performs a linear scan within the identified block. Achieves O(\u221An) time \u2014 faster than linear, simpler than binary.' }
];

AV['jump-search'].depRules = [
    { name: 'Time (Best)', role: 'O(1) \u2014 target at first jump boundary', type: 'good' },
    { name: 'Time (Average)', role: 'O(\u221An) \u2014 sublinear', type: 'info' },
    { name: 'Time (Worst)', role: 'O(\u221An) \u2014 target near end of block', type: 'info' },
    { name: 'Space', role: 'O(1) \u2014 no extra memory', type: 'good' },
    { name: 'Sorted Input Required', role: 'Yes \u2014 array must be pre-sorted', type: 'bad' },
    { name: 'Optimal Block', role: '\u221An \u2014 balances jump and scan cost', type: 'info' }
];

AV['jump-search'].details = {
    standard: {
        principles: [
            'The array must be sorted before applying Jump Search',
            'Jump ahead by a fixed block size (\u221An) checking the boundary element',
            'If the boundary element is less than the target, skip the entire block',
            'Once a block is found where the target may reside, perform a linear scan within it',
            'The optimal block size \u221An minimizes the total number of comparisons'
        ],
        concepts: [
            { term: 'Block Size \u221An', definition: 'The optimal jump step is the square root of the array length. This balances the number of jumps (\u221An) with the linear scan size (\u221An), yielding O(\u221An) total comparisons.' },
            { term: 'Jump Phase', definition: 'The first phase skips entire blocks by checking only the last element. If arr[blockEnd] < target, the target cannot be in this block, so we jump ahead.' },
            { term: 'Linear Scan Phase', definition: 'Once the correct block is identified, a sequential search within the block finds the exact position. This is at most \u221An comparisons.' },
            { term: 'Optimal Step Size', definition: 'The step size \u221An minimizes the worst case: too small means too many scans, too large means too many jumps. \u221An is the mathematical sweet spot.' }
        ],
        tradeoffs: {
            pros: [
                'O(\u221An) time \u2014 significantly faster than linear search',
                'Simpler to implement than binary search',
                'Only requires backward traversal once \u2014 good for systems where jumping back is costly',
                'O(1) extra space \u2014 no recursion or auxiliary structures',
                'Works well when binary search overhead is not justified'
            ],
            cons: [
                'Slower than binary search O(log n) for large datasets',
                'Requires sorted input \u2014 sorting costs O(n log n)',
                'Fixed block size may be suboptimal for non-uniform data distributions',
                'Not adaptive \u2014 does not narrow search space as aggressively as binary search'
            ],
            whenToUse: 'Best when the data is sorted and backward traversal is expensive (e.g., linked lists with forward-only iteration). Also useful when simplicity is preferred over optimal performance. For arrays, binary search is usually better.'
        }
    }
};

AV['jump-search'].legendItems = [
    { swatch: 'av-legend-default', i18nKey: 'av.legend.default' },
    { swatch: 'av-legend-scanning', i18nKey: 'av.legend.jumping' },
    { swatch: 'av-legend-examined', i18nKey: 'av.legend.skipped' },
    { swatch: 'av-legend-found', i18nKey: 'av.legend.found' }
];

/* ---------- Mode: standard ---------- */

AV['jump-search'].standard = {
    init: function() {
        var arr;
        do {
            arr = AV.generateRandomArray(20, 5, 99);
            arr.sort(function(a, b) { return a - b; });
            arr = arr.filter(function(v, i, a) { return i === 0 || v !== a[i - 1]; });
        } while (arr.length < 12);

        AV.state._initialArray = arr.slice();

        var target;
        if (Math.random() < 0.7) {
            target = arr[Math.floor(Math.random() * arr.length)];
        } else {
            do {
                target = Math.floor(Math.random() * 95) + 5;
            } while (arr.indexOf(target) !== -1);
        }
        AV.state._searchTarget = target;

        var jumpSize = Math.floor(Math.sqrt(arr.length));
        AV.state._jumpSize = jumpSize;

        AV.renderArray(arr);
        AV['jump-search']._injectTargetUI(arr, target);
        AV['jump-search']._injectJumpBanner(arr.length, jumpSize);
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var target = AV.state._searchTarget;
        var n = arr.length;
        var jumpSize = Math.floor(Math.sqrt(n));
        var steps = [];
        var skipped = [];
        var prev = 0;
        var step = jumpSize;

        /* Phase 1: Jump */
        while (Math.min(step, n) - 1 >= 0 && arr[Math.min(step, n) - 1] < target) {
            var jumpPos = Math.min(step, n) - 1;

            steps.push({
                type: 'JS_JUMP',
                jumpPos: jumpPos,
                value: arr[jumpPos],
                target: target,
                blockStart: prev,
                jumpSize: jumpSize,
                skipped: skipped.slice()
            });

            /* Mark this block as skipped */
            for (var i = prev; i <= jumpPos; i++) {
                skipped.push(i);
            }

            prev = step;
            step += jumpSize;

            if (prev >= n) {
                steps.push({ type: 'DONE', found: false });
                return steps;
            }
        }

        /* Phase 2: Linear scan within block [prev..min(step, n) - 1] */
        var blockEnd = Math.min(step, n) - 1;

        for (var j = prev; j <= blockEnd; j++) {
            steps.push({
                type: 'JS_SCAN',
                index: j,
                value: arr[j],
                target: target,
                blockStart: prev,
                blockEnd: blockEnd,
                skipped: skipped.slice()
            });

            if (arr[j] === target) {
                steps.push({ type: 'FOUND', index: j, value: arr[j], skipped: skipped.slice() });
                steps.push({ type: 'DONE' });
                return steps;
            }

            if (arr[j] > target) {
                steps.push({ type: 'DONE', found: false });
                return steps;
            }
        }

        steps.push({ type: 'DONE', found: false });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('jump-search.stepLabel', null, 'Jump Search \u2014 Standard') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV['jump-search']._injectTargetUI(AV.state._initialArray, AV.state._searchTarget);
        AV['jump-search']._injectJumpBanner(AV.state._initialArray.length, AV.state._jumpSize);
        AV.animateFlow(
            AV['jump-search'].standard.steps(),
            AV['jump-search'].standard.stepOptions()
        );
    }
};

/* ---------- Shared helpers ---------- */

AV['jump-search']._injectTargetLine = function(arr, target) {
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

AV['jump-search']._injectTargetUI = function(arr, target) {
    var old = document.querySelector('.av-target-banner');
    if (old) old.remove();
    var oldLine = document.querySelector('.av-target-line');
    if (oldLine) oldLine.remove();

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
            AV['jump-search']._updateTarget(arr);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                AV['jump-search']._updateTarget(arr);
            }
        });

        vizArea.appendChild(banner);
    }

    AV['jump-search']._injectTargetLine(arr, target);
};

AV['jump-search']._updateTarget = function(arr) {
    var input = document.querySelector('.av-target-input');
    if (!input) return;
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
    AV.state._searchTarget = val;
    AV['jump-search']._injectTargetLine(arr, val);
    /* Refresh jump banner in case array changed */
    var jumpSize = Math.floor(Math.sqrt(arr.length));
    AV.state._jumpSize = jumpSize;
    AV['jump-search']._injectJumpBanner(arr.length, jumpSize);
};

AV['jump-search']._injectJumpBanner = function(n, jumpSize) {
    var old = document.querySelector('.av-jump-banner');
    if (old) old.remove();

    var vizArea = document.getElementById('viz-area');
    if (vizArea) {
        var banner = document.createElement('div');
        banner.className = 'av-jump-banner';
        banner.innerHTML = I18N.t('jump-search.jump_label', null, 'Jump:') +
            ' <span class="av-jump-value">\u221A' + n + ' = ' + jumpSize + '</span>';
        vizArea.appendChild(banner);
    }
};

AV['jump-search']._applySkipped = function(skipped) {
    var bars = document.querySelectorAll('.av-bar');
    skipped.forEach(function(idx) {
        if (bars[idx]) bars[idx].classList.add('av-examined');
    });
};
