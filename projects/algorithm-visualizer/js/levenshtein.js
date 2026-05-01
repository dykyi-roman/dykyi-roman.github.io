/* ===== Levenshtein Distance (Edit Distance) ===== */

AV['levenshtein'] = {};

AV['levenshtein'].modes = [
    { id: 'tabulation', label: 'Tabulation', desc: 'Bottom-up dynamic programming: builds an (m+1)×(n+1) table where dp[i][j] is the minimum number of single-character insert / delete / replace operations to transform s1[0..i−1] into s2[0..j−1]. After filling the table, a traceback from dp[m][n] reconstructs one optimal edit sequence.' }
];

AV['levenshtein'].depRules = [
    { name: 'Time', role: 'O(m · n) — every cell computed exactly once', type: 'info' },
    { name: 'Space', role: 'O(m · n) — full DP table; can be reduced to O(min(m,n))', type: 'info' },
    { name: 'Best Case', role: 'O(m · n) — same as worst (no early exit)', type: 'bad' },
    { name: 'Worst Case', role: 'O(m · n) — entire table required for traceback', type: 'info' },
    { name: 'Operations', role: 'Insert, Delete, Replace (each unit cost)', type: 'info' },
    { name: 'Traceback', role: 'O(m + n) — reconstructs the optimal alignment', type: 'good' }
];

AV['levenshtein'].details = {
    tabulation: {
        principles: [
            'Base cases: dp[0][j] = j (insert j chars), dp[i][0] = i (delete i chars)',
            'For each pair (i, j): if s1[i−1] == s2[j−1] then dp[i][j] = dp[i−1][j−1]',
            'Otherwise dp[i][j] = 1 + min(dp[i−1][j], dp[i][j−1], dp[i−1][j−1])',
            'The three neighbors correspond to delete, insert, replace operations',
            'Final answer dp[m][n] is the minimum edit distance',
            'Traceback from dp[m][n] toward dp[0][0] reconstructs one optimal sequence of edits'
        ],
        concepts: [
            { term: 'Edit Distance', definition: 'The minimum number of single-character operations (insertion, deletion, substitution) required to transform one string into another. Introduced by Vladimir Levenshtein in 1965.' },
            { term: 'Optimal Substructure', definition: 'The distance between s1[0..i] and s2[0..j] depends only on distances of three smaller subproblems: dp[i−1][j−1], dp[i−1][j], dp[i][j−1]. This recursive structure is what makes DP applicable.' },
            { term: 'Three Neighbors', definition: 'dp[i−1][j] (delete from s1), dp[i][j−1] (insert into s1), and dp[i−1][j−1] (replace or match). On each cell, the algorithm reads exactly these three predecessors.' },
            { term: 'Match vs Replace', definition: 'When s1[i−1] equals s2[j−1], the diagonal value is taken without adding a cost (match). Otherwise dp[i−1][j−1] + 1 represents a substitution.' },
            { term: 'Traceback', definition: 'Starting from dp[m][n], at each cell pick a predecessor that produced the current value. The chosen direction reveals which operation was applied: ↖ match/replace, ↑ delete, ← insert.' },
            { term: 'Applications', definition: 'Spell-checkers, fuzzy text search, DNA/protein sequence alignment, diff utilities, OCR error correction, autocomplete suggestions.' }
        ],
        tradeoffs: {
            pros: [
                'Guaranteed optimal — always returns the minimum edit distance',
                'Handles arbitrary alphabets and string lengths',
                'Easy to extend with custom operation costs (weighted Levenshtein)',
                'Traceback recovers the actual edit sequence, not just the distance',
                'Predictable O(m · n) time — no worst-case blow-up'
            ],
            cons: [
                'O(m · n) memory — prohibitive for very long strings',
                'No early termination — entire table is filled even for distant strings',
                'Quadratic time is too slow for strings of length > 10⁴ each',
                'Does not exploit the structure of small distances (e.g., bounded edit distance can use O(k · min(m, n)))',
                'Standard variant ignores transposition (swap of adjacent chars) — see Damerau–Levenshtein'
            ],
            whenToUse: 'Suitable when both strings are short to moderate (typically each up to a few thousand characters), the exact distance is required, and the edit operations themselves are useful (alignment, diff). For threshold-based fuzzy matching prefer bit-parallel methods or bounded variants; for very long sequences prefer Hirschberg’s linear-space algorithm or specialized aligners.'
        }
    }
};

AV['levenshtein'].legendItems = [
    { swatch: 'av-legend-lev-base',      i18nKey: 'av.legend.lev_base' },
    { swatch: 'av-legend-lev-reading',   i18nKey: 'av.legend.lev_reading' },
    { swatch: 'av-legend-lev-computing', i18nKey: 'av.legend.lev_computing' },
    { swatch: 'av-legend-lev-computed',  i18nKey: 'av.legend.lev_computed' },
    { swatch: 'av-legend-lev-result',    i18nKey: 'av.legend.lev_result' },
    { swatch: 'av-legend-lev-path',      i18nKey: 'av.legend.lev_path' }
];

/* ---------- Sample Data ---------- */

AV['levenshtein']._sampleStrings = [
    { s1: 'kitten',  s2: 'sitting'  },
    { s1: 'flaw',    s2: 'lawn'     },
    { s1: 'gumbo',   s2: 'gambol'   },
    { s1: 'sunday',  s2: 'saturday' },
    { s1: 'horse',   s2: 'ros'      },
    { s1: 'intention', s2: 'execution' }
];

AV['levenshtein']._pickSample = function() {
    var samples = AV['levenshtein']._sampleStrings;
    var idx = Math.floor(Math.random() * samples.length);
    return samples[idx];
};

/* ---------- Step Generation ---------- */

AV['levenshtein']._generateSteps = function(s1, s2) {
    var m = s1.length;
    var n = s2.length;
    var steps = [];
    var dp = [];
    for (var ri = 0; ri <= m; ri++) {
        dp.push(new Array(n + 1).fill(0));
    }

    /* Base cases: row 0 and column 0 */
    for (var j = 0; j <= n; j++) {
        dp[0][j] = j;
        steps.push({ type: 'LEV_BASE', i: 0, j: j, value: j, axis: 'row' });
    }
    for (var i = 1; i <= m; i++) {
        dp[i][0] = i;
        steps.push({ type: 'LEV_BASE', i: i, j: 0, value: i, axis: 'col' });
    }

    /* Fill the DP table row by row */
    for (var ii = 1; ii <= m; ii++) {
        for (var jj = 1; jj <= n; jj++) {
            var c1 = s1.charAt(ii - 1);
            var c2 = s2.charAt(jj - 1);
            var match = c1 === c2;

            steps.push({
                type: 'LEV_COMPARE_CHARS',
                i: ii, j: jj,
                c1: c1, c2: c2, match: match
            });

            var up   = dp[ii - 1][jj];
            var left = dp[ii][jj - 1];
            var diag = dp[ii - 1][jj - 1];

            steps.push({
                type: 'LEV_READ_NEIGHBORS',
                i: ii, j: jj,
                up: up, left: left, diag: diag
            });

            var value, op, formula;
            if (match) {
                value = diag;
                op = 'match';
                formula = 'dp[' + (ii - 1) + '][' + (jj - 1) + '] = ' + diag;
            } else {
                var minVal = Math.min(up, left, diag);
                value = minVal + 1;
                if (minVal === diag) {
                    op = 'replace';
                    formula = '1 + dp[' + (ii - 1) + '][' + (jj - 1) + '] = 1 + ' + diag;
                } else if (minVal === up) {
                    op = 'delete';
                    formula = '1 + dp[' + (ii - 1) + '][' + jj + '] = 1 + ' + up;
                } else {
                    op = 'insert';
                    formula = '1 + dp[' + ii + '][' + (jj - 1) + '] = 1 + ' + left;
                }
            }

            dp[ii][jj] = value;

            steps.push({
                type: 'LEV_FILL',
                i: ii, j: jj,
                value: value, op: op, formula: formula,
                up: up, left: left, diag: diag, match: match
            });
        }
    }

    /* Result */
    steps.push({ type: 'LEV_RESULT', i: m, j: n, value: dp[m][n] });

    /* Traceback: walk from (m,n) to (0,0) */
    var path = [];
    var ti = m;
    var tj = n;
    path.push({ i: ti, j: tj, op: 'end' });
    while (ti > 0 || tj > 0) {
        var op2;
        if (ti > 0 && tj > 0 && s1.charAt(ti - 1) === s2.charAt(tj - 1)) {
            ti--; tj--;
            op2 = 'match';
        } else if (ti > 0 && tj > 0 && dp[ti][tj] === dp[ti - 1][tj - 1] + 1) {
            ti--; tj--;
            op2 = 'replace';
        } else if (ti > 0 && dp[ti][tj] === dp[ti - 1][tj] + 1) {
            ti--;
            op2 = 'delete';
        } else if (tj > 0 && dp[ti][tj] === dp[ti][tj - 1] + 1) {
            tj--;
            op2 = 'insert';
        } else if (ti > 0) {
            ti--;
            op2 = 'delete';
        } else {
            tj--;
            op2 = 'insert';
        }
        path.push({ i: ti, j: tj, op: op2 });
    }
    /* Emit traceback from start (0,0) to end (m,n) for clearer reading order */
    for (var pi = path.length - 1; pi >= 0; pi--) {
        steps.push({ type: 'LEV_TRACE_STEP', i: path[pi].i, j: path[pi].j, op: path[pi].op });
    }

    steps.push({ type: 'DONE', distance: dp[m][n] });
    return steps;
};

/* ===== Mode: tabulation ===== */

AV['levenshtein']['tabulation'] = {
    init: function() {
        var input = (AV.state._userS1 && AV.state._userS2)
            ? { s1: AV.state._userS1, s2: AV.state._userS2 }
            : AV['levenshtein']._pickSample();

        AV.state._isLevAlgorithm = true;
        AV.state._isStringAlgorithm = false;
        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        delete AV.state._isDPAlgorithm;
        delete AV.state._searchTarget;
        AV.state._initialArray = [];

        AV.state._s1 = input.s1;
        AV.state._s2 = input.s2;

        AV.renderLevMatrix(input.s1, input.s2);
        AV._setLevStatLabels();

        AV._renderLevInputPanel(input.s1, input.s2, function(newS1, newS2) {
            AV.state._userS1 = newS1;
            AV.state._userS2 = newS2;
            AV.clearLog();
            AV.resetStats();
            if (AV.stepMode.active) AV.exitStepMode();
            AV['levenshtein']['tabulation'].init();
        });
    },

    steps: function() {
        return AV['levenshtein']._generateSteps(AV.state._s1, AV.state._s2);
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('levenshtein.stepLabel', null, 'Levenshtein — Tabulation') };
    },

    run: function() {
        AV['levenshtein']['tabulation'].init();
        AV.animateFlow(
            AV['levenshtein']['tabulation'].steps(),
            AV['levenshtein']['tabulation'].stepOptions()
        );
    }
};
