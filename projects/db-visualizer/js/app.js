/* ===== Main App: DB Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    const dbConfigs = {
        mysql: {
            name: 'MySQL',
            modes: DBIV.mysql.modes,
            initMode: function(modeId) {
                const map = {
                    'btree': DBIV.mysql.btree,
                    'hash': DBIV.mysql.hash,
                    'composite': DBIV.mysql.composite,
                    'fulltext': DBIV.mysql.fulltext,
                    'explain': DBIV.mysql.explain,
                };
                if (map[modeId]) map[modeId].init();
            }
        },
        postgresql: {
            name: 'PostgreSQL',
            modes: DBIV.postgresql.modes,
            initMode: function(modeId) {
                const map = {
                    'btree': DBIV.postgresql.btree,
                    'hash': DBIV.postgresql.hash,
                    'gin': DBIV.postgresql.gin,
                    'gist': DBIV.postgresql.gist,
                    'brin': DBIV.postgresql.brin,
                };
                if (map[modeId]) map[modeId].init();
            }
        },
        mongodb: {
            name: 'MongoDB',
            modes: DBIV.mongodb.modes,
            initMode: function(modeId) {
                const map = {
                    'single': DBIV.mongodb.single,
                    'compound': DBIV.mongodb.compound,
                    'multikey': DBIV.mongodb.multikey,
                    'text': DBIV.mongodb.text,
                };
                if (map[modeId]) map[modeId].init();
            }
        },
        redis: {
            name: 'Redis',
            modes: DBIV.redis.modes,
            initMode: function(modeId) {
                const map = {
                    'zset': DBIV.redis.zset,
                    'hash-index': DBIV.redis.hashIndex,
                    'secondary': DBIV.redis.secondary,
                };
                if (map[modeId]) map[modeId].init();
            }
        }
    };

    function updateHash(dbId, modeId) {
        history.replaceState(null, '', '#' + dbId + '/' + modeId);
    }

    function readHash() {
        const hash = location.hash.replace('#', '');
        if (!hash) return null;
        const parts = hash.split('/');
        if (parts.length === 2 && dbConfigs[parts[0]]) {
            const config = dbConfigs[parts[0]];
            if (config.modes.some(m => m.id === parts[1])) {
                return { db: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    function switchDb(dbId, modeId) {
        DBIV.state.db = dbId;
        DBIV.setAccentColors(dbId);

        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.db === dbId);
            tab.setAttribute('aria-selected', tab.dataset.db === dbId);
        });

        const config = dbConfigs[dbId];
        document.getElementById('index-name').textContent = config.name;
        DBIV.setIndexStatus('ready');

        DBIV.clearAnimations();
        DBIV.clearLog();
        DBIV.resetStats();
        DBIV.hideComparison();

        renderModeTabs(dbId);
        document.getElementById('pattern-desc').textContent = I18N.t('db.pattern.placeholder', null, 'Select a mode to explore this index.');
        switchMode(dbId, modeId || config.modes[0].id);
    }

    function renderModeTabs(dbId) {
        const config = dbConfigs[dbId];
        const tabsEl = document.getElementById('mode-tabs');
        tabsEl.innerHTML = config.modes.map(m =>
            `<button class="mode-tab" data-mode="${m.id}" role="tab">${I18N.t(dbId + '.modes.' + m.id + '.label', null, m.label)}</button>`
        ).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(tab => {
            tab.onclick = () => switchMode(dbId, tab.dataset.mode);
        });
    }

    function updatePatternDetails(dbId, modeId) {
        var container = document.getElementById('pattern-details');
        var body = document.getElementById('pattern-details-body');
        var toggle = document.getElementById('pattern-details-toggle');
        if (!container || !body || !toggle) return;

        var dbObj = DBIV[dbId];
        var details = dbObj && dbObj.details && dbObj.details[modeId];
        if (!details) {
            container.style.display = 'none';
            body.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        var prefix = dbId + '.modes.' + modeId;
        var html = '';
        if (details.principles) {
            var principles = I18N.ta(prefix + '.principles', details.principles);
            html += '<div class="pattern-details-section">' +
                '<div class="pattern-details-section-title">' + I18N.t('ui.details.principles', null, 'Principles') + '</div>' +
                '<ul class="pattern-details-list">' +
                principles.map(function(p) { return '<li>' + p + '</li>'; }).join('') +
                '</ul></div>';
        }
        if (details.concepts) {
            var concepts = I18N.to(prefix + '.concepts', details.concepts);
            html += '<div class="pattern-details-section">' +
                '<div class="pattern-details-section-title">' + I18N.t('ui.details.concepts', null, 'Key Concepts') + '</div>' +
                '<div class="pattern-concepts-grid">' +
                concepts.map(function(c) {
                    var termText = DBIV.translateConceptTerm(c.term);
                    return '<div class="pattern-concept">' +
                        '<span class="pattern-concept-term">' + termText + '</span>' +
                        '<span class="pattern-concept-def">' + c.definition + '</span>' +
                        '</div>';
                }).join('') +
                '</div></div>';
        }

        body.innerHTML = html;
        body.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
        container.style.display = 'block';
    }

    function switchMode(dbId, modeId) {
        DBIV.state.mode = modeId;
        DBIV.state.simulateError = false;
        updateHash(dbId, modeId);
        const config = dbConfigs[dbId];
        const modeConfig = config.modes.find(m => m.id === modeId);

        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        document.getElementById('pattern-desc').textContent = modeConfig ? I18N.t(dbId + '.modes.' + modeId + '.desc', null, modeConfig.desc) : '';
        updatePatternDetails(dbId, modeId);

        DBIV.clearAnimations();
        DBIV.resetStats();
        DBIV.clearLog();
        DBIV.hideComparison();

        document.getElementById('viz-area').classList.remove('viz-area--2col', 'viz-area--2col-top');
        config.initMode(modeId);
    }

    function getCurrentMode() {
        const dbId = DBIV.state.db;
        const modeId = DBIV.state.mode;
        const config = dbConfigs[dbId];
        if (!config) return null;

        const modeMap = {
            mysql: { btree: DBIV.mysql.btree, hash: DBIV.mysql.hash, composite: DBIV.mysql.composite, fulltext: DBIV.mysql.fulltext, explain: DBIV.mysql.explain },
            postgresql: { btree: DBIV.postgresql.btree, hash: DBIV.postgresql.hash, gin: DBIV.postgresql.gin, gist: DBIV.postgresql.gist, brin: DBIV.postgresql.brin },
            mongodb: { single: DBIV.mongodb.single, compound: DBIV.mongodb.compound, multikey: DBIV.mongodb.multikey, text: DBIV.mongodb.text },
            redis: { zset: DBIV.redis.zset, 'hash-index': DBIV.redis.hashIndex, secondary: DBIV.redis.secondary },
        };

        return modeMap[dbId] && modeMap[dbId][modeId] ? modeMap[dbId][modeId] : null;
    }

    function setupControls() {
        // Run Query
        document.getElementById('btn-run').onclick = () => {
            const mode = getCurrentMode();
            if (mode && mode.run) mode.run();
        };

        // Burst
        document.getElementById('btn-burst').onclick = () => {
            const mode = getCurrentMode();
            if (mode && mode.run) {
                (async () => {
                    for (let i = 0; i < 5; i++) {
                        await mode.run();
                        await DBIV.sleep(200);
                    }
                })();
            }
        };

        // Index Miss
        document.getElementById('btn-miss').onclick = () => {
            DBIV.state.simulateError = true;
            DBIV.log('MISS', I18N.t('db.log.miss.next_query', null, 'Next query will bypass index (full table scan)'));
            DBIV.setIndexStatus('miss');
            setTimeout(() => DBIV.setIndexStatus('ready'), 2000);
        };

        // Reset
        document.getElementById('btn-reset').onclick = () => {
            switchDb(DBIV.state.db);
            DBIV.log('QUERY', I18N.t('ui.log.reset', null, 'State reset'));
        };

        // Copy / Clear Log
        document.getElementById('btn-copy-log').onclick = () => DBIV.copyLog();
        document.getElementById('btn-clear-log').onclick = () => DBIV.clearLog();

        // Compare toggle
        document.getElementById('toggle-compare').onchange = (e) => {
            DBIV.state.comparisonMode = e.target.checked;
            if (!e.target.checked) DBIV.hideComparison();
        };

        // Pattern details toggle
        var detailsToggle = document.getElementById('pattern-details-toggle');
        if (detailsToggle) {
            detailsToggle.onclick = function() {
                var body = document.getElementById('pattern-details-body');
                var expanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !expanded);
                body.classList.toggle('expanded');
            };
        }

        // DB tabs
        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.onclick = () => switchDb(tab.dataset.db);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        I18N.onReady(function() {
            setupControls();
            I18N.applyToDOM();
            const saved = readHash();
            if (saved) {
                switchDb(saved.db, saved.mode);
            } else {
                switchDb('mysql');
            }
        });
    });

    window.DBIV_refresh = function() { switchDb(DBIV.state.db, DBIV.state.mode); };

    window.addEventListener('hashchange', () => {
        const saved = readHash();
        if (saved && (saved.db !== DBIV.state.db || saved.mode !== DBIV.state.mode)) {
            switchDb(saved.db, saved.mode);
        }
    });

    /* ===== Sticky Global Controls (fixed on scroll) ===== */
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
