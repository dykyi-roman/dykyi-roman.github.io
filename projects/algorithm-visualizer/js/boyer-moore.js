/* ===== Boyer-Moore String Matching Algorithm ===== */

AV['boyer-moore'] = {};

AV['boyer-moore'].modes = [
    { id: 'standard', label: 'Boyer-Moore', desc: 'Classic Boyer-Moore string matching using both Bad Character and Good Suffix heuristics. Compares the pattern against the current text window from right to left and shifts the pattern by max(BC shift, GS shift) on mismatch — typically several positions at a time, achieving sublinear average case.' }
];

AV['boyer-moore'].depRules = [
    { name: 'Time (Preprocessing)', role: 'O(m + |Σ|) — build BC and GS tables', type: 'good' },
    { name: 'Time (Best)', role: 'O(n / m) — sublinear when pattern is rare', type: 'good' },
    { name: 'Time (Average)', role: 'O(n / m) — large jumps from heuristics', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n · m) — pathological inputs (Galil variant gives O(n))', type: 'info' },
    { name: 'Space', role: 'O(m + |Σ|) — GS table + BC table', type: 'info' },
    { name: 'Multiple Matches', role: 'Yes — finds all occurrences', type: 'good' },
    { name: 'Comparison Direction', role: 'Right-to-left within each window', type: 'info' }
];

AV['boyer-moore'].details = {
    standard: {
        principles: [
            'Preprocess the pattern into two tables: Bad Character (BC) and Good Suffix (GS)',
            'For each window, compare characters from right to left starting at pattern[m−1]',
            'On mismatch at pattern[j] vs text[i+j], compute BC shift = j − last index of text[i+j] in pattern',
            'Compute GS shift from the Good Suffix table for the matched suffix pattern[j+1..m−1]',
            'Advance the window by max(BC shift, GS shift) — often skipping many positions at once',
            'On full match, shift by GS[0] (period of the pattern) and continue searching for further occurrences'
        ],
        concepts: [
            { term: 'Boyer-Moore Algorithm', definition: 'Robert S. Boyer and J Strother Moore (1977) — a fast string-matching algorithm that scans the pattern right-to-left within each text window. By combining the Bad Character and Good Suffix heuristics, it often shifts the pattern by several positions per attempt, achieving sublinear average runtime.' },
            { term: 'Bad Character Rule', definition: 'On a mismatch with text character c at pattern position j, shift the pattern so that the rightmost previous occurrence of c in pattern[0..j−1] aligns with the text. If c never appears in the pattern, shift past it entirely (shift = j+1).' },
            { term: 'Good Suffix Rule', definition: 'When a mismatch occurs at pattern[j] but pattern[j+1..m−1] already matched, look for another occurrence of that suffix elsewhere in the pattern (preceded by a different character). If none, find the longest prefix of the pattern that is also a suffix of the matched portion. The shift is the resulting alignment distance.' },
            { term: 'Right-to-Left Comparison', definition: 'Unlike KMP (left-to-right), Boyer-Moore inspects the rightmost character of the pattern first. This is essential for the heuristics to work — a mismatch deep in the window provides much more information about how far to skip than a left-side mismatch would.' },
            { term: 'Sublinear Average Case', definition: 'Because the heuristics frequently advance the window by a value close to m, Boyer-Moore reads only a fraction of the text on typical inputs. Average runtime is O(n/m), making it the practical fastest single-pattern matcher for natural-language text.' },
            { term: 'Galil Variant', definition: 'A modification by Zvi Galil (1979) caches information about previously matched portions of the text to avoid redundant comparisons. This raises the worst case from O(n·m) down to a guaranteed O(n) with no degradation of the average case.' }
        ],
        tradeoffs: {
            pros: [
                'Sublinear average case — fastest single-pattern algorithm in practice for long patterns and large alphabets',
                'Two complementary heuristics — either one alone is decent, together they dominate naive matching',
                'Used inside grep, GNU coreutils, many text editors and IDEs',
                'No backtracking on the text pointer for typical inputs',
                'Great fit for long patterns over rich alphabets (English text, source code, DNA-with-mismatches)'
            ],
            cons: [
                'Worst case O(n·m) without the Galil modification',
                'More complex preprocessing than KMP — the Good Suffix table is non-trivial to implement correctly',
                'Bad Character rule is weak on small alphabets (DNA: |Σ|=4) — Good Suffix dominates there',
                'Requires O(|Σ|) extra space for the Bad Character table when implemented over a bounded alphabet',
                'Not adaptive to streaming text — the window must move backward inside the text region currently being inspected'
            ],
            whenToUse: 'Choose Boyer-Moore when searching for a single pattern in a long text and average-case speed matters more than worst-case guarantees — grep-like utilities, code search, document scanning. For DNA or other tiny alphabets, prefer the Good-Suffix-only variant or KMP. When worst-case linear time is a hard requirement, use the Galil variant or KMP.'
        }
    }
};

AV['boyer-moore'].legendItems = [
    { swatch: 'av-legend-str-default', i18nKey: 'av.legend.str_default' },
    { swatch: 'av-legend-str-comparing', i18nKey: 'av.legend.str_comparing' },
    { swatch: 'av-legend-str-match', i18nKey: 'av.legend.str_match' },
    { swatch: 'av-legend-str-mismatch', i18nKey: 'av.legend.str_mismatch' },
    { swatch: 'av-legend-str-found', i18nKey: 'av.legend.str_found' },
    { swatch: 'av-legend-bm-bc', i18nKey: 'av.legend.str_bc' },
    { swatch: 'av-legend-bm-gs', i18nKey: 'av.legend.str_gs' }
];

/* ---------- Sample Data ---------- */

AV['boyer-moore']._sampleTexts = [
    { text: 'HERE IS A SIMPLE EXAMPLE', pattern: 'EXAMPLE' },
    { text: 'ABAAABCDABABCDABCDABDE', pattern: 'ABCDABD' },
    { text: 'GCATCGCAGAGAGTATACAGTACG', pattern: 'GCAGAGAG' },
    { text: 'AABAACAADAABAABA', pattern: 'AABA' },
    { text: 'WHICH FINALLY HALTS AT THAT POINT', pattern: 'AT THAT' },
    { text: 'abracadabra', pattern: 'abra' }
];

AV['boyer-moore']._pickSample = function() {
    var samples = AV['boyer-moore']._sampleTexts;
    var idx = Math.floor(Math.random() * samples.length);
    return samples[idx];
};

/* ---------- Bad Character Preprocessing ---------- */

/* Positional BC for visualization: for each pattern index j, last index of pattern[j] in pattern[0..j-1], else -1. */
AV['boyer-moore']._computeBCRow = function(pattern) {
    var m = pattern.length;
    var bc = new Array(m).fill(-1);
    var lastSeen = {};
    for (var j = 0; j < m; j++) {
        var c = pattern[j];
        bc[j] = lastSeen[c] !== undefined ? lastSeen[c] : -1;
        lastSeen[c] = j;
    }
    return bc;
};

/* Alphabet-indexed BC for shift computation: char -> last index in pattern. */
AV['boyer-moore']._computeBCAlphabet = function(pattern) {
    var alpha = {};
    for (var j = 0; j < pattern.length; j++) {
        alpha[pattern[j]] = j;
    }
    return alpha;
};

/* ---------- Good Suffix Preprocessing ---------- */

/* Returns shift array of length m+1.
 * shift[i] = how much to shift the pattern when a mismatch occurs at pattern[i-1]
 *           (i.e. pattern[i..m-1] matched as a good suffix). shift[0] = period after a full match.
 */
AV['boyer-moore']._computeGSShift = function(pattern) {
    var m = pattern.length;
    var bpos = new Array(m + 1).fill(0);
    var shift = new Array(m + 1).fill(0);

    /* Strong good suffix */
    var i = m, j = m + 1;
    bpos[i] = j;
    while (i > 0) {
        while (j <= m && pattern[i - 1] !== pattern[j - 1]) {
            if (shift[j] === 0) shift[j] = j - i;
            j = bpos[j];
        }
        i--;
        j--;
        bpos[i] = j;
    }

    /* Case 2: prefix-as-suffix fallback */
    j = bpos[0];
    for (i = 0; i <= m; i++) {
        if (shift[i] === 0) shift[i] = j;
        if (i === j) j = bpos[j];
    }

    return shift;
};

/* Map shift[0..m] -> visualization gsRow[0..m-1] where
 * gsRow[j] = shift on mismatch at pattern[j] (i.e. matched suffix starts at pattern[j+1]).
 * gsRow[m-1] = shift on mismatch at the last char (no good suffix yet) = shift[m] = 1 by convention.
 */
AV['boyer-moore']._computeGSRow = function(pattern) {
    var shift = AV['boyer-moore']._computeGSShift(pattern);
    var m = pattern.length;
    var row = new Array(m).fill(0);
    for (var j = 0; j < m; j++) {
        row[j] = shift[j + 1];
    }
    return row;
};

/* ---------- BC Step Generation ---------- */

AV['boyer-moore']._bcBuildSteps = function(pattern) {
    var m = pattern.length;
    var steps = [];
    var lastSeen = {};
    for (var j = 0; j < m; j++) {
        var c = pattern[j];
        var val = lastSeen[c] !== undefined ? lastSeen[c] : -1;
        steps.push({ type: 'BM_BC_SET', index: j, value: val, char: c });
        lastSeen[c] = j;
    }
    return steps;
};

/* ---------- GS Step Generation ---------- */

AV['boyer-moore']._gsBuildSteps = function(pattern) {
    var gsRow = AV['boyer-moore']._computeGSRow(pattern);
    var steps = [];
    for (var j = 0; j < gsRow.length; j++) {
        steps.push({ type: 'BM_GS_SET', index: j, value: gsRow[j] });
    }
    return steps;
};

/* ---------- Full Boyer-Moore Step Generation ---------- */

AV['boyer-moore']._bmSteps = function(text, pattern) {
    var steps = [];
    var n = text.length;
    var m = pattern.length;

    if (m === 0 || m > n) {
        steps.push({ type: 'DONE' });
        return steps;
    }

    var bcRow = AV['boyer-moore']._computeBCRow(pattern);
    var bcAlpha = AV['boyer-moore']._computeBCAlphabet(pattern);
    var gsRow = AV['boyer-moore']._computeGSRow(pattern);
    var gsShiftFull = AV['boyer-moore']._computeGSShift(pattern);
    var gsAfterMatch = gsShiftFull[0] || m;

    /* Phase 1: build BC */
    var bcSteps = AV['boyer-moore']._bcBuildSteps(pattern);
    for (var b = 0; b < bcSteps.length; b++) steps.push(bcSteps[b]);

    /* Phase 2: build GS */
    var gsSteps = AV['boyer-moore']._gsBuildSteps(pattern);
    for (var g = 0; g < gsSteps.length; g++) steps.push(gsSteps[g]);

    /* Phase 3: search loop. Right-to-left compare within each window. */
    var i = 0;
    while (i <= n - m) {
        var j = m - 1;

        while (j >= 0 && pattern[j] === text[i + j]) {
            steps.push({
                type: 'STR_COMPARE',
                textIndex: i + j,
                patternIndex: j,
                textChar: text[i + j],
                patternChar: pattern[j]
            });
            steps.push({
                type: 'STR_MATCH_CHAR',
                textChar: text[i + j],
                textIndex: i + j,
                patternIndex: j,
                offset: i,
                matched: m - j,
                total: m
            });
            j--;
        }

        if (j < 0) {
            /* Full match */
            steps.push({ type: 'STR_FOUND', position: i, matchEnd: i + m - 1 });

            var oldOffset = i;
            var nextShift = gsAfterMatch;
            var newOffset = i + nextShift;
            if (newOffset <= n - m) {
                steps.push({
                    type: 'STR_SHIFT',
                    oldOffset: oldOffset,
                    newOffset: newOffset,
                    lps: bcRow.slice(),
                    gs: gsRow.slice(),
                    bcShift: 0,
                    gsShift: nextShift,
                    chosenRule: 'gs',
                    skipped: nextShift
                });
            }
            i = newOffset;
        } else {
            /* Mismatch at pattern[j] vs text[i+j] */
            var mismatchedChar = text[i + j];
            steps.push({
                type: 'STR_COMPARE',
                textIndex: i + j,
                patternIndex: j,
                textChar: mismatchedChar,
                patternChar: pattern[j]
            });
            steps.push({
                type: 'STR_MISMATCH',
                textIndex: i + j,
                patternIndex: j,
                textChar: mismatchedChar,
                patternChar: pattern[j],
                lpsValue: 0
            });

            var bcLast = bcAlpha[mismatchedChar] !== undefined ? bcAlpha[mismatchedChar] : -1;
            var bcShift = Math.max(1, j - bcLast);
            var gsShiftVal = gsRow[j] || 1;
            var actualShift = Math.max(bcShift, gsShiftVal);
            var rule = bcShift > gsShiftVal ? 'bc' : (gsShiftVal > bcShift ? 'gs' : 'bc=gs');

            var oldOff2 = i;
            var newOff2 = i + actualShift;
            if (newOff2 <= n - m) {
                steps.push({
                    type: 'STR_SHIFT',
                    oldOffset: oldOff2,
                    newOffset: newOff2,
                    lps: bcRow.slice(),
                    gs: gsRow.slice(),
                    bcShift: bcShift,
                    gsShift: gsShiftVal,
                    chosenRule: rule,
                    skipped: actualShift
                });
            }
            i = newOff2;
        }
    }

    steps.push({ type: 'DONE' });
    return steps;
};

/* ===== Mode: standard ===== */

AV['boyer-moore']['standard'] = {
    init: function() {
        var input = (AV.state._userText && AV.state._userPattern)
            ? { text: AV.state._userText, pattern: AV.state._userPattern }
            : AV['boyer-moore']._pickSample();

        AV.state._isStringAlgorithm = true;
        AV.state._isBoyerMoore = true;
        AV.state._patternOffset = 0;
        delete AV.state._isRabinKarp;
        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        delete AV.state._isDPAlgorithm;
        delete AV.state._searchTarget;
        AV.state._initialArray = [];

        AV.state._text = input.text;
        AV.state._pattern = input.pattern;
        AV.state._bc = AV['boyer-moore']._computeBCRow(input.pattern);
        AV.state._gs = AV['boyer-moore']._computeGSRow(input.pattern);

        var m = input.pattern.length;
        var emptyBc = new Array(m).fill(-1);
        var emptyGs = new Array(m).fill(0);

        AV.renderStringMatch(input.text, input.pattern, 0, emptyBc, emptyGs);
        AV._setStringStatLabels();

        AV._renderStringInputPanel(input.text, input.pattern, function(newText, newPattern) {
            AV.state._userText = newText;
            AV.state._userPattern = newPattern;
            AV.clearLog();
            AV.resetStats();
            if (AV.stepMode.active) AV.exitStepMode();
            AV['boyer-moore']['standard'].init();
        });
    },

    steps: function() {
        return AV['boyer-moore']._bmSteps(AV.state._text, AV.state._pattern);
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('boyer-moore.stepLabel', null, 'Boyer-Moore') };
    },

    run: function() {
        AV['boyer-moore']['standard'].init();
        AV.animateFlow(
            AV['boyer-moore']['standard'].steps(),
            AV['boyer-moore']['standard'].stepOptions()
        );
    }
};
