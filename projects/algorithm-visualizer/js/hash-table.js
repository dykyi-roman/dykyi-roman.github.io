(function() {
    'use strict';

    var TABLE_SIZE = 11;

    var WORD_LIST = [
        'cat', 'dog', 'sun', 'map', 'key', 'box', 'pen', 'cup',
        'hat', 'jar', 'log', 'net', 'owl', 'pie', 'red', 'sky',
        'toy', 'van', 'web', 'zip', 'arm', 'bug', 'cow', 'fig',
        'gem', 'hop', 'ice', 'joy', 'kit', 'oak'
    ];

    AV['hash-table'] = {};

    AV['hash-table']._TABLE_SIZE = TABLE_SIZE;

    AV['hash-table']._charCodeSum = function(key) {
        var s = String(key);
        var sum = 0;
        for (var i = 0; i < s.length; i++) {
            sum += s.charCodeAt(i);
        }
        return sum;
    };

    AV['hash-table']._hash = function(key) {
        return AV['hash-table']._charCodeSum(key) % TABLE_SIZE;
    };

    AV['hash-table']._generateKeys = function(count) {
        var size = count || (8 + Math.floor(Math.random() * 3));
        var numCount = Math.floor(size / 2);
        var wordCount = size - numCount;

        var numSet = {};
        while (Object.keys(numSet).length < numCount) {
            numSet[Math.floor(Math.random() * 90) + 10] = true;
        }
        var nums = Object.keys(numSet).map(Number);

        var shuffledWords = WORD_LIST.slice();
        for (var i = shuffledWords.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = shuffledWords[i];
            shuffledWords[i] = shuffledWords[j];
            shuffledWords[j] = tmp;
        }
        var words = shuffledWords.slice(0, wordCount);

        var keys = nums.concat(words);
        for (var k = keys.length - 1; k > 0; k--) {
            var m = Math.floor(Math.random() * (k + 1));
            var t = keys[k];
            keys[k] = keys[m];
            keys[m] = t;
        }
        return keys;
    };

    /* ===== Modes ===== */
    AV['hash-table'].modes = [
        { id: 'chaining', label: 'Chaining', desc: 'Separate Chaining: each bucket holds a linked list' },
        { id: 'linear-probing', label: 'Linear Probing', desc: 'Open Addressing with Linear Probing' },
        { id: 'search', label: 'Search', desc: 'Search for a value in the hash table' }
    ];

    /* ===== Complexity ===== */
    AV['hash-table'].depRules = [
        { name: 'Time (Average Insert)', role: 'O(1) \u2014 constant with good hash function', type: 'good' },
        { name: 'Time (Average Search)', role: 'O(1) \u2014 constant with good hash function', type: 'good' },
        { name: 'Time (Worst Insert)', role: 'O(n) \u2014 all keys collide to same bucket', type: 'bad' },
        { name: 'Time (Worst Search)', role: 'O(n) \u2014 degenerate chain or full table', type: 'bad' },
        { name: 'Space', role: 'O(n + m) \u2014 n keys + m buckets', type: 'info' },
        { name: 'Hash Function', role: 'h(k) = charSum(k) mod m \u2014 sum of character codes', type: 'info' }
    ];

    /* ===== Legend ===== */
    AV['hash-table'].legendItems = [
        { swatch: 'av-legend-hash-empty', i18nKey: 'av.legend.hash_empty' },
        { swatch: 'av-legend-hash-occupied', i18nKey: 'av.legend.hash_occupied' },
        { swatch: 'av-legend-hash-computing', i18nKey: 'av.legend.hash_computing' },
        { swatch: 'av-legend-hash-collision', i18nKey: 'av.legend.hash_collision' },
        { swatch: 'av-legend-hash-inserting', i18nKey: 'av.legend.hash_inserting' },
        { swatch: 'av-legend-hash-probing', i18nKey: 'av.legend.hash_probing' },
        { swatch: 'av-legend-hash-found', i18nKey: 'av.legend.hash_found' }
    ];

    /* ===== Details ===== */
    AV['hash-table'].details = {
        chaining: {
            principles: [
                'Compute the hash index: h(key) = charSum(key) mod tableSize',
                'If the bucket at index h is empty, insert the key directly',
                'If the bucket is occupied (collision), append the key to the linked list (chain)',
                'Each bucket can hold an unlimited number of keys via chaining',
                'Load factor \u03B1 = n/m can exceed 1 without table restructuring'
            ],
            concepts: [
                { term: 'Hash Function', definition: 'Maps a key to a bucket index. h(k) = charSum(k) mod m sums the character codes of the key. A good hash function distributes keys uniformly across buckets.' },
                { term: 'Collision', definition: 'When two different keys hash to the same bucket index. Inevitable by the Pigeonhole Principle when the number of possible keys exceeds the table size.' },
                { term: 'Separate Chaining', definition: 'Each bucket stores a linked list (chain) of all key-value pairs that hash to that index. Collisions are resolved by appending to the chain.' },
                { term: 'Load Factor', definition: 'Ratio \u03B1 = n/m (keys / table size). Average chain length equals \u03B1. When \u03B1 grows large, chains become long and performance degrades toward O(n).' },
                { term: 'Uniform Hashing', definition: 'The ideal assumption that each key is equally likely to hash to any bucket. Under this assumption, expected chain length is \u03B1, giving O(1) average operations.' }
            ],
            tradeoffs: {
                pros: [
                    'Simple to implement \u2014 just a linked list per bucket',
                    'Handles any load factor \u2014 no need to resize at a specific threshold',
                    'Deletion is straightforward \u2014 just remove from the chain',
                    'Performance degrades gracefully as load factor increases'
                ],
                cons: [
                    'Extra memory for linked list pointers in each chain node',
                    'Poor cache locality \u2014 chain nodes may be scattered in memory',
                    'Worst case O(n) when all keys hash to the same bucket',
                    'Requires dynamic memory allocation for chain nodes'
                ],
                whenToUse: 'Use separate chaining when the load factor is unpredictable, deletions are frequent, or simplicity is preferred. For memory-constrained or cache-sensitive scenarios, prefer open addressing.'
            }
        },
        'linear-probing': {
            principles: [
                'Compute the hash index: h(key) = charSum(key) mod tableSize',
                'If the slot is empty, insert the key directly',
                'If occupied (collision), probe to the next slot: (h + 1) mod m, (h + 2) mod m, ...',
                'Continue probing until an empty slot is found',
                'Load factor must stay below 1.0 \u2014 table must have at least one empty slot'
            ],
            concepts: [
                { term: 'Open Addressing', definition: 'All keys are stored directly in the table (no external chains). On collision, the algorithm probes alternative slots within the table itself.' },
                { term: 'Linear Probing', definition: 'The simplest open addressing strategy: on collision at index h, try h+1, h+2, h+3, etc. (mod table size) until an empty slot is found.' },
                { term: 'Primary Clustering', definition: 'The main weakness of linear probing: consecutive occupied slots form clusters. New keys that hash anywhere into a cluster must traverse it, making clusters grow larger.' },
                { term: 'Load Factor', definition: 'For linear probing, performance degrades sharply as \u03B1 approaches 1. At \u03B1=0.5, average probes \u2248 1.5 (success); at \u03B1=0.9, average probes \u2248 5.5.' },
                { term: 'Tombstone', definition: 'When deleting from an open-addressing table, the slot is marked as \u2018deleted\u2019 (tombstone) rather than emptied, to avoid breaking probe chains.' }
            ],
            tradeoffs: {
                pros: [
                    'Cache-friendly \u2014 probing accesses contiguous memory locations',
                    'No extra pointers or memory allocation \u2014 all data in the array',
                    'Simple implementation \u2014 just array operations',
                    'Good performance at low load factors (< 0.7)'
                ],
                cons: [
                    'Primary clustering degrades performance significantly',
                    'Deletion requires tombstones \u2014 complicates the implementation',
                    'Table must be resized before becoming full (load factor < 1)',
                    'Performance degrades sharply above 70% load factor'
                ],
                whenToUse: 'Use linear probing when memory is at a premium, cache performance matters, and the load factor is kept low (< 0.7). For higher load factors or frequent deletions, prefer chaining.'
            }
        },
        search: {
            principles: [
                'Compute the hash of the target key: h(target) = charSum(target) mod tableSize',
                'Go to the bucket at index h',
                'For chaining: traverse the linked list comparing each node with the target',
                'Return found or not-found result'
            ],
            concepts: [
                { term: 'Successful Search', definition: 'Target key exists in the table. Average probes: 1 + \u03B1/2 for chaining.' },
                { term: 'Unsuccessful Search', definition: 'Target key is not in the table. Requires checking until the end of chain. Average probes: 1 + \u03B1 for chaining.' },
                { term: 'Expected Probes', definition: 'The number of slots examined during a search. Depends on the load factor and collision resolution strategy.' }
            ],
            tradeoffs: {
                pros: [
                    'O(1) average-case search time with a good hash function',
                    'No need to sort the data \u2014 works with any key distribution',
                    'Consistent performance regardless of insertion order'
                ],
                cons: [
                    'O(n) worst case when many collisions occur',
                    'Hash function quality directly affects performance',
                    'Does not support range queries or ordered traversal'
                ],
                whenToUse: 'Use hash-based search for exact-match lookups in large datasets where average O(1) time is critical. For range queries or sorted access, use balanced BSTs.'
            }
        }
    };

    /* ===== Step Generators ===== */
    function chainingSteps(keys) {
        var steps = [];
        var table = [];
        for (var i = 0; i < TABLE_SIZE; i++) table.push([]);

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var h = AV['hash-table']._hash(key);
            steps.push({ type: 'HASH_COMPUTE', key: key, hashValue: h, tableSize: TABLE_SIZE, charCodeSum: AV['hash-table']._charCodeSum(key) });
            steps.push({ type: 'HASH_CHECK_SLOT', index: h, isEmpty: table[h].length === 0, currentValue: table[h][0] || null });

            if (table[h].length === 0) {
                table[h].push(key);
                steps.push({ type: 'HASH_INSERT', key: key, index: h });
            } else {
                steps.push({ type: 'HASH_COLLISION', key: key, index: h, existingValue: table[h][0] });
                table[h].push(key);
                steps.push({ type: 'HASH_CHAIN_ADD', key: key, index: h, chainLength: table[h].length });
            }
        }

        steps.push({ type: 'DONE' });
        return steps;
    }

    function linearProbingSteps(keys) {
        var steps = [];
        var table = new Array(TABLE_SIZE).fill(null);

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var h = AV['hash-table']._hash(key);
            steps.push({ type: 'HASH_COMPUTE', key: key, hashValue: h, tableSize: TABLE_SIZE, charCodeSum: AV['hash-table']._charCodeSum(key) });

            var idx = h;
            var probeNum = 0;
            while (table[idx] !== null) {
                steps.push({ type: 'HASH_CHECK_SLOT', index: idx, isEmpty: false, currentValue: table[idx] });
                steps.push({ type: 'HASH_COLLISION', key: key, index: idx, existingValue: table[idx] });
                probeNum++;
                var prev = idx;
                idx = (idx + 1) % TABLE_SIZE;
                steps.push({ type: 'HASH_PROBE', key: key, fromIndex: prev, toIndex: idx, probeNumber: probeNum });
            }
            steps.push({ type: 'HASH_CHECK_SLOT', index: idx, isEmpty: true, currentValue: null });
            table[idx] = key;
            steps.push({ type: 'HASH_INSERT', key: key, index: idx });
        }

        steps.push({ type: 'DONE' });
        return steps;
    }

    function searchSteps(table, target) {
        var steps = [];
        var h = AV['hash-table']._hash(target);
        steps.push({ type: 'HASH_COMPUTE', key: target, hashValue: h, tableSize: TABLE_SIZE, charCodeSum: AV['hash-table']._charCodeSum(target) });

        var bucket = table[h];
        steps.push({ type: 'HASH_CHECK_SLOT', index: h, isEmpty: bucket.length === 0, currentValue: bucket[0] || null });

        if (bucket.length === 0) {
            steps.push({ type: 'HASH_NOT_FOUND', key: target });
        } else {
            var found = false;
            for (var i = 0; i < bucket.length; i++) {
                steps.push({ type: 'HASH_CHECK_SLOT', index: h, isEmpty: false, currentValue: bucket[i], chainPos: i });
                if (bucket[i] === target) {
                    steps.push({ type: 'HASH_FOUND', key: target, index: h, chainPos: i });
                    found = true;
                    break;
                }
            }
            if (!found) {
                steps.push({ type: 'HASH_NOT_FOUND', key: target });
            }
        }

        steps.push({ type: 'DONE' });
        return steps;
    }

    /* ===== Helpers ===== */
    function buildChainingTable(keys) {
        var table = [];
        for (var i = 0; i < TABLE_SIZE; i++) table.push([]);
        for (var k = 0; k < keys.length; k++) {
            var h = AV['hash-table']._hash(keys[k]);
            table[h].push(keys[k]);
        }
        return table;
    }

    function initCommon(mode) {
        AV.state._isHashAlgorithm = true;
        AV.state._hashMode = mode;
        AV.state._hashTableSize = TABLE_SIZE;
        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        delete AV.state._isDPAlgorithm;
        delete AV.state._isStringAlgorithm;
        AV.state._initialArray = [];
        AV.state.sortedIndices = [];
    }

    function injectSearchTargetUI(target, keys, onUpdate) {
        var container = document.querySelector('.av-hash-container');
        if (!container) return;
        var formula = container.querySelector('.av-hash-formula');

        var options = keys.slice();
        if (options.indexOf(target) === -1) options.push(target);
        options.sort(function(a, b) { return String(a).localeCompare(String(b)); });

        var optionsHtml = options.map(function(w) {
            var val = String(w);
            return '<option value="' + val + '"' + (w === target ? ' selected' : '') + '>' + val + '</option>';
        }).join('');

        var panel = document.createElement('div');
        panel.className = 'av-hash-target-panel';
        panel.innerHTML = '<span class="av-hash-target-label">' + I18N.t('av.hash.searching_label', null, 'Search for:') + '</span>' +
            '<select class="av-hash-target-input" id="av-hash-target-input">' + optionsHtml + '</select>';

        if (formula && formula.nextSibling) {
            container.insertBefore(panel, formula.nextSibling);
        } else {
            container.appendChild(panel);
        }

        var input = document.getElementById('av-hash-target-input');
        if (input) {
            input.addEventListener('change', function() {
                var val = input.value;
                var numVal = Number(val);
                var newTarget = isNaN(numVal) || String(numVal) !== val ? val : numVal;
                onUpdate(newTarget);

                AV.state.running = false;
                AV.state.paused = false;
                if (AV.stepMode && AV.stepMode.active) AV.exitStepMode();

                AV.renderHashTable(AV.state._hashTable, 'chaining');
                AV._setHashStatLabels();
                injectSearchTargetUI(newTarget, AV.state._hashKeys || [], onUpdate);

                AV.animateFlow(
                    searchSteps(AV.state._hashTable, newTarget),
                    AV['hash-table']['search'].stepOptions()
                );
            });
        }
    }

    AV._reinjectSearchTargetUI = function() {
        if (AV.state._hashSearchTarget === undefined) return;
        if (document.querySelector('.av-hash-target-panel')) return;
        injectSearchTargetUI(AV.state._hashSearchTarget, AV.state._hashKeys || [], function(val) {
            AV.state._hashSearchTarget = val;
        });
    };

    /* ===== Mode: Chaining ===== */
    AV['hash-table']['chaining'] = {
        init: function() {
            initCommon('chaining');
            var keys = AV['hash-table']._generateKeys();
            AV.state._hashKeys = keys;

            var emptyTable = [];
            for (var i = 0; i < TABLE_SIZE; i++) emptyTable.push([]);
            AV.state._hashTable = emptyTable;

            AV.renderHashTable(emptyTable, 'chaining');
            AV._setHashStatLabels();
        },
        steps: function() {
            return chainingSteps(AV.state._hashKeys);
        },
        stepOptions: function() {
            return { requestLabel: I18N.t('hash-table.stepLabel', null, 'Hash Table') + ' \u2014 ' + I18N.t('hash-table.modes.chaining.label', null, 'Chaining') };
        },
        run: function() {
            AV['hash-table']['chaining'].init();
            AV.animateFlow(
                AV['hash-table']['chaining'].steps(),
                AV['hash-table']['chaining'].stepOptions()
            );
        }
    };

    /* ===== Mode: Linear Probing ===== */
    AV['hash-table']['linear-probing'] = {
        init: function() {
            initCommon('linear-probing');
            var keys = AV['hash-table']._generateKeys(9);
            AV.state._hashKeys = keys;

            var emptyTable = new Array(TABLE_SIZE).fill(null);
            AV.state._hashTable = emptyTable;

            AV.renderHashTable(emptyTable, 'linear-probing');
            AV._setHashStatLabels();
        },
        steps: function() {
            return linearProbingSteps(AV.state._hashKeys);
        },
        stepOptions: function() {
            return { requestLabel: I18N.t('hash-table.stepLabel', null, 'Hash Table') + ' \u2014 ' + I18N.t('hash-table.modes.linear-probing.label', null, 'Linear Probing') };
        },
        run: function() {
            AV['hash-table']['linear-probing'].init();
            AV.animateFlow(
                AV['hash-table']['linear-probing'].steps(),
                AV['hash-table']['linear-probing'].stepOptions()
            );
        }
    };

    /* ===== Mode: Search ===== */
    AV['hash-table']['search'] = {
        init: function() {
            initCommon('chaining');
            var keys = AV['hash-table']._generateKeys(8);
            AV.state._hashKeys = keys;

            var table = buildChainingTable(keys);
            AV.state._hashTable = table;

            var target;
            if (Math.random() < 0.7) {
                target = keys[Math.floor(Math.random() * keys.length)];
            } else {
                var unused = WORD_LIST.filter(function(w) { return keys.indexOf(w) === -1; });
                if (unused.length > 0) {
                    target = unused[Math.floor(Math.random() * unused.length)];
                } else {
                    do {
                        target = Math.floor(Math.random() * 90) + 10;
                    } while (keys.indexOf(target) !== -1);
                }
            }
            AV.state._hashSearchTarget = target;

            AV.renderHashTable(table, 'chaining');
            AV._setHashStatLabels();

            injectSearchTargetUI(target, keys, function(val) {
                AV.state._hashSearchTarget = val;
            });
        },
        steps: function() {
            return searchSteps(AV.state._hashTable, AV.state._hashSearchTarget);
        },
        stepOptions: function() {
            return { requestLabel: I18N.t('hash-table.stepLabel', null, 'Hash Table') + ' \u2014 ' + I18N.t('hash-table.modes.search.label', null, 'Search') };
        },
        run: function() {
            AV['hash-table']['search'].init();
            AV.animateFlow(
                AV['hash-table']['search'].steps(),
                AV['hash-table']['search'].stepOptions()
            );
        }
    };

})();
