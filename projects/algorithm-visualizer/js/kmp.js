/* ===== KMP (Knuth-Morris-Pratt) String Matching Algorithm ===== */

AV['kmp'] = {};

AV['kmp'].modes = [
    { id: 'standard', label: 'Full KMP', desc: 'Complete KMP algorithm: first builds the LPS (Longest Proper Prefix which is also Suffix) array for the pattern, then scans the text using the LPS array to skip redundant comparisons on mismatch.' },
    { id: 'lps-only', label: 'LPS Construction', desc: 'Visualizes only the preprocessing step: building the LPS (failure function) array. This array is the key data structure that enables O(n+m) matching.' }
];

AV['kmp'].depRules = [
    { name: 'Time (Preprocessing)', role: 'O(m) \u2014 build LPS array', type: 'good' },
    { name: 'Time (Searching)', role: 'O(n) \u2014 single scan with LPS-guided shifts', type: 'good' },
    { name: 'Time (Total)', role: 'O(n + m) \u2014 linear', type: 'good' },
    { name: 'Space', role: 'O(m) \u2014 LPS array', type: 'info' },
    { name: 'Multiple Matches', role: 'Yes \u2014 finds all occurrences', type: 'good' },
    { name: 'Backtracking', role: 'No \u2014 text pointer never moves backward', type: 'good' }
];

AV['kmp'].details = {
    standard: {
        principles: [
            'Build the LPS array for the pattern in O(m) time',
            'Scan the text left to right; the text pointer never moves backward',
            'On match: advance both text and pattern pointers',
            'On mismatch: use LPS[j\u22121] to shift the pattern, avoiding redundant comparisons',
            'When pattern is fully matched (j == m), record the match and continue using LPS'
        ],
        concepts: [
            { term: 'KMP Algorithm', definition: 'Knuth\u2013Morris\u2013Pratt (1977) \u2014 a linear-time string matching algorithm. Instead of re-scanning characters after a mismatch, it uses a precomputed LPS array to shift the pattern intelligently, achieving O(n+m) time where n is text length and m is pattern length.' },
            { term: 'LPS Array', definition: 'Longest Proper Prefix which is also Suffix. For each position i in the pattern, LPS[i] stores the length of the longest proper prefix of pattern[0..i] that is also a suffix. This is the key data structure that tells the algorithm how far to shift on mismatch.' },
            { term: 'Proper Prefix', definition: 'A prefix that is not the entire string. For "ABAB", proper prefixes are "", "A", "AB", "ABA" \u2014 not "ABAB" itself.' },
            { term: 'Pattern Shift', definition: 'On mismatch at pattern[j], the LPS tells us that pattern[0..LPS[j\u22121]\u22121] already matches the text at the current position. We set j = LPS[j\u22121] instead of restarting from 0.' },
            { term: 'No Backtracking', definition: 'Unlike naive string matching, the text index i never decreases. This guarantees O(n) scanning time regardless of the pattern.' }
        ],
        tradeoffs: {
            pros: [
                'O(n + m) worst-case time \u2014 optimal for single-pattern matching',
                'No backtracking on the text pointer \u2014 suitable for streaming data',
                'Finds all occurrences in a single pass',
                'Deterministic \u2014 no worst-case degradation (unlike naive O(nm))',
                'Preprocessing is simple and O(m)'
            ],
            cons: [
                'O(m) extra space for the LPS array',
                'More complex to implement than naive string matching',
                'For very short patterns, naive approach may be faster due to lower overhead',
                'Single-pattern only \u2014 for multiple patterns use Aho-Corasick'
            ],
            whenToUse: 'Use KMP when you need guaranteed linear-time string matching, especially for long texts or patterns with repeated prefixes. Ideal for streaming data where backtracking is impossible. For short patterns or one-time searches, simpler algorithms may suffice.'
        }
    },
    'lps-only': {
        principles: [
            'Initialize LPS[0] = 0 (no proper prefix for a single character)',
            'Use two pointers: i (current position) and len (length of previous longest prefix suffix)',
            'If pattern[i] == pattern[len], increment len and set LPS[i] = len',
            'If mismatch and len > 0, set len = LPS[len\u22121] (fall back using previously computed LPS)',
            'If mismatch and len == 0, set LPS[i] = 0 and advance i'
        ],
        concepts: [
            { term: 'LPS (Failure Function)', definition: 'The LPS array (also called the failure function or prefix function) maps each position i to the length of the longest proper prefix of pattern[0..i] that is also a suffix. Example: for pattern "ABABC", LPS = [0, 0, 1, 2, 0] because at position 3 ("ABAB") the prefix "AB" equals the suffix "AB".' },
            { term: 'Self-Matching', definition: 'The LPS computation is essentially the KMP algorithm matching the pattern against itself. This reveals all prefix-suffix overlaps.' },
            { term: 'Fallback', definition: 'When a mismatch occurs at position len, we use LPS[len\u22121] to find the next longest prefix that could still match. This avoids restarting from scratch.' },
            { term: 'Amortized O(m)', definition: 'Although there is a while loop inside the for loop, the total iterations are bounded by O(m) because len can increase by at most 1 per step but may decrease by more.' }
        ],
        tradeoffs: {
            pros: [
                'O(m) construction time',
                'Reveals the internal structure of the pattern',
                'Foundation for understanding the full KMP algorithm',
                'Same technique used in other string algorithms (e.g., Z-function relation)'
            ],
            cons: [
                'Conceptually tricky \u2014 the fallback logic requires careful understanding',
                'Not useful alone \u2014 must be paired with the search phase'
            ],
            whenToUse: 'Study LPS construction to understand why KMP achieves linear time. The fallback mechanism is the key insight that eliminates redundant comparisons.'
        }
    }
};

AV['kmp'].legendItems = [
    { swatch: 'av-legend-str-default', i18nKey: 'av.legend.str_default' },
    { swatch: 'av-legend-str-comparing', i18nKey: 'av.legend.str_comparing' },
    { swatch: 'av-legend-str-match', i18nKey: 'av.legend.str_match' },
    { swatch: 'av-legend-str-mismatch', i18nKey: 'av.legend.str_mismatch' },
    { swatch: 'av-legend-str-found', i18nKey: 'av.legend.str_found' },
    { swatch: 'av-legend-str-lps', i18nKey: 'av.legend.str_lps_value' }
];

/* ---------- Sample Data ---------- */

AV['kmp']._sampleTexts = [
    { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' },
    { text: 'AAAAABAAABA', pattern: 'AAAB' },
    { text: 'ABCXABCDABXABCDABCY', pattern: 'ABCDABCY' },
    { text: 'AABAACAADAABAABA', pattern: 'AABA' },
    { text: 'ABABABCABABABCABABC', pattern: 'ABABC' },
    { text: 'GCATCGCAGAGAGTATACAG', pattern: 'GCAGAGAG' }
];

AV['kmp']._pickSample = function() {
    var samples = AV['kmp']._sampleTexts;
    var idx = Math.floor(Math.random() * samples.length);
    return samples[idx];
};

/* ---------- LPS Computation ---------- */

AV['kmp']._computeLPS = function(pattern) {
    var m = pattern.length;
    var lps = new Array(m).fill(0);
    var len = 0;
    var i = 1;
    while (i < m) {
        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len !== 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
};

/* ---------- LPS Step Generation ---------- */

AV['kmp']._lpsSteps = function(pattern) {
    var m = pattern.length;
    var steps = [];
    var lps = new Array(m).fill(0);

    steps.push({ type: 'STR_LPS_SET', index: 0, value: 0, char: pattern[0], prefix: '' });

    var len = 0;
    var i = 1;
    while (i < m) {
        steps.push({ type: 'STR_COMPARE', textIndex: len, patternIndex: i,
            textChar: pattern[len], patternChar: pattern[i] });

        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            steps.push({ type: 'STR_MATCH_CHAR', textChar: pattern[i], textIndex: len - 1,
                patternIndex: i, offset: 0, matched: len, total: m });
            steps.push({ type: 'STR_LPS_SET', index: i, value: len, char: pattern[i], prefix: pattern.substring(0, len) });
            i++;
        } else {
            if (len !== 0) {
                steps.push({ type: 'STR_MISMATCH', textIndex: len, patternIndex: i,
                    textChar: pattern[len], patternChar: pattern[i], lpsValue: lps[len - 1], lpsIdx: len - 1 });
                len = lps[len - 1];
            } else {
                steps.push({ type: 'STR_LPS_SET', index: i, value: 0, char: pattern[i], prefix: '' });
                i++;
            }
        }
    }
    return { steps: steps, lps: lps };
};

/* ---------- Full KMP Step Generation ---------- */

AV['kmp']._kmpSteps = function(text, pattern) {
    var lpsResult = AV['kmp']._lpsSteps(pattern);
    var steps = lpsResult.steps;
    var lps = lpsResult.lps;

    var n = text.length;
    var m = pattern.length;
    var i = 0;
    var j = 0;

    /* Transition from LPS phase to search phase */
    steps.push({ type: 'STR_SHIFT', oldOffset: 0, newOffset: 0, lpsValue: 0, lps: lps.slice(), skipped: 0 });

    while (i < n) {
        steps.push({ type: 'STR_COMPARE', textIndex: i, patternIndex: j,
            textChar: text[i], patternChar: pattern[j] });

        if (text[i] === pattern[j]) {
            steps.push({ type: 'STR_MATCH_CHAR', textChar: text[i], textIndex: i,
                patternIndex: j, offset: i - j, matched: j + 1, total: m });
            i++;
            j++;
        }

        if (j === m) {
            steps.push({ type: 'STR_FOUND', position: i - j, matchEnd: i - 1 });
            var oldOffset = i - j;
            j = lps[j - 1];
            var newOffset = i - j;
            if (newOffset !== oldOffset) {
                steps.push({ type: 'STR_SHIFT', oldOffset: oldOffset, newOffset: newOffset,
                    lpsValue: lps[m - 1], lps: lps.slice(), skipped: newOffset - oldOffset });
            }
        } else if (i < n && text[i] !== pattern[j]) {
            if (j !== 0) {
                var oldOff = i - j;
                steps.push({ type: 'STR_MISMATCH', textIndex: i, patternIndex: j,
                    textChar: text[i], patternChar: pattern[j], lpsValue: lps[j - 1], lpsIdx: j - 1 });
                j = lps[j - 1];
                var newOff = i - j;
                steps.push({ type: 'STR_SHIFT', oldOffset: oldOff, newOffset: newOff,
                    lpsValue: lps[j] !== undefined ? lps[j] : 0, lps: lps.slice(), skipped: newOff - oldOff });
            } else {
                steps.push({ type: 'STR_MISMATCH', textIndex: i, patternIndex: j,
                    textChar: text[i], patternChar: pattern[j], lpsValue: 0 });
                i++;
                if (i < n) {
                    steps.push({ type: 'STR_SHIFT', oldOffset: i - 1, newOffset: i,
                        lpsValue: 0, lps: lps.slice(), skipped: 1 });
                }
            }
        }
    }

    steps.push({ type: 'DONE' });
    return steps;
};

/* ===== Mode: standard (Full KMP) ===== */

AV['kmp']['standard'] = {
    init: function() {
        var sample = AV['kmp']._pickSample();
        AV.state._text = sample.text;
        AV.state._pattern = sample.pattern;
        AV.state._isStringAlgorithm = true;
        AV.state._patternOffset = 0;

        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        delete AV.state._isDPAlgorithm;
        delete AV.state._searchTarget;

        var lps = AV['kmp']._computeLPS(sample.pattern);
        AV.state._lps = lps;
        AV.state._initialArray = [];

        var emptyLps = new Array(sample.pattern.length).fill(-1);
        AV.renderStringMatch(sample.text, sample.pattern, 0, emptyLps);
        AV._setStringStatLabels();
    },

    steps: function() {
        return AV['kmp']._kmpSteps(AV.state._text, AV.state._pattern);
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('kmp.stepLabel', null, 'KMP \u2014 Full Search') };
    },

    run: function() {
        AV['kmp']['standard'].init();
        AV.animateFlow(
            AV['kmp']['standard'].steps(),
            AV['kmp']['standard'].stepOptions()
        );
    }
};

/* ===== Mode: lps-only (LPS Construction) ===== */

AV['kmp']['lps-only'] = {
    init: function() {
        var sample = AV['kmp']._pickSample();
        AV.state._text = sample.pattern;
        AV.state._pattern = sample.pattern;
        AV.state._isStringAlgorithm = true;
        AV.state._patternOffset = 0;

        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        delete AV.state._isDPAlgorithm;
        delete AV.state._searchTarget;

        AV.state._initialArray = [];

        var emptyLps = new Array(sample.pattern.length).fill(-1);
        AV.renderStringMatch(sample.pattern, sample.pattern, 0, emptyLps);
        AV._setStringStatLabels();
    },

    steps: function() {
        var result = AV['kmp']._lpsSteps(AV.state._pattern);
        result.steps.push({ type: 'DONE' });
        return result.steps;
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('kmp.stepLabel_lps', null, 'KMP \u2014 LPS Construction') };
    },

    run: function() {
        AV['kmp']['lps-only'].init();
        AV.animateFlow(
            AV['kmp']['lps-only'].steps(),
            AV['kmp']['lps-only'].stepOptions()
        );
    }
};
