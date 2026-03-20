/* ===== Main App: Algorithm Switching, Controls, Bootstrap ===== */

(function() {
    'use strict';

    var categoryAlgorithms = {
        sorting: ['bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort', 'heap-sort', 'counting-sort', 'radix-sort'],
        searching: ['linear-search', 'binary-search', 'jump-search', 'interpolation-search'],
        graph: ['bfs', 'dfs', 'dijkstra', 'a-star', 'bellman-ford', 'kruskal', 'prim'],
        tree: ['bst-operations', 'avl-tree', 'red-black-tree', 'trie'],
        dp: ['fibonacci', 'knapsack', 'lcs', 'lis', 'coin-change'],
        string: ['kmp', 'rabin-karp', 'boyer-moore', 'levenshtein'],
        hashing: ['hash-table', 'chaining', 'open-addressing']
    };

    var implementedAlgorithms = ['bubble-sort', 'linear-search', 'bfs', 'bst-operations'];

    var activeCategory = 'sorting';

    var algorithmNames = {
        'bubble-sort': 'Bubble Sort', 'selection-sort': 'Selection Sort',
        'insertion-sort': 'Insertion Sort', 'merge-sort': 'Merge Sort',
        'quick-sort': 'Quick Sort', 'heap-sort': 'Heap Sort',
        'counting-sort': 'Counting Sort', 'radix-sort': 'Radix Sort',
        'linear-search': 'Linear Search', 'binary-search': 'Binary Search',
        'jump-search': 'Jump Search', 'interpolation-search': 'Interpolation Search',
        'bfs': 'BFS', 'dfs': 'DFS', 'dijkstra': 'Dijkstra',
        'a-star': 'A*', 'bellman-ford': 'Bellman-Ford',
        'kruskal': 'Kruskal', 'prim': 'Prim',
        'bst-operations': 'BST Operations', 'avl-tree': 'AVL Tree',
        'red-black-tree': 'Red-Black Tree', 'trie': 'Trie',
        'fibonacci': 'Fibonacci', 'knapsack': 'Knapsack',
        'lcs': 'LCS', 'lis': 'LIS', 'coin-change': 'Coin Change',
        'kmp': 'KMP', 'rabin-karp': 'Rabin-Karp',
        'boyer-moore': 'Boyer-Moore', 'levenshtein': 'Levenshtein',
        'hash-table': 'Hash Table', 'chaining': 'Chaining',
        'open-addressing': 'Open Addressing'
    };

    function buildAlgorithmConfig(id) {
        return {
            name: algorithmNames[id] || id,
            modes: AV[id].modes,
            initMode: function(modeId) {
                var a = AV[id];
                if (a[modeId]) a[modeId].init();
            },
            depRules: AV[id].depRules
        };
    }

    var algorithmConfigs = {};
    implementedAlgorithms.forEach(function(id) {
        if (AV[id]) algorithmConfigs[id] = buildAlgorithmConfig(id);
    });

    function getCategoryForAlgorithm(algorithmId) {
        var cats = Object.keys(categoryAlgorithms);
        for (var i = 0; i < cats.length; i++) {
            if (categoryAlgorithms[cats[i]].indexOf(algorithmId) !== -1) return cats[i];
        }
        return 'sorting';
    }

    function switchCategory(category) {
        activeCategory = category;

        document.querySelectorAll('.av-category').forEach(function(btn) {
            var isCurrent = btn.dataset.category === category;
            btn.classList.toggle('active', isCurrent);
            btn.setAttribute('aria-selected', isCurrent);
        });

        var algorithms = categoryAlgorithms[category] || [];
        var nav = document.getElementById('av-nav');
        nav.innerHTML = algorithms.map(function(id, idx) {
            var isImplemented = implementedAlgorithms.indexOf(id) !== -1;
            var isFirst = idx === 0 && isImplemented;
            var cls = 'av-tab' + (isFirst ? ' active' : '') + (isImplemented ? '' : ' disabled');
            var name = algorithmNames[id] || id;
            return '<button class="' + cls + '" data-algorithm="' + id + '" role="tab" aria-selected="' + isFirst + '">' + name + '</button>';
        }).join('');

        var firstImplemented = algorithms.find(function(id) { return implementedAlgorithms.indexOf(id) !== -1; });
        if (firstImplemented && algorithmConfigs[firstImplemented]) {
            switchAlgorithm(firstImplemented);
        } else {
            document.getElementById('av-canvas').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:400px;color:var(--av-text-light);font-size:16px;">' +
                I18N.t('av.coming_soon', null, 'Coming soon...') + '</div>';
            document.getElementById('av-desc').textContent = '';
            document.getElementById('av-details').style.display = 'none';
            document.getElementById('tradeoffs-panel').style.display = 'none';
            document.getElementById('dep-rules-body').innerHTML = '';
            document.getElementById('mode-tabs').style.display = 'none';
        }
    }

    function updateHash(algorithmId, modeId) {
        history.replaceState(null, '', '#' + algorithmId + '/' + modeId);
    }

    function readHash() {
        var hash = location.hash.replace('#', '');
        if (!hash) return null;
        var parts = hash.split('/');
        if (parts.length === 2 && algorithmConfigs[parts[0]]) {
            var config = algorithmConfigs[parts[0]];
            if (config.modes.some(function(m) { return m.id === parts[1]; })) {
                return { algorithm: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    var defaultLegendHTML =
        '<div class="av-legend-item"><span class="av-legend-swatch av-legend-default"></span> <span data-i18n="av.legend.default">' + 'Default' + '</span></div>' +
        '<div class="av-legend-item"><span class="av-legend-swatch av-legend-comparing"></span> <span data-i18n="av.legend.comparing">' + 'Comparing' + '</span></div>' +
        '<div class="av-legend-item"><span class="av-legend-swatch av-legend-swapping"></span> <span data-i18n="av.legend.swapping">' + 'Swapping' + '</span></div>' +
        '<div class="av-legend-item"><span class="av-legend-swatch av-legend-sorted"></span> <span data-i18n="av.legend.sorted">' + 'Sorted' + '</span></div>';

    function updateLegend(algorithmId) {
        var legendEl = document.querySelector('.av-legend');
        if (!legendEl) return;

        var algoObj = AV[algorithmId];
        if (algoObj && algoObj.legendItems) {
            legendEl.innerHTML = algoObj.legendItems.map(function(item) {
                var label = I18N.t(item.i18nKey, null, item.i18nKey);
                var content = item.swatchContent || '';
                return '<div class="av-legend-item"><span class="av-legend-swatch ' + item.swatch + '">' + content + '</span> <span data-i18n="' + item.i18nKey + '">' + label + '</span></div>';
            }).join('');
        } else {
            legendEl.innerHTML = defaultLegendHTML;
            I18N.applyToDOM();
        }
    }

    function removeSearchUI() {
        var banner = document.querySelector('.av-target-banner');
        if (banner) banner.remove();
        var line = document.querySelector('.av-target-line');
        if (line) line.remove();
        delete AV.state._searchTarget;
    }

    function removeGraphUI() {
        var panel = document.querySelector('.av-queue-panel');
        if (panel) panel.remove();
        var svg = document.querySelector('.av-graph-svg');
        if (svg) svg.remove();
        delete AV.state._graphData;
        delete AV.state._isTreeAlgorithm;
        AV._removeInsertBanner();
        AV._restoreArrayStatLabels();
    }

    function switchAlgorithm(algorithmId, modeId) {
        AV.state.algorithm = algorithmId;
        AV.setAccentColors(algorithmId);
        removeSearchUI();
        removeGraphUI();

        document.querySelectorAll('.av-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.algorithm === algorithmId);
            tab.setAttribute('aria-selected', tab.dataset.algorithm === algorithmId);
        });

        AV.clearLog();
        AV.resetStats();
        if (AV.stepMode.active) AV.exitStepMode();
        updateLegend(algorithmId);

        var config = algorithmConfigs[algorithmId];
        renderModeTabs(algorithmId);
        switchMode(algorithmId, modeId || config.modes[0].id);

        if (config.depRules) {
            AV.showComplexity(config.depRules, algorithmId + '.depRules');
        }
    }

    function renderModeTabs(algorithmId) {
        var config = algorithmConfigs[algorithmId];
        var tabsEl = document.getElementById('mode-tabs');
        tabsEl.style.display = config.modes.length <= 1 ? 'none' : '';
        tabsEl.innerHTML = config.modes.map(function(m) {
            var label = I18N.t(algorithmId + '.modes.' + m.id + '.label', null, m.label);
            return '<button class="mode-tab" data-mode="' + m.id + '" role="tab">' + label + '</button>';
        }).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.onclick = function() { switchMode(algorithmId, tab.dataset.mode); };
        });
    }

    function switchMode(algorithmId, modeId) {
        AV.state.mode = modeId;
        updateHash(algorithmId, modeId);
        var config = algorithmConfigs[algorithmId];
        var modeConfig = config.modes.find(function(m) { return m.id === modeId; });

        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        var descText = modeConfig ? I18N.t(algorithmId + '.modes.' + modeId + '.desc', null, modeConfig.desc) : '';
        document.getElementById('av-desc').textContent = descText;

        updateAlgorithmDetails(algorithmId, modeId);

        AV.resetStats();
        AV.clearLog();
        if (AV.stepMode.active) AV.exitStepMode();

        config.initMode(modeId);

        if (config.depRules) {
            AV.showComplexity(config.depRules, algorithmId + '.depRules');
        }
    }

    function getCurrentMode() {
        var algorithmId = AV.state.algorithm;
        var modeId = AV.state.mode;
        var a = AV[algorithmId];
        return a && a[modeId] ? a[modeId] : null;
    }

    /* Expose for engine's switchToStepMode */
    AV._getCurrentMode = getCurrentMode;

    function updateAlgorithmDetails(algorithmId, modeId) {
        var container = document.getElementById('av-details');
        var body = document.getElementById('av-details-body');
        var toggle = document.getElementById('av-details-toggle');
        if (!container || !body || !toggle) return;

        var algoObj = AV[algorithmId];
        var details = algoObj && algoObj.details && algoObj.details[modeId];
        if (!details) {
            container.style.display = 'none';
            body.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        var i18nPrefix = algorithmId + '.details.' + modeId;
        var principles = I18N.ta(i18nPrefix + '.principles', details.principles);
        var concepts = I18N.to(i18nPrefix + '.concepts', details.concepts);

        var html = '';
        if (principles && principles.length) {
            html += '<div class="av-details-section">' +
                '<div class="av-details-section-title">' + I18N.t('ui.details.principles', null, 'Principles') + '</div>' +
                '<ul class="av-details-list">' +
                principles.map(function(p) { return '<li>' + p + '</li>'; }).join('') +
                '</ul></div>';
        }
        if (concepts && concepts.length) {
            html += '<div class="av-details-section">' +
                '<div class="av-details-section-title">' + I18N.t('ui.details.concepts', null, 'Key Concepts') + '</div>' +
                '<div class="av-concepts-grid">' +
                concepts.map(function(c) {
                    return '<div class="av-concept">' +
                        '<span class="av-concept-term">' + c.term + '</span>' +
                        '<span class="av-concept-def">' + c.definition + '</span>' +
                        '</div>';
                }).join('') +
                '</div></div>';
        }

        body.innerHTML = html;
        body.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
        container.style.display = 'block';

        var tradeoffs = details.tradeoffs || null;
        AV.showTradeoffs(tradeoffs, i18nPrefix);
    }

    function setupControls() {
        var pauseBtn = document.getElementById('btn-pause');

        document.getElementById('btn-run').onclick = function() {
            var mode = getCurrentMode();
            if (mode && mode.run) {
                AV.state.paused = false;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
                mode.run();
            }
        };

        pauseBtn.onclick = function() {
            if (!AV.state.running) return;
            if (AV.state.paused) {
                AV.resume();
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            } else {
                AV.pause();
                pauseBtn.innerHTML = '&#x25B6; ' + I18N.t('ui.btn.resume', null, 'Resume');
            }
        };

        document.getElementById('btn-reset').onclick = function() {
            AV.state.running = false;
            AV.state.paused = false;
            AV.resume();
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            if (AV.stepMode.active) AV.exitStepMode();
            switchAlgorithm(AV.state.algorithm);
            AV.log('REQUEST', I18N.t('ui.log.reset', null, 'State reset — new array generated'));
        };

        document.getElementById('btn-copy-log').onclick = function() {
            AV.copyLog();
        };
        document.getElementById('btn-clear-log').onclick = function() {
            AV.clearLog();
        };

        var speedRange = document.getElementById('speed-range');
        function updateSpeedLabel(val) {
            var v = parseInt(val);
            AV.state.stepDelay = 1300 - v;
            if (v <= 300) speedRange.title = I18N.t('ui.speed.slow', null, 'Slow');
            else if (v <= 700) speedRange.title = I18N.t('ui.speed.normal', null, 'Normal');
            else if (v <= 1000) speedRange.title = I18N.t('ui.speed.fast', null, 'Fast');
            else speedRange.title = I18N.t('ui.speed.ultra', null, 'Ultra');
        }
        speedRange.oninput = function() { updateSpeedLabel(this.value); I18N.saveSpeed(this.value); };
        var savedSpeed = I18N.loadSpeed();
        if (savedSpeed) { speedRange.value = savedSpeed; }
        updateSpeedLabel(speedRange.value);

        document.getElementById('av-details-toggle').onclick = function() {
            var body = document.getElementById('av-details-body');
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            body.classList.toggle('expanded');
        };

        document.getElementById('tradeoffs-toggle').onclick = function() {
            var body = document.getElementById('tradeoffs-body');
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            body.classList.toggle('expanded');
        };

        document.getElementById('btn-step-mode').onclick = function() {
            if (AV.state.running && AV.state.paused) {
                AV.switchToStepMode();
                return;
            }
            if (AV.stepMode.active) {
                AV.exitStepMode();
                switchAlgorithm(AV.state.algorithm);
                return;
            }
            var mode = getCurrentMode();
            if (!mode || !mode.steps) return;
            var steps = mode.steps();
            AV.startStepMode(steps, mode.stepOptions ? mode.stepOptions() : {}, AV.state._initialArray);
        };

        document.getElementById('btn-step-fwd').onclick = function() { AV.stepForward(); };
        document.getElementById('btn-step-back').onclick = function() { AV.stepBack(); };

        /* Algorithm tab delegation */
        document.getElementById('av-nav').addEventListener('click', function(e) {
            var tab = e.target.closest('.av-tab');
            if (tab && tab.dataset.algorithm && !tab.classList.contains('disabled')) {
                switchAlgorithm(tab.dataset.algorithm);
            }
        });

        /* Category buttons */
        document.querySelectorAll('.av-category').forEach(function(btn) {
            btn.onclick = function() { switchCategory(btn.dataset.category); };
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        I18N.onReady(function() {
            setupControls();
            AV._updateStepButtons();
            I18N.applyToDOM();
            var saved = readHash();
            if (saved) {
                var cat = getCategoryForAlgorithm(saved.algorithm);
                if (cat !== activeCategory) {
                    activeCategory = cat;
                    document.querySelectorAll('.av-category').forEach(function(btn) {
                        var isCurrent = btn.dataset.category === cat;
                        btn.classList.toggle('active', isCurrent);
                        btn.setAttribute('aria-selected', isCurrent);
                    });
                    switchCategory(cat);
                }
                switchAlgorithm(saved.algorithm, saved.mode);
            } else {
                switchAlgorithm('bubble-sort');
            }
        });
    });

    window.addEventListener('hashchange', function() {
        var saved = readHash();
        if (saved && (saved.algorithm !== AV.state.algorithm || saved.mode !== AV.state.mode)) {
            var cat = getCategoryForAlgorithm(saved.algorithm);
            if (cat !== activeCategory) {
                activeCategory = cat;
                switchCategory(cat);
            }
            switchAlgorithm(saved.algorithm, saved.mode);
        }
    });

    /* ===== i18n Refresh ===== */
    window.AV_refresh = function() {
        var algorithmId = AV.state.algorithm;
        var modeId = AV.state.mode;
        var config = algorithmConfigs[algorithmId];
        if (!config) return;
        var modeConfig = config.modes.find(function(m) { return m.id === modeId; });

        /* 1. Description */
        var descText = modeConfig ? I18N.t(algorithmId + '.modes.' + modeId + '.desc', null, modeConfig.desc) : '';
        document.getElementById('av-desc').textContent = descText;

        /* 2. Principles & Key Concepts */
        updateAlgorithmDetails(algorithmId, modeId);

        /* 3. Complexity & Properties */
        if (config.depRules) {
            AV.showComplexity(config.depRules, algorithmId + '.depRules');
        }

        /* 4. Mode tabs */
        renderModeTabs(algorithmId);
        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        /* 5. Legend */
        updateLegend(algorithmId);

        /* 6. Graph/Tree stat labels */
        if (AV.state._isTreeAlgorithm) {
            AV._setTreeStatLabels();
        } else if (AV.state._graphData) {
            AV._setGraphStatLabels();
        }

        /* 6b. Queue panel label */
        var queuePanel = document.querySelector('.av-queue-panel');
        if (queuePanel) {
            var qLabel = queuePanel.querySelector('.av-queue-label');
            if (qLabel) qLabel.textContent = I18N.t('av.queue.label', null, 'Queue:');
            var qEmpty = queuePanel.querySelector('.av-queue-empty');
            if (qEmpty) qEmpty.textContent = I18N.t('av.queue.empty', null, 'empty');
        }

        /* 7. Target banner label (search algorithms) */
        var targetLabel = document.querySelector('.av-target-banner [data-i18n]');
        if (targetLabel) {
            targetLabel.textContent = I18N.t('av.target_label_prefix', null, 'Target:');
        }

        /* Speed label */
        var sr = document.getElementById('speed-range');
        if (sr) {
            var v = parseInt(sr.value);
            if (v <= 300) sr.title = I18N.t('ui.speed.slow', null, 'Slow');
            else if (v <= 700) sr.title = I18N.t('ui.speed.normal', null, 'Normal');
            else if (v <= 1000) sr.title = I18N.t('ui.speed.fast', null, 'Fast');
            else sr.title = I18N.t('ui.speed.ultra', null, 'Ultra');
        }
        AV._updateStepButtons();
    };

    /* ===== Sticky Global Controls ===== */
    document.addEventListener('DOMContentLoaded', function() {
        var controls = document.getElementById('global-controls');
        var placeholder = document.getElementById('controls-placeholder');
        if (!controls || !placeholder) return;

        var marginBottom = 10;

        function onScroll() {
            if (controls.classList.contains('is-fixed')) {
                var phRect = placeholder.getBoundingClientRect();
                if (phRect.top >= 0) {
                    controls.classList.remove('is-fixed');
                    placeholder.classList.remove('is-active');
                    placeholder.style.height = '0';
                }
            } else {
                var rect = controls.getBoundingClientRect();
                if (rect.top <= 0) {
                    placeholder.style.height = (controls.offsetHeight + marginBottom) + 'px';
                    placeholder.classList.add('is-active');
                    controls.classList.add('is-fixed');
                }
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    });
})();
