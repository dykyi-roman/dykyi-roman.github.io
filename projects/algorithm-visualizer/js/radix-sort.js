/* ===== Radix Sort (LSD) Algorithm ===== */

AV['radix-sort'] = {};

AV['radix-sort'].modes = [
    { id: 'lsd', label: 'LSD', desc: 'Least Significant Digit radix sort: performs a stable distribution sort by each digit, from the ones place upward. After d passes (d = number of digits in the maximum value), the array is fully sorted.' }
];

AV['radix-sort'].depRules = [
    { name: 'Time', role: 'O(d \u00B7 (n + b)) \u2014 d digit passes over n elements, base b', type: 'good' },
    { name: 'Space', role: 'O(n + b) \u2014 buckets + output array', type: 'info' },
    { name: 'Stable', role: 'Yes \u2014 required for correctness of LSD radix sort', type: 'good' },
    { name: 'Adaptive', role: 'No \u2014 always d passes regardless of order', type: 'info' },
    { name: 'Input Constraint', role: 'Non-negative integers (or fixed-width encodable keys)', type: 'bad' },
    { name: 'In-Place', role: 'No \u2014 auxiliary buckets and output needed', type: 'bad' }
];

AV['radix-sort'].details = {
    lsd: {
        principles: [
            'Determine d \u2014 the number of digits in the largest value (for max 999: d = 3)',
            'For each digit position from least-significant to most-significant: perform a stable distribution sort by that digit',
            'Distribute: scan array left-to-right; place each element into bucket[digit] based on the current digit',
            'Collect: concatenate buckets 0..9 back into the array in order',
            'After all d passes, the array is fully sorted \u2014 stability of each pass is what makes this correct'
        ],
        concepts: [
            { term: 'LSD (Least Significant Digit)', definition: 'The rightmost digit is processed first, then tens, then hundreds, etc. This order, combined with a stable inner sort, guarantees a fully sorted array after d passes.' },
            { term: 'Stable Inner Sort', definition: 'Each digit pass must be stable \u2014 elements with the same current digit keep their relative order from the previous pass. Without stability, earlier digit information would be lost.' },
            { term: 'Buckets', definition: 'Radix b (typically 10 for decimal) auxiliary containers. Each pass distributes elements into buckets by the current digit, then collects them back to form the next intermediate array.' },
            { term: 'Digit Extraction', definition: 'For value v and position p (0 = ones): digit = floor(v / 10^p) mod 10. Each pass uses this formula to pick the current digit being sorted.' }
        ],
        tradeoffs: {
            pros: [
                'O(d \u00B7 n) time \u2014 linear when d is a small constant (e.g., 32-bit integers: d = 10 with base b = 16)',
                'Beats O(n log n) comparison sorts for fixed-width integer keys',
                'Stable \u2014 preserves relative order of equal keys',
                'Parallelizable \u2014 each bucket can be processed independently',
                'Excellent for sorting large datasets of integers or fixed-length strings'
            ],
            cons: [
                'Only works with integer or fixed-width keys \u2014 not general comparable data',
                'Requires O(n + b) extra memory for buckets and output',
                'd passes over the data \u2014 many cache misses for large n',
                'Harder to implement than quicksort; radix choice affects performance'
            ],
            whenToUse: 'Use Radix Sort for large arrays of integers with bounded width, for fixed-length strings, or when stability is required and keys fit a digit model. Avoid when keys are truly variable-length or when k in Counting Sort would be small enough to apply directly.'
        }
    }
};

AV['radix-sort'].legendItems = [
    { swatch: 'av-legend-default', i18nKey: 'av.legend.default' },
    { swatch: 'av-legend-scanning', i18nKey: 'av.legend.rs_distributing' },
    { swatch: 'av-legend-bucket-active', i18nKey: 'av.legend.rs_bucket_active' },
    { swatch: 'av-legend-sorted', i18nKey: 'av.legend.sorted' }
];

/* ===== Helpers ===== */

AV['radix-sort']._getDigit = function(num, pos) {
    return Math.floor(num / Math.pow(10, pos)) % 10;
};

AV['radix-sort']._numDigits = function(n) {
    if (n === 0) return 1;
    return Math.floor(Math.log10(Math.abs(n))) + 1;
};

AV['radix-sort']._placeLabels = ['ones', 'tens', 'hundreds', 'thousands'];

AV['radix-sort']._getPlaceLabel = function(digitPos) {
    var key = 'av.rs.place_' + (AV['radix-sort']._placeLabels[digitPos] || 'digit');
    var fallback = AV['radix-sort']._placeLabels[digitPos] || ('10^' + digitPos);
    return I18N.t(key, null, fallback);
};

/* ===== Buckets UI ===== */

AV['radix-sort']._injectBuckets = function() {
    AV['radix-sort']._removeBuckets();

    var vizArea = document.getElementById('viz-area');
    if (!vizArea) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'av-buckets-wrapper';

    var label = document.createElement('div');
    label.className = 'av-buckets-label';
    label.textContent = I18N.t('av.rs.buckets_label', null, 'buckets[0..9]');
    wrapper.appendChild(label);

    var container = document.createElement('div');
    container.className = 'av-buckets-container';

    for (var i = 0; i < 10; i++) {
        var bucket = document.createElement('div');
        bucket.className = 'av-bucket';
        bucket.setAttribute('data-bucket', String(i));

        var bLabel = document.createElement('div');
        bLabel.className = 'av-bucket-label';
        bLabel.textContent = String(i);
        bucket.appendChild(bLabel);

        var stack = document.createElement('div');
        stack.className = 'av-bucket-stack';
        bucket.appendChild(stack);

        container.appendChild(bucket);
    }

    wrapper.appendChild(container);
    vizArea.appendChild(wrapper);
};

AV['radix-sort']._removeBuckets = function() {
    var existing = document.querySelector('.av-buckets-wrapper');
    if (existing) existing.remove();
};

AV['radix-sort']._bucketAdd = function(bucketIndex, value) {
    var bucket = document.querySelector('.av-bucket[data-bucket="' + bucketIndex + '"]');
    if (!bucket) return;
    var stack = bucket.querySelector('.av-bucket-stack');
    if (!stack) return;

    document.querySelectorAll('.av-bucket').forEach(function(b) {
        b.classList.remove('av-bucket-active');
    });
    bucket.classList.add('av-bucket-active');

    var item = document.createElement('div');
    item.className = 'av-bucket-item';
    item.textContent = String(value);
    stack.appendChild(item);
};

AV['radix-sort']._bucketPop = function(bucketIndex) {
    var bucket = document.querySelector('.av-bucket[data-bucket="' + bucketIndex + '"]');
    if (!bucket) return;
    var stack = bucket.querySelector('.av-bucket-stack');
    if (!stack) return;

    document.querySelectorAll('.av-bucket').forEach(function(b) {
        b.classList.remove('av-bucket-active');
    });
    bucket.classList.add('av-bucket-active');

    var first = stack.querySelector('.av-bucket-item');
    if (first) first.remove();
};

AV['radix-sort']._bucketClear = function() {
    document.querySelectorAll('.av-bucket .av-bucket-stack').forEach(function(stack) {
        stack.innerHTML = '';
    });
    document.querySelectorAll('.av-bucket').forEach(function(b) {
        b.classList.remove('av-bucket-active');
    });
};

AV['radix-sort']._applyBucketsSnapshot = function(bucketsState) {
    AV['radix-sort']._bucketClear();
    if (!bucketsState) return;
    for (var i = 0; i < bucketsState.length; i++) {
        var bucket = document.querySelector('.av-bucket[data-bucket="' + i + '"]');
        if (!bucket) continue;
        var stack = bucket.querySelector('.av-bucket-stack');
        if (!stack) continue;
        var items = bucketsState[i] || [];
        for (var j = 0; j < items.length; j++) {
            var item = document.createElement('div');
            item.className = 'av-bucket-item';
            item.textContent = String(items[j]);
            stack.appendChild(item);
        }
    }
};

/* ===== Array Generation ===== */

AV['radix-sort']._generateArray = function(n, maxVal) {
    var arr = [];
    for (var i = 0; i < n; i++) {
        arr.push(Math.floor(Math.random() * maxVal));
    }
    return arr;
};

/* ---------- Mode: lsd ---------- */

AV['radix-sort'].lsd = {
    init: function() {
        var n = 12;
        var maxVal = 1000;
        var arr = AV['radix-sort']._generateArray(n, maxVal);
        AV.state._initialArray = arr.slice();
        AV.state._rsMaxDigits = AV['radix-sort']._numDigits(Math.max.apply(null, arr));

        AV.renderArray(arr);
        AV['radix-sort']._injectBuckets();
    },

    steps: function() {
        var arr = AV.state._initialArray.slice();
        var n = arr.length;
        var d = AV.state._rsMaxDigits || 3;
        var steps = [];

        function cloneBuckets(buckets) {
            var cp = [];
            for (var b = 0; b < buckets.length; b++) cp.push(buckets[b].slice());
            return cp;
        }

        for (var pos = 0; pos < d; pos++) {
            var placeLabel = AV['radix-sort']._getPlaceLabel(pos);

            steps.push({
                type: 'RS_DIGIT_PASS',
                digitPos: pos,
                passNum: pos + 1,
                totalPasses: d,
                placeLabel: placeLabel
            });

            steps.push({ type: 'RS_BUCKET_CLEAR' });

            /* Distribute into buckets */
            var buckets = [];
            for (var b = 0; b < 10; b++) buckets.push([]);

            for (var i = 0; i < n; i++) {
                var digit = AV['radix-sort']._getDigit(arr[i], pos);
                buckets[digit].push(arr[i]);
                steps.push({
                    type: 'RS_BUCKET_ADD',
                    inputIndex: i,
                    inputValue: arr[i],
                    digit: digit,
                    digitPos: pos,
                    bucketsState: cloneBuckets(buckets)
                });
            }

            /* Collect back into array */
            var outIdx = 0;
            for (var bi = 0; bi < 10; bi++) {
                while (buckets[bi].length > 0) {
                    var value = buckets[bi].shift();
                    arr[outIdx] = value;
                    steps.push({
                        type: 'RS_BUCKET_COLLECT',
                        bucketIndex: bi,
                        value: value,
                        outputIndex: outIdx,
                        digitPos: pos,
                        bucketsState: cloneBuckets(buckets)
                    });
                    outIdx++;
                }
            }
        }

        /* Mark all positions as sorted */
        for (var s = 0; s < n; s++) {
            steps.push({ type: 'SORTED', index: s, value: arr[s] });
        }
        steps.push({ type: 'DONE' });
        return steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('radix-sort.stepLabel', null, 'Radix Sort \u2014 LSD') };
    },

    run: function() {
        AV.renderArray(AV.state._initialArray.slice());
        AV['radix-sort']._injectBuckets();
        AV.animateFlow(
            AV['radix-sort'].lsd.steps(),
            AV['radix-sort'].lsd.stepOptions()
        );
    }
};
