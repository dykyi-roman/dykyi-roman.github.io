/* ===== Rabin-Karp String Matching Algorithm ===== */

AV['rabin-karp'] = {};

AV['rabin-karp'].modes = [
    { id: 'standard', label: 'Rabin-Karp', desc: 'Rabin-Karp algorithm: precomputes a polynomial hash of the pattern, then slides a window of length m across the text. The window hash is updated in O(1) using rolling-hash arithmetic. Character comparison happens only when window hash equals pattern hash, dramatically reducing average-case work.' }
];

AV['rabin-karp'].depRules = [
    { name: 'Time (Average)', role: 'O(n + m) — hashes filter out most windows', type: 'good' },
    { name: 'Time (Worst)', role: 'O(n·m) — many spurious hash collisions', type: 'bad' },
    { name: 'Time (Preprocessing)', role: 'O(m) — hash of pattern + first window', type: 'good' },
    { name: 'Space', role: 'O(1) — only hash values, no LPS table', type: 'good' },
    { name: 'Multiple Matches', role: 'Yes — finds all occurrences', type: 'good' },
    { name: 'Multi-pattern', role: 'Yes — store a set of pattern hashes', type: 'good' },
    { name: 'Backtracking', role: 'No on hash mismatch — immediate window slide', type: 'good' }
];

AV['rabin-karp'].details = {
    standard: {
        principles: [
            'Precompute the polynomial hash H(P) of the pattern in O(m)',
            'Compute the hash H(window) of the first text window of length m in O(m)',
            'Compare H(window) with H(P) — if different, slide the window without inspecting characters',
            'If hashes match, verify character-by-character to rule out a spurious hit',
            'Slide the window: roll the hash in O(1) by removing the leftmost char and adding the next char',
            'Repeat until the window passes the end of the text'
        ],
        concepts: [
            { term: 'Rabin-Karp Algorithm', definition: 'Published by Michael Rabin and Richard Karp (1987). A randomized string-matching algorithm whose strength is O(1) hash updates between consecutive text windows. Average runtime is O(n + m); worst case degrades to O(n·m) only when many windows hash to the same value as the pattern.' },
            { term: 'Polynomial Hash', definition: 'H(s) = (s[0]·d^(m−1) + s[1]·d^(m−2) + … + s[m−1]) mod q, where d is the alphabet size (256 for ASCII) and q is a prime (101 in this visualization). Treats the string as a number in base d.' },
            { term: 'Rolling Hash', definition: 'Given the hash of T[i..i+m−1], the hash of the next window T[i+1..i+m] is computed in O(1): H_new = (d · (H_old − T[i]·d^(m−1)) + T[i+m]) mod q. The leftmost contribution is subtracted, the rest is shifted by one position, and the new char is added.' },
            { term: 'Spurious Hit', definition: 'A window whose hash matches the pattern hash but whose characters differ. Caused by hash collisions (different strings sharing the same hash mod q). Rabin-Karp must verify every hash hit with a full character comparison.' },
            { term: 'Modular Arithmetic', definition: 'All operations are taken mod q to keep hash values bounded. Subtraction can become negative, so the implementation adjusts the result back into [0, q−1] before the modulo.' },
            { term: 'Choice of Base & Prime', definition: 'A larger prime reduces collision probability but produces larger intermediate values. The pair d=256, q=101 is small enough for visualization while preserving the rolling-hash mechanics. Production code uses much larger primes (often 10^9 + 7) and sometimes random primes for adversarial robustness.' }
        ],
        tradeoffs: {
            pros: [
                'Average O(n + m) — each window is filtered by a single integer comparison',
                'Trivial extension to multi-pattern search: maintain a set of pattern hashes and probe each window once',
                'Constant extra space — no preprocessing tables (unlike KMP’s LPS array)',
                'Great fit for plagiarism detection, Rabin fingerprints, content-defined chunking',
                'Hash function and prime can be chosen randomly to defeat adversarial inputs'
            ],
            cons: [
                'Worst case O(n·m) when many windows share the pattern hash',
                'Requires a verification step on every hash hit — not purely linear',
                'Quality depends entirely on the hash function and prime choice',
                'Modular arithmetic and rolling formula are subtler to implement correctly than naive matching',
                'Single small prime (as in this visualization) is unsafe in production: choose a large prime or double hashing'
            ],
            whenToUse: 'Choose Rabin-Karp when searching for many patterns at once (signature matching, plagiarism detection, file deduplication) or when a hash-based fingerprint is already part of the data flow. For a single short pattern with worst-case guarantees, prefer KMP or Boyer-Moore.'
        }
    }
};

AV['rabin-karp'].legendItems = [
    { swatch: 'av-legend-str-default', i18nKey: 'av.legend.str_default' },
    { swatch: 'av-legend-rk-hash-compare', i18nKey: 'av.legend.rk_hash_compare' },
    { swatch: 'av-legend-rk-hash-equal', i18nKey: 'av.legend.rk_hash_equal' },
    { swatch: 'av-legend-rk-hash-diff', i18nKey: 'av.legend.rk_hash_diff' },
    { swatch: 'av-legend-str-mismatch', i18nKey: 'av.legend.rk_spurious' },
    { swatch: 'av-legend-str-found', i18nKey: 'av.legend.str_found' }
];

/* ---------- Sample Data ---------- */

AV['rabin-karp']._sampleTexts = [
    { text: 'AABAACAADAABAABA', pattern: 'AABA' },
    { text: 'abracadabra', pattern: 'abra' },
    { text: 'mississippi', pattern: 'issi' },
    { text: 'GEEKS FOR GEEKS', pattern: 'GEEK' },
    { text: '3141592653589793', pattern: '265' },
    { text: 'banana banana band', pattern: 'ban' }
];

AV['rabin-karp']._pickSample = function() {
    var samples = AV['rabin-karp']._sampleTexts;
    var idx = Math.floor(Math.random() * samples.length);
    return samples[idx];
};

/* ---------- Hash Helpers ---------- */

AV['rabin-karp']._BASE = 256;
AV['rabin-karp']._PRIME = 101;

AV['rabin-karp']._computeHash = function(s, len) {
    var d = AV['rabin-karp']._BASE;
    var q = AV['rabin-karp']._PRIME;
    var h = 0;
    for (var i = 0; i < len; i++) {
        h = (d * h + s.charCodeAt(i)) % q;
    }
    return h;
};

AV['rabin-karp']._highPower = function(m) {
    /* h = d^(m-1) mod q */
    var d = AV['rabin-karp']._BASE;
    var q = AV['rabin-karp']._PRIME;
    var hp = 1;
    for (var i = 0; i < m - 1; i++) {
        hp = (hp * d) % q;
    }
    return hp;
};

AV['rabin-karp']._rollHash = function(oldHash, oldChar, newChar, highPower) {
    var d = AV['rabin-karp']._BASE;
    var q = AV['rabin-karp']._PRIME;
    var h = (d * (oldHash - oldChar.charCodeAt(0) * highPower) + newChar.charCodeAt(0)) % q;
    if (h < 0) h += q;
    return h;
};

/* ---------- Step Generation ---------- */

AV['rabin-karp']._rkSteps = function(text, pattern) {
    var steps = [];
    var n = text.length;
    var m = pattern.length;
    if (m === 0 || m > n) {
        steps.push({ type: 'DONE' });
        return steps;
    }

    var d = AV['rabin-karp']._BASE;
    var q = AV['rabin-karp']._PRIME;
    var hp = AV['rabin-karp']._highPower(m);

    var patternHash = AV['rabin-karp']._computeHash(pattern, m);
    var windowHash = AV['rabin-karp']._computeHash(text, m);

    /* Phase 1: announce pattern hash */
    steps.push({
        type: 'RK_HASH_PATTERN',
        pattern: pattern,
        patternHash: patternHash,
        m: m,
        d: d,
        q: q
    });

    /* Phase 2: announce initial window hash */
    steps.push({
        type: 'RK_HASH_INIT',
        window: text.substring(0, m),
        windowHash: windowHash,
        offset: 0,
        m: m,
        d: d,
        q: q
    });

    var i = 0;
    while (i <= n - m) {
        steps.push({
            type: 'RK_COMPARE_HASH',
            offset: i,
            windowHash: windowHash,
            patternHash: patternHash,
            window: text.substring(i, i + m)
        });

        if (windowHash === patternHash) {
            steps.push({
                type: 'RK_HASH_HIT',
                offset: i,
                windowHash: windowHash,
                patternHash: patternHash,
                window: text.substring(i, i + m)
            });

            /* Verify character by character */
            var matched = true;
            for (var j = 0; j < m; j++) {
                steps.push({
                    type: 'STR_COMPARE',
                    textIndex: i + j,
                    patternIndex: j,
                    textChar: text[i + j],
                    patternChar: pattern[j]
                });
                if (text[i + j] === pattern[j]) {
                    steps.push({
                        type: 'STR_MATCH_CHAR',
                        textChar: text[i + j],
                        textIndex: i + j,
                        patternIndex: j,
                        offset: i,
                        matched: j + 1,
                        total: m
                    });
                } else {
                    steps.push({
                        type: 'STR_MISMATCH',
                        textIndex: i + j,
                        patternIndex: j,
                        textChar: text[i + j],
                        patternChar: pattern[j],
                        lpsValue: 0
                    });
                    matched = false;
                    break;
                }
            }

            if (matched) {
                steps.push({ type: 'STR_FOUND', position: i, matchEnd: i + m - 1 });
            } else {
                steps.push({
                    type: 'RK_SPURIOUS',
                    offset: i,
                    window: text.substring(i, i + m),
                    pattern: pattern,
                    windowHash: windowHash,
                    patternHash: patternHash
                });
            }
        } else {
            steps.push({
                type: 'RK_HASH_MISMATCH',
                offset: i,
                windowHash: windowHash,
                patternHash: patternHash
            });
        }

        /* Advance the window unless we've reached the last possible offset */
        if (i < n - m) {
            var oldChar = text[i];
            var newChar = text[i + m];
            var newHash = AV['rabin-karp']._rollHash(windowHash, oldChar, newChar, hp);

            steps.push({
                type: 'RK_ROLL_HASH',
                oldOffset: i,
                newOffset: i + 1,
                oldHash: windowHash,
                newHash: newHash,
                oldChar: oldChar,
                newChar: newChar,
                oldCharCode: oldChar.charCodeAt(0),
                newCharCode: newChar.charCodeAt(0),
                highPower: hp,
                d: d,
                q: q,
                m: m,
                window: text.substring(i + 1, i + 1 + m)
            });

            windowHash = newHash;
        }

        i++;
    }

    steps.push({ type: 'DONE' });
    return steps;
};

/* ===== Mode: standard ===== */

AV['rabin-karp']['standard'] = {
    init: function() {
        var input = (AV.state._userText && AV.state._userPattern)
            ? { text: AV.state._userText, pattern: AV.state._userPattern }
            : AV['rabin-karp']._pickSample();

        AV.state._isStringAlgorithm = true;
        AV.state._isRabinKarp = true;
        AV.state._patternOffset = 0;
        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        delete AV.state._isDPAlgorithm;
        delete AV.state._searchTarget;
        AV.state._initialArray = [];

        AV.state._text = input.text;
        AV.state._pattern = input.pattern;

        var m = input.pattern.length;
        var patternHash = AV['rabin-karp']._computeHash(input.pattern, m);
        var windowHash = (m <= input.text.length)
            ? AV['rabin-karp']._computeHash(input.text, m)
            : null;

        AV.state._rkPatternHash = patternHash;
        AV.state._rkWindowHash = windowHash;
        AV.state._rkBase = AV['rabin-karp']._BASE;
        AV.state._rkPrime = AV['rabin-karp']._PRIME;
        AV.state._rkSpuriousHits = 0;

        AV.renderRabinKarpMatch(input.text, input.pattern, 0, patternHash, windowHash, null);
        AV._setRabinKarpStatLabels();

        AV._renderStringInputPanel(input.text, input.pattern, function(newText, newPattern) {
            AV.state._userText = newText;
            AV.state._userPattern = newPattern;
            AV.clearLog();
            AV.resetStats();
            if (AV.stepMode.active) AV.exitStepMode();
            AV['rabin-karp']['standard'].init();
        });
    },

    steps: function() {
        return AV['rabin-karp']._rkSteps(AV.state._text, AV.state._pattern);
    },

    stepOptions: function() {
        return { requestLabel: I18N.t('rabin-karp.stepLabel', null, 'Rabin-Karp') };
    },

    run: function() {
        AV['rabin-karp']['standard'].init();
        AV.animateFlow(
            AV['rabin-karp']['standard'].steps(),
            AV['rabin-karp']['standard'].stepOptions()
        );
    }
};
